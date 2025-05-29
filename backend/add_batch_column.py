from sqlalchemy import create_engine, Column, String, MetaData, Table, text
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
db_path = os.path.join(BASE_DIR, 'data', 'stories.db')

engine = create_engine(f'sqlite:///{db_path}')
metadata = MetaData()
metadata.reflect(bind=engine)

stories = Table('stories', metadata, autoload_with=engine)

# 检查是否已存在batch字段
if 'batch' not in stories.c:
    with engine.connect() as conn:
        conn.execute(text('ALTER TABLE stories ADD COLUMN batch VARCHAR(50)'))
        print('已添加batch字段')
else:
    print('batch字段已存在') 