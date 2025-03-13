export class Convoy {
    constructor(scene, assetLoader) {
        this.scene = scene;
        this.assetLoader = assetLoader;
        
        // Convoy properties
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 2; // Units per second
        this.position = new THREE.Vector3(0, 0, 0);
        
        // Create convoy model
        this.createConvoyModel();
        
        // Create health bar
        this.createHealthBar();
        
        // Add to scene
        this.scene.add(this.model);
    }
    
    createConvoyModel() {
        this.model = new THREE.Group();
        
        // Single truck (player's truck)
        this.truck = this.assetLoader.getModel('truck');
        this.truck.position.set(0, 0, 0);
        
        // Make sure the truck is facing forward (positive Z direction)
        this.truck.rotation.y = 0; // Facing positive Z
        
        this.model.add(this.truck);
        
        // Set initial position
        this.model.position.copy(this.position);
    }
    
    createHealthBar() {
        // Create a group for the health bar
        this.healthBarGroup = new THREE.Group();
        
        // Create background bar (gray)
        const backgroundGeometry = new THREE.BoxGeometry(4, 0.3, 0.1);
        const backgroundMaterial = new THREE.MeshBasicMaterial({ color: 0x444444 });
        this.healthBarBackground = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
        
        // Create health bar (green)
        const healthGeometry = new THREE.BoxGeometry(4, 0.3, 0.2);
        const healthMaterial = new THREE.MeshBasicMaterial({ color: 0x4CAF50 });
        this.healthBarFill = new THREE.Mesh(healthGeometry, healthMaterial);
        
        // Position the health bar above the vehicle
        this.healthBarGroup.position.y = 6; // Increased from 4 to 6 for higher placement
        
        // Add health bar elements to the group
        this.healthBarGroup.add(this.healthBarBackground);
        this.healthBarGroup.add(this.healthBarFill);
        
        // Add health bar group to the model
        this.model.add(this.healthBarGroup);
        
        // Make sure the health bar always faces the camera
        this.healthBarGroup.rotation.x = -Math.PI / 6; // Tilt slightly for better visibility
        
        // Update the health bar to match initial health
        this.updateHealthBar();
    }
    
    updateHealthBar() {
        // Update health bar fill based on current health percentage
        const healthPercent = this.health / this.maxHealth;
        
        // Scale the health bar fill
        this.healthBarFill.scale.x = healthPercent;
        
        // Adjust position to keep the bar left-aligned
        this.healthBarFill.position.x = (1 - healthPercent) * 2;
        
        // Update color based on health
        if (healthPercent > 0.7) {
            this.healthBarFill.material.color.set(0x4CAF50); // Green
        } else if (healthPercent > 0.3) {
            this.healthBarFill.material.color.set(0xFFC107); // Yellow
        } else {
            this.healthBarFill.material.color.set(0xF44336); // Red
        }
    }
    
    update(deltaTime) {
        // Move convoy forward
        this.position.z += this.speed * deltaTime;
        this.model.position.copy(this.position);
        
        // Add some gentle swaying motion to simulate driving on rough terrain
        const time = performance.now() * 0.001;
        this.model.rotation.x = Math.sin(time * 1.5) * 0.02;
        this.model.rotation.z = Math.sin(time * 2) * 0.02;
        
        // Make sure health bar always faces the camera
        if (this.healthBarGroup) {
            // Keep the health bar horizontal regardless of vehicle tilt
            this.healthBarGroup.rotation.x = -this.model.rotation.x - Math.PI / 6;
            this.healthBarGroup.rotation.z = -this.model.rotation.z;
        }
    }
    
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        
        // Update the health bar
        this.updateHealthBar();
        
        // Visual feedback for damage
        this.flashDamage();
        
        return this.health <= 0;
    }
    
    flashDamage() {
        // Flash the convoy red to indicate damage
        this.model.traverse((child) => {
            if (child.isMesh && child.material) {
                // Store original color
                if (!child.userData.originalColor) {
                    child.userData.originalColor = child.material.color.clone();
                }
                
                // Set to red
                child.material.color.set(0xff0000);
                
                // Reset after a short delay
                setTimeout(() => {
                    if (child.userData.originalColor) {
                        child.material.color.copy(child.userData.originalColor);
                    }
                }, 200);
            }
        });
    }
    
    reset() {
        // Reset health
        this.health = this.maxHealth;
        
        // Update health bar
        this.updateHealthBar();
        
        // Reset position
        this.position.set(0, 0, 0);
        this.model.position.copy(this.position);
        this.model.rotation.set(0, 0, 0);
    }
    
    getCollisionRadius() {
        return 3; // Approximate radius for collision detection of a single truck
    }
} 