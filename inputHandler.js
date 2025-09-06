// 球球大冒险 - 输入处理和动作控制模块
// 监听和处理键盘、鼠标、触摸等用户输入事件
// 包含玩家移动、敌人AI、碰撞检测等所有动作相关代码
// 完全按照原版球球大冒险3.6.3.html实现

// 工具函数
function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

// 通用碰撞检测函数
function checkCollision(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < obj1.radius + obj2.radius;
}

// collisionSystem 使用 utils.js 中的全局定义

// 处理平台碰撞
function handlePlatformCollision(player, platform) {
    player.y = platform.y - player.radius;
    player.dy = 0;
    player.isJumping = false;
    player.jumpCount = 0;  // 着陆时重置跳跃计数器
    return true;
}

// 键盘按下事件处理
function handleKeyDown(e) {
    // 统一处理键名，确保使用小写
    const key = e.key.toLowerCase();
    
    // 特殊处理方向键
    if (key === 'arrowleft') game.keys['a'] = true;
    else if (key === 'arrowright') game.keys['d'] = true;
    else if (key === 'arrowup') game.keys['w'] = true;
    else if (key === 'arrowdown') game.keys['s'] = true;
    else game.keys[key] = true;
    
    // 记录按键时间
    if (key === 'a' || key === 'd' || key === 'w' || key === 's' || key === 'arrowleft' || key === 'arrowright' || key === 'arrowup' || key === 'arrowdown') {
        const simpleKey = key === 'arrowleft' ? 'a' : key === 'arrowright' ? 'd' : key === 'arrowup' ? 'w' : key === 'arrowdown' ? 's' : key;
        game.player.lastKeyPressTime[simpleKey] = performance.now();
    }
    
    // ~键切换统计界面显示
    if (key === '`' || key === '~') {
        if (!game.ui) game.ui = {};
        game.ui.showDetailedStats = !game.ui.showDetailedStats;
    }
    
    // X键激活风火轮技能
    if (key === 'x' && game.player.rage >= 15 && !game.player.windFireWheels.active) {
        activateWindFireWheels();
    }
    
    // R键激活激光技能
    if (key === 'r' && game.player.mana >= game.player.laser.minMana && game.player.laser.cooldownTimer <= 0) {
        activateLaser();
    }
    
    // F键闪现技能
    if (key === 'f') {
        activateDash();
    }
    
    // L键切换伤害记录窗口
    if (key === 'l') {
        if (window.damageTracker) {
            window.damageTracker.toggleVisibility();
        }
    }
    
    // B键切换购买系统界面
    if (key === 'b') {
        if (window.shopSystem) {
            window.shopSystem.toggleShop();
        }
    }
    
    // 数字键购买商品（仅在商店打开时有效）
    if (window.shopSystem && window.shopSystem.isShopOpen) {
        const numKey = parseInt(key);
        if (numKey >= 1 && numKey <= 10) {
            const result = window.shopSystem.buyItem(numKey);
            if (result.success) {
                // 购买成功，显示成功消息
                console.log(result.message);
            } else {
                // 购买失败，显示失败原因
                console.log(result.message);
                
                // 显示失败提示的浮动文字（如果存在）
                if (window.createFloatingText && window.player) {
                    window.createFloatingText(
                        window.player.x,
                        window.player.y - 50,
                        result.message,
                        '#ff4444',
                        2000
                    );
                }
            }
        }
    }
}

// 键盘释放事件处理
function handleKeyUp(e) {
    const key = e.key.toLowerCase();
    
    if (key === 'arrowleft') game.keys['a'] = false;
    else if (key === 'arrowright') game.keys['d'] = false;
    else if (key === 'arrowup') game.keys['w'] = false;
    else if (key === 'arrowdown') game.keys['s'] = false;
    else game.keys[key] = false;
    
    // R键释放时停止激光
    if (key === 'r') {
        game.player.laser.active = false;
    }
}

// 鼠标移动事件处理
function handleMouseMove(e) {
    const rect = game.canvas.getBoundingClientRect();
    game.mouse.x = e.clientX - rect.left;
    game.mouse.y = e.clientY - rect.top;
}

// 鼠标按下事件处理
function handleMouseDown(e) {
    if (e.button === 0) game.mouse.left = true;
    if (e.button === 2) game.mouse.right = true;
    e.preventDefault(); // 防止右键菜单
}

// 鼠标释放事件处理
function handleMouseUp(e) {
    if (e.button === 0) game.mouse.left = false;
    if (e.button === 2) game.mouse.right = false;
}

// 激活风火轮技能
function activateWindFireWheels() {
    if (game.player.rage < 15) return;  // 降低激活消耗从30到15
    
    game.player.rage -= 15;
    game.player.windFireWheels.active = true;
    game.player.windFireWheels.rotationAngle = 0;
    
    // 创建四个围绕玩家的圆球
    game.player.windFireWheels.orbs = [];
    for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI * 2) / 4;
        game.player.windFireWheels.orbs.push({
            angle: angle,
            x: 0,
            y: 0
        });
    }
    
    // 生成激活粒子效果
    for (let i = 0; i < 20; i++) {
        game.particles.push({
            x: game.player.x,
            y: game.player.y,
            dx: randomBetween(-5, 5),
            dy: randomBetween(-5, 5),
            radius: randomBetween(3, 6),
            color: '#FF6B35',
            lifetime: 40
        });
    }
}

// 激活闪现技能
function activateDash() {
    const currentTime = Date.now();
    
    // 检查冷却时间
    if (currentTime - game.player.dash.lastUsed < game.player.dash.cooldown * 16.67) {
        return;
    }
    
    // 检查精力值
    if (game.player.stamina <= 0) {
        return;
    }
    
    // 消耗所有精力值
    game.player.stamina = 0;
    
    // 计算闪现方向（朝鼠标方向）
    const dx = game.mouse.x - game.player.x + game.camera.x;
    const dy = game.mouse.y - game.player.y + game.camera.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        
        // 计算闪现目标位置
        const targetX = game.player.x + normalizedDx * game.player.dash.distance;
        const targetY = game.player.y + normalizedDy * game.player.dash.distance;
        
        // 检查目标位置是否有碰撞
        const canDash = !checkCollisionAtPosition(targetX, targetY, game.player.radius);
        
        if (canDash) {
            // 执行闪现
            game.player.x = targetX;
            game.player.y = targetY;
            
            // 闪现粒子效果
            for (let i = 0; i < 20; i++) {
                game.particles.push({
                    x: game.player.x + (Math.random() - 0.5) * 40,
                    y: game.player.y + (Math.random() - 0.5) * 40,
                    dx: (Math.random() - 0.5) * 10,
                    dy: (Math.random() - 0.5) * 10,
                    size: Math.random() * 6 + 3,
                    color: `hsl(${Math.random() * 60 + 180}, 100%, 70%)`,
                    alpha: 1,
                    lifetime: 40
                });
            }
        }
        
        // 更新最后使用时间
        game.player.dash.lastUsed = currentTime;
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

// 激活激光技能
function activateLaser() {
    if (game.player.mana < game.player.laser.minMana) return;
    
    game.player.laser.active = true;
    // 移除冷却时间限制，只要有魔力就能释放
    
    // 计算激光起点（玩家中心）
    game.player.laser.startX = game.player.x;
    game.player.laser.startY = game.player.y;
    
    // 计算激光终点（朝鼠标方向）
    const dx = game.mouse.x - game.player.x + game.camera.x;
    const dy = game.mouse.y - game.player.y + game.camera.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        
        game.player.laser.endX = game.player.x + normalizedDx * game.player.laser.range;
        game.player.laser.endY = game.player.y + normalizedDy * game.player.laser.range;
    }
}

// 初始化输入事件监听器
function initInputHandlers() {
    // 键盘事件
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // 鼠标事件
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    
    // 阻止右键菜单
    document.addEventListener('contextmenu', e => e.preventDefault());
}

// 导出函数（用于模块化）
// 全局函数暴露
window.handleKeyDown = handleKeyDown;
window.handleKeyUp = handleKeyUp;
window.handleMouseDown = handleMouseDown;
window.handleMouseUp = handleMouseUp;
window.handleMouseMove = handleMouseMove;
window.activateWindFireWheels = activateWindFireWheels;
window.activateDash = activateDash;
window.activateLaser = activateLaser;
window.checkCollisionAtPosition = checkCollisionAtPosition;
window.initInputHandlers = initInputHandlers;
window.updatePlayer = updatePlayer;
window.updateDash = updateDash;
window.updateChargeJump = updateChargeJump;
window.updateEnemies = updateEnemies;

// 更新玩家状态 - 完整的玩家移动和交互逻辑
function updatePlayer() {
    // 重置引力场状态
    game.player.inGravityField = false;
    game.player.gravitySlowFactor = 1.0;
    
    // 处理不动状态计时器
    if (game.player.immobilized && game.player.immobilizeTimer > 0) {
        // 检查风火轮免控效果
        if (game.player.windFireWheels && game.player.windFireWheels.active) {
            // 风火轮激活时立即解除控制状态
            game.player.immobilized = false;
            game.player.immobilizeTimer = 0;
        } else {
            game.player.immobilizeTimer--;
            if (game.player.immobilizeTimer <= 0) {
                game.player.immobilized = false;
            }
        }
    }
    
    // 碰撞检测变量声明
    let onPlatform = false;
    
    // 移动 - 不动状态下阻止移动，但风火轮激活时免疫控制
    const isControlled = game.player.immobilized && !(game.player.windFireWheels && game.player.windFireWheels.active);
    
    if (!isControlled) {
        if (game.keys['a'] || game.keys['arrowleft']) {
            if (!game.player.isDashing) {
                game.player.dx = -config.player.speed;
            }
        } else if (game.keys['d'] || game.keys['arrowright']) {
            if (!game.player.isDashing) {
                game.player.dx = config.player.speed;
            }
        } else {
            game.player.dx *= config.friction;
        }
    } else {
        // 不动状态下强制停止移动
        game.player.dx = 0;
        game.player.dy = Math.max(0, game.player.dy); // 保持重力下落
    }
    
    // 冲刺检测
    if (!game.player.isDashing && game.player.dashCooldown <= 0 && game.player.stamina >= 20) {
        const now = performance.now();
        
        // 检测左键双击
        if (game.keys['a'] || game.keys['arrowleft']) {
            if (game.player.lastKeyPressTime['a'] && now - game.player.lastKeyPressTime['a'] < 300) {
                startDash(-1); // 向左冲刺
            }
            game.player.lastKeyPressTime['a'] = now;
        }
        
        // 检测右键双击
        if (game.keys['d'] || game.keys['arrowright']) {
            if (game.player.lastKeyPressTime['d'] && now - game.player.lastKeyPressTime['d'] < 300) {
                startDash(1); // 向右冲刺
            }
            game.player.lastKeyPressTime['d'] = now;
        }
    }
    
    // 蓄力跳跃 - 只使用空格键
    if (game.keys[' '] && !game.player.isJumping && game.player.stamina >= 10) {
        if (!game.isChargingJump) {
            game.isChargingJump = true;
            game.chargeJumpTimer = 0;
        }
    } else if (game.isChargingJump && !game.player.isJumping) {
        // 释放跳跃
        const jumpForce = config.player.jumpForce * 
                         (1 + (game.chargeJumpTimer / 60) * (config.player.chargeJumpMultiplier - 1));
        game.player.dy = -jumpForce;
        game.player.isJumping = true;
        game.isChargingJump = false;
        game.chargeJumpTimer = 0;
        game.player.stamina -= 10; // 消耗精力值
        game.player.jumpCount++; // 增加跳跃计数
    }
    
    // 二段跳 - 使用W键（防止连续触发）
    if ((game.keys['w'] || game.keys['ArrowUp']) && !game.player.wKeyPressed && game.player.jumpCount < game.player.maxJumps && game.player.stamina >= 15) {
        game.player.dy = -config.player.doubleJumpForce; // 使用专门的二段跳力度
        game.player.jumpCount++; // 增加跳跃计数
        game.player.stamina -= 15; // 消耗更多精力
        game.player.wKeyPressed = true; // 标记W键已按下
        
        // 二段跳粒子效果
        for (let i = 0; i < 8; i++) {
            game.particles.push({
                x: game.player.x,
                y: game.player.y + game.player.radius,
                dx: randomBetween(-3, 3),
                dy: randomBetween(-2, 2),
                radius: randomBetween(2, 4),
                color: '#FFD700',
                lifetime: 20
            });
        }
    }
    
    // 重置W键状态
    if (!game.keys['w'] && !game.keys['ArrowUp']) {
        game.player.wKeyPressed = false;
    }
    
    // 快速下降 - 使用S键
    if ((game.keys['s'] || game.keys['ArrowDown']) && game.player.isJumping) {
        game.player.dy += config.gravity * 2; // 加速下降
    }
    
    // 应用重力
    game.player.dy += config.gravity;
    
    // 更新位置
    game.player.x += game.player.dx;
    game.player.y += game.player.dy;
    
    // 优化的碰撞检测 - 使用分层检测系统
    
    // 检测所有平台类型的碰撞（除了砖块）
    const allPlatforms = [...game.platforms, ...game.groundBlocks, ...game.mainlandBlocks, ...game.stoneBlocks];
    
    // 第一层：获取附近的平台（空间索引优化）
    const nearbyPlatforms = window.collisionSystem.getNearbyPlatforms(game.player, allPlatforms, 400);
    
    // 第二层：对附近平台进行精确碰撞检测
    for (const platform of nearbyPlatforms) {
        if (window.collisionSystem.preciseCollision(game.player, platform)) {
            onPlatform = handlePlatformCollision(game.player, platform);
            break; // 找到碰撞后立即退出
        }
    }
    
    // 砖块特殊碰撞检测（优化版）
    for (let i = game.brickBlocks.length - 1; i >= 0; i--) {
        const brickBlock = game.brickBlocks[i];
        
        // 先进行粗略距离检查
        if (!window.collisionSystem.roughDistanceCheck(game.player, brickBlock, 150)) {
            continue;
        }
        
        // 精确碰撞检测
        if (
            game.player.x + game.player.radius > brickBlock.x &&
            game.player.x - game.player.radius < brickBlock.x + brickBlock.width &&
            game.player.y + game.player.radius > brickBlock.y &&
            game.player.y - game.player.radius < brickBlock.y + brickBlock.height
        ) {
            if (game.player.dy > 0) {
                // 玩家从上方落下，正常碰撞
                game.player.y = brickBlock.y - game.player.radius;
                game.player.dy = 0;
                game.player.isJumping = false;
                game.player.jumpCount = 0;
                onPlatform = true;
            } else if (game.player.dy < 0) {
                // 玩家从下方撞击砖块，破坏砖块
                brickBlock.health -= 1;
                
                // 生成撞击粒子效果
                for (let j = 0; j < 8; j++) {
                    game.particles.push({
                        x: brickBlock.x + brickBlock.width / 2,
                        y: brickBlock.y + brickBlock.height,
                        dx: randomBetween(-3, 3),
                        dy: randomBetween(-2, 2),
                        radius: randomBetween(2, 4),
                        color: config.colors.brick,
                        lifetime: 20
                    });
                }
                
                // 玩家反弹
                game.player.y = brickBlock.y + brickBlock.height + game.player.radius;
                game.player.dy = 2; // 轻微向下反弹
                
                // 如果砖块被破坏
                if (brickBlock.health <= 0) {
                    // 生成破坏粒子效果
                    for (let j = 0; j < 15; j++) {
                        game.particles.push({
                            x: brickBlock.x + randomBetween(0, brickBlock.width),
                            y: brickBlock.y + randomBetween(0, brickBlock.height),
                            dx: randomBetween(-4, 4),
                            dy: randomBetween(-4, 4),
                            radius: randomBetween(1, 3),
                            color: config.colors.brick,
                            lifetime: 30
                        });
                    }
                    
                    // 移除砖块
                    game.brickBlocks.splice(i, 1);
                    
                    // 增加玩家经验和分数（比打怪少）
                    const expGain = 3; // 比打怪少的经验
                    const scoreGain = 5; // 比打怪少的分数
                    
                    game.player.exp += expGain;
                    game.score += scoreGain;
                    
                    // 显示经验获得
                    createExperienceNumber(brickBlock.x + brickBlock.width / 2, brickBlock.y, expGain);
                    
                    // 显示分数获得
                    game.floatingTexts.push({
                        x: brickBlock.x + brickBlock.width / 2,
                        y: brickBlock.y - 20,
                        text: `+${scoreGain}`,
                        color: '#FFD700',
                        lifetime: 60,
                        dy: -1
                    });
                }
                
                break; // 处理完砖块碰撞后退出
            }
        }
    }
    
    // 弹床碰撞检测（优化版）
    for (const trampoline of game.trampolines) {
        // 先进行粗略距离检查
        if (!window.collisionSystem.roughDistanceCheck(game.player, trampoline, 200)) {
            continue;
        }
        
        if (
            game.player.x + game.player.radius > trampoline.x &&
            game.player.x - game.player.radius < trampoline.x + trampoline.width &&
            game.player.y + game.player.radius > trampoline.y &&
            game.player.y - game.player.radius < trampoline.y + trampoline.height &&
            game.player.dy > 0
        ) {
            game.player.y = trampoline.y - game.player.radius;
            game.player.dy = -config.platforms.trampolineBounceForce; // 弹床弹跳效果（三倍弹力）
            game.player.isJumping = true;
            game.player.jumpCount = 0; // 重置跳跃计数器
            onPlatform = true;
            
            // 弹床弹跳粒子效果
            for (let i = 0; i < 15; i++) {
                game.particles.push({
                    x: game.player.x,
                    y: game.player.y,
                    dx: randomBetween(-3, 3),
                    dy: randomBetween(-8, -5),
                    radius: randomBetween(3, 6),
                    color: '#FF6B35',  // 橙色弹床粒子
                    lifetime: 40
                });
            }
        }
    }
    
    // 梯子交互逻辑
    let onLadder = false;
    for (const ladder of game.ladders) {
        if (
            game.player.x + game.player.radius > ladder.x &&
            game.player.x - game.player.radius < ladder.x + ladder.width &&
            game.player.y + game.player.radius > ladder.y &&
            game.player.y - game.player.radius < ladder.y + ladder.height
        ) {
            onLadder = true;
            
            // 在梯子上可以上下移动
            if (game.keys['w'] || game.keys['ArrowUp']) {
                game.player.dy = -config.player.speed;
                game.player.isJumping = false;
            } else if (game.keys['s'] || game.keys['ArrowDown']) {
                game.player.dy = config.player.speed;
            }
            
            break;
        }
    }
    
    if (!onPlatform && !onLadder) {
        game.player.isJumping = true;
    }
    
    // 设置地面状态
    game.player.onGround = onPlatform || onLadder;
    
    // 鼠标攻击
    if (game.mouse.left && game.player.lastAttackTime <= 0) {
        handlePlayerAttack();
    }
    
    // R键大招
    if (game.keys['r'] && game.player.rage >= game.player.maxRage && game.friendlyBalls.length > 0) {
        for (const ball of game.friendlyBalls) {
            createExplosion(ball.x, ball.y, ball.radius * 2, ball.damage * 2);
        }
        game.friendlyBalls = [];
        game.player.rage = 0;
    }
    
    // 攻击冷却
    if (game.player.lastAttackTime > 0) {
        game.player.lastAttackTime -= game.deltaTime;
    }
    
    // 被击中后的怒气加成持续时间
    if (game.player.lastHitTime > 0) {
        game.player.lastHitTime -= game.deltaTime;
    } else {
        game.player.hitRageMultiplier = 1;
    }
    
    // 怒气满时生成友方球球
    if (game.player.rage >= game.player.maxRage && game.friendlyBalls.length < 5) {
        game.player.rage = 0;
        
        const friendly = {
            x: game.player.x,
            y: game.player.y,
            dx: 0,
            dy: 0,
            radius: 15,
            health: 30,
            damage: 10,
            speed: config.friendly.speed,
            targetX: game.player.x,
            targetY: game.player.y,
            followDistance: config.friendly.followDistance,
            attackRange: config.friendly.attackRange,
            lastAttackTime: 0,
            followPriority: config.friendly.followPriority
        };
        
        game.friendlyBalls.push(friendly);
    }
    
    // AOE攻击（冲击波技能）
    if (game.mouse.right && game.player.aoeAttackCooldown <= 0 && game.player.mana >= 20) {
        handlePlayerAOEAttack();
    }
}

// 处理玩家攻击
function handlePlayerAttack() {
    // 计算鼠标在游戏世界中的坐标
    const mouseWorldX = game.mouse.x - game.gameWidth/2 + game.player.x;
    const mouseWorldY = game.mouse.y - game.gameHeight/2 + game.player.y;
    
    // 查找最近的敌人进行自动瞄准
    let targetX = mouseWorldX;
    let targetY = mouseWorldY;
    let closestDistance = Infinity;
    
    for (const enemy of game.enemies) {
        const dx = enemy.x - game.player.x;
        const dy = enemy.y - game.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < config.player.autoAimRadius && distance < closestDistance) {
            closestDistance = distance;
            targetX = enemy.x;
            targetY = enemy.y;
        }
    }
    
    // 计算射击角度 (从玩家指向目标)
    const dx = targetX - game.player.x;
    const dy = targetY - game.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 距离太远不生成子弹，优化性能
    if (distance > 800) return;
    
    const angle = Math.atan2(dy, dx);
    
    // 检查天雨散花技能触发条件
    const nearbyEnemyCount = game.enemies.filter(enemy => {
        if (!enemy || enemy.x === undefined || enemy.y === undefined) {
            return false;
        }
        const dx = enemy.x - game.player.x;
        const dy = enemy.y - game.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < 400; // 400像素范围内的敌人
    }).length;
    
    // 天雨散花技能：怪物密集时有概率触发散射
    const shouldScatter = nearbyEnemyCount >= 8 && Math.random() < 0.15; // 8个以上敌人时15%概率
    
    if (shouldScatter) {
        // 天雨散花：向8个方向发射子弹
        for (let i = 0; i < 8; i++) {
            const scatterAngle = (i * Math.PI * 2) / 8;
            const scatterProjectile = {
                x: game.player.x,
                y: game.player.y,
                dx: Math.cos(scatterAngle) * 12,
                dy: Math.sin(scatterAngle) * 12,
                radius: 6,
                damage: Math.floor((game.player.attackPower + (window.attributeSystem ? window.attributeSystem.getAttribute('baseDamage') : 0)) * 0.8),
                owner: 'player',
                lifetime: 100,
                active: true,
                isScatter: true
            };
            
            game.projectiles.push(scatterProjectile);
        }
        
        // 天雨散花特效
        for (let i = 0; i < 20; i++) {
            game.particles.push({
                x: game.player.x,
                y: game.player.y,
                dx: randomBetween(-8, 8),
                dy: randomBetween(-8, 8),
                radius: randomBetween(2, 5),
                color: '#00FFFF',
                lifetime: 30
            });
        }
        
        // 显示技能提示
        game.floatingTexts.push({
            x: game.player.x,
            y: game.player.y - 50,
            text: '天雨散花！',
            color: '#00FFFF',
            lifetime: 90,
            dy: -2
        });
    } else {
        // 检查三相之力buff是否激活
        const hasTrinityForce = game.buffSystem && game.buffSystem.isBuffActive('trinityForce');
        
        if (hasTrinityForce) {
            // 三相之力：发射三股子弹（中间一股 + 左右各偏转30度）
            const angles = [angle, angle - Math.PI / 6, angle + Math.PI / 6]; // 0度、-30度、+30度
            
            for (let i = 0; i < angles.length; i++) {
                const bulletAngle = angles[i];
                const projectile = {
                    x: game.player.x,
                    y: game.player.y,
                    dx: Math.cos(bulletAngle) * 10,
                    dy: Math.sin(bulletAngle) * 10,
                    radius: 8,
                    damage: game.player.attackPower + (window.attributeSystem ? window.attributeSystem.getAttribute('baseDamage') : 0),
                    owner: 'player',
                    lifetime: Math.min(120, Math.floor(distance / 8) + 30),
                    active: true,
                    isTrinityForce: true
                };
                
                game.projectiles.push(projectile);
            }
        } else {
            // 普通射击
            const projectile = {
                x: game.player.x,
                y: game.player.y,
                dx: Math.cos(angle) * 10,
                dy: Math.sin(angle) * 10,
                radius: 8,
                damage: game.player.attackPower + (window.attributeSystem ? window.attributeSystem.getAttribute('baseDamage') : 0),
                owner: 'player',
                lifetime: Math.min(120, Math.floor(distance / 8) + 30),
                active: true
            };
            
            game.projectiles.push(projectile);
        }
    }
    
    // 射击后坐力效果
    const recoilForce = 3;
    game.player.dx -= Math.cos(angle) * recoilForce;
    game.player.dy -= Math.sin(angle) * recoilForce;
    
    // 生成射击粒子效果
    for (let i = 0; i < 3; i++) {
        game.particles.push({
            x: game.player.x - Math.cos(angle) * 15,
            y: game.player.y - Math.sin(angle) * 15,
            dx: -Math.cos(angle) * randomBetween(2, 4) + randomBetween(-1, 1),
            dy: -Math.sin(angle) * randomBetween(2, 4) + randomBetween(-1, 1),
            radius: randomBetween(1, 3),
            color: '#FFD700',
            lifetime: 15
        });
    }
    
    // 应用蓝色泡泡射速加倍效果
    const attackCooldown = game.player.powerups && game.player.powerups.blue && game.player.powerups.blue.active ? 
        game.player.attackCooldown / game.player.powerups.blue.multiplier : 
        game.player.attackCooldown;
    game.player.lastAttackTime = attackCooldown;
}

// 处理玩家AOE攻击
function handlePlayerAOEAttack() {
    // 消耗魔法值
    game.player.mana -= 20;
    
    // 创建AOE攻击效果
    game.player.aoeAttackCooldown = 120; // 2秒冷却
    
    // 创建更强的扩散圈圈效果
    for (let i = 0; i < 5; i++) {
        game.aoeRings.push({
            x: game.player.x,
            y: game.player.y,
            radius: 0,
            maxRadius: 150 + i * 60,
            speed: 4 + i * 0.8,
            damage: 35 + i * 5,
            lifetime: 80,
            age: i * 8
        });
    }
    
    // 驱散附近怪物
    for (const enemy of game.enemies) {
        const dx = enemy.x - game.player.x;
        const dy = enemy.y - game.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 250) {
            // 造成更高伤害
            const damageMultiplier = Math.max(0.3, 1 - distance / 250);
            enemy.health -= Math.floor(40 * damageMultiplier);
            
            // 更强的击退效果
            const knockback = Math.max(20, 35 - distance / 10);
            const angle = Math.atan2(dy, dx);
            enemy.x += Math.cos(angle) * knockback;
            enemy.y += Math.sin(angle) * knockback;
            
            // 添加眩晕效果
            enemy.stunned = 30;
            
            // 添加击中粒子效果
            for (let j = 0; j < 8; j++) {
                game.particles.push({
                    x: enemy.x,
                    y: enemy.y,
                    dx: (Math.random() - 0.5) * 8,
                    dy: (Math.random() - 0.5) * 8,
                    radius: 3,
                    color: '#FF6B6B',
                    lifetime: 20
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
    game.player.stamina -= 20; // 消耗精力值
    
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

// 更新冲刺状态
function updateDash() {
    if (game.player.isDashing) {
        game.player.dashTime -= game.deltaTime;
        if (game.player.dashTime <= 0) {
            game.player.isDashing = false;
            game.player.dashCooldown = config.player.dashCooldown;
        }
    } else if (game.player.dashCooldown > 0) {
        game.player.dashCooldown -= game.deltaTime;
    }
}

// 更新蓄力跳跃
function updateChargeJump() {
    if (game.isChargingJump) {
        game.chargeJumpTimer += game.deltaTime;
        if (game.chargeJumpTimer > 60) {
            game.chargeJumpTimer = 60;
        }
    }
}

// 更新敌人状态 - 完整的敌人AI和移动逻辑
function updateEnemies() {
    // 性能优化：每3帧更新一次敌人AI
    if (game.frameCount % 3 === 0) {
        for (let i = game.enemies.length - 1; i >= 0; i--) {
            const enemy = game.enemies[i];
            
            // 距离玩家过远的敌人降低AI更新频率
            const distanceToPlayer = Math.sqrt(
                (enemy.x - game.player.x) ** 2 + (enemy.y - game.player.y) ** 2
            );
            
            if (distanceToPlayer > 1000 && game.frameCount % 9 !== 0) {
                continue; // 跳过远距离敌人的AI更新
            }
            
            // 眩晕状态处理
            if (enemy.stunned > 0) {
                enemy.stunned--;
                continue; // 眩晕时不能移动和攻击
            }
            
            // 狂潮模式增强
            let detectionRange = 300;
            let chaseRange = 500;
            let speedMultiplier = 1;
            
            if (game.frenzyMode.active) {
                detectionRange *= 1.5;
                chaseRange *= 1.5;
                speedMultiplier = 1.3;
            }
            
            // AI行为逻辑
            const dx = game.player.x - enemy.x;
            const dy = game.player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 计算玩家强度（考虑狂潮模式下的逃跑阈值）
            const playerStrength = game.player.level * 10 + game.player.attackPower;
            const escapeThreshold = game.frenzyMode.active ? playerStrength * 0.7 : playerStrength * 0.5;
            
            if (distance < detectionRange) {
                if (enemy.health < escapeThreshold && distance < 200) {
                    // 逃跑状态
                    enemy.dx = dx > 0 ? -enemy.speed * speedMultiplier : enemy.speed * speedMultiplier;
                    enemy.dy = dy > 0 ? -enemy.speed * speedMultiplier : enemy.speed * speedMultiplier;
                } else if (distance < chaseRange) {
                    // 追击状态
                    enemy.dx = dx > 0 ? enemy.speed * speedMultiplier : -enemy.speed * speedMultiplier;
                    enemy.dy = dy > 0 ? enemy.speed * speedMultiplier : -enemy.speed * speedMultiplier;
                } else {
                    // 空闲状态
                    enemy.dx *= 0.9;
                    enemy.dy *= 0.9;
                }
            } else {
                // 超出探测范围，空闲状态
                enemy.dx *= 0.9;
                enemy.dy *= 0.9;
            }
            
            // 敌人类型特殊行为
            if (enemy.type === 'red') {
                // 红色敌人：近战攻击
                if (distance < 50) {
                    // 检查玩家是否有红色泡泡效果
                    if (game.player.powerups && game.player.powerups.red && game.player.powerups.red.active) {
                        // 玩家有红色泡泡，对敌人造成伤害和击退
                        enemy.health -= 15;
                        const knockbackForce = 20;
                        const angle = Math.atan2(enemy.y - game.player.y, enemy.x - game.player.x);
                        enemy.x += Math.cos(angle) * knockbackForce;
                        enemy.y += Math.sin(angle) * knockbackForce;
                        
                        // 击退粒子效果
                        for (let j = 0; j < 5; j++) {
                            game.particles.push({
                                x: enemy.x,
                                y: enemy.y,
                                dx: randomBetween(-3, 3),
                                dy: randomBetween(-3, 3),
                                radius: randomBetween(2, 4),
                                color: '#FF0000',
                                lifetime: 20
                            });
                        }
                    } else {
                        // 玩家没有红色泡泡，受到伤害
                        if (game.player.lastHitTime <= 0) {
                            game.player.health -= 10;
                            game.player.rage += 15; // 增加怒气
                            game.player.lastHitTime = 60; // 1秒无敌时间
                            game.player.hitRageMultiplier = 2; // 被击中后怒气加成
                        }
                    }
                }
            } else if (enemy.type === 'blue') {
                // 蓝色敌人：远程攻击
                if (distance < 400 && enemy.lastAttackTime <= 0) {
                    const angle = Math.atan2(dy, dx);
                    const projectile = {
                        x: enemy.x,
                        y: enemy.y,
                        dx: Math.cos(angle) * 6,
                        dy: Math.sin(angle) * 6,
                        radius: 5,
                        damage: 8,
                        owner: 'enemy',
                        lifetime: 80,
                        active: true
                    };
                    game.projectiles.push(projectile);
                    
                    // 攻击冷却（狂潮模式下缩短）
                    enemy.lastAttackTime = game.frenzyMode.active ? 45 : 60;
                }
            } else if (enemy.type === 'white') {
                // 白色敌人：自爆
                if (distance < 80) {
                    // 创建爆炸效果
                    createExplosion(enemy.x, enemy.y, 100, 25);
                    
                    // 移除敌人
                    game.enemies.splice(i, 1);
                    continue;
                }
            } else if (enemy.type === 'black') {
                // 黑色敌人：引力效果
                if (distance < 200) {
                    const gravityForce = 0.3;
                    const angle = Math.atan2(enemy.y - game.player.y, enemy.x - game.player.x);
                    game.player.dx += Math.cos(angle) * gravityForce;
                    game.player.dy += Math.sin(angle) * gravityForce;
                }
            } else if (enemy.type === 'largered') {
                // 大型红色敌人：左右移动并散射球球
                enemy.x += enemy.dx;
                if (Math.abs(enemy.x - enemy.spawnX) > 200) {
                    enemy.dx *= -1;
                }
                
                if (enemy.lastAttackTime <= 0) {
                    // 散射攻击
                    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
                        const projectile = {
                            x: enemy.x,
                            y: enemy.y,
                            dx: Math.cos(angle) * 4,
                            dy: Math.sin(angle) * 4,
                            radius: 6,
                            damage: 12,
                            owner: 'enemy',
                            lifetime: 100,
                            active: true
                        };
                        game.projectiles.push(projectile);
                    }
                    enemy.lastAttackTime = game.frenzyMode.active ? 90 : 120;
                }
            }
            
            // 攻击冷却倒计时
            if (enemy.lastAttackTime > 0) {
                enemy.lastAttackTime--;
            }
        }
    }
    
    // 更新敌人位置（每帧都执行）
    for (let i = game.enemies.length - 1; i >= 0; i--) {
        const enemy = game.enemies[i];
        
        // 跳过眩晕的敌人
        if (enemy.stunned > 0) continue;
        
        // 更新位置
        if (enemy.type !== 'largered') { // 大型红色敌人有自己的移动逻辑
            enemy.x += enemy.dx;
            enemy.y += enemy.dy;
        }
        
        // 应用摩擦力
        enemy.dx *= 0.95;
        enemy.dy *= 0.95;
        
        // 死亡检测 - 使用统一的死亡处理函数
        if (enemy.health <= 0) {
            handleEnemyDeath(enemy, i);
            game.enemies.splice(i, 1);
        }
    }
}

// 创建伤害数值显示
function createDamageNumber(x, y, damage, isCritical = false) {
    if (typeof game === 'undefined' || !game.damageNumbers) return;
    
    const damageNumber = {
        x: x + randomBetween(-20, 20),
        y: y - 10,
        damage: damage,
        isCritical: isCritical,
        lifetime: 60,
        dy: -2,
        alpha: 1.0,
        active: true
    };
    game.damageNumbers.push(damageNumber);
}

// 创建经验数值显示
function createExperienceNumber(x, y, exp) {
    if (typeof game === 'undefined' || !game.experienceNumbers) return;
    
    const expNumber = {
        x: x + randomBetween(-15, 15),
        y: y - 5,
        exp: exp,
        lifetime: 45,
        dy: -1.5,
        alpha: 1.0,
        active: true
    };
    game.experienceNumbers.push(expNumber);
}

// 创建浮动文本显示
function createFloatingText(x, y, text, color = '#ffffff') {
    if (typeof game === 'undefined' || !game.floatingTexts) return;
    
    const floatingText = {
        x: x,
        y: y,
        text: text,
        color: color,
        lifetime: 60,
        dy: -1,
        alpha: 1.0
    };
    game.floatingTexts.push(floatingText);
}

// 创建暴击显示
function createCriticalDisplay(damage) {
    if (typeof game === 'undefined' || !game.criticalDisplays) return;
    
    const criticalDisplay = {
        damage: damage,
        lifetime: 90,
        scale: 0.5,
        alpha: 1.0,
        active: true
    };
    game.criticalDisplays.push(criticalDisplay);
}

// 创建爆炸效果
function createExplosion(x, y, radius, damage) {
    // 对范围内的所有目标造成伤害
    for (const enemy of game.enemies) {
        const dx = enemy.x - x;
        const dy = enemy.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < radius) {
            const damageMultiplier = Math.max(0.2, 1 - distance / radius);
            const actualDamage = Math.floor(damage * damageMultiplier);
            enemy.health -= actualDamage;
            
            // 记录爆炸伤害
            if (window.damageTracker) {
                window.damageTracker.recordDamage({
                    damage: actualDamage,
                    monsterType: enemy.type,
                    damageSource: 'explosion',
                    isCritical: false,
                    x: enemy.x,
                    y: enemy.y
                });
            }
            
            // 添加简单伤害显示
            if (window.simpleDamageDisplay) {
                window.simpleDamageDisplay.addDamageText(actualDamage, enemy.x, enemy.y, false);
            }
            
            // 击退效果
            const knockback = 15 * damageMultiplier;
            const angle = Math.atan2(dy, dx);
            enemy.x += Math.cos(angle) * knockback;
            enemy.y += Math.sin(angle) * knockback;
        }
    }
    
    // 对玩家造成伤害（如果在范围内）
    const playerDx = game.player.x - x;
    const playerDy = game.player.y - y;
    const playerDistance = Math.sqrt(playerDx * playerDx + playerDy * playerDy);
    
    if (playerDistance < radius && game.player.lastHitTime <= 0) {
        const damageMultiplier = Math.max(0.2, 1 - playerDistance / radius);
        game.player.health -= Math.floor(damage * 0.5 * damageMultiplier); // 玩家受到减半伤害
        game.player.lastHitTime = 60;
        
        // 击退玩家
        const knockback = 20 * damageMultiplier;
        const angle = Math.atan2(playerDy, playerDx);
        game.player.dx += Math.cos(angle) * knockback;
        game.player.dy += Math.sin(angle) * knockback;
    }
    
    // 爆炸粒子效果
    for (let i = 0; i < 25; i++) {
        game.particles.push({
            x: x,
            y: y,
            dx: randomBetween(-8, 8),
            dy: randomBetween(-8, 8),
            radius: randomBetween(3, 8),
            color: '#FF4500',
            lifetime: 40
        });
    }
}

// 将关键函数挂载到window对象上，供其他模块使用
window.updatePlayer = updatePlayer;
window.updateDash = updateDash;
window.updateChargeJump = updateChargeJump;
window.updateEnemies = updateEnemies;
window.handlePlayerAttack = handlePlayerAttack;
window.handlePlayerAOEAttack = handlePlayerAOEAttack;
window.createExplosion = createExplosion;
window.createDamageNumber = createDamageNumber;
window.createExperienceNumber = createExperienceNumber;
window.createFloatingText = createFloatingText;
window.createCriticalDisplay = createCriticalDisplay;
window.checkCollision = checkCollision;
window.handlePlatformCollision = handlePlatformCollision;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleKeyDown,
        handleKeyUp,
        handleMouseDown,
        handleMouseUp,
        handleMouseMove,
        activateWindFireWheels,
        activateDash,
        activateLaser,
        checkCollisionAtPosition,
        initInputHandlers,
        updatePlayer,
        updateDash,
        updateChargeJump,
        handlePlayerAttack,
        handlePlayerAOEAttack,
        startDash,
        updateEnemies,
        createExplosion,
        createDamageNumber,
        createExperienceNumber,
        createFloatingText,
        createCriticalDisplay,
        checkCollision,
        handlePlatformCollision,
        randomBetween
    };
}