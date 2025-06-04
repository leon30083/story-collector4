import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import re
from collections import defaultdict

try:
    from pypinyin import lazy_pinyin, Style
except ImportError:
    print('请先安装pypinyin: pip install pypinyin')
    sys.exit(1)
try:
    from Levenshtein import distance as levenshtein_distance
except ImportError:
    print('请先安装python-Levenshtein: pip install python-Levenshtein')
    sys.exit(1)

engine = create_engine('sqlite:///stories.db')
Session = sessionmaker(bind=engine)
session = Session()

def normalize(name):
    # 去除空格、特殊符号、全半角、统一小写
    name = (name or '').strip().lower()
    name = re.sub(r'[\s\-_/\\·•,，。！？!?.、（）()\[\]【】""\']', '', name)
    return name

def to_pinyin(name):
    # 返回拼音首字母字符串
    return ''.join([s[0] for s in lazy_pinyin(name, style=Style.NORMAL)])

def is_similar(a, b, threshold=2):
    # 允许2个字符以内的编辑距离
    return levenshtein_distance(a, b) <= threshold

# 获取所有分类
categories = session.execute(text('SELECT id, name FROM categories')).fetchall()
cat_info = [(cat[0], cat[1], normalize(cat[1]), to_pinyin(cat[1])) for cat in categories]

# 分组：先按normalize，再按拼音，再按Levenshtein距离
grouped = defaultdict(list)
for cid, raw, norm, py in cat_info:
    grouped[norm].append((cid, raw))

# 合并拼音和近似
final_groups = []
visited = set()
for norm, items in grouped.items():
    if norm in visited:
        continue
    group = list(items)
    visited.add(norm)
    # 找拼音相同或Levenshtein距离近的
    for other_norm, other_items in grouped.items():
        if other_norm == norm or other_norm in visited:
            continue
        # 拼音首字母完全相同 或 编辑距离<=2
        if to_pinyin(other_items[0][1]) == to_pinyin(items[0][1]) or is_similar(norm, other_norm):
            group.extend(other_items)
            visited.add(other_norm)
    final_groups.append(group)

merged = 0
merge_log = []
for group in final_groups:
    if len(group) > 1:
        keep_id, keep_name = group[0]
        merged_ids = []
        merged_names = []
        for del_id, del_name in group[1:]:
            # stories表中引用的全部改为keep_name
            session.execute(text('UPDATE stories SET category=:name WHERE category=(SELECT name FROM categories WHERE id=:id)'), {'name': keep_name, 'id': del_id})
            # 删除多余的category
            session.execute(text('DELETE FROM categories WHERE id=:id'), {'id': del_id})
            merged += 1
            merged_ids.append(del_id)
            merged_names.append(del_name)
        merge_log.append({
            'keep_id': keep_id,
            'keep_name': keep_name,
            'merged_ids': merged_ids,
            'merged_names': merged_names
        })
session.commit()

print('====== 分类合并/清理日志 ======')
if not merge_log:
    print('未发现可合并的近似分类。')
else:
    for log in merge_log:
        print(f'保留分类: [{log["keep_id"]}] {log["keep_name"]}')
        for mid, mname in zip(log['merged_ids'], log['merged_names']):
            print(f'  合并 -> [{mid}] {mname}')
        print('-----------------------------')
print(f'已合并/清理近似重复分类 {merged} 个。')
session.close() 