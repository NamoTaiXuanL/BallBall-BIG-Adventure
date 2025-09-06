// 球球大冒险 - 渲染与绘制模块
// 负责在Canvas上绘制游戏元素、动画效果

// 主渲染函数
function render(gameState, gameConfig) {
    const ctx = game.ctx;
    
    // 清空画布
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, game.gameWidth, game.gameHeight);
    
    // 保存当前状态
    ctx.save();
    
    // 应用相机变换
    ctx.translate(-game.camera.x, -game.camera.y);
    
    // 视野裁剪范围 - 扩大裁剪范围以减少边缘闪烁
    const viewPadding = game.performanceMode === 'high' ? 200 : 100;
    const viewLeft = game.camera.x - viewPadding;
    const viewRight = game.camera.x + game.gameWidth + viewPadding;
    const viewTop = game.camera.y - viewPadding;
    const viewBottom = game.camera.y + game.gameHeight + viewPadding;
    
    // 绘制地图元素
    renderMapElements(ctx, viewLeft, viewRight, viewTop, viewBottom);
    
    // 绘制游戏对象
    renderGameObjects(ctx, viewLeft, viewRight, viewTop, viewBottom);
    
    // 绘制特效
    renderEffects(ctx);
    
    // 恢复状态
    ctx.restore();
    
    // 绘制UI（不受相机影响）
    drawUI();
    
    // 绘制伤害记录窗口
    if (game.damageWindow) {
        game.damageWindow.render();
    }
    
    // 更新和绘制简单伤害显示
    if (window.simpleDamageDisplay) {
        window.simpleDamageDisplay.update();
    }
    
    // 游戏结束时绘制结束界面
    if (game.player.health <= 0) {
        gameOver();
    }
}

// 渲染地图元素
function renderMapElements(ctx, viewLeft, viewRight, viewTop, viewBottom) {
    // 批量绘制平台 - 按类型分组减少状态切换
    const visiblePlatforms = {
        ground: [],
        normal: []
    };
    
    for (const platform of game.platforms) {
        if (platform.x + platform.width >= viewLeft && 
            platform.x <= viewRight &&
            platform.y + platform.height >= viewTop && 
            platform.y <= viewBottom) {
            if (platform.isGroundBlock) {
                visiblePlatforms.ground.push(platform);
            } else {
                visiblePlatforms.normal.push(platform);
            }
        }
    }
    
    // 批量绘制地面平台
    if (visiblePlatforms.ground.length > 0) {
        ctx.fillStyle = '#795548';
        for (const platform of visiblePlatforms.ground) {
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        }
    }
    
    // 批量绘制普通平台
    if (visiblePlatforms.normal.length > 0) {
        ctx.fillStyle = '#5D4037';
        for (const platform of visiblePlatforms.normal) {
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        }
    }
    
    // 绘制各种方块
    renderBlocks(ctx, viewLeft, viewRight, viewTop, viewBottom);
    
    // 绘制其他地图元素
    renderOtherMapElements(ctx, viewLeft, viewRight, viewTop, viewBottom);
}

// 渲染方块
function renderBlocks(ctx, viewLeft, viewRight, viewTop, viewBottom) {
    // 批量收集可见方块
    const visibleBlocks = {
        ground: [],
        mainland: [],
        stone: [],
        brick: []
    };
    
    // 收集地面方块
    for (const block of game.groundBlocks) {
        if (block.x + block.width >= viewLeft && 
            block.x <= viewRight &&
            block.y + block.height >= viewTop && 
            block.y <= viewBottom) {
            visibleBlocks.ground.push(block);
        }
    }
    
    // 收集大陆地区块
    for (const block of game.mainlandBlocks) {
        if (block.x + block.width >= viewLeft && 
            block.x <= viewRight &&
            block.y + block.height >= viewTop && 
            block.y <= viewBottom) {
            visibleBlocks.mainland.push(block);
        }
    }
    
    // 收集石块
    for (const block of game.stoneBlocks) {
        if (block.x + block.width >= viewLeft && 
            block.x <= viewRight &&
            block.y + block.height >= viewTop && 
            block.y <= viewBottom) {
            visibleBlocks.stone.push(block);
        }
    }
    
    // 收集砖块
    for (const block of game.brickBlocks) {
        if (block.x + block.width >= viewLeft && 
            block.x <= viewRight &&
            block.y + block.height >= viewTop && 
            block.y <= viewBottom) {
            visibleBlocks.brick.push(block);
        }
    }
    
    // 批量绘制地面方块
    if (visibleBlocks.ground.length > 0) {
        ctx.fillStyle = config.colors.groundBlock;
        for (const block of visibleBlocks.ground) {
            ctx.fillRect(block.x, block.y, block.width, block.height);
        }
    }
    
    // 批量绘制大陆地区块
    if (visibleBlocks.mainland.length > 0) {
        ctx.fillStyle = '#4A2C2A';
        for (const block of visibleBlocks.mainland) {
            ctx.fillRect(block.x, block.y, block.width, block.height);
        }
        // 批量绘制边框
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 2;
        for (const block of visibleBlocks.mainland) {
            ctx.strokeRect(block.x, block.y, block.width, block.height);
        }
    }
    
    // 批量绘制石块
    if (visibleBlocks.stone.length > 0) {
        // 填充
        ctx.fillStyle = config.colors.stoneBlock;
        for (const block of visibleBlocks.stone) {
            ctx.fillRect(block.x, block.y, block.width, block.height);
        }
        // 外边框
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 1;
        for (const block of visibleBlocks.stone) {
            ctx.strokeRect(block.x, block.y, block.width, block.height);
        }
        // 内阴影（仅在高性能模式下绘制）
        if (game.performanceMode === 'high') {
            ctx.strokeStyle = '#808080';
            for (const block of visibleBlocks.stone) {
                ctx.strokeRect(block.x + 2, block.y + 2, block.width - 4, block.height - 4);
            }
        }
    }
    
    // 批量绘制砖块
    if (visibleBlocks.brick.length > 0) {
        ctx.fillStyle = config.colors.brickBlock;
        for (const block of visibleBlocks.brick) {
            ctx.fillRect(block.x, block.y, block.width, block.height);
            // 添加砖块纹理效果
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 1;
            ctx.strokeRect(block.x, block.y, block.width, block.height);
            // 添加砖块分割线
            ctx.strokeStyle = '#A0522D';
            ctx.lineWidth = 0.5;
            // 水平分割线
            ctx.beginPath();
            ctx.moveTo(block.x, block.y + block.height/2);
            ctx.lineTo(block.x + block.width, block.y + block.height/2);
            ctx.stroke();
            // 垂直分割线
            ctx.beginPath();
            ctx.moveTo(block.x + block.width/2, block.y);
            ctx.lineTo(block.x + block.width/2, block.y + block.height);
            ctx.stroke();
        }
    }
}

// 渲染其他地图元素
function renderOtherMapElements(ctx, viewLeft, viewRight, viewTop, viewBottom) {
    // 绘制怪物生成点
    for (const spawnPoint of game.spawnPoints) {
        const distance = Math.sqrt(
            Math.pow(game.player.x - spawnPoint.x, 2) + 
            Math.pow(game.player.y - spawnPoint.y, 2)
        );
        
        if (distance < config.spawnPoints.activationRange) {
            // 激活状态 - 红色脉动效果
            const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
            ctx.beginPath();
            ctx.arc(spawnPoint.x, spawnPoint.y, 15, 0, Math.PI * 2);
            ctx.fill();
            
            // 外圈效果
            ctx.strokeStyle = '#FF5722';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(spawnPoint.x, spawnPoint.y, 20, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // 未激活状态 - 暗红色
            ctx.fillStyle = '#8B0000';
            ctx.beginPath();
            ctx.arc(spawnPoint.x, spawnPoint.y, 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 绘制弹床
    ctx.fillStyle = '#FF6B35'; // 橙色弹床
    for (const trampoline of game.trampolines) {
        // 弹床主体（长方形）
        ctx.fillRect(trampoline.x, trampoline.y, trampoline.width, trampoline.height);
        
        // 弹床边框
        ctx.strokeStyle = '#E55100';
        ctx.lineWidth = 2;
        ctx.strokeRect(trampoline.x, trampoline.y, trampoline.width, trampoline.height);
        
        // 弹床弹簧效果（中间的线条）
        ctx.strokeStyle = '#BF360C';
        ctx.lineWidth = 1;
        const springCount = Math.floor(trampoline.width / 10);
        for (let i = 1; i < springCount; i++) {
            const x = trampoline.x + (i * trampoline.width / springCount);
            ctx.beginPath();
            ctx.moveTo(x, trampoline.y);
            ctx.lineTo(x, trampoline.y + trampoline.height);
            ctx.stroke();
        }
    }
    

}

// 渲染游戏对象
function renderGameObjects(ctx, viewLeft, viewRight, viewTop, viewBottom) {
    // 绘制安全区（在其他对象之前绘制，作为背景层）
    renderSafeZones(ctx, viewLeft, viewRight, viewTop, viewBottom);
    
    // 绘制敌人
    renderEnemies(ctx, viewLeft, viewRight, viewTop, viewBottom);
    
    // 绘制玩家
    renderPlayer(ctx);
    
    // 绘制投射物
    renderProjectiles(ctx, viewLeft, viewRight, viewTop, viewBottom);
    
    // 绘制友方球球
    renderFriendlyBalls(ctx, viewLeft, viewRight, viewTop, viewBottom);
    
    // 绘制带刺球球
    renderSpikeBalls(ctx, viewLeft, viewRight, viewTop, viewBottom);
    
    // 绘制泡泡道具
    renderBubblePowerups(ctx, viewLeft, viewRight, viewTop, viewBottom);
}

// 渲染敌人
function renderEnemies(ctx, viewLeft, viewRight, viewTop, viewBottom) {
    // 批量绘制敌人 - 按类型分组减少状态切换
    const visibleEnemies = {
        rotating: [],
        teleport: [],
        snake: [],
        yellow: [],
        control: [],
        elite: [],
        normal: []
    };
    
    // 收集可见敌人
    for (const enemy of game.enemies) {
        if (enemy.x + enemy.radius >= viewLeft && 
            enemy.x - enemy.radius <= viewRight &&
            enemy.y + enemy.radius >= viewTop && 
            enemy.y - enemy.radius <= viewBottom) {
            if (enemy.type === 'rotating') {
                visibleEnemies.rotating.push(enemy);
            } else if (enemy.type === 'teleport') {
                visibleEnemies.teleport.push(enemy);
            } else if (enemy.type === 'snake') {
                visibleEnemies.snake.push(enemy);
            } else if (enemy.type === 'yellow') {
                visibleEnemies.yellow.push(enemy);
            } else if (enemy.type === 'control') {
                visibleEnemies.control.push(enemy);
            } else if (enemy.type === 'elite') {
                visibleEnemies.elite.push(enemy);
            } else {
                visibleEnemies.normal.push(enemy);
            }
        }
    }
    
    // 批量绘制旋转敌人
    if (visibleEnemies.rotating.length > 0) {
        ctx.fillStyle = config.colors.rotatingEnemy;
        for (const enemy of visibleEnemies.rotating) {
            // 绘制主体
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制伴随球体
            ctx.beginPath();
            ctx.arc(enemy.companion.x, enemy.companion.y, enemy.companion.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 批量绘制连接线
        ctx.strokeStyle = config.colors.rotatingEnemy;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (const enemy of visibleEnemies.rotating) {
            ctx.moveTo(enemy.x, enemy.y);
            ctx.lineTo(enemy.companion.x, enemy.companion.y);
        }
        ctx.stroke();
    }
    
    // 批量绘制传送敌人
    if (visibleEnemies.teleport.length > 0) {
        ctx.fillStyle = config.colors.teleportEnemy;
        for (const enemy of visibleEnemies.teleport) {
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // 蓄力时的特效
            if (enemy.isCharging) {
                const chargeProgress = enemy.chargeTime / enemy.maxChargeTime;
                
                // 蓄力光环
                ctx.strokeStyle = 'rgba(156, 39, 176, ' + (0.3 + chargeProgress * 0.7) + ')';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y, enemy.radius + 10 + chargeProgress * 20, 0, Math.PI * 2);
                ctx.stroke();
                
                // 蓄力粒子
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2 + performance.now() * 0.01;
                    const distance = enemy.radius + 15 + Math.sin(performance.now() * 0.02 + i) * 5;
                    ctx.fillStyle = 'rgba(156, 39, 176, ' + (0.5 + Math.sin(performance.now() * 0.05 + i) * 0.3) + ')';
                    ctx.beginPath();
                    ctx.arc(
                        enemy.x + Math.cos(angle) * distance,
                        enemy.y + Math.sin(angle) * distance,
                        3, 0, Math.PI * 2
                    );
                    ctx.fill();
                }
            }
        }
    }
    
    // 批量绘制贪吃蛇敌人
    if (visibleEnemies.snake.length > 0) {
        for (const enemy of visibleEnemies.snake) {
            // 先绘制蛇身节点
            if (enemy.segments && enemy.segments.length > 0) {
                ctx.fillStyle = '#4CAF50'; // 绿色蛇身
                for (const segment of enemy.segments) {
                    ctx.beginPath();
                    ctx.arc(segment.x, segment.y, segment.radius, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // 绘制连接线
                ctx.strokeStyle = '#2E7D32';
                ctx.lineWidth = 4;
                ctx.beginPath();
                
                // 从蛇头到第一个节点
                if (enemy.segments.length > 0) {
                    ctx.moveTo(enemy.x, enemy.y);
                    ctx.lineTo(enemy.segments[0].x, enemy.segments[0].y);
                }
                
                // 节点之间的连接
                for (let i = 0; i < enemy.segments.length - 1; i++) {
                    ctx.moveTo(enemy.segments[i].x, enemy.segments[i].y);
                    ctx.lineTo(enemy.segments[i + 1].x, enemy.segments[i + 1].y);
                }
                
                ctx.stroke();
            }
            
            // 绘制蛇头
            ctx.fillStyle = '#66BB6A'; // 浅绿色蛇头
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // 蛇头边框
            ctx.strokeStyle = '#2E7D32';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // 绘制蛇头眼睛
            ctx.fillStyle = '#FF5722';
            const eyeOffset = enemy.radius * 0.4;
            const eyeSize = enemy.radius * 0.15;
            
            // 左眼
            ctx.beginPath();
            ctx.arc(enemy.x - eyeOffset, enemy.y - eyeOffset, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            
            // 右眼
            ctx.beginPath();
            ctx.arc(enemy.x + eyeOffset, enemy.y - eyeOffset, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 批量绘制黄色变大变小敌人
    if (visibleEnemies.yellow.length > 0) {
        for (const enemy of visibleEnemies.yellow) {
            const sizeRatio = enemy.radius / enemy.baseRadius;
            const pulseIntensity = Math.sin(performance.now() * 0.01) * 0.1 + 0.9;
            
            // 主体颜色随大小变化
            const yellowIntensity = Math.floor(200 + sizeRatio * 55); // 200-255
            ctx.fillStyle = `rgb(${yellowIntensity}, ${yellowIntensity}, 0)`;
            
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.radius * pulseIntensity, 0, Math.PI * 2);
            ctx.fill();
            
            // 边框效果
            ctx.strokeStyle = '#FF8F00';
            ctx.lineWidth = 2 + sizeRatio;
            ctx.stroke();
            
            // 大小变化指示器
            if (enemy.isGrowing) {
                // 向外扩散的光环
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y, enemy.radius + 5, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                // 向内收缩的光环
                ctx.strokeStyle = 'rgba(255, 140, 0, 0.6)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y, enemy.radius - 3, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }
    
    // 批量绘制控制敌人
    if (visibleEnemies.control.length > 0) {
        for (const enemy of visibleEnemies.control) {
            // 先绘制控制圈
            const ringAlpha = 0.3 + Math.sin(enemy.controlRingPulse) * 0.2;
            ctx.strokeStyle = `rgba(138, 43, 226, ${ringAlpha})`; // 紫色控制圈
            ctx.lineWidth = 4;
            ctx.setLineDash([10, 5]); // 虚线效果
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.controlRingRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]); // 重置虚线
            
            // 控制圈内部渐变效果
            if (isFinite(enemy.controlRingRadius) && enemy.controlRingRadius > 0) {
                const gradient = ctx.createRadialGradient(
                    enemy.x, enemy.y, 0,
                    enemy.x, enemy.y, enemy.controlRingRadius
                );
                gradient.addColorStop(0, 'rgba(138, 43, 226, 0)');
                gradient.addColorStop(0.7, 'rgba(138, 43, 226, 0.05)');
                gradient.addColorStop(1, 'rgba(138, 43, 226, 0.15)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y, enemy.controlRingRadius, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // 绘制主体球球
            ctx.fillStyle = '#9C27B0'; // 紫色主体
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // 主体边框
            ctx.strokeStyle = '#6A1B9A';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // 控制能量指示器
            const energyPulse = Math.sin(performance.now() * 0.008) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(186, 104, 200, ${0.6 + energyPulse * 0.4})`;
            
            // 绘制能量点
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 + performance.now() * 0.003;
                const distance = enemy.radius + 8;
                ctx.beginPath();
                ctx.arc(
                    enemy.x + Math.cos(angle) * distance,
                    enemy.y + Math.sin(angle) * distance,
                    3 + energyPulse * 2, 0, Math.PI * 2
                );
                ctx.fill();
            }
        }
    }
    
    // 批量绘制精英敌人
    if (visibleEnemies.elite.length > 0) {
        for (const enemy of visibleEnemies.elite) {
            // 验证精英怪物属性
            if (!isFinite(enemy.x) || !isFinite(enemy.y) || !isFinite(enemy.gravityFieldRadius) || enemy.gravityFieldRadius <= 0) {
                continue; // 跳过无效的精英怪物
            }
            
            // 根据精英怪物子类型设置颜色主题
            let themeColors = {
                field: { r: 255, g: 0, b: 100 },    // 默认粉红色
                main: '#FF1744',
                core: '#D50000',
                orb: '#FF5722',
                border: '#8B0000',
                glow: { r: 255, g: 255, b: 0 }
            };
            
            // 友好怪物使用绿色主题
            if (enemy.friendly) {
                themeColors = {
                    field: { r: 0, g: 255, b: 136 },
                    main: '#00FF88',
                    core: '#00CC66',
                    orb: '#66FF99',
                    border: '#00AA44',
                    glow: { r: 102, g: 255, b: 153 }
                };
            } else {
                switch(enemy.eliteType) {
                case 'graviton': // 引力型 - 紫色主题
                    themeColors = {
                        field: { r: 138, g: 43, b: 226 },
                        main: '#8A2BE2',
                        core: '#4B0082',
                        orb: '#9370DB',
                        border: '#2E0854',
                        glow: { r: 186, g: 85, b: 211 }
                    };
                    break;
                case 'destroyer': // 破坏型 - 深红色主题
                    themeColors = {
                        field: { r: 220, g: 20, b: 60 },
                        main: '#DC143C',
                        core: '#8B0000',
                        orb: '#FF4500',
                        border: '#4A0000',
                        glow: { r: 255, g: 69, b: 0 }
                    };
                    break;
                case 'guardian': // 守护型 - 蓝色主题
                    themeColors = {
                        field: { r: 30, g: 144, b: 255 },
                        main: '#1E90FF',
                        core: '#0000CD',
                        orb: '#4169E1',
                        border: '#000080',
                        glow: { r: 135, g: 206, b: 250 }
                    };
                    break;
                case 'vortex': // 漩涡型 - 绿色主题
                    themeColors = {
                        field: { r: 50, g: 205, b: 50 },
                        main: '#32CD32',
                        core: '#228B22',
                        orb: '#7CFC00',
                        border: '#006400',
                        glow: { r: 124, g: 252, b: 0 }
                    };
                    break;
                }
            }
            
            // 引力场效果
            const gravityAlpha = 0.1 + Math.sin(performance.now() * 0.005) * 0.05;
            const gravityGradient = ctx.createRadialGradient(
                enemy.x, enemy.y, 0,
                enemy.x, enemy.y, enemy.gravityFieldRadius
            );
            gravityGradient.addColorStop(0, `rgba(${themeColors.field.r}, ${themeColors.field.g}, ${themeColors.field.b}, ${gravityAlpha * 2})`);
            gravityGradient.addColorStop(0.5, `rgba(${themeColors.field.r}, ${themeColors.field.g}, ${themeColors.field.b}, ${gravityAlpha})`);
            gravityGradient.addColorStop(1, `rgba(${themeColors.field.r}, ${themeColors.field.g}, ${themeColors.field.b}, 0)`);
            
            ctx.fillStyle = gravityGradient;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.gravityFieldRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // 引力场边界
            ctx.strokeStyle = `rgba(${themeColors.field.r}, ${themeColors.field.g}, ${themeColors.field.b}, 0.3)`;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.gravityFieldRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // 绘制主体球
            ctx.fillStyle = themeColors.main;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // 主体边框
            ctx.strokeStyle = themeColors.border;
            ctx.lineWidth = 4;
            ctx.stroke();
            
            // 绘制核心
            const coreRadius = enemy.radius * 0.4;
            const corePulse = Math.sin(performance.now() * 0.01) * 0.2 + 0.8;
            ctx.fillStyle = themeColors.core;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, coreRadius * corePulse, 0, Math.PI * 2);
            ctx.fill();
            
            // 核心光晕
            const coreGlowRadius = coreRadius * 1.5;
            if (isFinite(coreGlowRadius) && coreGlowRadius > 0) {
                const coreGlow = ctx.createRadialGradient(
                    enemy.x, enemy.y, 0,
                    enemy.x, enemy.y, coreGlowRadius
                );
                coreGlow.addColorStop(0, `rgba(${themeColors.glow.r}, ${themeColors.glow.g}, ${themeColors.glow.b}, 0.8)`);
                coreGlow.addColorStop(1, `rgba(${themeColors.glow.r}, ${themeColors.glow.g}, ${themeColors.glow.b}, 0)`);
                
                ctx.fillStyle = coreGlow;
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y, coreGlowRadius, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // 绘制环绕球
            if (enemy.orbs) {
                for (const orb of enemy.orbs) {
                    const orbX = enemy.x + Math.cos(orb.angle) * orb.orbitDistance;
                    const orbY = enemy.y + Math.sin(orb.angle) * orb.orbitDistance;
                    
                    // 环绕球主体
                    ctx.fillStyle = themeColors.orb;
                    ctx.beginPath();
                    ctx.arc(orbX, orbY, orb.radius, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // 环绕球边框
                    ctx.strokeStyle = themeColors.border;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    // 连接线
                    ctx.strokeStyle = `rgba(${themeColors.field.r}, ${themeColors.field.g}, ${themeColors.field.b}, 0.5)`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(enemy.x, enemy.y);
                    ctx.lineTo(orbX, orbY);
                    ctx.stroke();
                    
                    // 环绕球血条
                    const orbHealthPercent = orb.health / orb.maxHealth;
                    ctx.fillStyle = '#F44336';
                    ctx.fillRect(orbX - orb.radius, orbY - orb.radius - 8, orb.radius * 2, 2);
                    ctx.fillStyle = '#4CAF50';
                    ctx.fillRect(orbX - orb.radius, orbY - orb.radius - 8, orb.radius * 2 * orbHealthPercent, 2);
                }
            }
            
            // 特殊视觉效果 - 根据子类型添加独特效果
            switch(enemy.eliteType) {
                case 'graviton': // 引力型 - 脉动引力波
                    const gravityWave = Math.sin(performance.now() * 0.006) * 0.4 + 0.6;
                    for (let i = 1; i <= 3; i++) {
                        ctx.strokeStyle = `rgba(138, 43, 226, ${gravityWave / i})`;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(enemy.x, enemy.y, enemy.radius + 15 * i, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    break;
                case 'destroyer': // 破坏型 - 火焰效果
                    const flameIntensity = Math.sin(performance.now() * 0.01) * 0.3 + 0.7;
                    ctx.strokeStyle = `rgba(255, 69, 0, ${flameIntensity})`;
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(enemy.x, enemy.y, enemy.radius + 8, 0, Math.PI * 2);
                    ctx.stroke();
                    // 内层火焰
                    ctx.strokeStyle = `rgba(255, 140, 0, ${flameIntensity * 0.8})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(enemy.x, enemy.y, enemy.radius + 12, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                case 'guardian': // 守护型 - 护盾效果
                    const shieldPulse = Math.sin(performance.now() * 0.004) * 0.2 + 0.8;
                    ctx.strokeStyle = `rgba(30, 144, 255, ${shieldPulse})`;
                    ctx.lineWidth = 5;
                    ctx.setLineDash([10, 5]);
                    ctx.beginPath();
                    ctx.arc(enemy.x, enemy.y, enemy.radius + 15, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    break;
                case 'vortex': // 漩涡型 - 旋转能量
                    const vortexRotation = performance.now() * 0.005;
                    for (let i = 0; i < 8; i++) {
                        const angle = (i / 8) * Math.PI * 2 + vortexRotation;
                        const startRadius = enemy.radius + 10;
                        const endRadius = enemy.radius + 25;
                        const startX = enemy.x + Math.cos(angle) * startRadius;
                        const startY = enemy.y + Math.sin(angle) * startRadius;
                        const endX = enemy.x + Math.cos(angle) * endRadius;
                        const endY = enemy.y + Math.sin(angle) * endRadius;
                        
                        ctx.strokeStyle = `rgba(124, 252, 0, ${0.6 - (i * 0.05)})`;
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.moveTo(startX, startY);
                        ctx.lineTo(endX, endY);
                        ctx.stroke();
                    }
                    break;
            }
            
            // 能量波动效果
            const energyWave = Math.sin(performance.now() * 0.008) * 0.3 + 0.7;
            ctx.strokeStyle = `rgba(${themeColors.glow.r}, ${themeColors.glow.g}, ${themeColors.glow.b}, ${energyWave})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.radius + 10, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    // 批量绘制普通敌人
    if (visibleEnemies.normal.length > 0) {
        for (const enemy of visibleEnemies.normal) {
            ctx.fillStyle = config.colors[enemy.type + 'Enemy'];
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 批量绘制所有敌人的血条 - 基于等级的视觉强化
    for (const enemyType in visibleEnemies) {
        for (const enemy of visibleEnemies[enemyType]) {
            const healthPercent = enemy.health / enemy.maxHealth;
            const level = enemy.level || 1;
            
            // 根据等级调整血条厚度和颜色
            const barHeight = Math.max(3, Math.min(8, 2 + level)); // 等级越高血条越厚
            const barY = enemy.y - enemy.radius - 10 - (barHeight - 3); // 调整位置
            
            // 根据等级选择血条颜色
            let healthBarColor = '#4CAF50'; // 默认绿色
            if (level >= 10) {
                healthBarColor = '#FF6B35'; // 高等级橙红色
            } else if (level >= 5) {
                healthBarColor = '#FFD700'; // 中等级金色
            } else if (level >= 3) {
                healthBarColor = '#00BCD4'; // 低等级青色
            }
            
            // 背景条
            ctx.fillStyle = '#F44336';
            ctx.fillRect(enemy.x - enemy.radius, barY, enemy.radius * 2, barHeight);
            
            // 血量条
            ctx.fillStyle = healthBarColor;
            ctx.fillRect(enemy.x - enemy.radius, barY, enemy.radius * 2 * healthPercent, barHeight);
            
            // 高等级怪物添加发光效果
            if (level >= 5) {
                ctx.shadowColor = healthBarColor;
                ctx.shadowBlur = 3;
                ctx.fillRect(enemy.x - enemy.radius, barY, enemy.radius * 2 * healthPercent, barHeight);
                ctx.shadowBlur = 0;
            }
        }
     }
}

// 渲染玩家
function renderPlayer(ctx) {
    // 状态圆环配置
    const ringConfig = {
        health: { color: '#4CAF50', radius: game.player.radius + 15 },    // 生命 - 绿色
        mana: { color: '#2196F3', radius: game.player.radius + 25 },      // 魔力 - 蓝色
        rage: { color: '#FF5722', radius: game.player.radius + 35 },      // 怒气 - 红色
        stamina: { color: '#FF9800', radius: game.player.radius + 45 }    // 精力 - 橙色
    };
    
    // 渲染状态圆环
    ctx.lineWidth = 4;
    
    // 生命圆环
    const healthPercent = game.player.health / game.player.maxHealth;
    ctx.strokeStyle = ringConfig.health.color;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(game.player.x, game.player.y, ringConfig.health.radius, -Math.PI / 2, 
           -Math.PI / 2 + (Math.PI * 2 * healthPercent));
    ctx.stroke();
    
    // 魔力圆环
    const manaPercent = game.player.mana / game.player.maxMana;
    ctx.strokeStyle = ringConfig.mana.color;
    ctx.beginPath();
    ctx.arc(game.player.x, game.player.y, ringConfig.mana.radius, -Math.PI / 2, 
           -Math.PI / 2 + (Math.PI * 2 * manaPercent));
    ctx.stroke();
    
    // 怒气圆环
    const ragePercent = game.player.rage / game.player.maxRage;
    ctx.strokeStyle = ringConfig.rage.color;
    ctx.beginPath();
    ctx.arc(game.player.x, game.player.y, ringConfig.rage.radius, -Math.PI / 2, 
           -Math.PI / 2 + (Math.PI * 2 * ragePercent));
    ctx.stroke();
    
    // 精力圆环
    const staminaPercent = game.player.stamina / game.player.maxStamina;
    ctx.strokeStyle = ringConfig.stamina.color;
    ctx.beginPath();
    ctx.arc(game.player.x, game.player.y, ringConfig.stamina.radius, -Math.PI / 2, 
           -Math.PI / 2 + (Math.PI * 2 * staminaPercent));
    ctx.stroke();
    
    // 重置透明度
    ctx.globalAlpha = 1.0;
    
    // 检查三相之力buff是否激活
    const hasTrinityForce = game.buffSystem && game.buffSystem.isBuffActive('trinityForce');
    
    if (hasTrinityForce) {
        // 三相之力金光闪烁效果
        const time = performance.now() * 0.01;
        const glowIntensity = Math.sin(time * 2) * 0.3 + 0.7; // 0.4-1.0之间闪烁
        
        // 外层金光光晕
        const glowRadius = game.player.radius + 8;
        const gradient = ctx.createRadialGradient(
            game.player.x, game.player.y, game.player.radius,
            game.player.x, game.player.y, glowRadius
        );
        gradient.addColorStop(0, `rgba(255, 215, 0, ${glowIntensity * 0.8})`);
        gradient.addColorStop(0.7, `rgba(255, 215, 0, ${glowIntensity * 0.4})`);
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(game.player.x, game.player.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // 玩家主体（带金光色调）
        const playerColor = config.colors.player;
        const r = parseInt(playerColor.slice(1, 3), 16);
        const g = parseInt(playerColor.slice(3, 5), 16);
        const b = parseInt(playerColor.slice(5, 7), 16);
        
        // 混合金色
        const goldR = Math.min(255, r + 100 * glowIntensity);
        const goldG = Math.min(255, g + 80 * glowIntensity);
        const goldB = Math.max(0, b - 20 * glowIntensity);
        
        ctx.fillStyle = `rgb(${Math.floor(goldR)}, ${Math.floor(goldG)}, ${Math.floor(goldB)})`;
        ctx.beginPath();
        ctx.arc(game.player.x, game.player.y, game.player.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 金色边框
        ctx.strokeStyle = `rgba(255, 215, 0, ${glowIntensity})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(game.player.x, game.player.y, game.player.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // 内层金光粒子效果
        for (let i = 0; i < 6; i++) {
            const angle = time + (i * Math.PI / 3);
            const distance = game.player.radius * 0.6;
            const particleX = game.player.x + Math.cos(angle) * distance;
            const particleY = game.player.y + Math.sin(angle) * distance;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${glowIntensity * 0.8})`;
            ctx.beginPath();
            ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        // 检查日炎buff是否激活
        const hasSolarFlare = game.buffSystem && game.buffSystem.isBuffActive('solarFlare');
        
        if (hasSolarFlare) {
            // 日炎红光闪烁效果
            const solarFlareData = game.buffSystem.getSolarFlareAura();
            if (solarFlareData) {
                const time = performance.now() * 0.01;
                const redGlowIntensity = Math.sin(time * 3) * 0.4 + 0.6; // 0.2-1.0之间闪烁
                
                // 外层红光光晕
                const glowRadius = game.player.radius + 12;
                const gradient = ctx.createRadialGradient(
                    game.player.x, game.player.y, game.player.radius,
                    game.player.x, game.player.y, glowRadius
                );
                gradient.addColorStop(0, `rgba(255, 68, 68, ${redGlowIntensity * 0.9})`);
                gradient.addColorStop(0.6, `rgba(255, 68, 68, ${redGlowIntensity * 0.5})`);
                gradient.addColorStop(1, 'rgba(255, 68, 68, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(game.player.x, game.player.y, glowRadius, 0, Math.PI * 2);
                ctx.fill();
                
                // 灼烧光环效果
                const auraRadius = solarFlareData.radius;
                const maxAuraRadius = solarFlareData.maxRadius;
                const auraIntensity = Math.min(1, auraRadius / maxAuraRadius);
                
                ctx.strokeStyle = `rgba(255, 100, 100, ${auraIntensity * 0.6})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(game.player.x, game.player.y, auraRadius, 0, Math.PI * 2);
                ctx.stroke();
                
                // 玩家主体（带红光色调）
                const playerColor = config.colors.player;
                const r = parseInt(playerColor.slice(1, 3), 16);
                const g = parseInt(playerColor.slice(3, 5), 16);
                const b = parseInt(playerColor.slice(5, 7), 16);
                
                // 混合红色
                const redR = Math.min(255, r + 120 * redGlowIntensity);
                const redG = Math.max(0, g - 30 * redGlowIntensity);
                const redB = Math.max(0, b - 30 * redGlowIntensity);
                
                ctx.fillStyle = `rgb(${Math.floor(redR)}, ${Math.floor(redG)}, ${Math.floor(redB)})`;
                ctx.beginPath();
                ctx.arc(game.player.x, game.player.y, game.player.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // 红色边框
                ctx.strokeStyle = `rgba(255, 68, 68, ${redGlowIntensity})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(game.player.x, game.player.y, game.player.radius, 0, Math.PI * 2);
                ctx.stroke();
                
                // 内层红光粒子效果
                for (let i = 0; i < 8; i++) {
                    const angle = time * 2 + (i * Math.PI / 4);
                    const distance = game.player.radius * 0.7;
                    const particleX = game.player.x + Math.cos(angle) * distance;
                    const particleY = game.player.y + Math.sin(angle) * distance;
                    
                    ctx.fillStyle = `rgba(255, 150, 150, ${redGlowIntensity * 0.9})`;
                    ctx.beginPath();
                    ctx.arc(particleX, particleY, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                // 如果无法获取日炎数据，使用普通渲染
                ctx.fillStyle = config.colors.player;
                ctx.beginPath();
                ctx.arc(game.player.x, game.player.y, game.player.radius, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.strokeStyle = '#1976D2';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(game.player.x, game.player.y, game.player.radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else {
            // 普通玩家主体
            ctx.fillStyle = config.colors.player;
            ctx.beginPath();
            ctx.arc(game.player.x, game.player.y, game.player.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // 玩家边框
            ctx.strokeStyle = '#1976D2';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(game.player.x, game.player.y, game.player.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    // 风火轮效果
    if (game.player.windFireWheels.active && game.player.windFireWheels.orbs) {
        // 检测三相之力buff状态
        const hasTrinityForce = game.buffSystem && game.buffSystem.isBuffActive('trinityForce');
        
        ctx.fillStyle = '#FF4081';
        ctx.strokeStyle = '#FF0000'; // 红色线段
        ctx.shadowColor = '#FF4081';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2;
        
        // 存储圆圈位置用于连线
        const orbPositions = [];
        
        // 根据三相之力状态调整风火轮数量和排列
        const wheelCount = hasTrinityForce ? 3 : 4;
        const angleStep = hasTrinityForce ? (2 * Math.PI / 3) : (Math.PI / 2);
        
        // 三相之力状态下增大风火轮半径和球体尺寸
        const wheelRadius = hasTrinityForce ? game.player.windFireWheels.radius * 1.5 : game.player.windFireWheels.radius;
        const orbSize = hasTrinityForce ? game.player.windFireWheels.orbSize * 3 : game.player.windFireWheels.orbSize * 2;
        
        // 绘制圆圈
        for (let i = 0; i < wheelCount; i++) {
            const angle = game.player.windFireWheels.rotation + (i * angleStep);
            const orbX = game.player.x + Math.cos(angle) * wheelRadius;
            const orbY = game.player.y + Math.sin(angle) * wheelRadius;
            
            orbPositions.push({x: orbX, y: orbY});
            
            ctx.beginPath();
            ctx.arc(orbX, orbY, orbSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 绘制连接线段
        ctx.shadowBlur = 0;
        for (let i = 0; i < wheelCount; i++) {
            const nextIndex = (i + 1) % wheelCount;
            ctx.beginPath();
            ctx.moveTo(orbPositions[i].x, orbPositions[i].y);
            ctx.lineTo(orbPositions[nextIndex].x, orbPositions[nextIndex].y);
            ctx.stroke();
        }
    }
    
    // 激光效果
    if (game.player.laser.active) {
        // 检测三相之力buff状态
        const hasTrinityForce = game.buffSystem && game.buffSystem.isBuffActive('trinityForce');
        
        // 定义要绘制的激光束
        const laserBeams = [];
        
        if (hasTrinityForce) {
            // 三股激光
            laserBeams.push(
                { startX: game.player.laser.startX, startY: game.player.laser.startY, endX: game.player.laser.endX, endY: game.player.laser.endY }, // 中间
                { startX: game.player.laser.startX, startY: game.player.laser.startY, endX: game.player.laser.leftEndX, endY: game.player.laser.leftEndY }, // 左侧
                { startX: game.player.laser.startX, startY: game.player.laser.startY, endX: game.player.laser.rightEndX, endY: game.player.laser.rightEndY } // 右侧
            );
        } else {
            // 单股激光
            laserBeams.push(
                { startX: game.player.laser.startX, startY: game.player.laser.startY, endX: game.player.laser.endX, endY: game.player.laser.endY }
            );
        }
        
        // 绘制所有激光束
        for (const beam of laserBeams) {
            // 绘制激光主体
            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = game.player.laser.width;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(beam.startX, beam.startY);
            ctx.lineTo(beam.endX, beam.endY);
            ctx.stroke();
            
            // 绘制激光发光效果
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
            ctx.lineWidth = game.player.laser.width * 3;
            ctx.beginPath();
            ctx.moveTo(beam.startX, beam.startY);
            ctx.lineTo(beam.endX, beam.endY);
            ctx.stroke();
            
            // 绘制激光核心
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = game.player.laser.width * 0.3;
            ctx.beginPath();
            ctx.moveTo(beam.startX, beam.startY);
            ctx.lineTo(beam.endX, beam.endY);
            ctx.stroke();
        }
    }
}

// 渲染投射物
function renderProjectiles(ctx, viewLeft, viewRight, viewTop, viewBottom) {
    for (const projectile of game.projectiles) {
        if (!projectile.active) continue;
        
        // 根据投射物所有者设置颜色
        if (projectile.owner === 'enemy') {
            ctx.fillStyle = '#FF0000'; // 敌人子弹为红色
        } else {
            ctx.fillStyle = config.colors.projectile; // 玩家子弹保持原色
        }
        
        const radius = projectile.radius || projectile.size || 4;
        if (projectile.x + radius >= viewLeft && 
            projectile.x - radius <= viewRight &&
            projectile.y + radius >= viewTop && 
            projectile.y - radius <= viewBottom) {
            ctx.beginPath();
            ctx.arc(projectile.x, projectile.y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// 渲染友方球球
function renderFriendlyBalls(ctx, viewLeft, viewRight, viewTop, viewBottom) {
    ctx.fillStyle = config.colors.friendlyBall;
    for (const ball of game.friendlyBalls) {
        if (ball.x + ball.size >= viewLeft && 
            ball.x - ball.size <= viewRight &&
            ball.y + ball.size >= viewTop && 
            ball.y - ball.size <= viewBottom) {
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// 渲染带刺球球
function renderSpikeBalls(ctx, viewLeft, viewRight, viewTop, viewBottom) {
    for (const spikeBall of game.spikedBalls) {
        if (spikeBall.x + spikeBall.size >= viewLeft && 
            spikeBall.x - spikeBall.size <= viewRight &&
            spikeBall.y + spikeBall.size >= viewTop && 
            spikeBall.y - spikeBall.size <= viewBottom) {
            
            // 主体
            ctx.fillStyle = config.colors.spikeBall;
            ctx.beginPath();
            ctx.arc(spikeBall.x, spikeBall.y, spikeBall.size, 0, Math.PI * 2);
            ctx.fill();
            
            // 刺
            ctx.strokeStyle = '#8B0000';
            ctx.lineWidth = 2;
            const spikeCount = 8;
            for (let i = 0; i < spikeCount; i++) {
                const angle = (i / spikeCount) * Math.PI * 2;
                const startX = spikeBall.x + Math.cos(angle) * spikeBall.size;
                const startY = spikeBall.y + Math.sin(angle) * spikeBall.size;
                const endX = spikeBall.x + Math.cos(angle) * (spikeBall.size + 8);
                const endY = spikeBall.y + Math.sin(angle) * (spikeBall.size + 8);
                
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }
        }
    }
}

// 渲染泡泡道具
function renderBubblePowerups(ctx, viewLeft, viewRight, viewTop, viewBottom) {
    for (const bubble of game.bubblePowerups) {
        if (bubble.x + bubble.size >= viewLeft && 
            bubble.x - bubble.size <= viewRight &&
            bubble.y + bubble.size >= viewTop && 
            bubble.y - bubble.size <= viewBottom) {
            
            // 泡泡主体
            ctx.fillStyle = config.colors.bubblePowerup;
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
            ctx.fill();
            
            // 泡泡边框
            ctx.strokeStyle = '#E0F7FA';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
            ctx.stroke();
            
            // 闪烁效果
            const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(224, 247, 250, ${pulse * 0.5})`;
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y, bubble.size * 0.7, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// 渲染安全区
function renderSafeZones(ctx, viewLeft, viewRight, viewTop, viewBottom) {
    if (!window.safeZoneSystem || !window.safeZoneSystem.safeZones) {
        return;
    }
    
    const currentTime = performance.now();
    
    for (const safeZone of window.safeZoneSystem.safeZones) {
        // 检查安全区是否在视野范围内
        const safeZoneRadius = 400; // 安全区半径
        if (safeZone.x + safeZoneRadius >= viewLeft && 
            safeZone.x - safeZoneRadius <= viewRight &&
            safeZone.y + safeZoneRadius >= viewTop && 
            safeZone.y - safeZoneRadius <= viewBottom) {
            
            // 绘制安全区边界 - 减少闪烁频率
            const pulseIntensity = Math.sin(currentTime * 0.001) * 0.2 + 0.8;
            
            // 外圈 - 淡绿色光环
            ctx.strokeStyle = `rgba(0, 255, 136, ${pulseIntensity * 0.7})`;
            ctx.lineWidth = 3;
            ctx.setLineDash([15, 8]);
            ctx.beginPath();
            ctx.arc(safeZone.x, safeZone.y, safeZoneRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            // 内圈 - 更亮的绿色
            ctx.strokeStyle = `rgba(136, 255, 136, ${pulseIntensity * 0.9})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 5]);
            ctx.beginPath();
            ctx.arc(safeZone.x, safeZone.y, safeZoneRadius - 15, 0, Math.PI * 2);
            ctx.stroke();
            
            // 重置线条样式
            ctx.setLineDash([]);
            
            // 绘制安全区填充（半透明）
            const fillGradient = ctx.createRadialGradient(
                safeZone.x, safeZone.y, 0,
                safeZone.x, safeZone.y, safeZoneRadius
            );
            fillGradient.addColorStop(0, 'rgba(0, 255, 136, 0.1)');
            fillGradient.addColorStop(0.7, 'rgba(0, 255, 136, 0.05)');
            fillGradient.addColorStop(1, 'rgba(0, 255, 136, 0)');
            
            ctx.fillStyle = fillGradient;
            ctx.beginPath();
            ctx.arc(safeZone.x, safeZone.y, safeZoneRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制守护怪物
            const guardians = window.safeZoneSystem.getGuardians();
            const nearbyGuardian = guardians.find(guardian => {
                const distance = Math.sqrt(
                    Math.pow(guardian.x - safeZone.x, 2) + Math.pow(guardian.y - safeZone.y, 2)
                );
                return distance <= 100; // 守护怪物在安全区中心100像素范围内
            });
            
            if (nearbyGuardian) {
                const guardian = nearbyGuardian;
                
                // 守护怪物光环效果（进一步减少闪烁）
                const guardianPulse = Math.sin(currentTime * 0.0015) * 0.15 + 0.85;
                const glowRadius = guardian.radius + 20;
                
                const guardianGradient = ctx.createRadialGradient(
                    guardian.x, guardian.y, guardian.radius,
                    guardian.x, guardian.y, glowRadius
                );
                guardianGradient.addColorStop(0, `rgba(255, 215, 0, ${guardianPulse * 0.8})`);
                guardianGradient.addColorStop(0.6, `rgba(255, 215, 0, ${guardianPulse * 0.4})`);
                guardianGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
                
                ctx.fillStyle = guardianGradient;
                ctx.beginPath();
                ctx.arc(guardian.x, guardian.y, glowRadius, 0, Math.PI * 2);
                ctx.fill();
                
                // 守护怪物主体（金色）
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(guardian.x, guardian.y, guardian.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // 守护怪物边框
                ctx.strokeStyle = '#FFA500';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(guardian.x, guardian.y, guardian.radius, 0, Math.PI * 2);
                ctx.stroke();
                
                // 旋转光环效果（减慢旋转速度）
                const rotationAngle = currentTime * 0.001;
                for (let i = 0; i < 8; i++) {
                    const angle = rotationAngle + (i / 8) * Math.PI * 2;
                    const orbDistance = guardian.radius + 15;
                    const orbX = guardian.x + Math.cos(angle) * orbDistance;
                    const orbY = guardian.y + Math.sin(angle) * orbDistance;
                    
                    ctx.fillStyle = `rgba(255, 255, 0, ${guardianPulse})`;
                    ctx.beginPath();
                    ctx.arc(orbX, orbY, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // 守护怪物等级显示
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`Lv.${guardian.level}`, guardian.x, guardian.y + 5);
            }
            
            // 安全区中心标记
            ctx.fillStyle = `rgba(0, 255, 136, ${pulseIntensity})`;
            ctx.beginPath();
            ctx.arc(safeZone.x, safeZone.y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// 渲染特效
function renderEffects(ctx) {
    // 绘制粒子
    renderParticles(ctx);
    
    // 绘制数值显示
    renderNumbers(ctx);
    
    // 绘制浮动文本
    renderFloatingTexts(ctx);
    
    // 绘制AOE圈圈
    renderAoeRings(ctx);
    
    // 绘制暴击显示
    renderCriticalDisplays(ctx);
}

// 渲染粒子
function renderParticles(ctx) {
    for (const particle of game.particles) {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.alpha;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// 渲染数值显示
function renderNumbers(ctx) {
    // 伤害数值
    ctx.textAlign = 'center';
    for (const damageNumber of game.damageNumbers) {
        if (!damageNumber.active) continue;
        
        // 根据伤害类型设置颜色和字体 - 所有伤害数值都使用红色
        let color, fontSize, fontWeight;
        if (damageNumber.isCritical) {
            // 暴击伤害 - 深红色，粗体
            color = `rgba(220, 20, 60, ${damageNumber.alpha})`;
            fontSize = '60px';
            fontWeight = 'bold';
        } else if (damageNumber.damage >= 50) {
            // 高伤害 - 红色
            color = `rgba(255, 0, 0, ${damageNumber.alpha})`;
            fontSize = '54px';
            fontWeight = 'bold';
        } else if (damageNumber.damage >= 20) {
            // 中等伤害 - 红色
            color = `rgba(255, 0, 0, ${damageNumber.alpha})`;
            fontSize = '48px';
            fontWeight = 'normal';
        } else {
            // 低伤害 - 浅红色
            color = `rgba(255, 69, 69, ${damageNumber.alpha})`;
            fontSize = '42px';
            fontWeight = 'normal';
        }
        
        // 设置字体和描边
        ctx.font = `${fontWeight} ${fontSize} Arial`;
        ctx.strokeStyle = `rgba(0, 0, 0, ${damageNumber.alpha * 0.8})`;
        ctx.lineWidth = 1;
        
        // 绘制描边和文字
        const text = `-${damageNumber.damage}`;
        ctx.strokeText(text, damageNumber.x, damageNumber.y);
        ctx.fillStyle = color;
        ctx.fillText(text, damageNumber.x, damageNumber.y);
    }
    
    // 经验数值
    for (const expNumber of game.experienceNumbers) {
        if (!expNumber.active) continue;
        
        // 根据经验值大小设置颜色和字体
        let color, fontSize, fontWeight;
        if (expNumber.exp >= 50) {
            // 大量经验 - 亮绿色
            color = `rgba(50, 255, 50, ${expNumber.alpha})`;
            fontSize = '54px';
            fontWeight = 'bold';
        } else if (expNumber.exp >= 20) {
            // 中等经验 - 绿色
            color = `rgba(0, 255, 0, ${expNumber.alpha})`;
            fontSize = '48px';
            fontWeight = 'normal';
        } else {
            // 少量经验 - 浅绿色
            color = `rgba(144, 238, 144, ${expNumber.alpha})`;
            fontSize = '42px';
            fontWeight = 'normal';
        }
        
        // 设置字体和描边
        ctx.font = `${fontWeight} ${fontSize} Arial`;
        ctx.strokeStyle = `rgba(0, 0, 0, ${expNumber.alpha * 0.8})`;
        ctx.lineWidth = 1;
        
        // 绘制描边和文字
        const text = `+${expNumber.exp} EXP`;
        ctx.strokeText(text, expNumber.x, expNumber.y);
        ctx.fillStyle = color;
        ctx.fillText(text, expNumber.x, expNumber.y);
    }
    
    ctx.globalAlpha = 1;
}

// 渲染浮动文本
function renderFloatingTexts(ctx) {
    for (const text of game.floatingTexts) {
        ctx.font = `${text.size}px Arial`;
        ctx.fillStyle = text.color;
        ctx.globalAlpha = text.alpha;
        ctx.textAlign = 'center';
        ctx.fillText(text.text, text.x, text.y);
    }
    ctx.globalAlpha = 1;
}

// 渲染AOE圈圈
function renderAoeRings(ctx) {
    for (const ring of game.aoeRings) {
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = ring.lineWidth;
        ctx.globalAlpha = ring.alpha;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
}

// 渲染暴击显示
function renderCriticalDisplays(ctx) {
    for (const critical of game.criticalDisplays) {
        ctx.font = `${critical.size}px Arial`;
        ctx.fillStyle = critical.color;
        ctx.globalAlpha = critical.alpha;
        ctx.textAlign = 'center';
        ctx.fillText(critical.text, critical.x, critical.y);
    }
    ctx.globalAlpha = 1;
}

// UI绘制函数
function drawUI() {
    const ctx = game.ctx;
    
    // 基础状态显示
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    
    // 分数和等级
    ctx.fillText(`分数: ${game.score}`, 10, 30);
    ctx.fillText(`等级: ${game.player.level}`, 10, 50);
    
    // 经验条
    const expBarWidth = 200;
    const expBarHeight = 10;
    const expPercentage = game.player.exp / game.player.expToNextLevel;
    
    ctx.fillStyle = '#333';
    ctx.fillRect(10, 60, expBarWidth, expBarHeight);
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(10, 60, expBarWidth * expPercentage, expBarHeight);
    ctx.strokeStyle = '#FFF';
    ctx.strokeRect(10, 60, expBarWidth, expBarHeight);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`经验: ${game.player.exp}/${game.player.expToNextLevel}`, 10, 85);
    
    // 生命值
    ctx.fillText(`生命: ${Math.floor(game.player.health)}/${Math.floor(game.player.maxHealth)}`, 10, 105);
    
    // 魔力值
    ctx.fillText(`魔力: ${Math.floor(game.player.mana)}/${game.player.maxMana}`, 10, 125);
    
    // 怒气值
    const rageValue = isNaN(game.player.rage) ? 0 : Math.floor(game.player.rage);
    const maxRageValue = isNaN(game.player.maxRage) ? 100 : game.player.maxRage;
    ctx.fillText(`怒气: ${rageValue}/${maxRageValue}`, 10, 145);
    
    // 精力值
    ctx.fillText(`精力: ${Math.floor(game.player.stamina)}/${game.player.maxStamina}`, 10, 165);
    
    // FPS显示
    if (game.showFPS && game.fps) {
        ctx.fillText(`FPS: ${game.fps}`, 10, 185);
    }
    
    // 控制状态调试信息
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`控制状态: A:${game.keys['a']} D:${game.keys['d']} W:${game.keys['w']} S:${game.keys['s']}`, 10, game.gameHeight - 80);
    ctx.fillText(`移动状态: dx:${game.player.dx.toFixed(2)} dy:${game.player.dy.toFixed(2)}`, 10, game.gameHeight - 60);
    ctx.fillText(`游戏尺寸: width:${game.gameWidth} height:${game.gameHeight}`, 10, game.gameHeight - 40);
    ctx.fillText(`坐标: x:${game.player.x.toFixed(2)} y:${game.player.y.toFixed(2)}`, 10, game.gameHeight - 100);


    ctx.fillText(`在地面上: ${game.player.onGround}`, 10, game.gameHeight - 140);
    
    // 性能模式指示器
    ctx.fillText(`性能模式: ${game.performanceMode}`, 10, 205);
    
    // 游戏对象统计
    ctx.fillText(`敌人: ${game.enemies.length}`, 10, 225);
    ctx.fillText(`投射物: ${game.projectiles.length}`, 10, 245);
    ctx.fillText(`粒子: ${game.particles.length}`, 10, 265);
    
    // 怪物统计面板 - v3.8.0 (调试版本)
    // 面板背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(game.gameWidth - 320, 10, 310, 280);
    ctx.strokeStyle = '#FFF';
    ctx.strokeRect(game.gameWidth - 320, 10, 310, 280);
    
    // 调试信息：检查monsterStats对象
    const statsExists = typeof window.monsterStats !== 'undefined';
    const updateExists = typeof window.update !== 'undefined';
    
    // 标题
    ctx.fillStyle = '#FFD700';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`怪物统计面板 (调试: ${statsExists ? '✓' : '✗'})`, game.gameWidth - 315, 30);
    
    if (window.monsterStats) {
        const stats = window.monsterStats;
        
        // 总计统计
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px Arial';
        ctx.fillText(`总生成: ${stats.totalSpawned}`, game.gameWidth - 315, 50);
        ctx.fillText(`总击杀: ${stats.totalKilled}`, game.gameWidth - 315, 70);
        
        // 精英怪物调试信息
        ctx.fillStyle = '#FF6B6B';
        ctx.fillText('精英怪物调试:', game.gameWidth - 315, 95);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`尝试生成: ${stats.eliteSpawnAttempts}`, game.gameWidth - 315, 115);
        ctx.fillText(`成功生成: ${stats.eliteSpawnSuccess}`, game.gameWidth - 315, 135);
        ctx.fillText(`距离限制失败: ${stats.eliteSpawnFailReasons.distance}`, game.gameWidth - 315, 155);
        ctx.fillText(`随机概率失败: ${stats.eliteSpawnFailReasons.random}`, game.gameWidth - 315, 175);
        
        // 按类型统计 - 分两列显示
        ctx.fillStyle = '#87CEEB';
        ctx.fillText('类型统计 (生成/击杀):', game.gameWidth - 315, 195);
        
        const types = Object.keys(stats.spawnedByType);
        // 过滤掉elite，因为我们要单独显示精英怪物子类型
        const filteredTypes = types.filter(type => type !== 'elite');
        const leftColumn = filteredTypes.slice(0, 6);
        const rightColumn = filteredTypes.slice(6);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        
        // 左列
        leftColumn.forEach((type, index) => {
            const spawned = stats.spawnedByType[type];
            const killed = stats.killedByType[type];
            const y = 215 + index * 15;
            ctx.fillText(`${type}: ${spawned}/${killed}`, game.gameWidth - 315, y);
        });
        
        // 右列
        rightColumn.forEach((type, index) => {
            const spawned = stats.spawnedByType[type];
            const killed = stats.killedByType[type];
            const y = 215 + index * 15;
            ctx.fillText(`${type}: ${spawned}/${killed}`, game.gameWidth - 160, y);
        });
        
        // 精英怪物子类型统计
        ctx.fillStyle = '#FFD700';
        ctx.font = '12px Arial';
        const eliteTypes = ['graviton', 'destroyer', 'guardian', 'vortex'];
        let eliteY = 305;
        ctx.fillText('精英怪物类型:', game.gameWidth - 315, eliteY);
        eliteY += 15;
        
        eliteTypes.forEach((eliteType, index) => {
            const spawned = stats.spawnedByType[eliteType] || 0;
            const killed = stats.killedByType[eliteType] || 0;
            ctx.fillText(`${eliteType}: ${spawned}/${killed}`, game.gameWidth - 315, eliteY + index * 15);
        });
        
        // 精英怪物生成率
        const eliteRate = stats.eliteSpawnAttempts > 0 ? 
            ((stats.eliteSpawnSuccess / stats.eliteSpawnAttempts) * 100).toFixed(1) : '0.0';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`精英生成率: ${eliteRate}%`, game.gameWidth - 315, 285);
    } else {
         // 显示调试信息
         ctx.fillStyle = '#FF6B6B';
         ctx.font = '14px Arial';
         ctx.fillText('怪物统计系统未初始化', game.gameWidth - 315, 50);
         ctx.fillText(`update函数存在: ${updateExists ? '是' : '否'}`, game.gameWidth - 315, 70);
         ctx.fillText('请检查gameLogic.js是否正确加载', game.gameWidth - 315, 90);
     }
    

    
    // 狂潮模式显示
    if (game.frenzyMode.active) {
        ctx.fillStyle = '#FF4444';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `狂潮模式: ${Math.ceil(game.frenzyMode.duration / 60)}秒`, 
            game.gameWidth / 2, 
            50
        );
        
        // 警告效果
        const flash = Math.sin(Date.now() * 0.02) > 0;
        if (flash) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
            ctx.fillRect(0, 0, game.gameWidth, game.gameHeight);
        }
    } else if (game.frenzyMode.cooldown > 0) {
        ctx.fillStyle = '#888888';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `狂潮冷却: ${Math.ceil(game.frenzyMode.cooldown / 60)}秒`, 
            game.gameWidth / 2, 
            30
        );
    }
    
    // 控制提示
    ctx.fillStyle = '#CCCCCC';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    const controlsY = game.gameHeight - 140;
    ctx.fillText('控制:', game.gameWidth - 10, controlsY);
    ctx.fillText('A/D 或 ←/→ - 左右移动', game.gameWidth - 10, controlsY + 15);
    ctx.fillText('空格 - 蓄力跳跃', game.gameWidth - 10, controlsY + 30);
    ctx.fillText('W - 二段跳 (梯子上下)', game.gameWidth - 10, controlsY + 45);
    ctx.fillText('S - 快速下降 (梯子下)', game.gameWidth - 10, controlsY + 60);
    ctx.fillText('鼠标 - 瞄准和射击', game.gameWidth - 10, controlsY + 75);
    ctx.fillText('X - 风火轮 (15怒气)', game.gameWidth - 10, controlsY + 90);
    ctx.fillText('R - 激光 (魔力)', game.gameWidth - 10, controlsY + 105);
    ctx.fillText('F - 闪现 (精力)', game.gameWidth - 10, controlsY + 120);
    
    // 主角附近的动态分数显示
    drawAnimatedScore();
    
    // 怪物击杀统计界面
    if (game.ui && game.ui.showDetailedStats) {
        drawMonsterKillStats();
    } else {
        drawSimpleKillStats();
    }
}

// 绘制怪物击杀统计界面
function drawMonsterKillStats() {
    const ctx = game.ctx;
    
    if (!window.monsterStats) return;
    
    const stats = window.monsterStats;
    const panelHeight = 140;
    const panelY = game.gameHeight - panelHeight - 10;
    const panelWidth = game.gameWidth - 20;
    
    // 面板背景渐变
    const gradient = ctx.createLinearGradient(10, panelY, 10, panelY + panelHeight);
    gradient.addColorStop(0, 'rgba(20, 20, 40, 0.95)');
    gradient.addColorStop(1, 'rgba(10, 10, 20, 0.95)');
    ctx.fillStyle = gradient;
    ctx.fillRect(10, panelY, panelWidth, panelHeight);
    
    // 面板边框
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, panelY, panelWidth, panelHeight);
    
    // 内边框装饰
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(15, panelY + 5, panelWidth - 10, panelHeight - 10);
    
    // 标题背景
    const titleGradient = ctx.createLinearGradient(20, panelY + 5, 200, panelY + 25);
    titleGradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
    titleGradient.addColorStop(1, 'rgba(255, 215, 0, 0.1)');
    ctx.fillStyle = titleGradient;
    ctx.fillRect(20, panelY + 5, 180, 20);
    
    // 标题
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 2;
    ctx.fillText('⚔️ 怪物击杀统计', 25, panelY + 20);
    ctx.shadowBlur = 0;
    
    // 总击杀数和图例
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`总击杀: ${stats.totalKilled}`, 25, panelY + 45);
    
    // 图例
    const legendX = panelWidth - 200;
    ctx.fillStyle = '#CCCCCC';
    ctx.font = '12px Arial';
    ctx.fillText('图例:', legendX, panelY + 25);
    
    // 绘制图例点
    ctx.fillStyle = '#4444FF';
    ctx.beginPath();
    ctx.arc(legendX + 25, panelY + 21, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#CCCCCC';
    ctx.fillText('10', legendX + 35, panelY + 25);
    
    ctx.fillStyle = '#44FF44';
    ctx.beginPath();
    ctx.arc(legendX + 55, panelY + 21, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#CCCCCC';
    ctx.fillText('100', legendX + 65, panelY + 25);
    
    ctx.fillStyle = '#FF4444';
    ctx.beginPath();
    ctx.arc(legendX + 95, panelY + 21, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#CCCCCC';
    ctx.fillText('1K', legendX + 105, panelY + 25);
    
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(legendX + 130, panelY + 21, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#CCCCCC';
    ctx.fillText('10K', legendX + 140, panelY + 25);
    
    // 获取所有怪物类型
    const monsterTypes = Object.keys(stats.killedByType).filter(type => stats.killedByType[type] > 0);
    
    // 计算布局
    const startX = 25;
    const startY = panelY + 70;
    const itemWidth = 140;
    const itemHeight = 22;
    const cols = Math.floor((panelWidth - 40) / itemWidth);
    
    // 绘制每种怪物的统计
    monsterTypes.forEach((type, index) => {
        const killCount = stats.killedByType[type];
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = startX + col * itemWidth;
        const y = startY + row * itemHeight;
        
        // 怪物条目背景
        if (killCount >= 1000) {
            ctx.fillStyle = 'rgba(255, 68, 68, 0.1)';
        } else if (killCount >= 100) {
            ctx.fillStyle = 'rgba(68, 255, 68, 0.1)';
        } else if (killCount >= 10) {
            ctx.fillStyle = 'rgba(68, 68, 255, 0.1)';
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        }
        ctx.fillRect(x - 2, y - 15, itemWidth - 5, 18);
        
        // 怪物名称
        ctx.fillStyle = getMonsterColor(type);
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        const displayName = getMonsterDisplayName(type);
        ctx.fillText(`${displayName}:`, x, y);
        
        // 绘制击杀数量点
        drawKillCountDots(ctx, x + 60, y - 8, killCount);
        
        // 显示具体数字
        ctx.fillStyle = '#AAAAAA';
        ctx.font = '10px Arial';
        ctx.fillText(killCount.toString(), x + 110, y);
    });
}

// 绘制击杀数量点
function drawKillCountDots(ctx, x, y, killCount) {
    const dotSize = 4;
    const dotSpacing = 10;
    let currentX = x;
    
    // 计算各种点的数量
    const goldDots = Math.floor(killCount / 10000); // 金色点：10000个
    const redDots = Math.floor((killCount % 10000) / 1000); // 红色点：1000个
    const greenDots = Math.floor((killCount % 1000) / 100); // 绿色点：100个
    const blueDots = Math.floor((killCount % 100) / 10); // 蓝色点：10个
    
    // 绘制金色点（10000个）- 带发光效果
    if (goldDots > 0) {
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < goldDots && i < 10; i++) {
            ctx.beginPath();
            ctx.arc(currentX, y, dotSize, 0, Math.PI * 2);
            ctx.fill();
            // 内部高光
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#FFFF88';
            ctx.beginPath();
            ctx.arc(currentX - 1, y - 1, dotSize * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFD700';
            ctx.shadowBlur = 8;
            currentX += dotSpacing;
        }
        ctx.shadowBlur = 0;
    }
    
    // 绘制红色点（1000个）- 带发光效果
    if (redDots > 0) {
        ctx.shadowColor = '#FF4444';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#FF4444';
        for (let i = 0; i < redDots && i < 10; i++) {
            ctx.beginPath();
            ctx.arc(currentX, y, dotSize * 0.9, 0, Math.PI * 2);
            ctx.fill();
            // 内部高光
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#FF8888';
            ctx.beginPath();
            ctx.arc(currentX - 0.5, y - 0.5, dotSize * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FF4444';
            ctx.shadowBlur = 6;
            currentX += dotSpacing;
        }
        ctx.shadowBlur = 0;
    }
    
    // 绘制绿色点（100个）- 带轻微发光
    if (greenDots > 0) {
        ctx.shadowColor = '#44FF44';
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#44FF44';
        for (let i = 0; i < greenDots && i < 10; i++) {
            ctx.beginPath();
            ctx.arc(currentX, y, dotSize * 0.8, 0, Math.PI * 2);
            ctx.fill();
            // 内部高光
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#88FF88';
            ctx.beginPath();
            ctx.arc(currentX - 0.5, y - 0.5, dotSize * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#44FF44';
            ctx.shadowBlur = 4;
            currentX += dotSpacing;
        }
        ctx.shadowBlur = 0;
    }
    
    // 绘制蓝色点（10个）- 带轻微发光
    if (blueDots > 0) {
        ctx.shadowColor = '#4444FF';
        ctx.shadowBlur = 3;
        ctx.fillStyle = '#4444FF';
        for (let i = 0; i < blueDots && i < 10; i++) {
            ctx.beginPath();
            ctx.arc(currentX, y, dotSize * 0.7, 0, Math.PI * 2);
            ctx.fill();
            // 内部高光
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#8888FF';
            ctx.beginPath();
            ctx.arc(currentX - 0.3, y - 0.3, dotSize * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#4444FF';
            ctx.shadowBlur = 3;
            currentX += dotSpacing;
        }
        ctx.shadowBlur = 0;
    }
}

// 绘制主角附近的动态分数显示
// 分数显示实例管理系统
if (!window.scoreDisplayInstances) {
    window.scoreDisplayInstances = {
        instances: [],
        lastScore: 0,
        lastUpdateTime: 0
    };
}

function drawAnimatedScore() {
    const ctx = game.ctx;
    
    if (!game.player) return;
    
    const currentTime = performance.now();
    const displaySystem = window.scoreDisplayInstances;
    
    // 检测分数变动（限制更新频率，避免太快）
    const timeSinceLastUpdate = currentTime - displaySystem.lastUpdateTime;
    if (game.score !== displaySystem.lastScore && timeSinceLastUpdate > 300) { // 至少间隔300ms
        // 创建新的分数显示实例
        const playerScreenX = game.player.x - game.camera.x;
        const playerScreenY = game.player.y - game.camera.y;
        
        // 随机位置偏移（在主角附近区域）
        const randomX = (Math.random() - 0.5) * 120; // ±60px范围
        const randomY = (Math.random() - 0.5) * 80 - 80; // 主要在上方
        
        const newInstance = {
            score: game.score,
            x: playerScreenX + randomX,
            y: playerScreenY + randomY,
            createTime: currentTime,
            size: 32 + Math.random() * 8, // 随机大小 32-40px，更大字体
            alpha: 1.0,
            color: `hsl(${45 + Math.random() * 30}, 100%, ${60 + Math.random() * 20}%)` // 随机金色调
        };
        
        displaySystem.instances.push(newInstance);
        displaySystem.lastScore = game.score;
        displaySystem.lastUpdateTime = currentTime;
        
        // 限制实例数量，移除过多的旧实例
        if (displaySystem.instances.length > 2) {
            displaySystem.instances.shift();
        }
    }
    
    // 绘制所有分数实例
    displaySystem.instances.forEach((instance, index) => {
        const age = currentTime - instance.createTime;
        const maxAge = 1200; // 1.2秒生命周期，更快淡出
        
        if (age > maxAge) {
            // 标记为待删除
            instance.toDelete = true;
            return;
        }
        
        // 计算透明度衰减
        const fadeStart = maxAge * 0.3; // 30%时开始淡出，更快淡出
        if (age > fadeStart) {
            instance.alpha = 1 - (age - fadeStart) / (maxAge - fadeStart);
        }
        
        // 轻微的浮动效果（不是抖动）
        const floatOffset = Math.sin((currentTime + index * 1000) * 0.003) * 8;
        
        // 保存状态
        ctx.save();
        
        // 设置透明度
        ctx.globalAlpha = instance.alpha;
        
        // 移动到分数位置
        ctx.translate(instance.x, instance.y + floatOffset);
        
        // 绘制分数文字（无背景）
        ctx.fillStyle = instance.color;
        ctx.font = `bold ${instance.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const scoreText = instance.score.toString();
        ctx.fillText(scoreText, 0, 0);
        
        // 恢复状态
        ctx.restore();
    });
    
    // 清理已过期的实例
    displaySystem.instances = displaySystem.instances.filter(instance => !instance.toDelete);
}

// 绘制简略怪物击杀统计
function drawSimpleKillStats() {
    const ctx = game.ctx;
    
    if (!window.monsterStats) return;
    
    const stats = window.monsterStats;
    const monsterTypes = Object.keys(stats.killedByType).filter(type => {
        const killCount = stats.killedByType[type];
        return killCount >= 10; // 只显示击杀数>=10的怪物（包含蓝色点）
    });
    
    if (monsterTypes.length === 0) return;
    
    // 计算布局
    const startX = 20;
    const startY = game.gameHeight - 40;
    const itemWidth = 80;
    
    // 绘制背景
    const panelWidth = Math.min(monsterTypes.length * itemWidth + 20, game.gameWidth - 40);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(10, startY - 25, panelWidth, 30);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, startY - 25, panelWidth, 30);
    
    // 绘制每种怪物的简略统计
    monsterTypes.forEach((type, index) => {
        const killCount = stats.killedByType[type];
        const x = startX + index * itemWidth;
        const y = startY;
        
        // 怪物名称
        ctx.fillStyle = getMonsterColor(type);
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'left';
        const displayName = getMonsterDisplayName(type);
        ctx.fillText(displayName, x, y - 8);
        
        // 绘制击杀数量点
        drawKillCountDots(ctx, x, y, killCount);
    });
}

// 获取怪物显示颜色
function getMonsterColor(type) {
    const colors = {
        red: '#FF6B6B',
        blue: '#4ECDC4',
        white: '#FFFFFF',
        black: '#888888',
        largered: '#FF4444',
        rotating: '#FF8C00',
        teleport: '#9370DB',
        snake: '#32CD32',
        yellow: '#FFD700',
        control: '#FF69B4',
        elite: '#FFD700',
        graviton: '#8A2BE2',
        destroyer: '#DC143C',
        guardian: '#4169E1',
        vortex: '#00CED1'
    };
    return colors[type] || '#FFFFFF';
}

// 获取怪物显示名称
function getMonsterDisplayName(type) {
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
        elite: '精英球',
        graviton: '引力球',
        destroyer: '毁灭球',
        guardian: '守护球',
        vortex: '漩涡球'
    };
    return names[type] || type;
}



// 游戏结束画面
function gameOver() {
    const ctx = game.ctx;
    
    // 半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, game.gameWidth, game.gameHeight);
    
    // 游戏结束文本
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', game.gameWidth / 2, game.gameHeight / 2 - 50);
    
    // 最终分数
    ctx.font = '24px Arial';
    ctx.fillText(`最终分数: ${game.player.score}`, game.gameWidth / 2, game.gameHeight / 2);
    ctx.fillText(`最终等级: ${game.player.level}`, game.gameWidth / 2, game.gameHeight / 2 + 30);
    
    // 重启提示
    ctx.font = '16px Arial';
    ctx.fillText('刷新页面重新开始', game.gameWidth / 2, game.gameHeight / 2 + 80);
}

// 将函数暴露到全局作用域
window.render = render;
window.renderMapElements = renderMapElements;
window.renderBlocks = renderBlocks;
window.renderOtherMapElements = renderOtherMapElements;
window.renderGameObjects = renderGameObjects;
window.renderEnemies = renderEnemies;
window.renderPlayer = renderPlayer;
window.renderProjectiles = renderProjectiles;
window.renderFriendlyBalls = renderFriendlyBalls;
window.renderSpikeBalls = renderSpikeBalls;
window.renderBubblePowerups = renderBubblePowerups;
window.renderSafeZones = renderSafeZones;
window.renderEffects = renderEffects;
window.renderParticles = renderParticles;
window.renderNumbers = renderNumbers;
window.renderFloatingTexts = renderFloatingTexts;
window.renderAoeRings = renderAoeRings;
window.renderCriticalDisplays = renderCriticalDisplays;
window.drawUI = drawUI;
window.drawMonsterKillStats = drawMonsterKillStats;
window.drawSimpleKillStats = drawSimpleKillStats;
window.drawAnimatedScore = drawAnimatedScore;
window.drawKillCountDots = drawKillCountDots;
window.getMonsterColor = getMonsterColor;
window.getMonsterDisplayName = getMonsterDisplayName;

window.gameOver = gameOver;

// 导出函数（用于模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        render,
        renderMapElements,
        renderBlocks,
        renderOtherMapElements,
        renderGameObjects,
        renderEnemies,
        renderPlayer,
        renderProjectiles,
        renderFriendlyBalls,
        renderSpikeBalls,
        renderBubblePowerups,
        renderSafeZones,
        renderEffects,
        renderParticles,
        renderNumbers,
        renderFloatingTexts,
        renderAoeRings,
        renderCriticalDisplays,
        drawUI,
        drawMonsterKillStats,
        drawSimpleKillStats,
        drawAnimatedScore,
        drawKillCountDots,
        getMonsterColor,
        getMonsterDisplayName,
        // checkLevelUp在gameLogic.js中定义
        gameOver
    };
}