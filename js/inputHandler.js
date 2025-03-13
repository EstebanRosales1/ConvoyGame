export class InputHandler {
    constructor() {
        // Input state
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            isDown: false
        };
        this.isShooting = false;
        this.isRightMouseDown = false;
        
        // Mouse movement tracking for camera control
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
        
        // Bind methods
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onContextMenu = this.onContextMenu.bind(this);
        
        // Add event listeners
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mouseup', this.onMouseUp);
        window.addEventListener('contextmenu', this.onContextMenu);
    }
    
    onKeyDown(event) {
        this.keys[event.code] = true;
    }
    
    onKeyUp(event) {
        this.keys[event.code] = false;
    }
    
    onMouseMove(event) {
        // Calculate normalized device coordinates (-1 to +1)
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Calculate mouse movement delta for camera control
        if (this.isRightMouseDown) {
            this.mouseDeltaX = event.clientX - this.lastMouseX;
            this.mouseDeltaY = event.clientY - this.lastMouseY;
        } else {
            this.mouseDeltaX = 0;
            this.mouseDeltaY = 0;
        }
        
        // Update last mouse position
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
    }
    
    onMouseDown(event) {
        if (event.button === 0) { // Left mouse button
            this.mouse.isDown = true;
            this.isShooting = true;
        } else if (event.button === 2) { // Right mouse button
            this.isRightMouseDown = true;
        }
    }
    
    onMouseUp(event) {
        if (event.button === 0) { // Left mouse button
            this.mouse.isDown = false;
        } else if (event.button === 2) { // Right mouse button
            this.isRightMouseDown = false;
        }
    }
    
    // Prevent context menu from appearing on right-click
    onContextMenu(event) {
        event.preventDefault();
    }
    
    isKeyDown(keyCode) {
        return this.keys[keyCode] === true;
    }
    
    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }
    
    cleanup() {
        // Remove event listeners
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('mousedown', this.onMouseDown);
        window.removeEventListener('mouseup', this.onMouseUp);
        window.removeEventListener('contextmenu', this.onContextMenu);
    }
} 