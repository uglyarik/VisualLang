document.addEventListener('DOMContentLoaded', () => {
    initPaletteDrag();
    initWorkspaceDrop();
    initBlockDrag();
});

let draggingBlock = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

function initPaletteDrag() {
    document.querySelectorAll('.block-item[draggable="true"]').forEach(block => {
        block.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', block.dataset.type);
            e.dataTransfer.setData('text/title', block.querySelector('.block-title')?.textContent || '');
            e.dataTransfer.setData('text/color', block.querySelector('.block-color')?.style.background || '#6366f1');
            block.style.opacity = '0.5';
        });
        block.addEventListener('dragend', e => {
            block.style.opacity = '1';
        });
    });
}

function checkPlaceholder() {
    const workspace = document.getElementById('workspace');
    if (!workspace.querySelector('.workspace-block')) {
        workspace.innerHTML = `
            <div class="workspace-placeholder">
                <i class="fas fa-arrow-left"></i>
                <p>Перетащите блоки сюда</p>
            </div>
        `;
    }
}

function initWorkspaceDrop() {
    const workspace = document.getElementById('workspace');
    if (!workspace) return;

    workspace.addEventListener('dragover', e => e.preventDefault());

    workspace.addEventListener('drop', e => {
        e.preventDefault();
        const type = e.dataTransfer.getData('text/plain');
        const title = e.dataTransfer.getData('text/title');
        const color = e.dataTransfer.getData('text/color');

        if (!type) return;

        const placeholder = workspace.querySelector('.workspace-placeholder');
        if (placeholder) placeholder.remove();

        const block = document.createElement('div');
        block.className = 'workspace-block';
        block.style.backgroundColor = '#f9f9f9';
        block.style.border = `1px solid ${color}`;
        block.style.borderRadius = '8px';
        block.style.padding = '20px';
        block.style.margin = '8px';
        block.style.display = 'inline-block';
        block.style.minWidth = '150px';
        block.style.position = 'absolute';
        block.style.cursor = 'grab';
        block.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px; justify-content: space-between;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <div style="width:12px; height:12px; background:${color}; border-radius:4px;"></div>
                    <strong>${title}</strong>
                </div>
                <button onclick="this.closest('.workspace-block').remove(); checkPlaceholder();" style="background:none; border:none; cursor:pointer; color:#999;">✕</button>
            </div>
            <div style="font-size:12px; color:#666;">введите значение _______________</div>
        `;

        const rect = workspace.getBoundingClientRect();
        block.style.left = (e.clientX - rect.left - 50) + 'px';
        block.style.top = (e.clientY - rect.top - 30) + 'px';

        workspace.appendChild(block);
    });
}

function initBlockDrag() {
    const workspace = document.getElementById('workspace');
    if (!workspace) return;

    workspace.addEventListener('mousedown', e => {
        const block = e.target.closest('.workspace-block');
        if (!block) return;
        if (e.target.tagName === 'BUTTON') return;

        e.preventDefault();

        draggingBlock = block;

        const rect = block.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;

        block.style.cursor = 'grabbing';
        block.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', e => {
        if (!draggingBlock) return;

        e.preventDefault();

        const workspace = document.getElementById('workspace');
        const rect = workspace.getBoundingClientRect();

        let left = e.clientX - rect.left - dragOffsetX;
        let top = e.clientY - rect.top - dragOffsetY;

        left = Math.max(0, Math.min(left, rect.width - draggingBlock.offsetWidth));
        top = Math.max(0, Math.min(top, rect.height - draggingBlock.offsetHeight));

        draggingBlock.style.left = left + 'px';
        draggingBlock.style.top = top + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (draggingBlock) {
            draggingBlock.style.cursor = 'grab';
            draggingBlock.style.userSelect = '';
            draggingBlock = null;
        }
    });

    document.addEventListener('mouseleave', () => {
        if (draggingBlock) {
            draggingBlock.style.cursor = 'grab';
            draggingBlock.style.userSelect = '';
            draggingBlock = null;
        }
    });
}