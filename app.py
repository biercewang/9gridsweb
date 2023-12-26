#app.py
from flask import Flask, render_template, request, jsonify
from config import DevelopmentConfig
from database import db, init_db
from models import db, SavedGrids,TemporaryUserInputs

app = Flask(__name__)
app.config.from_object(DevelopmentConfig)
init_db(app)
first_request_done = False

def add_preset_data():
    # 检查是否已有预设数据
    if SavedGrids.query.count() == 0:
        print("Adding preset data...")
        preset_data = [
            SavedGrids(title="大五人格(示例)", grid1="", grid2="开放性", grid3="",
                       grid4="宜人性", grid5="神经质", grid6="外向性", grid7="",
                       grid8="尽责性", grid9=""),
            SavedGrids(title="波特五力模型(示例)", grid1="", grid2="新进入者", grid3="",
                       grid4="供应商", grid5="同行竞争者", grid6="客户", grid7="",
                       grid8="替代品", grid9=""),
            # ... 其他预设数据 ...
        ]
        db.session.bulk_save_objects(preset_data)
        try:
            db.session.commit()
            print("Preset data added.")
        except Exception as e:
            print("Error adding preset data:", e)
            db.session.rollback()


@app.before_request
def before_request():
    global first_request_done
    if not first_request_done:
        # 创建数据库和表
        with app.app_context():
            db.create_all()
        # 添加预设数据
        add_preset_data()
        first_request_done = True

# 创建数据库和表
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/grids', methods=['POST'])
def save_grid():
    # 示例：从请求中获取数据并保存到数据库
    # 你需要根据实际情况调整获取数据的方式和保存逻辑
    data = request.json
    new_grid = SavedGrids(title=data.get('title'), grid1=data.get('grid1'))
    db.session.add(new_grid)
    db.session.commit()
    return jsonify({'message': 'Grid saved successfully!'}), 201

@app.route('/api/grids', methods=['GET'])
def get_grids():
    grids = SavedGrids.query.all()
    grid_data = []
    for grid in grids:
        grid_data.append({
            'id': grid.id,
            'title': grid.title,
            'grid1': grid.grid1,
            'grid2': grid.grid2,
            'grid3': grid.grid3,
            'grid4': grid.grid4,
            'grid5': grid.grid5,
            'grid6': grid.grid6,
            'grid7': grid.grid7,
            'grid8': grid.grid8,
            'grid9': grid.grid9
        })
    return jsonify(grid_data)

@app.route('/api/add_to_grid', methods=['POST'])
def add_to_grid():
    data = request.json
    note = data.get('note', '').strip()
    if not note:
        return jsonify({'message': 'No content to add'}), 400

    # 检查临时用户输入中是否已经有数据，如果没有则创建新的记录
    temp_input = TemporaryUserInputs.query.first()
    if not temp_input:
        temp_input = TemporaryUserInputs(session_id='some_session_id', input_type='grid')
        db.session.add(temp_input)

    # 寻找第一个空的格子并保存内容
    for i in range(1, 10):  # 假设你有9个格子
        grid_field = f'grid{i}'
        if getattr(temp_input, grid_field) == '' or getattr(temp_input, grid_field) is None:
            setattr(temp_input, grid_field, note)
            db.session.commit()
            return jsonify({'message': 'Word added to grid', 'grid_position': i}), 201

    return jsonify({'message': 'All grids are filled'}), 400



@app.route('/api/grids/<int:id>', methods=['PUT'])
def update_grid(id):
    # 示例：更新特定ID的格子
    grid = SavedGrids.query.get_or_404(id)
    data = request.json
    grid.title = data.get('title', grid.title)
    db.session.commit()
    return jsonify({'message': 'Grid updated successfully!'})

@app.route('/api/grids/<int:id>', methods=['DELETE'])
def delete_grid(id):
    # 示例：删除特定ID的格子
    grid = SavedGrids.query.get_or_404(id)
    db.session.delete(grid)
    db.session.commit()
    return jsonify({'message': 'Grid deleted successfully!'})

if __name__ == '__main__':
    app.run(debug=True)
