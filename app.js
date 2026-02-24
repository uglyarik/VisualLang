
let blockCounter = 0;
let availableBlockIds = [];
let workspaceScale = 1.2;
let draggingBlock = null;
let dragOffset = { x: 0, y: 0 };
let dropTarget = null;

document.addEventListener('DOMContentLoaded', function() {
    initPaletteDrag();
    initWorkspace();
    initTabs();
    initZoom();

    window.runCode = () => console.log('Запуск программы');
    window.clearWorkspace = clearWorkspace;
    window.clearOutput = () => console.log('Очистка вывода');
});


function initTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            const tabId = this.dataset.tab + '-tab';
            document.getElementById(tabId).classList.add('active');
        });
    });
}


function initZoom() {
    window.zoomIn = () => {
        workspaceScale = Math.min(1.5, workspaceScale + 0.1);
        document.getElementById('workspace').style.transform = `scale(${workspaceScale})`;
    };
    
    window.zoomOut = () => {
        workspaceScale = Math.max(0.7, workspaceScale - 0.1);
        document.getElementById('workspace').style.transform = `scale(${workspaceScale})`;
    };
}

function initPaletteDrag() {
    document.querySelectorAll('.block-item[draggable="true"]').forEach(block => {
        block.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', block.dataset.type);
            e.dataTransfer.setData('text/title', block.querySelector('.block-title')?.textContent || 'Блок');
            e.dataTransfer.setData('text/color', block.querySelector('.block-color')?.style.background || '#6366f1');
            e.dataTransfer.setData('text/from-palette', 'true');
            block.style.opacity = '0.5';
        });
        
        block.addEventListener('dragend', e => {
            block.style.opacity = '1';
        });
    });
}


function initWorkspace() {
    const workspace = document.getElementById('workspace');
    if (!workspace) return;

    workspace.addEventListener('dragover', e => e.preventDefault());

    workspace.addEventListener('drop', e => {
        e.preventDefault();
        
        const targetContainer = e.target.closest('.slot, .body-container, .then-block, .else-block, .begin-body, .while-body, .for-init, .for-condition, .for-step, .for-body');
        
        if (targetContainer) {
            handleDropIntoContainer(e, targetContainer);
        } else if (e.dataTransfer.getData('text/from-palette')) {
            const type = e.dataTransfer.getData('text/plain');
            const title = e.dataTransfer.getData('text/title');
            const color = e.dataTransfer.getData('text/color');
            createBlock(type, title, color, e.clientX, e.clientY);
        }
    });

    workspace.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
}

function handleDropIntoContainer(e, container) {
    e.preventDefault();
    
    const blockId = e.dataTransfer.getData('text/block-id');
    const fromPalette = e.dataTransfer.getData('text/from-palette');
    
    if (blockId) {
        const block = document.getElementById(blockId);
        if (block && block !== container) {
            moveBlockToContainer(block, container);
        }
    } else if (fromPalette) {
        const type = e.dataTransfer.getData('text/plain');
        const title = e.dataTransfer.getData('text/title');
        const color = e.dataTransfer.getData('text/color');
        createBlockInContainer(type, title, color, container);
    }
}

function moveBlockToContainer(block, container) {
    block.style.position = 'relative';
    block.style.left = '0';
    block.style.top = '0';
    block.style.width = '240px';
    block.style.margin = '8px 0';
    

    const placeholder = container.querySelector('.placeholder');
    if (placeholder) placeholder.remove();
    
    container.appendChild(block);
}


function createBlockInContainer(type, title, color, container) {
    const blockId = getNextBlockId();
    
    const block = document.createElement('div');
    block.className = 'workspace-block';
    block.id = blockId;
    block.dataset.type = type;
    block.style.position = 'relative';
    block.style.width = '240px';
    block.style.margin = '8px 0';
    
    block.innerHTML = generateBlockHTML(type, blockId, title, color);
    
    const placeholder = container.querySelector('.placeholder');
    if (placeholder) placeholder.remove();
    
    container.appendChild(block);
}


function startDrag(e) {
    const header = e.target.closest('.block-header');
    if (!header) return;
    
    const block = header.closest('.workspace-block');
    if (!block) return;
    
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'BUTTON') return;
    
    e.preventDefault();
    
    draggingBlock = block;
    block.classList.add('dragging');
    

    e.dataTransfer = e.dataTransfer || new DataTransfer();
    e.dataTransfer.setData('text/block-id', block.id);
    e.dataTransfer.setData('text/plain', block.dataset.type);
    
    const rect = block.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    
    const workspace = document.getElementById('workspace');
    const workspaceRect = workspace.getBoundingClientRect();
    

    if (block.style.position !== 'absolute') {
        block.style.position = 'absolute';
        block.style.left = (rect.left - workspaceRect.left) + 'px';
        block.style.top = (rect.top - workspaceRect.top) + 'px';
    }
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
    
    document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
    
    if (found) {
        found.classList.add('drop-target');
        dropTarget = found;
    } else {
        dropTarget = null;
    }
}

function endDrag(e) {
    if (!draggingBlock) return;
    
    document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
    
    if (dropTarget) {
        moveBlockToContainer(draggingBlock, dropTarget);
    }

    
    draggingBlock.classList.remove('dragging');
    draggingBlock.style.zIndex = '';
    draggingBlock = null;
    dropTarget = null;
}


function getNextBlockId() {
    if (availableBlockIds.length > 0) {
        const id = Math.min(...availableBlockIds);
        availableBlockIds = availableBlockIds.filter(i => i !== id);
        return `block-${id}`;
    }
    blockCounter++;
    return `block-${blockCounter}`;
}

function createBlock(type, title, color, x, y) {
    const workspace = document.getElementById('workspace');
    if (!workspace) return;
    
    const blockId = getNextBlockId();
    const rect = workspace.getBoundingClientRect();
    
    const block = document.createElement('div');
    block.className = 'workspace-block';
    block.id = blockId;
    block.dataset.type = type;
    block.style.position = 'absolute';
    block.style.left = (x - rect.left - 90) + 'px';
    block.style.top = (y - rect.top - 30) + 'px';
    block.style.width = type === 'for_loop' ? '320px' : '280px';
    
    block.innerHTML = generateBlockHTML(type, blockId, title, color);
    
    workspace.appendChild(block);
}


function generateBlockHTML(type, blockId, title, color) {
    let content = '';
    
    switch(type) {
        case 'declare_vars':
            content = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: var(--gray);">📦</span>
                    <input type="text" class="block-input" value="" placeholder="x, y, z" style="flex:1; padding:4px;">
                </div>
            `;
            break;
        case 'declare_array':
            content = `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: var(--gray);">📚</span>
                        <input type="text" class="block-input" value="" placeholder="имя" style="width:100px;">
                    </div>
                    <div style="margin-left: 24px;">
                        <span style="color: var(--gray);">📏 размер:</span>
                        <input type="text" class="block-input" value="5" style="width:60px; margin-left:8px;">
                    </div>
                </div>
            `;
            break;
        case 'variable':
            content = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: var(--gray);">🔤</span>
                    <input type="text" class="block-input" value="" placeholder="имя" style="width:120px;">
                </div>
            `;
            break;
        case 'assign':
            content = `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: var(--gray);">📝</span>
                        <input type="text" class="block-input" value="" placeholder="переменная" style="width:120px;">
                    </div>
                    <div style="margin-left: 24px;">
                        <span style="color: var(--gray);">= значение:</span>
                        <div class="slot assign-value" style="min-height:30px; border:1px dashed var(--border); margin-top:4px; padding:4px;">
                            <span class="placeholder">⬇️ перетащите</span>
                        </div>
                    </div>
                </div>
            `;
            break;
        case 'math_number':
            content = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: var(--gray);">#</span>
                    <input type="number" class="block-input" value="0" style="width:120px;">
                </div>
            `;
            break;
        case 'math_arithmetic':
            content = `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <select class="block-select" style="width:60px;">
                        <option>+</option><option>-</option><option>×</option><option>÷</option><option>%</option>
                    </select>
                    <div style="display: flex; gap: 8px;">
                        <div style="flex:1;">
                            <div class="slot arithmetic-left" style="min-height:30px; border:1px dashed var(--border); padding:4px;">
                                <span class="placeholder">⬇️</span>
                            </div>
                        </div>
                        <div style="flex:1;">
                            <div class="slot arithmetic-right" style="min-height:30px; border:1px dashed var(--border); padding:4px;">
                                <span class="placeholder">⬇️</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
        case 'if_block':
            content = `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <span style="font-weight:600;">ЕСЛИ</span>
                    <div class="slot condition" style="min-height:30px; border:1px dashed var(--border); padding:4px;">
                        <span class="placeholder">⬇️ условие</span>
                    </div>
                    <div class="then-block body-container" style="min-height:40px; border-left:3px solid var(--primary); padding:4px;">
                        <span class="placeholder">⬇️ блоки</span>
                    </div>
                </div>
            `;
            break;
        case 'else_block':
            content = `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <span style="font-weight:600;">ИНАЧЕ</span>
                    <div class="else-block body-container" style="min-height:40px; border-left:3px solid var(--warning); padding:4px;">
                        <span class="placeholder">⬇️ блоки</span>
                    </div>
                </div>
            `;
            break;
        case 'if_else_block':
            content = `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <span style="font-weight:600;">ЕСЛИ-ИНАЧЕ</span>
                    <div class="slot condition" style="min-height:30px; border:1px dashed var(--border); padding:4px;">
                        <span class="placeholder">⬇️ условие</span>
                    </div>
                    <div class="then-block body-container" style="min-height:40px; border-left:3px solid var(--primary); padding:4px;">
                        <span class="placeholder">⬇️ тогда</span>
                    </div>
                    <div class="else-block body-container" style="min-height:40px; border-left:3px solid var(--warning); padding:4px;">
                        <span class="placeholder">⬇️ иначе</span>
                    </div>
                </div>
            `;
            break;
        case 'while_loop':
            content = `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <span style="font-weight:600;">ПОКА</span>
                    <div class="slot condition" style="min-height:30px; border:1px dashed var(--border); padding:4px;">
                        <span class="placeholder">⬇️ условие</span>
                    </div>
                    <div class="while-body body-container" style="min-height:40px; border-left:3px solid #ff5722; padding:4px;">
                        <span class="placeholder">⬇️ тело</span>
                    </div>
                </div>
            `;
            break;
        case 'for_loop':
            content = `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <span style="font-weight:600;">ДЛЯ</span>
                    <div class="for-init body-container" style="min-height:40px; border-left:3px solid #ff8a65; padding:4px;">
                        <span class="placeholder">⬇️ инициализация</span>
                    </div>
                    <div class="for-condition body-container" style="min-height:40px; border-left:3px solid #ff8a65; padding:4px;">
                        <span class="placeholder">⬇️ условие</span>
                    </div>
                    <div class="for-step body-container" style="min-height:40px; border-left:3px solid #ff8a65; padding:4px;">
                        <span class="placeholder">⬇️ шаг</span>
                    </div>
                    <div class="for-body body-container" style="min-height:40px; border-left:3px solid #ff8a65; padding:4px;">
                        <span class="placeholder">⬇️ тело</span>
                    </div>
                </div>
            `;
            break;
        case 'begin_end':
            content = `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <span style="font-weight:600;">BEGIN</span>
                    <div class="begin-body body-container" style="min-height:40px; border-left:3px solid #607d8b; padding:4px;">
                        <span class="placeholder">⬇️ блоки</span>
                    </div>
                    <span style="font-weight:600; margin-top:4px;">END</span>
                </div>
            `;
            break;
        default:
            content = `<div>${type}</div>`;
    }
    
    return `
        <div class="block-header">
            <div style="display:flex; align-items:center; gap:8px;">
                <div style="width:4px; height:22px; background:${color}; border-radius:3px;"></div>
                <span style="font-weight:600; font-size:13px; color:${color};">${title}</span>
                <span style="font-size:10px; color:var(--gray); background:white; padding:2px 6px; border-radius:12px;">${blockId.split('-')[1]}</span>
            </div>
            <button class="block-delete" onclick="this.closest('.workspace-block').remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="block-body">
            ${content}
        </div>
    `;
}

function clearWorkspace() {
    const workspace = document.getElementById('workspace');
    if (workspace) {
        workspace.innerHTML = '';
    }
    blockCounter = 0;
    availableBlockIds = [];
}