# 球球大冒险 - 函数定义记录

## 现有核心函数

### gameLogic.js
- `updateGameObjectsWithInputHandler()` - 更新游戏对象和输入处理
- `handleEnemyDeath(enemy)` - 处理敌人死亡逻辑
- `activateLaser()` - 激活激光技能
- `updateLaser()` - 更新激光状态和碰撞检测
- `createExplosion(x, y, radius, damage)` - 创建爆炸效果
- `handlePlayerEnemyCollision()` - 处理玩家与敌人碰撞
- `handleEnemyProjectileCollision()` - 处理敌人与投射物碰撞
- `updateWindFireWheels()` - 更新风火轮效果

### inputHandler.js
- `handlePlayerAttack()` - 处理玩家攻击（子弹发射）
- `handlePlayerAOEAttack()` - 处理玩家AOE攻击
- `updatePlayer()` - 更新玩家状态
- `activateWindFireWheels()` - 激活风火轮技能
- `activateDash()` - 激活冲刺技能
- `updateDash()` - 更新冲刺状态
- `updateChargeJump()` - 更新蓄力跳跃
- `updateEnemies()` - 更新敌人状态
- `createExplosion(x, y, radius, damage)` - 创建爆炸效果
- `createDamageNumber(x, y, damage, isCritical)` - 创建伤害数字显示
- `createExperienceNumber(x, y, exp)` - 创建经验数字显示
- `createFloatingText(x, y, text, color)` - 创建浮动文本
- `createCriticalDisplay(damage)` - 创建暴击显示
- `checkCollision(obj1, obj2)` - 检查碰撞
- `handlePlatformCollision(player, platform)` - 处理平台碰撞
- `randomBetween(min, max)` - 生成随机数

### render.js
- `render(gameState, gameConfig)` - 主渲染函数
- `renderMapElements(ctx, viewLeft, viewRight, viewTop, viewBottom)` - 渲染地图元素
- `renderBlocks(ctx, viewLeft, viewRight, viewTop, viewBottom)` - 渲染方块
- `renderOtherMapElements(ctx, viewLeft, viewRight, viewTop, viewBottom)` - 渲染其他地图元素
- `renderGameObjects(ctx, viewLeft, viewRight, viewTop, viewBottom)` - 渲染游戏对象
- `renderEnemies(ctx, viewLeft, viewRight, viewTop, viewBottom)` - 渲染敌人
- `renderPlayer(ctx)` - 渲染玩家
- `renderProjectiles(ctx, viewLeft, viewRight, viewTop, viewBottom)` - 渲染投射物
- `renderFriendlyBalls(ctx, viewLeft, viewRight, viewTop, viewBottom)` - 渲染友方球球
- `renderSpikeBalls(ctx, viewLeft, viewRight, viewTop, viewBottom)` - 渲染带刺球球
- `renderBubblePowerups(ctx, viewLeft, viewRight, viewTop, viewBottom)` - 渲染泡泡道具
- `renderEffects(ctx)` - 渲染特效
- `renderParticles(ctx)` - 渲染粒子
- `renderNumbers(ctx)` - 渲染数字
- `renderFloatingTexts(ctx)` - 渲染浮动文本
- `renderAoeRings(ctx)` - 渲染AOE圆环
- `renderCriticalDisplays(ctx)` - 渲染暴击显示
- `drawUI()` - 绘制UI界面
- `gameOver()` - 游戏结束处理

### utils.js
- 工具函数集合（具体函数待补充）

---

## 新增函数 (v1.1.0 - 三相之力Buff系统)

### buffSystem.js
- `BuffSystem()` - 构造函数，初始化buff系统
  - 参数: 无
  - 返回值: BuffSystem实例
  - 功能: 创建buff系统实例，初始化buffs对象

- `BuffSystem.prototype.activateBuff(buffType)` - 激活指定buff
  - 参数: `buffType` (string) - buff类型名称
  - 返回值: 无
  - 功能: 激活指定类型的buff，设置持续时间和效果

- `BuffSystem.prototype.hasBuff(buffId)` - 检查是否有指定buff
  - 参数: `buffId` (string) - buff类型名称
  - 返回值: boolean - buff是否存在
  - 功能: 检查指定buff是否存在于激活列表中

- `BuffSystem.prototype.isBuffActive(buffId)` - 检查buff是否激活（别名方法）
  - 参数: `buffId` (string) - buff类型名称
  - 返回值: boolean - buff是否处于激活状态
  - 功能: 检查指定buff的激活状态，与hasBuff方法功能相同

- `BuffSystem.prototype.update()` - 更新buff系统
  - 参数: 无
  - 返回值: 无
  - 功能: 更新所有激活buff的状态，处理持续时间和效果

- `BuffSystem.prototype.deactivateBuff(buffType)` - 停用指定buff
  - 参数: `buffType` (string) - buff类型名称
  - 返回值: 无
  - 功能: 停用指定buff，清理相关效果

- `BuffSystem.prototype.updateTrinityForceEffect()` - 更新三相之力效果
  - 参数: 无
  - 返回值: 无
  - 功能: 计算三相之力的旋转三角形和风火轮位置

- `BuffSystem.prototype.calculateWindFireWheelPositions()` - 计算风火轮位置
  - 参数: 无
  - 返回值: Array - 三个风火轮的位置坐标
  - 功能: 基于旋转角度计算三个风火轮的实时位置

### 修改的现有函数

#### gameLogic.js
- `handleEnemyDeath(enemy)` - 新增buff掉落逻辑
  - 新增功能: 5%概率掉落三相之力buff

- `activateLaser()` - 新增三相之力检测
  - 新增功能: 检测buff状态，激活时发射三股激光

- `updateLaser()` - 新增三股激光支持
  - 新增功能: 三股激光的更新和碰撞检测

#### inputHandler.js
- `handlePlayerAttack()` - 新增三股子弹支持
  - 新增功能: 检测三相之力buff，激活时发射三股子弹

- `updateWindFireWheels()` (gameLogic.js) - 添加三相之力buff检测
  - 新增功能: 根据buff状态调整风火轮数量和排列

#### render.js
- `renderPlayer(ctx)` - 新增金光闪烁效果、风火轮渲染优化和激光渲染增强
  - 新增功能: 三相之力激活时的金光视觉效果
  - 新增功能: 风火轮渲染部分添加三相之力检测，动态调整渲染参数（数量、排列、半径1.5倍、球体尺寸3倍）
  - 新增功能: 激光渲染部分添加三相之力检测，支持三股激光渲染（主激光、左激光、右激光）

#### index.html
- `init()` - 新增buff系统初始化
  - 新增功能: 创建game.buffSystem实例