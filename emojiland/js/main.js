import { Game } from './Game.js';

window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');

    const updateSize = () => {
        const vpWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
        const vpHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;

        canvas.width = vpWidth;
        canvas.height = vpHeight;
        if (game) game.resize(vpWidth, vpHeight);
    };

    const game = new Game(canvas);
    updateSize();

    let resizeTimeout;
    const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateSize, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleResize);
    }

    game.start();

    // Enforce full screen on first user interaction for mobile
    window.addEventListener('touchstart', () => {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => { });
        }
    }, { once: true, passive: true });
});
