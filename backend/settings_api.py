from flask import Blueprint, request, jsonify
import json
import os

settings_bp = Blueprint('settings', __name__)
SETTINGS_FILE = os.path.join(os.path.dirname(__file__), '../data/settings.json')

def load_settings():
    if os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_settings(data):
    with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@settings_bp.route('/', methods=['GET'])
def get_settings():
    return jsonify(load_settings())

@settings_bp.route('/', methods=['POST'])
def set_settings():
    data = request.json
    save_settings(data)
    return jsonify({'status': 'success'})

@settings_bp.route('/test', methods=['POST'])
def test_settings():
    # mock连通性测试
    return jsonify({'status': 'ok'}) 