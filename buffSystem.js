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
            }
        };
    }

    // 检查是否获得buff（击杀敌人时调用）
    checkBuffDrop(enemyType) {
        const trinityForce = this.buffDefinitions.trinityForce;
        
        // 根据敌人类型调整掉落概率
        let dropChance = trinityForce.dropChance;
        if (enemyType === 'elite') {
            dropChance *= 3; // 精英怪3倍概率
        } else if (enemyType === 'boss') {
            dropChance *= 5; // Boss 5倍概率
        }

        if (Math.random() < dropChance) {
            this.activateBuff('trinityForce');
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