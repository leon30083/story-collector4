from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
db_path = os.path.join(BASE_DIR, 'data', 'stories.db')

engine = create_engine(f'sqlite:///{db_path}')
Session = sessionmaker(bind=engine)
session = Session()

# 获取所有分类
categories = session.execute(text('SELECT name FROM categories')).fetchall()
print('分类名 | 故事数量')
print('----------------')
for cat in categories:
    name = cat[0]
    count = session.execute(text('SELECT COUNT(*) FROM stories WHERE category=:name'), {'name': name}).fetchone()[0]
    print(f'{name} | {count}')
session.close() 