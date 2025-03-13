export class Environment {
    constructor(scene, assetLoader) {
        this.scene = scene;
        this.assetLoader = assetLoader;
        
        // Road properties
        this.roadWidth = 12; // Width of the road
        
        // Environment properties
        this.sceneObjectsGroup = new THREE.Group(); // Group for all scene objects
        this.sceneObjects = []; // Array to track all scene objects
        this.objectGenerationDistance = 100; // Distance between object generation points
        this.lastGenerationZ = 0; // Last Z position where objects were generated
        this.objectRenderDistance = 300; // How far ahead objects are visible
        this.objectDespawnDistance = 50; // How far behind objects are removed
        
        // Create environment elements
        this.createGround();
        this.createRoad();
        this.createSkybox();
        this.createObstacles(); // Initial obstacles
        
        // Add scene objects group to scene
        this.scene.add(this.sceneObjectsGroup);
    }
    
    createGround() {
        // Create a large plane for the ground
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        
        // Use a texture for the ground if available, otherwise use a color
        let groundMaterial;
        const groundTexture = this.assetLoader.getTexture('ground');
        
        if (groundTexture) {
            groundTexture.wrapS = THREE.RepeatWrapping;
            groundTexture.wrapT = THREE.RepeatWrapping;
            groundTexture.repeat.set(100, 100);
            
            groundMaterial = new THREE.MeshStandardMaterial({
                map: groundTexture,
                roughness: 0.8,
                metalness: 0.2
            });
        } else {
            groundMaterial = new THREE.MeshStandardMaterial({
                color: 0x8B4513, // Brown
                roughness: 0.8,
                metalness: 0.2
            });
        }
        
        // Create multiple ground tiles for continuous scrolling effect
        this.groundTiles = [];
        const tileSize = 1000;
        const numTiles = 3; // Use 3 tiles for a seamless transition
        
        for (let i = 0; i < numTiles; i++) {
            const groundTile = new THREE.Mesh(groundGeometry, groundMaterial.clone());
            groundTile.rotation.x = -Math.PI / 2; // Rotate to be horizontal
            groundTile.position.z = i * tileSize - tileSize; // Position tiles in a row
            groundTile.receiveShadow = true;
            this.groundTiles.push(groundTile);
            this.scene.add(groundTile);
        }
    }
    
    createRoad() {
        // Create a long plane for the road
        const roadGeometry = new THREE.PlaneGeometry(this.roadWidth, 1000);
        
        // Create a paved road material
        const roadMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333, // Dark gray for asphalt
            roughness: 0.5,
            metalness: 0.1,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });
        
        // Create multiple road tiles for continuous scrolling effect
        this.roadTiles = [];
        const tileSize = 1000;
        const numTiles = 3; // Use 3 tiles for a seamless transition
        
        for (let i = 0; i < numTiles; i++) {
            const roadTile = new THREE.Mesh(roadGeometry, roadMaterial.clone());
            roadTile.rotation.x = -Math.PI / 2; // Rotate to be horizontal
            roadTile.position.y = 0.05; // Increased height to prevent z-fighting with ground
            roadTile.position.z = i * tileSize - tileSize; // Position tiles in a row
            roadTile.receiveShadow = true;
            this.roadTiles.push(roadTile);
            this.scene.add(roadTile);
        }
    }
    
    createSkybox() {
        // Create a skybox
        const skyGeometry = new THREE.BoxGeometry(2000, 1000, 2000);
        
        // Create a gradient sky material with lighter blue colors
        const topColor = new THREE.Color(0x87ceeb); // Light sky blue at the top
        const bottomColor = new THREE.Color(0xb0e2ff); // Even lighter blue at the horizon
        
        // Create a shader material with a vertical gradient
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: topColor },
                bottomColor: { value: bottomColor },
                offset: { value: 400 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        
        this.skybox = new THREE.Mesh(skyGeometry, skyMaterial);
        this.skybox.position.y = 0; // Center at origin
        this.scene.add(this.skybox);
        
        // Add a sun
        this.addSun();
    }
    
    addSun() {
        // Create a sun (bright sphere)
        const sunGeometry = new THREE.SphereGeometry(50, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffcc,
            transparent: true,
            opacity: 0.8
        });
        
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sun.position.set(500, 400, -1000); // Position in the sky
        this.scene.add(this.sun);
        
        // Add a lens flare effect
        const sunLight = new THREE.PointLight(0xffffcc, 1.5, 2000);
        sunLight.position.copy(this.sun.position);
        this.scene.add(sunLight);
    }
    
    createObstacles() {
        // Create some environmental obstacles
        this.obstacles = new THREE.Group();
        
        // Add initial set of objects around the starting position
        this.generateSceneObjects(new THREE.Vector3(0, 0, 0), true);
        
        // Add to scene
        this.scene.add(this.obstacles);
    }
    
    generateSceneObjects(convoyPosition, isInitial = false) {
        // Determine the area to generate objects in
        let startZ, endZ;
        
        if (isInitial) {
            // For initial generation, create objects around the starting position
            startZ = convoyPosition.z - 50;
            endZ = convoyPosition.z + this.objectRenderDistance;
            this.lastGenerationZ = endZ;
        } else {
            // For ongoing generation, create objects ahead of the player
            startZ = this.lastGenerationZ;
            endZ = startZ + this.objectGenerationDistance;
            this.lastGenerationZ = endZ;
        }
        
        // Generate objects in the area
        const objectCount = isInitial ? 50 : 10; // More objects for initial generation
        
        for (let i = 0; i < objectCount; i++) {
            // Random position within the generation area
            const x = (Math.random() - 0.5) * 200; // -100 to 100
            const z = startZ + Math.random() * (endZ - startZ);
            
            // Make sure objects are not on the road
            if (Math.abs(x) < this.roadWidth / 2 + 5) {
                continue; // Skip this position if it's on or too close to the road
            }
            
            // Randomly select object type
            const objectType = Math.random();
            
            if (objectType < 0.5) {
                // 50% chance for trees
                this.addTree(x, z);
            } else if (objectType < 0.8) {
                // 30% chance for rocks
                this.addRock(x, z);
            } else {
                // 20% chance for buildings
                this.addBuilding(x, z);
            }
        }
    }
    
    addTree(x, z) {
        const tree = this.createTree();
        
        // Position - ensure y is 0 for proper ground placement
        tree.position.set(x, 0, z);
        
        // Random rotation and scale
        tree.rotation.y = Math.random() * Math.PI * 2;
        const scale = 0.8 + Math.random() * 1.2;
        tree.scale.set(scale, scale, scale);
        
        // Add to scene objects
        this.sceneObjectsGroup.add(tree);
        this.sceneObjects.push({
            mesh: tree,
            type: 'tree'
        });
    }
    
    addRock(x, z) {
        // Create rock
        const rockGeometries = [
            new THREE.DodecahedronGeometry(2, 0),
            new THREE.DodecahedronGeometry(1.5, 1),
            new THREE.DodecahedronGeometry(1, 0)
        ];
        
        const rockMaterials = [
            new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.9 }),
            new THREE.MeshStandardMaterial({ color: 0x707070, roughness: 0.8 }),
            new THREE.MeshStandardMaterial({ color: 0x606060, roughness: 0.7 })
        ];
        
        const rockIndex = Math.floor(Math.random() * rockGeometries.length);
        const rock = new THREE.Mesh(rockGeometries[rockIndex], rockMaterials[rockIndex]);
        
        // Position - ensure y is properly set for ground contact
        const yOffset = rockIndex === 0 ? 1 : (rockIndex === 1 ? 0.75 : 0.5); // Adjust based on rock size
        rock.position.set(x, yOffset, z);
        
        // Random rotation and scale
        rock.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        
        const scale = 0.5 + Math.random() * 1.5;
        rock.scale.set(scale, scale, scale);
        
        rock.castShadow = true;
        rock.receiveShadow = true;
        
        // Add to scene objects
        this.sceneObjectsGroup.add(rock);
        this.sceneObjects.push({
            mesh: rock,
            type: 'rock'
        });
    }
    
    addBuilding(x, z) {
        // Create a building
        const building = this.createBuilding();
        
        // Position - ensure y is 0 for proper ground placement
        building.position.set(x, 0, z);
        
        // Random rotation
        building.rotation.y = Math.random() * Math.PI * 2;
        
        // Random scale (smaller for buildings to not overwhelm the scene)
        const scale = 0.6 + Math.random() * 0.8;
        building.scale.set(scale, scale, scale);
        
        // Add to scene objects
        this.sceneObjectsGroup.add(building);
        this.sceneObjects.push({
            mesh: building,
            type: 'building'
        });
    }
    
    createBuilding() {
        const building = new THREE.Group();
        
        // Randomly choose between two new house types
        if (Math.random() < 0.5) {
            this.createCabin(building);
        } else {
            this.createModernHouse(building);
        }
        
        return building;
    }
    
    createCabin(group) {
        // Cabin base
        const baseGeometry = new THREE.BoxGeometry(8, 4, 10);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // Brown wood
            roughness: 0.9
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 2;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);
        
        // Cabin roof - triangular prism shape
        const roofHeight = 3;
        const roofWidth = 9;
        const roofDepth = 12;
        
        // Create triangular shape for the roof
        const roofShape = new THREE.Shape();
        roofShape.moveTo(-roofWidth/2, 0);
        roofShape.lineTo(0, roofHeight);
        roofShape.lineTo(roofWidth/2, 0);
        roofShape.lineTo(-roofWidth/2, 0);
        
        // Extrude the shape to create a 3D roof
        const extrudeSettings = {
            steps: 1,
            depth: roofDepth,
            bevelEnabled: false
        };
        
        const roofGeometry = new THREE.ExtrudeGeometry(roofShape, extrudeSettings);
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x3B2F2F, // Dark brown
            roughness: 0.8
        });
        
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, 4, -roofDepth/2 + 5); // Center on the cabin
        roof.rotation.x = Math.PI / 2; // Rotate to be horizontal
        roof.castShadow = true;
        roof.receiveShadow = true;
        group.add(roof);
        
        // Cabin door
        const doorGeometry = new THREE.BoxGeometry(1.5, 3, 0.2);
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0x4A2511, // Dark wood
            roughness: 0.7
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, 1.5, 5.1);
        door.castShadow = true;
        door.receiveShadow = true;
        group.add(door);
        
        // Cabin windows
        this.addCabinWindow(group, -2.5, 2, 5.1);  // Front window
        this.addCabinWindow(group, 2.5, 2, 5.1);   // Front window
        this.addCabinWindow(group, 4.1, 2, 0);     // Side window
        this.addCabinWindow(group, -4.1, 2, 0);    // Side window
        
        // Add a chimney
        const chimneyGeometry = new THREE.BoxGeometry(1, 2, 1);
        const chimneyMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // Brown
            roughness: 0.9
        });
        const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
        chimney.position.set(2.5, 6, 0); // Position on the roof
        chimney.castShadow = true;
        chimney.receiveShadow = true;
        group.add(chimney);
        
        return group;
    }
    
    addCabinWindow(group, x, y, z) {
        // Window frame
        const frameGeometry = new THREE.BoxGeometry(1.5, 1.5, 0.3);
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x4A2511, // Dark wood
            roughness: 0.7
        });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(x, y, z);
        frame.castShadow = true;
        frame.receiveShadow = true;
        group.add(frame);
        
        // Window glass
        const glassGeometry = new THREE.BoxGeometry(1.2, 1.2, 0.1);
        const glassMaterial = new THREE.MeshStandardMaterial({
            color: 0xADD8E6, // Light blue
            roughness: 0.2,
            metalness: 0.2,
            transparent: true,
            opacity: 0.7
        });
        const glass = new THREE.Mesh(glassGeometry, glassMaterial);
        glass.position.set(x, y, z + 0.2);
        glass.castShadow = false;
        glass.receiveShadow = true;
        group.add(glass);
    }
    
    createModernHouse(group) {
        // Modern house - main structure
        const baseGeometry = new THREE.BoxGeometry(12, 5, 14);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0xE0E0E0, // Light gray
            roughness: 0.6
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 2.5;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);
        
        // Flat roof
        const roofGeometry = new THREE.BoxGeometry(13, 0.5, 15);
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333, // Dark gray
            roughness: 0.7
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 5.25;
        roof.castShadow = true;
        roof.receiveShadow = true;
        group.add(roof);
        
        // Second floor - smaller box on top
        const secondFloorGeometry = new THREE.BoxGeometry(8, 4, 10);
        const secondFloorMaterial = new THREE.MeshStandardMaterial({
            color: 0xE0E0E0, // Light gray
            roughness: 0.6
        });
        const secondFloor = new THREE.Mesh(secondFloorGeometry, secondFloorMaterial);
        secondFloor.position.y = 7.5;
        secondFloor.castShadow = true;
        secondFloor.receiveShadow = true;
        group.add(secondFloor);
        
        // Second floor roof
        const secondRoofGeometry = new THREE.BoxGeometry(9, 0.5, 11);
        const secondRoofMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333, // Dark gray
            roughness: 0.7
        });
        const secondRoof = new THREE.Mesh(secondRoofGeometry, secondRoofMaterial);
        secondRoof.position.y = 9.75;
        secondRoof.castShadow = true;
        secondRoof.receiveShadow = true;
        group.add(secondRoof);
        
        // Front door
        const doorGeometry = new THREE.BoxGeometry(2, 3.5, 0.2);
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // Brown
            roughness: 0.7
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, 1.75, 7.1);
        door.castShadow = true;
        door.receiveShadow = true;
        group.add(door);
        
        // Windows - first floor
        this.addModernWindow(group, -4, 2.5, 7.1);  // Front window
        this.addModernWindow(group, 4, 2.5, 7.1);   // Front window
        this.addModernWindow(group, 6.1, 2.5, 3);   // Side window
        this.addModernWindow(group, 6.1, 2.5, -3);  // Side window
        this.addModernWindow(group, -6.1, 2.5, 3);  // Side window
        this.addModernWindow(group, -6.1, 2.5, -3); // Side window
        
        // Windows - second floor
        this.addModernWindow(group, -2, 7.5, 5.1);  // Front window
        this.addModernWindow(group, 2, 7.5, 5.1);   // Front window
        this.addModernWindow(group, 4.1, 7.5, 0);   // Side window
        this.addModernWindow(group, -4.1, 7.5, 0);  // Side window
        
        return group;
    }
    
    addModernWindow(group, x, y, z) {
        // Large window with minimal frame
        const frameGeometry = new THREE.BoxGeometry(2.5, 2, 0.2);
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333, // Dark gray
            roughness: 0.5
        });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(x, y, z);
        frame.castShadow = true;
        frame.receiveShadow = true;
        group.add(frame);
        
        // Window glass
        const glassGeometry = new THREE.BoxGeometry(2.3, 1.8, 0.1);
        const glassMaterial = new THREE.MeshStandardMaterial({
            color: 0x87CEEB, // Sky blue
            roughness: 0.1,
            metalness: 0.3,
            transparent: true,
            opacity: 0.8
        });
        const glass = new THREE.Mesh(glassGeometry, glassMaterial);
        glass.position.set(x, y, z + 0.1);
        glass.castShadow = false;
        glass.receiveShadow = true;
        group.add(glass);
    }
    
    createTree() {
        const tree = new THREE.Group();
        
        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 4, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // Brown
            roughness: 0.9
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        tree.add(trunk);
        
        // Tree foliage
        const foliageGeometry = new THREE.ConeGeometry(2, 6, 8);
        const foliageMaterial = new THREE.MeshStandardMaterial({
            color: 0x228B22, // Forest green
            roughness: 0.8
        });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = 6;
        foliage.castShadow = true;
        foliage.receiveShadow = true;
        tree.add(foliage);
        
        return tree;
    }
    
    update(deltaTime, convoyPosition) {
        // Update skybox position to follow convoy
        this.skybox.position.x = convoyPosition.x;
        this.skybox.position.z = convoyPosition.z;
        
        // Update sun position to follow convoy (only x and z)
        if (this.sun) {
            this.sun.position.x = convoyPosition.x + 500;
            this.sun.position.z = convoyPosition.z - 1000;
        }
        
        // Update ground tiles for infinite scrolling effect
        const tileSize = 1000;
        for (let i = 0; i < this.groundTiles.length; i++) {
            const tile = this.groundTiles[i];
            
            // Calculate the relative position to the convoy
            const relativePosZ = tile.position.z - convoyPosition.z;
            
            // If the tile is too far behind the convoy, move it to the front
            if (relativePosZ < -tileSize) {
                // Find the frontmost tile
                let maxZ = -Infinity;
                for (const otherTile of this.groundTiles) {
                    if (otherTile.position.z > maxZ) {
                        maxZ = otherTile.position.z;
                    }
                }
                // Position this tile in front of the frontmost tile
                tile.position.z = maxZ + tileSize;
            }
            
            // Update tile X position to match convoy X position
            tile.position.x = convoyPosition.x;
        }
        
        // Update road tiles for infinite scrolling effect
        for (let i = 0; i < this.roadTiles.length; i++) {
            const tile = this.roadTiles[i];
            
            // Calculate the relative position to the convoy
            const relativePosZ = tile.position.z - convoyPosition.z;
            
            // If the tile is too far behind the convoy, move it to the front
            if (relativePosZ < -tileSize) {
                // Find the frontmost tile
                let maxZ = -Infinity;
                for (const otherTile of this.roadTiles) {
                    if (otherTile.position.z > maxZ) {
                        maxZ = otherTile.position.z;
                    }
                }
                // Position this tile in front of the frontmost tile
                tile.position.z = maxZ + tileSize;
            }
            
            // Update tile X position to match convoy X position
            tile.position.x = convoyPosition.x;
        }
        
        // Check if we need to generate new scene objects
        if (convoyPosition.z + this.objectRenderDistance > this.lastGenerationZ) {
            this.generateSceneObjects(convoyPosition);
        }
        
        // Remove objects that are too far behind the player
        this.cleanupDistantObjects(convoyPosition);
    }
    
    cleanupDistantObjects(convoyPosition) {
        // Remove objects that are too far behind the player
        for (let i = this.sceneObjects.length - 1; i >= 0; i--) {
            const object = this.sceneObjects[i];
            const distanceBehind = convoyPosition.z - object.mesh.position.z;
            
            if (distanceBehind > this.objectDespawnDistance) {
                // Remove from scene
                this.sceneObjectsGroup.remove(object.mesh);
                
                // Remove from array
                this.sceneObjects.splice(i, 1);
            }
        }
    }
}