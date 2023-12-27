#app.py
from flask import Flask, render_template, request, jsonify, send_file, make_response
from config import DevelopmentConfig
from database import db, init_db
from models import db, SavedGrids,TemporaryUserInputs
from io import BytesIO
import markdown

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

#清空格子数据
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

#获取数据库中格子数据
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

#将主题写入到格子中
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

#保存格子
# @app.route('/api/grids', methods=['POST'])
# def save_grid():
#     data = request.json
#     new_grid = SavedGrids(
#         title=data['title'],
#         grid1=data['grids'][0],
#         grid2=data['grids'][1],
#         grid3=data['grids'][2],
#         grid4=data['grids'][3],
#         grid5=data['grids'][4],
#         grid6=data['grids'][5],
#         grid7=data['grids'][6],
#         grid8=data['grids'][7],
#         grid9=data['grids'][8]
#     )
#     db.session.add(new_grid)
#     db.session.commit()
#     return jsonify({'message': 'Grid saved successfully!', 'id': new_grid.id}), 201

#保存格子
@app.route('/api/grids', methods=['POST'])
#检查是否重复主题
def save_grid():
    data = request.json
    title = data.get('title')
    grids = data.get('grids')
    overwrite = data.get('overwrite')

    if not title.strip():  # 后端对标题是否为空进行检查
        return jsonify({'message': 'Title is required'}), 400

    existing_record = SavedGrids.query.filter_by(title=title).first()

    if existing_record and overwrite:
        # 如果找到同名记录且用户选择覆盖
        return update_existing_grid(existing_record, grids)
    elif not existing_record:
        # 如果没有找到同名记录，创建新记录
        return create_new_grid(title, grids)
    else:
        # 如果存在同名记录但用户没有选择覆盖
        return jsonify({'message': 'Record with the same title exists'}), 409

#建立新记录
def create_new_grid(title, grids):
    new_grid = SavedGrids(
        title=title,
        grid1=grids[0],
        grid2=grids[1],
        grid3=grids[2],
        grid4=grids[3],
        grid5=grids[4],
        grid6=grids[5],
        grid7=grids[6],
        grid8=grids[7],
        grid9=grids[8]
    )
    db.session.add(new_grid)
    db.session.commit()
    return jsonify({'message': 'New grid created successfully!', 'id': new_grid.id}), 201

#更新已有记录
def update_existing_grid(record, grids):
    record.grid1 = grids[0]
    record.grid2 = grids[1]
    record.grid3 = grids[2]
    record.grid4 = grids[3]
    record.grid5 = grids[4]
    record.grid6 = grids[5]
    record.grid7 = grids[6]
    record.grid8 = grids[7]
    record.grid9 = grids[8]
    db.session.commit()
    return jsonify({'message': 'Grid updated successfully', 'id': record.id}), 200

#检查是否有相同主题
@app.route('/api/check_title/<title>', methods=['GET'])
def check_title(title):
    existing_record = SavedGrids.query.filter_by(title=title).first()
    return jsonify({'exists': bool(existing_record)})


#读取格子
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

#交换格子
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

#导出为MD格式文件
@app.route('/api/export_record/<int:id>', methods=['GET'])
def export_record(id):
    record = SavedGrids.query.get_or_404(id)
    md_content = f"# {record.title}\n\n"
    for i in range(1, 10):
        grid_content = getattr(record, f'grid{i}')
        if grid_content:
            md_content += f"- Grid {i}: {grid_content}\n"

    # 添加引用日期
    if record.save_time:
        md_content += f"\nSaved at: {record.save_time.strftime('%Y-%m-%d %H:%M')}"

    # 返回包含Markdown内容和标题的JSON
    return jsonify(markdown=md_content, title=record.title)


if __name__ == '__main__':
    app.run(debug=True)
