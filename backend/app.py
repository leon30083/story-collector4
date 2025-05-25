from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import os
from dotenv import load_dotenv
import requests
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import json
import re
import logging

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
    category_id = Column(Integer, ForeignKey('categories.id'))
    category = relationship("Category")
    source = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# 新增 Category 数据模型
class Category(Base):
    __tablename__ = 'categories'

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# 创建数据库表
Base.metadata.create_all(engine)

def process_csv_data(df):
    """处理CSV数据并保存到数据库，查重，支持中文表头自动映射"""
    # 字段映射
    col_map = {
        '名称': 'title',
        '故事分类': 'category',
        '简介': 'content',
        'title': 'title',
        'category': 'category',
        'content': 'content',
        'source': 'source'
    }
    # 重命名DataFrame列
    df = df.rename(columns={k: v for k, v in col_map.items() if k in df.columns})
    session = Session()
    duplicate_count = 0
    success_count = 0
    try:
        for _, row in df.iterrows():
            title = row.get('title', '')
            content = row.get('content', '')
            category = row.get('category', '')
            source = row.get('source', '')
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
                category_id=category,
                source=source
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
    try:
        df = pd.read_csv(file)
        success_count, duplicate_count = process_csv_data(df)
        return jsonify({'message': '文件上传完成', 'success_count': success_count, 'duplicate_count': duplicate_count})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stories', methods=['GET'])
def get_stories():
    """获取故事列表"""
    session = Session()
    try:
        category = request.args.get('category')
        query = session.query(Story)
        if category:
            query = query.filter(Story.category_id == category)
        stories = query.all()
        return jsonify([{
            'id': story.id,
            'title': story.title,
            'category': story.category.name,
            'source': story.source,
            'content': story.content,
            'created_at': story.created_at.isoformat()
        } for story in stories])
    finally:
        session.close()

@app.route('/api/collect', methods=['POST'])
def collect_stories():
    data = request.json
    
    # 添加日志，打印接收到的原始请求数据
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

    # 确保 max_tokens 至少为 8192，以允许生成更多故事
    max_tokens = max(max_tokens, 8192)

    # 优先从请求JSON中获取分类字段
    category = data.get('category')

    # 如果请求JSON中没有获取到分类，则尝试从messages内容中解析（作为备用）
    if not category:
        logger.warning("请求JSON中未找到分类字段，尝试从messages中解析")
        for msg in messages:
            if msg.get('role') == 'user' and 'category' in msg.get('content', ''):
                # 注意：这里的解析逻辑可能不准确，强烈建议前端直接传递category字段
                match = re.search(r'category[\s]*[:：]?[\s]*(.+)', msg.get('content', ''))
                if match:
                    category = match.group(1).strip()
                # 简单的匹配末尾的分类名，如果文本是"收集5个安徒生童话童话故事"
                elif msg.get('content', '').endswith('故事') and len(msg.get('content', '').split()[-1]) > 2:
                    category = msg.get('content', '').split()[-1]
                
                if category:
                    logger.info(f"从messages中解析到分类: {category}")
                    break # 解析到就停止

    if not category:
        logger.error("未指定故事分类")
        return jsonify({'error': '未指定故事分类'}), 400

    logger.info(f"开始收集故事 - 目标数量: {target_count}, 分类: {category}")
    
    if not api_key or not model or not messages:
        return jsonify({'error': 'API Key、模型名称和对话内容不能为空'}), 400
    
    try:
        def extract_json_array(text):
            try:
                arr = json.loads(text)
                if isinstance(arr, list):
                    return arr
            except Exception:
                pass
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
        saved = [] # 添加 saved 列表用于记录保存成功的故事标题
        max_attempts = 3
        attempt = 0

        # 在循环外部获取数据库中当前分类下已有的标题
        existing_titles = [s.title for s in session.query(Story).filter(Story.category_id == category).all()]
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
                break # 只取第一个用户指令

        while len(collected) < target_count and attempt < max_attempts:
            need = target_count - len(collected)
            logger.info(f"第 {attempt + 1} 次尝试 - 还需收集 {need} 个故事")
            
            # 构建发送给AI的messages (在循环内部动态替换{N}和{titles})
            prompt_msgs = []
            
            # 替换Prompt模板中的占位符
            prompt_content = prompt_template.replace('{N}', str(need))
            prompt_content = prompt_content.replace('{titles}', titles_str)

            prompt_msgs.append({'role': 'system', 'content': prompt_content})

            # 添加用户指令
            if user_message_content:
                 prompt_msgs.append({'role': 'user', 'content': user_message_content})
                 logger.info(f"用户指令: {user_message_content}")

            # 直接调用AI生成故事
            logger.info(f"发送API请求生成故事，最终构建的Prompt:\n{prompt_content}")

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
            content = result['choices'][0]['message'].get('content', '')
            logger.info(f"AI响应内容: {content}")
            
            if test_mode:
                session.close()
                return jsonify({'message': '测试模式', 'content': content})
            
            stories = extract_json_array(content)
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
                    Story.category_id == category,
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
                    category_id=category,  # 使用当前收集的分类
                    source='silicon_flow'
                )
                session.add(s)
                saved.append(title)
                collected.append(story)
                tried_titles.add(title)
            
            attempt += 1
        
        session.commit()
        session.close()
        logger.info(f"收集完成 - 成功: {len(saved)}, 重复: {len(duplicate)}")
        
        if len(collected) < target_count:
            return jsonify({
                'message': f'有效收集数量不足，仅收集到{len(collected)}个故事',
                'saved': saved,
                'duplicate': duplicate,
                'stories': collected
            }), 200
        
        return jsonify({
            'message': '故事采集并保存成功',
            'saved': saved,
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
        story.category_id = data.get('category', story.category_id)
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
    """获取所有故事分类列表"""
    session = Session()
    try:
        categories = session.query(Category).all()
        return jsonify([{'id': cat.id, 'name': cat.name} for cat in categories])
    finally:
        session.close()

@app.route('/api/categories', methods=['POST'])
def add_category():
    """添加新的故事分类"""
    data = request.json
    name = data.get('name')
    if not name or not str(name).strip():
        return jsonify({'error': '分类名称不能为空'}), 400

    session = Session()
    try:
        # 检查分类是否已存在
        existing_category = session.query(Category).filter(Category.name == name).first()
        if existing_category:
            return jsonify({'error': f'分类 "{name}" 已存在'}), 409 # 409 Conflict

        new_category = Category(name=name)
        session.add(new_category)
        session.commit()
        return jsonify({'message': '分类添加成功', 'category': {'id': new_category.id, 'name': new_category.name}}), 201 # 201 Created
    except Exception as e:
        session.rollback()
        logger.error(f"添加分类失败: {str(e)}")
        return jsonify({'error': '添加分类失败', 'details': str(e)}), 500
    finally:
        session.close()

@app.route('/api/categories/<int:category_id>', methods=['PUT'])
def update_category(category_id):
    """更新故事分类名称"""
    data = request.json
    new_name = data.get('name')
    if not new_name or not str(new_name).strip():
        return jsonify({'error': '分类名称不能为空'}), 400

    session = Session()
    try:
        category = session.query(Category).get(category_id)
        if not category:
            return jsonify({'error': '未找到该分类'}), 404

        # 检查新名称是否已存在（排除当前分类本身）
        existing_category = session.query(Category).filter(Category.name == new_name, Category.id != category_id).first()
        if existing_category:
             return jsonify({'error': f'分类 "{new_name}" 已存在'}), 409 # 409 Conflict

        category.name = new_name
        session.commit()
        return jsonify({'message': '分类更新成功', 'category': {'id': category.id, 'name': category.name}})
    except Exception as e:
        session.rollback()
        logger.error(f"更新分类失败: {str(e)}")
        return jsonify({'error': '更新分类失败', 'details': str(e)}), 500
    finally:
        session.close()

@app.route('/api/categories/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    """删除故事分类"""
    session = Session()
    try:
        category = session.query(Category).get(category_id)
        if not category:
            return jsonify({'error': '未找到该分类'}), 404

        # 检查是否有故事关联到该分类
        # SQLAlchemy 外键默认是 RESTRICT，有关联的故事时会报错，这里先简单检查
        # 如果需要级联删除或设置为 null，需要修改模型定义和数据库约束
        related_stories_count = session.query(Story).filter(Story.category_id == category_id).count()
        if related_stories_count > 0:
             return jsonify({'error': f'该分类下有 {related_stories_count} 个故事，无法删除'}), 409 # 409 Conflict


        session.delete(category)
        session.commit()
        return jsonify({'message': '分类删除成功'})
    except Exception as e:
        session.rollback()
        logger.error(f"删除分类失败: {str(e)}")
        return jsonify({'error': '删除分类失败', 'details': str(e)}), 500
    finally:
        session.close()

if __name__ == '__main__':
    app.run(debug=True) 