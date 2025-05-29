import os
import json
from flask import Flask
from models import db, Style, Prompt

# 配置数据库路径
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
db_path = os.path.join(BASE_DIR, 'data', 'stories.db')

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# 读取风格JSON
STYLE_JSON_PATH = os.path.join(BASE_DIR, 'text', 'ai_picturebook_styles.json')
# 读取提示词文件
PROMPT_FILES = [
    (os.path.join(BASE_DIR, 'text', 'gpts-prompt.md'), '风格与GPT提示'),
    (os.path.join(BASE_DIR, 'text', '经典改编.md'), '经典改编指导'),
    (os.path.join(BASE_DIR, 'text', '需求补充.md'), '需求补充说明'),
]

def fill_styles():
    if not os.path.exists(STYLE_JSON_PATH):
        print(f'未找到风格库文件: {STYLE_JSON_PATH}')
        return
    with open(STYLE_JSON_PATH, 'r', encoding='utf-8') as f:
        styles_data = json.load(f)
    for style_id, style_info in styles_data.items():
        if not Style.query.filter_by(name=style_info['name']).first():
            db.session.add(Style(
                name=style_info['name'],
                desc=style_info.get('style', ''),
                image=''  # 如有图片可补充
            ))
    db.session.commit()
    print('风格模板已填充')

def fill_prompts():
    for path, prompt_type in PROMPT_FILES:
        if not os.path.exists(path):
            print(f'未找到提示词文件: {path}')
            continue
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        if not Prompt.query.filter_by(name=prompt_type).first():
            db.session.add(Prompt(
                type=prompt_type,
                name=prompt_type,
                content=content
            ))
    db.session.commit()
    print('提示词模板已填充')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print('数据库表结构已修复')
        fill_styles()
        fill_prompts()
        print('数据库修复与基础数据填充完成！') 