import { Convoy } from './convoy.js';
import { Player } from './player.js';
import { EnemyManager } from './enemyManager.js';
import { Projectile } from './projectile.js';
import { Environment } from './environment.js';

export class Game {
    constructor(assetLoader, inputHandler, ui) {
        // Dependencies
        this.assetLoader = assetLoader;
        this.inputHandler = inputHandler;
        this.ui = ui;
        
        // Game state
        this.isRunning = false;
        this.score = 0;
        this.distanceTraveled = 0; // Track distance traveled instead of distance to safe zone
        this.convoySpeed = 0.5; // meters per frame
        this.difficultyIncreaseInterval = 500; // Increase difficulty every 500 meters
        this.lastDifficultyIncrease = 0;
        
        // Three.js setup
        this.setupThreeJS();
        
        // Game objects
        this.projectiles = [];
        this.setupGameObjects();
        
        // Bind methods
        this.update = this.update.bind(this);
    }
    
    setupThreeJS() {
        // Create scene
        this.scene = new THREE.Scene();
        
        // Create camera with wider field of view for zooming out
        this.camera = new THREE.PerspectiveCamera(
            75, // Increased FOV to zoom out (was 65)
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        
        // Simple camera setup - fixed position behind convoy
        this.cameraHeight = 12; // Slightly higher
        this.cameraDistance = 20; // Slightly further back
        
        // Set initial camera position (will be updated once convoy is created)
        this.camera.position.set(0, 12, -20);
        this.camera.lookAt(0, 0, 0);
        
        // Add camera to scene with a name for raycasting
        this.camera.name = 'camera';
        this.scene.add(this.camera);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);
        
        // Add lights
        this.addLights();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    addLights() {
        // Ambient light (increased intensity for better ground visibility)
        const ambientLight = new THREE.AmbientLight(0x606060, 0.8);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(50, 200, 100);
        directionalLight.castShadow = true;
        
        // Set up shadow properties
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        
        this.scene.add(directionalLight);
        
        // Add a secondary directional light from the front to illuminate the ground better
        const frontLight = new THREE.DirectionalLight(0xffffcc, 0.6);
        frontLight.position.set(0, 50, 200); // Position in front
        this.scene.add(frontLight);
    }
    
    setupGameObjects() {
        // Create environment
        this.environment = new Environment(this.scene, this.assetLoader);
        
        // Create convoy
        this.convoy = new Convoy(this.scene, this.assetLoader);
        
        // Create player (turret)
        this.player = new Player(this.scene, this.assetLoader, this.convoy);
        
        // Create enemy manager with initial difficulty
        this.enemyManager = new EnemyManager(
            this.scene, 
            this.assetLoader, 
            1 // Start with difficulty level 1
        );
    }
    
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        
        // Update camera position now that convoy exists
        this.updateCameraPosition();
        
        requestAnimationFrame(this.update);
    }
    
    update(currentTime) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Update convoy position
        this.convoy.update(deltaTime);
        
        // Update camera position to follow convoy
        this.updateCameraPosition();
        
        // Update distance traveled and score
        this.distanceTraveled += this.convoySpeed;
        this.score = Math.floor(this.distanceTraveled);
        
        // Update UI
        this.ui.updateScore(this.score);
        
        // Check if we need to increase difficulty
        if (Math.floor(this.distanceTraveled / this.difficultyIncreaseInterval) > 
            Math.floor(this.lastDifficultyIncrease / this.difficultyIncreaseInterval)) {
            
            this.increaseDifficulty();
            this.lastDifficultyIncrease = this.distanceTraveled;
        }
        
        // Update player input and position
        this.player.update(deltaTime, this.inputHandler);
        
        // Handle shooting
        if (this.inputHandler.isShooting) {
            this.shoot();
        }
        
        // Update projectiles
        this.updateProjectiles(deltaTime);
        
        // Update environment with convoy position
        this.environment.update(deltaTime, this.convoy.position);
        
        // Update enemies
        this.enemyManager.update(deltaTime, this.convoy.position);
        
        // Check for collisions
        this.checkCollisions();
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
        
        // Continue game loop
        requestAnimationFrame(this.update);
    }
    
    shoot() {
        // Get turret position and direction
        const turretPosition = this.player.getTurretPosition();
        const turretDirection = this.player.getTurretDirection();
        
        // Create new projectile
        const projectile = new Projectile(
            this.scene,
            turretPosition,
            turretDirection
        );
        
        this.projectiles.push(projectile);
        
        // Add debug output
        console.log("Projectile fired! Position:", turretPosition, "Direction:", turretDirection);
        
        // Reset shooting flag
        this.inputHandler.isShooting = false;
    }
    
    updateProjectiles(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update(deltaTime);
            
            // Remove projectiles that are too far away
            if (projectile.position.distanceTo(this.convoy.position) > 100) {
                projectile.remove();
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        // Check projectile-enemy collisions
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            for (let j = this.enemyManager.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemyManager.enemies[j];
                
                if (projectile.checkCollision(enemy)) {
                    console.log(`Projectile hit enemy! Damage: ${projectile.damage}, Enemy health before: ${enemy.health}`);
                    
                    // Remove projectile
                    projectile.remove();
                    this.projectiles.splice(i, 1);
                    
                    // Damage enemy
                    if (enemy.takeDamage(projectile.damage)) {
                        // Enemy destroyed
                        console.log(`Enemy destroyed!`);
                        this.score += enemy.scoreValue;
                        this.ui.updateScore(this.score);
                        this.enemyManager.removeEnemy(j);
                    } else {
                        console.log(`Enemy health after: ${enemy.health}`);
                    }
                    
                    break;
                }
            }
        }
        
        // Check enemy-convoy collisions
        for (let i = this.enemyManager.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemyManager.enemies[i];
            
            if (enemy.checkCollision(this.convoy)) {
                // Damage convoy
                this.convoy.takeDamage(enemy.damage);
                this.ui.updateConvoyHealth(this.convoy.health);
                
                // Remove enemy
                this.enemyManager.removeEnemy(i);
                
                // Check if convoy is destroyed
                if (this.convoy.health <= 0) {
                    this.gameOver();
                    return;
                }
            }
        }
    }
    
    gameOver() {
        this.isRunning = false;
        
        // Show game over screen with final score
        this.ui.showGameOver(this.score);
        
        // Add event listener to restart button
        const restartButton = document.getElementById('restart-button');
        restartButton.onclick = () => this.restart();
    }
    
    restart() {
        // Hide game over screen
        this.ui.hideGameOver();
        
        // Reset game state
        this.score = 0;
        this.distanceTraveled = 0;
        this.lastDifficultyIncrease = 0;
        
        // Reset game objects
        this.resetGameObjects();
        
        // Update UI
        this.ui.updateScore(this.score);
        this.ui.updateWave(1);
        
        // Start game
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.update);
    }
    
    resetGameObjects() {
        // Remove all projectiles
        for (const projectile of this.projectiles) {
            projectile.remove();
        }
        this.projectiles = [];
        
        // Reset convoy
        this.convoy.reset();
        this.ui.updateConvoyHealth(this.convoy.health);
        
        // Reset player
        this.player.reset();
        
        // Reset enemy manager to initial difficulty
        this.enemyManager.reset(1);
    }
    
    // Method to update camera position based on convoy position
    updateCameraPosition() {
        // Make sure convoy exists
        if (!this.convoy) {
            return;
        }
        
        // Simple fixed camera position behind the convoy
        // The convoy moves in positive Z direction, so we offset by negative Z to stay behind
        this.camera.position.set(
            this.convoy.position.x,                    // Same X as convoy
            this.convoy.position.y + this.cameraHeight, // Fixed height above convoy
            this.convoy.position.z - this.cameraDistance  // Fixed distance behind convoy
        );
        
        // Look at a point slightly above and ahead of the convoy
        // Looking further ahead gives a better view of the terrain
        this.camera.lookAt(
            this.convoy.position.x,           // Same X as convoy
            this.convoy.position.y + 1,       // Slightly above convoy
            this.convoy.position.z + 15       // Look further ahead of convoy
        );
        
        // Log camera position for debugging
        console.log("Camera position:", this.camera.position);
        console.log("Convoy position:", this.convoy.position);
    }
    
    // Optional debug method to visualize the look-at point
    debugLookAtPoint(point) {
        // Remove previous debug marker if it exists
        if (this.lookAtMarker) {
            this.scene.remove(this.lookAtMarker);
        }
        
        // Create a small sphere to mark the look-at point
        const geometry = new THREE.SphereGeometry(1, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.lookAtMarker = new THREE.Mesh(geometry, material);
        this.lookAtMarker.position.copy(point);
        this.scene.add(this.lookAtMarker);
    }
    
    // Add a new method to increase difficulty
    increaseDifficulty() {
        // Increase enemy spawn rate and/or enemy speed
        const currentDifficulty = Math.floor(this.distanceTraveled / this.difficultyIncreaseInterval) + 1;
        this.enemyManager.setDifficulty(currentDifficulty);
        
        // Update wave display
        this.ui.updateWave(currentDifficulty);
        
        console.log(`Difficulty increased to level ${currentDifficulty} at ${this.distanceTraveled}m`);
    }
} 