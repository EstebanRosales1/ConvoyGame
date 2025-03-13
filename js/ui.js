export class UI {
    constructor() {
        // Get UI elements
        this.convoyHealthElement = document.getElementById('convoy-health');
        this.scoreElement = document.getElementById('score');
        this.waveElement = document.getElementById('wave');
        
        // Initialize UI
        this.updateConvoyHealth(100);
        this.updateScore(0);
        this.updateWave(1);
    }
    
    updateConvoyHealth(health) {
        this.convoyHealthElement.textContent = `Vehicle Health: ${health}%`;
        
        // Change color based on health
        if (health > 70) {
            this.convoyHealthElement.style.color = '#4CAF50'; // Green
        } else if (health > 30) {
            this.convoyHealthElement.style.color = '#FFC107'; // Yellow
        } else {
            this.convoyHealthElement.style.color = '#F44336'; // Red
        }
    }
    
    updateScore(score) {
        this.scoreElement.textContent = `Score: ${score}m`;
    }
    
    updateWave(wave) {
        this.waveElement.textContent = `Difficulty: ${wave}`;
    }
    
    showGameOver(score) {
        const gameOverElement = document.getElementById('game-over');
        const scoreDisplay = gameOverElement.querySelector('p');
        scoreDisplay.textContent = `Your vehicle was destroyed! Final score: ${score}m`;
        gameOverElement.style.display = 'block';
    }
    
    showLevelComplete(level, score) {
        const levelCompleteElement = document.getElementById('level-complete');
        levelCompleteElement.style.display = 'block';
    }
    
    hideGameOver() {
        const gameOverElement = document.getElementById('game-over');
        gameOverElement.style.display = 'none';
    }
    
    hideLevelComplete() {
        const levelCompleteElement = document.getElementById('level-complete');
        levelCompleteElement.style.display = 'none';
    }
} 