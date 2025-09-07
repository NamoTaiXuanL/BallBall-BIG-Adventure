/**
 * 形态切换系统模块 v4.4.0
 * 管理玩家的三种形态：A形态(攻击)、B形态(默认)、C形态(防御)
 * 创建时间：2025-01-06
 */

class FormSystem {
    constructor() {
        // 形态定义
        this.forms = {
            A: {
                name: 'A形态 - 攻击',
                displayName: '攻击形态',
                color: '#FF4444',
                effects: {
                    moveSpeedMultiplier: 1.3,      // 移动速度增加30%
                    bulletSpeedMultiplier: 1.5,    // 子弹射速增加50%
                    bulletRangeMultiplier: 1.3,    // 子弹射程增加30%
                    bulletDamageMultiplier: 2.0,   // 伤害增加100%
                    skillCostMultiplier: 0.8,      // 技能消耗减少20%
                    damageReceivedMultiplier: 1.5, // 受到伤害增加50%
                    windFireDamageMultiplier: 2.0  // 风火轮伤害增加100%
                }
            },
            B: {
                name: 'B形态 - 默认',
                displayName: '默认形态',
                color: '#4CAF50',
                effects: {
                    moveSpeedMultiplier: 1.0,      // 基础移动速度
                    bulletSpeedMultiplier: 1.0,    // 基础子弹射速
                    bulletRangeMultiplier: 1.0,    // 基础子弹射程
                    skillCostMultiplier: 1.0,      // 基础技能消耗
                    damageReceivedMultiplier: 1.0, // 基础受伤害
                    windFireDamageMultiplier: 1.0  // 基础风火轮伤害
                }
            },
            C: {
                name: 'C形态 - 防御',
                displayName: '防御形态',
                color: '#2196F3',
                effects: {
                    moveSpeedMultiplier: 0.7,      // 移动速度减少30%
                    bulletSpeedMultiplier: 0.7,    // 子弹射速减少30%
                    bulletRangeMultiplier: 1.0,    // 子弹射程不变
                    bulletExplosion: true,         // 子弹爆炸效果
                    bulletDamageMultiplier: 0.5,   // 伤害减少50%
                    skillCostMultiplier: 1.2,      // 技能消耗增加20%
                    damageReceivedMultiplier: 0.5, // 受到伤害减少50%
                    windFireDamageMultiplier: 0.5  // 风火轮伤害减少50%
                }
            }
        };
        
        // 当前形态
        this.currentForm = 'B';
        
        // 形态切换冷却
        this.switchCooldown = 60; // 1秒冷却
        this.lastSwitchTime = 0;
        
        // 绑定鼠标滚轮事件
        this.bindWheelEvent();
        
        console.log('形态切换系统初始化完成');
    }
    
    /**
     * 绑定鼠标滚轮事件
     */
    bindWheelEvent() {
        document.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            // 检查冷却时间
            const currentTime = performance.now();
            if (currentTime - this.lastSwitchTime < this.switchCooldown) {
                return;
            }
            
            // 根据滚轮方向切换形态
            if (e.deltaY > 0) {
                // 向下滚动 - 下一个形态
                this.switchToNextForm();
            } else {
                // 向上滚动 - 上一个形态
                this.switchToPreviousForm();
            }
            
            this.lastSwitchTime = currentTime;
        });
    }
    
    /**
     * 切换到下一个形态
     */
    switchToNextForm() {
        const forms = ['A', 'B', 'C'];
        const currentIndex = forms.indexOf(this.currentForm);
        const nextIndex = (currentIndex + 1) % forms.length;
        this.switchForm(forms[nextIndex]);
    }
    
    /**
     * 切换到上一个形态
     */
    switchToPreviousForm() {
        const forms = ['A', 'B', 'C'];
        const currentIndex = forms.indexOf(this.currentForm);
        const prevIndex = (currentIndex - 1 + forms.length) % forms.length;
        this.switchForm(forms[prevIndex]);
    }
    
    /**
     * 切换到指定形态
     * @param {string} formKey - 形态键值 (A, B, C)
     */
    switchForm(formKey) {
        if (!this.forms[formKey]) {
            console.warn('无效的形态:', formKey);
            return;
        }
        
        const oldForm = this.currentForm;
        this.currentForm = formKey;
        
        // 触发形态切换事件
        const event = new CustomEvent('formChanged', {
            detail: {
                oldForm: oldForm,
                newForm: formKey,
                formData: this.forms[formKey]
            }
        });
        document.dispatchEvent(event);
        
        // 显示形态切换提示
        if (window.createFloatingText) {
            const form = this.forms[formKey];
            window.createFloatingText(
                game.player.x, 
                game.player.y - 50, 
                form.displayName, 
                form.color,
                90,
                2.0  // 增大文字大小，方便查看
            );
        }
        
        console.log(`形态切换: ${this.forms[oldForm].displayName} -> ${this.forms[formKey].displayName}`);
    }
    
    /**
     * 获取当前形态
     * @returns {object} 当前形态数据
     */
    getCurrentForm() {
        return this.forms[this.currentForm];
    }
    
    /**
     * 获取当前形态的效果
     * @returns {object} 当前形态的效果数据
     */
    getCurrentEffects() {
        return this.forms[this.currentForm].effects;
    }
    
    /**
     * 获取移动速度倍数（包含属性加成后的再次加成）
     * @param {number} baseSpeed - 基础速度（已包含属性加成）
     * @returns {number} 最终速度
     */
    getModifiedMoveSpeed(baseSpeed) {
        const effects = this.getCurrentEffects();
        return baseSpeed * effects.moveSpeedMultiplier;
    }
    
    /**
     * 获取子弹射速倍数
     * @param {number} baseSpeed - 基础子弹速度
     * @returns {number} 最终子弹速度
     */
    getModifiedBulletSpeed(baseSpeed) {
        const effects = this.getCurrentEffects();
        return baseSpeed * effects.bulletSpeedMultiplier;
    }
    
    /**
     * 获取子弹射程倍数
     * @param {number} baseRange - 基础射程
     * @returns {number} 最终射程
     */
    getModifiedBulletRange(baseRange) {
        const effects = this.getCurrentEffects();
        return baseRange * effects.bulletRangeMultiplier;
    }
    
    /**
     * 获取技能消耗倍数
     * @param {number} baseCost - 基础消耗
     * @returns {number} 最终消耗
     */
    getModifiedSkillCost(baseCost) {
        const effects = this.getCurrentEffects();
        return baseCost * effects.skillCostMultiplier;
    }
    
    /**
     * 获取受到伤害倍数
     * @param {number} baseDamage - 基础伤害
     * @returns {number} 最终伤害
     */
    getModifiedDamageReceived(baseDamage) {
        const effects = this.getCurrentEffects();
        return baseDamage * effects.damageReceivedMultiplier;
    }
    
    /**
     * 获取风火轮伤害倍数
     * @param {number} baseDamage - 基础风火轮伤害
     * @returns {number} 最终风火轮伤害
     */
    getModifiedWindFireDamage(baseDamage) {
        const effects = this.getCurrentEffects();
        return baseDamage * effects.windFireDamageMultiplier;
    }
    
    /**
     * 获取子弹伤害倍数（C形态专用）
     * @param {number} baseDamage - 基础子弹伤害
     * @returns {number} 最终子弹伤害
     */
    getModifiedBulletDamage(baseDamage) {
        const effects = this.getCurrentEffects();
        return baseDamage * (effects.bulletDamageMultiplier || 1.0);
    }
    
    /**
     * 检查是否有子弹爆炸效果（C形态专用）
     * @returns {boolean} 是否有爆炸效果
     */
    hasBulletExplosion() {
        const effects = this.getCurrentEffects();
        return effects.bulletExplosion || false;
    }
    
    /**
     * 获取形态倍数（用于兼容现有代码）
     * @returns {object} 包含各种倍数的对象
     */
    getFormMultipliers() {
        const effects = this.getCurrentEffects();
        return {
            bulletSpeed: effects.bulletSpeedMultiplier || 1.0,
            bulletRange: effects.bulletRangeMultiplier || 1.0,
            damage: effects.bulletDamageMultiplier || 1.0,
            damageTaken: effects.damageReceivedMultiplier || 1.0
        };
    }
    
    /**
     * 渲染形态指示器
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    renderFormIndicator(ctx, x, y) {
        const form = this.getCurrentForm();
        
        // 绘制形态指示圆环
        ctx.save();
        ctx.strokeStyle = form.color;
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(x, y, 35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 绘制形态字母
        ctx.fillStyle = form.color;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.currentForm, x, y);
        
        ctx.restore();
    }
    
    /**
     * 渲染形态信息面板
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    renderFormInfo(ctx, x, y) {
        const form = this.getCurrentForm();
        const effects = this.getCurrentEffects();
        
        ctx.save();
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, 200, 120);
        
        // 边框
        ctx.strokeStyle = form.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 200, 120);
        
        // 标题
        ctx.fillStyle = form.color;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(form.displayName, x + 10, y + 20);
        
        // 效果列表
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        let offsetY = 40;
        
        const effectTexts = [
            `移动速度: ${(effects.moveSpeedMultiplier * 100).toFixed(0)}%`,
            `子弹射速: ${(effects.bulletSpeedMultiplier * 100).toFixed(0)}%`,
            `子弹射程: ${(effects.bulletRangeMultiplier * 100).toFixed(0)}%`,
            `技能消耗: ${(effects.skillCostMultiplier * 100).toFixed(0)}%`,
            `受到伤害: ${(effects.damageReceivedMultiplier * 100).toFixed(0)}%`,
            `风火轮伤害: ${(effects.windFireDamageMultiplier * 100).toFixed(0)}%`
        ];
        
        if (effects.bulletExplosion) {
            effectTexts.push('子弹爆炸: 开启');
        }
        if (effects.bulletDamageMultiplier && effects.bulletDamageMultiplier !== 1.0) {
            effectTexts.push(`子弹伤害: ${(effects.bulletDamageMultiplier * 100).toFixed(0)}%`);
        }
        
        effectTexts.forEach(text => {
            ctx.fillText(text, x + 10, y + offsetY);
            offsetY += 15;
        });
        
        ctx.restore();
    }
}

// 导出到全局，但不自动创建实例
if (typeof window !== 'undefined') {
    window.FormSystem = FormSystem;
}

// Node.js 模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormSystem;
}