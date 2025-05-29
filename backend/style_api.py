from flask import Blueprint, jsonify
from models import db, Style

style_bp = Blueprint('style', __name__)

@style_bp.route('/', methods=['GET'])
def list_styles():
    styles = Style.query.all()
    result = []
    for s in styles:
        result.append({
            'id': s.id,
            'name': s.name,
            'desc': s.desc,
            'image': s.image
        })
    return jsonify(result)

@style_bp.route('/<int:style_id>', methods=['GET'])
def get_style(style_id):
    s = Style.query.get_or_404(style_id)
    return jsonify({
        'id': s.id,
        'name': s.name,
        'desc': s.desc,
        'image': s.image
    }) 