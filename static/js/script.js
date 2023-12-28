// script.js

// 页面加载完毕时执行的程序
document.addEventListener('DOMContentLoaded', function() {
    // 绑定右键菜单事件到所有的.grid-item元素
    document.querySelectorAll('.grid-item').forEach(item => {
        item.addEventListener('contextmenu', (event) => {
            event.preventDefault(); // 阻止默认的右键菜单
            // 显示自定义的菜单
            showCustomContextMenu(event.pageX, event.pageY, item.id);
        });
    });

    // 页面加载完毕时获取并显示格子数据
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

let currentGridNumber; // 当前右键点击的格子编号

function showCustomContextMenu(x, y, gridId) {
    const menu = document.getElementById('custom-context-menu');
    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    if (x + menuWidth > windowWidth) {
        x -= menuWidth;
    }

    if (y + menuHeight > windowHeight) {
        y -= menuHeight;
    }

    menu.style.top = `${y}px`;
    menu.style.left = `${x}px`;
    menu.style.display = 'block';
    
    currentGridNumber = gridId.replace('grid', ''); // 提取格子编号
}

// 点击其他地方隐藏菜单
window.addEventListener('click', () => {
    document.getElementById('custom-context-menu').style.display = 'none';
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

function saveGrids() {
    const title = document.getElementById('title-input').value.trim();
    if (!title) {
        alert("请输入主题后再保存格子。");
        return; // 如果标题为空，停止执行并提示用户
    }
    const grids = [];
    for (let i = 1; i <= 9; i++) {
        const gridContent = document.getElementById(`grid${i}`).textContent;
        grids.push(gridContent);
    }

    // 首先检查是否已存在同名标题的记录
    fetch(`/api/check_title/${title}`)
    .then(response => response.json())
    .then(data => {
        if (data.exists) {
            // 如果存在同名记录，提示用户是否覆盖
            const overwrite = confirm("已存在同名主题的记录。是否覆盖?");
            if (!overwrite) return;  // 如果用户选择不覆盖，则停止
        }

        // 保存或覆盖格子
        fetch('/api/grids', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({title: title, grids: grids, overwrite: data.exists})
        })
        .then(response => response.json())
        .then(data => {
            console.log('Save Success:', data);
            // 更新前端视图
            if(data.id) {
                updateRecordTableView(data.id, title, grids);
            } else {
                console.error('No ID returned from the backend');
            }
        })
        .catch((error) => {
            console.error('Save Error:', error);
        });
    })
    .catch(error => {
        console.error('Error checking title:', error);
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

//删除条目
function promptForIdAndDeleteRecord() {
    const id = prompt('请输入要删除的条目ID：');
    if (id) {
        fetch(`/api/grids/${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            console.log('Delete Success:', data);
            alert(data.message);  // 显示操作结果
            location.reload();  // 刷新页面以更新视图
        })
        .catch((error) => {
            console.error('Delete Error:', error);
        });
    }
}

//导出条目
function promptForIdAndExportRecord() {
    const id = prompt("请输入要导出的条目ID:");
    if(id) {
        fetch(`/api/export_record/${id}`)
        .then(response => response.json())  // 假设后端返回JSON数据
        .then(data => {
            // 创建一个a标签用于下载
            const element = document.createElement('a');
            const file = new Blob([data.markdown], {type: 'text/plain'});
            const title = data.title || 'grid';  // 如果后端没有提供标题，则使用默认的'grid'

            element.href = URL.createObjectURL(file);
            element.download = `${title}.md`;
            document.body.appendChild(element); // Required for this to work in FireFox
            element.click();
            document.body.removeChild(element); // 清理DOM

            // 将Markdown内容复制到剪贴板
            navigator.clipboard.writeText(data.markdown)
            .then(() => alert('已复制到剪贴板'))
            .catch(err => console.error('Error in copying text: ', err));
        })
        .catch(error => {
            console.error('导出失败:', error);
            alert('导出失败: ' + error.message);
        });
    }
}

//右键删除指定格子内容
function deleteGridContent(gridNumber) {
    const gridElement = document.getElementById(`grid${gridNumber}`);
    if(gridElement) {
        // 发送DELETE请求到后端
        fetch(`/api/grids/delete_content/${gridNumber}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            console.log(data.message); // 可以在这里更新前端，例如显示一个消息
            gridElement.textContent = ''; // 清空前端的格子内容
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
}

//刷新后删除数据库临时文件清除格子数据
window.onload = function() {
    // 确保不会覆盖其他已经定义的 onload 事件
    // ...

    // 添加清除临时格子的请求
    fetch('/api/clear_temporary_grids', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Temporary grids cleared:', data.message);
        // 你可以在这里添加更多的代码来处理清除成功后的逻辑
    })
    .catch(error => console.error('Error clearing temporary grids:', error));

    // 你原有的 onload 代码
    // ...
};
