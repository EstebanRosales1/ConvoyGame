import { Game } from './game.js';
import { AssetLoader } from './assetLoader.js';
import { InputHandler } from './inputHandler.js';
import { UI } from './ui.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    
    // Initialize the game
    const init = async () => {
        try {
            console.log('Creating asset loader...');
            // Create asset loader and preload assets
            const assetLoader = new AssetLoader();
            await assetLoader.loadAssets();
            
            console.log('Creating input handler...');
            // Create input handler
            const inputHandler = new InputHandler();
            
            console.log('Creating UI manager...');
            // Create UI manager
            const ui = new UI();
            
            console.log('Creating and starting game...');
            // Create and start the game
            const game = new Game(assetLoader, inputHandler, ui);
            game.start();
            
            // Add event listeners for game buttons
            document.getElementById('restart-button').addEventListener('click', () => {
                game.restart();
                document.getElementById('game-over').style.display = 'none';
            });
            
            document.getElementById('next-level-button').addEventListener('click', () => {
                game.nextLevel();
                document.getElementById('level-complete').style.display = 'none';
            });
            
            console.log('Game initialized successfully!');
        } catch (error) {
            console.error('Error initializing game:', error);
        }
    };
    
    init().catch(console.error);
}); 