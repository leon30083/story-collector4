from models import db, Style
from flask import Flask

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///../data/stories.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

styles = [
    {"name": "温暖童话", "desc": "色彩柔和，画风温馨，适合低幼儿童。", "image": "https://placehold.co/120x80?text=温暖童话"},
    {"name": "幽默卡通", "desc": "夸张表情，明快线条，富有幽默感。", "image": "https://placehold.co/120x80?text=幽默卡通"},
    {"name": "史诗奇幻", "desc": "宏大场景，奇幻色彩，适合冒险故事。", "image": "https://placehold.co/120x80?text=史诗奇幻"},
    {"name": "中国水墨", "desc": "水墨晕染，国风韵味，适合传统题材。", "image": "https://placehold.co/120x80?text=中国水墨"},
    {"name": "现代扁平", "desc": "极简造型，明快配色，现代感强。", "image": "https://placehold.co/120x80?text=现代扁平"},
    {"name": "童趣拼贴", "desc": "拼贴元素，丰富材质，童趣十足。", "image": "https://placehold.co/120x80?text=童趣拼贴"},
    {"name": "科幻未来", "desc": "未来科技感，冷色调，适合科幻故事。", "image": "https://placehold.co/120x80?text=科幻未来"},
    {"name": "油画质感", "desc": "厚重笔触，油画肌理，艺术感强。", "image": "https://placehold.co/120x80?text=油画质感"},
    {"name": "黑白剪影", "desc": "黑白对比，剪影风格，适合悬疑故事。", "image": "https://placehold.co/120x80?text=黑白剪影"},
    {"name": "欧美经典", "desc": "欧美绘本常见风格，细腻写实。", "image": "https://placehold.co/120x80?text=欧美经典"}
]

with app.app_context():
    for s in styles:
        if not Style.query.filter_by(name=s["name"]).first():
            db.session.add(Style(**s))
    db.session.commit()
    print('风格模板已填充') 