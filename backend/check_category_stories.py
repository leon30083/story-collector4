from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

engine = create_engine('sqlite:///stories.db')
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