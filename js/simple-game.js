// Simple convoy shooter game
let scene, camera, renderer;
let convoy, turret, ground;
let enemies = [];
let projectiles = [];
let convoyHealth = 100;
let score = 0;
let distanceToSafeZone = 1000;
let isGameOver = false;
let lastTime = 0;

// Mouse controls
const mouse = { x: 0, y: 0 };
let isShooting = false;

function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
    );
    camera.position.set(0, 10, -15);
    camera.lookAt(0, 0, 0);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);
    
    // Add lights
    addLights();
    
    // Create ground
    createGround();
    
    // Create convoy
    createConvoy();
    
    // Create turret
    createTurret();
    
    // Add event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    
    // Add button event listeners
    document.getElementById('restart-button').addEventListener('click', restartGame);
    document.getElementById('next-level-button').addEventListener('click', nextLevel);
    
    // Update UI
    updateUI();
    
    // Hide loading message
    document.getElementById('loading').style.display = 'none';
    
    // Start animation loop
    lastTime = performance.now();
    animate();
    
    console.log('Simple convoy shooter initialized successfully!');
}

function addLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
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
    
    scene.add(directionalLight);
}

function createGround() {
    // Create a large plane for the ground
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513, // Brown
        roughness: 0.8,
        metalness: 0.2
    });
    
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.receiveShadow = true;
    
    scene.add(ground);
}

function createConvoy() {
    // Create convoy group
    convoy = new THREE.Group();
    
    // Create main truck
    const truckBody = createTruck();
    convoy.add(truckBody);
    
    // Create additional trucks
    for (let i = 1; i <= 2; i++) {
        const truck = createTruck();
        truck.position.z = i * 8; // Position behind main truck
        convoy.add(truck);
    }
    
    // Add to scene
    scene.add(convoy);
}

function createTruck() {
    const truck = new THREE.Group();
    
    // Truck body
    const bodyGeometry = new THREE.BoxGeometry(3, 2, 6);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x5D8AA8 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    body.castShadow = true;
    body.receiveShadow = true;
    truck.add(body);
    
    // Truck cabin
    const cabinGeometry = new THREE.BoxGeometry(3, 1.5, 2);
    const cabinMaterial = new THREE.MeshStandardMaterial({ color: 0x5D8AA8 });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 2.25, -2);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    truck.add(cabin);
    
    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.5, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    
    // Front wheels
    const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontLeftWheel.position.set(1.5, 0.7, -1.5);
    frontLeftWheel.rotation.z = Math.PI / 2;
    frontLeftWheel.castShadow = true;
    truck.add(frontLeftWheel);
    
    const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontRightWheel.position.set(-1.5, 0.7, -1.5);
    frontRightWheel.rotation.z = Math.PI / 2;
    frontRightWheel.castShadow = true;
    truck.add(frontRightWheel);
    
    // Rear wheels
    const rearLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearLeftWheel.position.set(1.5, 0.7, 1.5);
    rearLeftWheel.rotation.z = Math.PI / 2;
    rearLeftWheel.castShadow = true;
    truck.add(rearLeftWheel);
    
    const rearRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearRightWheel.position.set(-1.5, 0.7, 1.5);
    rearRightWheel.rotation.z = Math.PI / 2;
    rearRightWheel.castShadow = true;
    truck.add(rearRightWheel);
    
    return truck;
}

function createTurret() {
    turret = new THREE.Group();
    
    // Turret base
    const baseGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 16);
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.castShadow = true;
    turret.add(base);
    
    // Turret body
    const bodyGeometry = new THREE.BoxGeometry(1.2, 0.8, 1.2);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.65;
    body.castShadow = true;
    turret.add(body);
    
    // Turret barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 16);
    const barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.y = 0.65;
    barrel.position.z = 1;
    barrel.rotation.x = Math.PI / 2;
    barrel.castShadow = true;
    turret.add(barrel);
    
    // Position on top of the main truck
    turret.position.set(0, 3, 0);
    
    // Add to scene
    scene.add(turret);
}

function spawnEnemy() {
    // Create enemy
    const enemy = new THREE.Group();
    
    // Enemy body
    const bodyGeometry = new THREE.SphereGeometry(1, 16, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xE74C3C });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    enemy.add(body);
    
    // Enemy spikes
    const spikeGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
    const spikeMaterial = new THREE.MeshStandardMaterial({ color: 0xC0392B });
    
    // Add spikes in different directions
    const spikePositions = [
        { x: 0, y: 1, z: 0, rx: Math.PI, ry: 0, rz: 0 },
        { x: 0, y: -1, z: 0, rx: 0, ry: 0, rz: 0 },
        { x: 1, y: 0, z: 0, rx: 0, ry: 0, rz: Math.PI / 2 },
        { x: -1, y: 0, z: 0, rx: 0, ry: 0, rz: -Math.PI / 2 }
    ];
    
    spikePositions.forEach(pos => {
        const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
        spike.position.set(pos.x, pos.y, pos.z);
        spike.rotation.set(pos.rx, pos.ry, pos.rz);
        spike.castShadow = true;
        enemy.add(spike);
    });
    
    // Random position around convoy
    const angle = Math.random() * Math.PI * 2;
    const radius = 30 + Math.random() * 20;
    enemy.position.set(
        Math.cos(angle) * radius,
        1,
        Math.sin(angle) * radius
    );
    
    // Add to scene and enemies array
    scene.add(enemy);
    enemies.push({
        mesh: enemy,
        speed: 2 + Math.random() * 3,
        health: 1,
        damage: 10
    });
}

function shoot() {
    // Create projectile
    const geometry = new THREE.SphereGeometry(0.2, 8, 8);
    const material = new THREE.MeshBasicMaterial({
        color: 0xFFFF00,
        emissive: 0xFFFF00,
        emissiveIntensity: 0.5
    });
    
    const projectile = new THREE.Mesh(geometry, material);
    
    // Get turret position and direction
    const turretPos = new THREE.Vector3(
        turret.position.x,
        turret.position.y + 0.65,
        turret.position.z
    );
    
    // Calculate direction based on mouse position
    const direction = new THREE.Vector3(mouse.x, 0, mouse.y).normalize();
    
    // Set projectile position
    projectile.position.copy(turretPos);
    projectile.position.add(direction.clone().multiplyScalar(2));
    
    // Add to scene and projectiles array
    scene.add(projectile);
    projectiles.push({
        mesh: projectile,
        direction: direction,
        speed: 30
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    // Calculate normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Convert to world coordinates on XZ plane
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouse.x, mouse.y), camera);
    
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);
    
    // Update mouse position relative to convoy
    mouse.x = intersection.x - convoy.position.x;
    mouse.y = intersection.z - convoy.position.z;
}

function onMouseDown(event) {
    if (event.button === 0) { // Left mouse button
        isShooting = true;
        shoot();
    }
}

function onMouseUp(event) {
    if (event.button === 0) { // Left mouse button
        isShooting = false;
    }
}

function updateUI() {
    document.getElementById('convoy-health').textContent = `Convoy Health: ${convoyHealth}%`;
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('distance').textContent = `Distance to Safe Zone: ${Math.floor(distanceToSafeZone)}m`;
}

function gameOver() {
    isGameOver = true;
    document.getElementById('game-over').style.display = 'block';
}

function levelComplete() {
    isGameOver = true;
    document.getElementById('level-complete').style.display = 'block';
}

function restartGame() {
    // Reset game state
    convoyHealth = 100;
    score = 0;
    distanceToSafeZone = 1000;
    isGameOver = false;
    
    // Reset convoy position
    convoy.position.set(0, 0, 0);
    
    // Remove all enemies
    for (const enemy of enemies) {
        scene.remove(enemy.mesh);
    }
    enemies = [];
    
    // Remove all projectiles
    for (const projectile of projectiles) {
        scene.remove(projectile.mesh);
    }
    projectiles = [];
    
    // Update UI
    updateUI();
    
    // Hide game over screen
    document.getElementById('game-over').style.display = 'none';
    
    // Restart animation
    lastTime = performance.now();
    animate();
}

function nextLevel() {
    // Reset game state but increase difficulty
    convoyHealth = 100;
    distanceToSafeZone = 1000;
    isGameOver = false;
    
    // Reset convoy position
    convoy.position.set(0, 0, 0);
    
    // Remove all enemies
    for (const enemy of enemies) {
        scene.remove(enemy.mesh);
    }
    enemies = [];
    
    // Remove all projectiles
    for (const projectile of projectiles) {
        scene.remove(projectile.mesh);
    }
    projectiles = [];
    
    // Update UI
    updateUI();
    
    // Hide level complete screen
    document.getElementById('level-complete').style.display = 'none';
    
    // Restart animation
    lastTime = performance.now();
    animate();
}

function animate(currentTime) {
    if (isGameOver) return;
    
    requestAnimationFrame(animate);
    
    // Calculate delta time
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime || performance.now();
    
    // Move convoy forward
    convoy.position.z += 2 * deltaTime;
    
    // Update turret position to follow convoy
    turret.position.x = convoy.position.x;
    turret.position.z = convoy.position.z;
    
    // Update camera to follow convoy
    camera.position.x = convoy.position.x;
    camera.position.z = convoy.position.z - 15;
    camera.lookAt(convoy.position.x, convoy.position.y + 5, convoy.position.z);
    
    // Update turret rotation based on mouse position
    if (mouse.x !== 0 || mouse.y !== 0) {
        const angle = Math.atan2(mouse.x, mouse.y);
        turret.rotation.y = angle;
    }
    
    // Spawn enemies randomly
    if (Math.random() < 0.02 && enemies.length < 10) {
        spawnEnemy();
    }
    
    // Update projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        projectile.mesh.position.add(
            projectile.direction.clone().multiplyScalar(projectile.speed * deltaTime)
        );
        
        // Remove projectiles that are too far away
        if (projectile.mesh.position.distanceTo(convoy.position) > 50) {
            scene.remove(projectile.mesh);
            projectiles.splice(i, 1);
        }
    }
    
    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Move towards convoy
        const direction = new THREE.Vector3()
            .subVectors(convoy.position, enemy.mesh.position)
            .normalize();
        
        enemy.mesh.position.add(
            direction.multiplyScalar(enemy.speed * deltaTime)
        );
        
        // Rotate to face convoy
        enemy.mesh.lookAt(convoy.position);
        
        // Check collision with convoy
        if (enemy.mesh.position.distanceTo(convoy.position) < 4) {
            // Damage convoy
            convoyHealth -= enemy.damage;
            updateUI();
            
            // Remove enemy
            scene.remove(enemy.mesh);
            enemies.splice(i, 1);
            
            // Check if convoy is destroyed
            if (convoyHealth <= 0) {
                gameOver();
                return;
            }
            
            continue;
        }
        
        // Check collision with projectiles
        for (let j = projectiles.length - 1; j >= 0; j--) {
            const projectile = projectiles[j];
            
            if (projectile.mesh.position.distanceTo(enemy.mesh.position) < 1.5) {
                // Damage enemy
                enemy.health--;
                
                // Remove projectile
                scene.remove(projectile.mesh);
                projectiles.splice(j, 1);
                
                // Check if enemy is destroyed
                if (enemy.health <= 0) {
                    // Increase score
                    score += 10;
                    updateUI();
                    
                    // Remove enemy
                    scene.remove(enemy.mesh);
                    enemies.splice(i, 1);
                }
                
                break;
            }
        }
    }
    
    // Update distance to safe zone
    distanceToSafeZone -= 2 * deltaTime;
    updateUI();
    
    // Check if reached safe zone
    if (distanceToSafeZone <= 0) {
        levelComplete();
        return;
    }
    
    // Render scene
    renderer.render(scene, camera);
}

// Initialize when the window loads
window.addEventListener('load', init); 