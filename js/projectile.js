export class Projectile {
    constructor(scene, position, direction) {
        this.scene = scene;
        this.position = position.clone();
        this.direction = direction.clone();
        this.speed = 30; // Units per second
        this.damage = 10; // Increased damage to ensure enemies take damage
        
        // Create projectile model
        this.createProjectileModel();
        
        // Add to scene
        this.scene.add(this.model);
    }
    
    createProjectileModel() {
        // Create a simple sphere for the projectile
        const geometry = new THREE.SphereGeometry(0.5, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0xFFFF00,
            emissive: 0xFFFF00,
            emissiveIntensity: 0.5
        });
        
        this.model = new THREE.Mesh(geometry, material);
        this.model.position.copy(this.position);
        
        // Add a point light to make it glow
        this.light = new THREE.PointLight(0xFFFF00, 1, 5);
        this.light.position.copy(this.position);
        this.model.add(this.light);
        
        // Add a trail effect
        this.trail = new THREE.Group();
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFF00,
            transparent: true,
            opacity: 0.7
        });
        
        for (let i = 0; i < 5; i++) {
            const size = 0.4 - (i * 0.05);
            const trailGeometry = new THREE.SphereGeometry(size, 8, 8);
            const trailSegment = new THREE.Mesh(trailGeometry, trailMaterial.clone());
            trailSegment.material.opacity = 0.7 - (i * 0.15);
            this.trail.add(trailSegment);
        }
        
        this.scene.add(this.trail);
    }
    
    update(deltaTime) {
        // Move projectile
        const moveAmount = this.speed * deltaTime;
        this.position.add(this.direction.clone().multiplyScalar(moveAmount));
        this.model.position.copy(this.position);
        
        // Make projectile face the direction of travel
        if (this.direction.length() > 0) {
            this.model.lookAt(this.position.clone().add(this.direction));
        }
        
        // Update trail positions
        for (let i = 0; i < this.trail.children.length; i++) {
            const segment = this.trail.children[i];
            const backDirection = this.direction.clone().multiplyScalar(-1);
            const distance = (i + 1) * 0.2;
            
            segment.position.copy(
                this.position.clone().add(backDirection.multiplyScalar(distance))
            );
        }
    }
    
    checkCollision(enemy) {
        // Simple distance-based collision detection
        const distance = this.position.distanceTo(enemy.position);
        return distance < (1.0 + enemy.getCollisionRadius()); // Increased collision radius
    }
    
    remove() {
        // Remove from scene
        this.scene.remove(this.model);
        this.scene.remove(this.trail);
        
        // Dispose of geometries and materials
        this.model.geometry.dispose();
        this.model.material.dispose();
        
        this.trail.children.forEach(segment => {
            segment.geometry.dispose();
            segment.material.dispose();
        });
    }
} 