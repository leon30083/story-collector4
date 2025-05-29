from flask import Blueprint, request, jsonify
from models import db, ImageTask
from datetime import datetime

image_bp = Blueprint('image', __name__)

@image_bp.route('/doubao/batch', methods=['POST'])
def batch_generate_images():
    # mock批量生成
    return jsonify({'task_ids': [1,2,3]})

@image_bp.route('/tasks', methods=['GET'])
def get_tasks():
    # mock任务列表
    return jsonify([
        {'id': 1, 'status': 'processing', 'progress': 60, 'result_url': None},
        {'id': 2, 'status': 'done', 'progress': 100, 'result_url': '/mock/img2.png'}
    ])

@image_bp.route('/tasks/<int:task_id>/retry', methods=['POST'])
def retry_task(task_id):
    # mock重试
    return jsonify({'msg': 'retried'})

@image_bp.route('/tasks/<int:task_id>/download', methods=['GET'])
def download_image(task_id):
    # mock下载
    return jsonify({'file_url': '/mock/img.png'})

@image_bp.route('/tasks/<int:task_id>/log', methods=['GET'])
def get_task_log(task_id):
    # mock日志
    return jsonify({'log': '任务日志内容'}) 