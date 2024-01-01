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
        data.forEach(grid => populateTableRow(tableBody, grid));  // 使用新的函数填充行
    })
    .catch(error => console.error('Error:', error));
});

//表格内容
// 用于截断文本并添加省略号的函数
function truncateText(text) {
    const ellipsis = '...';
    if (text.length > 20) { 
        return text.substring(0, 20 - ellipsis.length) + ellipsis;
    }  //表格框里显示的文字数量
    return text;
}

// 填充表格行的函数
function populateTableRow(tableBody, grid) {
    const row = tableBody.insertRow(-1);

    row.innerHTML = `
        <td>${grid.id}</td>
        <td>${processContent(grid.title)}</td>
        <td>${truncateText(processContent(grid.grid1))}</td>
        <td>${truncateText(processContent(grid.grid2))}</td>
        <td>${truncateText(processContent(grid.grid3))}</td>
        <td>${truncateText(processContent(grid.grid4))}</td>
        <td>${truncateText(processContent(grid.grid5))}</td>
        <td>${truncateText(processContent(grid.grid6))}</td>
        <td>${truncateText(processContent(grid.grid7))}</td>
        <td>${truncateText(processContent(grid.grid8))}</td>
        <td>${truncateText(processContent(grid.grid9))}</td>
    `;
    // 添加双击事件监听器
    row.addEventListener('dblclick', () => {
        const gridId = row.cells[0].textContent;  // 获取行的第一个单元格的内容，即ID
        promptForIdAndLoadGrid(gridId);  // 调用读取函数并传入ID
    });
}

//更新表格视图
function updateRecordTableView(id, title, grids) {
    const tableBody = document.getElementById('record-table').querySelector('tbody');

    // 删除表格中与新增条目相同ID的旧行
    for (let i = 0; i < tableBody.rows.length; i++) {
        if (tableBody.rows[i].cells[0].textContent == id) {
            tableBody.deleteRow(i);
            break;
        }
    }

    // 创建一个新对象来代表新行的数据
    const newGrid = {
        id: id,
        title: title,
        grid1: grids[0],
        grid2: grids[1],
        grid3: grids[2],
        grid4: grids[3],
        grid5: grids[4],
        grid6: grids[5],
        grid7: grids[6],
        grid8: grids[7],
        grid9: grids[8]
    };

    // 使用新的函数填充行
    populateTableRow(tableBody, newGrid);
}

//格子的相关操作
// 处理双击格子事件的函数
function handleDoubleClick(gridNumber) {
    if (isStudyModeOn) {
        // 如果处于学习模式，恢复格子颜色
        revealGridContent(gridNumber);
    } else {
        // 如果不在学习模式下，编辑格子内容
        editGrid(gridNumber);
    }
}


// 用于处理格子内容的函数,简化格子显示的内容为数据库中存储的":"之前的内容
function processContent(content) {
    // 通过查找“：”和提取之前的内容来简化数据
    const index = content.indexOf('：');
    if (index !== -1) {
        return content.substring(0, index);
    }
    return content;  // 如果没有找到“：”，则返回原始内容
}


let currentGridNumber; // 当前右键点击的格子编号

//格子右键点击时的菜单
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

//清空后端格子数据
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

// 前端清空格子的函数
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

//保存格子
function saveGrids() {
    const title = document.getElementById('title-input').value.trim();
    if (!title) {
        alert("请输入主题后再保存格子。");
        return; // 如果标题为空，停止执行并提示用户
    }
    const reference = document.getElementById('reference-input').value.trim(); // 获取参考来源
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
            body: JSON.stringify({title: title, grids: grids, reference: reference, overwrite: data.exists})
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


//读取数据库到九宫格
let history = []; //读取过格子的ID号

function promptForIdAndLoadGrid(optionalGridId) {
    let gridId = optionalGridId; // 如果提供了ID，使用它
    if (!gridId) {
        // 如果没有提供ID，弹出对话框让用户输入
        gridId = prompt("请输入要读取的格子的ID:");
    }
    if (gridId) {
        fetch(`/api/grids/${gridId}`)
        .then(response => {
            if (!response.ok) { throw new Error('Network response was not ok'); }
            return response.json();
        })
        .then(data => {
            // 将数据填充到九宫格中
            for(let i = 1; i <= 9; i++) {
                const gridElement = document.getElementById(`grid${i}`);
                if(gridElement) {
                    gridElement.textContent = data[`grid${i}`] || '';  // 使用空字符串替代null或undefined
                }
            }
            // 更新其他元素，如标题等
            document.getElementById('title-input').value = data.title || '';
            document.getElementById('reference-input').value = data.reference || ''; // 填充参考来源

            // 如果学习模式已激活，先取消学习模式,再应用学习模式
            if (isStudyModeOn) {
                clearStudyMode()
                applyStudyMode();  
            }
        })
        .catch(error => {
            console.error('Error fetching grid:', error);
            alert('读取失败，请确保输入了正确的ID');
        });
    }
    if (optionalGridId) {
        // 在读取新的条目前，把当前条目ID添加到历史记录中
        history.push(optionalGridId);
    }
}

// 当点击返回按钮时调用此函数
function goBack() {
    if (history.length > 1) {  // 确保有可以返回的历史记录
        history.pop();  // 移除当前查看的记录
        const lastViewedId = history.pop();  // 获取上一个条目的ID
        promptForIdAndLoadGrid(lastViewedId);  // 加载上一个条目
    } else {
        alert("没有更多的历史记录了！");
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

};

//分析格子内容
function analyzeContent(gridNumber) {
    let content = document.getElementById(`grid${gridNumber}`).textContent.trim();
    if (!content) {
        alert("格子为空，无法分析。");
        return;
    }

    // 如果内容包含中文冒号，只取冒号前面的部分
    const colonIndex = content.indexOf('：');
    if (colonIndex !== -1) {
        content = content.substring(0, colonIndex).trim();
    }

    // 编码标题以确保URL安全
    const encodedTitle = encodeURIComponent(content);
    fetch(`/api/check_title/${encodedTitle}`)
        .then(response => response.json())
        .then(data => {
            if (data.exists) {
                promptForIdAndLoadGrid(data.id); 
                // 如果存在，处理存在的逻辑，比如提示用户或加载内容
                // alert("这个主题已存在于数据库中。");
                // 这里可以添加代码来处理或显示现有主题的内容
            } else {
                // 如果不存在，提示用户是否创建
                if (confirm("这个主题不存在。是否创建新主题?")) {
                    document.getElementById('title-input').value = content; // 将内容填充到主题输入框
                    clearAll(); // 调用清空格子的函数
                }
            }
        })
        .catch(error => {
            console.error('Error analyzing content:', error);
            alert('分析过程中出错。');
        });
}

//显示查询等待窗口
function showLoadingIndicator() {
    document.getElementById('loadingIndicator').style.display = 'block';
}
//隐藏查询等待窗口
function hideLoadingIndicator() {
    document.getElementById('loadingIndicator').style.display = 'none';
}


//执行AI查询,搜索主题
function performAIQuery() {
    const term = document.getElementById('title-input').value.trim();
    if (!term) {
        alert("请输入查询的术语。");
        return;
    }
    showLoadingIndicator();  // 显示加载指示器
    fetch('/api/perform_query', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ term: term })
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingIndicator();  // 隐藏加载指示器
        if(data.error) {
            alert("错误: " + data.error);
        } else if(data.content) {
            // 使用返回的内容更新输入框
            document.getElementById('input-text').value = data.content;
        }
    })
    .catch(error => {
        hideLoadingIndicator();  // 隐藏加载指示器
        console.error('AI查询过程中出错:', error);
        alert('AI查询过程中出错');
    });
}

//执行AI查询,整理要点
function organizeInputWithAI() {
    // 从要点文本框中获取文本而不是主题框
    const inputText = document.getElementById('input-text').value.trim();

    //
    const promptType = "organize"


    if (!inputText) {
        alert("请输入要整理的要点。");
        return;
    }
    showLoadingIndicator();  // 显示加载指示器

    // 设置请求体包括术语和模板类型
    const requestBody = {
        term: inputText,
        prompt_type: promptType
    };


    fetch('/api/perform_query', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        // body: JSON.stringify({ term: inputText })
        body: JSON.stringify(requestBody) // 修改这里
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingIndicator();  // 隐藏加载指示器
        if(data.error) {
            alert("错误: " + data.error);
        } else if(data.content) {
            // 使用返回的内容更新要点文本框
            document.getElementById('input-text').value = data.content;
        }
    })
    .catch(error => {
        hideLoadingIndicator();  // 隐藏加载指示器
        console.error('AI整理过程中出错:', error);
        alert('AI整理过程中出错');
    });
}

//学习模式相关内容
// 1.标记学习模式是否激活
let isStudyModeOn = false;

// 2.激活学习模式的设置
function applyStudyMode() {
    //修改格子样式
    const gridItems = document.querySelectorAll('.grid-item');
    gridItems.forEach(item => {
        if (item.textContent.trim() !== '') {
            item.style.backgroundColor = 'grey'; // 设置背景色为灰色
            item.style.color = 'grey'; // 设置字体颜色为灰色，使内容“不可见”
        }
    });
    //修改按钮样式
    const button = document.getElementById('studyModeButton'); // 获取按钮
    button.textContent = '浏览模式';
    button.style.backgroundColor = '#6c757d';
}

//3.恢复单个格子颜色的函数
function revealGridContent(gridNumber) {
    const gridElement = document.getElementById(`grid${gridNumber}`);
    gridElement.style.backgroundColor = ''; // 恢复背景色
    gridElement.style.color = ''; // 恢复文字颜色
}

// 4.清除学习模式的设置，恢复正常模式
function clearStudyMode() {
    const gridItems = document.querySelectorAll('.grid-item');
    gridItems.forEach(item => {
        item.style.backgroundColor = ''; // 恢复原始背景色
        item.style.color = ''; // 恢复字体颜色
    });

    const button = document.getElementById('studyModeButton'); // 获取按钮
    button.textContent = '学习模式';
    button.style.backgroundColor = '#ffc107';
}



// 5.切换学习模式
function toggleStudyMode() {
    isStudyModeOn = !isStudyModeOn; // 切换状态
    if (isStudyModeOn) {
        // 激活学习模式
        applyStudyMode();
    } else {
        // 关闭学习模式
        clearStudyMode();
    }
}


//在主题框中查询数据库中的内容
//1.查询数据库
function queryDatabase() {
    const term = document.getElementById('title-input').value.trim();
    if (!term) {
        alert("请输入要查询的主题。");
        return;
    }
    
    // 发送查询请求到后端
    fetch(`/api/query_titles/${encodeURIComponent(term)}`)
    .then(response => response.json())
    .then(data => {
        if(data.error) {
            alert("查询出错: " + data.error);
        } else {
            // 显示查询结果模态框
            displayQueryResults(data.results);
        }
    })
    .catch(error => {
        console.error('查询数据库过程中出错:', error);
        alert('查询数据库过程中出错');
    });
}

//2.在框中展示搜索结果
function displayQueryResults(results) {
    // 获取结果列表元素
    const resultList = document.getElementById('query-result-list');
    resultList.innerHTML = ''; // 清空旧结果

    // 填充新结果
    results.forEach(result => {
        const li = document.createElement('li');
        li.textContent = result.title;
        li.onclick = function() { promptForIdAndLoadGrid(result.id); }; // 点击时调用读取逻辑
        resultList.appendChild(li);
    });

    // 显示模态框
    document.getElementById('query-result-modal').style.display = 'block';
}

// 关闭模态框
document.getElementsByClassName("close")[0].onclick = function() {
    document.getElementById('query-result-modal').style.display = "none";
}


//编辑数据库数据
// 1打开编辑模态窗口
function editRecord() {
    const idToEdit = prompt("请输入要编辑的条目ID:");
    if (idToEdit) {
        // 假设 fetchRecordDetails 是一个函数，用于获取指定ID的记录详情
        fetchRecordDetails(idToEdit).then(data => {
            // 使用获取到的数据填充输入字段
            document.getElementById('edit-id').value = data.id;
            document.getElementById('edit-title').value = data.title;
            document.getElementById('edit-grid1').value = data.grid1;
            // ...填充其他格子...
            // 显示模态窗口
            document.getElementById('edit-modal').style.display = 'block';
        });
    }
}

// 2关闭编辑模态窗口
// function closeEditModal() {
//     document.getElementById('edit-modal').style.display = 'none';
// }
function closeModifyModal() {
    document.getElementById('modify-modal').style.display = 'none';
}



// 3保存更改并更新数据库
function saveEditedRecord() {
    const id = document.getElementById('edit-id').value;
    const updatedData = {
        title: document.getElementById('edit-title').value,
        grid1: document.getElementById('edit-grid1').value,
        // ...其他格子的数据...
    };
    // 假设 updateRecord 是一个函数，用于发送更新请求到后端
    updateRecord(id, updatedData).then(response => {
        alert("更新成功！");
        closeEditModal();
        // 可以在这里添加逻辑来更新页面上显示的数据
    }).catch(error => {
        alert("更新失败：" + error);
    });
}


// 4当点击修改条目按钮时调用此函数
function modifyGrid() {
    const gridId = prompt("请输入要修改的条目ID:");
    if (gridId) {
        fetch(`/api/grids/${gridId}`)
        .then(response => response.json())
        .then(grid => {
            // 用获取到的格子数据填充修改表单
            fillModifyForm(grid);
        })
        .catch(error => {
            console.error('Error fetching grid for modification:', error);
            alert('获取数据失败，请确保输入了正确的ID');
        });
    }
}

// 5用格子数据填充修改表单的函数
function fillModifyForm(grid) {
    document.getElementById('modify-title').value = grid.title;
    for (let i = 1; i <= 9; i++) {
        document.getElementById(`modify-grid${i}`).value = grid[`grid${i}`];
    }
    document.getElementById('modify-reference').value = grid.reference;
    document.getElementById('modify-id').value = grid.id; // 存储要修改的条目的ID

    // 显示修改表单的模态窗口
    document.getElementById('modify-modal').style.display = 'block';
}

// 6提交修改的函数
function submitModification() {
    const id = document.getElementById('modify-id').value;
    const title = document.getElementById('modify-title').value.trim();
    const reference = document.getElementById('modify-reference').value.trim();
    const grids = [];
    for (let i = 1; i <= 9; i++) {
        grids.push(document.getElementById(`modify-grid${i}`).value.trim());
    }

    fetch(`/api/grids/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, grids, reference })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Modification success:', data);
        alert('条目已成功修改');
        // 关闭修改表单的模态窗口
        document.getElementById('modify-modal').style.display = 'none';
    })
    .catch(error => {
        console.error('Modification error:', error);
        alert('修改失败');
    });
    // 提交成功后关闭模态窗口
    closeModifyModal();
}
