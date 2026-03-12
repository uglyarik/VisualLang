function initBlocks() {}

function generateBlockHTML(type, blockId, title, color) {
    let content = '';
    
    switch(type) {
        case 'declare_vars':
            content = `
                <div class="block-content">
                    <span class="block-icon">[ ]</span>
                    <input type="text" class="block-input vars-input" value="" 
                           placeholder="x, y, z"
                           data-block-id="${blockId}">
                </div>
                <div class="block-note">Enter</div>
            `;
            break;
            
        case 'declare_array':
            content = `
                <div class="block-content-vertical">
                    <div class="block-content">
                        <span class="block-icon">[ ]</span>
                        <input type="text" class="block-input array-name-input" value="" 
                               placeholder="имя"
                               data-block-id="${blockId}">
                    </div>
                    <div class="block-content" style="margin-left:16px;">
                        <span class="block-icon-small">#</span>
                        <span class="block-label">размер:</span>
                        <div style="display:flex; gap:4px; align-items:center; flex-wrap:wrap;">
                            <select class="block-select size-type-select" data-block-id="${blockId}" style="width:70px;">
                                <option value="number">число</option>
                                <option value="variable">переменная</option>
                            </select>
                            <div class="size-value-container" id="size-container-${blockId}">
                                <input type="number" class="block-input-small size-number" value="5" min="1" data-block-id="${blockId}" style="width:50px;">
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'variable':
            content = `
                <div class="block-content">
                    <span class="block-icon">var</span>
                    <input type="text" class="block-input var-name-input" value="" 
                           placeholder="имя"
                           data-block-id="${blockId}">
                </div>
                <div class="block-note">Enter</div>
            `;
            break;
            
        case 'array':
            content = `
                <div class="block-content">
                    <span class="block-icon">[ ]</span>
                    <input type="text" class="block-input array-name-input" value="" 
                           placeholder="имя массива"
                           data-block-id="${blockId}">
                </div>
                <div class="block-note">Enter</div>
            `;
            break;
            
        case 'array_element':
            content = `
                <div class="block-content-vertical">
                    <div class="block-content">
                        <span class="block-icon">[]</span>
                        <input type="text" class="block-input array-elem-name" value="" 
                               placeholder="массив"
                               data-block-id="${blockId}">
                    </div>
                    <div class="slot-container">
                        <span class="block-label">индекс:</span>
                        <div class="slot array-index" data-slot="index" data-parent="${blockId}">
                            <span class="placeholder">+</span>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'assign':
            content = `
                <div class="block-content-vertical">
                    <div class="slot-container">
                        <span class="block-label">куда:</span>
                        <div class="slot assign-target" data-slot="target" data-parent="${blockId}">
                            <span class="placeholder">+ переменная/элемент</span>
                        </div>
                    </div>
                    <div class="slot-container">
                        <span class="block-label">значение:</span>
                        <div class="slot assign-value" data-slot="value" data-parent="${blockId}">
                            <span class="placeholder">+ значение</span>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'math_number':
            content = `
                <div class="block-content">
                    <span class="block-icon">#</span>
                    <input type="number" class="block-input number-input" value="0" 
                           data-block-id="${blockId}">
                </div>
            `;
            break;
            
        case 'math_arithmetic':
            content = `
                <div class="block-content-vertical" style="gap: 8px;">
                    <div class="block-content" style="flex-wrap:wrap; margin-bottom: 4px;">
                        <span class="block-icon">+</span>
                        <select class="block-select arithmetic-op" data-block-id="${blockId}" style="width:60px;">
                            <option value="ADD">+</option>
                            <option value="MINUS">-</option>
                            <option value="MULTIPLY">*</option>
                            <option value="DIVIDE">/</option>
                            <option value="MOD">%</option>
                        </select>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
                        <div style="width: 100%;">
                            <span class="block-label" style="display: block; margin-bottom: 2px;">левый операнд:</span>
                            <div class="slot arithmetic-left" data-slot="left" data-parent="${blockId}" 
                                 style="width: 100%; min-height: 45px; border: 2px dashed var(--border); border-radius: 6px; padding: 6px;">
                                <span class="placeholder" style="font-size: 11px; line-height: 31px;">⬇️ перетащите число/переменную</span>
                            </div>
                        </div>
                        <div style="width: 100%;">
                            <span class="block-label" style="display: block; margin-bottom: 2px;">правый операнд:</span>
                            <div class="slot arithmetic-right" data-slot="right" data-parent="${blockId}" 
                                 style="width: 100%; min-height: 45px; border: 2px dashed var(--border); border-radius: 6px; padding: 6px;">
                                <span class="placeholder" style="font-size: 11px; line-height: 31px;">⬇️ перетащите число/переменную</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'comparison':
            content = `
                <div class="block-content-vertical" style="gap: 8px;">
                    <div class="block-content" style="flex-wrap:wrap; margin-bottom: 4px;">
                        <span class="block-icon">?</span>
                        <select class="block-select comparison-op" data-block-id="${blockId}" style="width:60px;">
                            <option value="=">=</option>
                            <option value="!=">≠</option>
                            <option value=">">></option>
                            <option value="<"><</option>
                            <option value=">=">≥</option>
                            <option value="<=">≤</option>
                        </select>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
                        <div style="width: 100%;">
                            <span class="block-label" style="display: block; margin-bottom: 2px;">левая часть:</span>
                            <div class="slot comp-left" data-slot="left" data-parent="${blockId}" 
                                 style="width: 100%; min-height: 45px; border: 2px dashed var(--border); border-radius: 6px; padding: 6px;">
                                <span class="placeholder" style="font-size: 11px; line-height: 31px;">⬇️ перетащите</span>
                            </div>
                        </div>
                        <div style="width: 100%;">
                            <span class="block-label" style="display: block; margin-bottom: 2px;">правая часть:</span>
                            <div class="slot comp-right" data-slot="right" data-parent="${blockId}" 
                                 style="width: 100%; min-height: 45px; border: 2px dashed var(--border); border-radius: 6px; padding: 6px;">
                                <span class="placeholder" style="font-size: 11px; line-height: 31px;">⬇️ перетащите</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'logic_and':
            content = `
                <div class="block-content-vertical" style="gap: 8px;">
                    <div class="block-content" style="background: rgba(156, 39, 176, 0.1); padding: 4px; border-radius: 4px; margin-bottom: 4px;">
                        <span class="block-icon" style="color: #9c27b0;">&&</span>
                        <span class="block-title-text" style="color: #9c27b0; font-weight: 700;">И (AND)</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
                        <div style="width: 100%;">
                            <span class="block-label" style="display: block; margin-bottom: 2px;">условие 1:</span>
                            <div class="slot logic-left" data-slot="left" data-parent="${blockId}" 
                                 style="width: 100%; min-height: 45px; border: 2px dashed #9c27b0; border-radius: 6px; padding: 6px;">
                                <span class="placeholder" style="font-size: 11px; line-height: 31px;">⬇️ перетащите условие</span>
                            </div>
                        </div>
                        <div style="width: 100%;">
                            <span class="block-label" style="display: block; margin-bottom: 2px;">условие 2:</span>
                            <div class="slot logic-right" data-slot="right" data-parent="${blockId}" 
                                 style="width: 100%; min-height: 45px; border: 2px dashed #9c27b0; border-radius: 6px; padding: 6px;">
                                <span class="placeholder" style="font-size: 11px; line-height: 31px;">⬇️ перетащите условие</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'logic_or':
            content = `
                <div class="block-content-vertical" style="gap: 8px;">
                    <div class="block-content" style="background: rgba(186, 104, 200, 0.1); padding: 4px; border-radius: 4px; margin-bottom: 4px;">
                        <span class="block-icon" style="color: #ba68c8;">||</span>
                        <span class="block-title-text" style="color: #ba68c8; font-weight: 700;">ИЛИ (OR)</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
                        <div style="width: 100%;">
                            <span class="block-label" style="display: block; margin-bottom: 2px;">условие 1:</span>
                            <div class="slot logic-left" data-slot="left" data-parent="${blockId}" 
                                 style="width: 100%; min-height: 45px; border: 2px dashed #ba68c8; border-radius: 6px; padding: 6px;">
                                <span class="placeholder" style="font-size: 11px; line-height: 31px;">⬇️ перетащите условие</span>
                            </div>
                        </div>
                        <div style="width: 100%;">
                            <span class="block-label" style="display: block; margin-bottom: 2px;">условие 2:</span>
                            <div class="slot logic-right" data-slot="right" data-parent="${blockId}" 
                                 style="width: 100%; min-height: 45px; border: 2px dashed #ba68c8; border-radius: 6px; padding: 6px;">
                                <span class="placeholder" style="font-size: 11px; line-height: 31px;">⬇️ перетащите условие</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'logic_not':
            content = `
                <div class="block-content-vertical" style="gap: 8px;">
                    <div class="block-content" style="background: rgba(206, 147, 216, 0.1); padding: 4px; border-radius: 4px; margin-bottom: 4px;">
                        <span class="block-icon" style="color: #ce93d8;">!</span>
                        <span class="block-title-text" style="color: #ce93d8; font-weight: 700;">НЕ (NOT)</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
                        <div style="width: 100%;">
                            <span class="block-label" style="display: block; margin-bottom: 2px;">условие:</span>
                            <div class="slot logic-not" data-slot="not" data-parent="${blockId}" 
                                 style="width: 100%; min-height: 45px; border: 2px dashed #ce93d8; border-radius: 6px; padding: 6px;">
                                <span class="placeholder" style="font-size: 11px; line-height: 31px;">⬇️ перетащите условие</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'if_block':
            content = `
                <div class="block-content-vertical">
                    <div class="block-content">
                        <span class="block-icon">if</span>
                        <span class="block-title-text">ЕСЛИ</span>
                    </div>
                    <div class="slot-container">
                        <span class="block-label">условие:</span>
                        <div class="slot condition" data-slot="condition" data-parent="${blockId}"
                             style="width: 100%; min-height: 45px; border: 2px dashed var(--primary); border-radius: 6px; padding: 6px;">
                            <span class="placeholder" style="font-size: 11px; line-height: 31px;">⬇️ перетащите условие</span>
                        </div>
                    </div>
                    <div class="body-container then-block" data-body="then" data-parent="${blockId}">
                        <span class="block-label">ТОГДА:</span>
                        <div class="body-content" data-body-content="then">
                            <span class="placeholder">+</span>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'else_block':
            content = `
                <div class="block-content-vertical">
                    <div class="block-content">
                        <span class="block-icon">else</span>
                        <span class="block-title-text">ИНАЧЕ</span>
                    </div>
                    <div class="body-container else-block" data-body="else" data-parent="${blockId}">
                        <span class="block-label">ИНАЧЕ:</span>
                        <div class="body-content" data-body-content="else">
                            <span class="placeholder">+</span>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'if_else_block':
            content = `
                <div class="block-content-vertical">
                    <div class="block-content">
                        <span class="block-icon">if</span>
                        <span class="block-title-text">ЕСЛИ-ИНАЧЕ</span>
                    </div>
                    <div class="slot-container">
                        <span class="block-label">условие:</span>
                        <div class="slot condition" data-slot="condition" data-parent="${blockId}"
                             style="width: 100%; min-height: 45px; border: 2px dashed var(--primary); border-radius: 6px; padding: 6px;">
                            <span class="placeholder" style="font-size: 11px; line-height: 31px;">⬇️ перетащите условие</span>
                        </div>
                    </div>
                    <div class="body-container then-block" data-body="then" data-parent="${blockId}">
                        <span class="block-label">ТОГДА:</span>
                        <div class="body-content" data-body-content="then">
                            <span class="placeholder">+</span>
                        </div>
                    </div>
                    <div class="body-container else-block" data-body="else" data-parent="${blockId}">
                        <span class="block-label">ИНАЧЕ:</span>
                        <div class="body-content" data-body-content="else">
                            <span class="placeholder">+</span>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'while_loop':
            content = `
                <div class="block-content-vertical">
                    <div class="block-content">
                        <span class="block-icon">while</span>
                        <span class="block-title-text">ПОКА</span>
                    </div>
                    <div class="slot-container">
                        <span class="block-label">условие:</span>
                        <div class="slot condition" data-slot="condition" data-parent="${blockId}"
                             style="width: 100%; min-height: 45px; border: 2px dashed #ff7043; border-radius: 6px; padding: 6px;">
                            <span class="placeholder" style="font-size: 11px; line-height: 31px;">⬇️ перетащите условие</span>
                        </div>
                    </div>
                    <div class="body-container while-body" data-body="body" data-parent="${blockId}">
                        <span class="block-label">ТЕЛО:</span>
                        <div class="body-content" data-body-content="body">
                            <span class="placeholder">+</span>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'for_loop':
            content = `
                <div class="block-content-vertical">
                    <div class="block-content">
                        <span class="block-icon">for</span>
                        <span class="block-title-text">ДЛЯ</span>
                    </div>
                    <div class="body-container for-init" data-body="init" data-parent="${blockId}">
                        <span class="block-label">инициализация:</span>
                        <div class="body-content" data-body-content="init">
                            <span class="placeholder">+</span>
                        </div>
                    </div>
                    <div class="body-container for-condition" data-body="condition" data-parent="${blockId}">
                        <span class="block-label">условие:</span>
                        <div class="body-content" data-body-content="condition">
                            <span class="placeholder">+</span>
                        </div>
                    </div>
                    <div class="body-container for-step" data-body="step" data-parent="${blockId}">
                        <span class="block-label">шаг:</span>
                        <div class="body-content" data-body-content="step">
                            <span class="placeholder">+</span>
                        </div>
                    </div>
                    <div class="body-container for-body" data-body="body" data-parent="${blockId}">
                        <span class="block-label">тело:</span>
                        <div class="body-content" data-body-content="body">
                            <span class="placeholder">+</span>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'begin_end':
            content = `
                <div class="block-content-vertical">
                    <div class="block-content">
                        <span class="block-icon">{ }</span>
                        <span class="block-title-text" style="color:#607d8b;">BEGIN</span>
                    </div>
                    <div class="body-container begin-body" data-body="body" data-parent="${blockId}" 
                         style="margin-left:12px; width:calc(100% - 12px); min-height: 60px; border-left: 3px solid #607d8b;">
                        <div class="body-content" data-body-content="body" style="min-height:50px;">
                            <span class="placeholder" style="color: var(--text-muted); font-size: 11px; text-align: center; display: block; padding: 15px 0;">⬇️ перетащите блоки сюда</span>
                        </div>
                    </div>
                    <div class="block-content" style="margin-top:4px;">
                        <span class="block-icon">}</span>
                        <span class="block-title-text" style="color:#607d8b;">END</span>
                    </div>
                </div>
            `;
            break;
            
        case 'bubble_sort':
            content = `
                <div class="block-content-vertical" style="gap: 8px;">
                    <div class="block-content" style="background: rgba(67, 97, 238, 0.05); padding: 6px; border-radius: 4px; margin-bottom: 4px;">
                        <span class="block-icon" style="color: var(--primary);">🔄</span>
                        <span class="block-title-text" style="color: var(--primary); font-weight: 700;">СОРТИРОВКА ПУЗЫРЬКОМ</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
                        <div style="width: 100%;">
                            <span class="block-label" style="display: block; margin-bottom: 2px; font-weight: 600;">массив для сортировки:</span>
                            <div class="slot array-for-sort" data-slot="array" data-parent="${blockId}" 
                                 style="width: 100%; min-height: 45px; border: 2px dashed var(--border); border-radius: 6px; padding: 6px; background: var(--bg-hover);">
                                <span class="placeholder" style="font-size: 11px; line-height: 31px;">⬇️ перетащите блок "Массив"</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'print':
            content = `
                <div class="block-content-vertical">
                    <div class="block-content">
                        <span class="block-icon">print</span>
                        <span class="block-title-text">ВЫВОД</span>
                    </div>
                    <div class="slot-container">
                        <span class="block-label">значение:</span>
                        <div class="slot print-value" data-slot="value" data-parent="${blockId}">
                            <span class="placeholder">+</span>
                        </div>
                    </div>
                </div>
            `;
            break;
    }
    
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
            ${content}
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', function() {
    initBlockHandlers();
});

function initBlockHandlers() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            const input = e.target;
            
            if (input.classList.contains('vars-input')) {
                e.preventDefault();
                const blockId = input.dataset.blockId;
                const vars = input.value.split(',').map(v => v.trim()).filter(v => /^[a-zA-Z][a-zA-Z0-9]*$/.test(v));
                
                if (window.__core__.blockDeclarations.variables[blockId]) {
                    const oldVars = window.__core__.blockDeclarations.variables[blockId];
                    oldVars.forEach(oldVar => {
                        let usedElsewhere = false;
                        Object.keys(window.__core__.blockDeclarations.variables).forEach(bid => {
                            if (bid !== blockId && window.__core__.blockDeclarations.variables[bid]?.includes(oldVar)) {
                                usedElsewhere = true;
                            }
                        });
                        if (!usedElsewhere) {
                            delete window.globalVariables[oldVar];
                        }
                    });
                }
                
                vars.forEach(v => {
                    if (!window.globalVariables[v]) {
                        window.globalVariables[v] = 0;
                    }
                });
                
                window.__core__.blockDeclarations.variables[blockId] = vars;
                input.value = vars.join(', ');
                updateVariablesDisplay();
            }
            
            if (input.classList.contains('var-name-input') || input.classList.contains('array-name-input')) {
                e.preventDefault();
                const blockId = input.dataset.blockId;
                const name = input.value.trim();
                const block = document.getElementById(blockId);
                const isArray = block?.dataset.type === 'array';
                
                if (name && /^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) {
                    if (isArray) {
                        if (!window.globalArrays[name]) {
                            window.globalArrays[name] = [0, 0, 0, 0, 0];
                        }
                        updateArraysDisplay();
                    } else {
                        if (!window.globalVariables[name]) {
                            window.globalVariables[name] = 0;
                        }
                        updateVariablesDisplay();
                    }
                } else {
                    input.value = '';
                }
            }
        }
    });
    
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('size-type-select')) {
            const blockId = e.target.dataset.blockId;
            const container = document.getElementById(`size-container-${blockId}`);
            const type = e.target.value;
            
            if (container) {
                if (type === 'number') {
                    container.innerHTML = `<input type="number" class="block-input-small size-number" value="5" min="1" data-block-id="${blockId}" style="width:50px;">`;
                } else {
                    container.innerHTML = `<input type="text" class="block-input-small size-variable" value="n" placeholder="перем" data-block-id="${blockId}" style="width:50px;">`;
                }
            }
        }
        
        if (e.target.classList.contains('array-name-input')) {
            const blockId = e.target.dataset.blockId;
            const block = document.getElementById(blockId);
            const isArrayBlock = block?.dataset.type === 'array';
            
            if (isArrayBlock) {
                return;
            }
            
            const newName = e.target.value.trim();
            const oldData = window.__core__.blockDeclarations.arrays[blockId];
            const oldName = oldData?.name;
            
            if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(newName)) {
                e.target.value = oldName || '';
                return;
            }
            
            if (oldName && oldName !== newName) {
                let usedElsewhere = false;
                Object.keys(window.__core__.blockDeclarations.arrays).forEach(bid => {
                    if (bid !== blockId && window.__core__.blockDeclarations.arrays[bid]?.name === oldName) {
                        usedElsewhere = true;
                    }
                });
                if (!usedElsewhere) {
                    delete window.globalArrays[oldName];
                }
            }
            
            if (newName && !window.globalArrays[newName]) {
                window.globalArrays[newName] = [0, 0, 0, 0, 0];
            }
            
            window.__core__.blockDeclarations.arrays[blockId] = {
                name: newName,
                size: oldData?.size || 5,
                sizeType: oldData?.sizeType || 'number',
                sizeVar: oldData?.sizeVar || 'n'
            };
            
            updateArraysDisplay();
        }
        
        if (e.target.classList.contains('size-number')) {
            const blockId = e.target.dataset.blockId;
            const size = parseInt(e.target.value) || 5;
            const blockData = window.__core__.blockDeclarations.arrays[blockId];
            
            if (blockData && blockData.name) {
                blockData.size = size;
                blockData.sizeType = 'number';
                
                if (window.globalArrays[blockData.name]) {
                    const oldArr = window.globalArrays[blockData.name];
                    const newArr = new Array(size).fill(0);
                    for (let i = 0; i < Math.min(oldArr.length, size); i++) {
                        newArr[i] = oldArr[i];
                    }
                    window.globalArrays[blockData.name] = newArr;
                }
                
                updateArraysDisplay();
            }
        }
        
        if (e.target.classList.contains('size-variable')) {
            const blockId = e.target.dataset.blockId;
            const varName = e.target.value.trim();
            const blockData = window.__core__.blockDeclarations.arrays[blockId];
            
            if (blockData && blockData.name) {
                blockData.sizeType = 'variable';
                blockData.sizeVar = varName;
                
                if (window.globalArrays[blockData.name]) {
                    const currentVarValue = window.getVariable(varName) || 5;
                    const newSize = Math.max(1, Math.min(100, currentVarValue));
                    const oldArr = window.globalArrays[blockData.name];
                    const newArr = new Array(newSize).fill(0);
                    
                    for (let i = 0; i < Math.min(oldArr.length, newSize); i++) {
                        newArr[i] = oldArr[i];
                    }
                    
                    window.globalArrays[blockData.name] = newArr;
                    blockData.size = newSize;
                }
                
                updateArraysDisplay();
            }
        }
    });
}

window.generateBlockHTML = generateBlockHTML;
window.initBlocks = initBlocks;