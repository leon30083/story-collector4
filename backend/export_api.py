from flask import Blueprint, request, jsonify
from models import db, ExportTask
from datetime import datetime

export_bp = Blueprint('export', __name__)

@export_bp.route('/', methods=['POST'])
def start_export():
    # mock导出任务
    return jsonify({'export_id': 1, 'status': 'pending'})

@export_bp.route('/<int:export_id>/progress', methods=['GET'])
def export_progress(export_id):
    # mock进度
    return jsonify({'progress': 50, 'status': 'processing'})

@export_bp.route('/<int:export_id>/download', methods=['GET'])
def export_download(export_id):
    # mock下载
    return jsonify({'file_url': '/mock/export.zip'}) 