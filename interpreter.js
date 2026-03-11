let interpreterState = {
    variables: {},
    arrays: {},
    output: [],
    scopeStack: []
};

function resetInterpreter() {
    interpreterState = {
        variables: {},
        arrays: {},
        output: [],
        scopeStack: []
    };
}

function getVariable(name) {
    for (let i = interpreterState.scopeStack.length - 1; i >= 0; i--) {
        if (name in interpreterState.scopeStack[i]) {
            return interpreterState.scopeStack[i][name];
        }
    }
    return interpreterState.variables[name] ?? 0;
}

function setVariable(name, value) {
    for (let i = interpreterState.scopeStack.length - 1; i >= 0; i--) {
        if (name in interpreterState.scopeStack[i]) {
            interpreterState.scopeStack[i][name] = value;
            return;
        }
    }
    interpreterState.variables[name] = value;
}

function declareVariable(name, value = 0) {
    if (interpreterState.scopeStack.length > 0) {
        const scope = interpreterState.scopeStack[interpreterState.scopeStack.length - 1];
        if (!(name in scope)) scope[name] = value;
    } else {
        if (!(name in interpreterState.variables)) interpreterState.variables[name] = value;
    }
}

function getArraySize(name) {
    const blockData = window.__core__.blockDeclarations.arrays;
    let size = 5;
    
    for (let blockId in blockData) {
        if (blockData[blockId].name === name) {
            if (blockData[blockId].sizeType === 'number') {
                size = blockData[blockId].size || 5;
            } else {
                const varName = blockData[blockId].sizeVar || 'n';
                const varValue = getVariable(varName);
                size = varValue || 5;
            }
            break;
        }
    }
    
    return Math.max(1, Math.min(100, size));
}

function getArray(name) {
    if (!interpreterState.arrays[name]) {
        const size = getArraySize(name);
        interpreterState.arrays[name] = new Array(size).fill(0);
    }
    return interpreterState.arrays[name];
}

function getArrayElement(name, index) {
    const arr = getArray(name);
    index = Math.floor(index);
    return (index >= 0 && index < arr.length) ? arr[index] : 0;
}

function setArrayElement(name, index, value) {
    const arr = getArray(name);
    index = Math.floor(index);
    if (index < 0) index = 0;
    if (index >= arr.length) {
        const newArr = new Array(index + 1).fill(0);
        for (let i = 0; i < arr.length; i++) {
            newArr[i] = arr[i];
        }
        interpreterState.arrays[name] = newArr;
    }
    interpreterState.arrays[name][index] = value;
}

function evaluateBlock(block) {
    if (!block) return 0;
    
    const type = block.dataset.type;
    
    switch(type) {
        case 'math_number':
            const numInput = block.querySelector('input[type="number"]');
            return parseFloat(numInput?.value) || 0;
            
        case 'variable':
            const varInput = block.querySelector('input[placeholder="имя"]');
            const varName = varInput?.value.trim();
            return getVariable(varName) || 0;
            
        case 'array':
            const arrayInput = block.querySelector('input[placeholder="имя массива"]');
            const arrayName = arrayInput?.value.trim();
            
            if (!arrayName) return 0;
            
            return getArray(arrayName);
            
        case 'array_element':
            const inputs = block.querySelectorAll('input');
            const arrName = inputs[0]?.value.trim();
            const indexBlock = block.querySelector('.array-index .workspace-block');
            const index = indexBlock ? evaluateBlock(indexBlock) : 0;
            return getArrayElement(arrName, index);
            
        case 'math_arithmetic':
            const leftSlot = block.querySelector('.arithmetic-left .workspace-block');
            const rightSlot = block.querySelector('.arithmetic-right .workspace-block');
            const select = block.querySelector('select');
            const left = leftSlot ? evaluateBlock(leftSlot) : 0;
            const right = rightSlot ? evaluateBlock(rightSlot) : 0;
            const op = select?.value || 'ADD';
            
            switch(op) {
                case 'ADD': return left + right;
                case 'MINUS': return left - right;
                case 'MULTIPLY': return left * right;
                case 'DIVIDE': return right !== 0 ? Math.floor(left / right) : 0;
                case 'MOD': return right !== 0 ? left % right : 0;
                default: return 0;
            }
            
        default:
            return 0;
    }
}

function evaluateCondition(block) {
    if (!block) return false;
    
    const type = block.dataset.type;
    
    switch(type) {
        case 'comparison':
            const leftSlot = block.querySelector('.comp-left .workspace-block');
            const rightSlot = block.querySelector('.comp-right .workspace-block');
            const select = block.querySelector('select');
            const left = leftSlot ? evaluateBlock(leftSlot) : 0;
            const right = rightSlot ? evaluateBlock(rightSlot) : 0;
            const op = select?.value || '=';
            
            switch(op) {
                case '=': return left === right;
                case '!=': return left !== right;
                case '>': return left > right;
                case '<': return left < right;
                case '>=': return left >= right;
                case '<=': return left <= right;
                default: return false;
            }
            
        case 'logic_and':
            const leftAndSlot = block.querySelector('.logic-left .workspace-block');
            const rightAndSlot = block.querySelector('.logic-right .workspace-block');
            const leftAnd = leftAndSlot ? evaluateCondition(leftAndSlot) : false;
            const rightAnd = rightAndSlot ? evaluateCondition(rightAndSlot) : false;
            return leftAnd && rightAnd;
            
        case 'logic_or':
            const leftOrSlot = block.querySelector('.logic-left .workspace-block');
            const rightOrSlot = block.querySelector('.logic-right .workspace-block');
            const leftOr = leftOrSlot ? evaluateCondition(leftOrSlot) : false;
            const rightOr = rightOrSlot ? evaluateCondition(rightOrSlot) : false;
            return leftOr || rightOr;
            
        case 'logic_not':
            const notSlot = block.querySelector('.logic-not .workspace-block');
            const notCond = notSlot ? evaluateCondition(notSlot) : false;
            return !notCond;
            
        default:
            return false;
    }
}

function executeBlock(block) {
    if (!block) return;
    
    const type = block.dataset.type;
    
    try {
        switch(type) {
            case 'declare_vars':
                break;
                
            case 'declare_array':
                const nameInput = block.querySelector('input[placeholder="имя"]');
                const sizeSelect = block.querySelector('.size-type-select');
                const sizeNumber = block.querySelector('.size-number');
                const sizeVariable = block.querySelector('.size-variable');
                
                if (nameInput) {
                    const name = nameInput.value.trim();
                    if (name) {
                        let size = 5;
                        let sizeType = 'number';
                        let sizeVar = 'n';
                        
                        if (sizeSelect) {
                            sizeType = sizeSelect.value;
                        }
                        
                        if (sizeType === 'number' && sizeNumber) {
                            size = parseInt(sizeNumber.value) || 5;
                        } else if (sizeType === 'variable' && sizeVariable) {
                            sizeVar = sizeVariable.value.trim();
                            size = getVariable(sizeVar) || 5;
                        }
                        
                        if (!interpreterState.arrays[name]) {
                            interpreterState.arrays[name] = new Array(size).fill(0);
                            interpreterState.output.push(`Объявлен массив: ${name}[${size}]`);
                        }
                    }
                }
                break;
                
            case 'array':
                break;
                
            case 'assign':
                const targetSlot = block.querySelector('.assign-target .workspace-block');
                const valueSlot = block.querySelector('.assign-value .workspace-block');
                
                if (targetSlot && valueSlot) {
                    const targetType = targetSlot.dataset.type;
                    const value = evaluateBlock(valueSlot);
                    
                    if (targetType === 'variable') {
                        const varInput = targetSlot.querySelector('input[placeholder="имя"]');
                        const targetVar = varInput?.value.trim();
                        if (targetVar) {
                            setVariable(targetVar, value);
                            interpreterState.output.push(`${targetVar} = ${value}`);
                        }
                    } else if (targetType === 'array_element') {
                        const inputs = targetSlot.querySelectorAll('input');
                        const arrName = inputs[0]?.value.trim();
                        const indexBlock = targetSlot.querySelector('.array-index .workspace-block');
                        const index = indexBlock ? evaluateBlock(indexBlock) : 0;
                        
                        if (arrName) {
                            setArrayElement(arrName, index, value);
                            interpreterState.output.push(`${arrName}[${index}] = ${value}`);
                        }
                    }
                }
                break;
                
            case 'print':
                const printSlot = block.querySelector('.print-value .workspace-block');
                if (printSlot) {
                    const value = evaluateBlock(printSlot);
                    if (Array.isArray(value)) {
                        interpreterState.output.push(`Вывод: [${value.join(', ')}]`);
                    } else {
                        interpreterState.output.push(`Вывод: ${value}`);
                    }
                }
                break;
                
            case 'if_block':
                const condSlot = block.querySelector('.condition .workspace-block');
                const thenBody = block.querySelector('.then-block .body-content');
                const condition = condSlot ? evaluateCondition(condSlot) : false;
                
                if (condition) {
                    interpreterState.output.push(`Условие истинно`);
                    if (thenBody) {
                        const children = thenBody.querySelectorAll(':scope > .workspace-block');
                        children.forEach(child => executeBlock(child));
                    }
                } else {
                    interpreterState.output.push(`Условие ложно`);
                }
                break;
                
            case 'else_block':
                const elseBody = block.querySelector('.else-block .body-content');
                if (elseBody) {
                    const children = elseBody.querySelectorAll(':scope > .workspace-block');
                    children.forEach(child => executeBlock(child));
                }
                break;
                
            case 'if_else_block':
                const ifCondSlot = block.querySelector('.condition .workspace-block');
                const ifThenBody = block.querySelector('.then-block .body-content');
                const ifElseBody = block.querySelector('.else-block .body-content');
                const ifCondition = ifCondSlot ? evaluateCondition(ifCondSlot) : false;
                
                if (ifCondition) {
                    interpreterState.output.push(`Условие истинно, выполняем THEN`);
                    if (ifThenBody) {
                        const children = ifThenBody.querySelectorAll(':scope > .workspace-block');
                        children.forEach(child => executeBlock(child));
                    }
                } else {
                    interpreterState.output.push(`Условие ложно, выполняем ELSE`);
                    if (ifElseBody) {
                        const children = ifElseBody.querySelectorAll(':scope > .workspace-block');
                        children.forEach(child => executeBlock(child));
                    }
                }
                break;
                
            case 'while_loop':
                const whileCondSlot = block.querySelector('.condition .workspace-block');
                const whileBody = block.querySelector('.while-body .body-content');
                let iterations = 0;
                const MAX_ITER = 1000;
                
                interpreterState.output.push(`Начало цикла WHILE`);
                
                while (iterations < MAX_ITER) {
                    const condition = whileCondSlot ? evaluateCondition(whileCondSlot) : false;
                    if (!condition) break;
                    
                    iterations++;
                    if (whileBody) {
                        const children = whileBody.querySelectorAll(':scope > .workspace-block');
                        children.forEach(child => executeBlock(child));
                    }
                }
                
                interpreterState.output.push(`Цикл WHILE завершён (${iterations} итераций)`);
                break;
                
            case 'for_loop':
                const forInit = block.querySelector('.for-init .body-content .workspace-block');
                const forCond = block.querySelector('.for-condition .body-content .workspace-block');
                const forStep = block.querySelector('.for-step .body-content .workspace-block');
                const forBody = block.querySelector('.for-body .body-content');
                let forIter = 0;
                
                interpreterState.output.push(`Начало цикла FOR`);
                
                if (forInit) executeBlock(forInit);
                
                while (forIter < 1000) {
                    if (forCond) {
                        const condition = evaluateCondition(forCond);
                        if (!condition) break;
                    }
                    
                    forIter++;
                    
                    if (forBody) {
                        const children = forBody.querySelectorAll(':scope > .workspace-block');
                        children.forEach(child => executeBlock(child));
                    }
                    
                    if (forStep) executeBlock(forStep);
                }
                
                interpreterState.output.push(`Цикл FOR завершён (${forIter} итераций)`);
                break;
                
            case 'begin_end':
                interpreterState.output.push(`Вход в область видимости`);
                const newScope = {};
                interpreterState.scopeStack.push(newScope);
                
                const beginBody = block.querySelector('.begin-body .body-content');
                if (beginBody) {
                    const children = beginBody.querySelectorAll(':scope > .workspace-block');
                    children.forEach(child => executeBlock(child));
                }
                
                interpreterState.scopeStack.pop();
                interpreterState.output.push(`Выход из области видимости`);
                break;
                
            case 'bubble_sort':
                const arraySlot = block.querySelector('.array-for-sort .workspace-block');
                
                if (!arraySlot) {
                    interpreterState.output.push(`Ошибка: не указан массив для сортировки`);
                    return;
                }
                
                if (arraySlot.dataset.type !== 'array') {
                    interpreterState.output.push(`Ошибка: в слот нужно перетащить блок "Массив"`);
                    return;
                }
                
                const arrayInput = arraySlot.querySelector('input[placeholder="имя массива"]');
                const arrayName = arrayInput?.value.trim();
                
                if (!arrayName) {
                    interpreterState.output.push(`Ошибка: не указано имя массива`);
                    return;
                }
                
                let arr = interpreterState.arrays[arrayName];
                if (!arr) {
                    interpreterState.output.push(`Массив ${arrayName} не найден, создаю тестовый [5, 2, 8, 1, 3]`);
                    arr = [5, 2, 8, 1, 3];
                    interpreterState.arrays[arrayName] = [...arr];
                } else {
                    arr = [...arr];
                }
                
                interpreterState.output.push(`Исходный массив ${arrayName}: [${arr.join(', ')}]`);
                
                const n = arr.length;
                for (let i = 0; i < n - 1; i++) {
                    for (let j = 0; j < n - i - 1; j++) {
                        if (arr[j] > arr[j + 1]) {
                            [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                        }
                    }
                }
                
                interpreterState.arrays[arrayName] = [...arr];
                
                interpreterState.output.push(`Отсортированный массив ${arrayName}: [${arr.join(', ')}]`);
                interpreterState.output.push(`✅ Сортировка пузырьком завершена`);
                break;
        }
    } catch (e) {
        interpreterState.output.push(`Ошибка: ${e.message}`);
    }
}

window.runProgram = function() {
    resetInterpreter();
    
    const workspace = document.getElementById('workspace');
    const blocks = workspace.querySelectorAll('.workspace-block');
    
    interpreterState.output.push('ЗАПУСК ПРОГРАММЫ');
    interpreterState.output.push('═══════════════════');
    
    const rootBlocks = Array.from(blocks).filter(block => {
        return !block.parentElement?.classList?.contains('body-content');
    });
    
    rootBlocks.forEach(block => executeBlock(block));
    
    interpreterState.output.push('═══════════════════');
    interpreterState.output.push('ПРОГРАММА ЗАВЕРШЕНА');
    
    Object.keys(interpreterState.variables).forEach(key => {
        window.globalVariables[key] = interpreterState.variables[key];
    });
    
    Object.keys(interpreterState.arrays).forEach(key => {
        window.globalArrays[key] = [...interpreterState.arrays[key]];
    });
    
    updateVariablesDisplay();
    updateArraysDisplay();
    
    return {
        variables: window.globalVariables,
        arrays: window.globalArrays,
        output: interpreterState.output
    };
};