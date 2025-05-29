from flask import Blueprint, request, jsonify
from models import db, Story
from datetime import datetime

script_bp = Blueprint('script', __name__)

@script_bp.route('/generate', methods=['POST'])
def generate_script():
    data = request.json
    # mock AI生成
    return jsonify({
        'script_cn': '这是AI生成的中文脚本',
        'script_en': 'This is the AI generated English script',
        'segments': [
            {'page_no': 1, 'text_cn': '第一页内容', 'text_en': 'Page 1 content'}
        ]
    })

@script_bp.route('/projects/<int:project_id>/script', methods=['POST'])
def save_script(project_id):
    story = Story.query.get_or_404(project_id)
    data = request.json
    story.pages = data.get('pages', [])
    story.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'msg': 'saved'})

@script_bp.route('/projects/<int:project_id>/script/history', methods=['GET'])
def script_history(project_id):
    # mock历史版本
    return jsonify([
        {'version': 1, 'updated_at': '2025-05-29T10:00:00', 'pages': []}
    ])

@script_bp.route('/projects/<int:project_id>/script/import', methods=['POST'])
def import_script(project_id):
    # mock导入
    return jsonify({'msg': 'imported'})

@script_bp.route('/projects/<int:project_id>/script/export', methods=['GET'])
def export_script(project_id):
    # mock导出
    return jsonify({'file_url': '/mock/script_export.txt'}) 