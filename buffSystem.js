// 球球大冒险 - Buff系统
// 版本: v3.9.0
// 功能: 管理玩家buff效果，包括三相之力等特殊能力

class BuffSystem {
    constructor(game) {
        this.game = game;
        this.activeBuffs = new Map(); // 存储激活的buff
        this.buffDefinitions = this.initBuffDefinitions();
        
        // 调试日志记录
        this.logger = window.debugLogger;
        if (this.logger) {
            this.logger.logGameState('BuffSystem初始化', {
                buffDefinitions: Object.keys(this.buffDefinitions)
            });
        }
        
        // 自动激活等级强化buff
        this.activateBuff('levelEnhancement');
        console.log('[BuffSystem] levelEnhancement buff已自动激活');
    }

    // 初始化buff定义
    initBuffDefinitions() {
        return {
            trinityForce: {
                id: 'trinityForce',
                name: '三相之力',
                duration: 15000, // 15秒
                dropChance: 0.02, // 2%掉落概率
                effects: {
                    tripleShot: true, // 三股射击
                    triangleFormation: true, // 三角形阵型
                    goldenGlow: true, // 金光效果
                    windFireWheels: 3 // 三个风火轮
                }
            },
            solarFlare: {
                id: 'solarFlare',
                name: '日炎',
                duration: 12000, // 12秒
                dropChance: 0.03, // 3%掉落概率
                effects: {
                    redGlow: true, // 红光闪烁
                    burnAura: true, // 灼烧光环
                    burnDamage: 500, // 灼烧伤害
                    burnRadius: 600, // 灼烧范围(扩大5倍)
                    burnInterval: 500 // 灼烧间隔(毫秒)
                }
            },
            levelEnhancement: {
                id: 'levelEnhancement',
                name: '等级强化',
                duration: -1, // 永久buff，不会过期
                dropChance: 0, // 不通过掉落获得
                effects: {
                    healthMultiplier: 3, // 血量倍数（指数增长基数）
                    damageMultiplier: 1.0, // 攻击力每级增长倍数
                    speedMultiplier: 0.5, // 速度每级增长倍数
                    sizeMultiplier: 0.25, // 体积每级增长倍数
                    rangeMultiplier: 0.5 // 范围每级增长倍数
                }
            }
        };
    }

    // 检查是否获得buff（击杀敌人时调用）
    checkBuffDrop(enemyType) {
        // 检查三相之力掉落
        const trinityForce = this.buffDefinitions.trinityForce;
        let trinityDropChance = trinityForce.dropChance;
        if (enemyType === 'elite') {
            trinityDropChance *= 3; // 精英怪3倍概率
        } else if (enemyType === 'boss') {
            trinityDropChance *= 5; // Boss 5倍概率
        }

        if (Math.random() < trinityDropChance) {
            // 激活三相之力时，停用日炎buff以避免范围秒杀
            if (this.isBuffActive('solarFlare')) {
                this.deactivateBuff('solarFlare');
            }
            this.activateBuff('trinityForce');
            return true;
        }

        // 检查日炎掉落
        const solarFlare = this.buffDefinitions.solarFlare;
        let solarDropChance = solarFlare.dropChance;
        if (enemyType === 'elite') {
            solarDropChance *= 2.5; // 精英怪2.5倍概率
        } else if (enemyType === 'boss') {
            solarDropChance *= 4; // Boss 4倍概率
        }

        if (Math.random() < solarDropChance) {
            // 激活日炎时，停用三相之力以避免范围秒杀
            if (this.isBuffActive('trinityForce')) {
                this.deactivateBuff('trinityForce');
            }
            this.activateBuff('solarFlare');
            return true;
        }

        return false;
    }

    // 激活buff
    activateBuff(buffId) {
        if (this.logger) {
            this.logger.logBuffActivation(`尝试激活buff: ${buffId}`);
        }
        
        const buffDef = this.buffDefinitions[buffId];
        if (!buffDef) {
            const errorMsg = `未找到buff定义: ${buffId}`;
            console.error(errorMsg);
            if (this.logger) {
                this.logger.logError(errorMsg);
            }
            return false;
        }

        const buff = {
            ...buffDef,
            startTime: Date.now(),
            endTime: Date.now() + buffDef.duration
        };

        this.activeBuffs.set(buffId, buff);
        
        if (this.logger) {
            this.logger.logBuffActivation(`Buff实例已创建: ${buffId}`, {
                buffData: buff,
                activeBuffsCount: this.activeBuffs.size
            });
        }
        
        // 根据buff类型执行特殊初始化
        if (buffId === 'trinityForce') {
            this.initTrinityForce(buff);
        } else if (buffId === 'solarFlare') {
            this.initSolarFlare(buff);
        } else if (buffId === 'levelEnhancement') {
            this.initLevelEnhancement(buff);
        }
        
        if (this.logger) {
            this.logger.logBuffActivation(`Buff激活完成: ${buffId}`, {
                isActive: buff.isActive,
                activeBuffsList: Array.from(this.activeBuffs.keys())
            });
        }

        return true;
    }

    // 初始化三相之力buff
    initTrinityForce(buff) {
        // 初始化三角形旋转角度
        buff.triangleRotation = 0;
        buff.rotationSpeed = 2; // 旋转速度
        
        // 计算三个风火轮的位置（等边三角形顶点）
        buff.wheelPositions = [
            { angle: 0, radius: 80 },           // 右
            { angle: Math.PI * 2/3, radius: 80 }, // 左上
            { angle: Math.PI * 4/3, radius: 80 }  // 左下
        ];

        // 金光闪烁效果参数
        buff.glowIntensity = 0;
        buff.glowDirection = 1;
        buff.glowSpeed = 0.1;
    }

    // 初始化日炎buff
    initSolarFlare(buff) {
        // 红光闪烁效果参数
        buff.redGlowIntensity = 0;
        buff.redGlowDirection = 1;
        buff.redGlowSpeed = 0.15;
        
        // 灼烧光环参数
        buff.auraRadius = 0;
        buff.auraMaxRadius = buff.effects.burnRadius;
        buff.auraGrowSpeed = 3;
        
        // 灼烧伤害计时器
        buff.lastBurnTime = 0;
        buff.burnTargets = new Set(); // 记录已被灼烧的敌人，避免重复伤害
    }

    // 初始化等级强化buff
    initLevelEnhancement(buff) {
        // 等级强化是永久buff，不需要特殊初始化
        // 所有逻辑在应用时处理
        buff.isActive = true;
        console.log('等级强化buff已激活');
        
        if (this.logger) {
            this.logger.logBuffActivation('levelEnhancement初始化完成', {
                buffId: buff.id,
                isActive: buff.isActive,
                effects: buff.effects,
                isPermanent: buff.isPermanent,
                startTime: buff.startTime
            });
        }
    }

    // 更新buff状态
    update(deltaTime) {
        const currentTime = Date.now();
        
        // 检查并移除过期的buff
        for (const [buffId, buff] of this.activeBuffs) {
            // 永久buff（duration为-1）不会过期
            if (buff.duration !== -1 && currentTime >= buff.endTime) {
                if (this.logger) {
                    this.logger.logBuffUpdate(`Buff过期: ${buffId}`, {
                        duration: buff.duration,
                        elapsed: currentTime - buff.startTime
                    });
                }
                this.deactivateBuff(buffId);
            } else {
                this.updateBuff(buffId, buff, deltaTime);
            }
        }
        
        // 定期记录buff状态
        if (this.logger && Math.random() < 0.01) { // 1%概率记录状态
            this.logger.logBuffUpdate('Buff系统状态', {
                activeBuffsCount: this.activeBuffs.size,
                activeBuffsList: Array.from(this.activeBuffs.keys()),
                buffStates: Array.from(this.activeBuffs.entries()).map(([id, buff]) => ({
                    id,
                    isActive: buff.isActive,
                    isPermanent: buff.duration === -1,
                    elapsed: currentTime - buff.startTime
                }))
            });
        }
    }

    // 更新单个buff
    updateBuff(buffId, buff, deltaTime) {
        if (buffId === 'trinityForce') {
            this.updateTrinityForce(buff, deltaTime);
        } else if (buffId === 'solarFlare') {
            this.updateSolarFlare(buff, deltaTime);
        } else if (buffId === 'levelEnhancement') {
            this.updateLevelEnhancement(buff, deltaTime);
        }
    }

    // 更新三相之力效果
    updateTrinityForce(buff, deltaTime) {
        // 更新三角形旋转
        buff.triangleRotation += buff.rotationSpeed * deltaTime / 16.67; // 标准化到60fps
        if (buff.triangleRotation >= Math.PI * 2) {
            buff.triangleRotation -= Math.PI * 2;
        }

        // 更新金光闪烁
        buff.glowIntensity += buff.glowDirection * buff.glowSpeed;
        if (buff.glowIntensity >= 1) {
            buff.glowIntensity = 1;
            buff.glowDirection = -1;
        } else if (buff.glowIntensity <= 0.3) {
            buff.glowIntensity = 0.3;
            buff.glowDirection = 1;
        }
    }

    // 更新日炎效果
    updateSolarFlare(buff, deltaTime) {
        // 更新红光闪烁
        buff.redGlowIntensity += buff.redGlowDirection * buff.redGlowSpeed;
        if (buff.redGlowIntensity >= 1) {
            buff.redGlowIntensity = 1;
            buff.redGlowDirection = -1;
        } else if (buff.redGlowIntensity <= 0.2) {
            buff.redGlowIntensity = 0.2;
            buff.redGlowDirection = 1;
        }

        // 更新灼烧光环半径
        if (buff.auraRadius < buff.auraMaxRadius) {
            buff.auraRadius += buff.auraGrowSpeed;
            if (buff.auraRadius > buff.auraMaxRadius) {
                buff.auraRadius = buff.auraMaxRadius;
            }
        }

        // 处理灼烧伤害
        const currentTime = Date.now();
        if (currentTime - buff.lastBurnTime >= buff.effects.burnInterval) {
            this.processBurnDamage(buff);
            buff.lastBurnTime = currentTime;
        }
    }

    // 更新等级强化效果
    updateLevelEnhancement(buff, deltaTime) {
        // 等级强化是被动buff，不需要主动更新
        // 所有逻辑在应用等级缩放时处理
        buff.isActive = true;
    }

    // 处理灼烧伤害
    processBurnDamage(buff) {
        if (!this.game || !this.game.player || !this.game.enemies) return;

        const player = this.game.player;
        const enemies = this.game.enemies;
        const burnRadius = buff.effects.burnRadius;
        const burnDamage = buff.effects.burnDamage;

        // 清空上次的灼烧目标记录
        buff.burnTargets.clear();

        // 检查范围内的敌人
        enemies.forEach(enemy => {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= burnRadius) {
                // 对敌人造成灼烧伤害
                enemy.health -= burnDamage;
                buff.burnTargets.add(enemy.id || enemy);

                // 创建伤害数字显示
                if (this.game.createDamageNumber) {
                    this.game.createDamageNumber(enemy.x, enemy.y - 20, burnDamage, false, '#FF4444');
                }

                // 创建灼烧粒子效果
                if (this.game.createParticle) {
                    for (let i = 0; i < 3; i++) {
                        this.game.createParticle({
                            x: enemy.x + (Math.random() - 0.5) * 30,
                            y: enemy.y + (Math.random() - 0.5) * 30,
                            vx: (Math.random() - 0.5) * 2,
                            vy: (Math.random() - 0.5) * 2,
                            color: '#FF4444',
                            life: 30,
                            size: 3
                        });
                    }
                }
            }
        });
    }

    // 停用buff
    deactivateBuff(buffId) {
        this.activeBuffs.delete(buffId);
    }

    // 检查是否有指定buff
    hasBuff(buffId) {
        return this.activeBuffs.has(buffId);
    }

    // 检查buff是否激活（别名方法，兼容性）
    isBuffActive(buffId) {
        return this.hasBuff(buffId);
    }

    // 获取buff信息
    getBuff(buffId) {
        return this.activeBuffs.get(buffId);
    }

    // 获取所有激活的buff
    getActiveBuffs() {
        return Array.from(this.activeBuffs.values());
    }

    // 获取三相之力的射击方向（用于三股射击）
    getTrinityForceDirections(baseAngle) {
        if (!this.hasBuff('trinityForce')) {
            return [baseAngle]; // 没有buff时返回单一方向
        }

        // 返回三个方向：中间、左偏、右偏
        const spreadAngle = Math.PI / 12; // 15度扩散
        return [
            baseAngle,                    // 中间
            baseAngle - spreadAngle,      // 左偏
            baseAngle + spreadAngle       // 右偏
        ];
    }

    // 获取三相之力风火轮位置
    getTrinityForceWheelPositions(playerX, playerY) {
        const buff = this.getBuff('trinityForce');
        if (!buff) return [];

        const positions = [];
        for (const wheelPos of buff.wheelPositions) {
            const angle = wheelPos.angle + buff.triangleRotation;
            const x = playerX + Math.cos(angle) * wheelPos.radius;
            const y = playerY + Math.sin(angle) * wheelPos.radius;
            positions.push({ x, y, radius: 40 }); // 风火轮半径40
        }
        return positions;
    }

    // 获取日炎光环信息
    getSolarFlareAura(playerX, playerY) {
        const buff = this.getBuff('solarFlare');
        if (!buff) return null;

        return {
            x: playerX,
            y: playerY,
            radius: buff.auraRadius,
            maxRadius: buff.auraMaxRadius,
            intensity: buff.redGlowIntensity,
            burnDamage: buff.effects.burnDamage
        };
    }

    // 获取剩余时间（毫秒）
    getBuffRemainingTime(buffId) {
        const buff = this.getBuff(buffId);
        if (!buff) return 0;
        return Math.max(0, buff.endTime - Date.now());
    }

    // 清除所有buff
    clearAllBuffs() {
        this.activeBuffs.clear();
    }

    // 应用等级强化到怪物（替代gameLogic.js中的applyLevelScaling）
    applyLevelScaling(enemy) {
        if (this.logger) {
            this.logger.logEnemyCreation(enemy);
            this.logger.logBuffApplication('levelEnhancement开始应用', `${enemy.type}(${enemy.x},${enemy.y})`, {
                level: enemy.level,
                distanceFromSpawn: enemy.distanceFromSpawn,
                originalHealth: enemy.health
            });
        }
        
        console.log(`[DEBUG] applyLevelScaling开始: 坐标(${enemy.x}, ${enemy.y}), level=${enemy.level}, distanceFromSpawn=${enemy.distanceFromSpawn}`);
        
        console.log(`[DEBUG] 开始等级强化前: level=${enemy.level}, distanceFromSpawn=${enemy.distanceFromSpawn}`);
        
        if (!enemy.level || enemy.level < 1) {
            const warningMsg = `等级无效，跳过强化: level=${enemy.level}`;
            console.log(`[DEBUG] ${warningMsg}`);
            if (this.logger) {
                this.logger.logWarning(warningMsg, { enemy: enemy.type, level: enemy.level });
            }
            return;
        }
        
        // 获取等级强化buff（已在构造函数中激活）
        const buff = this.getBuff('levelEnhancement');
        if (!buff || !buff.isActive) {
            const errorMsg = 'levelEnhancement buff未激活！';
            console.error(`[ERROR] ${errorMsg}`);
            if (this.logger) {
                this.logger.logError(errorMsg, {
                    buffExists: !!buff,
                    buffActive: buff ? buff.isActive : false,
                    activeBuffs: Array.from(this.activeBuffs.keys())
                });
            }
            return;
        }
        
        if (this.logger) {
            this.logger.logBuffApplication('levelEnhancement buff状态检查通过', enemy.type, {
                buffId: buff.id,
                isActive: buff.isActive,
                effects: buff.effects
            });
        }
        
        console.log(`应用等级强化: 等级${enemy.level}, 原血量${enemy.health}`);
        
        const levelMultiplier = enemy.level;
        const effects = buff.effects;
        
        // 记录强化前的状态
        const beforeStats = {
            health: enemy.health,
            maxHealth: enemy.maxHealth,
            damage: enemy.damage,
            speed: enemy.speed,
            radius: enemy.radius,
            detectionRange: enemy.detectionRange,
            chaseRange: enemy.chaseRange
        };
        
        // 血量强化：指数增长，每级增加100%血量，更快增长
        const healthMultiplier = 1 + (levelMultiplier - 1) * 1.0; // 每级增加100%
        const originalHealth = enemy.health;
        enemy.health *= healthMultiplier;
        enemy.maxHealth = enemy.health;
        
        console.log(`血量强化: ${originalHealth} -> ${enemy.health} (倍数: ${healthMultiplier})`);
        
        // 在等级强化后应用距离血量加成
        this.applyDistanceHealthBonus(enemy);
        
        console.log(`[DEBUG] applyLevelScaling完成: level=${enemy.level}, distanceFromSpawn=${enemy.distanceFromSpawn}`);
        
        // 攻击力强化：每级增加5%攻击力（极平缓提升，避免秒杀玩家）
        const damageMultiplier = 1 + (levelMultiplier - 1) * 0.05; // 从0.3降到0.05
        enemy.damage *= damageMultiplier;
        
        // 移动速度强化：每级增加1%速度（极平缓提升）
        const speedMultiplier = 1 + (levelMultiplier - 1) * 0.01; // 从0.1降到0.01
        enemy.speed *= speedMultiplier;
        
        // 体积强化：每级增加15%体积（平缓提升）+ 随机性变化
        const baseSizeMultiplier = 1 + (levelMultiplier - 1) * 0.15;
        const randomSizeFactor = 0.7 + Math.random() * 0.6; // 0.7-1.3倍随机变化
        const sizeMultiplier = baseSizeMultiplier * randomSizeFactor;
        enemy.radius *= sizeMultiplier;
        
        // 检测和追击范围强化：每级增加25%范围（平缓提升）
        const rangeMultiplier = 1 + (levelMultiplier - 1) * 0.25;
        enemy.detectionRange *= rangeMultiplier;
        enemy.chaseRange *= rangeMultiplier;
        
        // 记录强化后的状态
        const afterStats = {
            health: enemy.health,
            maxHealth: enemy.maxHealth,
            damage: enemy.damage,
            speed: enemy.speed,
            radius: enemy.radius,
            detectionRange: enemy.detectionRange,
            chaseRange: enemy.chaseRange
        };
        
        if (this.logger) {
            this.logger.logEnemyLevelScaling(enemy, beforeStats, afterStats);
            this.logger.logBuffApplication('levelEnhancement应用完成', enemy.type, {
                level: enemy.level,
                healthMultiplier,
                damageMultiplier,
                speedMultiplier,
                sizeMultiplier,
                rangeMultiplier,
                beforeStats,
                afterStats
            });
        }
    }
    
    // 基于距离的血量加成：距离30000增加300血量，线性增长
    applyDistanceHealthBonus(enemy) {
        if (!enemy.x || !enemy.y) return;
        
        // 确保enemy有distanceFromSpawn属性，如果没有则计算
        if (!enemy.distanceFromSpawn) {
            enemy.distanceFromSpawn = Math.sqrt(enemy.x ** 2 + enemy.y ** 2);
        }
        
        // 确保enemy有level属性，如果没有则基于距离计算
        if (!enemy.level) {
            enemy.level = Math.max(1, Math.floor(enemy.distanceFromSpawn / 500) + 1);
        }
        
        // 每10000距离增加100血量，更频繁的距离加成
        const healthBonus = Math.floor(enemy.distanceFromSpawn / 10000) * 100;
        
        if (healthBonus > 0) {
            enemy.health += healthBonus;
            enemy.maxHealth = enemy.health;
        }
        
        console.log(`距离血量加成: 距离${enemy.distanceFromSpawn.toFixed(0)}px, 等级${enemy.level}, 血量加成${healthBonus}`);
    }
}

// 导出BuffSystem类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BuffSystem;
} else if (typeof window !== 'undefined') {
    window.BuffSystem = BuffSystem;
}