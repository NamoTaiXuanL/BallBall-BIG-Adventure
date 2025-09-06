// 伤害记录系统 - 记录对怪物类型的伤害数据
// 版本: 4.0.1
// 日期: 2025-09-06

class DamageTracker {
    constructor() {
        // 伤害记录数组，存储每次伤害的详细信息
        this.damageRecords = [];
        
        // 按怪物类型统计的伤害数据
        this.damageByType = {
            red: { total: 0, count: 0, critical: 0 },
            blue: { total: 0, count: 0, critical: 0 },
            white: { total: 0, count: 0, critical: 0 },
            black: { total: 0, count: 0, critical: 0 },
            largered: { total: 0, count: 0, critical: 0 },
            rotating: { total: 0, count: 0, critical: 0 },
            teleport: { total: 0, count: 0, critical: 0 },
            snake: { total: 0, count: 0, critical: 0 },
            yellow: { total: 0, count: 0, critical: 0 },
            control: { total: 0, count: 0, critical: 0 },
            elite: { total: 0, count: 0, critical: 0 },
            graviton: { total: 0, count: 0, critical: 0 },
            destroyer: { total: 0, count: 0, critical: 0 },
            guardian: { total: 0, count: 0, critical: 0 },
            vortex: { total: 0, count: 0, critical: 0 }
        };
        
        // 伤害类型统计
        this.damageBySource = {
            projectile: { total: 0, count: 0 },
            explosion: { total: 0, count: 0 },
            laser: { total: 0, count: 0 },
            windfire: { total: 0, count: 0 },
            collision: { total: 0, count: 0 },
            buff: { total: 0, count: 0 }
        };
        
        // 显示控制
        this.isVisible = false;
        this.showSummary = true;
        
        // 记录限制（防止内存溢出）
        this.maxRecords = 1000;
        
        // 时间统计
        this.sessionStartTime = Date.now();
        this.totalDamage = 0;
        this.totalHits = 0;
        this.criticalHits = 0;
    }
    
    // 记录伤害数据
    recordDamage(damageData) {
        // 支持对象参数和单独参数两种方式
        let damage, monsterType, damageSource, isCritical, monsterLevel;
        
        if (typeof damageData === 'object' && damageData !== null) {
            // 对象参数方式
            damage = damageData.damage;
            monsterType = damageData.monsterType;
            damageSource = damageData.damageSource;
            isCritical = damageData.isCritical || false;
            monsterLevel = damageData.monsterLevel || 1;
        } else {
            // 兼容旧的单独参数方式
            damage = arguments[0];
            monsterType = arguments[1];
            damageSource = arguments[2];
            isCritical = arguments[3] || false;
            monsterLevel = arguments[4] || 1;
        }
        
        const timestamp = Date.now();
        
        // 创建伤害记录
        const record = {
            timestamp: timestamp,
            time: new Date(timestamp).toLocaleTimeString(),
            damage: damage,
            monsterType: monsterType,
            damageSource: damageSource,
            isCritical: isCritical,
            monsterLevel: monsterLevel
        };
        
        // 添加到记录数组
        this.damageRecords.unshift(record);
        
        // 限制记录数量
        if (this.damageRecords.length > this.maxRecords) {
            this.damageRecords.pop();
        }
        
        // 更新统计数据
        this.updateStats(damage, monsterType, damageSource, isCritical);
    }
    
    // 更新统计数据
    updateStats(damage, monsterType, damageSource, isCritical) {
        // 更新总体统计
        this.totalDamage += damage;
        this.totalHits++;
        if (isCritical) {
            this.criticalHits++;
        }
        
        // 更新按怪物类型统计
        if (this.damageByType[monsterType]) {
            this.damageByType[monsterType].total += damage;
            this.damageByType[monsterType].count++;
            if (isCritical) {
                this.damageByType[monsterType].critical++;
            }
        }
        
        // 更新按伤害来源统计
        if (this.damageBySource[damageSource]) {
            this.damageBySource[damageSource].total += damage;
            this.damageBySource[damageSource].count++;
        }
    }
    
    // 获取DPS（每秒伤害）
    getDPS() {
        const sessionTime = (Date.now() - this.sessionStartTime) / 1000;
        return sessionTime > 0 ? Math.round(this.totalDamage / sessionTime) : 0;
    }
    
    // 获取暴击率
    getCriticalRate() {
        return this.totalHits > 0 ? Math.round((this.criticalHits / this.totalHits) * 100) : 0;
    }
    
    // 获取平均伤害
    getAverageDamage() {
        return this.totalHits > 0 ? Math.round(this.totalDamage / this.totalHits) : 0;
    }
    
    // 获取最近的伤害记录
    getRecentRecords(count = 10) {
        return this.damageRecords.slice(0, count);
    }
    
    // 获取按怪物类型排序的伤害统计
    getTopDamageByType(count = 5) {
        const types = Object.keys(this.damageByType)
            .filter(type => this.damageByType[type].total > 0)
            .sort((a, b) => this.damageByType[b].total - this.damageByType[a].total)
            .slice(0, count);
        
        return types.map(type => ({
            type: type,
            total: this.damageByType[type].total,
            count: this.damageByType[type].count,
            average: Math.round(this.damageByType[type].total / this.damageByType[type].count),
            critical: this.damageByType[type].critical
        }));
    }
    
    // 获取按伤害来源排序的统计
    getTopDamageBySource() {
        const sources = Object.keys(this.damageBySource)
            .filter(source => this.damageBySource[source].total > 0)
            .sort((a, b) => this.damageBySource[b].total - this.damageBySource[a].total);
        
        return sources.map(source => ({
            source: source,
            total: this.damageBySource[source].total,
            count: this.damageBySource[source].count,
            average: Math.round(this.damageBySource[source].total / this.damageBySource[source].count)
        }));
    }
    
    // 切换显示状态
    toggleVisibility() {
        this.isVisible = !this.isVisible;
    }
    
    // 切换简略/详细显示
    toggleSummary() {
        this.showSummary = !this.showSummary;
    }
    
    // 重置统计数据
    reset() {
        this.damageRecords = [];
        this.sessionStartTime = Date.now();
        this.totalDamage = 0;
        this.totalHits = 0;
        this.criticalHits = 0;
        
        // 重置按类型统计
        Object.keys(this.damageByType).forEach(type => {
            this.damageByType[type] = { total: 0, count: 0, critical: 0 };
        });
        
        // 重置按来源统计
        Object.keys(this.damageBySource).forEach(source => {
            this.damageBySource[source] = { total: 0, count: 0 };
        });
    }
    
    // 获取伤害类型的中文名称
    getMonsterTypeName(type) {
        const names = {
            red: '红球',
            blue: '蓝球',
            white: '白球',
            black: '黑球',
            largered: '大红球',
            rotating: '旋转球',
            teleport: '传送球',
            snake: '蛇形球',
            yellow: '黄球',
            control: '控制球',
            elite: '精英怪',
            graviton: '引力子',
            destroyer: '毁灭者',
            guardian: '守护者',
            vortex: '漩涡'
        };
        return names[type] || type;
    }
    
    // 获取伤害来源的中文名称
    getDamageSourceName(source) {
        const names = {
            projectile: '投射物',
            explosion: '爆炸',
            laser: '激光',
            windfire: '风火轮',
            collision: '碰撞',
            buff: 'Buff效果'
        };
        return names[source] || source;
    }
}

// 创建全局伤害追踪器实例
const damageTracker = new DamageTracker();

// 导出到全局作用域
window.damageTracker = damageTracker;
window.DamageTracker = DamageTracker;

// Node.js 模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DamageTracker,
        damageTracker
    };
}