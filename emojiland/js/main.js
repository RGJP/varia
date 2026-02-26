import { Game } from './Game.js';

window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    let game = null;

    const getSafeViewportSize = () => {
        const innerWidth = Math.max(1, Math.floor(window.innerWidth || 1));
        const innerHeight = Math.max(1, Math.floor(window.innerHeight || 1));
        const vv = window.visualViewport;
        if (!vv) return { width: innerWidth, height: innerHeight };

        const vvWidth = Math.floor(vv.width || 0);
        const vvHeight = Math.floor(vv.height || 0);
        const vvLooksInvalid = vvWidth < 120 || vvHeight < 120;
        if (document.hidden || vvLooksInvalid) {
            return { width: innerWidth, height: innerHeight };
        }
        return { width: Math.max(1, vvWidth), height: Math.max(1, vvHeight) };
    };

    const updateSize = () => {
        const { width: vpWidth, height: vpHeight } = getSafeViewportSize();

        canvas.width = vpWidth;
        canvas.height = vpHeight;
        canvas.style.width = `${vpWidth}px`;
        canvas.style.height = `${vpHeight}px`;
        if (game) game.resize(vpWidth, vpHeight);
    };

    game = new Game(canvas);
    updateSize();

    let resizeTimeout;
    const handleResize = () => {
        if (document.hidden) return;
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateSize, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleResize);
    }

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // Mobile browsers can report transient bad viewport sizes right after resume.
            updateSize();
            setTimeout(updateSize, 80);
            setTimeout(updateSize, 240);
        }
    });

    game.start();


});
