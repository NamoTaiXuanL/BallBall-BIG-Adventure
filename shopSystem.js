/**
 * 购买系统模块 v4.3.0
 * 管理商品购买、界面显示和交互逻辑
 * 创建时间：2025-01-06
 */

class ShopSystem {
    constructor() {
        // 商店状态
        this.isShopOpen = false;
        
        // 商品配置
        this.shopItems = [
            {
                id: 1,
                name: '基础伤害',
                description: '增加所有攻击的基础伤害',
                price: 1000,
                attributeName: 'baseDamage',
                attributeValue: 10,
                icon: '⚔️',
                available: true
            },
            {
                id: 2,
                name: '生命强化',
                description: '增加最大生命值',
                price: 800,
                attributeName: 'maxHealth',
                attributeValue: 50,
                icon: '❤️',
                available: false // 暂未开放
            },
            {
                id: 3,
                name: '速度提升',
                description: '增加移动速度',
                price: 600,
                attributeName: 'moveSpeed',
                attributeValue: 5,
                icon: '💨',
                available: false
            },
            {
                id: 4,
                name: '攻速增强',
                description: '增加攻击速度',
                price: 1200,
                attributeName: 'attackSpeed',
                attributeValue: 8,
                icon: '⚡',
                available: false
            },
            {
                id: 5,
                name: '暴击强化',
                description: '增加暴击率',
                price: 1500,
                attributeName: 'criticalRate',
                attributeValue: 3,
                icon: '💥',
                available: false
            },
            {
                id: 6,
                name: '暴击伤害',
                description: '增加暴击伤害倍数',
                price: 2000,
                attributeName: 'criticalDamage',
                attributeValue: 10,
                icon: '🔥',
                available: false
            },
            {
                id: 7,
                name: '防御强化',
                description: '增加防御力',
                price: 900,
                attributeName: 'defense',
                attributeValue: 15,
                icon: '🛡️',
                available: false
            },
            {
                id: 8,
                name: '魔法强度',
                description: '增加魔法攻击力',
                price: 1100,
                attributeName: 'magicPower',
                attributeValue: 12,
                icon: '🔮',
                available: false
            },
            {
                id: 9,
                name: '幸运加成',
                description: '增加幸运值',
                price: 1800,
                attributeName: 'luck',
                attributeValue: 5,
                icon: '🍀',
                available: false
            },
            {
                id: 10,
                name: '经验加成',
                description: '增加经验获取效率',
                price: 1300,
                attributeName: 'experience',
                attributeValue: 15,
                icon: '📚',
                available: false
            }
        ];
        
        // 购买统计
        this.purchaseStats = {};
        // v4.3.6: 不再从本地存储加载购买统计，每次页面刷新都重置
        console.log('购买统计已重置为初始值');
        
        console.log('购买系统初始化完成');
    }
    
    /**
     * 切换商店界面显示状态
     */
    toggleShop() {
        this.isShopOpen = !this.isShopOpen;
        console.log(`商店界面${this.isShopOpen ? '打开' : '关闭'}`);
        
        // 触发商店状态变化事件
        const event = new CustomEvent('shopToggled', {
            detail: { isOpen: this.isShopOpen }
        });
        window.dispatchEvent(event);
    }
    
    /**
     * 打开商店
     */
    openShop() {
        if (!this.isShopOpen) {
            this.toggleShop();
        }
    }
    
    /**
     * 关闭商店
     */
    closeShop() {
        if (this.isShopOpen) {
            this.toggleShop();
        }
    }
    
    /**
     * 购买商品
     * @param {number} itemId - 商品ID
     * @returns {object} - 购买结果
     */
    buyItem(itemId) {
        const item = this.shopItems.find(i => i.id === itemId);
        
        if (!item) {
            return {
                success: false,
                message: '商品不存在'
            };
        }
        
        if (!item.available) {
            return {
                success: false,
                message: '商品暂未开放'
            };
        }
        
        // 检查金币是否足够
        const currentCoins = window.coinSystem ? window.coinSystem.getCurrentCoins() : 0;
        if (currentCoins < item.price) {
            return {
                success: false,
                message: `金币不足，需要 ${item.price} 金币，当前只有 ${currentCoins} 金币`
            };
        }
        
        // 扣除金币
        if (window.coinSystem) {
            window.coinSystem.spendCoins(item.price);
        }
        
        // 增加属性
        if (window.attributeSystem) {
            window.attributeSystem.addAttribute(item.attributeName, item.attributeValue);
        }
        
        // 记录购买统计
        if (!this.purchaseStats[itemId]) {
            this.purchaseStats[itemId] = 0;
        }
        this.purchaseStats[itemId]++;
        this.savePurchaseStats();
        
        // 触发购买成功事件
        const event = new CustomEvent('itemPurchased', {
            detail: {
                item,
                totalPurchased: this.purchaseStats[itemId]
            }
        });
        window.dispatchEvent(event);
        
        console.log(`成功购买 ${item.name}，花费 ${item.price} 金币`);
        
        return {
            success: true,
            message: `成功购买 ${item.name}！`,
            item
        };
    }
    
    /**
     * 获取商品信息
     * @param {number} itemId - 商品ID
     * @returns {object|null} - 商品信息
     */
    getItem(itemId) {
        return this.shopItems.find(i => i.id === itemId) || null;
    }
    
    /**
     * 获取所有商品
     * @returns {array} - 商品列表
     */
    getAllItems() {
        return [...this.shopItems];
    }
    
    /**
     * 获取可用商品
     * @returns {array} - 可用商品列表
     */
    getAvailableItems() {
        return this.shopItems.filter(item => item.available);
    }
    
    /**
     * 获取商品购买次数
     * @param {number} itemId - 商品ID
     * @returns {number} - 购买次数
     */
    getPurchaseCount(itemId) {
        return this.purchaseStats[itemId] || 0;
    }
    
    /**
     * 检查是否能购买商品
     * @param {number} itemId - 商品ID
     * @returns {object} - 检查结果
     */
    canBuyItem(itemId) {
        const item = this.getItem(itemId);
        
        if (!item) {
            return { canBuy: false, reason: '商品不存在' };
        }
        
        if (!item.available) {
            return { canBuy: false, reason: '商品暂未开放' };
        }
        
        const currentCoins = window.coinSystem ? window.coinSystem.getCurrentCoins() : 0;
        if (currentCoins < item.price) {
            return { 
                canBuy: false, 
                reason: `金币不足，需要 ${item.price}，当前 ${currentCoins}` 
            };
        }
        
        return { canBuy: true, reason: '可以购买' };
    }
    
    /**
     * 保存购买统计到本地存储 - v4.3.6: 移除持久化存储
     */
    savePurchaseStats() {
        // v4.3.6: 不再保存到localStorage，购买统计仅在当前会话有效
        console.log('购买统计不再持久化存储');
    }
    
    /**
     * 从本地存储加载购买统计 - v4.3.6: 移除持久化存储
     */
    loadPurchaseStats() {
        // v4.3.6: 不再从localStorage加载，购买统计保持初始值
        console.log('购买统计不再持久化加载，保持初始值:', this.purchaseStats);
    }
    
    /**
     * 重置购买统计 - v4.3.6: 移除持久化存储
     */
    resetPurchaseStats() {
        this.purchaseStats = {};
        // v4.3.6: 不再调用savePurchaseStats
        console.log('购买统计已重置');
    }
}

// 创建全局购买系统实例
if (typeof window !== 'undefined') {
    window.shopSystem = new ShopSystem();
    
    // 监听购买事件，用于调试和反馈
    window.addEventListener('itemPurchased', (event) => {
        console.log('商品购买事件:', event.detail);
        
        // 显示购买成功的浮动文字（如果存在）
        if (window.createFloatingText && window.player) {
            window.createFloatingText(
                window.player.x,
                window.player.y - 30,
                `+${event.detail.item.attributeValue} ${window.attributeSystem.getAttributeDisplayName(event.detail.item.attributeName)}`,
                '#00ff00',
                1500
            );
        }
    });
}

// 导出模块（如果支持模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShopSystem;
}