# 球球大冒险 - 函数定义记录

## 新增函数 (v4.1.0)

### SafeZoneSystem 类 (safeZoneSystem.js)
- `constructor()` - 初始化安全区系统
- `getRegionKey(x, y)` - 获取区域键值
- `getRegionCenter(regionKey)` - 获取区域中心坐标
- `recordKill(x, y)` - 记录击杀位置
- `hasSafeZone(regionKey)` - 检查区域是否有安全区
- `createSafeZone(regionKey)` - 创建安全区
- `createGuardian(x, y)` - 创建守护怪物
- `createSafeZoneEffect(x, y)` - 创建安全区特效
- `isInSafeZone(x, y)` - 检查位置是否在安全区内
- `getAvoidanceVector(x, y)` - 获取避开安全区的向量
- `update(playerX, playerY)` - 主更新方法
- `updateGuardians()` - 更新守护怪物
- `getRegionKills(x, y)` - 获取区域击杀数量
- `getSafeZones()` - 获取所有安全区
- `getGuardians()` - 获取所有守护怪物
- `cleanup(playerX, playerY, maxDistance)` - 清理远距离元素
- `reset()` - 重置系统

### 渲染函数 (render.js)
- `renderSafeZones(ctx, camera)` - 渲染安全区和守护怪物

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

---

## 修改的函数 (v3.9.3 - 狂潮模式修复)

### gameLogic.js
- `updateFrenzyMode()` - 狂潮模式更新逻辑
  - 参数: 无
  - 返回值: 无
  - 功能: 更新狂潮模式状态，处理激活条件、持续时间和冷却
  - 修改内容: 将触发条件从15个敌人降低到8个敌人，使狂潮模式更容易激活
  - 触发条件: 8个或以上敌人在500像素范围内
  - 持续时间: 5秒
  - 冷却时间: 15秒

---

## 新增函数 (v3.9.4 - 日炎buff系统)

### buffSystem.js
- `BuffSystem.prototype.initSolarFlare(buff)` - 初始化日炎buff
  - 参数: `buff` (object) - buff对象
  - 返回值: 无
  - 功能: 初始化日炎buff的红光闪烁、灼烧光环和伤害参数

- `BuffSystem.prototype.updateSolarFlare(buff, deltaTime)` - 更新日炎buff效果
  - 参数: `buff` (object) - buff对象, `deltaTime` (number) - 时间增量
  - 返回值: 无
  - 功能: 更新红光闪烁效果和灼烧光环半径，处理灼烧伤害计时

- `BuffSystem.prototype.processBurnDamage(buff)` - 处理灼烧伤害
  - 参数: `buff` (object) - buff对象
  - 返回值: 无
  - 功能: 对范围内敌人造成灼烧伤害，创建伤害数字和粒子效果

- `BuffSystem.prototype.getSolarFlareAura()` - 获取日炎光环信息
  - 参数: 无
  - 返回值: object - 包含位置、半径、强度等光环信息
  - 功能: 为渲染系统提供日炎buff的光环数据

### 修改的现有函数

#### gameLogic.js
- `handleEnemyDeath(enemy, index)` - 新增日炎buff掉落逻辑
  - 新增功能: 3%概率掉落日炎buff，精英怪2.5倍概率，Boss 4倍概率
  - 新增功能: 根据掉落的buff类型显示相应的浮动提示文本

#### render.js
- `renderPlayer(ctx)` - 新增日炎buff视觉效果
  - 新增功能: 红光闪烁效果、灼烧光环渲染、红色粒子效果
  - 新增功能: 玩家主体红光色调混合和红色边框效果