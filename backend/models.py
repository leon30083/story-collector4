from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Story(db.Model):
    __tablename__ = 'stories'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(255), nullable=False)
    author = db.Column(db.String(255))
    age_range = db.Column(db.String(32))
    theme = db.Column(db.String(255))
    style_id = db.Column(db.Integer, db.ForeignKey('styles.id'))
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'))
    summary = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    classic_adapted = db.Column(db.Boolean, default=False)
    classic_source = db.Column(db.String(255))
    batch_id = db.Column(db.String(64))
    status = db.Column(db.String(32), default='draft')
    pages = db.Column(db.JSON)

class Category(db.Model):
    __tablename__ = 'categories'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('categories.id'))

class Style(db.Model):
    __tablename__ = 'styles'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    desc = db.Column(db.Text)
    image = db.Column(db.String(255))

class Prompt(db.Model):
    __tablename__ = 'prompts'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    type = db.Column(db.String(32))
    name = db.Column(db.String(255))
    content = db.Column(db.Text)

class ImageTask(db.Model):
    __tablename__ = 'image_tasks'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    story_id = db.Column(db.Integer, db.ForeignKey('stories.id'))
    page_no = db.Column(db.Integer)
    status = db.Column(db.String(32))
    result_url = db.Column(db.String(255))
    log = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ExportTask(db.Model):
    __tablename__ = 'export_tasks'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    story_ids = db.Column(db.JSON)
    type = db.Column(db.String(32))
    status = db.Column(db.String(32))
    file_url = db.Column(db.String(255))
    progress = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow) 