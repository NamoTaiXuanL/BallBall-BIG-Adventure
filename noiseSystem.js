// v4.2.0: 噪波系统 - 用于生成不均匀的怪物分布和等级
// 创建时间: 2025-01-12

class NoiseSystem {
    constructor() {
        // 噪波配置
        this.config = {
            // 怪物密度噪波
            densityScale: 0.0008,      // 密度噪波尺度，值越小变化越缓慢
            densityOctaves: 3,         // 噪波层数
            densityThreshold: 0.3,     // 密度阈值，低于此值的区域无怪物
            
            // 怪物等级噪波
            levelScale: 0.0005,        // 等级噪波尺度
            levelOctaves: 2,           // 等级噪波层数
            levelAmplitude: 0.4,       // 等级变化幅度
            
            // 基础距离等级系数
            baseDistanceScale: 1000,   // 每1000距离增加1级
            maxLevel: 999              // 最大等级限制（实际无限制）
        };
        
        // 预计算的随机种子表
        this.seedTable = this.generateSeedTable(256);
    }
    
    // 生成随机种子表
    generateSeedTable(size) {
        const table = [];
        for (let i = 0; i < size; i++) {
            table[i] = Math.random();
        }
        return table;
    }
    
    // 简化的Perlin噪波实现
    noise(x, y) {
        // 将坐标转换为整数网格
        const xi = Math.floor(x) & 255;
        const yi = Math.floor(y) & 255;
        
        // 获取小数部分
        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);
        
        // 平滑插值函数
        const u = this.fade(xf);
        const v = this.fade(yf);
        
        // 获取四个角的随机值
        const aa = this.seedTable[(xi + this.seedTable[yi]) & 255];
        const ab = this.seedTable[(xi + this.seedTable[(yi + 1) & 255]) & 255];
        const ba = this.seedTable[((xi + 1) & 255) + this.seedTable[yi] & 255];
        const bb = this.seedTable[((xi + 1) & 255) + this.seedTable[(yi + 1) & 255] & 255];
        
        // 双线性插值
        const x1 = this.lerp(aa, ba, u);
        const x2 = this.lerp(ab, bb, u);
        
        return this.lerp(x1, x2, v);
    }
    
    // 平滑插值函数
    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    
    // 线性插值
    lerp(a, b, t) {
        return a + t * (b - a);
    }
    
    // 分形噪波（多层噪波叠加）
    fractalNoise(x, y, octaves, scale) {
        let value = 0;
        let amplitude = 1;
        let frequency = scale;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            value += this.noise(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }
        
        return value / maxValue;
    }
    
    // 获取指定位置的怪物密度（0-1，0表示无怪物区域）
    getMonsterDensity(x, y) {
        const noiseValue = this.fractalNoise(
            x, y, 
            this.config.densityOctaves, 
            this.config.densityScale
        );
        
        // 将噪波值转换为密度值
        const density = (noiseValue + 1) * 0.5; // 转换到0-1范围
        
        // 应用阈值，创建空旷区域
        if (density < this.config.densityThreshold) {
            return 0; // 无怪物区域
        }
        
        // 将剩余密度重新映射到0-1
        return (density - this.config.densityThreshold) / (1 - this.config.densityThreshold);
    }
    
    // 获取指定位置的怪物等级
    getMonsterLevel(x, y) {
        // 基础距离等级
        const distanceFromSpawn = Math.sqrt(x * x + y * y);
        const baseLevel = Math.max(1, Math.floor(distanceFromSpawn / this.config.baseDistanceScale));
        
        // 噪波等级修正
        const levelNoise = this.fractalNoise(
            x, y,
            this.config.levelOctaves,
            this.config.levelScale
        );
        
        // 将噪波值转换为等级修正（-levelAmplitude 到 +levelAmplitude）
        const levelModifier = levelNoise * this.config.levelAmplitude * baseLevel;
        
        // 计算最终等级
        const finalLevel = Math.max(1, Math.floor(baseLevel + levelModifier));
        
        return Math.min(finalLevel, this.config.maxLevel);
    }
    
    // 判断指定位置是否应该生成怪物
    shouldSpawnMonster(x, y) {
        const density = this.getMonsterDensity(x, y);
        return density > 0 && Math.random() < density;
    }
    
    // 获取区域密度类型（用于兼容现有系统）
    getDensityType(x, y) {
        const density = this.getMonsterDensity(x, y);
        
        if (density === 0) return 'none';
        if (density < 0.3) return 'low';
        if (density < 0.7) return 'medium';
        return 'high';
    }
    
    // 调试：获取指定区域的噪波可视化数据
    getNoiseVisualization(centerX, centerY, width, height, resolution = 10) {
        const data = [];
        
        for (let x = centerX - width/2; x < centerX + width/2; x += resolution) {
            for (let y = centerY - height/2; y < centerY + height/2; y += resolution) {
                const density = this.getMonsterDensity(x, y);
                const level = this.getMonsterLevel(x, y);
                
                data.push({
                    x: x,
                    y: y,
                    density: density,
                    level: level,
                    densityType: this.getDensityType(x, y)
                });
            }
        }
        
        return data;
    }
}

// 创建全局噪波系统实例
window.noiseSystem = new NoiseSystem();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NoiseSystem;
}