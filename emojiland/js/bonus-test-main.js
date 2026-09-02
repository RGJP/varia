import { Game, GameState } from './Game.js';
import { Player } from './entities/Player.js';
import { clearEmojiCache, getEmojiCanvas } from './EmojiCache.js';
import { THEMES, getRandomTheme } from './environment/ThemeManager.js';
import { createBonusZone, createRandomBonusZone } from './BonusZone.js';

class BonusTestGame extends Game {
    constructor(canvas, bonusType = 'barrel_blitz', themeKey = 'random') {
        super(canvas);
        this.selectedBonusType = bonusType;
        this.selectedThemeKey = themeKey;
    }

    initLevel() {
        clearEmojiCache();
        const theme = (this.selectedThemeKey && this.selectedThemeKey !== 'random' && THEMES[this.selectedThemeKey])
            ? THEMES[this.selectedThemeKey]
            : getRandomTheme();

        this.currentTheme = theme;
        this.background.setTheme(this.currentTheme);

        const zone = this.selectedBonusType === 'random'
            ? createRandomBonusZone(theme)
            : createBonusZone(this.selectedBonusType, theme);

        zone.returnSnapshot = {
            returnPoint: { x: zone.startX, y: zone.startY },
            player: {
                health: 3,
                score: 0,
                bombs: 3,
                hasCatProtector: false,
                collectedLetters: {}
            }
        };
        zone.introTimer = 0.8;
        zone.introDuration = 0.8;
        zone.introLastCue = null;
        this.bonusZone = zone;

        this.platforms = zone.platforms;
        this.movingPlatforms = zone.movingPlatforms || [];
        this.enemies = zone.enemies || [];
        this.pendingBossSpawns = [];
        this.collectibles = zone.collectibles || [];
        this.pendingBossStarDrops = [];
        this.safeZones = zone.safeZones || [];
        this.specialBarrels = [];
        this.vines = zone.vines || [];
        this.swingingVines = zone.swingingVines || [];
        this.rocks = [];
        this.lightningOrbs = [];
        this.enemyProjectiles = [];
        this.prisonerRescue = null;
        this.hasBossKey = false;
        this.victoryFlagEnabled = false;
        this._victoryPlatforms = [];
        this.lowestY = zone.lowestY || 760;
        this.totalCoins = zone.collectibles.length;
        this.coinsCollected = 0;
        this.totalEnemies = zone.enemies.length;
        this.totalCompletionEnemies = 0;
        this.completionEnemiesDefeated = 0;
        this.enemiesDefeated = 0;
        this.totalCompletionCoins = 0;

        this._clearSceneCaches();
        this._activeSpecialBarrels.length = 0;

        this.player = new Player(zone.startX, zone.startY);
        if (zone.spawnInBarrel && zone.safeZones && zone.safeZones.length > 0) {
            const startBarrel = zone.safeZones[0];
            this.player.inSafeBubble = true;
            this.player.activeSafeBubble = startBarrel;
            this.player.barrelBlastTimer = 0;
            this.player.x = startBarrel.centerX - this.player.width / 2;
            this.player.y = startBarrel.centerY - this.player.height / 2;
        }
        this.player.facingRight = true;
        this.camera.x = Math.max(0, this.player.x + this.player.width / 2 - this.camera.effectiveWidth / 2);
        this.camera.y = 0;

        this._heartCache = getEmojiCanvas('\u2764\uFE0F', 24);
        this._musicCache = getEmojiCanvas('\u25B6\uFE0F', 24);
        this._muteCache = getEmojiCanvas('\u{1F507}', 24);
        this._unmuteCache = getEmojiCanvas('\u{1F50A}', 24);
        this._bombUICache = getEmojiCanvas('\u{1F4A3}', 24);
        this._deathGearCache = getEmojiCanvas('🔥', 32);
    }

    _finishBonusZone(success) {
        // Auto reload bonus zone in test mode
        setTimeout(() => {
            if (this.bonusZone) {
                this.initLevel();
                this.state = GameState.PLAYING;
            }
        }, 1200);
    }
}

window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    const setupPanel = document.getElementById('dev-setup');
    const reopenBtn = document.getElementById('dev-reopen');
    const startBtn = document.getElementById('dev-start');
    const themeSelect = document.getElementById('theme-select');
    const bonusChips = document.querySelectorAll('.bonus-chip');

    let selectedBonusType = 'barrel_blitz';
    let game = null;

    bonusChips.forEach(chip => {
        chip.addEventListener('click', () => {
            bonusChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            selectedBonusType = chip.getAttribute('data-type');
        });
    });

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
        const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));

        canvas.width = Math.max(1, Math.floor(vpWidth * dpr));
        canvas.height = Math.max(1, Math.floor(vpHeight * dpr));
        canvas.style.width = `${vpWidth}px`;
        canvas.style.height = `${vpHeight}px`;
        if (game) game.resize(vpWidth, vpHeight, dpr);
    };

    const startOrReloadBonusZone = () => {
        const themeKey = themeSelect.value;

        if (!game) {
            game = new BonusTestGame(canvas, selectedBonusType, themeKey);
            updateSize();
            game.initLevel();
            game.state = GameState.PLAYING;
            game.input.update();
            if (game.audio && typeof game.audio.unlock === 'function') {
                game.audio.unlock();
            }
            game.start();
        } else {
            game.selectedBonusType = selectedBonusType;
            game.selectedThemeKey = themeKey;
            game.initLevel();
            game.state = GameState.PLAYING;
            game.input.update();
        }

        setupPanel.classList.add('hidden');
        reopenBtn.classList.add('active');
    };

    startBtn.addEventListener('click', () => {
        startOrReloadBonusZone();
    });

    reopenBtn.addEventListener('click', () => {
        setupPanel.classList.remove('hidden');
    });

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
            updateSize();
            setTimeout(updateSize, 80);
            setTimeout(updateSize, 240);
        }
    });

    updateSize();
});
