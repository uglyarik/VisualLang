// ==============================================
// ВИЗУАЛЬНЫЙ ЯЗЫК ПРОГРАММИРОВАНИЯ
// УВЕЛИЧЕННАЯ РАБОЧАЯ ЗОНА + ИСПРАВЛЕННОЕ ПРИСВАИВАНИЕ
// ==============================================

// ---------- ГЛОБАЛЬНЫЕ ДАННЫЕ ----------
window.globalVariables = {};
window.globalArrays = {};
window.outputLog = [];

let blockCounter = 0;
let availableBlockIds = [];
let workspaceScale = 1.2; // Уменьшен начальный масштаб для большей видимой области
let draggingBlock = null;
let dragOffset = { x: 0, y: 0 };
let dropTarget = null;

// Словарь для связи блоков с переменными/массивами
let blockDeclarations = {
    variables: {},
    arrays: {}
};

// ---------- ИНИЦИАЛИЗАЦИЯ ----------
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Система готова');
    
    window.runCode = runCode;
    window.clearWorkspace = clearWorkspace;
    window.clearOutput = clearOutput;
    window.saveProject = saveProject;
    window.loadProject = loadProject;
    window.deleteBlock = deleteBlock;
    
    updateVariablesDisplay();
    updateArraysDisplay();
    updateOutputDisplay('👋 Добро пожаловать!');
    
    initTabs();
    initPaletteDrag();
    initWorkspace();
    initWorkspaceControls();
    initDeleteKey();
    initCursorFix();
    
    // Применяем начальный масштаб
    document.getElementById('workspace').style.transform = `scale(${workspaceScale})`;
});

// ---------- ФИКС КУРСОРА ----------
function initCursorFix() {
    const style = document.createElement('style');
    style.textContent = `
        input, select, textarea, button,
        .block-input, .block-select,
        input[type="text"], input[type="number"],
        input[type="text"]:hover, input[type="number"]:hover,
        .block-input:hover, .block-select:hover,
        input[type="text"]:focus, input[type="number"]:focus,
        .block-input:focus, .block-select:focus {
            cursor: text !important;
            caret-color: var(--dark) !important;
        }
        
        .block-header {
            cursor: grab !important;
        }
        .block-header:active {
            cursor: grabbing !important;
        }
        
        button, .btn, .block-delete,
        button:hover, .btn:hover, .block-delete:hover,
        button:active, .btn:active, .block-delete:active {
            cursor: pointer !important;
        }
    `;
    document.head.appendChild(style);
}

// ---------- ВКЛАДКИ ----------
function initTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            const tabName = this.dataset.tab;
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

// ---------- УДАЛЕНИЕ ЧЕРЕЗ DELETE ----------
function initDeleteKey() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Delete' || e.key === 'Del') {
            const selected = document.querySelectorAll('.workspace-block.selected');
            selected.forEach(block => deleteBlock(block.id));
        }
    });
    
    document.addEventListener('click', function(e) {
        const block = e.target.closest('.workspace-block');
        if (block) {
            if (e.ctrlKey) {
                block.classList.toggle('selected');
            } else {
                document.querySelectorAll('.workspace-block.selected').forEach(b => {
                    b.classList.remove('selected');
                });
                block.classList.add('selected');
            }
        } else {
            document.querySelectorAll('.workspace-block.selected').forEach(b => {
                b.classList.remove('selected');
            });
        }
    });
}

// ---------- ПАЛИТРА БЛОКОВ ----------
function initPaletteDrag() {
    document.querySelectorAll('.block-item[draggable="true"]').forEach(block => {
        block.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', this.dataset.type);
            e.dataTransfer.setData('text/title', this.querySelector('.block-title')?.textContent || '');
            e.dataTransfer.setData('text/color', this.querySelector('.block-color')?.style.background || '#6366f1');
            e.dataTransfer.setData('text/from-palette', 'true');
            
            this.style.opacity = '0.5';
        });
        
        block.addEventListener('dragend', function() {
            this.style.opacity = '1';
        });
    });
}

// ---------- РАБОЧАЯ ОБЛАСТЬ ----------
function initWorkspace() {
    const workspace = document.getElementById('workspace');
    if (!workspace) return;

    workspace.addEventListener('dragover', (e) => e.preventDefault());

    workspace.addEventListener('drop', function(e) {
        e.preventDefault();
        
        const fromPalette = e.dataTransfer.getData('text/from-palette');
        if (fromPalette) {
            const type = e.dataTransfer.getData('text/plain');
            const title = e.dataTransfer.getData('text/title');
            const color = e.dataTransfer.getData('text/color');
            createBlock(type, title, color, e.clientX, e.clientY);
        }
    });

    workspace.addEventListener('mousedown', startBlockDrag);
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
}

// ---------- DRAG СУЩЕСТВУЮЩИХ БЛОКОВ ----------
function startBlockDrag(e) {
    const header = e.target.closest('.block-header');
    if (!header) return;
    
    const block = header.closest('.workspace-block');
    if (!block) return;
    
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'BUTTON') return;
    
    e.preventDefault();
    
    draggingBlock = block;
    block.classList.add('dragging');
    
    const rect = block.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    
    const workspace = document.getElementById('workspace');
    const workspaceRect = workspace.getBoundingClientRect();
    
    block.dataset.originalX = block.style.left;
    block.dataset.originalY = block.style.top;
    block.dataset.originalParent = block.parentElement.id;
    
    block.style.position = 'absolute';
    block.style.left = (rect.left - workspaceRect.left) + 'px';
    block.style.top = (rect.top - workspaceRect.top) + 'px';
    block.style.width = block.offsetWidth + 'px';
    block.style.zIndex = '1000';
}

function onDrag(e) {
    if (!draggingBlock) return;
    
    e.preventDefault();
    
    const workspace = document.getElementById('workspace');
    const rect = workspace.getBoundingClientRect();
    
    let x = e.clientX - rect.left - dragOffset.x;
    let y = e.clientY - rect.top - dragOffset.y;
    
    x = Math.max(0, Math.min(x, rect.width - draggingBlock.offsetWidth));
    y = Math.max(0, Math.min(y, rect.height - draggingBlock.offsetHeight));
    
    draggingBlock.style.left = x + 'px';
    draggingBlock.style.top = y + 'px';
    
    findDropTarget(e);
}

function endDrag(e) {
    if (!draggingBlock) return;
    
    document.querySelectorAll('.drop-target').forEach(el => {
        el.classList.remove('drop-target');
    });
    
    if (dropTarget) {
        insertIntoContainer(draggingBlock, dropTarget);
    } else {
        const workspace = document.getElementById('workspace');
        workspace.appendChild(draggingBlock);
        draggingBlock.style.position = 'absolute';
    }
    
    draggingBlock.classList.remove('dragging');
    draggingBlock.style.zIndex = '';
    draggingBlock = null;
    dropTarget = null;
}

function findDropTarget(e) {
    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    let found = null;
    
    for (let el of elements) {
        if (el.classList && (
            el.classList.contains('slot') ||
            el.classList.contains('then-block') ||
            el.classList.contains('else-block') ||
            el.classList.contains('body-container') ||
            el.classList.contains('begin-body') ||
            el.classList.contains('while-body') ||
            el.classList.contains('for-init') ||
            el.classList.contains('for-condition') ||
            el.classList.contains('for-step') ||
            el.classList.contains('for-body')
        )) {
            found = el;
            break;
        }
    }
    
    document.querySelectorAll('.drop-target').forEach(el => {
        el.classList.remove('drop-target');
    });
    
    if (found) {
        found.classList.add('drop-target');
        dropTarget = found;
    } else {
        dropTarget = null;
    }
}

function insertIntoContainer(block, container) {
    block.style.position = 'relative';
    block.style.left = '0';
    block.style.top = '0';
    block.style.width = '240px'; // Увеличен размер
    block.style.margin = '8px 0';
    block.style.fontSize = '13px';
    
    const placeholder = container.querySelector('.placeholder');
    if (placeholder) placeholder.remove();
    
    container.appendChild(block);
    
    // Проверяем присваивание
    if (container.classList.contains('assign-value')) {
        updateAssignFromBlock(block);
    }
    
    // Проверяем арифметику
    if (container.classList.contains('arithmetic-left') || container.classList.contains('arithmetic-right')) {
        updateArithmeticResult(container.closest('.workspace-block[data-type="math_arithmetic"]'));
    }
    
    window.outputLog.push('📦 Блок вставлен');
    updateOutputDisplay();
}

// ---------- ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ЗНАЧЕНИЯ ИЗ БЛОКА ----------
function getValueFromBlock(block) {
    if (!block) return 0;
    
    const type = block.dataset.type;
    
    switch(type) {
        case 'math_number':
            const numInput = block.querySelector('input[type="number"]');
            return parseFloat(numInput?.value) || 0;
            
        case 'variable':
            const varInput = block.querySelector('input[placeholder="имя переменной"]');
            const varName = varInput?.value.trim();
            return window.globalVariables[varName] || 0;
            
        case 'array_element':
            // Для элемента массива (будет реализовано позже)
            return 0;
            
        default:
            return 0;
    }
}

// ---------- ОБНОВЛЕНИЕ ПРИСВАИВАНИЯ ----------
function updateAssignFromBlock(valueBlock) {
    if (!valueBlock) return;
    
    const assignBlock = valueBlock.closest('.workspace-block[data-type="assign"]');
    if (!assignBlock) return;
    
    const varInput = assignBlock.querySelector('input[placeholder="переменная"]');
    const targetVar = varInput?.value.trim();
    
    if (!targetVar) return;
    
    const value = getValueFromBlock(valueBlock);
    window.globalVariables[targetVar] = value;
    
    updateVariablesDisplay();
    
    const sourceType = valueBlock.dataset.type;
    const sourceName = sourceType === 'variable' 
        ? valueBlock.querySelector('input[placeholder="имя переменной"]')?.value.trim() 
        : valueBlock.querySelector('input[type="number"]')?.value;
    
    window.outputLog.push(`📝 ${targetVar} = ${sourceName || value} (${sourceType === 'variable' ? 'переменная' : 'число'})`);
    updateOutputDisplay();
}

// ---------- АРИФМЕТИКА ----------
function updateArithmeticResult(arithBlock) {
    if (!arithBlock) return;
    
    const leftSlot = arithBlock.querySelector('.arithmetic-left');
    const rightSlot = arithBlock.querySelector('.arithmetic-right');
    const opSelect = arithBlock.querySelector('select');
    const resultDiv = arithBlock.querySelector('[id^="result-"]');
    
    if (!leftSlot || !rightSlot || !opSelect || !resultDiv) return;
    
    const leftBlock = leftSlot.querySelector('.workspace-block');
    const rightBlock = rightSlot.querySelector('.workspace-block');
    
    const leftVal = leftBlock ? getValueFromBlock(leftBlock) : 0;
    const rightVal = rightBlock ? getValueFromBlock(rightBlock) : 0;
    const op = opSelect.value;
    
    let result = 0;
    switch(op) {
        case 'ADD': result = leftVal + rightVal; break;
        case 'MINUS': result = leftVal - rightVal; break;
        case 'MULTIPLY': result = leftVal * rightVal; break;
        case 'DIVIDE': result = rightVal !== 0 ? Math.floor(leftVal / rightVal) : 0; break;
        case 'MOD': result = rightVal !== 0 ? leftVal % rightVal : 0; break;
    }
    
    resultDiv.textContent = `= ${result}`;
}

// ---------- ПОЛУЧЕНИЕ НОВОГО ID ----------
function getNextBlockId() {
    if (availableBlockIds.length > 0) {
        const id = Math.min(...availableBlockIds);
        availableBlockIds = availableBlockIds.filter(i => i !== id);
        return `block-${id}`;
    } else {
        blockCounter++;
        return `block-${blockCounter}`;
    }
}

// ---------- СОЗДАНИЕ БЛОКА ----------
function createBlock(type, title, color, x, y) {
    const workspace = document.getElementById('workspace');
    if (!workspace) return null;
    
    const blockId = getNextBlockId();
    const blockNumber = blockId.split('-')[1];
    
    const block = document.createElement('div');
    block.className = 'workspace-block';
    block.id = blockId;
    block.dataset.type = type;
    
    const rect = workspace.getBoundingClientRect();
    block.style.position = 'absolute';
    block.style.left = (x - rect.left - 90) + 'px';
    block.style.top = (y - rect.top - 30) + 'px';
    block.style.width = type === 'for_loop' ? '320px' : '280px'; // Увеличены размеры
    block.style.fontSize = '13px';
    
    block.innerHTML = generateBlockHTML(type, blockId, title, color);
    
    workspace.appendChild(block);
    
    window.outputLog.push(`📦 Создан блок: ${title || type} (ID: ${blockNumber})`);
    updateOutputDisplay();
    
    return block;
}

// ---------- ГЕНЕРАЦИЯ HTML БЛОКА ----------
function generateBlockHTML(type, blockId, title, color) {
    let content = '';
    
    switch(type) {
        case 'declare_vars':
            content = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: var(--gray); font-size:16px;">📦</span>
                    <input type="text" class="block-input" value="" 
                           placeholder="x, y, z"
                           onchange="window.updateVars(this, '${blockId}')"
                           style="flex:1; padding:4px 8px; font-size:13px;">
                </div>
            `;
            break;
            
        case 'declare_array':
            content = `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: var(--gray); font-size:16px;">📚</span>
                        <input type="text" class="block-input" value="" 
                               placeholder="имя"
                               onchange="window.updateArrayName(this, '${blockId}')"
                               style="width:100px; padding:4px 8px; font-size:13px;">
                    </div>
                    <div style="margin-left: 24px; display: flex; align-items: center; gap: 8px;">
                        <span style="color: var(--gray); font-size:12px;">📏 размер:</span>
                        <select class="block-select" onchange="window.updateArraySizeType(this, '${blockId}')" 
                                style="width:80px; padding:3px; font-size:12px;">
                            <option value="number">число</option>
                            <option value="variable">переменная</option>
                        </select>
                        <div id="size-input-${blockId}" style="display: flex; align-items: center;">
                            <input type="number" class="block-input" value="5" min="1" 
                                   onchange="window.updateArraySizeValue(this, '${blockId}')"
                                   style="width:60px; padding:3px 6px; font-size:12px;">
                        </div>
                        <div id="size-var-${blockId}" style="display: none; align-items: center;">
                            <input type="text" class="block-input" value="n" 
                                   onchange="window.updateArraySizeValue(this, '${blockId}')"
                                   style="width:60px; padding:3px 6px; font-size:12px;">
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'variable':
            content = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: var(--gray); font-size:16px;">🔤</span>
                    <input type="text" class="block-input" value="" 
                           placeholder="имя"
                           onchange="window.updateVarName(this, '${blockId}')"
                           oninput="window.updateVarName(this, '${blockId}')"
                           style="width:120px; padding:4px 8px; font-size:13px;">
                </div>
            `;
            break;
            
        case 'array_element':
            content = `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: var(--gray); font-size:16px;">📌</span>
                        <input type="text" class="block-input" value="" 
                               placeholder="массив"
                               onchange="window.updateArrayElemName(this, '${blockId}')"
                               style="width:120px; padding:4px 8px; font-size:13px;">
                    </div>
                    <div style="margin-left: 24px;">
                        <span style="color: var(--gray); font-size:12px;">🎯 индекс:</span>
                        <div class="slot array-index" style="min-height:35px; border:1px dashed var(--border); border-radius:4px; margin-top:4px; padding:6px;">
                            <span class="placeholder" style="font-size:12px;">⬇️ перетащите</span>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'assign':
            content = `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: var(--gray); font-size:16px;">📝</span>
                        <input type="text" class="block-input" value="" 
                               placeholder="переменная"
                               onchange="window.updateAssignVar(this, '${blockId}')"
                               style="width:120px; padding:4px 8px; font-size:13px;">
                    </div>
                    <div style="margin-left: 24px;">
                        <span style="color: var(--gray); font-size:12px;">= значение:</span>
                        <div class="slot assign-value" style="min-height:35px; border:1px dashed var(--border); border-radius:4px; margin-top:4px; padding:6px;">
                            <span class="placeholder" style="font-size:12px;">⬇️ перетащите</span>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'math_number':
            content = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: var(--gray); font-size:16px;">#</span>
                    <input type="number" class="block-input" value="0" 
                           onchange="window.updateNumber(this, '${blockId}')"
                           oninput="window.updateNumber(this, '${blockId}')"
                           style="width:120px; padding:4px 8px; font-size:13px;">
                </div>
            `;
            break;
            
        case 'math_arithmetic':
            content = `
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: var(--gray); font-size:16px;">🧮</span>
                        <select class="block-select" onchange="window.updateArithmeticOp(this, '${blockId}')" 
                                style="width:70px; padding:3px; font-size:12px;">
                            <option value="ADD">+</option>
                            <option value="MINUS">-</option>
                            <option value="MULTIPLY">×</option>
                            <option value="DIVIDE">÷</option>
                            <option value="MOD">%</option>
                        </select>
                    </div>
                    <div style="display: flex; gap: 10px; margin-left: 24px;">
                        <div style="flex:1;">
                            <span style="color: var(--gray); font-size:11px;">левый:</span>
                            <div class="slot arithmetic-left" style="min-height:35px; border:1px dashed var(--border); border-radius:4px; margin-top:2px; padding:6px;">
                                <span class="placeholder" style="font-size:11px;">⬇️</span>
                            </div>
                        </div>
                        <div style="flex:1;">
                            <span style="color: var(--gray); font-size:11px;">правый:</span>
                            <div class="slot arithmetic-right" style="min-height:35px; border:1px dashed var(--border); border-radius:4px; margin-top:2px; padding:6px;">
                                <span class="placeholder" style="font-size:11px;">⬇️</span>
                            </div>
                        </div>
                    </div>
                    <div style="font-size:13px; color:var(--primary); text-align:center; margin-top:4px; font-weight:500;" id="result-${blockId}">
                        = 0
                    </div>
                </div>
            `;
            break;
            
        case 'comparison':
            content = `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: var(--gray); font-size:16px;">🔍</span>
                        <select class="block-select" onchange="window.updateComparisonOp(this, '${blockId}')" 
                                style="width:70px; padding:3px; font-size:12px;">
                            <option value="=">=</option>
                            <option value="!=">≠</option>
                            <option value=">">></option>
                            <option value="<"><</option>
                            <option value=">=">≥</option>
                            <option value="<=">≤</option>
                        </select>
                    </div>
                    <div style="display: flex; gap: 10px; margin-left: 24px;">
                        <div style="flex:1;">
                            <span style="color: var(--gray); font-size:11px;">левая:</span>
                            <div class="slot comp-left" style="min-height:35px; border:1px dashed var(--border); border-radius:4px; margin-top:2px; padding:6px;">
                                <span class="placeholder" style="font-size:11px;">⬇️</span>
                            </div>
                        </div>
                        <div style="flex:1;">
                            <span style="color: var(--gray); font-size:11px;">правая:</span>
                            <div class="slot comp-right" style="min-height:35px; border:1px dashed var(--border); border-radius:4px; margin-top:2px; padding:6px;">
                                <span class="placeholder" style="font-size:11px;">⬇️</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'logic_and':
        case 'logic_or':
            content = `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: var(--gray); font-size:16px;">🧠</span>
                        <span style="font-weight:600; font-size:13px;">${type === 'logic_and' ? 'И' : 'ИЛИ'}</span>
                    </div>
                    <div style="display: flex; gap: 10px; margin-left: 24px;">
                        <div style="flex:1;">
                            <span style="color: var(--gray); font-size:11px;">усл.1:</span>
                            <div class="slot logic-left" style="min-height:35px; border:1px dashed var(--border); border-radius:4px; margin-top:2px; padding:6px;">
                                <span class="placeholder" style="font-size:11px;">⬇️</span>
                            </div>
                        </div>
                        <div style="flex:1;">
                            <span style="color: var(--gray); font-size:11px;">усл.2:</span>
                            <div class="slot logic-right" style="min-height:35px; border:1px dashed var(--border); border-radius:4px; margin-top:2px; padding:6px;">
                                <span class="placeholder" style="font-size:11px;">⬇️</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'logic_not':
            content = `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: var(--gray); font-size:16px;">🧠</span>
                        <span style="font-weight:600; font-size:13px;">НЕ</span>
                    </div>
                    <div style="margin-left: 24px;">
                        <span style="color: var(--gray); font-size:11px;">условие:</span>
                        <div class="slot logic-not" style="min-height:35px; border:1px dashed var(--border); border-radius:4px; margin-top:2px; padding:6px;">
                            <span class="placeholder" style="font-size:11px;">⬇️</span>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'if_block':
            content = `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: var(--gray); font-size:16px;">🤔</span>
                        <span style="font-weight:600; font-size:13px;">ЕСЛИ</span>
                    </div>
                    <div style="margin-left: 24px;">
                        <span style="color: var(--gray); font-size:11px;">условие:</span>
                        <div class="slot condition" style="min-height:35px; border:1px dashed var(--border); border-radius:4px; margin-top:2px; padding:6px;">
                            <span class="placeholder" style="font-size:11px;">⬇️ перетащите</span>
                        </div>
                    </div>
                    <div style="margin-left: 24px; margin-top:6px;">
                        <span style="color: var(--gray); font-size:11px;">ТОГДА:</span>
                        <div class="then-block body-container" style="min-height:50px; border-left:3px solid var(--primary); margin-top:2px; padding:8px;">
                            <span class="placeholder" style="font-size:11px;">⬇️ блоки</span>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'else_block':
            content = `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: var(--gray); font-size:16px;">🤔</span>
                        <span style="font-weight:600; font-size:13px;">ИНАЧЕ</span>
                    </div>
                    <div style="margin-left: 24px;">
                        <div class="else-block body-container" style="min-height:50px; border-left:3px solid var(--warning); margin-top:2px; padding:8px;">
                            <span class="placeholder" style="font-size:11px;">⬇️ блоки</span>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'if_else_block':
            content = `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: var(--gray); font-size:16px;">🤔</span>
                        <span style="font-weight:600; font-size:13px;">ЕСЛИ-ИНАЧЕ</span>
                    </div>
                    <div style="margin-left: 24px;">
                        <span style="color: var(--gray); font-size:11px;">условие:</span>
                        <div class="slot condition" style="min-height:35px; border:1px dashed var(--border); border-radius:4px; margin-top:2px; padding:6px;">
                            <span class="placeholder" style="font-size:11px;">⬇️ перетащите</span>
                        </div>
                    </div>
                    <div style="margin-left: 24px; margin-top:6px;">
                        <span style="color: var(--gray); font-size:11px;">ТОГДА:</span>
                        <div class="then-block body-container" style="min-height:50px; border-left:3px solid var(--primary); margin-top:2px; padding:8px;">
                            <span class="placeholder" style="font-size:11px;">⬇️ блоки</span>
                        </div>
                    </div>
                    <div style="margin-left: 24px; margin-top:6px;">
                        <span style="color: var(--gray); font-size:11px;">ИНАЧЕ:</span>
                        <div class="else-block body-container" style="min-height:50px; border-left:3px solid var(--warning); margin-top:2px; padding:8px;">
                            <span class="placeholder" style="font-size:11px;">⬇️ блоки</span>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'while_loop':
            content = `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: var(--gray); font-size:16px;">🔄</span>
                        <span style="font-weight:600; font-size:13px;">ПОКА</span>
                    </div>
                    <div style="margin-left: 24px;">
                        <span style="color: var(--gray); font-size:11px;">условие:</span>
                        <div class="slot condition" style="min-height:35px; border:1px dashed var(--border); border-radius:4px; margin-top:2px; padding:6px;">
                            <span class="placeholder" style="font-size:11px;">⬇️ перетащите</span>
                        </div>
                    </div>
                    <div style="margin-left: 24px; margin-top:6px;">
                        <span style="color: var(--gray); font-size:11px;">ТЕЛО:</span>
                        <div class="while-body body-container" style="min-height:50px; border-left:3px solid #ff5722; margin-top:2px; padding:8px;">
                            <span class="placeholder" style="font-size:11px;">⬇️ блоки</span>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'for_loop':
            content = `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: var(--gray); font-size:16px;">🔄</span>
                        <span style="font-weight:600; font-size:13px;">ДЛЯ</span>
                    </div>
                    <div style="margin-left: 24px;">
                        <span style="color: var(--gray); font-size:11px;">📋 иниц.:</span>
                        <div class="for-init body-container" style="min-height:40px; border-left:3px solid #ff8a65; margin-top:2px; padding:6px;">
                            <span class="placeholder" style="font-size:11px;">⬇️ присваивание</span>
                        </div>
                    </div>
                    <div style="margin-left: 24px; margin-top:6px;">
                        <span style="color: var(--gray); font-size:11px;">🔍 условие:</span>
                        <div class="for-condition body-container" style="min-height:40px; border-left:3px solid #ff8a65; margin-top:2px; padding:6px;">
                            <span class="placeholder" style="font-size:11px;">⬇️ сравнение</span>
                        </div>
                    </div>
                    <div style="margin-left: 24px; margin-top:6px;">
                        <span style="color: var(--gray); font-size:11px;">📈 шаг:</span>
                        <div class="for-step body-container" style="min-height:40px; border-left:3px solid #ff8a65; margin-top:2px; padding:6px;">
                            <span class="placeholder" style="font-size:11px;">⬇️ присваивание</span>
                        </div>
                    </div>
                    <div style="margin-left: 24px; margin-top:6px;">
                        <span style="color: var(--gray); font-size:11px;">📦 тело:</span>
                        <div class="for-body body-container" style="min-height:50px; border-left:3px solid #ff8a65; margin-top:2px; padding:8px;">
                            <span class="placeholder" style="font-size:11px;">⬇️ блоки</span>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'begin_end':
            content = `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: var(--gray); font-size:16px;">📋</span>
                        <span style="font-weight:600; font-size:13px; color:#607d8b;">BEGIN</span>
                    </div>
                    <div class="begin-body body-container" style="margin-left:20px; min-height:50px; border-left:3px solid #607d8b; margin-top:2px; padding:8px;">
                        <span class="placeholder" style="font-size:11px;">⬇️ блоки</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-top:6px;">
                        <span style="color: var(--gray); font-size:16px;">🔚</span>
                        <span style="font-weight:600; font-size:13px; color:#607d8b;">END</span>
                    </div>
                </div>
            `;
            break;
    }
    
    return `
        <div class="block-header" style="cursor:grab; padding:10px 14px; background:#f8fafc; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:8px;">
                <div style="width:4px; height:22px; background:${color || '#6366f1'}; border-radius:3px;"></div>
                <span style="font-weight:600; font-size:13px; color:${color || '#6366f1'};">${title || type}</span>
                <span style="font-size:10px; color:var(--gray); background:white; padding:2px 6px; border-radius:12px;">${blockId.split('-')[1]}</span>
            </div>
            <button class="block-delete" onclick="window.deleteBlock('${blockId}')" style="background:none; border:none; color:var(--gray); cursor:pointer; padding:8px; border-radius:4px;">
                <i class="fas fa-times" style="font-size:16px;"></i>
            </button>
        </div>
        <div class="block-body" style="padding:14px;">
            ${content}
        </div>
    `;
}

// ---------- ОБРАБОТЧИКИ МАССИВОВ ----------
window.updateArrayName = function(input, blockId) {
    const oldName = blockDeclarations.arrays[blockId]?.name;
    const newName = input.value.trim();
    
    if (oldName && oldName !== newName) {
        let usedElsewhere = false;
        Object.keys(blockDeclarations.arrays).forEach(bid => {
            if (bid !== blockId && blockDeclarations.arrays[bid]?.name === oldName) {
                usedElsewhere = true;
            }
        });
        if (!usedElsewhere) {
            delete window.globalArrays[oldName];
        }
    }
    
    if (newName && !window.globalArrays[newName]) {
        const size = blockDeclarations.arrays[blockId]?.size || 5;
        window.globalArrays[newName] = new Array(size).fill(0);
    }
    
    blockDeclarations.arrays[blockId] = {
        name: newName,
        size: blockDeclarations.arrays[blockId]?.size || 5,
        sizeType: blockDeclarations.arrays[blockId]?.sizeType || 'number',
        sizeValue: blockDeclarations.arrays[blockId]?.sizeValue || '5'
    };
    
    updateArraysDisplay();
    if (newName) window.outputLog.push(`📚 Массив: ${newName}`);
    updateOutputDisplay();
};

window.updateArraySizeType = function(select, blockId) {
    const sizeType = select.value;
    
    if (!blockDeclarations.arrays[blockId]) {
        blockDeclarations.arrays[blockId] = {
            name: '',
            sizeType: sizeType,
            sizeValue: sizeType === 'number' ? '5' : 'n',
            size: 5
        };
    } else {
        blockDeclarations.arrays[blockId].sizeType = sizeType;
    }
    
    const sizeInput = document.getElementById(`size-input-${blockId}`);
    const sizeVar = document.getElementById(`size-var-${blockId}`);
    
    if (sizeInput && sizeVar) {
        sizeInput.style.display = sizeType === 'number' ? 'flex' : 'none';
        sizeVar.style.display = sizeType === 'variable' ? 'flex' : 'none';
    }
    
    updateArraySizeWithType(blockId);
};

window.updateArraySizeValue = function(input, blockId) {
    if (!blockDeclarations.arrays[blockId]) {
        blockDeclarations.arrays[blockId] = {
            name: '',
            sizeType: 'number',
            sizeValue: input.value,
            size: parseInt(input.value) || 5
        };
    } else {
        blockDeclarations.arrays[blockId].sizeValue = input.value;
    }
    
    updateArraySizeWithType(blockId);
};

function updateArraySizeWithType(blockId) {
    const arrayInfo = blockDeclarations.arrays[blockId];
    if (!arrayInfo || !arrayInfo.name) return;
    
    const name = arrayInfo.name;
    let size = 5;
    
    if (arrayInfo.sizeType === 'number') {
        size = parseInt(arrayInfo.sizeValue);
        if (isNaN(size) || size < 1) size = 5;
        if (size > 100) size = 100;
    } else {
        size = 1;
    }
    
    arrayInfo.size = size;
    
    if (window.globalArrays[name]) {
        const old = window.globalArrays[name];
        const arr = new Array(size).fill(0);
        for (let i = 0; i < Math.min(old.length, size); i++) arr[i] = old[i];
        window.globalArrays[name] = arr;
    } else {
        window.globalArrays[name] = new Array(size).fill(0);
    }
    
    updateArraysDisplay();
}

// ---------- ОБРАБОТЧИКИ ПЕРЕМЕННЫХ ----------
window.updateVars = function(input, blockId) {
    if (blockDeclarations.variables[blockId]) {
        blockDeclarations.variables[blockId].forEach(oldVar => {
            let usedElsewhere = false;
            Object.keys(blockDeclarations.variables).forEach(bid => {
                if (bid !== blockId && blockDeclarations.variables[bid]?.includes(oldVar)) {
                    usedElsewhere = true;
                }
            });
            if (!usedElsewhere) delete window.globalVariables[oldVar];
        });
    }
    
    const vars = input.value.split(',').map(v => v.trim()).filter(v => v);
    vars.forEach(v => { if(v && !window.globalVariables[v]) window.globalVariables[v] = 0; });
    
    blockDeclarations.variables[blockId] = vars;
    
    updateVariablesDisplay();
    window.outputLog.push(`📦 Переменные: ${input.value}`);
    updateOutputDisplay();
};

window.updateVarName = function(input, blockId) {
    const name = input.value.trim();
    const block = document.getElementById(blockId);
    
    if (name && !window.globalVariables[name]) {
        window.globalVariables[name] = 0;
        updateVariablesDisplay();
    }
    
    const parentSlot = block?.closest('.assign-value');
    if (parentSlot) updateAssignFromBlock(block);
    
    const arithSlot = block?.closest('.arithmetic-left, .arithmetic-right');
    if (arithSlot) updateArithmeticResult(arithSlot.closest('.workspace-block[data-type="math_arithmetic"]'));
};

window.updateNumber = function(input, blockId) {
    const block = document.getElementById(blockId);
    const parentSlot = block?.parentElement;
    
    if (parentSlot?.classList.contains('assign-value')) {
        updateAssignFromBlock(block);
    }
    
    const arithSlot = block?.closest('.arithmetic-left, .arithmetic-right');
    if (arithSlot) updateArithmeticResult(arithSlot.closest('.workspace-block[data-type="math_arithmetic"]'));
};

window.updateAssignVar = function(input, blockId) {
    const block = document.getElementById(blockId);
    const valueSlot = block?.querySelector('.assign-value .workspace-block');
    if (valueSlot) updateAssignFromBlock(valueSlot);
};

window.updateArithmeticOp = function(select, blockId) {
    updateArithmeticResult(document.getElementById(blockId));
};

window.updateComparisonOp = function(select, blockId) {
    window.outputLog.push(`🔍 Сравнение: ${select.value}`);
    updateOutputDisplay();
};

// ---------- УДАЛЕНИЕ БЛОКА ----------
window.deleteBlock = function(blockId) {
    const block = document.getElementById(blockId);
    if(!block) return;
    
    const blockType = block.dataset.type;
    const blockNumber = parseInt(blockId.split('-')[1]);
    
    if (blockType === 'declare_vars' && blockDeclarations.variables[blockId]) {
        const vars = blockDeclarations.variables[blockId];
        vars.forEach(varName => {
            let usedElsewhere = false;
            Object.keys(blockDeclarations.variables).forEach(bid => {
                if (bid !== blockId && blockDeclarations.variables[bid]?.includes(varName)) {
                    usedElsewhere = true;
                }
            });
            if (!usedElsewhere) {
                delete window.globalVariables[varName];
                window.outputLog.push(`🗑️ Удалена переменная: ${varName}`);
            }
        });
        delete blockDeclarations.variables[blockId];
    }
    
    if (blockType === 'declare_array' && blockDeclarations.arrays[blockId]) {
        const arrayName = blockDeclarations.arrays[blockId].name;
        let usedElsewhere = false;
        Object.keys(blockDeclarations.arrays).forEach(bid => {
            if (bid !== blockId && blockDeclarations.arrays[bid]?.name === arrayName) {
                usedElsewhere = true;
            }
        });
        if (!usedElsewhere && arrayName) {
            delete window.globalArrays[arrayName];
            window.outputLog.push(`🗑️ Удален массив: ${arrayName}`);
        }
        delete blockDeclarations.arrays[blockId];
    }
    
    if(!availableBlockIds.includes(blockNumber)) {
        availableBlockIds.push(blockNumber);
        availableBlockIds.sort((a, b) => a - b);
    }
    
    block.remove();
    
    window.outputLog.push(`🗑️ Удален блок (ID: ${blockNumber})`);
    
    updateVariablesDisplay();
    updateArraysDisplay();
    updateOutputDisplay();
    
    if(document.querySelectorAll('.workspace-block').length === 0) {
        const workspace = document.getElementById('workspace');
        if(workspace) {
            workspace.innerHTML = `
                <div class="workspace-placeholder">
                    <i class="fas fa-arrow-left"></i>
                    <p>Перетащите блоки сюда</p>
                </div>
            `;
        }
        availableBlockIds = [];
        blockCounter = 0;
        blockDeclarations = { variables: {}, arrays: {} };
    }
};

// ---------- ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ----------
function updateVariablesDisplay() {
    const container = document.getElementById('variables-list');
    if(!container) return;
    
    const vars = window.globalVariables;
    const count = Object.keys(vars).length;
    
    const badge = document.querySelector('#variables-tab .badge');
    if(badge) badge.textContent = count;
    
    if(count === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-box-open"></i><p>Нет переменных</p></div>`;
        return;
    }
    
    let html = '';
    Object.keys(vars).sort().forEach(name => {
        html += `<div class="var-item" style="font-size:13px; padding:10px;"><span class="var-name">${name}</span><span class="var-value">= ${vars[name]}</span></div>`;
    });
    container.innerHTML = html;
}

function updateArraysDisplay() {
    const container = document.getElementById('arrays-list');
    if(!container) return;
    
    const arrays = window.globalArrays;
    const count = Object.keys(arrays).length;
    
    const badge = document.querySelector('#arrays-tab .badge');
    if(badge) badge.textContent = count;
    
    if(count === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-box-open"></i><p>Нет массивов</p></div>`;
        return;
    }
    
    let html = '';
    Object.keys(arrays).sort().forEach(name => {
        const arr = arrays[name];
        html += `
            <div class="var-item" style="flex-direction:column; align-items:flex-start; font-size:13px; padding:10px;">
                <div><span class="var-name">${name}</span> <span style="color:var(--gray);">[${arr.length}]</span></div>
                <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;">
                    ${arr.slice(0,8).map((v,i)=>`<span style="background:var(--light); padding:3px 6px; border-radius:3px; font-size:12px;">[${i}]:${v}</span>`).join('')}
                    ${arr.length>8 ? '<span style="color:var(--gray); font-size:12px;">...</span>' : ''}
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function updateOutputDisplay(msg) {
    const container = document.getElementById('output-content');
    if(!container) return;
    
    if(msg) window.outputLog.push(msg);
    
    if(window.outputLog.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-play-circle"></i><p>Вывод пуст</p></div>';
        return;
    }
    
    container.innerHTML = window.outputLog.slice(-20).map(line => 
        `<div style="margin-bottom:4px; color:#e2e8f0; font-size:13px;">${line}</div>`
    ).join('');
    
    container.scrollTop = container.scrollHeight;
}

// ---------- КНОПКИ ----------
function runCode() {
    const statusText = document.getElementById('status-text');
    const statusIndicator = document.querySelector('.status-indicator');
    
    if(statusText) statusText.textContent = 'Выполняется...';
    if(statusIndicator) statusIndicator.className = 'status-indicator status-running';
    
    if(typeof window.runProgram === 'function') {
        const result = window.runProgram();
        window.outputLog = result?.output || window.outputLog;
    } else {
        window.outputLog.push('❌ Интерпретатор не загружен');
    }
    
    updateOutputDisplay();
    updateVariablesDisplay();
    updateArraysDisplay();
    
    if(statusText) statusText.textContent = 'Готово';
    if(statusIndicator) statusIndicator.className = 'status-indicator status-ready';
}

function clearWorkspace() {
    const workspace = document.getElementById('workspace');
    if(workspace) {
        workspace.innerHTML = `
            <div class="workspace-placeholder">
                <i class="fas fa-arrow-left"></i>
                <p>Перетащите блоки сюда</p>
            </div>
        `;
    }
    
    window.globalVariables = {};
    window.globalArrays = {};
    blockCounter = 0;
    availableBlockIds = [];
    blockDeclarations = { variables: {}, arrays: {} };
    
    updateVariablesDisplay();
    updateArraysDisplay();
    window.outputLog.push('🧹 Рабочая область очищена');
    updateOutputDisplay();
}

function clearOutput() {
    window.outputLog = [];
    updateOutputDisplay();
}

function saveProject() {
    window.outputLog.push('💾 Проект сохранен');
    updateOutputDisplay();
    console.log('💾 Проект:', {
        variables: window.globalVariables,
        arrays: window.globalArrays
    });
}

function loadProject() {
    window.outputLog.push('📂 Проект загружен');
    updateOutputDisplay();
}

// ---------- УПРАВЛЕНИЕ МАСШТАБОМ ----------
function initWorkspaceControls() {
    const controls = document.querySelector('.workspace-controls');
    if (controls) {
        controls.innerHTML = `
            <button class="btn btn-icon" onclick="window.workspaceScale = Math.min(1.5, (window.workspaceScale||1.2) + 0.1); document.getElementById('workspace').style.transform = 'scale('+window.workspaceScale+')'">
                <i class="fas fa-search-plus"></i>
            </button>
            <button class="btn btn-icon" onclick="window.workspaceScale = Math.max(0.7, (window.workspaceScale||1.2) - 0.1); document.getElementById('workspace').style.transform = 'scale('+window.workspaceScale+')'">
                <i class="fas fa-search-minus"></i>
            </button>
        `;
    }
    
    const panelHeader = document.querySelector('.panel-center .panel-header');
    if (panelHeader) {
        panelHeader.style.padding = '6px 10px';
        panelHeader.querySelector('h2').style.fontSize = '13px';
    }
}