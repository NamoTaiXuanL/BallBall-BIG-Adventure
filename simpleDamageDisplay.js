// 简单伤害显示系统 - 类似网络游戏的伤害数字显示
// 版本: 1.0.0
// 日期: 2025-01-12

class SimpleDamageDisplay {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.damageTexts = []; // 存储伤害文字对象
        this.recentRecords = []; // 存储最近伤害记录
        this.maxTexts = 20; // 最大显示数量
        this.maxRecords = 5; // 最大记录数量
        
        // 显示配置
        this.config = {
            fontSize: 16,
            criticalFontSize: 20,
            normalColor: '#FFFFFF',
            criticalColor: '#FFD700',
            shadowColor: '#000000',
            duration: 2000, // 显示持续时间(毫秒)
            fadeTime: 500,  // 淡出时间(毫秒)
            moveSpeed: 30,  // 上升速度
            spacing: 25,    // 文字间距
            recordFontSize: 14, // 记录字体大小
            recordLineHeight: 20 // 记录行高
        };
        
        // 绑定到全局
        window.simpleDamageDisplay = this;
    }
    
    // 添加伤害文字
    addDamageText(damage, x, y, isCritical = false) {
        const now = Date.now();
        
        // 计算显示位置(避免重叠)
        const displayY = this.calculateDisplayY(y);
        
        const damageText = {
            damage: Math.round(damage),
            x: x,
            y: displayY,
            startY: displayY,
            isCritical: isCritical,
            startTime: now,
            alpha: 1.0
        };
        
        this.damageTexts.push(damageText);
        
        // 添加到最近记录
        this.addToRecentRecords(Math.round(damage), isCritical);
        
        // 限制数量
        if (this.damageTexts.length > this.maxTexts) {
            this.damageTexts.shift();
        }
    }
    
    // 添加到最近伤害记录
    addToRecentRecords(damage, isCritical) {
        const record = {
            damage: damage,
            isCritical: isCritical,
            time: new Date().toLocaleTimeString('zh-CN', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
            })
        };
        
        this.recentRecords.unshift(record);
        
        // 限制记录数量
        if (this.recentRecords.length > this.maxRecords) {
            this.recentRecords.pop();
        }
    }
    
    // 计算显示Y坐标，避免重叠
    calculateDisplayY(baseY) {
        let displayY = baseY;
        const recentTexts = this.damageTexts.filter(text => 
            Date.now() - text.startTime < 1000 && 
            Math.abs(text.x - baseY) < 100
        );
        
        if (recentTexts.length > 0) {
            displayY = Math.min(...recentTexts.map(t => t.y)) - this.config.spacing;
        }
        
        return displayY;
    }
    
    // 更新和渲染
    update() {
        const now = Date.now();
        const ctx = this.ctx;
        
        // 更新位置和透明度
        this.damageTexts = this.damageTexts.filter(text => {
            const elapsed = now - text.startTime;
            
            // 超时移除
            if (elapsed > this.config.duration) {
                return false;
            }
            
            // 更新位置
            text.y = text.startY - (elapsed / 1000) * this.config.moveSpeed;
            
            // 更新透明度
            if (elapsed > this.config.duration - this.config.fadeTime) {
                const fadeProgress = (elapsed - (this.config.duration - this.config.fadeTime)) / this.config.fadeTime;
                text.alpha = 1.0 - fadeProgress;
            }
            
            return true;
        });
        
        // 渲染所有伤害文字和记录面板
        this.render();
        this.renderRecentRecords();
    }
    
    // 渲染伤害文字
    render() {
        const ctx = this.ctx;
        
        this.damageTexts.forEach(text => {
            ctx.save();
            
            // 设置透明度
            ctx.globalAlpha = text.alpha;
            
            // 设置字体和颜色
            const fontSize = text.isCritical ? this.config.criticalFontSize : this.config.fontSize;
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = 'center';
            
            // 绘制阴影
            ctx.fillStyle = this.config.shadowColor;
            ctx.fillText(text.damage.toString(), text.x + 1, text.y + 1);
            
            // 绘制主文字
            ctx.fillStyle = text.isCritical ? this.config.criticalColor : this.config.normalColor;
            ctx.fillText(text.damage.toString(), text.x, text.y);
            
            // 暴击效果
            if (text.isCritical) {
                ctx.strokeStyle = this.config.criticalColor;
                ctx.lineWidth = 1;
                ctx.strokeText(text.damage.toString(), text.x, text.y);
            }
            
            ctx.restore();
        });
    }
    
    // 渲染最近伤害记录面板
    renderRecentRecords() {
        if (this.recentRecords.length === 0) return;
        
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        // 记录显示位置(屏幕右上角，避免与飞出文字重叠)
        const recordX = canvas.width - 20;
        const startY = 30;
        
        ctx.save();
        
        // 绘制记录(无背景，直接显示文字)
        ctx.font = `${this.config.recordFontSize}px Arial`;
        ctx.textAlign = 'right';
        
        this.recentRecords.forEach((record, index) => {
            const y = startY + index * this.config.recordLineHeight;
            
            // 伤害值和时间合并显示
            const damageText = record.isCritical ? `${record.damage}!` : record.damage.toString();
            const displayText = `${damageText} (${record.time})`;
            
            // 绘制阴影
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillText(displayText, recordX + 1, y + 1);
            
            // 绘制主文字
            ctx.fillStyle = record.isCritical ? this.config.criticalColor : this.config.normalColor;
            ctx.fillText(displayText, recordX, y);
        });
        
        ctx.restore();
    }
    
    // 清空所有伤害文字
    clear() {
        this.damageTexts = [];
        this.recentRecords = [];
    }
}

// 导出
window.SimpleDamageDisplay = SimpleDamageDisplay;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SimpleDamageDisplay
    };
}