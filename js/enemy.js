export class Enemy {
    constructor(scene, assetLoader, position, type, health, speed, damage, scoreValue) {
        this.scene = scene;
        this.assetLoader = assetLoader;
        this.position = position.clone();
        this.type = type;
        this.health = health;
        this.maxHealth = health;
        this.speed = speed;
        this.damage = damage;
        this.scoreValue = scoreValue;
        
        // Create enemy model
        this.createEnemyModel();
        
        // Add to scene
        this.scene.add(this.model);
    }
    
    createEnemyModel() {
        // Get base enemy model
        this.model = this.assetLoader.getModel('enemy');
        
        // Customize based on enemy type
        switch (this.type) {
            case 'basic':
                // Default red enemy
                break;
                
            case 'fast':
                // Smaller, faster enemy
                this.model.scale.set(0.7, 0.7, 0.7);
                this.model.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.color.set(0x3498DB); // Blue
                    }
                });
                break;
                
            case 'tank':
                // Larger, slower enemy
                this.model.scale.set(1.5, 1.5, 1.5);
                this.model.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.color.set(0x8E44AD); // Purple
                    }
                });
                break;
        }
        
        // Set position
        this.model.position.copy(this.position);
    }
    
    update(deltaTime, targetPosition) {
        // Calculate direction to target
        const direction = new THREE.Vector3()
            .subVectors(targetPosition, this.position)
            .normalize();
        
        // Move towards target
        this.position.add(direction.multiplyScalar(this.speed * deltaTime));
        this.model.position.copy(this.position);
        
        // Rotate to face target
        this.model.lookAt(targetPosition);
        
        // Add some bobbing motion
        const time = performance.now() * 0.001;
        this.model.position.y = this.position.y + Math.sin(time * 3) * 0.2;
        
        // Add rotation effect
        this.model.rotation.y += deltaTime * 2;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        
        // Visual feedback for damage
        this.flashDamage();
        
        // Return true if destroyed
        return this.health <= 0;
    }
    
    flashDamage() {
        // Flash the enemy white to indicate damage
        this.model.traverse((child) => {
            if (child.isMesh && child.material) {
                // Store original color
                if (!child.userData.originalColor) {
                    child.userData.originalColor = child.material.color.clone();
                }
                
                // Set to white
                child.material.color.set(0xffffff);
                
                // Reset after a short delay
                setTimeout(() => {
                    if (child.userData.originalColor) {
                        child.material.color.copy(child.userData.originalColor);
                    }
                }, 100);
            }
        });
    }
    
    checkCollision(convoy) {
        // Simple distance-based collision detection
        const distance = this.position.distanceTo(convoy.position);
        return distance < (this.getCollisionRadius() + convoy.getCollisionRadius());
    }
    
    getCollisionRadius() {
        // Adjust collision radius based on enemy type
        switch (this.type) {
            case 'basic':
                return 1;
            case 'fast':
                return 0.7;
            case 'tank':
                return 1.5;
            default:
                return 1;
        }
    }
    
    remove() {
        // Remove from scene
        this.scene.remove(this.model);
        
        // Dispose of geometries and materials
        this.model.traverse((child) => {
            if (child.geometry) {
                child.geometry.dispose();
            }
            
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    }
} 