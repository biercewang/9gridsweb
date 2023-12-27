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
    alert(data.message); // 弹出消息提示
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
      updateRecordTableView(title, grids);
  })
  .catch((error) => {
      console.error('Save Error:', error);
  });
}

function updateRecordTableView(title, grids) {
  const tableBody = document.getElementById('record-table').querySelector('tbody');
  const newRow = tableBody.insertRow(-1);  // 在表格末尾插入新行

  // 插入新行的单元格并填充数据
  let cell = newRow.insertCell(0);  // 插入ID单元格
  cell.textContent = '新';  // 如果你能从后端获取真实的ID，这里可以替换为真实ID

  cell = newRow.insertCell(1);  // 插入标题单元格
  cell.textContent = title;

  for (let i = 0; i < grids.length; i++) {
      cell = newRow.insertCell(i + 2);  // 插入各个格子数据
      cell.textContent = grids[i];
  }
}