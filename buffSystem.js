// 球球大冒险 - Buff系统
// 版本: v3.9.0
// 功能: 管理玩家buff效果，包括三相之力等特殊能力

class BuffSystem {
    constructor(game) {
        this.game = game;
        this.activeBuffs = new Map(); // 存储激活的buff
        this.buffDefinitions = this.initBuffDefinitions();
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
            this.activateBuff('solarFlare');
            return true;
        }

        return false;
    }

    // 激活buff
    activateBuff(buffId) {
        const buffDef = this.buffDefinitions[buffId];
        if (!buffDef) return false;

        const buff = {
            ...buffDef,
            startTime: Date.now(),
            endTime: Date.now() + buffDef.duration
        };

        this.activeBuffs.set(buffId, buff);
        
        // 根据buff类型执行特殊初始化
        if (buffId === 'trinityForce') {
            this.initTrinityForce(buff);
        } else if (buffId === 'solarFlare') {
            this.initSolarFlare(buff);
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

    // 更新buff状态
    update(deltaTime) {
        const currentTime = Date.now();
        
        // 检查并移除过期的buff
        for (const [buffId, buff] of this.activeBuffs) {
            if (currentTime >= buff.endTime) {
                this.deactivateBuff(buffId);
            } else {
                this.updateBuff(buffId, buff, deltaTime);
            }
        }
    }

    // 更新单个buff
    updateBuff(buffId, buff, deltaTime) {
        if (buffId === 'trinityForce') {
            this.updateTrinityForce(buff, deltaTime);
        } else if (buffId === 'solarFlare') {
            this.updateSolarFlare(buff, deltaTime);
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
}

// 导出BuffSystem类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BuffSystem;
} else if (typeof window !== 'undefined') {
    window.BuffSystem = BuffSystem;
}