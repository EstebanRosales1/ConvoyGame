export class AssetLoader {
    constructor() {
        this.models = {};
        this.textures = {};
        this.sounds = {};
        this.loadingManager = new THREE.LoadingManager();
        
        // Use GLTFLoader if available
        if (typeof THREE.GLTFLoader === 'function') {
            this.gltfLoader = new THREE.GLTFLoader(this.loadingManager);
        } else {
            console.warn('THREE.GLTFLoader not found, will use simple geometries instead');
        }
        
        this.textureLoader = new THREE.TextureLoader(this.loadingManager);
        
        // Set up loading manager callbacks
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            console.log(`Loading: ${itemsLoaded}/${itemsTotal} - ${url}`);
            
            // Hide loading message when all assets are loaded
            if (itemsLoaded === itemsTotal) {
                const loadingElement = document.getElementById('loading');
                if (loadingElement) {
                    loadingElement.style.display = 'none';
                }
            }
        };
        
        this.loadingManager.onError = (url) => {
            console.error(`Error loading: ${url}`);
        };
    }
    
    async loadAssets() {
        try {
            // Load textures
            await this.loadTextures();
            
            // Load models
            await this.loadModels();
            
            console.log('All assets loaded successfully');
            return true;
        } catch (error) {
            console.error('Error loading assets:', error);
            return false;
        }
    }
    
    async loadTextures() {
        const texturePromises = [
            this.loadTexture('ground', 'textures/ground.jpg'),
            this.loadTexture('sky', 'textures/sky.jpg')
        ];
        
        await Promise.all(texturePromises);
    }
    
    loadTexture(name, url) {
        return new Promise((resolve, reject) => {
            this.textureLoader.load(
                url,
                (texture) => {
                    this.textures[name] = texture;
                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.error(`Error loading texture ${url}:`, error);
                    reject(error);
                }
            );
        });
    }
    
    async loadModels() {
        // For now, we'll create simple geometries instead of loading models
        // This can be expanded later to load actual GLTF models
        
        // Create truck model
        this.models.truck = this.createTruckModel();
        
        // Create turret model
        this.models.turret = this.createTurretModel();
        
        // Create enemy model
        this.models.enemy = this.createEnemyModel();
        
        // Create projectile model
        this.models.projectile = this.createProjectileModel();
    }
    
    createTruckModel() {
        const group = new THREE.Group();
        
        // Truck body
        const bodyGeometry = new THREE.BoxGeometry(3, 2, 6);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x5D8AA8 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // Truck cabin
        const cabinGeometry = new THREE.BoxGeometry(3, 1.5, 2);
        const cabinMaterial = new THREE.MeshStandardMaterial({ color: 0x5D8AA8 });
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.set(0, 2.25, -2);
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        group.add(cabin);
        
        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.5, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        
        // Front wheels
        const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontLeftWheel.position.set(1.5, 0.7, -1.5);
        frontLeftWheel.rotation.z = Math.PI / 2;
        frontLeftWheel.castShadow = true;
        frontLeftWheel.receiveShadow = true;
        group.add(frontLeftWheel);
        
        const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontRightWheel.position.set(-1.5, 0.7, -1.5);
        frontRightWheel.rotation.z = Math.PI / 2;
        frontRightWheel.castShadow = true;
        frontRightWheel.receiveShadow = true;
        group.add(frontRightWheel);
        
        // Middle wheels
        const middleLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        middleLeftWheel.position.set(1.5, 0.7, 0);
        middleLeftWheel.rotation.z = Math.PI / 2;
        middleLeftWheel.castShadow = true;
        middleLeftWheel.receiveShadow = true;
        group.add(middleLeftWheel);
        
        const middleRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        middleRightWheel.position.set(-1.5, 0.7, 0);
        middleRightWheel.rotation.z = Math.PI / 2;
        middleRightWheel.castShadow = true;
        middleRightWheel.receiveShadow = true;
        group.add(middleRightWheel);
        
        // Rear wheels
        const rearLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        rearLeftWheel.position.set(1.5, 0.7, 1.5);
        rearLeftWheel.rotation.z = Math.PI / 2;
        rearLeftWheel.castShadow = true;
        rearLeftWheel.receiveShadow = true;
        group.add(rearLeftWheel);
        
        const rearRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        rearRightWheel.position.set(-1.5, 0.7, 1.5);
        rearRightWheel.rotation.z = Math.PI / 2;
        rearRightWheel.castShadow = true;
        rearRightWheel.receiveShadow = true;
        group.add(rearRightWheel);
        
        return group;
    }
    
    createTurretModel() {
        const group = new THREE.Group();
        
        // Turret base
        const baseGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 16);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);
        
        // Turret body
        const bodyGeometry = new THREE.BoxGeometry(1.2, 0.8, 1.2);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.65;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // Turret barrel
        const barrelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 16);
        const barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.position.y = 0.65;
        barrel.position.z = 1;
        barrel.rotation.x = Math.PI / 2;
        barrel.castShadow = true;
        barrel.receiveShadow = true;
        group.add(barrel);
        
        return group;
    }
    
    createEnemyModel() {
        const group = new THREE.Group();
        
        // Enemy body
        const bodyGeometry = new THREE.SphereGeometry(1, 16, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xE74C3C });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // Enemy spikes
        const spikeGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
        const spikeMaterial = new THREE.MeshStandardMaterial({ color: 0xC0392B });
        
        // Add spikes in different directions
        const spikePositions = [
            { x: 0, y: 1, z: 0, rx: Math.PI, ry: 0, rz: 0 },
            { x: 0, y: -1, z: 0, rx: 0, ry: 0, rz: 0 },
            { x: 1, y: 0, z: 0, rx: 0, ry: 0, rz: Math.PI / 2 },
            { x: -1, y: 0, z: 0, rx: 0, ry: 0, rz: -Math.PI / 2 },
            { x: 0, y: 0, z: 1, rx: Math.PI / 2, ry: 0, rz: 0 },
            { x: 0, y: 0, z: -1, rx: -Math.PI / 2, ry: 0, rz: 0 }
        ];
        
        spikePositions.forEach(pos => {
            const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
            spike.position.set(pos.x, pos.y, pos.z);
            spike.rotation.set(pos.rx, pos.ry, pos.rz);
            spike.castShadow = true;
            spike.receiveShadow = true;
            group.add(spike);
        });
        
        return group;
    }
    
    createProjectileModel() {
        const geometry = new THREE.SphereGeometry(0.3, 16, 16);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xF39C12,
            emissive: 0xF39C12,
            emissiveIntensity: 0.5
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        
        return mesh;
    }
    
    getModel(name) {
        if (!this.models[name]) {
            console.warn(`Model '${name}' not found`);
            return null;
        }
        
        // Return a clone of the model
        return this.models[name].clone();
    }
    
    getTexture(name) {
        if (!this.textures[name]) {
            console.warn(`Texture '${name}' not found`);
            return null;
        }
        
        return this.textures[name];
    }
} 