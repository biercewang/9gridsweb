// script.js

// 页面加载完毕时获取并显示格子数据
document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/grids')
    .then(response => response.json())
    .then(data => {
        const tableBody = document.querySelector("#record-table tbody");
        data.forEach(grid => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${grid.id}</td>
                <td>${grid.title}</td>
                <td>${grid.grid1}</td>
                <td>${grid.grid2}</td>
                <td>${grid.grid3}</td>
                <td>${grid.grid4}</td>
                <td>${grid.grid5}</td>
                <td>${grid.grid6}</td>
                <td>${grid.grid7}</td>
                <td>${grid.grid8}</td>
                <td>${grid.grid9}</td>
            `;
            tableBody.appendChild(row);
        });
    })
    .catch(error => console.error('Error:', error));
});

function addWordToGrid() {
  const note = document.getElementById('input-text').value;
  const lines = note.split('\n').filter(line => line.trim() !== '');  // 过滤空行
  let lineIndex = 0;  // 当前处理的行索引

  // 定义一个函数处理每一行文本
  function handleLine() {
      if (lineIndex < lines.length) {
          fetch('/api/add_to_grid', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ note: lines[lineIndex] })  // 发送当前行文本
          })
          .then(response => response.json())
          .then(data => {
              console.log('Success:', data);
              if(data.grid_position) {
                  // 在前端九宫格的相应位置显示内容
                  const gridItem = document.querySelector(`#grid-container .grid-item:nth-child(${data.grid_position})`);
                  gridItem.textContent = lines[lineIndex];
                  lineIndex++;  // 移动到下一行
                  handleLine();  // 递归处理下一行
              } else {
                  // 处理错误或所有格子都已填满的情况
                  alert(data.message);
              }
          })
          .catch((error) => {
              console.error('Error:', error);
          });
      } else {
          // 所有行都已处理完毕，可以清空输入框
          document.getElementById('input-text').value = '';
      }
  }

  handleLine();  // 开始处理第一行
}


function clearAll() {
  fetch('/api/clear_temporary_grids', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    // alert(data.message); // 弹出消息提示
    if (data.message.includes('successfully')) {
      // 如果清空成功，可以在这里编写清空前端格子的代码
      clearGridsOnFrontend();
    }
  })
  .catch(error => {
    console.error('Error clearing temporary grids:', error);
    alert('Failed to clear grids: ' + error);
  });
}

// 前端清空格子的函数示例
function clearGridsOnFrontend() {
  for (let i = 1; i <= 9; i++) { // 假设有9个格子
    const gridElement = document.getElementById(`grid${i}`);
    if(gridElement) {
      gridElement.textContent = ''; // 清空格子内容
    }
  }
}

//前端清空要点框内容
function clearInputText() {
  document.getElementById('input-text').value = '';  // 清空textarea
}

//保存格子内容到数据库
function saveGrids() {
  // 获取标题和格子内容
  const title = document.getElementById('title-input').value;
  const grids = [];
  for(let i = 1; i <= 9; i++) {
      const gridContent = document.getElementById(`grid${i}`).textContent;
      grids.push(gridContent);
  }

  // 发送请求到后端保存数据
  fetch('/api/grids', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({title: title, grids: grids})
  })
  .then(response => response.json())
  .then(data => {
      console.log('Save Success:', data);
      // 可以在这里更新前端视图
      // 例如，重新加载或添加新的行到下方的列表清单中
  })
  .catch((error) => {
      console.error('Save Error:', error);
  });
}

function saveGrids() {
    const title = document.getElementById('title-input').value;
    const grids = [];
    for(let i = 1; i <= 9; i++) {
        const gridContent = document.getElementById(`grid${i}`).textContent;
        grids.push(gridContent);
    }

    fetch('/api/grids', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({title: title, grids: grids})
    })
    .then(response => response.json())
    .then(data => {
        console.log('Save Success:', data);
        // 更新前端视图
        if(data.id) {
            updateRecordTableView(data.id, title, grids);
        } else {
            // 如果没有从后端获取到ID，你可能需要处理这种情况
            console.error('No ID returned from the backend');
        }
    })
    .catch((error) => {
        console.error('Save Error:', error);
    });
}

function updateRecordTableView(id,title, grids) {
    const tableBody = document.getElementById('record-table').querySelector('tbody');
    const newRow = tableBody.insertRow(-1);  // 在表格末尾插入新行

    // 插入新行的单元格并填充数据
    let cell = newRow.insertCell(0);  // 插入ID单元格
    cell.textContent = id;  // 使用从后端获取的真实ID

    cell = newRow.insertCell(1);  // 插入标题单元格
    cell.textContent = title;

    for (let i = 0; i < grids.length; i++) {
        cell = newRow.insertCell(i + 2);  // 插入各个格子数据
        cell.textContent = grids[i];
    }
}

//读取数据库到九宫格
function promptForIdAndLoadGrid() {
    // 弹出对话框让用户输入ID
    const gridId = prompt("请输入要读取的格子的ID:");
    if (gridId) {
        fetch(`/api/grids/${gridId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // 将数据填充到九宫格中
            for(let i = 1; i <= 9; i++) {
                const gridContent = data[`grid${i}`];
                const gridElement = document.getElementById(`grid${i}`);
                if(gridElement) {
                    gridElement.textContent = gridContent || '';  // 使用空字符串替代null或undefined
                }
            }
            // 可以根据需要更新其他元素，如标题等
            document.getElementById('title-input').value = data.title || '';
        })
        .catch(error => {
            console.error('Error fetching grid:', error);
            alert('读取失败，请确保输入了正确的ID');
        });
    }
}

//双击编辑格子
function editGrid(gridNumber) {
    const gridElement = document.getElementById(`grid${gridNumber}`);
    const originalContent = gridElement.textContent;
    const newContent = prompt("编辑格子内容:", originalContent);

    if (newContent !== null && newContent !== originalContent) {
        gridElement.textContent = newContent;  // 更新页面上的内容

        // 发送更新请求到后端
        fetch(`/api/grids/update_grid/${gridNumber}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: newContent })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Update Success:', data);
        })
        .catch((error) => {
            console.error('Update Error:', error);
            alert('更新失败');
        });
    }
}

let sourceGridNumber = null;  // 源格子编号

function dragStart(event) {
    sourceGridNumber = event.target.id.replace('grid', '');  // 获取源格子编号
    event.dataTransfer.setData("text", event.target.id);  // 设置传输数据
}

function allowDrop(event) {
    event.preventDefault();  // 防止默认处理（默认不允许放置）
}

function drop(event, targetGridNumber) {
    event.preventDefault();
    const sourceGridId = event.dataTransfer.getData("text");
    const targetGridId = `grid${targetGridNumber}`;
    
    // 交换两个格子的内容
    const sourceGridElement = document.getElementById(sourceGridId);
    const targetGridElement = document.getElementById(targetGridId);
    const tempContent = sourceGridElement.textContent;
    sourceGridElement.textContent = targetGridElement.textContent;
    targetGridElement.textContent = tempContent;

    // 发送更新请求到后端
    fetch('/api/grids/swap', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sourceGridNumber: sourceGridNumber, targetGridNumber: targetGridNumber })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Swap Success:', data);
    })
    .catch((error) => {
        console.error('Swap Error:', error);
        alert('交换失败');
    });
}

