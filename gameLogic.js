// 球球大冒险 - 游戏核心逻辑模块
// 包含游戏规则、状态管理、碰撞检测、敌人AI、物理引擎等核心算法

// 怪物统计系统 - v3.8.0
const monsterStats = {
    // 总计数据
    totalSpawned: 0,
    totalKilled: 0,
    
    // 按类型分类的生成统计
    spawnedByType: {
        red: 0,
        blue: 0,
        white: 0,
        black: 0,
        largered: 0,
        rotating: 0,
        teleport: 0,
        snake: 0,
        yellow: 0,
        control: 0,
        elite: 0,
        // 精英怪物子类型
        graviton: 0,
        destroyer: 0,
        guardian: 0,
        vortex: 0
    },
    
    // 按类型分类的击杀统计
    killedByType: {
        red: 0,
        blue: 0,
        white: 0,
        black: 0,
        largered: 0,
        rotating: 0,
        teleport: 0,
        snake: 0,
        yellow: 0,
        control: 0,
        elite: 0,
        // 精英怪物子类型
        graviton: 0,
        destroyer: 0,
        guardian: 0,
        vortex: 0
    },
    
    // 精英怪物调试信息
    eliteSpawnAttempts: 0,
    eliteSpawnSuccess: 0,
    eliteSpawnFailReasons: {
        distance: 0,
        random: 0
    },
    
    // 重置统计数据
    reset: function() {
        this.totalSpawned = 0;
        this.totalKilled = 0;
        this.eliteSpawnAttempts = 0;
        this.eliteSpawnSuccess = 0;
        
        Object.keys(this.spawnedByType).forEach(type => {
            this.spawnedByType[type] = 0;
            this.killedByType[type] = 0;
        });
        
        Object.keys(this.eliteSpawnFailReasons).forEach(reason => {
            this.eliteSpawnFailReasons[reason] = 0;
        });
    }
};

// 导入输入处理模块中的动作控制函数
// 在浏览器环境中直接使用window对象上的函数
let inputHandler = {
    updatePlayer: window.updatePlayer,
    updateDash: window.updateDash,
    updateChargeJump: window.updateChargeJump,
    updateEnemies: window.updateEnemies
};

// 碰撞检测系统已在utils.js中定义，这里直接使用

// 敌人生成系统
function updateSpawnPoints() {
    // 清理远离玩家的生成点（防止内存泄漏）
    for (let i = game.spawnPoints.length - 1; i >= 0; i--) {
        const spawnPoint = game.spawnPoints[i];
        const distance = Math.sqrt(
            Math.pow(spawnPoint.x - game.player.x, 2) + 
            Math.pow(spawnPoint.y - game.player.y, 2)
        );
        
        // 移除距离玩家超过6000像素的生成点
        if (distance > 6000) {
            game.spawnPoints.splice(i, 1);
            continue;
        }
        
        // 更新区域冷却时间
        if (spawnPoint.areaCooldown > 0) {
            spawnPoint.areaCooldown--;
        }
        
        // 更新普通冷却时间
        if (spawnPoint.cooldownTimer > 0) {
            spawnPoint.cooldownTimer--;
        }
        
        // 检查区域是否过度刷怪（5秒内击杀超过15个怪物）
         const currentTime = Date.now();
         if (currentTime - spawnPoint.lastKillTime < 5000 && spawnPoint.killCount > 15) {
             if (spawnPoint.areaCooldown <= 0) {
                 spawnPoint.areaCooldown = 1800; // 30秒区域冷却
                 spawnPoint.killCount = 0;
                 spawnPoint.spawnRate = 0.1; // 降低生成速度
                 
                 // 显示区域冷却提示
                 const playerDistance = Math.sqrt(
                     Math.pow(spawnPoint.x - game.player.x, 2) + 
                     Math.pow(spawnPoint.y - game.player.y, 2)
                 );
                 if (playerDistance < 800) {
                     createFloatingText(spawnPoint.x, spawnPoint.y - 50, '区域冷却中...', '#FF6B6B', 180, 1.2);
                 }
             }
         }
        
        // 恢复生成速度
        if (spawnPoint.areaCooldown <= 0 && spawnPoint.spawnRate < 1.0) {
            spawnPoint.spawnRate = Math.min(1.0, spawnPoint.spawnRate + 0.01);
        }
        
        // 只处理玩家1200像素范围内的生成点
        if (distance > 1200) continue;
        
        // 检查激活条件（区域冷却时不激活）
        const isInRange = distance < config.spawnPoints.activationRange;
        const canSpawn = spawnPoint.cooldownTimer <= 0 && spawnPoint.areaCooldown <= 0;
        
        if (isInRange && canSpawn) {
            // 检查当前敌人数量
            const currentEnemies = game.enemies.filter(enemy => {
                if (!enemy || enemy.x === undefined || enemy.y === undefined) {
                    return false;
                }
                const dx = enemy.x - spawnPoint.x;
                const dy = enemy.y - spawnPoint.y;
                return Math.sqrt(dx * dx + dy * dy) < 300;
            }).length;
            
            const maxEnemies = spawnPoint.density === 'high' ? 6 : 3;
            
            if (currentEnemies < maxEnemies) {
                // 计算生成概率（考虑区域生成速度）
                const playerSpeed = Math.sqrt(game.player.dx * game.player.dx + game.player.dy * game.player.dy);
                const baseChance = 0.4 * spawnPoint.spawnRate;
                const speedBonus = Math.min(0.3, playerSpeed * 0.05);
                const spawnChance = baseChance + speedBonus;
                
                if (Math.random() < spawnChance) {
                    spawnEnemyAtPoint(spawnPoint);
                    spawnPoint.spawnCount++;
                    
                    // 冷却机制改进：附近敌人少于4个时立即重置
                    if (currentEnemies < 4) {
                        spawnPoint.cooldownTimer = 30; // 0.5秒冷却
                    } else {
                        spawnPoint.cooldownTimer = 120; // 2秒冷却
                    }
                }
            }
            
            // 持续激活模式
            if (config.spawnPoints.persistentActivation && spawnPoint.spawnCount >= 10) {
                spawnPoint.cooldownTimer = 60; // 1秒后重新激活
                spawnPoint.spawnCount = 0;
            }
        }
    }
}

// 在生成点创建敌人
function spawnEnemyAtPoint(spawnPoint) {
    const x = spawnPoint.x + randomBetween(-50, 50);
    const y = spawnPoint.y + randomBetween(-50, 50);
    
    // 检查是否在安全区内，如果在安全区内则不生成怪物
    if (window.safeZoneSystem && window.safeZoneSystem.isInSafeZone(x, y)) {
        return; // 安全区内不生成怪物
    }
    
    // 检查是否生成精英怪物
    const distanceToPlayer = Math.sqrt(
        Math.pow(x - game.player.x, 2) + 
        Math.pow(y - game.player.y, 2)
    );
    
    let enemyType;
    if (distanceToPlayer >= config.enemies.eliteMinDistance && 
        distanceToPlayer <= config.enemies.eliteMaxDistance && 
        Math.random() < config.enemies.eliteSpawnChance) {
        enemyType = 'elite';
    } else {
        // 普通敌人类型
        const normalTypes = ['red', 'blue', 'white', 'black', 'largered', 'rotating', 'teleport', 'snake', 'yellow', 'control'];
        enemyType = normalTypes[Math.floor(Math.random() * normalTypes.length)];
    }
    
    createEnemy(x, y, enemyType);
}

// 创建敌人
function createEnemy(x, y, type) {
    try {
        // v3.9.6: 计算距离和等级
        const distanceFromSpawn = Math.sqrt(x * x + y * y);
        const level = Math.max(1, Math.floor(distanceFromSpawn / 1000));
        
        // v3.9.6: 体积和速度变异
        const isLarge = Math.random() < 0.15; // 15%概率超大个体
        const isFast = Math.random() < 0.1;   // 10%概率高速个体
        
        // 基础速度
        const baseSpeed = getEnemyBaseSpeed(type);
        
        // 创建敌人对象
        const enemy = {
            x: x,
            y: y,
            dx: 0,
            dy: 0,
            radius: isLarge ? 35 : 20,
            health: isLarge ? 40 : 20,
            maxHealth: isLarge ? 40 : 20,
            type: type,
            speed: isFast ? baseSpeed * 1.8 : baseSpeed,
            damage: 10,
            stunned: 0,
            attackCooldown: 0,
            state: 'idle', // idle, chase, flee, return
            detectionRange: 350,
            chaseRange: 1000,
            level: level,
            distanceFromSpawn: distanceFromSpawn,
            // v3.9.6: 变异标记
            isLarge: isLarge,
            isFast: isFast,
            // v4.1.7: 原始位置记录和回归机制
            originalX: x,
            originalY: y,
            returnSpeed: 0.8, // 回归速度稍慢于追击速度
            returnThreshold: 300 // 距离原位置超过此值时开始回归
        };
        
        // v3.9.6: 先应用等级缩放和buff，再调整类型属性
        if (game.buffSystem && game.buffSystem.applyLevelScaling) {
            game.buffSystem.applyLevelScaling(enemy);
        }
        
        // 根据类型调整属性（保持血量强化效果）
        switch(type) {
            case 'red':
                // red类型保持基础属性，不做额外调整
                break;
            case 'largered':
                enemy.radius = 40;
                // 在原有血量基础上乘以4倍（80/20=4）
                enemy.health *= 4;
                enemy.maxHealth *= 4;  // 同步更新maxHealth，保持强化效果
                enemy.speed = baseSpeed * 0.7;
                break;
            case 'rotating':
                enemy.rotationAngle = 0;
                enemy.rotationSpeed = 0.05;
                enemy.moveDirection = Math.random() * Math.PI * 2;
                // v3.9.6: 创建伴随球体
                enemy.companion = {
                    x: enemy.x + 50,
                    y: enemy.y,
                    radius: 8
                };
                break;
            case 'teleport':
                enemy.teleportCooldown = 0;
                enemy.teleportRange = 200;
                break;
            case 'snake':
                enemy.segments = [];
                enemy.segmentCount = 3;
                break;
            case 'yellow':
                enemy.radius = 15;
                // 在原有血量基础上乘以0.75倍（15/20=0.75）
                enemy.health *= 0.75;
                enemy.maxHealth *= 0.75;  // 同步更新maxHealth，保持强化效果
                enemy.speed = baseSpeed * 1.5;
                break;
            case 'blue':
                // blue类型保持基础属性，不做额外调整
                break;
            case 'white':
                // white类型保持基础属性，不做额外调整
                break;
            case 'black':
                enemy.radius *= 1.5;
                enemy.health *= 2;
                enemy.maxHealth = enemy.health;
                break;
            case 'control':
                // control类型保持基础属性，不做额外调整
                break;
            case 'elite':
                // elite类型需要应用特殊属性
                applyEnemyTypeProperties(enemy);
                break;
        }
        
        // 添加到游戏中
        game.enemies.push(enemy);
        
        // 更新怪物统计
        if (game.monsterStats) {
            game.monsterStats.totalSpawned++;
            if (!game.monsterStats.byType[type]) {
                game.monsterStats.byType[type] = 0;
            }
            game.monsterStats.byType[type]++;
        }
        
        return enemy;
        
    } catch (error) {
        console.error(`[ERROR] createEnemy失败:`, error);
        return null;
    }
}

// 获取敌人基础速度
function getEnemyBaseSpeed(type) {
    // v3.7.1: 增强怪物基础速度
    switch(type) {
        case 'black': return 3.5;  // 从2.5提升到3.5
        case 'white': return 5.5;  // 从4.5提升到5.5
        default: return 4.5;      // 从3.5提升到4.5
    }
}

// 应用敌人类型属性
function applyEnemyTypeProperties(enemy) {
    switch(enemy.type) {
        case 'red':
            enemy.radius *= 1.2; // 半径+20%
            enemy.health *= 1.5; // 血量+50%
            enemy.maxHealth = enemy.health;
            enemy.speed *= 1.1; // 速度+10%
            break;
        case 'blue':
            enemy.radius *= 0.9; // 半径-10%
            break;
        case 'black':
            enemy.radius *= 1.5;
            enemy.health *= 2;
            enemy.maxHealth = enemy.health;
            break;
        case 'largered':
            enemy.radius *= 2.5;
            enemy.health *= 4;
            enemy.maxHealth = enemy.health;
            enemy.speed *= 0.8;
            enemy.moveDirection = 1;
            enemy.scatterCooldown = 0;
            enemy.scatterInterval = 120;
            break;
        case 'rotating':
            enemy.radius *= 1.3;
            enemy.health *= 3;
            enemy.maxHealth = enemy.health;
            enemy.speed *= 1.2;
            enemy.rotationAngle = 0;
            enemy.rotationSpeed = 0.05;
            enemy.orbitRadius = 60;
            enemy.companion = {
                x: enemy.x + enemy.orbitRadius,
                y: enemy.y,
                radius: enemy.radius * 0.8
            };
            break;
        case 'teleport':
            enemy.radius *= 1.1;
            enemy.health *= 2.5;
            enemy.maxHealth = enemy.health;
            enemy.speed *= 1.3;
            enemy.teleportCooldown = 0;
            enemy.teleportInterval = 120; // 缩短传送间隔，增强威胁性
            enemy.teleportRange = 500; // 增加传送范围
            enemy.isCharging = false;
            enemy.chargeTime = 0;
            enemy.maxChargeTime = 45; // 缩短蓄力时间
            break;
        case 'snake':
            enemy.radius *= 0.9;
            enemy.health *= 2.5;
            enemy.maxHealth = enemy.health;
            enemy.speed *= 0.7;
            enemy.segments = [];
            enemy.segmentCount = 4 + Math.floor(Math.random() * 3);
            enemy.segmentDistance = enemy.radius * 2.5;
            enemy.segmentSpacing = enemy.radius * 2.0; // 节点间距
            
            for (let i = 0; i < enemy.segmentCount; i++) {
                enemy.segments.push({
                    x: enemy.x - (i + 1) * enemy.segmentDistance,
                    y: enemy.y,
                    radius: enemy.radius * (0.9 - i * 0.1),
                    health: enemy.health * 0.3,
                    prevX: enemy.x - (i + 1) * enemy.segmentDistance,
                    prevY: enemy.y
                });
            }
            break;
        case 'yellow':
            enemy.radius *= 1.0;
            enemy.health *= 1.8;
            enemy.maxHealth = enemy.health;
            enemy.speed *= 1.0;
            enemy.baseRadius = enemy.radius;
            enemy.baseSpeed = enemy.speed;
            enemy.baseDamage = 6;
            enemy.damage = enemy.baseDamage;
            enemy.minRadius = enemy.radius * 0.5;
            enemy.maxRadius = enemy.radius * 2.5;
            enemy.sizeChangeSpeed = 0.02;
            enemy.isGrowing = true;
            enemy.sizePhase = 0;
            break;
        case 'control':
            enemy.radius *= 1.1;
            enemy.health *= 2.0;
            enemy.maxHealth = enemy.health;
            enemy.speed *= 0.8;
            enemy.controlRingRadius = 120;
            enemy.controlRingMaxRadius = 150;
            enemy.controlRingMinRadius = 80;
            enemy.controlRingPulse = 0;
            enemy.controlRingPulseSpeed = 0.05;
            enemy.slowEffect = 0.3;
            enemy.controlCooldown = 0;
            enemy.controlInterval = 180;
            break;
        case 'elite':
            // 精英怪物基础属性
            enemy.radius *= 2.0;
            enemy.health *= 8;
            enemy.maxHealth = enemy.health;
            enemy.speed *= 0.6;
            enemy.damage = 25;
            enemy.bigBulletCooldown = 0;
            enemy.bigBulletInterval = 240;
            enemy.orbs = [];
            
            // 随机选择精英怪物子类型
            const eliteVariants = ['graviton', 'destroyer', 'guardian', 'vortex'];
            enemy.eliteType = eliteVariants[Math.floor(Math.random() * eliteVariants.length)];
            
            // 根据子类型设置特殊属性
            switch(enemy.eliteType) {
                case 'graviton': // 引力型
                    enemy.gravityFieldRadius = 350;
                    enemy.gravityStrength = 1.2;
                    enemy.orbCount = 4;
                    break;
                case 'destroyer': // 破坏型
                    enemy.gravityFieldRadius = 250;
                    enemy.gravityStrength = 0.8;
                    enemy.damage *= 1.5;
                    enemy.bigBulletInterval = 180;
                    enemy.orbCount = 6;
                    break;
                case 'guardian': // 防御型
                    enemy.gravityFieldRadius = 300;
                    enemy.gravityStrength = 1.0;
                    enemy.health *= 1.5;
                    enemy.maxHealth = enemy.health;
                    enemy.orbCount = 3;
                    break;
                case 'vortex': // 漩涡型
                    enemy.gravityFieldRadius = 400;
                    enemy.gravityStrength = 1.5;
                    enemy.speed *= 1.3;
                    enemy.orbCount = 5;
                    break;
            }
            
            // 创建环绕球
            for (let i = 0; i < enemy.orbCount; i++) {
                const angle = (i / enemy.orbCount) * Math.PI * 2;
                const orbRadius = enemy.radius * 0.4;
                const orbitDistance = enemy.radius + 40;
                enemy.orbs.push({
                    angle: angle,
                    radius: orbRadius,
                    orbitDistance: orbitDistance,
                    health: enemy.health * 0.2,
                    maxHealth: enemy.health * 0.2
                });
            }
            break;
    }
}

// 等级强化功能已移至BuffSystem.applyLevelScaling()

// 注意：玩家更新函数已在inputHandler.js中定义，这里不重复定义以避免冲突

// 游戏主循环更新函数
function update() {
    // 更新玩家 - 使用window上的统一动作控制
    if (window.updatePlayer) {
        window.updatePlayer();
    } else {
        updatePlayer(); // 回退到本地函数
    }
    
    // 更新冲刺状态
    if (window.updateDash) {
        window.updateDash();
    }
    
    // 更新蓄力跳跃
    if (window.updateChargeJump) {
        window.updateChargeJump();
    }
    
    // 更新相机
    updateCamera();
    
    // 根据性能模式调整更新频率
    const performanceMultiplier = {
        'low': 0.5,
        'medium': 1.0,
        'high': 1.5
    }[game.performanceMode];
    
    // 检查并生成下方平台
    generatePlatformBelowPlayer();
    
    // 清理远离玩家的地图元素
    if (game.frameCount % Math.max(1, Math.floor(30 / performanceMultiplier)) === 0) {
        cleanupDistantMapElements();
    }
    
    // 更新怪物生成点
    updateSpawnPoints();
    
    // 动态生成新的生成点
    generateNewSpawnPoints();
    
    // 强制怪物密度控制
    enforceMonsterDensity();
    
    // 区域怪物上限控制 - v3.9.18
    enforceAreaMonsterLimits();
    
    // 更新狂潮模式
    updateFrenzyMode();
    
    // 更新安全区系统
    if (window.safeZoneSystem) {
        window.safeZoneSystem.update(game.player.x, game.player.y);
    }
    
    // 动态敌人生成
    updateEnemySpawning(performanceMultiplier);
    
    // 更新带刺球球生成
    updateSpikedBallSpawning();
    
    // 资源恢复系统
    updateResourceRecovery();
    
    // 技能冷却管理
    updateSkillCooldowns();
    
    // 更新游戏对象 - 使用inputHandler中的敌人更新逻辑
    updateGameObjectsWithInputHandler();
    
    // 更新buff系统
    if (game.buffSystem && game.buffSystem.update) {
        game.buffSystem.update();
    }
    
    // 检查玩家升级
    checkLevelUp();
}

// 动态敌人生成
function updateEnemySpawning(performanceMultiplier) {
    game.spawnTimer += game.deltaTime;
    const playerSpeed = Math.sqrt(game.player.dx * game.player.dx + game.player.dy * game.player.dy);
    const speedMultiplier = Math.max(0.5, Math.min(2.0, playerSpeed / 5));
    const dynamicSpawnRate = config.enemies.spawnRate * speedMultiplier * performanceMultiplier;
    
    const spawnInterval = game.performanceMode === 'high' ? 0.3 : 
                         game.performanceMode === 'medium' ? 0.5 : 0.8;
    
    if (game.spawnTimer >= spawnInterval) {
        // 性能模式分级处理
        let spawnProbability, maxEnemies;
        switch(game.performanceMode) {
            case 'low':
                spawnProbability = 0.3;
                maxEnemies = 15;
                break;
            case 'medium':
                spawnProbability = 0.5;
                maxEnemies = 25;
                break;
            case 'high':
                spawnProbability = 0.7;
                maxEnemies = 40;
                break;
        }
        
        if (game.enemies.length < maxEnemies && Math.random() < spawnProbability) {
            // 狂潮模式特殊逻辑
            if (game.frenzyMode.active) {
                if (Math.random() < 0.6) {
                    // 60%概率双生
                    spawnEnemyNearPlayer();
                    spawnEnemyNearPlayer();
                } else if (Math.random() < 0.3) {
                    // 30%概率三生
                    spawnEnemyNearPlayer();
                    spawnEnemyNearPlayer();
                    spawnEnemyNearPlayer();
                } else {
                    spawnEnemyNearPlayer();
                }
            } else {
                spawnEnemyNearPlayer();
            }
        }
        
        game.spawnTimer = 0;
    }
}

// 在玩家附近生成敌人
function spawnEnemyNearPlayer() {
    const angle = Math.random() * Math.PI * 2;
    // 扩大生成距离范围以适应精英怪物的距离要求
    const distance = randomBetween(400, 1600);
    const x = game.player.x + Math.cos(angle) * distance;
    const y = game.player.y + Math.sin(angle) * distance;
    
    // 检查是否在安全区内，如果在安全区内则不生成怪物
    if (window.safeZoneSystem && window.safeZoneSystem.isInSafeZone(x, y)) {
        return; // 安全区内不生成怪物
    }
    
    // 检查是否生成精英怪物（使用正确的概率）
    const distanceToPlayer = Math.sqrt(
        Math.pow(x - game.player.x, 2) + 
        Math.pow(y - game.player.y, 2)
    );
    
    let enemyType;
    const eliteRoll = Math.random();
    
    // 记录精英怪物生成尝试
    if (eliteRoll < config.enemies.eliteSpawnChance) {
        monsterStats.eliteSpawnAttempts++;
        
        // 检查距离限制
        if (distanceToPlayer >= config.enemies.eliteMinDistance && 
            distanceToPlayer <= config.enemies.eliteMaxDistance) {
            enemyType = 'elite';
            monsterStats.eliteSpawnSuccess++;
        } else {
            // 距离不合适，生成普通怪物
            monsterStats.eliteSpawnFailReasons.distance++;
            const normalTypes = ['red', 'blue', 'white', 'black', 'largered', 'rotating', 'teleport', 'snake', 'yellow', 'control'];
            enemyType = normalTypes[Math.floor(Math.random() * normalTypes.length)];
        }
    } else {
         // 生成普通怪物（随机概率未命中精英怪物，这是正常情况，不计入失败）
         const normalTypes = ['red', 'blue', 'white', 'black', 'largered', 'rotating', 'teleport', 'snake', 'yellow', 'control'];
         enemyType = normalTypes[Math.floor(Math.random() * normalTypes.length)];
     }
    
    createEnemy(x, y, enemyType);
}

// 更新带刺球球生成
function updateSpikedBallSpawning() {
    // 根据性能模式设置生成概率和数量限制
    let spawnChance, maxSpikedBalls;
    switch(game.performanceMode) {
        case 'low':
            spawnChance = 0.005; // 0.5%
            maxSpikedBalls = 5;
            break;
        case 'medium':
            spawnChance = 0.01; // 1%
            maxSpikedBalls = 10;
            break;
        case 'high':
            spawnChance = 0.015; // 1.5%
            maxSpikedBalls = 15;
            break;
    }
    
    if (game.spikedBalls.length < maxSpikedBalls && Math.random() < spawnChance) {
        const angle = Math.random() * Math.PI * 2;
        const distance = randomBetween(300, 600);
        const x = game.player.x + Math.cos(angle) * distance;
        const y = game.player.y + Math.sin(angle) * distance;
        
        game.spikedBalls.push({
            x: x,
            y: y,
            dx: randomBetween(-2, 2),
            dy: randomBetween(-2, 2),
            radius: randomBetween(15, 25),
            damage: randomBetween(15, 25),
            rotationAngle: 0,
            rotationSpeed: randomBetween(0.05, 0.15)
        });
    }
}

// 资源恢复系统
function updateResourceRecovery() {
    // 精力值恢复
    if (game.player.stamina < game.player.maxStamina) {
        game.player.stamina += config.player.staminaRecovery;
        if (game.player.stamina > game.player.maxStamina) {
            game.player.stamina = game.player.maxStamina;
        }
    }
    
    // 魔法值恢复
    if (game.player.mana < game.player.maxMana) {
        game.player.mana += 0.3; // 固定恢复速率
        if (game.player.mana > game.player.maxMana) {
            game.player.mana = game.player.maxMana;
        }
    }
    
    // 怒气值恢复（缓慢恢复）
    if (game.player.rage < game.player.maxRage) {
        game.player.rage += 0.1; // 缓慢恢复速率
        if (game.player.rage > game.player.maxRage) {
            game.player.rage = game.player.maxRage;
        }
    }
    
    // 更新被击中后的怒气加成时间
    if (game.player.lastHitTime > 0) {
        game.player.lastHitTime -= game.deltaTime;
        if (game.player.lastHitTime <= 0) {
            game.player.hitRageMultiplier = 1.0; // 重置怒气倍率
        }
    }
}

// 技能冷却管理
function updateSkillCooldowns() {
    // AOE攻击冷却
    if (game.player.aoeAttackCooldown > 0) {
        game.player.aoeAttackCooldown -= game.deltaTime;
    }
    
    // 激光技能冷却
    if (game.player.laser.cooldownTimer > 0) {
        game.player.laser.cooldownTimer -= game.deltaTime;
    }
    
    // 风火轮技能冷却
    if (game.player.windFireWheels.cooldownTimer > 0) {
        game.player.windFireWheels.cooldownTimer -= game.deltaTime;
    }
}

// 更新伤害数值显示
function updateDamageNumbers() {
    for (let i = game.damageNumbers.length - 1; i >= 0; i--) {
        const damageNum = game.damageNumbers[i];
        
        // 更新位置
        damageNum.y += damageNum.dy;
        damageNum.dy *= 0.98; // 减速效果
        
        // 更新透明度
        damageNum.lifetime--;
        damageNum.alpha = damageNum.lifetime / 60;
        
        // 移除过期的数值
        if (damageNum.lifetime <= 0) {
            game.damageNumbers.splice(i, 1);
        }
    }
}

// 更新经验值数值显示
function updateExperienceNumbers() {
    for (let i = game.experienceNumbers.length - 1; i >= 0; i--) {
        const expNum = game.experienceNumbers[i];
        
        // 更新位置
        expNum.y += expNum.dy;
        expNum.dy *= 0.98; // 减速效果
        
        // 更新透明度
        expNum.lifetime--;
        expNum.alpha = expNum.lifetime / 60;
        
        // 移除过期的数值
        if (expNum.lifetime <= 0) {
            game.experienceNumbers.splice(i, 1);
        }
    }
}

// 更新浮动文本显示
function updateFloatingTexts() {
    for (let i = game.floatingTexts.length - 1; i >= 0; i--) {
        const floatingText = game.floatingTexts[i];
        
        // 更新位置
        floatingText.y += floatingText.dy;
        floatingText.dy *= 0.98; // 减速效果
        
        // 更新透明度
        floatingText.lifetime--;
        floatingText.alpha = floatingText.lifetime / 60;
        
        // 移除过期的文本
        if (floatingText.lifetime <= 0) {
            game.floatingTexts.splice(i, 1);
        }
    }
}

// 更新暴击显示
function updateCriticalDisplays() {
    for (let i = game.criticalDisplays.length - 1; i >= 0; i--) {
        const critical = game.criticalDisplays[i];
        
        // 更新生命周期
        critical.lifetime--;
        
        // 缩放动画
        if (critical.lifetime > 60) {
            critical.scale = Math.min(1.5, critical.scale + 0.05);
        } else {
            critical.scale = Math.max(0.5, critical.scale - 0.02);
        }
        
        // 更新字体大小 (基于缩放)
        critical.size = 200 * critical.scale;
        
        // 透明度动画
        critical.alpha = critical.lifetime / 90;
        
        // 颜色渐变效果
        const colorIntensity = critical.alpha;
        critical.color = `rgba(255, ${Math.floor(215 * colorIntensity)}, 0, ${critical.alpha})`;
        
        // 移除过期的显示
        if (critical.lifetime <= 0) {
            game.criticalDisplays.splice(i, 1);
        }
    }
}

// 更新AOE圈圈效果
function updateAOERings() {
    for (let i = game.aoeRings.length - 1; i >= 0; i--) {
        const ring = game.aoeRings[i];
        
        // 更新生命周期
        ring.lifetime--;
        
        // 扩展半径
        ring.radius += ring.expansionSpeed;
        
        // 透明度衰减
        ring.alpha = ring.lifetime / ring.maxLifetime;
        
        // 移除过期的圈圈
        if (ring.lifetime <= 0) {
            game.aoeRings.splice(i, 1);
        }
    }
}

// 更新游戏对象
function updateGameObjects() {
    // 更新敌人
    updateEnemies();
    
    // 更新投射物
    updateProjectiles();
    
    // 更新友方球球
    updateFriendlyBalls();
    
    // 更新带刺球球
    updateSpikedBalls();
    
    // 更新泡泡道具
    updateBubblePowerups();
    
    // 更新粒子效果
    updateParticles();
    
    // 更新伤害数值显示
    updateDamageNumbers();
    
    // 更新经验值数值显示
    updateExperienceNumbers();
    
    // 更新暴击显示
    updateCriticalDisplays();
    
    // 更新浮动文本
    updateFloatingTexts();
    
    // 更新AOE圈圈
    updateAOERings();
    
    // 更新风火轮技能
    updateWindFireWheels();
    
    // 更新激光技能
    updateLaser();
}

// 使用inputHandler中的敌人更新逻辑的游戏对象更新函数
function updateGameObjectsWithInputHandler() {
    // 更新敌人 - 使用window上的统一敌人AI
    if (window.updateEnemies) {
        window.updateEnemies();
    } else {
        updateEnemies(); // 回退到本地函数
    }
    
    // 更新投射物
    updateProjectiles();
    
    // 更新友方球球
    updateFriendlyBalls();
    
    // 更新带刺球球
    updateSpikedBalls();
    
    // 更新泡泡道具
    updateBubblePowerups();
    
    // 更新粒子效果
    updateParticles();
    
    // 更新伤害数值显示
    updateDamageNumbers();
    
    // 更新经验值数值显示
    updateExperienceNumbers();
    
    // 更新暴击显示
    updateCriticalDisplays();
    
    // 更新浮动文本
    updateFloatingTexts();
    
    // 更新AOE圈圈
    updateAOERings();
    
    // 更新风火轮技能
    updateWindFireWheels();
    
    // 更新激光技能
    updateLaser();
}

// 平台碰撞处理
function handlePlatformCollision(player, platform) {
    // 检测碰撞方向
    const playerCenterX = player.x;
    const playerCenterY = player.y;
    const platformCenterX = platform.x + platform.width / 2;
    const platformCenterY = platform.y + platform.height / 2;
    
    const dx = playerCenterX - platformCenterX;
    const dy = playerCenterY - platformCenterY;
    
    const overlapX = (player.radius + platform.width / 2) - Math.abs(dx);
    const overlapY = (player.radius + platform.height / 2) - Math.abs(dy);
    
    if (overlapX > 0 && overlapY > 0) {
        // 确定碰撞方向
        if (overlapX < overlapY) {
            // 水平碰撞
            if (dx > 0) {
                player.x = platform.x + platform.width + player.radius;
            } else {
                player.x = platform.x - player.radius;
            }
            player.dx = 0;
        } else {
            // 垂直碰撞
            if (dy > 0) {
                // v3.7.2: 完全跳跃穿透 - 玩家从下方向上时完全无视平台
                if (player.dy < 0) { // 任何向上速度都允许穿透
                    return false; // 不处理碰撞，完全穿透
                }
                player.y = platform.y + platform.height + player.radius;
                player.dy = Math.max(0, player.dy);
            } else {
                // 只有从上方落下时才会站在平台上
                if (player.dy > 0) { // 向下落时才碰撞
                    player.y = platform.y - player.radius;
                    player.dy = 0;
                    player.isJumping = false;
                    player.jumpCount = 0;
                    return true; // 在平台上
                }
            }
        }
    }
    
    return false;
}

// 通用碰撞检测
function checkCollision(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (obj1.radius + obj2.radius);
}

// 创建爆炸效果
function createExplosion(x, y, radius, damage) {
    // 对范围内的敌人造成伤害
    for (const enemy of game.enemies) {
        const dx = enemy.x - x;
        const dy = enemy.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < radius) {
            enemy.health -= damage;
            
            // 记录爆炸伤害
            if (window.damageTracker) {
                window.damageTracker.recordDamage({
                    damage: damage,
                    monsterType: enemy.type,
                    damageSource: 'explosion',
                    isCritical: false,
                    x: enemy.x,
                    y: enemy.y
                });
            }
            
            // 添加简单伤害显示
            if (window.simpleDamageDisplay) {
                window.simpleDamageDisplay.addDamageText(damage, enemy.x, enemy.y, false);
            }
            
            // 击退效果
            const knockback = 15;
            const angle = Math.atan2(dy, dx);
            enemy.x += Math.cos(angle) * knockback;
            enemy.y += Math.sin(angle) * knockback;
            
            // 添加爆炸粒子
            for (let i = 0; i < 10; i++) {
                game.particles.push({
                    x: enemy.x,
                    y: enemy.y,
                    dx: randomBetween(-5, 5),
                    dy: randomBetween(-5, 5),
                    radius: randomBetween(2, 5),
                    color: '#FF4444',
                    lifetime: 30
                });
            }
        }
    }
}

// 开始冲刺
function startDash(direction) {
    game.player.isDashing = true;
    game.player.dashTime = config.player.dashDuration;
    game.player.dx = direction * config.player.dashSpeed;
    game.player.stamina -= 20;
    
    // 冲刺粒子效果
    for (let i = 0; i < 15; i++) {
        game.particles.push({
            x: game.player.x,
            y: game.player.y,
            dx: -direction * randomBetween(1, 3),
            dy: randomBetween(-1, 1),
            radius: randomBetween(2, 4),
            color: '#FFFFFF',
            lifetime: 20
        });
    }
}

// 开始垂直冲刺
function startVerticalDash(direction) {
    if (game.player.stamina >= 20) {
        game.player.isDashing = true;
        game.player.dashTime = config.player.dashDuration;
        game.player.dy = direction * config.player.dashSpeed;
        game.player.stamina -= 20;
        
        // 如果向上冲刺，重置跳跃状态
        if (direction < 0) {
            game.player.isJumping = false;
            game.player.jumpCount = 0;
        }
        
        // 垂直冲刺粒子效果
        for (let i = 0; i < 15; i++) {
            game.particles.push({
                x: game.player.x,
                y: game.player.y,
                dx: randomBetween(-1, 1),
                dy: -direction * randomBetween(1, 3),
                radius: randomBetween(2, 4),
                color: '#FFFFFF',
                lifetime: 20
            });
        }
    }
}

// 创建伤害数值显示
function createDamageNumber(x, y, damage, isCritical = false) {
    const damageNumber = ObjectPool.getDamageNumber();
    damageNumber.x = x + randomBetween(-20, 20);
    damageNumber.y = y - 10;
    damageNumber.damage = Math.floor(damage); // 确保伤害值为整数
    damageNumber.isCritical = isCritical;
    damageNumber.lifetime = 60;
    damageNumber.dy = -2;
    damageNumber.alpha = 1.0;
    damageNumber.active = true;
    game.damageNumbers.push(damageNumber);
}

// 创建暴击显示
function createCriticalDisplay(damage) {
    const criticalDisplay = {
        damage: damage,
        lifetime: 90,
        scale: 0.5,
        alpha: 1.0,
        active: true,
        size: 120, // 字体大小放大3倍 (原来40px)
        text: '暴击!',
        color: 'linear-gradient(45deg, #FFD700, #FF4500)',
        x: game.gameWidth / 2,
        y: game.gameHeight / 2
    };
    game.criticalDisplays.push(criticalDisplay);
}

// 创建经验数值显示
function createExperienceNumber(x, y, exp) {
    const expNumber = ObjectPool.getExperienceNumber();
    expNumber.x = x + randomBetween(-15, 15);
    expNumber.y = y - 5;
    expNumber.exp = Math.floor(exp); // 确保经验值为整数
    expNumber.lifetime = 45;
    expNumber.dy = -1.5;
    expNumber.alpha = 1.0;
    expNumber.active = true;
    game.experienceNumbers.push(expNumber);
}

// 随机数生成辅助函数
function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

// 激活风火轮技能
function activateWindFireWheels() {
    if (game.player.rage < game.player.windFireWheels.rageCost || game.player.windFireWheels.cooldownTimer > 0) return;
    
    game.player.windFireWheels.active = true;
    game.player.windFireWheels.duration = game.player.windFireWheels.maxDuration;
    game.player.windFireWheels.cooldownTimer = game.player.windFireWheels.cooldown;
    game.player.windFireWheels.rotation = 0; // 初始化旋转角度
    game.player.rage -= game.player.windFireWheels.rageCost;
    
    // 风火轮激活时立即解除所有控制状态
    game.player.immobilized = false;
    game.player.immobilizeTimer = 0;
    game.player.isSlowed = false;
    game.player.slowedTime = 0;
    
    // 风火轮激活粒子效果
    for (let i = 0; i < 30; i++) {
        game.particles.push({
            x: game.player.x + (Math.random() - 0.5) * 60,
            y: game.player.y + (Math.random() - 0.5) * 60,
            dx: (Math.random() - 0.5) * 15,
            dy: (Math.random() - 0.5) * 15,
            radius: Math.random() * 8 + 4,
            color: `hsl(${Math.random() * 60 + 15}, 100%, 70%)`,
            lifetime: 50
        });
    }
}

// 更新风火轮技能
function updateWindFireWheels() {
    if (!game.player.windFireWheels.active) return;
    
    // 减少持续时间
    game.player.windFireWheels.duration -= game.deltaTime;
    
    // 如果持续时间结束或怒气值为0，停用技能
    if (game.player.windFireWheels.duration <= 0 || game.player.rage <= 0) {
        game.player.windFireWheels.active = false;
        game.player.windFireWheels.orbs = [];
        return;
    }
    
    // 持续消耗怒气
    game.player.rage -= 0.2;
    if (game.player.rage < 0) game.player.rage = 0;
    
    // 更新旋转角度
    game.player.windFireWheels.rotation += game.player.windFireWheels.rotationSpeed;
    
    // 检查是否有三相之力buff
    const hasTrinityForce = game.buffSystem && game.buffSystem.isBuffActive('trinityForce');
    
    // 根据buff状态决定风火轮数量和排列
    const wheelCount = hasTrinityForce ? 3 : 4;
    const angleStep = hasTrinityForce ? (Math.PI * 2 / 3) : (Math.PI / 2); // 三角形或正方形
    
    // 检测与敌人的碰撞
    for (let i = 0; i < wheelCount; i++) {
        const angle = game.player.windFireWheels.rotation + (i * angleStep);
        const orbX = game.player.x + Math.cos(angle) * game.player.windFireWheels.radius;
        const orbY = game.player.y + Math.sin(angle) * game.player.windFireWheels.radius;
        
        // 检测与敌人的碰撞
        for (let j = game.enemies.length - 1; j >= 0; j--) {
            const enemy = game.enemies[j];
            const dx = orbX - enemy.x;
            const dy = orbY - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < game.player.windFireWheels.orbSize + enemy.radius) {
                // 对敌人造成伤害（加上基础伤害增加值）
                const windFireDamage = game.player.windFireWheels.damage + (window.attributeSystem ? window.attributeSystem.getAttribute('baseDamage') : 0);
                enemy.health -= windFireDamage;
                
                // 记录风火轮伤害
                if (window.damageTracker) {
                    window.damageTracker.recordDamage({
                        damage: windFireDamage,
                        monsterType: enemy.type,
                        damageSource: 'windFireWheels',
                        isCritical: false,
                        x: enemy.x,
                        y: enemy.y
                    });
                }
                
                // 添加简单伤害显示
                if (window.simpleDamageDisplay) {
                    window.simpleDamageDisplay.addDamageText(windFireDamage, enemy.x, enemy.y, false);
                }
                
                // 击退效果
                const knockbackForce = 10;
                const knockbackAngle = Math.atan2(dy, dx);
                enemy.dx += Math.cos(knockbackAngle) * knockbackForce;
                enemy.dy += Math.sin(knockbackAngle) * knockbackForce;
                
                // 伤害数值显示
                createDamageNumber(enemy.x, enemy.y, windFireDamage);
                
                // 碰撞粒子效果
                for (let k = 0; k < 5; k++) {
                    game.particles.push({
                        x: orbX,
                        y: orbY,
                        dx: randomBetween(-3, 3),
                        dy: randomBetween(-3, 3),
                        radius: randomBetween(2, 4),
                        color: '#FF6B35',
                        lifetime: 20
                    });
                }
            }
        }
    }
    
    // 生成风火轮粒子效果
    if (Math.random() < 0.3) {
        const angle = game.player.windFireWheels.rotation;
        for (let i = 0; i < wheelCount; i++) {
            const wheelAngle = angle + (i * angleStep);
            const wheelX = game.player.x + Math.cos(wheelAngle) * game.player.windFireWheels.radius;
            const wheelY = game.player.y + Math.sin(wheelAngle) * game.player.windFireWheels.radius;
            
            game.particles.push({
                x: wheelX,
                y: wheelY,
                dx: Math.cos(wheelAngle) * 3,
                dy: Math.sin(wheelAngle) * 3,
                radius: Math.random() * 4 + 2,
                color: `hsl(${Math.random() * 60 + 15}, 100%, 70%)`,
                lifetime: 20
            });
        }
    }
    
    // 风火轮只通过旋转的火球造成伤害，不应有额外的范围伤害
}

// 激活激光技能
function activateLaser() {
    if (game.player.mana < game.player.laser.minMana) return;
    
    game.player.laser.active = true;
    // 移除冷却时间限制，只要有魔力就能释放
    
    // 计算激光起点（玩家中心）
    game.player.laser.startX = game.player.x;
    game.player.laser.startY = game.player.y;
    
    // 计算激光终点（朝鼠标方向）
    const mouseWorldX = game.mouse.x - game.gameWidth/2 + game.player.x;
    const mouseWorldY = game.mouse.y - game.gameHeight/2 + game.player.y;
    const dx = mouseWorldX - game.player.x;
    const dy = mouseWorldY - game.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        
        // 检查是否有三相之力buff
        const hasTrinityForce = game.buffSystem && game.buffSystem.isBuffActive('trinityForce');
        
        if (hasTrinityForce) {
            // 三股激光：中间一股 + 左右各一股（角度偏移30度）
            game.player.laser.beams = [];
            const angleOffset = Math.PI / 6; // 30度
            
            // 中间激光
            game.player.laser.beams.push({
                endX: game.player.x + normalizedDx * game.player.laser.range,
                endY: game.player.y + normalizedDy * game.player.laser.range
            });
            
            // 左侧激光
            const leftAngle = Math.atan2(normalizedDy, normalizedDx) - angleOffset;
            game.player.laser.beams.push({
                endX: game.player.x + Math.cos(leftAngle) * game.player.laser.range,
                endY: game.player.y + Math.sin(leftAngle) * game.player.laser.range
            });
            
            // 右侧激光
            const rightAngle = Math.atan2(normalizedDy, normalizedDx) + angleOffset;
            game.player.laser.beams.push({
                endX: game.player.x + Math.cos(rightAngle) * game.player.laser.range,
                endY: game.player.y + Math.sin(rightAngle) * game.player.laser.range
            });
        } else {
            // 单股激光
            game.player.laser.endX = game.player.x + normalizedDx * game.player.laser.range;
            game.player.laser.endY = game.player.y + normalizedDy * game.player.laser.range;
            game.player.laser.beams = null;
        }
    }
}

// 更新激光技能
function updateLaser() {
    if (!game.player.laser.active) {
        // 重置所有敌人的激光伤害计时器
        for (const enemy of game.enemies) {
            enemy.laserDamageTimer = 0;
        }
        return;
    }
    
    // 消耗魔力
    game.player.mana -= game.player.laser.manaCost;
    if (game.player.mana < 0) {
        game.player.mana = 0;
        game.player.laser.active = false;
        // 重置所有敌人的激光伤害计时器
        for (const enemy of game.enemies) {
            enemy.laserDamageTimer = 0;
        }
        return;
    }
    
    // 更新激光方向（跟随鼠标）
    game.player.laser.startX = game.player.x;
    game.player.laser.startY = game.player.y;
    
    const mouseWorldX = game.mouse.x - game.gameWidth/2 + game.player.x;
    const mouseWorldY = game.mouse.y - game.gameHeight/2 + game.player.y;
    const dx = mouseWorldX - game.player.x;
    const dy = mouseWorldY - game.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        
        // 检查是否有三相之力buff
        const hasTrinityForce = game.buffSystem && game.buffSystem.isBuffActive('trinityForce');
        
        if (hasTrinityForce) {
            // 三股激光：中间一股 + 左右各偏转30度
            const angle = Math.atan2(normalizedDy, normalizedDx);
            const angleOffset = Math.PI / 6; // 30度
            
            // 中间激光
            game.player.laser.endX = game.player.x + normalizedDx * game.player.laser.range;
            game.player.laser.endY = game.player.y + normalizedDy * game.player.laser.range;
            
            // 左侧激光
            const leftAngle = angle - angleOffset;
            game.player.laser.leftEndX = game.player.x + Math.cos(leftAngle) * game.player.laser.range;
            game.player.laser.leftEndY = game.player.y + Math.sin(leftAngle) * game.player.laser.range;
            
            // 右侧激光
            const rightAngle = angle + angleOffset;
            game.player.laser.rightEndX = game.player.x + Math.cos(rightAngle) * game.player.laser.range;
            game.player.laser.rightEndY = game.player.y + Math.sin(rightAngle) * game.player.laser.range;
        } else {
            // 单股激光
            game.player.laser.endX = game.player.x + normalizedDx * game.player.laser.range;
            game.player.laser.endY = game.player.y + normalizedDy * game.player.laser.range;
        }
    }
    
    // 检测激光与敌人的碰撞
    for (let i = game.enemies.length - 1; i >= 0; i--) {
        const enemy = game.enemies[i];
        
        // 初始化敌人的激光伤害计时器
        if (enemy.laserDamageTimer === undefined) {
            enemy.laserDamageTimer = 0;
        }
        
        let hitByLaser = false;
        
        // 检查是否有三相之力buff
        const hasTrinityForce = game.buffSystem && game.buffSystem.isBuffActive('trinityForce');
        
        // 定义碰撞点坐标变量
        let closestX = enemy.x;
        let closestY = enemy.y;
        
        if (hasTrinityForce) {
            // 检测三股激光的碰撞
            const lasers = [
                { startX: game.player.laser.startX, startY: game.player.laser.startY, endX: game.player.laser.endX, endY: game.player.laser.endY },
                { startX: game.player.laser.startX, startY: game.player.laser.startY, endX: game.player.laser.leftEndX, endY: game.player.laser.leftEndY },
                { startX: game.player.laser.startX, startY: game.player.laser.startY, endX: game.player.laser.rightEndX, endY: game.player.laser.rightEndY }
            ];
            
            for (const laser of lasers) {
                const laserLength = Math.sqrt(
                    (laser.endX - laser.startX) ** 2 + 
                    (laser.endY - laser.startY) ** 2
                );
                
                if (laserLength === 0) continue;
                
                const t = Math.max(0, Math.min(1, 
                    ((enemy.x - laser.startX) * (laser.endX - laser.startX) + 
                     (enemy.y - laser.startY) * (laser.endY - laser.startY)) / (laserLength ** 2)
                ));
                
                const laserClosestX = laser.startX + t * (laser.endX - laser.startX);
                const laserClosestY = laser.startY + t * (laser.endY - laser.startY);
                
                const distanceToLaser = Math.sqrt((enemy.x - laserClosestX) ** 2 + (enemy.y - laserClosestY) ** 2);
                
                if (distanceToLaser < enemy.radius + game.player.laser.width / 2) {
                    hitByLaser = true;
                    closestX = laserClosestX;
                    closestY = laserClosestY;
                    break;
                }
            }
        } else {
            // 单股激光碰撞检测
            const laserLength = Math.sqrt(
                (game.player.laser.endX - game.player.laser.startX) ** 2 + 
                (game.player.laser.endY - game.player.laser.startY) ** 2
            );
            
            if (laserLength > 0) {
                const t = Math.max(0, Math.min(1, 
                    ((enemy.x - game.player.laser.startX) * (game.player.laser.endX - game.player.laser.startX) + 
                     (enemy.y - game.player.laser.startY) * (game.player.laser.endY - game.player.laser.startY)) / (laserLength ** 2)
                ));
                
                const laserClosestX = game.player.laser.startX + t * (game.player.laser.endX - game.player.laser.startX);
                const laserClosestY = game.player.laser.startY + t * (game.player.laser.endY - game.player.laser.startY);
                
                const distanceToLaser = Math.sqrt((enemy.x - laserClosestX) ** 2 + (enemy.y - laserClosestY) ** 2);
                
                if (distanceToLaser < enemy.radius + game.player.laser.width / 2) {
                    hitByLaser = true;
                    closestX = laserClosestX;
                    closestY = laserClosestY;
                }
            }
        }
        
        if (hitByLaser) {
            // 更新敌人的激光伤害计时器
            enemy.laserDamageTimer++;
            
            // 检查是否可以造成伤害（每个敌人独立的伤害间隔）
            if (enemy.laserDamageTimer >= game.player.laser.damageInterval) {
                // 计算伤害（基础伤害 + 百分比伤害）
                const percentDamage = enemy.maxHealth * game.player.laser.percentDamage;
                let totalDamage = game.player.laser.damage + percentDamage;
                
                // 暴击判定
                const isCritical = Math.random() < game.player.criticalRate;
                if (isCritical) {
                    totalDamage = Math.floor(totalDamage * game.player.criticalMultiplier);
                }
                
                // 对敌人造成伤害
                enemy.health -= totalDamage;
                
                // 记录激光伤害
                if (window.damageTracker) {
                    window.damageTracker.recordDamage({
                        damage: Math.round(totalDamage),
                        monsterType: enemy.type,
                        damageSource: 'laser',
                        isCritical: isCritical,
                        x: enemy.x,
                        y: enemy.y
                    });
                }
                
                // 添加简单伤害显示
                if (window.simpleDamageDisplay) {
                    window.simpleDamageDisplay.addDamageText(Math.round(totalDamage), enemy.x, enemy.y, isCritical);
                }
                
                // 暴击时在屏幕中央显示
                if (isCritical) {
                    createCriticalDisplay(Math.floor(totalDamage));
                }
                
                // 重置该敌人的伤害计时器
                enemy.laserDamageTimer = 0;
                
                // 击退效果
                const knockbackForce = 12;
                const angle = Math.atan2(enemy.y - game.player.y, enemy.x - game.player.x);
                enemy.dx += Math.cos(angle) * knockbackForce;
                enemy.dy += Math.sin(angle) * knockbackForce;
                
                // 伤害数值显示
                createDamageNumber(enemy.x, enemy.y - 20, Math.round(totalDamage), isCritical);
                
                // 激光命中粒子效果
                for (let j = 0; j < 8; j++) {
                    game.particles.push({
                        x: closestX,
                        y: closestY,
                        dx: (Math.random() - 0.5) * 8,
                        dy: (Math.random() - 0.5) * 8,
                        radius: Math.random() * 4 + 2,
                        color: `hsl(${Math.random() * 60 + 15}, 100%, 60%)`,
                        lifetime: 30
                    });
                }
            }
        } else {
            // 如果敌人不在激光范围内，重置其伤害计时器
            enemy.laserDamageTimer = 0;
        }
            
        // 检查敌人是否死亡
        if (enemy.health <= 0) {
            handleEnemyDeath(enemy, i);
        }
    }
}

// 检查指定位置是否有碰撞
function checkCollisionAtPosition(x, y, radius) {
    // 检查与平台的碰撞
    for (const platform of game.platforms) {
        if (x + radius > platform.x && x - radius < platform.x + platform.width &&
            y + radius > platform.y && y - radius < platform.y + platform.height) {
            return true;
        }
    }
    
    // 检查与地面方块的碰撞
    for (const block of game.groundBlocks) {
        if (x + radius > block.x && x - radius < block.x + block.width &&
            y + radius > block.y && y - radius < block.y + block.height) {
            return true;
        }
    }
    
    // 检查与大陆方块的碰撞
    for (const block of game.mainlandBlocks) {
        if (x + radius > block.x && x - radius < block.x + block.width &&
            y + radius > block.y && y - radius < block.y + block.height) {
            return true;
        }
    }
    
    return false;
}

// 等级提升检查
function checkLevelUp() {
    if (game.player.exp >= game.player.expToNextLevel) {
        game.player.level++;
        game.player.exp -= game.player.expToNextLevel;
        game.player.expToNextLevel = Math.floor(game.player.expToNextLevel * 1.2);
        
        // 属性提升
        game.player.maxHealth += 20;
        game.player.health = game.player.maxHealth;
        game.player.maxMana += 10;
        game.player.mana = game.player.maxMana;
        game.player.maxStamina += 5;
        game.player.stamina = game.player.maxStamina;
        game.player.attackPower += 5;
        
        // 球球尺寸增长（上限40）
        if (game.player.radius < 40) {
            game.player.radius += 1;
        }
        
        // 升级提示
        createFloatingText(
            game.player.x, 
            game.player.y - 50, 
            `等级提升! Lv.${game.player.level}`, 
            '#FFD700', 
            120, 
            24
        );
    }
}

// 更新敌人
function updateEnemies() {
    for (let i = game.enemies.length - 1; i >= 0; i--) {
        const enemy = game.enemies[i];
        
        // 检查敌人是否有效
        if (!enemy) {
            game.enemies.splice(i, 1);
            continue;
        }
        
        // 眩晕状态处理
        if (enemy.stunned > 0) {
            enemy.stunned--;
            continue;
        }
        
        // 根据敌人类型更新行为
        updateEnemyByType(enemy);
        
        // 基础移动逻辑
        updateEnemyMovement(enemy);
        
        // 碰撞检测
        updateEnemyCollisions(enemy, i);
        
        // 清理死亡敌人
        if (enemy.health <= 0) {
            handleEnemyDeath(enemy, i);
        }
    }
}

// 根据敌人类型更新行为
function updateEnemyByType(enemy) {
    switch(enemy.type) {
        case 'rotating':
            updateRotatingEnemy(enemy);
            break;
        case 'teleport':
            updateTeleportEnemy(enemy);
            break;
        case 'snake':
            updateSnakeEnemy(enemy);
            break;
        case 'yellow':
            updateYellowEnemy(enemy);
            break;
        case 'control':
            updateControlEnemy(enemy);
            break;
        case 'elite':
            updateEliteEnemy(enemy);
            break;
        case 'largered':
            updateLargeRedEnemy(enemy);
            break;
    }
}

// 更新旋转敌人
function updateRotatingEnemy(enemy) {
    enemy.rotationAngle += enemy.rotationSpeed;
    if (enemy.companion) {
        const newX = enemy.x + Math.cos(enemy.rotationAngle) * enemy.orbitRadius;
        const newY = enemy.y + Math.sin(enemy.rotationAngle) * enemy.orbitRadius;
        
        // 检查伙伴球新位置是否在安全区内
        let canMove = true;
        if (window.safeZoneSystem) {
            const inSafeZone = window.safeZoneSystem.isInSafeZone(newX, newY);
            if (inSafeZone) {
                canMove = false;
            }
        }
        
        // 如果可以移动且不在安全区内，则更新位置
        if (canMove) {
            enemy.companion.x = newX;
            enemy.companion.y = newY;
        }
        // 如果不能移动，保持当前位置不变
    }
}

// 更新传送敌人
function updateTeleportEnemy(enemy) {
    enemy.teleportCooldown++;
    
    if (enemy.isCharging) {
        enemy.chargeTime++;
        if (enemy.chargeTime >= enemy.maxChargeTime) {
            // 执行传送 - 70%概率向玩家方向传送，30%概率随机传送
            let targetX, targetY;
            let attempts = 0;
            let validTarget = false;
            
            // 尝试找到安全的传送位置
            while (attempts < 10 && !validTarget) {
                if (Math.random() < 0.7) {
                    // 向玩家方向传送
                    const playerDx = game.player.x - enemy.x;
                    const playerDy = game.player.y - enemy.y;
                    const playerDistance = Math.sqrt(playerDx * playerDx + playerDy * playerDy);
                    const teleportDistance = randomBetween(150, Math.min(enemy.teleportRange, playerDistance * 0.8));
                    const angle = Math.atan2(playerDy, playerDx);
                    targetX = enemy.x + Math.cos(angle) * teleportDistance;
                    targetY = enemy.y + Math.sin(angle) * teleportDistance;
                } else {
                    // 随机传送
                    const angle = Math.random() * Math.PI * 2;
                    const distance = randomBetween(100, enemy.teleportRange);
                    targetX = enemy.x + Math.cos(angle) * distance;
                    targetY = enemy.y + Math.sin(angle) * distance;
                }
                
                // 检查传送目标位置是否在安全区内
                if (window.safeZoneSystem) {
                    const targetInSafeZone = window.safeZoneSystem.isInSafeZone(targetX, targetY);
                    if (!targetInSafeZone) {
                        validTarget = true;
                    }
                } else {
                    validTarget = true;
                }
                attempts++;
            }
            
            // 如果找到有效位置则传送，否则取消传送
            if (validTarget) {
                enemy.x = targetX;
                enemy.y = targetY;
            }
            
            enemy.isCharging = false;
            enemy.chargeTime = 0;
            enemy.teleportCooldown = 0;
        }
    } else if (enemy.teleportCooldown >= enemy.teleportInterval) {
        // 检查玩家是否在安全区内，如果是则不开始传送
        if (window.safeZoneSystem) {
            const playerInSafeZone = window.safeZoneSystem.isInSafeZone(game.player.x, game.player.y);
            if (playerInSafeZone) {
                return; // 玩家在安全区内，不传送
            }
        }
        
        enemy.isCharging = true;
        enemy.chargeTime = 0;
    }
}

// 更新贪吃蛇敌人
function updateSnakeEnemy(enemy) {
    // 更新蛇身节点位置
    if (enemy.segments && enemy.segments.length > 0) {
        // 记录蛇头的前一个位置
        const prevX = enemy.x - enemy.dx;
        const prevY = enemy.y - enemy.dy;
        
        // 每个节点跟随前一个节点
        for (let segIndex = 0; segIndex < enemy.segments.length; segIndex++) {
            const segment = enemy.segments[segIndex];
            const targetX = segIndex === 0 ? prevX : enemy.segments[segIndex - 1].prevX;
            const targetY = segIndex === 0 ? prevY : enemy.segments[segIndex - 1].prevY;
            
            // 保存当前位置作为下一个节点的目标
            segment.prevX = segment.x;
            segment.prevY = segment.y;
            
            // 计算跟随方向
            const segDx = targetX - segment.x;
            const segDy = targetY - segment.y;
            const segDistance = Math.sqrt(segDx * segDx + segDy * segDy);
            
            // 安全区检查：如果蛇身节点要移动到安全区内，则停止移动
            let canMove = true;
            if (segDistance > enemy.segmentSpacing) {
                const moveRatio = (segDistance - enemy.segmentSpacing) / segDistance;
                const newX = segment.x + segDx * moveRatio;
                const newY = segment.y + segDy * moveRatio;
                
                // 检查新位置是否在安全区内
                if (window.safeZoneSystem) {
                    const inSafeZone = window.safeZoneSystem.isInSafeZone(newX, newY);
                    if (inSafeZone) {
                        canMove = false;
                    }
                }
                
                // 如果可以移动且不在安全区内，则移动节点
                if (canMove) {
                    segment.x = newX;
                    segment.y = newY;
                }
            }
            
            // 检测蛇身节点与玩家的碰撞（只有在玩家不在安全区内时才造成伤害）
            const segPlayerDx = game.player.x - segment.x;
            const segPlayerDy = game.player.y - segment.y;
            const segPlayerDistance = Math.sqrt(segPlayerDx * segPlayerDx + segPlayerDy * segPlayerDy);
            
            if (segPlayerDistance < segment.radius + game.player.radius) {
                // 检查玩家是否在安全区内
                let playerInSafeZone = false;
                if (window.safeZoneSystem) {
                    playerInSafeZone = window.safeZoneSystem.isInSafeZone(game.player.x, game.player.y);
                }
                
                // 只有玩家不在安全区内才造成伤害
                if (!playerInSafeZone) {
                    // 蛇身碰撞伤害
                    game.player.health -= 3;
                    
                    // 轻微击退
                    const knockback = 5;
                    game.player.dx += Math.cos(Math.atan2(segPlayerDy, segPlayerDx)) * knockback;
                    game.player.dy += Math.sin(Math.atan2(segPlayerDy, segPlayerDx)) * knockback;
                    
                    // 增加怒气
                    game.player.hitRageMultiplier = 1.5;
                    game.player.lastHitTime = 120;
                }
            }
        }
    }
}

// 更新黄色敌人（大小变化）
function updateYellowEnemy(enemy) {
    enemy.sizePhase += enemy.sizeChangeSpeed;
    
    if (enemy.isGrowing) {
        enemy.radius = enemy.baseRadius + (enemy.maxRadius - enemy.baseRadius) * Math.sin(enemy.sizePhase);
        if (enemy.radius >= enemy.maxRadius * 0.95) {
            enemy.isGrowing = false;
        }
    } else {
        enemy.radius = enemy.maxRadius - (enemy.maxRadius - enemy.minRadius) * Math.sin(enemy.sizePhase);
        if (enemy.radius <= enemy.minRadius * 1.05) {
            enemy.isGrowing = true;
        }
    }
    
    // 根据大小调整伤害和速度
    const sizeRatio = enemy.radius / enemy.baseRadius;
    enemy.damage = Math.floor(enemy.baseDamage * sizeRatio);
    enemy.speed = enemy.baseSpeed / sizeRatio;
}

// 更新控制敌人
function updateControlEnemy(enemy) {
    enemy.controlCooldown++;
    enemy.controlRingPulse += enemy.controlRingPulseSpeed;
    
    // 控制圈脉冲效果
    enemy.controlRingRadius = enemy.controlRingMinRadius + 
        (enemy.controlRingMaxRadius - enemy.controlRingMinRadius) * 
        (0.5 + 0.5 * Math.sin(enemy.controlRingPulse));
    
    // 检查玩家是否在控制圈内
    const dx = game.player.x - enemy.x;
    const dy = game.player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < enemy.controlRingRadius) {
        // 检查玩家是否有风火轮免控效果
        if (game.player.windFireWheels && game.player.windFireWheels.active) {
            // 风火轮激活时免疫控制效果
            return;
        }
        
        // 进入引力圈时立即设置不动状态
        if (!game.player.immobilized) {
            game.player.immobilized = true;
            game.player.immobilizeTimer = 60; // 1秒 (60帧)
            game.player.dx = 0; // 立即停止移动
            game.player.dy = 0;
        }
    }
}

// 更新精英敌人
function updateEliteEnemy(enemy) {
    // 确保orbs属性存在
    if (!enemy.orbs || !Array.isArray(enemy.orbs)) {
        enemy.orbs = [];
        // 重新初始化轨道球
        const orbCount = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < orbCount; i++) {
            const angle = (i / orbCount) * Math.PI * 2;
            const orbRadius = enemy.radius * 0.4;
            const orbitDistance = enemy.radius + 40;
            enemy.orbs.push({
                angle: angle,
                radius: orbRadius,
                orbitDistance: orbitDistance,
                health: enemy.health * 0.2,
                maxHealth: enemy.health * 0.2
            });
        }
    }
    
    // 更新环绕小球
    for (const orb of enemy.orbs) {
        orb.angle += 0.02;
        const newX = enemy.x + Math.cos(orb.angle) * orb.orbitDistance;
        const newY = enemy.y + Math.sin(orb.angle) * orb.orbitDistance;
        
        // 检查轨道球新位置是否在安全区内
        let canMove = true;
        if (window.safeZoneSystem) {
            const inSafeZone = window.safeZoneSystem.isInSafeZone(newX, newY);
            if (inSafeZone) {
                canMove = false;
            }
        }
        
        // 如果可以移动且不在安全区内，则更新位置
        if (canMove) {
            orb.x = newX;
            orb.y = newY;
        } else {
            // 如果不能移动，保持当前位置
            orb.x = orb.x || enemy.x;
            orb.y = orb.y || enemy.y;
        }
    }
    
    // 引力场效果
    const dx = game.player.x - enemy.x;
    const dy = game.player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < enemy.gravityFieldRadius) {
        // 检查玩家是否有风火轮免控效果
        if (game.player.windFireWheels && game.player.windFireWheels.active) {
            // 风火轮激活时免疫引力场效果
            return;
        }
        
        const pullStrength = enemy.gravityStrength * (1 - distance / enemy.gravityFieldRadius);
        const angle = Math.atan2(dy, dx);
        game.player.dx += Math.cos(angle) * pullStrength;
        game.player.dy += Math.sin(angle) * pullStrength;
        
        // 迟缓效果 - 减少玩家移动速度
        const slowFactor = 0.3 + 0.4 * (distance / enemy.gravityFieldRadius); // 0.3-0.7倍速度
        game.player.dx *= slowFactor;
        game.player.dy *= slowFactor;
        
        // 标记玩家处于引力场中
        game.player.inGravityField = true;
        game.player.gravitySlowFactor = slowFactor;
    }
    
    // 大型子弹攻击
    enemy.bigBulletCooldown++;
    if (enemy.bigBulletCooldown >= enemy.bigBulletInterval && distance < 600) {
        const angle = Math.atan2(dy, dx);
        game.projectiles.push({
            x: enemy.x,
            y: enemy.y,
            dx: Math.cos(angle) * 6,
            dy: Math.sin(angle) * 6,
            radius: 20,
            damage: enemy.damage,
            owner: 'enemy',
            lifetime: 120,
            active: true
        });
        enemy.bigBulletCooldown = 0;
    }
}

// 更新大型红色敌人
function updateLargeRedEnemy(enemy) {
    enemy.scatterCooldown++;
    
    if (enemy.scatterCooldown >= enemy.scatterInterval) {
        // 散射攻击
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            game.projectiles.push({
                x: enemy.x,
                y: enemy.y,
                dx: Math.cos(angle) * 8,
                dy: Math.sin(angle) * 8,
                radius: 12,
                damage: 15,
                owner: 'enemy',
                lifetime: 100,
                active: true
            });
        }
        enemy.scatterCooldown = 0;
    }
}

// 更新敌人移动
function updateEnemyMovement(enemy) {
    // 更新攻击冷却时间
    if (enemy.attackCooldown > 0) {
        enemy.attackCooldown -= game.deltaTime;
    }
    
    // 安全区检查：如果怪物在安全区范围内，强制停止移动
    let inSafeZone = false;
    if (window.safeZoneSystem) {
        inSafeZone = window.safeZoneSystem.isInSafeZone(enemy.x, enemy.y);
        if (inSafeZone) {
            // 强制停止移动和追击
            enemy.state = 'idle';
            enemy.dx = 0;
            enemy.dy = 0;
            return; // 直接返回，不移动
        }
        
        // 检查玩家是否在安全区内，如果是则不追击
        const playerInSafeZone = window.safeZoneSystem.isInSafeZone(game.player.x, game.player.y);
        if (playerInSafeZone) {
            // 玩家在安全区内，怪物回到原位置
            const distanceToOriginal = Math.sqrt(
                Math.pow(enemy.x - enemy.originalX, 2) + 
                Math.pow(enemy.y - enemy.originalY, 2)
            );
            
            if (distanceToOriginal > 20) { // 距离原位置超过20像素时回归
                enemy.state = 'return';
                const returnAngle = Math.atan2(enemy.originalY - enemy.y, enemy.originalX - enemy.x);
                enemy.dx = Math.cos(returnAngle) * enemy.speed * enemy.returnSpeed;
                enemy.dy = Math.sin(returnAngle) * enemy.speed * enemy.returnSpeed;
            } else {
                enemy.state = 'idle';
                enemy.dx = 0;
                enemy.dy = 0;
            }
            
            enemy.x += enemy.dx;
            enemy.y += enemy.dy;
            return;
        }
        
        // 检查是否应该避开安全区
        const avoidanceVector = window.safeZoneSystem.getAvoidanceVector(enemy.x, enemy.y);
        if (avoidanceVector) {
            // 强制远离安全区
            enemy.state = 'flee';
            enemy.dx = avoidanceVector.x * enemy.speed * 1.2;
            enemy.dy = avoidanceVector.y * enemy.speed * 1.2;
            enemy.x += enemy.dx;
            enemy.y += enemy.dy;
            return;
        }
    }
    
    const dx = game.player.x - enemy.x;
    const dy = game.player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 狂潮模式下增强敌人能力
    let detectionRange = enemy.detectionRange;
    let chaseRange = enemy.chaseRange;
    let speed = enemy.speed;
    
    if (game.frenzyMode.active) {
        detectionRange *= 1.8;  // 探测范围增加80%
        chaseRange *= 1.8;      // 追击范围增加80%
        speed *= 1.5;           // 移动速度增加50%
    }
    
    // 检查是否需要回归原位置
    const distanceToOriginal = Math.sqrt(
        Math.pow(enemy.x - enemy.originalX, 2) + 
        Math.pow(enemy.y - enemy.originalY, 2)
    );
    
    // AI行为
    if (distance < detectionRange) {
        // 根据玩家强度决定行为
        const playerStrength = game.player.level + game.player.radius;
        const enemyStrength = enemy.radius * (enemy.type === 'red' ? 1.5 : 1);
        
        // 狂潮模式下敌人更加激进
        const fleeThreshold = game.frenzyMode.active ? 4 : 3;
        
        if (playerStrength > enemyStrength * fleeThreshold) {
            enemy.state = 'flee';
        } else {
            enemy.state = 'chase';
        }
    } else if (distance > chaseRange) {
        // 如果距离原位置太远，回归原位置
        if (distanceToOriginal > enemy.returnThreshold) {
            enemy.state = 'return';
        } else {
            enemy.state = 'idle';
        }
    }
    
    // 根据状态行动
    if (enemy.state === 'chase') {
        // 追击玩家
        const angle = Math.atan2(dy, dx);
        enemy.dx = Math.cos(angle) * speed;
        enemy.dy = Math.sin(angle) * speed;
    } else if (enemy.state === 'flee') {
        // 逃离玩家
        const angle = Math.atan2(dy, dx);
        enemy.dx = -Math.cos(angle) * speed * 0.8;
        enemy.dy = -Math.sin(angle) * speed * 0.8;
    } else if (enemy.state === 'return') {
        // v4.1.7: 回归原位置
        const returnAngle = Math.atan2(enemy.originalY - enemy.y, enemy.originalX - enemy.x);
        enemy.dx = Math.cos(returnAngle) * speed * enemy.returnSpeed;
        enemy.dy = Math.sin(returnAngle) * speed * enemy.returnSpeed;
        
        // 如果接近原位置，停止移动
        if (distanceToOriginal < 20) {
            enemy.state = 'idle';
            enemy.dx = 0;
            enemy.dy = 0;
        }
    } else {
        // 空闲状态，减速
        enemy.dx *= 0.95;
        enemy.dy *= 0.95;
    }
    
    // 应用移动
    enemy.x += enemy.dx;
    enemy.y += enemy.dy;
}

// 更新敌人碰撞
function updateEnemyCollisions(enemy, index) {
    // 与玩家碰撞
    if (checkCollision(enemy, game.player)) {
        handlePlayerEnemyCollision(enemy);
    }
    
    // 与投射物碰撞
    for (let j = game.projectiles.length - 1; j >= 0; j--) {
        const projectile = game.projectiles[j];
        if (projectile.owner === 'player' && checkCollision(enemy, projectile)) {
            handleEnemyProjectileCollision(enemy, projectile, j);
        }
    }
}

// 处理玩家与敌人碰撞
function handlePlayerEnemyCollision(enemy) {
    // 检查攻击冷却
    if (enemy.attackCooldown > 0) {
        return;
    }
    
    // 安全区保护：如果玩家在安全区内，完全免疫伤害
    if (window.safeZoneSystem && window.safeZoneSystem.isInSafeZone(game.player.x, game.player.y)) {
        // 在安全区内显示保护提示
        if (Math.random() < 0.1) { // 10%概率显示提示，避免刷屏
            createFloatingText(game.player.x, game.player.y - 30, "安全区保护", "#00ff00", 60, 1.2);
        }
        return;
    }
    
    // 计算伤害
    let damage = enemy.damage || 10;
    
    // 应用护盾减伤
    if (game.player.powerups.shield.active) {
        damage = Math.floor(damage * game.player.powerups.shield.damageReduction);
    }
    
    game.player.health -= damage;
    game.player.rage += damage * game.player.hitRageMultiplier;
    game.player.lastHitTime = 60;
    game.player.hitRageMultiplier = Math.min(3, game.player.hitRageMultiplier + 0.1);
    
    // 击退效果
    const dx = game.player.x - enemy.x;
    const dy = game.player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 0) {
        const knockback = 15;
        game.player.dx += (dx / distance) * knockback;
        game.player.dy += (dy / distance) * knockback;
    }
    
    // 设置攻击冷却时间 - 狂潮模式下攻击更频繁
    const cooldownMultiplier = game.frenzyMode.active ? 0.6 : 1;
    enemy.attackCooldown = config.enemies.attackCooldown * cooldownMultiplier;
    
    // 创建伤害数值显示
    createDamageNumber(game.player.x, game.player.y, damage);
}

// 处理敌人与投射物碰撞
function handleEnemyProjectileCollision(enemy, projectile, projectileIndex) {
    // 计算伤害
    let damage = projectile.damage;
    
    // 暴击判定
    const isCritical = Math.random() < game.player.criticalChance;
    if (isCritical) {
        damage = Math.floor(damage * game.player.criticalMultiplier);
        createCriticalDisplay(damage);
    }
    
    enemy.health -= damage;
    
    // 创建伤害数值显示
    createDamageNumber(enemy.x, enemy.y, damage, isCritical);
    
    // 记录伤害数据
    if (window.damageTracker) {
        window.damageTracker.recordDamage({
            damage: damage,
            monsterType: enemy.type,
            damageSource: projectile.type || 'projectile',
            isCritical: isCritical,
            x: enemy.x,
            y: enemy.y
        });
    }
    
    // 添加简单伤害显示
    if (window.simpleDamageDisplay) {
        window.simpleDamageDisplay.addDamageText(damage, enemy.x, enemy.y, isCritical);
    }
    
    // 移除投射物
    ObjectPool.recycleProjectile(projectile);
    game.projectiles.splice(projectileIndex, 1);
    
    // 击中粒子效果
    for (let k = 0; k < 5; k++) {
        game.particles.push({
            x: enemy.x,
            y: enemy.y,
            dx: randomBetween(-3, 3),
            dy: randomBetween(-3, 3),
            radius: randomBetween(1, 3),
            color: '#FFD700',
            lifetime: 20
        });
    }
}

// 处理敌人死亡
function handleEnemyDeath(enemy, index) {
    // 怪物死亡统计追踪
    monsterStats.totalKilled++;
    if (monsterStats.killedByType[enemy.type] !== undefined) {
        monsterStats.killedByType[enemy.type]++;
    }
    
    // 精英怪物子类型击杀统计
    if (enemy.type === 'elite' && enemy.eliteType && monsterStats.killedByType[enemy.eliteType] !== undefined) {
        monsterStats.killedByType[enemy.eliteType]++;
    }
    
    // 更新附近生成点的击杀统计（用于区域冷却）
    updateSpawnPointKillStats(enemy.x, enemy.y);
    
    // 安全区系统：记录击杀位置
    if (window.safeZoneSystem) {
        window.safeZoneSystem.recordKill(enemy.x, enemy.y);
    }
    
    // 检查buff掉落
    if (game.buffSystem && game.buffSystem.checkBuffDrop) {
        const buffDropped = game.buffSystem.checkBuffDrop(enemy.type);
        if (buffDropped) {
            // 根据掉落的buff类型创建相应提示
            if (game.buffSystem.isBuffActive('trinityForce')) {
                createFloatingText(enemy.x, enemy.y - 30, '三相之力!', '#FFD700', 120, 1.5);
            } else if (game.buffSystem.isBuffActive('solarFlare')) {
                createFloatingText(enemy.x, enemy.y - 30, '日炎!', '#FF4444', 120, 1.5);
            }
        }
    }
    
    // 经验和分数奖励 - 基于等级的大幅提升
    // 安全检查，防止NaN
    const safeMaxHealth = enemy.maxHealth || enemy.health || 20;
    const safeDistanceFromSpawn = enemy.distanceFromSpawn || 0;
    
    const baseExpGain = Math.floor(safeMaxHealth / 4) + 5;
    const baseScoreGain = Math.floor(safeMaxHealth / 2) + 10;
    
    // 根据怪物等级计算奖励倍数
    const level = enemy.level || 1;
    const levelMultiplier = 1 + (level - 1) * 0.5; // 每级增加50%奖励
    const distanceBonus = Math.floor(safeDistanceFromSpawn / 1000) * 0.2; // 每1000距离额外20%
    const totalMultiplier = levelMultiplier + distanceBonus;
    
    const expGain = Math.floor(baseExpGain * totalMultiplier);
    const scoreGain = Math.floor(baseScoreGain * totalMultiplier);
    
    // 确保game.player.exp和game.score是数字
    if (isNaN(game.player.exp)) game.player.exp = 0;
    if (isNaN(game.score)) game.score = 0;
    
    game.player.exp += expGain;
    game.score += scoreGain;
    
    // 怒气奖励 - 击杀敌人增加怒气
    const rageGain = 3 * game.player.hitRageMultiplier;
    game.player.rage = Math.min(game.player.rage + rageGain, game.player.maxRage);
    
    // 创建经验数值显示
    createExperienceNumber(enemy.x, enemy.y, expGain);
    
    // 金币奖励系统 - v4.2.0
    if (window.coinSystem) {
        // 触发怪物击杀事件，让金币系统处理奖励
        const monsterKillEvent = new CustomEvent('monsterKilled', {
            detail: {
                monster: {
                    type: enemy.type,
                    level: enemy.level || 1,
                    maxHealth: safeMaxHealth,
                    x: enemy.x,
                    y: enemy.y
                }
            }
        });
        document.dispatchEvent(monsterKillEvent);
    }
    
    // 死亡粒子效果
    for (let j = 0; j < 15; j++) {
        game.particles.push({
            x: enemy.x + randomBetween(-enemy.radius, enemy.radius),
            y: enemy.y + randomBetween(-enemy.radius, enemy.radius),
            dx: randomBetween(-4, 4),
            dy: randomBetween(-4, 4),
            radius: randomBetween(2, 5),
            color: enemy.type === 'red' ? '#FF4444' : 
                   enemy.type === 'blue' ? '#4444FF' : 
                   enemy.type === 'green' ? '#44FF44' : '#FFFFFF',
            lifetime: 30
        });
    }
    
    // 移除敌人
    game.enemies.splice(index, 1);
}

// 更新投射物
function updateProjectiles() {
    for (let i = game.projectiles.length - 1; i >= 0; i--) {
        const projectile = game.projectiles[i];
        
        // 更新位置
        projectile.x += projectile.dx;
        projectile.y += projectile.dy;
        
        // 更新生命周期
        projectile.lifetime--;
        
        // 移除过期投射物
        if (projectile.lifetime <= 0) {
            ObjectPool.recycleProjectile(projectile);
            game.projectiles.splice(i, 1);
            continue;
        }
        
        // 检测投射物与石块碰撞
        let hitStone = false;
        for (const stoneBlock of game.stoneBlocks) {
            if (
                projectile.x + projectile.radius > stoneBlock.x &&
                projectile.x - projectile.radius < stoneBlock.x + stoneBlock.width &&
                projectile.y + projectile.radius > stoneBlock.y &&
                projectile.y - projectile.radius < stoneBlock.y + stoneBlock.height
            ) {
                // 投射物撞到石块，移除投射物
                ObjectPool.recycleProjectile(projectile);
                game.projectiles.splice(i, 1);
                hitStone = true;
                break;
            }
        }
        
        if (hitStone) continue;
        
        // 检测投射物与砖块碰撞
        let hitBrick = false;
        for (let j = game.brickBlocks.length - 1; j >= 0; j--) {
            const brickBlock = game.brickBlocks[j];
            if (
                projectile.x + projectile.radius > brickBlock.x &&
                projectile.x - projectile.radius < brickBlock.x + brickBlock.width &&
                projectile.y + projectile.radius > brickBlock.y &&
                projectile.y - projectile.radius < brickBlock.y + brickBlock.height
            ) {
                // 砖块受到伤害
                brickBlock.health -= projectile.damage;
                
                // 生成击中粒子效果
                for (let k = 0; k < 5; k++) {
                    game.particles.push({
                        x: brickBlock.x + brickBlock.width / 2,
                        y: brickBlock.y + brickBlock.height / 2,
                        dx: randomBetween(-3, 3),
                        dy: randomBetween(-3, 3),
                        radius: randomBetween(1, 3),
                        color: '#CD853F',
                        lifetime: 20
                    });
                }
                
                // 如果砖块被摧毁
                if (brickBlock.health <= 0) {
                    // 移除砖块
                    game.brickBlocks.splice(j, 1);
                    
                    // 增加玩家经验和分数（比打怪少）
                    game.player.exp += 3;
                    game.score += 5;
                    
                    // 显示经验和分数获得
                    createExperienceNumber(brickBlock.x + brickBlock.width / 2, brickBlock.y, 3);
                    createFloatingText(brickBlock.x + brickBlock.width / 2, brickBlock.y - 20, '+5', '#FFD700', 60, 1.2);
                    
                    // 生成破坏粒子效果
                    for (let k = 0; k < 12; k++) {
                        game.particles.push({
                            x: brickBlock.x + brickBlock.width / 2,
                            y: brickBlock.y + brickBlock.height / 2,
                            dx: randomBetween(-5, 5),
                            dy: randomBetween(-5, 5),
                            radius: randomBetween(2, 5),
                            color: config.colors.brick,
                            lifetime: 30
                        });
                    }
                }
                
                // 移除投射物
                ObjectPool.recycleProjectile(projectile);
                game.projectiles.splice(i, 1);
                hitBrick = true;
                break;
            }
        }
        
        if (hitBrick) continue;
        
        // 敌人投射物与玩家碰撞检测
        if (projectile.owner === 'enemy') {
            const dx = projectile.x - game.player.x;
            const dy = projectile.y - game.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < projectile.radius + game.player.radius) {
                // v4.1.7: 安全区保护 - 玩家在安全区内免疫投射物伤害
                if (window.safeZoneSystem && window.safeZoneSystem.isInSafeZone(game.player.x, game.player.y)) {
                    // 在安全区内显示保护提示
                    if (Math.random() < 0.2) { // 20%概率显示提示
                        createFloatingText(game.player.x, game.player.y - 30, "安全区保护", "#00ff00", 60, 1.2);
                    }
                    // 移除投射物但不造成伤害
                    ObjectPool.recycleProjectile(projectile);
                    game.projectiles.splice(i, 1);
                    continue;
                }
                
                // 造成伤害
                game.player.health -= projectile.damage;
                
                // 创建伤害数值显示
                createDamageNumber(game.player.x, game.player.y, projectile.damage);
                
                // 击退效果
                const angle = Math.atan2(dy, dx);
                const knockback = 8;
                game.player.dx += Math.cos(angle) * knockback;
                game.player.dy += Math.sin(angle) * knockback;
                
                // 移除投射物
                ObjectPool.recycleProjectile(projectile);
                game.projectiles.splice(i, 1);
                continue;
            }
        }
        
        // 距离检查优化
        const dx = projectile.x - game.player.x;
        const dy = projectile.y - game.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 1000) {
            ObjectPool.recycleProjectile(projectile);
            game.projectiles.splice(i, 1);
        }
    }
}

// 更新友方球球
function updateFriendlyBalls() {
    for (let i = game.friendlyBalls.length - 1; i >= 0; i--) {
        const friendly = game.friendlyBalls[i];
        
        // 跟随玩家逻辑
        const dx = game.player.x - friendly.x;
        const dy = game.player.y - friendly.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > friendly.followDistance) {
            friendly.dx = (dx / distance) * friendly.speed;
            friendly.dy = (dy / distance) * friendly.speed;
        } else {
            friendly.dx *= 0.9;
            friendly.dy *= 0.9;
        }
        
        // 攻击最近的敌人
        let closestEnemy = null;
        let closestDistance = friendly.attackRange;
        
        for (const enemy of game.enemies) {
            const edx = enemy.x - friendly.x;
            const edy = enemy.y - friendly.y;
            const edist = Math.sqrt(edx * edx + edy * edy);
            
            if (edist < closestDistance) {
                closestEnemy = enemy;
                closestDistance = edist;
            }
        }
        
        if (closestEnemy && friendly.lastAttackTime <= 0) {
            const angle = Math.atan2(closestEnemy.y - friendly.y, closestEnemy.x - friendly.x);
            game.projectiles.push({
                x: friendly.x,
                y: friendly.y,
                dx: Math.cos(angle) * 8,
                dy: Math.sin(angle) * 8,
                radius: 6,
                damage: friendly.damage,
                owner: 'player',
                lifetime: 80,
                active: true
            });
            friendly.lastAttackTime = 30;
        }
        
        if (friendly.lastAttackTime > 0) {
            friendly.lastAttackTime--;
        }
        
        // 更新位置
        friendly.x += friendly.dx;
        friendly.y += friendly.dy;
        
        // 健康检查
        if (friendly.health <= 0) {
            game.friendlyBalls.splice(i, 1);
        }
    }
}

// 更新带刺球球
function updateSpikedBalls() {
    for (let i = game.spikedBalls.length - 1; i >= 0; i--) {
        const spiked = game.spikedBalls[i];
        
        // 更新位置和旋转
        spiked.x += spiked.dx;
        spiked.y += spiked.dy;
        spiked.rotationAngle += spiked.rotationSpeed;
        
        // 与玩家碰撞检测
        if (checkCollision(spiked, game.player)) {
            // v4.1.7: 安全区保护 - 玩家在安全区内免疫刺球伤害
            if (window.safeZoneSystem && window.safeZoneSystem.isInSafeZone(game.player.x, game.player.y)) {
                // 在安全区内显示保护提示
                if (Math.random() < 0.2) { // 20%概率显示提示
                    createFloatingText(game.player.x, game.player.y - 30, "安全区保护", "#00ff00", 60, 1.2);
                }
                // 移除刺球但不造成伤害
                game.spikedBalls.splice(i, 1);
                continue;
            }
            
            game.player.health -= spiked.damage;
            
            // 创建伤害数值显示
            createDamageNumber(game.player.x, game.player.y, spiked.damage);
            
            // 移除带刺球球
            game.spikedBalls.splice(i, 1);
            continue;
        }
        
        // 距离检查
        const dx = spiked.x - game.player.x;
        const dy = spiked.y - game.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 1200) {
            game.spikedBalls.splice(i, 1);
        }
    }
}

// 更新泡泡道具
function updateBubblePowerups() {
    for (let i = game.bubblePowerups.length - 1; i >= 0; i--) {
        const bubble = game.bubblePowerups[i];
        
        // 更新位置和效果
        bubble.x += bubble.vx;
        bubble.y += bubble.vy;
        bubble.glowPhase += 0.1;
        bubble.lifetime--;
        
        // 与玩家碰撞检测
        if (checkCollision(bubble, game.player)) {
            applyBubblePowerup(bubble);
            game.bubblePowerups.splice(i, 1);
            continue;
        }
        
        // 生命周期检查
        if (bubble.lifetime <= 0) {
            game.bubblePowerups.splice(i, 1);
        }
    }
}

// 应用泡泡道具效果
function applyBubblePowerup(bubble) {
    const typeConfig = config.bubblePowerup.types[bubble.type];
    
    switch(bubble.type) {
        case 'red':
            game.player.powerups.red.active = true;
            game.player.powerups.red.duration = typeConfig.duration;
            break;
        case 'blue':
            game.player.powerups.blue.active = true;
            game.player.powerups.blue.duration = typeConfig.duration;
            break;
        case 'green':
            game.player.health = Math.min(game.player.maxHealth, 
                game.player.health + typeConfig.healAmount);
            break;
        case 'yellow':
            game.player.powerups.yellow.active = true;
            game.player.powerups.yellow.duration = typeConfig.duration;
            break;
        case 'purple':
            game.player.powerups.shield.active = true;
            game.player.powerups.shield.duration = typeConfig.duration;
            break;
    }
    
    // 显示获得提示
    createFloatingText(bubble.x, bubble.y, typeConfig.name, bubble.color, 60, 1.2);
}

// 更新粒子效果
function updateParticles() {
    for (let i = game.particles.length - 1; i >= 0; i--) {
        const particle = game.particles[i];
        
        // 更新位置
        particle.x += particle.dx;
        particle.y += particle.dy;
        
        // 应用阻力
        particle.dx *= 0.98;
        particle.dy *= 0.98;
        
        // 更新生命周期
        particle.lifetime--;
        
        // 移除过期粒子
        if (particle.lifetime <= 0) {
            game.particles.splice(i, 1);
        }
    }
}

// 更新浮动文本显示
function updateFloatingTexts() {
    for (let i = game.floatingTexts.length - 1; i >= 0; i--) {
        const floatingText = game.floatingTexts[i];
        
        // 更新位置
        floatingText.y += floatingText.dy;
        floatingText.dy *= 0.98;
        
        // 更新透明度
        floatingText.lifetime--;
        floatingText.alpha = floatingText.lifetime / 60;
        
        // 移除过期的文本
        if (floatingText.lifetime <= 0) {
            game.floatingTexts.splice(i, 1);
        }
    }
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

// 更新AOE圈圈效果
function updateAOERings() {
    for (let i = game.aoeRings.length - 1; i >= 0; i--) {
        const ring = game.aoeRings[i];
        
        // 延迟生成效果
        if (ring.age > 0) {
            ring.age--;
            continue;
        }
        
        // 扩散圈圈
        ring.radius += ring.speed;
        ring.lifetime--;
        
        // 移除过期的圈圈
        if (ring.lifetime <= 0 || ring.radius >= ring.maxRadius) {
            game.aoeRings.splice(i, 1);
        }
    }
}

// 动态生成新的生成点
// 更新生成点击杀统计
function updateSpawnPointKillStats(enemyX, enemyY) {
    const currentTime = Date.now();
    
    // 查找附近的生成点（300像素范围内）
    for (const spawnPoint of game.spawnPoints) {
        const dx = spawnPoint.x - enemyX;
        const dy = spawnPoint.y - enemyY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 300) {
            spawnPoint.killCount++;
            spawnPoint.lastKillTime = currentTime;
        }
    }
}

// 预生成怪物函数
function preSpawnMonstersAtPoint(spawnPoint) {
    if (spawnPoint.preSpawned) return;
    
    const preSpawnCount = spawnPoint.density === 'high' ? randomBetween(3, 6) : 
                         spawnPoint.density === 'medium' ? randomBetween(2, 4) : 
                         randomBetween(1, 3);
    
    for (let i = 0; i < preSpawnCount; i++) {
        const offsetX = randomBetween(-150, 150);
        const offsetY = randomBetween(-150, 150);
        const enemyX = spawnPoint.x + offsetX;
        const enemyY = spawnPoint.y + offsetY;
        
        // 检查是否在安全区内，如果在安全区内则跳过这个怪物
        if (window.safeZoneSystem && window.safeZoneSystem.isInSafeZone(enemyX, enemyY)) {
            continue; // 安全区内不生成怪物
        }
        
        // 选择敌人类型，包含精英怪物生成逻辑
        let enemyType;
        
        // 检查是否生成精英怪物
        const distanceToPlayer = Math.sqrt(
            Math.pow(enemyX - game.player.x, 2) + 
            Math.pow(enemyY - game.player.y, 2)
        );
        
        if (distanceToPlayer >= config.enemies.eliteMinDistance && 
            distanceToPlayer <= config.enemies.eliteMaxDistance && 
            Math.random() < config.enemies.eliteSpawnChance) {
            enemyType = 'elite';
        } else {
            // 普通敌人类型
            const normalTypes = ['red', 'blue', 'white', 'black', 'largered', 'rotating', 'teleport', 'snake', 'yellow', 'control'];
            enemyType = normalTypes[Math.floor(Math.random() * normalTypes.length)];
        }
        
        const enemy = createEnemy(enemyX, enemyY, enemyType);
         if (enemy) {
             console.log(`[DEBUG] preSpawnMonstersAtPoint创建怪物成功: type=${enemyType}, level=${enemy.level}, distanceFromSpawn=${enemy.distanceFromSpawn}`);
         } else {
             console.error(`[ERROR] createEnemy返回null: x=${enemyX}, y=${enemyY}, type=${enemyType}`);
             continue; // 跳过这个怪物，继续创建下一个
         }
        // createEnemy已经将enemy添加到game.enemies数组中，无需重复添加
        
        monsterStats.totalSpawned++;
        monsterStats.spawnedByType[enemyType]++;
    }
    
    spawnPoint.preSpawned = true;
    spawnPoint.enemiesSpawned += preSpawnCount;
}

function generateNewSpawnPoints() {
    const minSpawnPoints = 40;
    const maxSpawnPoints = 100;
    const generationRadius = 4000;
    
    const playerSpeed = Math.sqrt(game.player.dx * game.player.dx + game.player.dy * game.player.dy);
    const speedBasedMin = Math.max(minSpawnPoints, Math.floor(minSpawnPoints + playerSpeed * 2));
    
    if (game.spawnPoints.length < speedBasedMin) {
        const pointsToGenerate = Math.min(8, maxSpawnPoints - game.spawnPoints.length);
        
        for (let i = 0; i < pointsToGenerate; i++) {
            const densityRoll = Math.random();
            let distance, minDistance;
            
            if (densityRoll < 0.3) {
                distance = randomBetween(600, 1200);
                minDistance = 200;
            } else if (densityRoll < 0.7) {
                distance = randomBetween(1200, 2000);
                minDistance = 350;
            } else {
                distance = randomBetween(2000, generationRadius);
                minDistance = 500;
            }
            
            const angle = Math.random() * Math.PI * 2;
            const x = game.player.x + Math.cos(angle) * distance;
            const y = game.player.y + Math.sin(angle) * distance;
            
            let tooClose = false;
            for (const existingPoint of game.spawnPoints) {
                const dx = existingPoint.x - x;
                const dy = existingPoint.y - y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDistance) {
                    tooClose = true;
                    break;
                }
            }
            
            if (!tooClose) {
                const spawnPoint = {
                    x: x,
                    y: y,
                    radius: 30,
                    isActive: false,
                    cooldownTimer: 0,
                    enemiesSpawned: 0,
                    lastActivationTime: 0,
                    density: densityRoll < 0.3 ? 'high' : (densityRoll < 0.7 ? 'medium' : 'low'),
                    // 新增：预生成和区域管理
                    preSpawned: false,
                    areaCooldown: 0,
                    killCount: 0,
                    lastKillTime: 0,
                    spawnRate: 1.0
                };
                
                // 30%概率预生成怪物
                if (Math.random() < 0.3) {
                    preSpawnMonstersAtPoint(spawnPoint);
                }
                
                game.spawnPoints.push(spawnPoint);
            }
        }
    }
}

// 更新相机位置
function updateCamera() {
    const playerSpeed = Math.sqrt(game.player.dx * game.player.dx + game.player.dy * game.player.dy);
    
    // 预测性相机偏移
    const lookAheadFactor = Math.min(playerSpeed * 3, 100);
    const lookAheadX = game.player.dx > 0 ? lookAheadFactor : (game.player.dx < 0 ? -lookAheadFactor : 0);
    const lookAheadY = game.player.dy > 0 ? lookAheadFactor * 0.5 : (game.player.dy < 0 ? -lookAheadFactor * 0.5 : 0);
    
    game.camera.targetX = game.player.x - game.gameWidth / 2 + lookAheadX;
    game.camera.targetY = game.player.y - game.gameHeight / 2 + lookAheadY;
    
    // 动态调整相机平滑度
    const dynamicSmoothness = Math.max(config.camera.smoothness, config.camera.smoothness + playerSpeed * 0.01);
    
    game.camera.x += (game.camera.targetX - game.camera.x) * dynamicSmoothness;
    game.camera.y += (game.camera.targetY - game.camera.y) * dynamicSmoothness;
}

// 生成泡泡道具
function generateBubblePowerups() {
    if (Math.random() < config.bubblePowerup.spawnChance) {
        const angle = Math.random() * Math.PI * 2;
        const distance = randomBetween(config.bubblePowerup.spawnDistance * 0.5, config.bubblePowerup.spawnDistance);
        
        let bubbleType = 'normal';
        let cumulativeChance = 0;
        const rand = Math.random();
        
        for (const [type, typeConfig] of Object.entries(config.bubblePowerup.types)) {
            cumulativeChance += typeConfig.chance;
            if (rand <= cumulativeChance) {
                bubbleType = type;
                break;
            }
        }
        
        const typeConfig = config.bubblePowerup.types[bubbleType];
        
        const bubble = {
            x: game.player.x + Math.cos(angle) * distance,
            y: game.player.y + Math.sin(angle) * distance,
            radius: config.bubblePowerup.radius,
            health: config.bubblePowerup.health,
            maxHealth: config.bubblePowerup.health,
            vx: (Math.random() - 0.5) * config.bubblePowerup.floatSpeed,
            vy: (Math.random() - 0.5) * config.bubblePowerup.floatSpeed,
            lifetime: config.bubblePowerup.lifetime,
            maxLifetime: config.bubblePowerup.lifetime,
            glowPhase: Math.random() * Math.PI * 2,
            type: bubbleType,
            color: typeConfig.color,
            glowColor: typeConfig.glowColor
        };
        
        game.bubblePowerups.push(bubble);
    }
}

// 清理远离玩家的地图元素
function cleanupDistantMapElements() {
    const cleanupDistance = 4000; // 清理距离
    const playerX = game.player.x;
    const playerY = game.player.y;
    
    // 清理远离的平台（保留初始平台）
    game.platforms = game.platforms.filter((platform, index) => {
        if (index === 0) return true; // 保留初始平台
        const dx = platform.x + platform.width/2 - playerX;
        const dy = platform.y - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < cleanupDistance;
    });
    
    // 清理远离的土地方块
    game.groundBlocks = game.groundBlocks.filter(block => {
        const dx = block.x + block.width/2 - playerX;
        const dy = block.y + block.height/2 - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < cleanupDistance;
    });
    
    // 清理远离的大陆方块
    game.mainlandBlocks = game.mainlandBlocks.filter(block => {
        const dx = block.x + block.width/2 - playerX;
        const dy = block.y + block.height/2 - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < cleanupDistance;
    });
    
    // 清理远离的石块
    game.stoneBlocks = game.stoneBlocks.filter(block => {
        const dx = block.x + block.width/2 - playerX;
        const dy = block.y + block.height/2 - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < cleanupDistance;
    });
    
    // 清理远离的砖块
    game.brickBlocks = game.brickBlocks.filter(block => {
        const dx = block.x + block.width/2 - playerX;
        const dy = block.y + block.height/2 - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < cleanupDistance;
    });
    
    // 清理远离的云朵
    game.clouds = game.clouds.filter(cloud => {
        const dx = cloud.x + cloud.width/2 - playerX;
        const dy = cloud.y + cloud.height/2 - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < cleanupDistance;
    });
    
    // 清理远离的弹床
    game.trampolines = game.trampolines.filter(trampoline => {
        const dx = trampoline.x + trampoline.width/2 - playerX;
        const dy = trampoline.y + trampoline.height/2 - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < cleanupDistance;
    });
    

    
    // 清理远离的生成点
    game.spawnPoints = game.spawnPoints.filter(spawnPoint => {
        const dx = spawnPoint.x - playerX;
        const dy = spawnPoint.y - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < cleanupDistance * 1.5; // 生成点保留更远距离
    });
}

// 动态生成地图元素 - 完全按照原版3.6.3实现

// 动态生成地图元素 - 完全按照原版3.6.3实现
function generatePlatformBelowPlayer() {
    // 预测性生成 - 根据玩家移动方向生成内容
    const playerVelocity = Math.sqrt(game.player.dx * game.player.dx + game.player.dy * game.player.dy);
    const lookAheadDistance = Math.max(800, playerVelocity * 50); // 根据速度调整预测距离
    
    // 检查玩家移动方向的区域
    const directions = [
        { x: 0, y: 1, name: 'below' },     // 下方
        { x: game.player.dx > 0 ? 1 : -1, y: 0, name: 'horizontal' }, // 水平方向
        { x: game.player.dx > 0 ? 1 : -1, y: 1, name: 'diagonal' }   // 对角线方向
    ];
    
    for (const dir of directions) {
        const checkX = game.player.x + dir.x * lookAheadDistance;
        const checkY = game.player.y + dir.y * lookAheadDistance;
        
        // 检查该区域是否需要生成平台
        if (shouldGeneratePlatformInArea(checkX, checkY, dir.name)) {
            generatePlatformInArea(checkX, checkY, dir.name);
        }
    }
}

// 检查区域是否需要生成平台
function shouldGeneratePlatformInArea(centerX, centerY, areaType) {
    const searchRadius = areaType === 'below' ? 400 : 600;
    let platformCount = 0;
    
    for (const platform of game.platforms) {
        const dx = platform.x + platform.width/2 - centerX;
        const dy = platform.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < searchRadius) {
            platformCount++;
        }
    }
    
    // 根据区域类型决定最小平台数量
    const minPlatforms = areaType === 'below' ? 1 : 2;
    return platformCount < minPlatforms;
}

// 在指定区域生成平台
function generatePlatformInArea(centerX, centerY, areaType) {
    const platformsToGenerate = areaType === 'below' ? 1 : randomBetween(2, 4);
    
    for (let i = 0; i < platformsToGenerate; i++) {
        const width = randomBetween(config.platforms.minWidth, config.platforms.maxWidth);
        const x = centerX - width/2 + randomBetween(-200, 200);
        const y = centerY + randomBetween(-100, 100);
        const isGroundBlock = Math.random() < config.platforms.groundBlockChance;
        const isMainland = Math.random() < config.platforms.mainlandChance;
        
        // 防止元素堆叠 - 每个平台只能有一种装饰元素
        let hasStoneBlock = false;
        let hasBrickBlock = false;
        let hasCloud = false;
        
        // 随机选择一种装饰元素类型
        const decorationRoll = Math.random();
        if (decorationRoll < config.platforms.stoneBlockChance) {
            hasStoneBlock = true;
        } else if (decorationRoll < config.platforms.stoneBlockChance + config.platforms.brickBlockChance) {
            hasBrickBlock = true;
        } else if (decorationRoll < config.platforms.stoneBlockChance + config.platforms.brickBlockChance + config.platforms.cloudChance) {
            hasCloud = true;
        }
        // 否则该平台没有装饰元素

        
        let newPlatform;
        
        // 如果是大陆地区块，调整尺寸
        if (isMainland) {
            const mainlandWidth = randomBetween(config.platforms.mainlandMinWidth, config.platforms.mainlandMaxWidth);
            newPlatform = {
                x: x,
                y: y,
                width: mainlandWidth,
                height: config.platforms.mainlandHeight,
                isGroundBlock: false,
                isMainland: true,
                hasStoneBlock: hasStoneBlock,
                hasBrickBlock: hasBrickBlock,
                hasCloud: hasCloud
            };
        } else {
            newPlatform = {
                x: x,
                y: y,
                width: width,
                height: config.platforms.height,
                isGroundBlock: isGroundBlock,
                isMainland: false,
                hasStoneBlock: hasStoneBlock,
                hasBrickBlock: hasBrickBlock,
                hasCloud: hasCloud
            };
        }
        
        game.platforms.push(newPlatform);
        
        // 如果是土地方块平台，则生成土地方块
        if (isGroundBlock) {
            const blockCount = Math.floor(width / 40);
            for (let i = 0; i < blockCount; i++) {
                game.groundBlocks.push({
                    x: x + i * 40,
                    y: y - 40,
                    width: 40,
                    height: 40
                });
            }
        }
        
        // 如果是大陆地区块平台，则生成大陆区块
        if (isMainland) {
            const blockCount = Math.floor(newPlatform.width / 40);
            const heightBlocks = Math.floor(newPlatform.height / 40);
            
            for (let i = 0; i < blockCount; i++) {
                for (let j = 0; j < heightBlocks; j++) {
                    game.mainlandBlocks.push({
                        x: newPlatform.x + i * 40,
                        y: newPlatform.y - (j + 1) * 40,
                        width: 40,
                        height: 40
                    });
                }
            }
        }
        
        // 如果有石块，生成石块
        if (hasStoneBlock) {
            const blockCount = Math.floor(newPlatform.width / 40);
            const heightBlocks = randomBetween(1, 3);  // 石块高度1-3层
            
            for (let i = 0; i < blockCount; i++) {
                for (let j = 0; j < heightBlocks; j++) {
                    game.stoneBlocks.push({
                        x: newPlatform.x + i * 40,
                        y: newPlatform.y - (j + 1) * 40,
                        width: 40,
                        height: 40
                    });
                }
            }
        }
        
        // 如果有砖块，生成砖块
        if (hasBrickBlock) {
            const blockCount = Math.floor(newPlatform.width / 40);
            const heightBlocks = randomBetween(1, 2);  // 砖块高度1-2层
            
            for (let i = 0; i < blockCount; i++) {
                for (let j = 0; j < heightBlocks; j++) {
                    game.brickBlocks.push({
                        x: newPlatform.x + i * 40,
                        y: newPlatform.y - (j + 1) * 40,
                        width: 40,
                        height: 40,
                        health: 2  // 砖块生命值
                    });
                }
            }
        }
        
        // 如果有云朵，生成云朵
        if (hasCloud) {
            const cloudWidth = randomBetween(80, 150);
            const cloudHeight = 30;
            
            game.clouds.push({
                x: x + randomBetween(0, width - cloudWidth),
                y: y - cloudHeight - 10,
                width: cloudWidth,
                height: cloudHeight
            });
        }
        

    }
}

// 区域怪物上限控制 - v3.9.18
function enforceAreaMonsterLimits() {
    const regionSize = Math.max(game.gameWidth, game.gameHeight); // 区域大小
    const playerScreenX = Math.floor(game.player.x / regionSize);
    const playerScreenY = Math.floor(game.player.y / regionSize);
    
    // 统计各区域的怪物数量
    const areaMonsterCount = new Map();
    for (const enemy of game.enemies) {
        const areaX = Math.floor(enemy.x / regionSize);
        const areaY = Math.floor(enemy.y / regionSize);
        const areaKey = `${areaX},${areaY}`;
        areaMonsterCount.set(areaKey, (areaMonsterCount.get(areaKey) || 0) + 1);
    }
    
    // 检查玩家周围区域的怪物上限
    const checkRange = 3; // 检查玩家周围3x3区域
    for (let dx = -checkRange; dx <= checkRange; dx++) {
        for (let dy = -checkRange; dy <= checkRange; dy++) {
            const areaX = playerScreenX + dx;
            const areaY = playerScreenY + dy;
            const areaKey = `${areaX},${areaY}`;
            const currentCount = areaMonsterCount.get(areaKey) || 0;
            
            // 计算该区域的怪物上限
            const distance = Math.sqrt(dx * dx + dy * dy);
            let maxMonstersInArea;
            if (distance <= 1) {
                maxMonstersInArea = 12; // 玩家附近区域上限12个
            } else if (distance <= 2) {
                maxMonstersInArea = 8;  // 中距离区域上限8个
            } else {
                maxMonstersInArea = 5;  // 远距离区域上限5个
            }
            
            // 如果超过上限，移除多余怪物
            if (currentCount > maxMonstersInArea) {
                const areaEnemies = game.enemies.filter(enemy => {
                    const eAreaX = Math.floor(enemy.x / regionSize);
                    const eAreaY = Math.floor(enemy.y / regionSize);
                    return eAreaX === areaX && eAreaY === areaY;
                });
                
                // 分离精英怪物和普通怪物
                const normalEnemies = areaEnemies.filter(enemy => enemy.type !== 'elite');
                const eliteEnemies = areaEnemies.filter(enemy => enemy.type === 'elite');
                
                // 优先移除普通怪物，保护精英怪物
                normalEnemies.sort((a, b) => a.health - b.health);
                const toRemove = Math.min(currentCount - maxMonstersInArea, 3); // 限制单次清理数量
                
                let removedCount = 0;
                // 先移除普通怪物
                for (let i = 0; i < normalEnemies.length && removedCount < toRemove; i++) {
                    const enemyToRemove = normalEnemies[i];
                    const index = game.enemies.indexOf(enemyToRemove);
                    if (index !== -1) {
                        game.enemies.splice(index, 1);
                        removedCount++;
                    }
                }
                
                // 如果还需要移除且只剩精英怪物，才移除精英怪物
                if (removedCount < toRemove && eliteEnemies.length > 0) {
                    eliteEnemies.sort((a, b) => a.health - b.health);
                    for (let i = 0; i < eliteEnemies.length && removedCount < toRemove; i++) {
                        const enemyToRemove = eliteEnemies[i];
                        const index = game.enemies.indexOf(enemyToRemove);
                        if (index !== -1) {
                            game.enemies.splice(index, 1);
                            removedCount++;
                        }
                    }
                }
            }
        }
    }
}

// 强制怪物密度控制
function enforceMonsterDensity() {
    const screenRanges = 9; // 九个屏幕范围
    const screenSize = Math.max(game.gameWidth, game.gameHeight);
    const totalRange = screenSize * screenRanges;
    
    // 计算范围内的敌人数量
    const enemiesInRange = game.enemies.filter(enemy => {
        if (!enemy || enemy.x === undefined || enemy.y === undefined) {
            return false;
        }
        const dx = enemy.x - game.player.x;
        const dy = enemy.y - game.player.y;
        return Math.sqrt(dx * dx + dy * dy) < totalRange;
    }).length;
    
    // 动态调整最小怪物数量阈值 - 降低基础数量
    const baseMinEnemies = Math.max(8, Math.floor(screenRanges * 1.5)); // 从15降到8，倍数从3降到1.5
    const playerLevel = game.player.level || 1;
    const minEnemies = Math.floor(baseMinEnemies + playerLevel * 0.3); // 从0.5降到0.3
    
    // 如果敌人数量低于阈值，增加刷怪速度
    if (enemiesInRange < minEnemies) {
        const shortage = minEnemies - enemiesInRange;
        const urgencyMultiplier = Math.min(2.0, 1.0 + shortage * 0.05); // 从3.0降到2.0，从0.1降到0.05
        
        // 提升所有生成点的生成速度
        for (const spawnPoint of game.spawnPoints) {
            if (spawnPoint.areaCooldown <= 0) {
                spawnPoint.spawnRate = Math.min(2.0, spawnPoint.spawnRate * urgencyMultiplier);
                // 减少冷却时间
                if (spawnPoint.cooldownTimer > 0) {
                    spawnPoint.cooldownTimer = Math.max(1, Math.floor(spawnPoint.cooldownTimer * 0.5));
                }
            }
        }
        
        // 强制生成怪物补充数量 - 降低单次生成数量
        const spawnCount = Math.min(shortage, 2); // 从5降到2
        for (let i = 0; i < spawnCount; i++) {
            spawnEnemyNearPlayer();
        }
    } else if (enemiesInRange > minEnemies * 1.5) {
        // 如果怪物过多，降低生成速度
        for (const spawnPoint of game.spawnPoints) {
            spawnPoint.spawnRate = Math.max(0.3, spawnPoint.spawnRate * 0.9);
        }
    }
}

// 更新狂潮模式
function updateFrenzyMode() {
    if (game.frenzyMode.active) {
        game.frenzyMode.duration--;
        if (game.frenzyMode.duration <= 0) {
            game.frenzyMode.active = false;
            game.frenzyMode.cooldown = game.frenzyMode.maxCooldown;
        }
    } else if (game.frenzyMode.cooldown > 0) {
        game.frenzyMode.cooldown--;
    }
    
    // 检查激活条件
    if (!game.frenzyMode.active && game.frenzyMode.cooldown <= 0) {
        const nearbyEnemies = game.enemies.filter(enemy => {
            if (!enemy || enemy.x === undefined || enemy.y === undefined) {
                return false;
            }
            const dx = enemy.x - game.player.x;
            const dy = enemy.y - game.player.y;
            return Math.sqrt(dx * dx + dy * dy) < 500;
        }).length;
        
        if (nearbyEnemies >= 8) {  // 降低触发条件从15到8个敌人
            game.frenzyMode.active = true;
            game.frenzyMode.duration = game.frenzyMode.maxDuration;
        }
    }
}

// 模块导出（支持Node.js环境）
// 全局函数暴露
window.update = update;
window.updatePlayer = updatePlayer;
window.startDash = startDash;
window.startVerticalDash = startVerticalDash;
window.createExplosion = createExplosion;
window.createDamageNumber = createDamageNumber;
window.createExperienceNumber = createExperienceNumber;
window.createFloatingText = createFloatingText;
window.randomBetween = randomBetween;
window.activateWindFireWheels = activateWindFireWheels;
window.updateWindFireWheels = updateWindFireWheels;
window.activateLaser = activateLaser;
window.updateLaser = updateLaser;
window.checkCollisionAtPosition = checkCollisionAtPosition;
window.checkLevelUp = checkLevelUp;
window.monsterStats = monsterStats;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        collisionSystem,
        updateSpawnPoints,
        spawnEnemyAtPoint,
        createEnemy,
        getEnemyBaseSpeed,
        applyEnemyTypeProperties,
        update,
        updateEnemySpawning,
        spawnEnemyNearPlayer,
        updateSpikedBallSpawning,
        updateResourceRecovery,
        updateSkillCooldowns,
        updateGameObjects,
        updateGameObjectsWithInputHandler,
        updateEnemies,
        updateEnemyByType,
        updateProjectiles,
        updateFriendlyBalls,
        updateSpikedBalls,
        updateBubblePowerups,
        updateParticles,
        updateFloatingTexts,
        updateAOERings,
        handlePlatformCollision,
        checkCollision,
        createExplosion,
        startDash,
        startVerticalDash,
        createDamageNumber,
        createCriticalDisplay,
        createExperienceNumber,
        createFloatingText,
        generateNewSpawnPoints,
        updateCamera,
        generateBubblePowerups,

        cleanupDistantMapElements,
        generatePlatformBelowPlayer,
        enforceMonsterDensity,
        enforceAreaMonsterLimits,
        updateFrenzyMode,
        randomBetween,
        activateWindFireWheels,
        updateWindFireWheels,
        activateLaser,
        updateLaser,
        checkCollisionAtPosition,
        checkLevelUp,
        monsterStats
    };
}