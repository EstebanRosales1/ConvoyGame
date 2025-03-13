# Convoy Shooter

A 3D third-person convoy defense game built with Three.js. Protect your convoy from waves of enemies as it travels to the safe zone.

## Game Overview

In Convoy Shooter, you control a turret mounted on top of a truck convoy. Your mission is to defend the convoy from waves of enemies that attack from all directions. The convoy will automatically move forward toward the safe zone, and your job is to ensure it reaches its destination safely.

## Game Features

- 3D third-person shooter gameplay
- Player-controlled turret with mouse aiming
- Multiple enemy types with different behaviors
- Progressive difficulty with increasing levels
- Score tracking and convoy health monitoring
- Visual effects for projectiles and damage

## How to Play

1. Open `index.html` in a modern web browser
2. Use the mouse to aim the turret
3. Click to shoot at enemies
4. Defend the convoy until it reaches the safe zone
5. If the convoy's health reaches 0, the game is over

## Controls

- **Mouse Movement**: Aim the turret
- **Left Mouse Button**: Shoot
- **Restart Button**: Start a new game after game over
- **Next Level Button**: Proceed to the next level after completing a level

## Enemy Types

- **Basic Enemies (Red)**: Standard enemies with balanced speed and health
- **Fast Enemies (Blue)**: Quick but fragile enemies that can quickly reach your convoy
- **Tank Enemies (Purple)**: Slow but tough enemies that deal more damage to your convoy

## Development

This game is built using:

- Three.js for 3D rendering
- JavaScript ES6+ for game logic
- HTML5 and CSS3 for UI elements

## Project Structure

```
convoy-shooter/
├── index.html          # Main HTML file
├── js/                 # JavaScript files
│   ├── main.js         # Entry point
│   ├── game.js         # Main game logic
│   ├── assetLoader.js  # Asset loading management
│   ├── inputHandler.js # User input handling
│   ├── ui.js           # UI management
│   ├── convoy.js       # Convoy logic
│   ├── player.js       # Player (turret) logic
│   ├── enemyManager.js # Enemy spawning and management
│   ├── enemy.js        # Individual enemy logic
│   ├── projectile.js   # Projectile logic
│   └── environment.js  # Game environment
├── models/             # 3D models (if any)
├── textures/           # Texture files
└── audio/              # Sound files
```

## Future Enhancements

- Add sound effects and background music
- Implement power-ups and special weapons
- Add more enemy types and behaviors
- Create additional levels with unique environments
- Add mobile device support

## License

This project is open source and available under the MIT License. 