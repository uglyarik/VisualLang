function initUI() {
    initTabs();
    initZoom();
    initVariablesDisplay();
    initArraysDisplay();
    initOutputDisplay();
    initThemeToggle();
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
}

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
    let scale = 0.8;
    
    function updateZoom() {
        const workspace = document.getElementById('workspace');
        if (!workspace) return;
        
        workspace.style.transform = `scale(${scale})`;
        window.__core__.workspaceScale = scale;
    }
    
    window.zoomIn = function() {
        scale = Math.min(1.5, scale + 0.1);
        updateZoom();
    };
    
    window.zoomOut = function() {
        scale = Math.max(0.3, scale - 0.1);
        updateZoom();
    };
    
    window.resetZoom = function() {
        scale = 0.8;
        updateZoom();
    };
    
    setTimeout(updateZoom, 100);
    
    const zoomInBtn = document.querySelector('[onclick*="zoomIn"]');
    const zoomOutBtn = document.querySelector('[onclick*="zoomOut"]');
    const resetZoomBtn = document.querySelector('[onclick*="resetZoom"]');
    
    if (zoomInBtn) zoomInBtn.onclick = window.zoomIn;
    if (zoomOutBtn) zoomOutBtn.onclick = window.zoomOut;
    if (resetZoomBtn) resetZoomBtn.onclick = window.resetZoom;
}

function initVariablesDisplay() {
    window.updateVariablesDisplay = function() {
        const container = document.getElementById('variables-list');
        if (!container) return;
        
        const vars = window.globalVariables || {};
        const count = Object.keys(vars).length;
        
        const badge = document.getElementById('variables-badge');
        if (badge) badge.textContent = count;
        
        if (count === 0) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-box-open"></i><p>Нет переменных</p></div>`;
            return;
        }
        
        let html = '';
        Object.keys(vars).sort().forEach(name => {
            html += `<div class="var-item"><span class="var-name">${name}</span><span class="var-value">= ${vars[name]}</span></div>`;
        });
        container.innerHTML = html;
    };
}

function initArraysDisplay() {
    window.updateArraysDisplay = function() {
        const container = document.getElementById('arrays-list');
        if (!container) return;
        
        const arrays = window.globalArrays || {};
        const count = Object.keys(arrays).length;
        
        const badge = document.getElementById('arrays-badge');
        if (badge) badge.textContent = count;
        
        if (count === 0) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-box-open"></i><p>Нет массивов</p></div>`;
            return;
        }
        
        let html = '';
        Object.keys(arrays).sort().forEach(name => {
            const arr = arrays[name];
            html += `
                <div class="var-item" style="flex-direction:column; align-items:flex-start;">
                    <div><span class="var-name">${name}</span> <span style="color:var(--text-muted);">[${arr.length}]</span></div>
                    <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;">
                        ${arr.slice(0,8).map((v,i)=>`<span style="background:var(--bg-hover); padding:2px 6px; border-radius:3px;">[${i}]:${v}</span>`).join('')}
                        ${arr.length>8 ? '<span style="color:var(--text-muted);">...</span>' : ''}
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    };
}

function initOutputDisplay() {
    window.updateOutputDisplay = function() {
        const container = document.getElementById('output-content');
        if (!container) return;
        
        const logs = window.outputLog || [];
        
        if (logs.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-play-circle"></i><p>Нажмите "Запустить"</p></div>';
            return;
        }
        
        let html = '';
        logs.forEach(line => {
            html += `<div class="output-line">${line}</div>`;
        });
        
        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
    };
}

function initThemeToggle() {
    const toolbar = document.querySelector('.toolbar-actions');
    if (!toolbar) return;
    
    const themeBtn = document.createElement('button');
    themeBtn.className = 'btn btn-icon';
    themeBtn.id = 'theme-toggle';
    themeBtn.title = 'Сменить тему';
    
    const isDark = document.body.classList.contains('dark-theme');
    themeBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    
    themeBtn.addEventListener('click', function() {
        document.body.classList.toggle('dark-theme');
        
        const isDarkNow = document.body.classList.contains('dark-theme');
        this.innerHTML = isDarkNow ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        
        localStorage.setItem('theme', isDarkNow ? 'dark' : 'light');
        
        updateOutputDisplay();
    });
    
    toolbar.appendChild(themeBtn);
}

window.initUI = initUI;