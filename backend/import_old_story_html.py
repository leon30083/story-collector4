import os
import pandas as pd
from bs4 import BeautifulSoup
from flask import Flask
from models import db, Story, Category
from datetime import datetime

# 配置数据库路径
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
db_path = os.path.join(BASE_DIR, 'data', 'stories.db')
HTML_PATH = os.path.join(BASE_DIR, '绘本任务导出_all.htm')

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

def parse_html_table(html_path):
    with open(html_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f, 'html.parser')
    table = soup.find('table')
    rows = table.find_all('tr')
    data = []
    for row in rows[1:]:  # 跳过表头
        cols = row.find_all('td')
        if len(cols) < 5:
            continue
        title = cols[0].get_text(strip=True)
        category = cols[1].get_text(strip=True)
        summary = cols[2].get_text(strip=True)
        content = cols[3].get_text(strip=True)
        classic_source = cols[4].get_text(strip=True)
        # 跳过空行
        if not title:
            continue
        data.append({
            'title': title,
            'category': category or '未分类',
            'summary': summary,
            'content': content,
            'classic_source': classic_source
        })
    return data

def import_stories(data):
    count = 0
    for item in data:
        # 分类处理
        cat_name = item['category'] or '未分类'
        category_obj = Category.query.filter_by(name=cat_name).first()
        if not category_obj:
            category_obj = Category(name=cat_name)
            db.session.add(category_obj)
            db.session.commit()
        # 查重：标题重复不导入
        if Story.query.filter_by(title=item['title']).first():
            continue
        story = Story(
            title=item['title'],
            category_id=category_obj.id,
            summary=item['summary'],
            content=item['content'],
            classic_source=item['classic_source'],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            status='imported'
        )
        db.session.add(story)
        count += 1
    db.session.commit()
    print(f'成功导入 {count} 条故事数据。')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        data = parse_html_table(HTML_PATH)
        import_stories(data)
        print('导入完成，所有无用字段已自动清理。') 