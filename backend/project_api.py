from flask import Blueprint, request, jsonify
from models import db, Story
from datetime import datetime

project_bp = Blueprint('project', __name__)

@project_bp.route('/', methods=['GET'])
def list_projects():
    projects = Story.query.all()
    result = []
    for p in projects:
        result.append({
            'id': p.id,
            'title': p.title,
            'progress': 1.0 if p.pages else 0.0,
            'scene_count': len(p.pages) if p.pages else 0,
            'last_edit': p.updated_at.isoformat() if p.updated_at else ''
        })
    return jsonify(result)

@project_bp.route('/', methods=['POST'])
def create_project():
    data = request.json
    story = Story(
        title=data.get('title', ''),
        author=data.get('author', ''),
        age_range=data.get('age_range', ''),
        theme=data.get('theme', ''),
        style_id=data.get('style_id'),
        category_id=data.get('category_id'),
        summary=data.get('summary', ''),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        classic_adapted=data.get('classic_adapted', False),
        classic_source=data.get('classic_source', ''),
        batch_id=data.get('batch_id', ''),
        status=data.get('status', 'draft'),
        pages=data.get('pages', [])
    )
    db.session.add(story)
    db.session.commit()
    return jsonify({'id': story.id}), 201

@project_bp.route('/<int:project_id>', methods=['GET'])
def get_project(project_id):
    story = Story.query.get_or_404(project_id)
    return jsonify({
        'id': story.id,
        'title': story.title,
        'author': story.author,
        'age_range': story.age_range,
        'theme': story.theme,
        'style_id': story.style_id,
        'category_id': story.category_id,
        'summary': story.summary,
        'created_at': story.created_at.isoformat() if story.created_at else '',
        'updated_at': story.updated_at.isoformat() if story.updated_at else '',
        'classic_adapted': story.classic_adapted,
        'classic_source': story.classic_source,
        'batch_id': story.batch_id,
        'status': story.status,
        'pages': story.pages
    })

@project_bp.route('/<int:project_id>', methods=['PATCH'])
def rename_project(project_id):
    story = Story.query.get_or_404(project_id)
    data = request.json
    if 'title' in data:
        story.title = data['title']
    db.session.commit()
    return jsonify({'msg': 'ok'})

@project_bp.route('/<int:project_id>', methods=['DELETE'])
def delete_project(project_id):
    story = Story.query.get_or_404(project_id)
    db.session.delete(story)
    db.session.commit()
    return jsonify({'msg': 'deleted'}) 