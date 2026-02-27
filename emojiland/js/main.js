import { Game } from './Game.js';

window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    let game = null;
    const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth < 900;
    const maxDpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    let adaptiveDpr = isMobile ? 1 : maxDpr;

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
        const dpr = adaptiveDpr;

        canvas.width = Math.max(1, Math.floor(vpWidth * dpr));
        canvas.height = Math.max(1, Math.floor(vpHeight * dpr));
        canvas.style.width = `${vpWidth}px`;
        canvas.style.height = `${vpHeight}px`;
        if (game) game.resize(vpWidth, vpHeight, dpr);
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
            adaptiveDpr = isMobile ? 1 : maxDpr;
            updateSize();
            setTimeout(updateSize, 80);
            setTimeout(updateSize, 240);
        }
    });

    // Keep frame pacing stable by adapting render resolution on mobile devices.
    setInterval(() => {
        if (!game || !isMobile || document.hidden) return;

        const fps = game.fpsDisplay || 0;
        const minDpr = 1;
        if (adaptiveDpr <= minDpr + 0.001) return;

        const prev = adaptiveDpr;
        if (fps > 0 && fps < 59.2) {
            adaptiveDpr = Math.max(minDpr, adaptiveDpr - 0.12);
        }

        if (Math.abs(prev - adaptiveDpr) >= 0.03) {
            updateSize();
        }
    }, 500);

    game.start();


});
