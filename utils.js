// 球球大冒险 - 工具函数模块
// 包含游戏中用到的辅助函数，如随机数生成、几何计算等

// 随机数生成函数
function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

// 创建伤害数值显示
function createDamageNumber(x, y, damage, isCritical = false) {
    const damageNumber = ObjectPool.getDamageNumber();
    damageNumber.x = x + randomBetween(-20, 20);
    damageNumber.y = y - 10;
    damageNumber.damage = damage;
    damageNumber.isCritical = isCritical;
    damageNumber.lifetime = 60; // 1秒显示时间
    damageNumber.dy = -2; // 向上飘动
    damageNumber.alpha = 1.0;
    damageNumber.active = true;
    game.damageNumbers.push(damageNumber);
}

// 创建暴击显示
function createCriticalDisplay(damage) {
    const criticalDisplay = {
        damage: damage,
        lifetime: 90, // 1.5秒显示时间
        scale: 0.5, // 初始缩放
        alpha: 1.0,
        active: true
    };
    game.criticalDisplays.push(criticalDisplay);
}

// 创建经验数值显示
function createExperienceNumber(x, y, exp) {
    const expNumber = ObjectPool.getExperienceNumber();
    expNumber.x = x + randomBetween(-15, 15);
    expNumber.y = y - 5;
    expNumber.exp = exp;
    expNumber.lifetime = 45;
    expNumber.dy = -1.5;
    expNumber.alpha = 1.0;
    expNumber.active = true;
    game.experienceNumbers.push(expNumber);
}

// 创建浮动文本
function createFloatingText(x, y, text, color, lifetime, scale) {
    game.floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color || '#FFFFFF',
        lifetime: lifetime || 60,
        alpha: 1,
        dy: -1,
        scale: scale || 1.0
    });
}

// 创建粒子效果
function createParticles(x, y, radius, color) {
    const particleCount = Math.min(8, Math.floor(radius / 3));
    
    for (let i = 0; i < particleCount; i++) {
        const particle = ObjectPool.getParticle();
        particle.x = x + randomBetween(-radius/2, radius/2);
        particle.y = y + randomBetween(-radius/2, radius/2);
        particle.dx = randomBetween(-3, 3);
        particle.dy = randomBetween(-3, 3);
        particle.size = randomBetween(2, 4);
        particle.color = color;
        particle.lifetime = randomBetween(20, 40);
        particle.alpha = 1;
        particle.active = true;
        game.particles.push(particle);
    }
}

// 对象池系统
const ObjectPool = {
    // 投射物池
    projectilePool: [],
    getProjectile: function() {
        if (this.projectilePool.length > 0) {
            return this.projectilePool.pop();
        }
        return {
            x: 0, y: 0, dx: 0, dy: 0, radius: 0, color: '', 
            lifetime: 0, damage: 0, active: false, isFriendly: false
        };
    },
    recycleProjectile: function(projectile) {
        projectile.active = false;
        this.projectilePool.push(projectile);
    },
    
    // 粒子池
    particlePool: [],
    getParticle: function() {
        if (this.particlePool.length > 0) {
            return this.particlePool.pop();
        }
        return {
            x: 0, y: 0, dx: 0, dy: 0, size: 0, color: '', 
            lifetime: 0, alpha: 1, active: false
        };
    },
    recycleParticle: function(particle) {
        particle.active = false;
        this.particlePool.push(particle);
    },
    
    // 伤害数值池
    damageNumberPool: [],
    getDamageNumber: function() {
        if (this.damageNumberPool.length > 0) {
            return this.damageNumberPool.pop();
        }
        return {
            x: 0, y: 0, dx: 0, dy: 0, damage: 0, 
            lifetime: 0, alpha: 1, active: false, isCritical: false
        };
    },
    recycleDamageNumber: function(damageNumber) {
        damageNumber.active = false;
        this.damageNumberPool.push(damageNumber);
    },
    
    // 经验数值池
    experienceNumberPool: [],
    getExperienceNumber: function() {
        if (this.experienceNumberPool.length > 0) {
            return this.experienceNumberPool.pop();
        }
        return {
            x: 0, y: 0, dx: 0, dy: 0, exp: 0, 
            lifetime: 0, alpha: 1, active: false
        };
    },
    recycleExperienceNumber: function(expNumber) {
        expNumber.active = false;
        this.experienceNumberPool.push(expNumber);
    }
};

// 碰撞检测系统
const collisionSystem = {
    // 粗略距离检查（快速筛选）
    roughDistanceCheck: function(player, object, maxDistance = 200) {
        const dx = Math.abs(player.x - (object.x + object.width / 2));
        const dy = Math.abs(player.y - (object.y + object.height / 2));
        return dx < maxDistance && dy < maxDistance;
    },
    
    // 精确碰撞检测
    preciseCollision: function(player, object) {
        return (
            player.x + player.radius > object.x &&
            player.x - player.radius < object.x + object.width &&
            player.y + player.radius > object.y &&
            player.y - player.radius < object.y + object.height
        );
    },
    
    // 圆形碰撞检测
    circleCollision: function(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (obj1.radius + obj2.radius);
    },
    
    // 获取附近的平台（空间索引优化）
    getNearbyPlatforms: function(player, platforms, maxDistance = 300) {
        return platforms.filter(platform => 
            this.roughDistanceCheck(player, platform, maxDistance)
        );
    }
};

// 数学工具函数
const MathUtils = {
    // 限制数值范围
    clamp: function(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    // 线性插值
    lerp: function(start, end, factor) {
        return start + (end - start) * factor;
    },
    
    // 计算两点距离
    distance: function(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },
    
    // 计算角度
    getAngle: function(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },
    
    // 向量归一化
    normalize: function(x, y) {
        const length = Math.sqrt(x * x + y * y);
        if (length === 0) return { x: 0, y: 0 };
        return { x: x / length, y: y / length };
    }
};

// 导出所有函数和对象（用于模块化）
// 全局函数暴露
window.randomBetween = randomBetween;
window.createDamageNumber = createDamageNumber;
window.createCriticalDisplay = createCriticalDisplay;
window.createExperienceNumber = createExperienceNumber;
window.createFloatingText = createFloatingText;
window.createParticles = createParticles;
window.ObjectPool = ObjectPool;
window.collisionSystem = collisionSystem;
window.MathUtils = MathUtils;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        randomBetween,
        createDamageNumber,
        createCriticalDisplay,
        createExperienceNumber,
        createFloatingText,
        createParticles,
        ObjectPool,
        collisionSystem,
        MathUtils
    };
}