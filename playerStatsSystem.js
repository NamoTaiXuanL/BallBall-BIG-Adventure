/**
 * 玩家属性界面系统模块 v4.4.0
 * 管理玩家属性界面的显示、数据收集和交互逻辑
 * 创建时间：2025-09-06
 * 功能：按N键显示/隐藏属性界面，展示玩家所有属性和技能信息
 */

class PlayerStatsSystem {
    constructor(game) {
        this.game = game;
        this.visible = false;
        
        // 界面配置
        this.config = {
            width: 800,
            height: 600,
            padding: 20,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            borderColor: '#4CAF50',
            borderWidth: 2,
            titleColor: '#4CAF50',
            textColor: '#FFFFFF',
            valueColor: '#FFD700',
            sectionColor: '#2196F3',
            fontSize: {
                title: 24,
                section: 18,
                text: 14,
                value: 14
            }
        };
        
        console.log('玩家属性界面系统初始化完成');
    }
    
    // 切换界面显示状态
    toggle() {
        console.log('PlayerStatsSystem.toggle() 被调用');
        console.log('当前visible状态:', this.visible);
        this.visible = !this.visible;
        
        if (this.visible) {
            console.log('显示玩家属性界面');
        } else {
            console.log('隐藏玩家属性界面');
        }
        console.log('新的visible状态:', this.visible);
    }
    
    // 检查界面是否可见
    isVisible() {
        return this.visible;
    }
    

    
    // 收集玩家基础属性数据
    getPlayerBasicStats() {
        const player = this.game.player;
        
        // 安全获取数值，防止NaN
        const safeValue = (value, defaultValue) => {
            return isNaN(value) ? defaultValue : (value || defaultValue);
        };
        
        const level = safeValue(player.level, 1);
        const exp = safeValue(player.exp, 0);
        const expToNext = safeValue(player.expToNextLevel, 100);
        const health = safeValue(player.health, 0);
        const maxHealth = safeValue(player.maxHealth, 100);
        const mana = safeValue(player.mana, 0);
        const maxMana = safeValue(player.maxMana, 50);
        const rage = safeValue(player.rage, 0);
        const maxRage = safeValue(player.maxRage, 100);
        const stamina = safeValue(player.stamina, 0);
        const maxStamina = safeValue(player.maxStamina, 100);
        
        return {
            // 基础属性
            level: level,
            experience: exp,
            experienceToNext: expToNext,
            experienceProgress: ((exp / expToNext) * 100).toFixed(1),
            
            // 生命值系统
            health: Math.floor(health),
            maxHealth: Math.floor(maxHealth),
            healthPercent: ((health / maxHealth) * 100).toFixed(1),
            
            // 魔力系统
            mana: Math.floor(mana),
            maxMana: Math.floor(maxMana),
            manaPercent: ((mana / maxMana) * 100).toFixed(1),
            
            // 怒气系统
            rage: Math.floor(rage),
            maxRage: Math.floor(maxRage),
            ragePercent: ((rage / maxRage) * 100).toFixed(1),
            
            // 精力系统
            stamina: Math.floor(stamina),
            maxStamina: Math.floor(maxStamina),
            staminaPercent: ((stamina / maxStamina) * 100).toFixed(1)
        };
    }
    
    // 收集玩家战斗属性数据
    getCombatStats() {
        const player = this.game.player;
        const attributeSystem = this.game.attributeSystem;
        
        return {
            // 攻击属性
            attackPower: Math.floor(player.attackPower || 10),
            baseDamage: attributeSystem ? Math.floor(attributeSystem.attributes.baseDamage) : 0,
            criticalRate: ((player.criticalRate || 0.15) * 100).toFixed(1),
            criticalMultiplier: (player.criticalMultiplier || 2.0).toFixed(1),
            
            // 防御属性
            defense: attributeSystem ? Math.floor(attributeSystem.attributes.defense) : 0,
            
            // 移动属性
            moveSpeed: Math.floor(this.game.config?.player?.speed || 8),
            dashSpeed: Math.floor(this.game.config?.player?.dashSpeed || 25),
            jumpForce: Math.floor(this.game.config?.player?.jumpForce || 25),
            
            // 其他属性
            luck: attributeSystem ? Math.floor(attributeSystem.attributes.luck) : 0,
            magicPower: attributeSystem ? Math.floor(attributeSystem.attributes.magicPower) : 0
        };
    }
    
    // 收集技能状态数据
    getSkillStats() {
        const player = this.game.player;
        
        return {
            // 风火轮技能
            windFireWheels: {
                active: player.windFireWheels?.active || false,
                rageCost: player.windFireWheels?.rageCost || 15
            },
            
            // 激光技能
            laser: {
                active: player.laser?.active || false,
                manaCost: player.laser?.manaCost || 2.5
            },
            
            // 闪现技能
            dash: {
                distance: player.dash?.distance || 600
            },
            
            // AOE攻击
            aoeAttack: {
                cooldownTimer: Math.floor(player.aoeAttackCooldown || 0)
            }
        };
    }
    

    

    
    // 格式化时间显示
    formatTime(frames) {
        const seconds = Math.floor(frames / 60);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    // 渲染属性界面
    render(ctx) {
        if (!this.visible) return;
        
        const canvas = ctx.canvas;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // 计算界面位置和大小
        const width = this.config.width;
        const height = this.config.height;
        const x = centerX - width / 2;
        const y = centerY - height / 2;
        
        // 保存画布状态
        ctx.save();
        
        // 绘制背景
        ctx.fillStyle = this.config.backgroundColor;
        ctx.fillRect(x, y, width, height);
        
        // 绘制边框
        ctx.strokeStyle = this.config.borderColor;
        ctx.lineWidth = this.config.borderWidth;
        ctx.strokeRect(x, y, width, height);
        
        // 绘制内容
        this.renderContent(ctx, x, y, width, height);
        
        // 恢复画布状态
        ctx.restore();
    }
    
    // 渲染界面内容
    renderContent(ctx, x, y, width, height) {
        const padding = this.config.padding;
        let currentY = y + padding;
        
        // 绘制标题
        ctx.fillStyle = this.config.titleColor;
        ctx.font = `bold ${this.config.fontSize.title}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('玩家属性面板', x + width / 2, currentY + this.config.fontSize.title);
        currentY += this.config.fontSize.title + 20;
        
        // 重置文本对齐
        ctx.textAlign = 'left';
        
        // 计算列宽
        const columnWidth = (width - padding * 3) / 2;
        const leftColumnX = x + padding;
        const rightColumnX = x + padding * 2 + columnWidth;
        
        // 左列：基础属性和战斗属性
        let leftY = currentY;
        leftY = this.renderBasicStats(ctx, leftColumnX, leftY, columnWidth);
        leftY += 20;
        leftY = this.renderCombatStats(ctx, leftColumnX, leftY, columnWidth);
        
        // 右列：技能状态
        let rightY = currentY;
        rightY = this.renderSkillStats(ctx, rightColumnX, rightY, columnWidth);
        
        // 绘制操作提示
        ctx.fillStyle = this.config.textColor;
        ctx.font = `${this.config.fontSize.text}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('按 N 键关闭属性面板', x + width / 2, y + height - 15);
    }
    
    // 渲染基础属性
    renderBasicStats(ctx, x, y, width) {
        const stats = this.getPlayerBasicStats();
        let currentY = y;
        
        // 节标题
        ctx.fillStyle = this.config.sectionColor;
        ctx.font = `bold ${this.config.fontSize.section}px Arial`;
        ctx.fillText('基础属性', x, currentY);
        currentY += this.config.fontSize.section + 10;
        
        // 属性列表
        ctx.font = `${this.config.fontSize.text}px Arial`;
        const items = [
            [`等级: `, stats.level],
            [`经验: `, `${stats.experience}/${stats.experienceToNext} (${stats.experienceProgress}%)`],
            [`生命值: `, `${stats.health}/${stats.maxHealth} (${stats.healthPercent}%)`],
            [`魔力值: `, `${stats.mana}/${stats.maxMana} (${stats.manaPercent}%)`],
            [`怒气值: `, `${stats.rage}/${stats.maxRage} (${stats.ragePercent}%)`],
            [`精力值: `, `${stats.stamina}/${stats.maxStamina} (${stats.staminaPercent}%)`]
        ];
        
        items.forEach(([label, value]) => {
            ctx.fillStyle = this.config.textColor;
            ctx.fillText(label, x, currentY);
            ctx.fillStyle = this.config.valueColor;
            ctx.fillText(value, x + 80, currentY);
            currentY += this.config.fontSize.text + 5;
        });
        
        return currentY;
    }
    
    // 渲染战斗属性
    renderCombatStats(ctx, x, y, width) {
        const stats = this.getCombatStats();
        let currentY = y;
        
        // 节标题
        ctx.fillStyle = this.config.sectionColor;
        ctx.font = `bold ${this.config.fontSize.section}px Arial`;
        ctx.fillText('战斗属性', x, currentY);
        currentY += this.config.fontSize.section + 10;
        
        // 属性列表
        ctx.font = `${this.config.fontSize.text}px Arial`;
        const items = [
            [`攻击力: `, stats.attackPower],
            [`基础伤害: `, `+${stats.baseDamage}`],
            [`暴击率: `, `${stats.criticalRate}%`],
            [`暴击倍数: `, `${stats.criticalMultiplier}x`],
            [`防御力: `, stats.defense],
            [`移动速度: `, stats.moveSpeed],
            [`冲刺速度: `, stats.dashSpeed],
            [`跳跃力: `, stats.jumpForce],
            [`幸运值: `, stats.luck],
            [`魔法强度: `, stats.magicPower]
        ];
        
        items.forEach(([label, value]) => {
            ctx.fillStyle = this.config.textColor;
            ctx.fillText(label, x, currentY);
            ctx.fillStyle = this.config.valueColor;
            ctx.fillText(value, x + 80, currentY);
            currentY += this.config.fontSize.text + 5;
        });
        
        return currentY;
    }
    
    // 渲染技能状态
    renderSkillStats(ctx, x, y, width) {
        const stats = this.getSkillStats();
        let currentY = y;
        
        // 节标题
        ctx.fillStyle = this.config.sectionColor;
        ctx.font = `bold ${this.config.fontSize.section}px Arial`;
        ctx.fillText('技能状态', x, currentY);
        currentY += this.config.fontSize.section + 10;
        
        // 技能列表
        ctx.font = `${this.config.fontSize.text}px Arial`;
        
        // 风火轮技能
        ctx.fillStyle = this.config.textColor;
        ctx.fillText('风火轮:', x, currentY);
        ctx.fillStyle = stats.windFireWheels.active ? '#4CAF50' : '#F44336';
        ctx.fillText(stats.windFireWheels.active ? '激活' : '未激活', x + 70, currentY);
        ctx.fillStyle = this.config.valueColor;
        ctx.fillText(`(怒气消耗: ${stats.windFireWheels.rageCost})`, x + 140, currentY);
        currentY += this.config.fontSize.text + 5;
        
        // 激光技能
        ctx.fillStyle = this.config.textColor;
        ctx.fillText('激光:', x, currentY);
        ctx.fillStyle = stats.laser.active ? '#4CAF50' : '#F44336';
        ctx.fillText(stats.laser.active ? '激活' : '未激活', x + 70, currentY);
        ctx.fillStyle = this.config.valueColor;
        ctx.fillText(`(魔力消耗: ${stats.laser.manaCost})`, x + 140, currentY);
        currentY += this.config.fontSize.text + 5;
        
        // 闪现技能
        ctx.fillStyle = this.config.textColor;
        ctx.fillText('闪现距离:', x, currentY);
        ctx.fillStyle = this.config.valueColor;
        ctx.fillText(stats.dash.distance, x + 80, currentY);
        currentY += this.config.fontSize.text + 5;
        
        // AOE攻击
        ctx.fillStyle = this.config.textColor;
        ctx.fillText('AOE冷却:', x, currentY);
        ctx.fillStyle = this.config.valueColor;
        ctx.fillText(stats.aoeAttack.cooldownTimer > 0 ? `${Math.ceil(stats.aoeAttack.cooldownTimer / 60)}s` : '就绪', x + 80, currentY);
        currentY += this.config.fontSize.text + 5;
        
        return currentY;
    }
    

    

}

// 导出到全局作用域
window.PlayerStatsSystem = PlayerStatsSystem;

console.log('玩家属性界面系统模块加载完成');