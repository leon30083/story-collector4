from flask import Blueprint, request, jsonify
from models import db, Story

prompt_bp = Blueprint('prompt', __name__)

@prompt_bp.route('/generate', methods=['POST'])
def generate_prompt():
    data = request.json
    # mock AI生成
    return jsonify({
        'storyboards': ['分镜1提示词', '分镜2提示词']
    })

@prompt_bp.route('/projects/<int:project_id>/prompts', methods=['POST'])
def save_prompts(project_id):
    story = Story.query.get_or_404(project_id)
    data = request.json
    if not story.pages:
        story.pages = []
    for idx, prompt in enumerate(data.get('prompts', [])):
        if idx < len(story.pages):
            story.pages[idx]['image_hint'] = prompt
    db.session.commit()
    return jsonify({'msg': 'saved'})

@prompt_bp.route('/projects/<int:project_id>/prompts/export', methods=['GET'])
def export_prompts(project_id):
    # mock导出
    return jsonify({'file_url': '/mock/prompts_export.txt'}) 