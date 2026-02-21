import { Game } from './Game.js';

window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');

    // Set initial size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const game = new Game(canvas);

    // Handle window resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        game.resize(canvas.width, canvas.height);
    });

    game.start();
});
