// 怪物调试面板 - v3.9.22
// 按Tab键调出，显示附近怪物的详细状态信息

class DebugPanel {
    constructor(game) {
        this.game = game;
        this.isVisible = false;
        this.panel = null;
        this.updateInterval = null;
        this.init();
    }

    init() {
        // 创建调试面板DOM元素
        this.panel = document.createElement('div');
        this.panel.id = 'debug-panel';
        this.panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 400px;
            max-height: 80vh;
            background: rgba(0, 0, 0, 0.9);
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            padding: 10px;
            border: 2px solid #00ff00;
            border-radius: 5px;
            overflow-y: auto;
            z-index: 10000;
            display: none;
        `;
        document.body.appendChild(this.panel);

        // 绑定Tab键事件
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    toggle() {
        this.isVisible = !this.isVisible;
        this.panel.style.display = this.isVisible ? 'block' : 'none';
        
        if (this.isVisible) {
            this.startUpdating();
        } else {
            this.stopUpdating();
        }
    }

    startUpdating() {
        this.updatePanel();
        this.updateInterval = setInterval(() => {
            this.updatePanel();
        }, 100); // 每100ms更新一次
    }

    stopUpdating() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    updatePanel() {
        if (!this.isVisible || !this.game) return;

        const player = this.game.player;
        const enemies = this.game.enemies || [];
        const buffSystem = this.game.buffSystem;

        let html = '<h3>🐛 怪物调试面板</h3>';
        html += '<button onclick="game.enemies = []; console.log(\'已清除所有怪物\');" style="background: #ff4444; color: white; border: none; padding: 5px 10px; margin: 5px; cursor: pointer;">清除所有怪物</button>';
        html += '<div style="border-bottom: 1px solid #00ff00; margin-bottom: 10px; padding-bottom: 5px;">';
        html += `<strong>玩家位置:</strong> (${Math.round(player.x)}, ${Math.round(player.y)})<br>`;
        html += `<strong>怪物总数:</strong> ${enemies.length}<br>`;
        html += `<strong>Buff系统:</strong> ${this.game.buffSystem ? '已加载' : '未加载'}<br>`;
        if (this.game.buffSystem) {
            const activeBuffs = this.game.buffSystem.getActiveBuffs();
            html += `<strong>激活Buff:</strong> ${Array.from(activeBuffs.keys()).join(', ') || '无'}`;
        }
        html += '</div>';

        // 获取附近的怪物（距离玩家1000像素内）
        const nearbyEnemies = enemies.filter(enemy => {
            const distance = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
            return distance <= 1000;
        }).sort((a, b) => {
            const distA = Math.sqrt((a.x - player.x) ** 2 + (a.y - player.y) ** 2);
            const distB = Math.sqrt((b.x - player.x) ** 2 + (b.y - player.y) ** 2);
            return distA - distB;
        });

        html += `<h4>附近怪物 (${nearbyEnemies.length}个):</h4>`;
        
        if (nearbyEnemies.length === 0) {
            html += '<p style="color: #ffff00;">附近没有怪物</p>';
        } else {
            nearbyEnemies.slice(0, 10).forEach((enemy, index) => {
                const distance = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
                const distanceFromSpawn = enemy.distanceFromSpawn || Math.sqrt(enemy.x ** 2 + enemy.y ** 2);
                
                // 检查怪物是否有level属性
                const hasLevelProp = enemy.hasOwnProperty('level');
                const hasDistanceProp = enemy.hasOwnProperty('distanceFromSpawn');
                const level = enemy.level || Math.max(1, Math.floor(distanceFromSpawn / 500));
                
                // 调试信息：显示所有属性
                console.log(`[DEBUG] 怪物属性检查: type=${enemy.type}, hasLevel=${hasLevelProp}, hasDistance=${hasDistanceProp}, level=${enemy.level}, distanceFromSpawn=${enemy.distanceFromSpawn}`);
                console.log(`[DEBUG] 怪物所有属性:`, Object.keys(enemy));
                
                html += '<div style="border: 1px solid #333; margin: 5px 0; padding: 5px; background: rgba(0, 50, 0, 0.3);">';
                html += `<strong style="color: #ffff00;">[${index + 1}] ${enemy.type || 'unknown'}</strong><br>`;
                html += `<strong>坐标:</strong> (${Math.round(enemy.x)}, ${Math.round(enemy.y)})<br>`;
                html += `<strong>距离玩家:</strong> ${Math.round(distance)}px<br>`;
                html += `<strong>距离出生点:</strong> ${Math.round(distanceFromSpawn)}px<br>`;
                html += `<strong>等级:</strong> ${level}${hasLevelProp ? '' : '(计算)'}<br>`;
                html += `<strong>血量:</strong> ${Math.round(enemy.health || 0)}/${Math.round(enemy.maxHealth || 0)}<br>`;
                html += `<strong>攻击力:</strong> ${Math.round(enemy.damage || 0)}<br>`;
                html += `<strong>速度:</strong> ${Math.round(enemy.speed || 0)}<br>`;
                html += `<strong>半径:</strong> ${Math.round(enemy.radius || 0)}<br>`;
                html += `<strong>直径:</strong> ${Math.round((enemy.radius || 0) * 2)}<br>`;
                html += `<strong>检测范围:</strong> ${Math.round(enemy.detectionRange || 0)}<br>`;
                html += `<strong>追击范围:</strong> ${Math.round(enemy.chaseRange || 0)}<br>`;
                html += `<strong>状态:</strong> ${enemy.state || 'unknown'}<br>`;
                html += `<strong>眩晕:</strong> ${enemy.stunned || 0}<br>`;
                
                // 显示buff信息
                if (buffSystem && enemy.buffs) {
                    html += `<strong>Buff:</strong> ${Object.keys(enemy.buffs).join(', ') || '无'}<br>`;
                }
                
                // 计算理论血量加成（与buffSystem.js保持一致）
                const healthBonus = Math.floor(distanceFromSpawn / 10000) * 100;
                if (healthBonus > 0) {
                    html += `<strong style="color: #ff6600;">理论血量加成:</strong> +${healthBonus}<br>`;
                }
                
                // 计算理论等级强化（与buffSystem.js保持一致）
                if (level > 1) {
                    const levelMultiplier = 1 + (level - 1) * 1.0; // 线性增长，每级增加100%
                    html += `<strong style="color: #ff6600;">理论血量倍数:</strong> x${levelMultiplier.toFixed(2)}<br>`;
                }
                
                // 显示属性调试信息
                html += `<strong style="color: #888;">属性调试:</strong> level=${enemy.level}, distanceFromSpawn=${enemy.distanceFromSpawn}<br>`;
                
                html += '</div>';
            });
            
            if (nearbyEnemies.length > 10) {
                html += `<p style="color: #888;">... 还有 ${nearbyEnemies.length - 10} 个怪物</p>`;
            }
        }

        // 显示buff系统详细信息
        if (buffSystem) {
            html += '<h4>Buff系统状态:</h4>';
            html += '<div style="border: 1px solid #333; margin: 5px 0; padding: 5px; background: rgba(0, 0, 50, 0.3);">';
            
            const levelBuff = this.game.buffSystem ? this.game.buffSystem.getBuff('levelEnhancement') : null;
            if (levelBuff) {
                html += `<strong>等级强化Buff:</strong><br>`;
                html += `- 激活状态: ${levelBuff.isActive ? '是' : '否'}<br>`;
                html += `- 血量倍数: ${levelBuff.effects.healthMultiplier}<br>`;
                html += `- 攻击倍数: ${levelBuff.effects.damageMultiplier}<br>`;
                html += `- 速度倍数: ${levelBuff.effects.speedMultiplier}<br>`;
            } else {
                html += '<strong style="color: #ff0000;">等级强化Buff: 未找到</strong><br>';
            }
            
            html += '</div>';
        }

        html += '<div style="margin-top: 10px; font-size: 10px; color: #888;">';
        html += '按Tab键关闭调试面板';
        html += '</div>';

        this.panel.innerHTML = html;
    }

    destroy() {
        this.stopUpdating();
        if (this.panel) {
            document.body.removeChild(this.panel);
        }
    }
}

// 导出调试面板类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DebugPanel;
} else if (typeof window !== 'undefined') {
    window.DebugPanel = DebugPanel;
}