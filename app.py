#app.py
from dotenv import load_dotenv
load_dotenv()

from flask import Flask, render_template, request, jsonify, send_file, make_response
from config import DevelopmentConfig
from database import db, init_db
from models import db, SavedGrids,TemporaryUserInputs
from io import BytesIO
import markdown
from api_handler import APIHandler 
import re

app = Flask(__name__)
app.config.from_object(DevelopmentConfig)
init_db(app)
first_request_done = False

api_handler = APIHandler() 


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

#在首次启动前创建数据库,数据表和空记录
@app.before_request
def before_request():
    global first_request_done
    if not first_request_done:
        # 创建数据库和表
        with app.app_context():
            db.create_all()

        # 添加预设数据
        add_preset_data()

        # 创建一个空的TemporaryUserInputs记录，如果还没有的话
        if TemporaryUserInputs.query.count() == 0:
            empty_temp_input = TemporaryUserInputs(
                session_id='initial_session',  # 使用一个初始的session_id或其他逻辑来生成
                # 保持所有grid字段为空
            )
            db.session.add(empty_temp_input)
            db.session.commit()

        first_request_done = True


#清空格子数据
@app.route('/api/clear_temporary_grids', methods=['POST'])
def clear_temporary_grids():
    try:
        # 获取所有临时用户输入条目
        temp_inputs = TemporaryUserInputs.query.all()
        for input in temp_inputs:
            # 通过循环将每个格子的内容设置为空字符串
            for i in range(1, 10):  # 九个格子
                setattr(input, f'grid{i}', '')  # 设置属性值为空字符串
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


#保存格子到数据库
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

#数据库中建立新记录
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

#数据中更新已有记录
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
    if existing_record:
        return jsonify({'exists': True, 'id': existing_record.id})
    else:
        return jsonify({'exists': False})


# #读取格子
@app.route('/api/grids/<int:id>', methods=['GET'])
def get_grid(id):
    grid = SavedGrids.query.get(id)
    if grid:
        # 尝试获取当前的临时用户输入
        temp_input = TemporaryUserInputs.query.first()  # 这里假设只有一条记录，根据实际情况调整
        if not temp_input:
            # 如果没有临时用户输入，则创建一条新记录
            temp_input = TemporaryUserInputs(session_id='some_session_id')  # 使用实际的会话ID
            db.session.add(temp_input)
        
        # 更新临时数据表中的内容
        temp_input.grid1 = grid.grid1
        temp_input.grid2 = grid.grid2
        temp_input.grid3 = grid.grid3
        temp_input.grid4 = grid.grid4
        temp_input.grid5 = grid.grid5
        temp_input.grid6 = grid.grid6
        temp_input.grid7 = grid.grid7
        temp_input.grid8 = grid.grid8
        temp_input.grid9 = grid.grid9

        # 尝试提交更改
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': f'Failed to update temporary grids: {str(e)}'}), 500

        # 返回格子内容
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

    # 创建3x3的Markdown表格，并设置内容居中
    md_content += "| ← | ↑ | → |\n"  # 表头
    md_content += "|:---:|:---:|:---:|\n"  # 分隔行，设置为居中对齐

    # 填充表格内容
    for i in range(1, 10, 3):
        grid_contents = [getattr(record, f'grid{j}', '') for j in range(i, i + 3)]
        md_content += f"| {' | '.join(grid_contents)} |\n"

    # 添加引用日期
    if record.save_time:
        md_content += f"\nRef: {record.save_time.strftime('%Y-%m-%d %H:%M')}"

    # 返回包含Markdown内容和标题的JSON
    return jsonify(markdown=md_content, title=record.title)


#删除指定格子的内容
@app.route('/api/grids/delete_content/<int:gridNumber>', methods=['DELETE'])
def delete_grid_content(gridNumber):
    try:
        # 假设使用固定的session_id，实际应用中应该是动态的
        session_id = 'some_session_id'
        temp_input = TemporaryUserInputs.query.filter_by(session_id=session_id).first()
        if temp_input:
            grid_field = f'grid{gridNumber}'
            setattr(temp_input, grid_field, '')  # 清空指定格子内容
            db.session.commit()
            return jsonify({'message': f'Grid {gridNumber} content deleted successfully'}), 200
        else:
            return jsonify({'message': 'Temporary input not found'}), 404
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

#AI查询
@app.route('/api/perform_query', methods=['POST'])
def perform_query():
    term = request.json.get('term', '').strip()
    if term:
        api_handler = APIHandler()  # 创建APIHandler实例
        try:
            response = api_handler.fetch_data(term)
            # 提取内容
            content = response.get('data', {}).get('choices', [{}])[0].get('content', '')

            # 清理内容
            content = content.strip(' "\'')  # 删除开头和结尾的空白字符及引号
            content = content.replace('\\n\\n', '\n').replace('\\n', '\n').replace('\xa0 ', '')  # 删除多余的换行和空格
            content = re.sub(r'\n\d+|\n\s+', '\n', content)

            return jsonify({'content': content})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        return jsonify({'error': '请输入查询的术语。'}), 400

if __name__ == '__main__':
    app.run(debug=True)
