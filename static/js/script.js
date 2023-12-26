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
