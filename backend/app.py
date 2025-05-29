from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import pandas as pd
import os
from dotenv import load_dotenv
import requests
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import json
import re
import logging
from io import BytesIO
from openai import OpenAI

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# 加载环境变量
load_dotenv()
print('API KEY:', os.getenv('SILICON_API_KEY'))

app = Flask(__name__)
CORS(app)

# 数据库配置
Base = declarative_base()
engine = create_engine('sqlite:///stories.db')
Session = sessionmaker(bind=engine)

# 定义数据模型
class Story(Base):
    __tablename__ = 'stories'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(200))
    content = Column(Text)
    category = Column(String(50))
    source = Column(String(100))
    batch = Column(String(50))  # 新增批次字段
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Category(Base):
    __tablename__ = 'categories'
    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)

# 创建数据库表
Base.metadata.create_all(engine)

# 启动时自动将stories表中已有分类去重插入Category表
with Session() as session:
    existing_categories = set([c.name for c in session.query(Category).all()])
    story_categories = set([c[0] for c in session.query(Story.category).distinct() if c[0]])
    for cat in story_categories:
        if cat not in existing_categories:
            session.add(Category(name=cat))
    session.commit()

def process_csv_data(df, batch=None):
    """处理CSV数据并保存到数据库，查重，支持中文表头自动映射，支持批次，自动同步新分类，空分类归为未分类"""
    # 字段映射
    col_map = {
        '名称': 'title',
        '故事分类': 'category',
        '简介': 'content',
        'title': 'title',
        'category': 'category',
        'content': 'content',
        'source': 'source',
        'batch': 'batch'
    }
    # 重命名DataFrame列
    df = df.rename(columns={k: v for k, v in col_map.items() if k in df.columns})
    session = Session()
    duplicate_count = 0
    success_count = 0
    if not batch:
        batch = datetime.now().strftime('import_%Y%m%d%H%M%S')
    # 确保有"未分类"
    if not session.query(Category).filter_by(name='未分类').first():
        session.add(Category(name='未分类'))
        session.commit()
    try:
        for _, row in df.iterrows():
            title = row.get('title', '')
            content = row.get('content', '')
            category = row.get('category', '')
            # 兼容NaN、None、空字符串
            if pd.isna(category) or not str(category).strip():
                category = '未分类'
            source = row.get('source', '')
            row_batch = row.get('batch', batch)
            # 自动同步新分类
            if category:
                cat_obj = session.query(Category).filter_by(name=category).first()
                if not cat_obj:
                    session.add(Category(name=category))
                    session.commit()
            # 查重：标题或内容重复则跳过
            exists = session.query(Story).filter(
                (Story.title == title) | (Story.content == content)
            ).first()
            if exists:
                duplicate_count += 1
                continue
            story = Story(
                title=title,
                content=content,
                category=category,
                source=source,
                batch=row_batch
            )
            session.add(story)
            success_count += 1
        session.commit()
        return success_count, duplicate_count
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()

@app.route('/api/upload', methods=['POST'])
def upload_csv():
    if 'file' not in request.files:
        return jsonify({'error': '没有文件上传'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
    if not file.filename.endswith('.csv'):
        return jsonify({'error': '只支持CSV文件'}), 400
    batch = request.form.get('batch')
    try:
        df = pd.read_csv(file)
        success_count, duplicate_count = process_csv_data(df, batch=batch)
        return jsonify({'message': '文件上传完成', 'success_count': success_count, 'duplicate_count': duplicate_count, 'batch': batch})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stories', methods=['GET'])
def get_stories():
    """获取故事列表，支持按分类和批次筛选"""
    session = Session()
    try:
        category = request.args.get('category')
        batch = request.args.get('batch')
        query = session.query(Story)
        if category:
            query = query.filter(Story.category == category)
        if batch:
            query = query.filter(Story.batch == batch)
        stories = query.all()
        return jsonify([{
            'id': story.id,
            'title': story.title,
            'category': story.category,
            'source': story.source,
            'content': story.content,
            'batch': story.batch,
            'created_at': story.created_at.isoformat() if story.created_at else None
        } for story in stories])
    finally:
        session.close()

@app.route('/api/collect', methods=['POST'])
def collect_stories():
    data = request.json
    logger.info(f"收到采集请求数据: {json.dumps(data, ensure_ascii=False)}")

    api_key = data.get('api_key')
    if not api_key or not str(api_key).strip():
        api_key = os.getenv('SILICON_API_KEY')
    model = data.get('model')
    messages = data.get('messages')
    max_tokens = int(data.get('max_tokens', 4096))
    temperature = data.get('temperature', 0.7)
    top_p = data.get('top_p', 0.7)
    test_mode = data.get('test', False)
    target_count = int(data.get('count', 1))
    # 限制最大采集数量为100
    target_count = min(target_count, 100)
    # 确保 max_tokens 至少为 8192，以允许生成更多故事
    max_tokens = max(max_tokens, 8192)

    # 优先从请求JSON中获取分类字段
    category = data.get('category')
    if not category or str(category).strip() == '':
        category = '未分类'

    # 如果请求JSON中没有获取到分类，则尝试从messages内容中解析（作为备用）
    if not category:
        logger.warning("请求JSON中未找到分类字段，尝试从messages中解析")
        for msg in messages:
            if msg.get('role') == 'user' and 'category' in msg.get('content', ''):
                match = re.search(r'category[\s]*[:：]?[\s]*(.+)', msg.get('content', ''))
                if match:
                    category = match.group(1).strip()
                elif msg.get('content', '').endswith('故事') and len(msg.get('content', '').split()[-1]) > 2:
                    category = msg.get('content', '').split()[-1]
                if category:
                    logger.info(f"从messages中解析到分类: {category}")
                    break
    if not category:
        logger.error("未指定故事分类")
        return jsonify({'error': '未指定故事分类'}), 400

    logger.info(f"开始收集故事 - 目标数量: {target_count}, 分类: {category}")
    if not api_key or not model or not messages:
        return jsonify({'error': 'API Key、模型名称和对话内容不能为空'}), 400
    
    try:
        def extract_json_array(text):
            # 去除代码块标记
            text = re.sub(r'```json|```', '', text)
            try:
                arr = json.loads(text)
                if isinstance(arr, list):
                    return arr
            except Exception:
                pass
            # 放宽：尝试提取第一个中括号包裹的内容
            match = re.search(r'(\[.*\])', text, re.DOTALL)
            if match:
                try:
                    arr = json.loads(match.group(1))
                    if isinstance(arr, list):
                        return arr
                except Exception:
                    pass
            return None
        
        session = Session()
        collected = []
        tried_titles = set()
        duplicate = []
        max_attempts = 3
        attempt = 0

        # 在循环外部获取数据库中当前分类下已有的标题
        existing_titles = [s.title for s in session.query(Story).filter(Story.category == category).all()]
        logger.info(f"数据库中{category}分类下已有故事: {existing_titles}")

        titles_str = ''
        if existing_titles:
            titles_str = '，'.join(existing_titles)

        # 在循环外部读取Prompt模板文件
        try:
            with open('../optimized_story_collect_prompt.md', encoding='utf-8') as f:
                prompt_template = f.read()
            logger.info(f"成功读取Prompt模板文件: ../optimized_story_collect_prompt.md，内容前200字符：{prompt_template[:200]}...")
        except FileNotFoundError:
            logger.error("未找到 Prompt 模板文件！请确保 optimized_story_collect_prompt.md 存在于后端目录的上一级（项目根目录）。")
            return jsonify({'error': 'Prompt模板文件丢失，请联系管理员。'}), 500
        except Exception as e:
            logger.error(f"读取Prompt模板文件时发生错误: {str(e)}")
            return jsonify({'error': '读取Prompt模板文件失败。', 'details': str(e)}), 500
        
        # 查找原始messages中的用户指令（在循环外部）
        user_message_content = ''
        for msg in messages:
            if msg.get('role') == 'user':
                user_message_content = msg.get('content', '')
                break

        batch = data.get('batch')
        if not batch:
            batch = datetime.now().strftime('collect_%Y%m%d%H%M%S')

        while len(collected) < target_count and attempt < max_attempts:
            need = target_count - len(collected)
            logger.info(f"第 {attempt + 1} 次尝试 - 还需收集 {need} 个故事")
            
            # 构建发送给AI的messages (在循环内部动态替换{N}、{titles}、{category})
            prompt_msgs = []
            prompt_content = prompt_template.replace('{N}', str(need))
            prompt_content = prompt_content.replace('{titles}', titles_str)
            prompt_content = prompt_content.replace('{category}', category)
            logger.info(f"最终发送给AI的Prompt内容：\n{prompt_content}")
            prompt_msgs.append({'role': 'system', 'content': prompt_content})
            if user_message_content:
                 prompt_msgs.append({'role': 'user', 'content': user_message_content})
                 logger.info(f"用户指令: {user_message_content}")
            logger.info(f"发送API请求参数：model={model}, max_tokens={max_tokens}, temperature={temperature}, top_p={top_p}, category={category}")
            response = requests.post(
                'https://api.siliconflow.cn/v1/chat/completions',
                headers={'Authorization': f'Bearer {api_key}'},
                json={
                    'model': model,
                    'messages': prompt_msgs,
                    'max_tokens': max_tokens,
                    'temperature': temperature,
                    'top_p': top_p
                }
            )
            response.raise_for_status()
            result = response.json()
            logger.info(f"AI原始响应: {json.dumps(result, ensure_ascii=False)}")
            content = result['choices'][0]['message'].get('content', '')
            logger.info(f"AI响应内容: {content}")
            
            if test_mode:
                session.close()
                return jsonify({'message': '测试模式', 'content': content})
            
            stories = extract_json_array(content)
            if stories is not None and isinstance(stories, list) and len(stories) == 0:
                logger.warning("AI返回空数组，未采集到新故事")
                session.close()
                return jsonify({'message': '未采集到符合要求的故事', 'stories': []}), 200
            if not stories:
                logger.warning(f"AI返回内容不是有效的JSON数组: {content}")
                session.close()
                return jsonify({'error': 'AI返回内容不是有效的JSON数组', 'content': content}), 200
            
            logger.info(f"解析到 {len(stories)} 个故事")
            
            # 处理每个故事
            for story in stories:
                title = story.get('title', '')
                summary = story.get('summary', '')
                story_category = story.get('category', '')
                
                # 确保故事分类与当前收集的分类一致
                if story_category != category:
                    logger.warning(f"故事分类不匹配: {title} (分类: {story_category}, 期望: {category})")
                    continue
                
                if not title or not summary:
                    logger.warning(f"故事缺少必要字段: {json.dumps(story, ensure_ascii=False)}")
                    continue
                
                # 查重：本次和数据库（只检查当前分类）
                if title in tried_titles or title in existing_titles:
                    logger.info(f"发现重复标题: {title}")
                    duplicate.append(title)
                    continue
                
                exists = session.query(Story).filter(
                    Story.category == category,
                    (Story.title == title) | (Story.content == summary)
                ).first()
                if exists:
                    logger.info(f"数据库中已存在相同故事: {title}")
                    duplicate.append(title)
                    continue
                
                logger.info(f"保存新故事: {title}")
                s = Story(
                    title=title or '无标题',
                    content=summary or '无简介',
                    category=category,  # 使用当前收集的分类
                    source='silicon_flow',
                    batch=batch
                )
                session.add(s)
                session.commit()
                saved_story = session.query(Story).filter(Story.title == title).first()
                if saved_story:
                    collected.append({
                        'id': saved_story.id,
                        'title': saved_story.title,
                        'category': saved_story.category,
                        'content': saved_story.content,
                        'source': saved_story.source,
                        'batch': saved_story.batch,
                        'created_at': saved_story.created_at.isoformat() if saved_story.created_at else ''
                    })
                    # 更新已有标题列表
                    existing_titles.append(title)
                tried_titles.add(title)
            
            attempt += 1
        
        session.close()
        logger.info(f"收集完成 - 成功: {len(collected)}, 重复: {len(duplicate)}")
        
        if len(collected) < target_count:
            return jsonify({
                'message': f'有效收集数量不足，仅收集到{len(collected)}个故事',
                'saved': [s['title'] for s in collected],
                'duplicate': duplicate,
                'stories': collected
            }), 200
        
        return jsonify({
            'message': '故事采集并保存成功',
            'saved': [s['title'] for s in collected],
            'duplicate': duplicate,
            'stories': collected
        }), 200
        
    except requests.exceptions.RequestException as e:
        logger.error(f"API调用失败: {str(e)}")
        # 打印详细响应内容
        if hasattr(e, 'response') and e.response is not None:
            try:
                err_json = e.response.json()
                logger.error(f"API错误详情: {json.dumps(err_json, ensure_ascii=False)}")
                return jsonify({'error': f'API调用失败: {str(e)}', 'api_message': err_json.get('message', ''), 'api_code': err_json.get('code', ''), 'api_raw': err_json}), 500
            except Exception:
                logger.error(f"API原始响应: {e.response.text}")
                return jsonify({'error': f'API调用失败: {str(e)}', 'api_raw': e.response.text}), 500
        return jsonify({'error': f'API调用失败: {str(e)}'}), 500
    except Exception as e:
        logger.error(f"发生错误: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if 'session' in locals():
            session.close()

@app.route('/api/settings', methods=['POST'])
def update_settings():
    data = request.json
    api_key = data.get('api_key')
    
    if not api_key:
        return jsonify({'error': 'API密钥不能为空'}), 400
    
    # 更新环境变量
    with open('.env', 'w') as f:
        f.write(f'SILICON_API_KEY={api_key}\n')
    
    return jsonify({'message': '设置已更新'})

@app.route('/api/models', methods=['POST'])
def get_models():
    data = request.json
    api_key = data.get('api_key')
    if not api_key or not str(api_key).strip():
        api_key = os.getenv('SILICON_API_KEY')
    if not api_key:
        return jsonify({'error': 'API密钥未配置'}), 400
    try:
        response = requests.get(
            'https://api.siliconflow.cn/v1/models',
            headers={'Authorization': f'Bearer {api_key}'}
        )
        response.raise_for_status()
        result = response.json()
        return jsonify(result)
    except requests.exceptions.RequestException as e:
        # 打印详细响应内容
        if hasattr(e, 'response') and e.response is not None:
            try:
                err_json = e.response.json()
                return jsonify({'error': f'API调用失败: {str(e)}', 'api_message': err_json.get('message', ''), 'api_code': err_json.get('code', ''), 'api_raw': err_json}), 500
            except Exception:
                return jsonify({'error': f'API调用失败: {str(e)}', 'api_raw': e.response.text}), 500
        return jsonify({'error': f'API调用失败: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/story/<int:story_id>', methods=['PUT'])
def edit_story(story_id):
    session = Session()
    try:
        story = session.query(Story).get(story_id)
        if not story:
            return jsonify({'error': '未找到该故事'}), 404
        data = request.json
        story.title = data.get('title', story.title)
        story.category = data.get('category', story.category)
        story.content = data.get('content', story.content)
        story.source = data.get('source', story.source)
        session.commit()
        return jsonify({'message': '故事编辑成功'})
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@app.route('/api/story/<int:story_id>', methods=['DELETE'])
def delete_story(story_id):
    session = Session()
    try:
        story = session.query(Story).get(story_id)
        if not story:
            return jsonify({'error': '未找到该故事'}), 404
        session.delete(story)
        session.commit()
        return jsonify({'message': '故事删除成功'})
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@app.route('/api/categories', methods=['GET'])
def get_categories():
    session = Session()
    try:
        categories = session.query(Category).all()
        return jsonify([{'id': c.id, 'name': c.name} for c in categories])
    finally:
        session.close()

@app.route('/api/categories', methods=['POST'])
def add_category():
    data = request.json
    name = data.get('name')
    if not name:
        return jsonify({'error': '分类名不能为空'}), 400
    session = Session()
    try:
        if session.query(Category).filter_by(name=name).first():
            return jsonify({'error': '分类已存在'}), 400
        category = Category(name=name)
        session.add(category)
        session.commit()
        return jsonify({'message': '分类添加成功'})
    finally:
        session.close()

@app.route('/api/categories/<int:cat_id>', methods=['PUT'])
def update_category(cat_id):
    data = request.json
    name = data.get('name')
    session = Session()
    try:
        category = session.query(Category).get(cat_id)
        if not category:
            return jsonify({'error': '未找到该分类'}), 404
        # 检查新名字是否重复
        if name and name != category.name and session.query(Category).filter_by(name=name).first():
            return jsonify({'error': '分类名已存在'}), 400
        # 同步更新stories表中所有该分类
        old_name = category.name
        category.name = name
        session.query(Story).filter(Story.category == old_name).update({Story.category: name})
        session.commit()
        return jsonify({'message': '分类更新成功'})
    finally:
        session.close()

@app.route('/api/categories/<int:cat_id>', methods=['DELETE'])
def delete_category(cat_id):
    session = Session()
    try:
        category = session.query(Category).get(cat_id)
        if not category:
            return jsonify({'error': '未找到该分类'}), 404
        # 先删除该分类下所有故事
        session.query(Story).filter_by(category=category.name).delete(synchronize_session=False)
        session.delete(category)
        session.commit()
        return jsonify({'message': '分类及其下所有故事已删除'})
    finally:
        session.close()

@app.route('/api/stories/batch_delete', methods=['POST'])
def batch_delete_stories():
    data = request.json
    ids = data.get('ids', [])
    if not ids:
        return jsonify({'error': '未提供要删除的故事ID列表'}), 400
    session = Session()
    try:
        deleted = session.query(Story).filter(Story.id.in_(ids)).delete(synchronize_session=False)
        session.commit()
        return jsonify({'message': f'已删除{deleted}条故事'})
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@app.route('/api/stories/batch_update_category', methods=['POST'])
def batch_update_category():
    data = request.json
    ids = data.get('ids', [])
    category = data.get('category')
    if not ids or not category:
        return jsonify({'error': '缺少参数'}), 400
    session = Session()
    try:
        updated = session.query(Story).filter(Story.id.in_(ids)).update({Story.category: category}, synchronize_session=False)
        session.commit()
        return jsonify({'message': f'已更新{updated}条故事的分类'})
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@app.route('/api/stories/batch_export', methods=['POST'])
def batch_export_stories():
    data = request.json
    ids = data.get('ids', [])
    if not ids:
        return jsonify({'error': '未提供要导出的故事ID列表'}), 400
    session = Session()
    try:
        stories = session.query(Story).filter(Story.id.in_(ids)).all()
        output = BytesIO()
        # 写表头
        output.write('名称,故事分类,简介,故事内容,出处,批次\n'.encode('utf-8'))
        for s in stories:
            output.write(f'"{s.title}","{s.category}","{s.content}","{s.content}","{s.source}","{s.batch}"\n'.encode('utf-8'))
        output.seek(0)
        return send_file(
            output,
            mimetype='text/csv',
            as_attachment=True,
            download_name='stories_export.csv',
        )
    finally:
        session.close()

@app.route('/api/stories/export_by_batch', methods=['GET'])
def export_by_batch():
    batch = request.args.get('batch')
    if not batch:
        return jsonify({'error': '未指定批次号'}), 400
    session = Session()
    try:
        stories = session.query(Story).filter(Story.batch == batch).all()
        output = BytesIO()
        output.write('名称,故事分类,简介,故事内容,出处,批次\n'.encode('utf-8'))
        for s in stories:
            output.write(f'"{s.title}","{s.category}","{s.content}","{s.content}","{s.source}","{s.batch}"\n'.encode('utf-8'))
        output.seek(0)
        return send_file(
            output,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'stories_batch_{batch}.csv',
        )
    finally:
        session.close()

@app.route('/api/ai/generate', methods=['POST'])
def generate_picturebook():
    data = request.json
    theme = data.get('theme', '')
    style_id = data.get('style_id', '')
    age = data.get('age', '')
    lang = data.get('lang', 'zh')
    words = data.get('words', 600)

    # 读取风格名
    style_name = '未知风格'
    try:
        with open('text/ai_picturebook_styles.json', encoding='utf-8') as f:
            styles = json.load(f)
        if style_id and style_id in styles:
            style_name = styles[style_id]['name']
    except Exception:
        pass

    # 判断是否为经典改编
    classic_keywords = ['嫦娥奔月', '女娲补天', '愚公移山', '牛郎织女', '后羿射日', '精卫填海', '孟姜女']
    is_classic = any(kw in theme for kw in classic_keywords)

    prompt_system = f"""你是一位儿童绘本创作专家，熟练掌握10种语言风格与创作模板（风格编号与模板已上传为JSON）。用户会提供目标年龄段、绘本主题、情绪期望或参考风格编号，你的任务是：

1. 若主题为原创，请根据用户选择的风格编号，自动调用对应风格的语言模板与句式，生成结构化分段绘本，每页为一句旁白。
2. 若主题为中国传统神话、寓言、民间故事等经典内容（如《嫦娥奔月》《女娲补天》《愚公移山》等），请严格遵循以下改编流程：
   - 保留原作标题，不得重命名
   - 拆分经典情节节点（参考经典改编手册），每页为一个情节节点
   - 结合目标年龄段，调整为简洁易懂的语言
   - 选择与题材最适配的风格（如沉静幻想型用于神话，寓言结构型用于寓言）
   - 每页生成中英文对照文本与配图建议，结尾强化文化寓意
3. 所有生成结果需适合{age}儿童，语言简洁、画面感强、适合图文同步，朗读节奏清晰。
4. 输出格式必须为如下JSON数组，每个元素为一页：
[
  {{
    "page_no": 1,
    "text_cn": "第一页中文内容",
    "text_en": "Page 1 English content",
    "image_hint": "插图建议",
    "style_id": "{style_id}"
  }},
  ...
]
5. 只输出JSON数组，不要多余解释。
"""

    prompt_user = f'请以"{theme}"为主题，风格编号"{style_id}"，风格名称"{style_name}"，年龄段"{age}"，语言"{lang}"，总字数"{words}"为要求，生成结构化绘本故事。'
    if is_classic:
        prompt_user += ' 该主题为经典神话/寓言/民间故事，请严格遵循经典改编手册的分段与表达规范。'

    client = OpenAI(
        api_key=os.getenv('SILICON_API_KEY'),
        base_url="https://api.siliconflow.cn/v1"
    )
    try:
        response = client.chat.completions.create(
            model="deepseek-ai/DeepSeek-V3",
            messages=[
                {"role": "system", "content": prompt_system},
                {"role": "user", "content": prompt_user}
            ],
            temperature=0.7,
            max_tokens=2048,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        # 解析JSON
        pages = json.loads(content)
        return jsonify({
            "title": theme,
            "style_id": style_id,
            "age": age,
            "lang": lang,
            "words": words,
            "pages": pages
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/text/<path:filename>')
def serve_text(filename):
    import os
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    text_dir = os.path.join(base_dir, 'text')
    return send_from_directory(text_dir, filename)

if __name__ == '__main__':
    app.run(debug=True) 