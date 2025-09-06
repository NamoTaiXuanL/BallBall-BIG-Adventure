/**
 * 金币系统模块 v4.2.0
 * 管理玩家金币的获取、存储和显示
 * 创建日期：2025-01-06
 */

class CoinSystem {
    constructor() {
        this.coins = 0; // 当前金币数量
        this.totalCoinsEarned = 0; // 总共获得的金币数量
        this.coinMultiplier = 1.0; // 金币倍率
        this.lastKillPosition = null; // 最后击杀位置
        
        // 从本地存储加载金币数据
        this.loadCoinData();
        
        // 绑定事件监听
        this.bindEvents();
    }
    
    /**
     * 加载金币数据 - v4.3.6: 移除持久化存储
     */
    loadCoinData() {
        // v4.3.6: 不再从localStorage加载，每次页面刷新都重置为0
        this.coins = 0;
        this.totalCoinsEarned = 0;
        this.coinMultiplier = 1.0;
        console.log('金币数据已重置为初始值');
    }
    
    /**
     * 保存金币数据 - v4.3.6: 移除持久化存储
     */
    saveCoinData() {
        // v4.3.6: 不再保存到localStorage，金币数据仅在当前会话有效
        console.log('金币数据不再持久化存储');
    }
    
    /**
     * 重置金币数据 - v4.3.6: 移除持久化存储
     */
    resetCoinData() {
        this.coins = 0;
        this.totalCoinsEarned = 0;
        this.coinMultiplier = 1.0;
        // v4.3.6: 不再调用saveCoinData
        console.log('金币数据已重置');
    }
    
    /**
     * 根据怪物属性计算金币奖励
     * @param {Object} monster - 怪物对象
     * @returns {number} 金币奖励数量
     */
    calculateCoinReward(monster) {
        if (!monster || !monster.maxHealth) {
            return 1; // 默认最小奖励
        }
        
        // 基础金币计算：使用对数函数避免数据爆炸
        // 基础公式：log10(血量/10) + 1，确保低血量怪物也有合理奖励
        let baseCoins = Math.log10(Math.max(monster.maxHealth, 10) / 10) + 1;
        
        // 等级加成：使用对数增长，避免高等级怪物奖励过高
        const level = monster.level || 1;
        const levelBonus = 1 + Math.log10(level) * 0.3;
        
        // 怪物类型加成
        const typeMultiplier = this.getMonsterTypeMultiplier(monster.type);
        
        // 计算最终金币数量
        let finalCoins = baseCoins * levelBonus * typeMultiplier * this.coinMultiplier;
        
        // 确保合理范围：最小1金币，最大50金币
        finalCoins = Math.max(1, Math.min(50, Math.round(finalCoins)));
        
        return finalCoins;
    }
    
    /**
     * 获取怪物类型的金币倍率
     * @param {string} type - 怪物类型
     * @returns {number} 倍率值
     */
    getMonsterTypeMultiplier(type) {
        const typeMultipliers = {
            'red': 1.0,      // 基础怪物
            'blue': 1.1,     // 稍强怪物
            'white': 1.2,    // 中等怪物
            'black': 1.3,    // 较强怪物
            'largered': 1.5, // 大型怪物
            'rotating': 1.4, // 旋转怪物
            'teleport': 1.6, // 传送怪物
            'snake': 1.7,    // 蛇形怪物
            'yellow': 1.8,   // 黄色怪物
            'control': 1.9,  // 控制怪物
            'elite': 2.5,    // 精英怪物
            'graviton': 2.8, // 重力怪物
            'destroyer': 3.0,// 毁灭者
            'guardian': 2.2, // 守护者
            'vortex': 2.6    // 漩涡怪物
        };
        
        return typeMultipliers[type] || 1.0;
    }
    
    /**
     * 添加金币
     * @param {number} amount - 金币数量
     * @param {string} source - 金币来源
     */
    addCoins(amount, source = 'unknown') {
        if (amount <= 0) return;
        
        this.coins += amount;
        this.totalCoinsEarned += amount;
        
        // 触发金币获得事件
        this.triggerCoinEvent('coinEarned', {
            amount: amount,
            source: source,
            totalCoins: this.coins
        });
        
        // 创建金币获得的视觉反馈
        if (source === 'monster_kill' && window.createFloatingText) {
            // 从事件数据中获取位置信息
            const lastKillEvent = this.lastKillPosition;
            if (lastKillEvent) {
                window.createFloatingText(
                    lastKillEvent.x, 
                    lastKillEvent.y - 20, 
                    `+${amount}💰`, 
                    '#FFD700', 
                    60, 
                    1.2
                );
            }
        }
        
        // 保存数据
        this.saveCoinData();
    }
    
    /**
     * 消费金币
     * @param {number} amount - 消费金币数量
     * @param {string} purpose - 消费目的
     * @returns {boolean} 是否消费成功
     */
    spendCoins(amount, purpose = 'unknown') {
        if (amount <= 0 || this.coins < amount) {
            return false;
        }
        
        this.coins -= amount;
        
        // 触发金币消费事件
        this.triggerCoinEvent('coinSpent', {
            amount: amount,
            purpose: purpose,
            remainingCoins: this.coins
        });
        
        // 保存数据
        this.saveCoinData();
        
        return true;
    }
    
    /**
     * 获取当前金币数量
     * @returns {number} 当前金币数量
     */
    getCurrentCoins() {
        return this.coins;
    }
    
    /**
     * 获取总共获得的金币数量
     * @returns {number} 总金币数量
     */
    getTotalCoinsEarned() {
        return this.totalCoinsEarned;
    }
    
    /**
     * 设置金币倍率
     * @param {number} multiplier - 倍率值
     */
    setCoinMultiplier(multiplier) {
        this.coinMultiplier = Math.max(0.1, multiplier);
        this.saveCoinData();
    }
    
    /**
     * 绑定事件监听
     */
    bindEvents() {
        // 监听怪物死亡事件
        document.addEventListener('monsterKilled', (event) => {
            const monster = event.detail.monster;
            // 记录击杀位置
            this.lastKillPosition = {
                x: monster.x,
                y: monster.y
            };
            const coinReward = this.calculateCoinReward(monster);
            this.addCoins(coinReward, 'monster_kill');
        });
        
        // 监听游戏重置事件
        document.addEventListener('gameReset', () => {
            // 游戏重置时不清空金币，保持持久化
        });
    }
    
    /**
     * 触发金币相关事件
     * @param {string} eventType - 事件类型
     * @param {Object} data - 事件数据
     */
    triggerCoinEvent(eventType, data) {
        const event = new CustomEvent(eventType, {
            detail: data
        });
        document.dispatchEvent(event);
    }
    
    /**
     * 获取金币系统状态信息
     * @returns {Object} 状态信息
     */
    getStatus() {
        return {
            currentCoins: this.coins,
            totalEarned: this.totalCoinsEarned,
            multiplier: this.coinMultiplier,
            averagePerKill: this.totalCoinsEarned > 0 ? Math.round(this.totalCoinsEarned / this.totalCoinsEarned * 10) / 10 : 0
        };
    }
}

// 创建全局金币系统实例
window.coinSystem = new CoinSystem();

// 导出金币系统类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CoinSystem;
}