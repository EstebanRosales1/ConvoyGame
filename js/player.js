export class Player {
    constructor(scene, assetLoader, convoy) {
        this.scene = scene;
        this.assetLoader = assetLoader;
        this.convoy = convoy;
        
        // Player properties
        this.rotationSpeed = 3; // Radians per second
        this.shootingCooldown = 0.2; // Seconds between shots
        this.currentCooldown = 0;
        
        // Create player model (turret)
        this.createPlayerModel();
        
        // Add to scene
        this.scene.add(this.model);
        
        // Create raycaster for aiming
        this.raycaster = new THREE.Raycaster();
        this.targetPoint = new THREE.Vector3();
    }
    
    createPlayerModel() {
        // Get turret model
        this.model = this.assetLoader.getModel('turret');
        
        // Position on top of the main truck
        this.model.position.set(
            this.convoy.position.x,
            this.convoy.position.y + 3, // Height on top of truck
            this.convoy.position.z
        );
        
        // Make sure the turret's forward direction is along the positive Z-axis
        // This ensures that when we use lookAt, it points the correct part of the model
        this.model.rotation.set(0, 0, 0);
        
        // Add a debug arrow to show the forward direction
        this.addForwardDirectionIndicator();
    }
    
    // Add a visual indicator for the forward direction
    addForwardDirectionIndicator() {
        // Create a small arrow pointing in the forward direction
        const arrowHelper = new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, 1), // Direction
            new THREE.Vector3(0, 0, 0), // Origin
            2, // Length
            0x00ff00 // Color (green)
        );
        
        // Add to the turret model
        this.model.add(arrowHelper);
    }
    
    update(deltaTime, inputHandler) {
        // Update cooldown
        if (this.currentCooldown > 0) {
            this.currentCooldown -= deltaTime;
        }
        
        // Update position to follow convoy
        this.model.position.set(
            this.convoy.position.x,
            this.convoy.position.y + 3, // Height on top of truck
            this.convoy.position.z
        );
        
        // Handle aiming with mouse
        this.handleAiming(inputHandler);
    }
    
    handleAiming(inputHandler) {
        // Get mouse position in normalized device coordinates
        const mousePos = inputHandler.getMousePosition();
        
        // Update the raycaster with the camera and mouse position
        this.raycaster.setFromCamera(mousePos, this.scene.getObjectByName('camera'));
        
        // Create a ground plane for intersection (at y=0)
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        
        // Find the intersection point with the ground plane
        const intersectionPoint = new THREE.Vector3();
        if (this.raycaster.ray.intersectPlane(groundPlane, intersectionPoint)) {
            // Store target point
            this.targetPoint.copy(intersectionPoint);
            
            // Get the world position of the turret
            const turretWorldPos = new THREE.Vector3();
            this.model.getWorldPosition(turretWorldPos);
            
            // Calculate direction from turret to target
            const direction = new THREE.Vector3().subVectors(intersectionPoint, turretWorldPos).normalize();
            
            // Make the turret look at the target point
            // We need to use lookAt with the world coordinates
            const targetPos = new THREE.Vector3().addVectors(turretWorldPos, direction);
            this.model.lookAt(targetPos);
            
            // Debug visualization
            this.debugAimingPoint(intersectionPoint);
        }
    }
    
    // Debug method to visualize the aiming point
    debugAimingPoint(point) {
        // Remove previous debug marker if it exists
        if (this.debugMarker) {
            this.scene.remove(this.debugMarker);
        }
        
        // Create a small sphere to mark the aiming point
        const geometry = new THREE.SphereGeometry(0.5, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.debugMarker = new THREE.Mesh(geometry, material);
        this.debugMarker.position.copy(point);
        this.scene.add(this.debugMarker);
    }
    
    shoot() {
        // Check if cooldown has expired
        if (this.currentCooldown <= 0) {
            // Reset cooldown
            this.currentCooldown = this.shootingCooldown;
            
            // Return true to indicate successful shot
            return true;
        }
        
        // Return false if still on cooldown
        return false;
    }
    
    getTurretPosition() {
        // Get the world position of the turret
        const turretWorldPos = new THREE.Vector3();
        this.model.getWorldPosition(turretWorldPos);
        
        // Get the direction the turret is facing
        const direction = this.getTurretDirection();
        
        // Calculate position at the end of the barrel (2 units in front of the turret)
        const barrelEnd = turretWorldPos.clone().add(direction.multiplyScalar(2));
        
        return barrelEnd;
    }
    
    getTurretDirection() {
        // If we have a target point, use the direction to that point
        if (this.targetPoint) {
            const turretWorldPos = new THREE.Vector3();
            this.model.getWorldPosition(turretWorldPos);
            
            // Create a direction vector from turret to target
            return new THREE.Vector3()
                .subVectors(this.targetPoint, turretWorldPos)
                .normalize();
        }
        
        // Fallback to forward direction if no target point
        const direction = new THREE.Vector3(0, 0, 1);
        direction.applyQuaternion(this.model.quaternion);
        
        return direction;
    }
    
    reset() {
        // Reset cooldown
        this.currentCooldown = 0;
        
        // Reset position and rotation
        this.model.position.set(
            this.convoy.position.x,
            this.convoy.position.y + 3,
            this.convoy.position.z
        );
        this.model.rotation.set(0, 0, 0);
    }
} 