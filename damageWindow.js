// 伤害记录窗口 - 显示伤害统计和记录的UI界面
// 版本: 4.0.1
// 日期: 2025-09-06

class DamageWindow {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // 窗口位置和大小
        this.detailWindow = {
            x: 50,
            y: 50,
            width: 600,
            height: 500,
            visible: false
        };
        
        // 简略显示位置（屏幕右侧中间）
        this.summaryDisplay = {
            x: 0, // 将在resize时计算
            y: 0, // 将在resize时计算
            width: 200,
            height: 150,
            visible: true
        };
        
        // 滚动位置
        this.scrollOffset = 0;
        this.maxScroll = 0;
        
        // 字体设置
        this.fonts = {
            title: '16px Arial',
            header: '14px Arial',
            content: '12px Arial',
            small: '10px Arial'
        };
        
        // 颜色设置
        this.colors = {
            background: 'rgba(0, 0, 0, 0.8)',
            border: '#666',
            title: '#FFD700',
            header: '#FFF',
            content: '#CCC',
            critical: '#FF4444',
            normal: '#FFF',
            summary: '#FFF'
        };
        
        this.updateSummaryPosition();
    }
    
    // 更新简略显示位置
    updateSummaryPosition() {
        this.summaryDisplay.x = this.canvas.width - this.summaryDisplay.width - 20;
        this.summaryDisplay.y = (this.canvas.height - this.summaryDisplay.height) / 2;
    }
    
    // 渲染主函数
    render() {
        this.updateSummaryPosition();
        
        if (window.damageTracker) {
            if (window.damageTracker.isVisible) {
                this.renderDetailWindow();
            } else if (window.damageTracker.showSummary) {
                this.renderSummaryDisplay();
            }
        }
    }
    
    // 渲染详细窗口
    renderDetailWindow() {
        const win = this.detailWindow;
        const ctx = this.ctx;
        const tracker = window.damageTracker;
        
        // 绘制窗口背景
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(win.x, win.y, win.width, win.height);
        
        // 绘制边框
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(win.x, win.y, win.width, win.height);
        
        // 绘制标题
        ctx.fillStyle = this.colors.title;
        ctx.font = this.fonts.title;
        ctx.fillText('伤害记录统计', win.x + 10, win.y + 25);
        
        // 绘制关闭提示
        ctx.fillStyle = this.colors.content;
        ctx.font = this.fonts.small;
        ctx.fillText('按L键关闭', win.x + win.width - 80, win.y + 25);
        
        let yOffset = win.y + 50;
        
        // 绘制总体统计
        this.renderOverallStats(win.x + 10, yOffset, tracker);
        yOffset += 80;
        
        // 绘制按怪物类型统计
        this.renderMonsterTypeStats(win.x + 10, yOffset, tracker);
        yOffset += 150;
        
        // 绘制按伤害来源统计
        this.renderDamageSourceStats(win.x + 10, yOffset, tracker);
        yOffset += 100;
        
        // 绘制最近伤害记录
        this.renderRecentRecords(win.x + 10, yOffset, tracker, win.y + win.height - 20);
    }
    
    // 渲染总体统计
    renderOverallStats(x, y, tracker) {
        const ctx = this.ctx;
        
        ctx.fillStyle = this.colors.header;
        ctx.font = this.fonts.header;
        ctx.fillText('总体统计', x, y);
        
        ctx.fillStyle = this.colors.content;
        ctx.font = this.fonts.content;
        
        const stats = [
            `总伤害: ${tracker.totalDamage.toLocaleString()}`,
            `总命中: ${tracker.totalHits}`,
            `暴击次数: ${tracker.criticalHits}`,
            `暴击率: ${tracker.getCriticalRate()}%`,
            `平均伤害: ${tracker.getAverageDamage()}`,
            `DPS: ${tracker.getDPS()}`
        ];
        
        stats.forEach((stat, index) => {
            const row = Math.floor(index / 2);
            const col = index % 2;
            ctx.fillText(stat, x + col * 200, y + 20 + row * 20);
        });
    }
    
    // 渲染按怪物类型统计
    renderMonsterTypeStats(x, y, tracker) {
        const ctx = this.ctx;
        
        ctx.fillStyle = this.colors.header;
        ctx.font = this.fonts.header;
        ctx.fillText('按怪物类型伤害统计 (前5名)', x, y);
        
        const topTypes = tracker.getTopDamageByType(5);
        
        ctx.fillStyle = this.colors.content;
        ctx.font = this.fonts.content;
        
        topTypes.forEach((typeData, index) => {
            const yPos = y + 25 + index * 20;
            const typeName = tracker.getMonsterTypeName(typeData.type);
            const text = `${typeName}: ${typeData.total.toLocaleString()} (${typeData.count}次, 平均${typeData.average}, 暴击${typeData.critical})`;
            ctx.fillText(text, x, yPos);
        });
    }
    
    // 渲染按伤害来源统计
    renderDamageSourceStats(x, y, tracker) {
        const ctx = this.ctx;
        
        ctx.fillStyle = this.colors.header;
        ctx.font = this.fonts.header;
        ctx.fillText('按伤害来源统计', x, y);
        
        const sources = tracker.getTopDamageBySource();
        
        ctx.fillStyle = this.colors.content;
        ctx.font = this.fonts.content;
        
        sources.forEach((sourceData, index) => {
            const yPos = y + 25 + index * 20;
            const sourceName = tracker.getDamageSourceName(sourceData.source);
            const text = `${sourceName}: ${sourceData.total.toLocaleString()} (${sourceData.count}次, 平均${sourceData.average})`;
            ctx.fillText(text, x, yPos);
        });
    }
    
    // 渲染最近伤害记录
    renderRecentRecords(x, y, tracker, maxY) {
        const ctx = this.ctx;
        
        ctx.fillStyle = this.colors.header;
        ctx.font = this.fonts.header;
        ctx.fillText('最近伤害记录', x, y);
        
        const records = tracker.getRecentRecords(15);
        
        ctx.font = this.fonts.small;
        
        records.forEach((record, index) => {
            const yPos = y + 25 + index * 15;
            if (yPos > maxY) return; // 超出窗口范围
            
            ctx.fillStyle = record.isCritical ? this.colors.critical : this.colors.content;
            
            const monsterName = tracker.getMonsterTypeName(record.monsterType);
            const sourceName = tracker.getDamageSourceName(record.damageSource);
            const criticalMark = record.isCritical ? ' [暴击]' : '';
            
            const text = `${record.time} - ${monsterName}: ${record.damage}${criticalMark} (${sourceName})`;
            ctx.fillText(text, x, yPos);
        });
    }
    
    // 渲染简略显示
    renderSummaryDisplay() {
        const sum = this.summaryDisplay;
        const ctx = this.ctx;
        const tracker = window.damageTracker;
        
        if (!tracker || tracker.totalHits === 0) return;
        
        // 不绘制背景，只显示文字
        ctx.fillStyle = this.colors.summary;
        ctx.font = this.fonts.content;
        
        const stats = [
            `伤害: ${this.formatNumber(tracker.totalDamage)}`,
            `命中: ${tracker.totalHits}`,
            `暴击: ${tracker.getCriticalRate()}%`,
            `DPS: ${tracker.getDPS()}`,
            `平均: ${tracker.getAverageDamage()}`
        ];
        
        // 添加阴影效果以提高可读性
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.shadowBlur = 2;
        
        stats.forEach((stat, index) => {
            ctx.fillText(stat, sum.x, sum.y + index * 20);
        });
        
        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;
        
        // 显示L键提示
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = this.fonts.small;
        ctx.fillText('L键详情', sum.x, sum.y + stats.length * 20 + 15);
    }
    
    // 格式化数字显示
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    // 处理窗口大小变化
    onResize() {
        this.updateSummaryPosition();
    }
    
    // 切换详细窗口显示
    toggleDetailWindow() {
        if (window.damageTracker) {
            window.damageTracker.toggleVisibility();
        }
    }
    
    // 切换简略显示
    toggleSummaryDisplay() {
        if (window.damageTracker) {
            window.damageTracker.toggleSummary();
        }
    }
}

// 导出到全局作用域
window.DamageWindow = DamageWindow;

// Node.js 模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DamageWindow
    };
}