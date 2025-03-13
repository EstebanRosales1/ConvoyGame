import { Enemy } from './enemy.js';

export class EnemyManager {
    constructor(scene, assetLoader, level) {
        this.scene = scene;
        this.assetLoader = assetLoader;
        this.level = level;
        
        // Enemy properties
        this.enemies = [];
        this.spawnInterval = 2; // Seconds between spawns
        this.currentSpawnTimer = 0;
        this.maxEnemies = 10 + (level * 2); // More enemies at higher levels
        
        // Spawn radius
        this.minSpawnRadius = 30;
        this.maxSpawnRadius = 50;
        
        // Enemy types and their probabilities (will be adjusted by level)
        this.enemyTypes = [
            { type: 'basic', probability: 0.7, health: 1, speed: 5, damage: 10, scoreValue: 100 },
            { type: 'fast', probability: 0.2, health: 1, speed: 8, damage: 5, scoreValue: 150 },
            { type: 'tank', probability: 0.1, health: 3, speed: 3, damage: 20, scoreValue: 200 }
        ];
    }
    
    update(deltaTime, convoyPosition) {
        // Update spawn timer
        this.currentSpawnTimer += deltaTime;
        
        // Spawn new enemies if needed
        if (this.currentSpawnTimer >= this.spawnInterval && this.enemies.length < this.maxEnemies) {
            this.spawnEnemy(convoyPosition);
            this.currentSpawnTimer = 0;
        }
        
        // Update existing enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime, convoyPosition);
            
            // Remove enemies that are too far away
            if (enemy.position.distanceTo(convoyPosition) > 100) {
                this.removeEnemy(i);
            }
        }
    }
    
    spawnEnemy(convoyPosition) {
        // Determine spawn position (random angle around convoy)
        const angle = Math.random() * Math.PI * 2;
        const radius = this.minSpawnRadius + Math.random() * (this.maxSpawnRadius - this.minSpawnRadius);
        
        const spawnPosition = new THREE.Vector3(
            convoyPosition.x + Math.cos(angle) * radius,
            0, // Ground level
            convoyPosition.z + Math.sin(angle) * radius
        );
        
        // Select enemy type based on probabilities
        const enemyType = this.selectEnemyType();
        
        // Create enemy
        const enemy = new Enemy(
            this.scene,
            this.assetLoader,
            spawnPosition,
            enemyType.type,
            enemyType.health,
            enemyType.speed,
            enemyType.damage,
            enemyType.scoreValue
        );
        
        // Add to enemies array
        this.enemies.push(enemy);
    }
    
    selectEnemyType() {
        // Adjust probabilities based on level
        const adjustedTypes = this.enemyTypes.map(type => {
            let adjustedType = { ...type };
            
            // Increase tank probability in higher levels
            if (type.type === 'tank') {
                adjustedType.probability = Math.min(0.5, type.probability + (this.level * 0.05));
            }
            
            // Increase fast enemy probability in mid levels
            if (type.type === 'fast') {
                adjustedType.probability = Math.min(0.4, type.probability + (this.level * 0.03));
            }
            
            // Adjust basic enemy probability
            if (type.type === 'basic') {
                adjustedType.probability = Math.max(0.1, 1 - adjustedType.probability - (this.level * 0.08));
            }
            
            return adjustedType;
        });
        
        // Normalize probabilities
        const totalProbability = adjustedTypes.reduce((sum, type) => sum + type.probability, 0);
        adjustedTypes.forEach(type => {
            type.probability /= totalProbability;
        });
        
        // Select enemy type based on probability
        const random = Math.random();
        let cumulativeProbability = 0;
        
        for (const type of adjustedTypes) {
            cumulativeProbability += type.probability;
            if (random <= cumulativeProbability) {
                return type;
            }
        }
        
        // Fallback to basic enemy
        return adjustedTypes[0];
    }
    
    removeEnemy(index) {
        // Remove from scene
        this.enemies[index].remove();
        
        // Remove from array
        this.enemies.splice(index, 1);
    }
    
    reset(level) {
        // Remove all enemies
        for (const enemy of this.enemies) {
            enemy.remove();
        }
        
        // Reset array
        this.enemies = [];
        
        // Update level
        this.level = level;
        
        // Update max enemies based on level
        this.maxEnemies = 10 + (level * 2);
        
        // Reset spawn timer
        this.currentSpawnTimer = 0;
        
        // Adjust spawn interval based on level (faster spawns at higher levels)
        this.spawnInterval = Math.max(0.5, 2 - (level * 0.1));
    }
    
    // Add a new method to set difficulty
    setDifficulty(difficulty) {
        // Update level
        this.level = difficulty;
        
        // Update max enemies based on difficulty
        this.maxEnemies = 10 + (difficulty * 2);
        
        // Adjust spawn interval based on difficulty (faster spawns at higher difficulty)
        this.spawnInterval = Math.max(0.5, 2 - (difficulty * 0.1));
        
        // Optionally increase enemy health and damage with difficulty
        this.enemyTypes.forEach(type => {
            // Increase health every 3 difficulty levels
            if (difficulty % 3 === 0) {
                type.health = Math.ceil(type.health * 1.2);
            }
            
            // Increase damage every 5 difficulty levels
            if (difficulty % 5 === 0) {
                type.damage = Math.ceil(type.damage * 1.2);
            }
            
            // Increase score value with difficulty
            type.scoreValue = Math.floor(type.scoreValue * (1 + difficulty * 0.1));
        });
        
        console.log(`Enemy manager difficulty set to ${difficulty}`);
    }
} 