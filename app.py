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

@app.route('/')
def index():
    return render_template('index.html')

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

#全部清空
@app.route('/api/clear_temporary_grids', methods=['POST'])
def clear_temporary_grids():
    try:
        # 删除TemporaryUserInputs表中的所有记录
        TemporaryUserInputs.query.delete()
        db.session.commit()
        return jsonify({'message': 'Temporary grids cleared successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500


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

    fill_sequence = [5, 4, 6, 2, 8, 1, 3, 7, 9]

    # 寻找第一个空的格子并保存内容
    for i in fill_sequence:
        grid_field = f'grid{i}'
        if getattr(temp_input, grid_field) == '' or getattr(temp_input, grid_field) is None:
            setattr(temp_input, grid_field, note)
            db.session.commit()
            return jsonify({'message': 'Word added to grid', 'grid_position': i}), 201

    return jsonify({'message': 'All grids are filled'}), 400


@app.route('/api/grids', methods=['POST'])
def save_grid():
    data = request.json
    new_grid = SavedGrids(
        title=data['title'],
        grid1=data['grids'][0],
        grid2=data['grids'][1],
        grid3=data['grids'][2],
        grid4=data['grids'][3],
        grid5=data['grids'][4],
        grid6=data['grids'][5],
        grid7=data['grids'][6],
        grid8=data['grids'][7],
        grid9=data['grids'][8]
    )
    db.session.add(new_grid)
    db.session.commit()
    return jsonify({'message': 'Grid saved successfully!', 'id': new_grid.id}), 201

@app.route('/api/grids/<int:id>', methods=['GET'])
def get_grid(id):
    grid = SavedGrids.query.get(id)
    if grid:
        # 将grid的数据转换成字典或者其他形式
        return jsonify({
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
    else:
        return jsonify({'message': 'Grid not found'}), 404

#双击编辑格子
@app.route('/api/grids/update_grid/<int:gridNumber>', methods=['PUT'])
def update_grid(gridNumber):
    data = request.json
    content = data.get('content')
    
    # 假设你使用的session_id是静态的，实际情况你可能需要从请求中获取或生成
    session_id = 'some_session_id'
    temp_input = TemporaryUserInputs.query.filter_by(session_id=session_id).first()
    if temp_input:
        grid_field = f'grid{gridNumber}'
        setattr(temp_input, grid_field, content)
        db.session.commit()
        return jsonify({'message': 'Grid updated successfully'}), 200
    else:
        return jsonify({'message': 'Temporary input not found'}), 404

@app.route('/api/grids/swap', methods=['POST'])
def swap_grids():
    data = request.json
    sourceGridNumber = data.get('sourceGridNumber')
    targetGridNumber = data.get('targetGridNumber')
    
    session_id = 'some_session_id'  # 假设使用静态的session_id
    temp_input = TemporaryUserInputs.query.filter_by(session_id=session_id).first()
    if temp_input:
        sourceGridField = f'grid{sourceGridNumber}'
        targetGridField = f'grid{targetGridNumber}'
        
        # 交换两个格子的内容
        tempContent = getattr(temp_input, sourceGridField)
        setattr(temp_input, sourceGridField, getattr(temp_input, targetGridField))
        setattr(temp_input, targetGridField, tempContent)
        db.session.commit()
        
        return jsonify({'message': 'Grids swapped successfully'}), 200
    else:
        return jsonify({'message': 'Temporary input not found'}), 404


#删除条目
@app.route('/api/grids/<int:id>', methods=['DELETE'])
def delete_grid(id):
    try:
        grid = SavedGrids.query.get_or_404(id)
        db.session.delete(grid)
        db.session.commit()
        return jsonify({'message': 'Grid deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
