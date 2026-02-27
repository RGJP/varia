import { Game, GameState } from './Game.js';

window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    let game = null;
    const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth < 900;
    const maxDpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    const menuDpr = maxDpr;
    const gameplayDpr = isMobile ? 1 : maxDpr;
    let adaptiveDpr = menuDpr;

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

    const getTargetDpr = () => {
        if (!isMobile) return maxDpr;
        if (!game) return menuDpr;
        return game.state === GameState.START_MENU ? menuDpr : gameplayDpr;
    };

    const updateSize = () => {
        const { width: vpWidth, height: vpHeight } = getSafeViewportSize();
        const targetDpr = getTargetDpr();
        if (Math.abs(targetDpr - adaptiveDpr) >= 0.01) {
            adaptiveDpr = targetDpr;
        }
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
            adaptiveDpr = getTargetDpr();
            updateSize();
            setTimeout(updateSize, 80);
            setTimeout(updateSize, 240);
        }
    });

    // Keep DPR aligned with current game state (menu vs gameplay).
    setInterval(() => {
        if (!game || document.hidden) return;
        const targetDpr = getTargetDpr();
        if (Math.abs(adaptiveDpr - targetDpr) >= 0.03) {
            adaptiveDpr = targetDpr;
            updateSize();
        }
    }, 200);

    game.start();


});
