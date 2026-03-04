window.globalVariables = {};
window.globalArrays = {};
window.outputLog = [];

let blockCounter = 0;
let availableBlockIds = [];
let workspaceScale = 1.0;
let draggingBlock = null;
let dragOffset = { x: 0, y: 0 };
let dropTarget = null;

let blockDeclarations = {
    variables: {},
    arrays: {}
};

window.__core__ = {
    blockCounter,
    availableBlockIds,
    workspaceScale,
    draggingBlock,
    dragOffset,
    dropTarget,
    blockDeclarations
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('Система готова');
    
    if (window.initUI) window.initUI();
    if (window.initDragDrop) window.initDragDrop();
    if (window.initBlocks) window.initBlocks();
    
    window.runCode = runCode;
    window.clearWorkspace = clearWorkspace;
    window.clearOutput = clearOutput;
    window.deleteBlock = deleteBlock;
    
    updateVariablesDisplay();
    updateArraysDisplay();
});

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

function getValueFromBlock(block) {
    if (!block) return 0;
    
    const type = block.dataset.type;
    
    switch(type) {
        case 'math_number':
            const numInput = block.querySelector('input[type="number"]');
            return parseFloat(numInput?.value) || 0;
            
        case 'variable':
            const varInput = block.querySelector('input[placeholder="имя"]');
            const varName = varInput?.value.trim();
            return window.globalVariables[varName] || 0;
            
        default:
            return 0;
    }
}

function deleteBlock(blockId) {
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
        }
        delete blockDeclarations.arrays[blockId];
    }
    
    if(!availableBlockIds.includes(blockNumber)) {
        availableBlockIds.push(blockNumber);
        availableBlockIds.sort((a, b) => a - b);
    }
    
    block.remove();
    
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
    
    updateVariablesDisplay();
    updateArraysDisplay();
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
}

function clearOutput() {
    window.outputLog = [];
    updateOutputDisplay();
}

function runCode() {
    if (typeof window.runProgram === 'function') {
        window.outputLog = [];
        const result = window.runProgram();
        window.outputLog = result?.output || [];
    } else {
        window.outputLog = [' Интерпретатор не загружен'];
    }
    
    updateOutputDisplay();
    updateVariablesDisplay();
    updateArraysDisplay();
}

window.__core__.getNextBlockId = getNextBlockId;
window.__core__.getValueFromBlock = getValueFromBlock;