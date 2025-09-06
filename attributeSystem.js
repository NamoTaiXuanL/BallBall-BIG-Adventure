/**
 * 属性增加系统模块 v4.3.0
 * 管理玩家的各种属性增加值
 * 创建时间：2025-01-06
 */

class AttributeSystem {
    constructor() {
        // 属性增加值存储
        this.attributes = {
            baseDamage: 0,      // 基础伤害增加值
            maxHealth: 0,       // 最大生命值增加值
            moveSpeed: 0,       // 移动速度增加值
            attackSpeed: 0,     // 攻击速度增加值
            criticalRate: 0,    // 暴击率增加值
            criticalDamage: 0,  // 暴击伤害增加值
            defense: 0,         // 防御力增加值
            magicPower: 0,      // 魔法强度增加值
            luck: 0,            // 幸运值增加值
            experience: 0       // 经验获取增加值
        };
        
        // 从本地存储加载属性数据
        this.loadAttributes();
        
        console.log('属性增加系统初始化完成');
    }
    
    /**
     * 增加指定属性的值
     * @param {string} attributeName - 属性名称
     * @param {number} value - 增加的值
     * @returns {boolean} - 是否成功增加
     */
    addAttribute(attributeName, value) {
        if (this.attributes.hasOwnProperty(attributeName)) {
            this.attributes[attributeName] += value;
            this.saveAttributes();
            
            // 触发属性变化事件
            this.triggerAttributeChangeEvent(attributeName, value);
            
            console.log(`属性 ${attributeName} 增加 ${value}，当前值：${this.attributes[attributeName]}`);
            return true;
        }
        
        console.warn(`未知属性：${attributeName}`);
        return false;
    }
    
    /**
     * 获取指定属性的值
     * @param {string} attributeName - 属性名称
     * @returns {number} - 属性值
     */
    getAttribute(attributeName) {
        return this.attributes[attributeName] || 0;
    }
    
    /**
     * 获取所有属性
     * @returns {object} - 所有属性对象
     */
    getAllAttributes() {
        return { ...this.attributes };
    }
    
    /**
     * 重置指定属性
     * @param {string} attributeName - 属性名称
     */
    resetAttribute(attributeName) {
        if (this.attributes.hasOwnProperty(attributeName)) {
            this.attributes[attributeName] = 0;
            this.saveAttributes();
            console.log(`属性 ${attributeName} 已重置`);
        }
    }
    
    /**
     * 重置所有属性
     */
    resetAllAttributes() {
        Object.keys(this.attributes).forEach(key => {
            this.attributes[key] = 0;
        });
        this.saveAttributes();
        console.log('所有属性已重置');
    }
    
    /**
     * 保存属性数据到本地存储
     */
    saveAttributes() {
        try {
            localStorage.setItem('ballAdventure_attributes', JSON.stringify(this.attributes));
        } catch (error) {
            console.warn('保存属性数据失败:', error);
        }
    }
    
    /**
     * 从本地存储加载属性数据
     */
    loadAttributes() {
        try {
            const saved = localStorage.getItem('ballAdventure_attributes');
            if (saved) {
                const loadedAttributes = JSON.parse(saved);
                // 合并已保存的属性，保持新属性的默认值
                Object.keys(this.attributes).forEach(key => {
                    if (loadedAttributes.hasOwnProperty(key)) {
                        this.attributes[key] = loadedAttributes[key];
                    }
                });
                console.log('属性数据加载成功');
            }
        } catch (error) {
            console.warn('加载属性数据失败:', error);
        }
    }
    
    /**
     * 触发属性变化事件
     * @param {string} attributeName - 属性名称
     * @param {number} value - 变化值
     */
    triggerAttributeChangeEvent(attributeName, value) {
        const event = new CustomEvent('attributeChanged', {
            detail: {
                attributeName,
                value,
                newTotal: this.attributes[attributeName]
            }
        });
        window.dispatchEvent(event);
    }
    
    /**
     * 获取属性的显示名称
     * @param {string} attributeName - 属性名称
     * @returns {string} - 显示名称
     */
    getAttributeDisplayName(attributeName) {
        const displayNames = {
            baseDamage: '基础伤害',
            maxHealth: '最大生命值',
            moveSpeed: '移动速度',
            attackSpeed: '攻击速度',
            criticalRate: '暴击率',
            criticalDamage: '暴击伤害',
            defense: '防御力',
            magicPower: '魔法强度',
            luck: '幸运值',
            experience: '经验获取'
        };
        return displayNames[attributeName] || attributeName;
    }
    
    /**
     * 获取属性的单位
     * @param {string} attributeName - 属性名称
     * @returns {string} - 单位
     */
    getAttributeUnit(attributeName) {
        const units = {
            baseDamage: '点',
            maxHealth: '点',
            moveSpeed: '%',
            attackSpeed: '%',
            criticalRate: '%',
            criticalDamage: '%',
            defense: '点',
            magicPower: '点',
            luck: '点',
            experience: '%'
        };
        return units[attributeName] || '';
    }
}

// 创建全局属性系统实例
if (typeof window !== 'undefined') {
    window.attributeSystem = new AttributeSystem();
    
    // 监听属性变化事件，用于调试
    window.addEventListener('attributeChanged', (event) => {
        console.log('属性变化事件:', event.detail);
    });
}

// 导出模块（如果支持模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AttributeSystem;
}