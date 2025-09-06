// 安全区系统 - v1.0.0
// 实现基于击杀数量的安全区生成和管理

// 安全区系统配置
const SAFE_ZONE_CONFIG = {
    // 区域大小（屏幕大小）
    REGION_SIZE: 800,
    
    // 触发安全区生成的击杀数量 - v4.1.7: 从20改为100
    KILLS_REQUIRED: 100,
    
    // 安全区影响范围
    SAFE_ZONE_RADIUS: 400,
    
    // v4.1.7: 全地图最大安全区数量
    MAX_SAFE_ZONES: 3,
    
    // v4.1.7: 附近区域不重复生成的检查范围（区域数）
    MIN_DISTANCE_REGIONS: 2,
    
    // 守护怪物配置
    GUARDIAN: {
        LEVEL: 50,
        RADIUS: 30,
        ROTATION_SPEED: 0.05,
        HEALTH: 1000
    }
};

// 安全区系统类
class SafeZoneSystem {
    constructor() {
        // 区域击杀统计 - 使用区域坐标作为键
        this.regionKills = new Map();
        
        // 已生成的安全区列表
        this.safeZones = [];
        
        // 守护怪物列表
        this.guardians = [];
    }
    
    // 获取区域坐标键
    getRegionKey(x, y) {
        const regionX = Math.floor(x / SAFE_ZONE_CONFIG.REGION_SIZE);
        const regionY = Math.floor(y / SAFE_ZONE_CONFIG.REGION_SIZE);
        return `${regionX},${regionY}`;
    }
    
    // 获取区域中心坐标
    getRegionCenter(regionKey) {
        const [regionX, regionY] = regionKey.split(',').map(Number);
        return {
            x: regionX * SAFE_ZONE_CONFIG.REGION_SIZE + SAFE_ZONE_CONFIG.REGION_SIZE / 2,
            y: regionY * SAFE_ZONE_CONFIG.REGION_SIZE + SAFE_ZONE_CONFIG.REGION_SIZE / 2
        };
    }
    
    // 记录击杀
    recordKill(x, y) {
        const regionKey = this.getRegionKey(x, y);
        const currentKills = this.regionKills.get(regionKey) || 0;
        const newKills = currentKills + 1;
        
        this.regionKills.set(regionKey, newKills);
        
        // 调试日志：击杀记录
        console.log(`[安全区] 击杀记录: 区域${regionKey} 击杀数${newKills}/${SAFE_ZONE_CONFIG.KILLS_REQUIRED}`);
        
        // v4.1.7: 检查是否达到安全区生成条件（新增多项检查）
        if (newKills >= SAFE_ZONE_CONFIG.KILLS_REQUIRED && 
            !this.hasSafeZone(regionKey) && 
            this.canCreateSafeZone(regionKey)) {
            console.log(`[安全区] 生成安全区: 区域${regionKey}`);
            this.createSafeZone(regionKey);
        }
        
        return newKills;
    }
    
    // 检查区域是否已有安全区
    hasSafeZone(regionKey) {
        return this.safeZones.some(zone => zone.regionKey === regionKey);
    }
    
    // v4.1.7: 检查是否可以创建安全区（数量限制和距离检查）
    canCreateSafeZone(regionKey) {
        // 检查安全区数量限制
        if (this.safeZones.length >= SAFE_ZONE_CONFIG.MAX_SAFE_ZONES) {
            console.log(`[安全区] 已达到最大安全区数量限制: ${SAFE_ZONE_CONFIG.MAX_SAFE_ZONES}`);
            return false;
        }
        
        // 检查附近区域是否已有安全区
        const [targetX, targetY] = regionKey.split(',').map(Number);
        const minDistance = SAFE_ZONE_CONFIG.MIN_DISTANCE_REGIONS;
        
        for (const existingZone of this.safeZones) {
            const [existingX, existingY] = existingZone.regionKey.split(',').map(Number);
            const distance = Math.sqrt(
                Math.pow(targetX - existingX, 2) + Math.pow(targetY - existingY, 2)
            );
            
            if (distance < minDistance) {
                console.log(`[安全区] 附近已有安全区，距离: ${distance.toFixed(1)} < ${minDistance}`);
                return false;
            }
        }
        
        return true;
    }
    
    // 创建安全区
    createSafeZone(regionKey) {
        const center = this.getRegionCenter(regionKey);
        
        // 创建安全区对象
        const safeZone = {
            regionKey: regionKey,
            x: center.x,
            y: center.y,
            radius: SAFE_ZONE_CONFIG.SAFE_ZONE_RADIUS,
            createdAt: Date.now(),
            active: true,
            lastActiveCheck: Date.now()
        };
        
        this.safeZones.push(safeZone);
        
        // v4.1.7: 检查并清理多余的安全区
        this.cleanupExcessSafeZones();
        
        // 创建守护怪物
        this.createGuardian(center.x, center.y);
        
        // 创建安全区生成特效
        this.createSafeZoneEffect(center.x, center.y);
        
        // 安全区已生成（移除console.log避免刷屏）
        
        return safeZone;
    }
    
    // v4.1.7: 清理多余的安全区（保留最新的3个）
    cleanupExcessSafeZones() {
        if (this.safeZones.length > SAFE_ZONE_CONFIG.MAX_SAFE_ZONES) {
            // 按创建时间排序，保留最新的
            this.safeZones.sort((a, b) => b.createdAt - a.createdAt);
            
            // 移除多余的安全区
            const excessZones = this.safeZones.splice(SAFE_ZONE_CONFIG.MAX_SAFE_ZONES);
            
            // 移除对应的守护怪物
            for (const zone of excessZones) {
                this.removeGuardiansInZone(zone.x, zone.y);
                console.log(`[安全区] 清理多余安全区: 区域${zone.regionKey}`);
            }
        }
    }
    
    // v4.1.7: 移除指定区域的守护怪物
    removeGuardiansInZone(zoneX, zoneY) {
        const removalRadius = SAFE_ZONE_CONFIG.SAFE_ZONE_RADIUS;
        this.guardians = this.guardians.filter(guardian => {
            const distance = Math.sqrt(
                Math.pow(guardian.x - zoneX, 2) + Math.pow(guardian.y - zoneY, 2)
            );
            return distance > removalRadius;
        });
    }
    
    // 创建守护怪物
    createGuardian(x, y) {
        // 随机选择精英怪物类型
        const eliteTypes = ['graviton', 'destroyer', 'guardian', 'vortex'];
        const eliteType = eliteTypes[Math.floor(Math.random() * eliteTypes.length)];
        
        const guardian = {
            x: x,
            y: y,
            radius: SAFE_ZONE_CONFIG.GUARDIAN.RADIUS,
            level: SAFE_ZONE_CONFIG.GUARDIAN.LEVEL,
            health: SAFE_ZONE_CONFIG.GUARDIAN.HEALTH,
            maxHealth: SAFE_ZONE_CONFIG.GUARDIAN.HEALTH,
            type: 'elite',
            eliteType: eliteType,
            friendly: true,
            rotation: 0,
            rotationSpeed: SAFE_ZONE_CONFIG.GUARDIAN.ROTATION_SPEED,
            // 守护怪物不移动
            dx: 0,
            dy: 0,
            speed: 0,
            state: 'guardian',
            // 精英怪物轨道球
            orbs: [],
            orbAngle: 0,
            orbRadius: 60,
            orbCount: 4,
            // 视觉效果
            glowIntensity: 0,
            glowDirection: 1
        };
        
        // 初始化轨道球
        for (let i = 0; i < guardian.orbCount; i++) {
            const angle = (i / guardian.orbCount) * Math.PI * 2;
            guardian.orbs.push({
                angle: angle,
                radius: guardian.orbRadius,
                x: guardian.x + Math.cos(angle) * guardian.orbRadius,
                y: guardian.y + Math.sin(angle) * guardian.orbRadius
            });
        }
        
        this.guardians.push(guardian);
        
        // 将守护怪物添加到游戏敌人列表中（但标记为友好）
        if (window.game && window.game.enemies) {
            window.game.enemies.push(guardian);
        }
        
        return guardian;
    }
    
    // 创建安全区生成特效
    createSafeZoneEffect(x, y) {
        if (window.game && window.game.particles) {
            // 创建光环粒子效果
            for (let i = 0; i < 50; i++) {
                const angle = (i / 50) * Math.PI * 2;
                const radius = SAFE_ZONE_CONFIG.SAFE_ZONE_RADIUS;
                
                window.game.particles.push({
                    x: x + Math.cos(angle) * radius,
                    y: y + Math.sin(angle) * radius,
                    dx: Math.cos(angle) * 2,
                    dy: Math.sin(angle) * 2,
                    radius: 8,
                    color: '#00FF88',
                    lifetime: 120,
                    maxLifetime: 120,
                    type: 'safeZone'
                });
            }
            
            // 中心爆发效果
            for (let i = 0; i < 30; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 3 + Math.random() * 5;
                
                window.game.particles.push({
                    x: x,
                    y: y,
                    dx: Math.cos(angle) * speed,
                    dy: Math.sin(angle) * speed,
                    radius: 4 + Math.random() * 6,
                    color: '#88FF88',
                    lifetime: 80,
                    maxLifetime: 80,
                    type: 'safeZone'
                });
            }
        }
        
        // 移除浮动文字提示，避免重复刷屏
    }
    
    // 检查位置是否在安全区内
    isInSafeZone(x, y) {
        for (const zone of this.safeZones) {
            if (!zone.active) continue;
            
            const distance = Math.sqrt(
                Math.pow(x - zone.x, 2) + Math.pow(y - zone.y, 2)
            );
            
            if (distance <= zone.radius) {
                // 调试日志：安全区检测
                if (Math.random() < 0.01) { // 1%概率输出，避免刷屏
                    console.log(`[安全区] 位置(${x.toFixed(0)},${y.toFixed(0)})在安全区内，距离${distance.toFixed(0)}`);
                }
                return zone;
            }
        }
        return null;
    }
    
    // 获取避开安全区的向量
    getAvoidanceVector(x, y) {
        for (const zone of this.safeZones) {
            if (!zone.active) continue;
            
            const dx = x - zone.x;
            const dy = y - zone.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 如果在安全区边界附近，返回远离安全区的向量
            const avoidanceDistance = zone.radius + 100; // 额外100像素的避让距离
            if (distance < avoidanceDistance && distance > 0) {
                const normalizedX = dx / distance;
                const normalizedY = dy / distance;
                return {
                    x: normalizedX,
                    y: normalizedY
                };
            }
        }
        return null;
    }
    
    // 主更新方法
    update(playerX, playerY) {
        this.updateGuardians();
        this.cleanup(playerX, playerY);
    }
    
    // 更新守护怪物
    updateGuardians() {
        for (const guardian of this.guardians) {
            // 旋转守护怪物
            guardian.rotation += guardian.rotationSpeed;
            
            // 更新轨道球位置
            if (guardian.orbs && guardian.orbs.length > 0) {
                guardian.orbAngle += 0.02;
                
                for (let i = 0; i < guardian.orbs.length; i++) {
                    const orb = guardian.orbs[i];
                    const angle = guardian.orbAngle + (i / guardian.orbs.length) * Math.PI * 2;
                    orb.x = guardian.x + Math.cos(angle) * guardian.orbRadius;
                    orb.y = guardian.y + Math.sin(angle) * guardian.orbRadius;
                }
            }
            
            // 更新发光效果
            guardian.glowIntensity += guardian.glowDirection * 0.02;
            if (guardian.glowIntensity >= 1) {
                guardian.glowIntensity = 1;
                guardian.glowDirection = -1;
            } else if (guardian.glowIntensity <= 0) {
                guardian.glowIntensity = 0;
                guardian.glowDirection = 1;
            }
        }
    }
    
    // 获取区域击杀数量
    getRegionKills(x, y) {
        const regionKey = this.getRegionKey(x, y);
        return this.regionKills.get(regionKey) || 0;
    }
    
    // 获取所有安全区
    getSafeZones() {
        return this.safeZones.filter(zone => zone.active);
    }
    
    // 获取所有守护怪物
    getGuardians() {
        return this.guardians;
    }
    
    // 清理远距离的安全区和守护怪物
    cleanup(playerX, playerY, maxDistance = 3000) {
        // 清理远距离安全区
        this.safeZones = this.safeZones.filter(zone => {
            const distance = Math.sqrt(
                Math.pow(playerX - zone.x, 2) + Math.pow(playerY - zone.y, 2)
            );
            return distance <= maxDistance;
        });
        
        // 清理远距离守护怪物
        this.guardians = this.guardians.filter(guardian => {
            const distance = Math.sqrt(
                Math.pow(playerX - guardian.x, 2) + Math.pow(playerY - guardian.y, 2)
            );
            
            if (distance > maxDistance) {
                // 从游戏敌人列表中移除
                if (window.game && window.game.enemies) {
                    const index = window.game.enemies.indexOf(guardian);
                    if (index !== -1) {
                        window.game.enemies.splice(index, 1);
                    }
                }
                return false;
            }
            return true;
        });
    }
    
    // 重置系统
    reset() {
        this.regionKills.clear();
        this.safeZones = [];
        this.guardians = [];
    }
}

// 创建全局安全区系统实例
const safeZoneSystem = new SafeZoneSystem();

// 导出到全局
if (typeof window !== 'undefined') {
    window.safeZoneSystem = safeZoneSystem;
    window.SAFE_ZONE_CONFIG = SAFE_ZONE_CONFIG;
}

// 模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SafeZoneSystem,
        safeZoneSystem,
        SAFE_ZONE_CONFIG
    };
}