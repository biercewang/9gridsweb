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
    fetch('/api/add_to_grid', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({note: note})
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        if(data.grid_position) {
            // 在前端九宫格的相应位置显示内容
            const gridItem = document.querySelector(`#grid-container .grid-item:nth-child(${data.grid_position})`);
            gridItem.textContent = note;
            // 清空输入框
            document.getElementById('input-text').value = '';
        } else {
            // 处理错误或所有格子都已填满的情况
            alert(data.message);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
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
