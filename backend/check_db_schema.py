import sqlite3
import os

def check_db_schema(db_path):
    if not os.path.exists(db_path):
        print(f"数据库文件不存在: {db_path}")
        return
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    print(f"数据库: {db_path}")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    if not tables:
        print("无表结构。"); return
    for (table_name,) in tables:
        print(f"\n表: {table_name}")
        cursor.execute(f"PRAGMA table_info('{table_name}')")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  字段: {col[1]} | 类型: {col[2]} | 主键: {col[5]}")
    conn.close()

if __name__ == "__main__":
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'stories.db')
    check_db_schema(db_path) 