// 调试日志系统 - 记录游戏运行时的所有buff相关信息
// 版本: 3.9.30
// 日期: 2025-01-11

class DebugLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000; // 最大日志条数
        this.isEnabled = true;
        this.logContainer = null;
        this.init();
    }

    init() {
        // 创建日志显示容器
        this.createLogContainer();
        console.log('[DebugLogger] 调试日志系统已初始化');
    }

    createLogContainer() {
        // 创建日志显示面板
        const logPanel = document.createElement('div');
        logPanel.id = 'debug-log-panel';
        logPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 400px;
            height: 300px;
            background: rgba(0, 0, 0, 0.8);
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            padding: 10px;
            border: 1px solid #00ff00;
            border-radius: 5px;
            overflow-y: auto;
            z-index: 10000;
            display: none;
        `;
        
        // 添加标题
        const title = document.createElement('div');
        title.textContent = '调试日志 (按F12切换显示)';
        title.style.cssText = `
            color: #ffff00;
            font-weight: bold;
            margin-bottom: 10px;
            border-bottom: 1px solid #00ff00;
            padding-bottom: 5px;
        `;
        logPanel.appendChild(title);
        
        // 日志内容容器
        this.logContainer = document.createElement('div');
        this.logContainer.id = 'debug-log-content';
        logPanel.appendChild(this.logContainer);
        
        document.body.appendChild(logPanel);
        
        // 添加快捷键切换显示
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F12') {
                e.preventDefault();
                const panel = document.getElementById('debug-log-panel');
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }
        });
    }

    log(category, message, data = null) {
        if (!this.isEnabled) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            timestamp,
            category,
            message,
            data: data ? JSON.stringify(data, null, 2) : null
        };
        
        this.logs.push(logEntry);
        
        // 限制日志数量
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        // 输出到控制台
        console.log(`[${category}] ${timestamp}: ${message}`, data || '');
        
        // 更新显示面板
        this.updateLogDisplay(logEntry);
    }

    updateLogDisplay(logEntry) {
        if (!this.logContainer) return;
        
        const logElement = document.createElement('div');
        logElement.style.cssText = `
            margin-bottom: 5px;
            padding: 3px;
            border-left: 3px solid ${this.getCategoryColor(logEntry.category)};
            padding-left: 8px;
        `;
        
        const content = `[${logEntry.timestamp}] [${logEntry.category}] ${logEntry.message}`;
        logElement.textContent = content;
        
        if (logEntry.data) {
            const dataElement = document.createElement('pre');
            dataElement.style.cssText = `
                color: #888;
                font-size: 10px;
                margin: 2px 0;
                white-space: pre-wrap;
            `;
            dataElement.textContent = logEntry.data;
            logElement.appendChild(dataElement);
        }
        
        this.logContainer.appendChild(logElement);
        
        // 自动滚动到底部
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
        
        // 限制显示的日志条数
        const children = this.logContainer.children;
        if (children.length > 50) {
            this.logContainer.removeChild(children[0]);
        }
    }

    getCategoryColor(category) {
        const colors = {
            'BUFF': '#00ff00',
            'ENEMY': '#ff6600',
            'GAME': '#0099ff',
            'ERROR': '#ff0000',
            'WARNING': '#ffff00',
            'INFO': '#ffffff'
        };
        return colors[category] || '#888888';
    }

    // Buff相关日志方法
    logBuffActivation(buffId, buffData) {
        this.log('BUFF', `Buff激活: ${buffId}`, buffData);
    }

    logBuffDeactivation(buffId) {
        this.log('BUFF', `Buff停用: ${buffId}`);
    }

    logBuffApplication(buffId, target, effects) {
        this.log('BUFF', `Buff应用: ${buffId} -> ${target}`, effects);
    }

    logBuffUpdate(buffId, status) {
        this.log('BUFF', `Buff更新: ${buffId}`, status);
    }

    // 敌人相关日志方法
    logEnemyCreation(enemy) {
        this.log('ENEMY', `敌人创建: ${enemy.type} (等级${enemy.level})`, {
            x: enemy.x,
            y: enemy.y,
            health: enemy.health,
            level: enemy.level,
            distanceFromSpawn: enemy.distanceFromSpawn
        });
    }

    logEnemyLevelScaling(enemy, beforeStats, afterStats) {
        this.log('ENEMY', `敌人等级强化: ${enemy.type} 等级${enemy.level}`, {
            before: beforeStats,
            after: afterStats
        });
    }

    // 游戏状态日志方法
    logGameState(state, data) {
        this.log('GAME', `游戏状态: ${state}`, data);
    }

    // 错误日志方法
    logError(message, error) {
        this.log('ERROR', message, error);
    }

    logWarning(message, data) {
        this.log('WARNING', message, data);
    }

    // 导出日志
    exportLogs() {
        const logsJson = JSON.stringify(this.logs, null, 2);
        const blob = new Blob([logsJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.log('INFO', '日志已导出');
    }

    // 清空日志
    clearLogs() {
        this.logs = [];
        if (this.logContainer) {
            this.logContainer.innerHTML = '';
        }
        this.log('INFO', '日志已清空');
    }

    // 切换日志记录状态
    toggle() {
        this.isEnabled = !this.isEnabled;
        this.log('INFO', `调试日志${this.isEnabled ? '已启用' : '已禁用'}`);
    }
}

// 全局调试日志实例
if (typeof window !== 'undefined') {
    window.debugLogger = new DebugLogger();
    
    // 添加全局快捷键
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            window.debugLogger.toggle();
        }
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            window.debugLogger.exportLogs();
        }
        if (e.ctrlKey && e.key === 'c') {
            e.preventDefault();
            window.debugLogger.clearLogs();
        }
    });
}

// 模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DebugLogger;
}