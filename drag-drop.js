let isResizing = false;
let currentResizeBlock = null;
let startResizeX, startResizeY, startWidth, startHeight;

function initDragDrop() {
    initPaletteDrag();
    initWorkspaceDrag();
}

function initPaletteDrag() {
    document.querySelectorAll('.block-item[draggable="true"]').forEach(block => {
        block.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', this.dataset.type);
            e.dataTransfer.setData('text/title', this.querySelector('.block-title')?.textContent || '');
            e.dataTransfer.setData('text/color', this.querySelector('.block-color')?.style.background || '#4361ee');
            e.dataTransfer.setData('text/from-palette', 'true');
            this.style.opacity = '0.5';
        });
        
        block.addEventListener('dragend', function() {
            this.style.opacity = '1';
        });
    });
}

function initWorkspaceDrag() {
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
            createBlockElement(type, title, color, e.clientX, e.clientY);
        }
    });

    let isDragging = false;
    let startX, startY;
    let blockStartLeft, blockStartTop;
    let currentBlock = null;

    workspace.addEventListener('mousedown', function(e) {
        const header = e.target.closest('.block-header');
        if (!header) return;
        
        const block = header.closest('.workspace-block');
        if (!block) return;
        
        if (e.target.closest('.block-delete')) return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        
        e.preventDefault();
        
        isDragging = false;
        startX = e.clientX;
        startY = e.clientY;
        
        const rect = block.getBoundingClientRect();
        const workspaceRect = workspace.getBoundingClientRect();
        
        blockStartLeft = rect.left - workspaceRect.left;
        blockStartTop = rect.top - workspaceRect.top;
        
        currentBlock = block;
        
        function onMouseMove(e) {
            if (!currentBlock) return;
            
            const dx = Math.abs(e.clientX - startX);
            const dy = Math.abs(e.clientY - startY);
            
            if (!isDragging && (dx > 5 || dy > 5)) {
                isDragging = true;
                startDrag(currentBlock, blockStartLeft, blockStartTop);
            }
            
            if (isDragging) {
                e.preventDefault();
                onDrag(e, currentBlock);
            }
        }
        
        function onMouseUp(e) {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            
            if (isDragging) {
                endDrag(e, currentBlock);
            }
            
            currentBlock = null;
            isDragging = false;
        }
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    workspace.addEventListener('mousedown', function(e) {
        const block = e.target.closest('.workspace-block');
        if (!block) return;
        
        const rect = block.getBoundingClientRect();
        const isOnResizeCorner = (e.clientX > rect.right - 20 && e.clientY > rect.bottom - 20);
        
        if (isOnResizeCorner && !e.target.closest('.block-header') && !e.target.closest('input') && !e.target.closest('select') && !e.target.closest('button')) {
            e.preventDefault();
            e.stopPropagation();
            
            isResizing = true;
            currentResizeBlock = block;
            startResizeX = e.clientX;
            startResizeY = e.clientY;
            startWidth = block.offsetWidth;
            startHeight = block.offsetHeight;
            
            block.classList.add('resizing');
            
            function onResizeMouseMove(e) {
                if (!isResizing || !currentResizeBlock) return;
                
                e.preventDefault();
                
                const dx = e.clientX - startResizeX;
                const dy = e.clientY - startResizeY;
                
                let newWidth = Math.max(150, startWidth + dx);
                let newHeight = Math.max(80, startHeight + dy);
                
                const type = currentResizeBlock.dataset.type;
                if (type === 'begin_end') {
                    newWidth = Math.max(250, newWidth);
                    newHeight = Math.max(150, newHeight);
                } else if (type === 'for_loop') {
                    newWidth = Math.max(280, newWidth);
                    newHeight = Math.max(200, newHeight);
                } else if (type === 'if_else_block') {
                    newWidth = Math.max(280, newWidth);
                    newHeight = Math.max(220, newHeight);
                } else if (type === 'while_loop') {
                    newWidth = Math.max(260, newWidth);
                    newHeight = Math.max(160, newHeight);
                }
                
                currentResizeBlock.style.width = newWidth + 'px';
                currentResizeBlock.style.height = newHeight + 'px';
            }
            
            function onResizeMouseUp(e) {
                if (isResizing && currentResizeBlock) {
                    currentResizeBlock.classList.remove('resizing');
                }
                
                isResizing = false;
                currentResizeBlock = null;
                
                document.removeEventListener('mousemove', onResizeMouseMove);
                document.removeEventListener('mouseup', onResizeMouseUp);
            }
            
            document.addEventListener('mousemove', onResizeMouseMove);
            document.addEventListener('mouseup', onResizeMouseUp);
        }
    });
}

function createBlockElement(type, title, color, x, y) {
    const workspace = document.getElementById('workspace');
    if (!workspace) return null;
    
    const blockId = window.__core__.getNextBlockId();
    const blockNumber = blockId.split('-')[1];
    
    const block = document.createElement('div');
    block.className = 'workspace-block';
    block.id = blockId;
    block.dataset.type = type;
    
    const scale = window.__core__.workspaceScale || 0.8;
    const wrapper = document.getElementById('workspace-wrapper');
    const wrapperRect = wrapper.getBoundingClientRect();
    const scrollLeft = wrapper.scrollLeft;
    const scrollTop = wrapper.scrollTop;
    
    block.style.position = 'absolute';
    block.style.left = ((x - wrapperRect.left + scrollLeft) / scale - 70) + 'px';
    block.style.top = ((y - wrapperRect.top + scrollTop) / scale - 20) + 'px';
    
    if (type === 'for_loop') {
        block.style.width = '280px';
        block.style.height = '200px';
    } else if (type === 'begin_end') {
        block.style.width = '250px';
        block.style.height = '150px';
    } else if (type === 'if_else_block') {
        block.style.width = '280px';
        block.style.height = '220px';
    } else if (type === 'while_loop') {
        block.style.width = '260px';
        block.style.height = '160px';
    } else {
        block.style.width = '200px';
        block.style.height = '120px';
    }
    
    block.innerHTML = window.generateBlockHTML ? 
        window.generateBlockHTML(type, blockId, title, color) : 
        getFallbackHTML(type, blockId, title, color);
    
    workspace.appendChild(block);
    
    const placeholder = workspace.querySelector('.workspace-placeholder');
    if (placeholder) placeholder.remove();
    
    return block;
}

function getFallbackHTML(type, blockId, title, color) {
    return `
        <div class="block-header">
            <div class="block-header-left">
                <div class="block-color-bar" style="background:${color || '#4361ee'};"></div>
                <span class="block-title-header">${title || type}</span>
                <span class="block-id">${blockId.split('-')[1]}</span>
            </div>
            <button class="block-delete" onclick="event.stopPropagation(); window.deleteBlock('${blockId}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="block-body">
            <div class="block-content">
                <span>${type} блок</span>
            </div>
        </div>
    `;
}

function startDrag(block, startLeft, startTop) {
    if (isResizing) return;
    
    block.classList.add('dragging');
    
    block.style.position = 'absolute';
    block.style.left = startLeft + 'px';
    block.style.top = startTop + 'px';
    block.style.width = block.offsetWidth + 'px';
    block.style.zIndex = '1000';
    
    window.__core__.draggingBlock = block;
}

function onDrag(e, block) {
    if (isResizing) return;
    
    const workspace = document.getElementById('workspace');
    const wrapper = document.getElementById('workspace-wrapper');
    const scale = window.__core__.workspaceScale || 0.8;
    
    const scrollLeft = wrapper.scrollLeft;
    const scrollTop = wrapper.scrollTop;
    
    let x = e.clientX - wrapper.getBoundingClientRect().left + scrollLeft - (block.offsetWidth / 2);
    let y = e.clientY - wrapper.getBoundingClientRect().top + scrollTop - 20;
    
    x = Math.max(0, x);
    y = Math.max(0, y);
    
    block.style.left = x + 'px';
    block.style.top = y + 'px';
    
    findDropTarget(e);
}

function endDrag(e, block) {
    document.querySelectorAll('.drop-target').forEach(el => {
        el.classList.remove('drop-target');
    });
    
    if (window.__core__.dropTarget) {
        insertIntoContainer(block, window.__core__.dropTarget);
    } else {
        const workspace = document.getElementById('workspace');
        workspace.appendChild(block);
        block.style.position = 'absolute';
    }
    
    block.classList.remove('dragging');
    block.style.zIndex = '';
    window.__core__.draggingBlock = null;
    window.__core__.dropTarget = null;
}

function findDropTarget(e) {
    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    let found = null;
    
    for (let el of elements) {
        if (el.classList && (
            el.classList.contains('slot') ||
            el.classList.contains('body-content') ||
            el.classList.contains('array-for-sort')
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
        window.__core__.dropTarget = found;
    } else {
        window.__core__.dropTarget = null;
    }
}

function insertIntoContainer(block, container) {
    block.style.position = 'relative';
    block.style.left = '0';
    block.style.top = '0';
    block.style.width = '100%';
    block.style.margin = '2px 0';
    block.style.maxWidth = '100%';
    block.style.transform = 'none';
    block.style.height = 'auto';
    
    const placeholder = container.querySelector('.placeholder');
    if (placeholder) placeholder.remove();
    
    container.appendChild(block);
    
    if (container.classList.contains('arithmetic-left') || 
        container.classList.contains('arithmetic-right') ||
        container.classList.contains('comp-left') || 
        container.classList.contains('comp-right')) {
        
        block.style.fontSize = '10px';
        
        const header = block.querySelector('.block-header');
        if (header) {
            header.style.padding = '2px 4px';
        }
        
        const body = block.querySelector('.block-body');
        if (body) {
            body.style.padding = '4px';
        }
        
        const idSpan = block.querySelector('.block-id');
        if (idSpan) {
            idSpan.style.display = 'none';
        }
    }
}

window.initDragDrop = initDragDrop;
window.createBlockElement = createBlockElement;