#models.py
from database import db  # 导入db实例

class TemporaryUserInputs(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(255), nullable=False)  # 用于标识用户的会话
    input_type = db.Column(db.String(50))  # 'title', 'note', 或 'grid'
    content = db.Column(db.Text)  # 存储输入内容
    # 以下是九宫格的内容，每个格子一个字段
    grid1 = db.Column(db.Text)
    grid2 = db.Column(db.Text)
    grid3 = db.Column(db.Text)
    grid4 = db.Column(db.Text)
    grid5 = db.Column(db.Text)
    grid6 = db.Column(db.Text)
    grid7 = db.Column(db.Text)
    grid8 = db.Column(db.Text)
    grid9 = db.Column(db.Text)
    last_updated = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

class SavedGrids(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255))  # 保存的九宫格标题
    grid1 = db.Column(db.Text)
    grid2 = db.Column(db.Text)
    grid3 = db.Column(db.Text)
    grid4 = db.Column(db.Text)
    grid5 = db.Column(db.Text)
    grid6 = db.Column(db.Text)
    grid7 = db.Column(db.Text)
    grid8 = db.Column(db.Text)
    grid9 = db.Column(db.Text)
    save_time = db.Column(db.DateTime, server_default=db.func.now())
