import { Game, GameState } from './Game.js';
import { Platform } from './environment/Platform.js';
import { getRandomTheme } from './environment/ThemeManager.js';
import { Player } from './entities/Player.js';
import { Enemy, Boss } from './entities/Enemy.js';
import { clearEmojiCache, getEmojiCanvas } from './EmojiCache.js';

const DEV_TARGETS = [
    { id: 'enemy:patrol:turtle', label: 'Enemy - Turtle (🐢)', kind: 'enemy', type: 'patrol', emoji: '🐢' },
    { id: 'enemy:chaser:ogre', label: 'Enemy - Ogre (👹)', kind: 'enemy', type: 'chaser', emoji: '👹' },
    { id: 'enemy:jumper:frog', label: 'Enemy - Frog (🐸)', kind: 'enemy', type: 'jumper', emoji: '🐸' },
    { id: 'enemy:shooter:genie', label: 'Enemy - Genie (🐡)', kind: 'enemy', type: 'shooter', emoji: '🐡' },
    { id: 'enemy:eagle', label: 'Enemy - Eagle (🦅)', kind: 'enemy', type: 'eagle', emoji: '🦅' },
    { id: 'enemy:owl', label: 'Enemy - Owl (🦉)', kind: 'enemy', type: 'owl', emoji: '🦉' },
    { id: 'enemy:crow', label: 'Enemy - Crow (🐦‍⬛)', kind: 'enemy', type: 'crow', emoji: '🐦‍⬛' },
    { id: 'enemy:ghost', label: 'Enemy - Ghost (👻)', kind: 'enemy', type: 'ghost', emoji: '👻' },
    { id: 'enemy:zombie', label: 'Enemy - Zombie (🧟‍♂️)', kind: 'enemy', type: 'zombie', emoji: '🧟‍♂️' },
    { id: 'enemy:dino', label: 'Enemy - Dino (🦕)', kind: 'enemy', type: 'dino', emoji: '🦕' },
    { id: 'enemy:squid', label: 'Enemy - Squid (🦑)', kind: 'enemy', type: 'squid', emoji: '🦑' },
    { id: 'enemy:lizard', label: 'Enemy - Lizard (🦗)', kind: 'enemy', type: 'lizard', emoji: '🦗' },
    { id: 'enemy:crab', label: 'Enemy - Crab (🦀)', kind: 'enemy', type: 'crab', emoji: '🦀' },
    { id: 'enemy:squirrel', label: 'Enemy - Squirrel (🐿️)', kind: 'enemy', type: 'squirrel', emoji: '🐿️' },
    { id: 'enemy:troll', label: 'Enemy - Troll (🧌)', kind: 'enemy', type: 'troll', emoji: '🧌' },
    { id: 'enemy:alien', label: 'Enemy - Alien (🛸)', kind: 'enemy', type: 'alien', emoji: '🛸' },
    { id: 'enemy:ape', label: 'Enemy - Ape (🦍)', kind: 'enemy', type: 'ape', emoji: '🦍' },
    { id: 'enemy:spider', label: 'Enemy - Spider (🕷️)', kind: 'enemy', type: 'spider', emoji: '🕷️' },
    { id: 'enemy:peacock', label: 'Enemy - Peacock (🦚)', kind: 'enemy', type: 'peacock', emoji: '🦚' },
    { id: 'enemy:enraged', label: 'Enemy - Enraged (😡)', kind: 'enemy', type: 'enraged', emoji: '😡' },
    { id: 'enemy:jellyfish', label: 'Enemy - Jellyfish (🪼)', kind: 'enemy_custom', type: 'jellyfish', emoji: '🪼' },
    { id: 'boss:boss_chick', label: 'Boss - Chick', kind: 'boss', bossType: 'boss_chick' },
    { id: 'boss:boss_moai', label: 'Boss - Moai', kind: 'boss', bossType: 'boss_moai' },
    { id: 'boss:boss_tengu', label: 'Boss - Tengu', kind: 'boss', bossType: 'boss_tengu' },
    { id: 'boss:boss_spider', label: 'Boss - Spider', kind: 'boss', bossType: 'boss_spider' },
    { id: 'boss:boss_dragon', label: 'Boss - Dragon', kind: 'boss', bossType: 'boss_dragon' },
    { id: 'boss:boss_manliftingweights', label: 'Boss - Man Lifting Weights', kind: 'boss', bossType: 'boss_manliftingweights' },
    { id: 'boss:boss_lobster', label: 'Boss - Lobster', kind: 'boss', bossType: 'boss_lobster' },
    { id: 'boss:boss_kangaroo', label: 'Boss - Kangaroo', kind: 'boss', bossType: 'boss_kangaroo' },
    { id: 'boss:boss_monkey', label: 'Boss - Monkey', kind: 'boss', bossType: 'boss_monkey' },
    { id: 'boss:boss_mammoth', label: 'Boss - Mammoth', kind: 'boss', bossType: 'boss_mammoth' },
    { id: 'boss:boss_trex', label: 'Boss - T-Rex', kind: 'boss', bossType: 'boss_trex' },
    { id: 'boss:boss_mosquito', label: 'Boss - Mosquito', kind: 'boss', bossType: 'boss_mosquito' },
    { id: 'boss:boss_beetle', label: 'Boss - Beetle', kind: 'boss', bossType: 'boss_beetle' },
    { id: 'boss:boss_juggler', label: 'Boss - Person Juggling', kind: 'boss', bossType: 'boss_juggler' },
    { id: 'boss:boss_honeybee', label: 'Boss - Honeybee (🐝)', kind: 'boss', bossType: 'boss_honeybee' }
];

class DevGame extends Game {
    constructor(canvas, selectedTarget, spawnCount = 1) {
        super(canvas);
        this.selectedTarget = selectedTarget;
        this.spawnCount = Math.max(1, Math.floor(spawnCount || 1));
        this.devArenaBaseY = 700;
    }

    initLevel() {
        clearEmojiCache();
        const theme = getRandomTheme();
        const baseY = this.devArenaBaseY;
        const arenaX = 3200; // Keep dev arena away from world-start wall (x < 0 clamp).
        const arenaW = 1200; // Match normal boss platform length.
        const platform = new Platform(arenaX, baseY, arenaW, 100, false, theme);
        const rescuePlatform = new Platform(arenaX + arenaW + 360, baseY - 30, 390, 90, false, theme);
        const victoryPlatform = new Platform(arenaX + arenaW + 980, baseY - 50, 300, 100, true, theme);
        victoryPlatform.flagActive = false;

        this.platforms = [platform, rescuePlatform, victoryPlatform];
        this._victoryPlatforms = [victoryPlatform];
        this.movingPlatforms = [];
        this.collectibles = [];
        this.pendingBossStarDrops = [];
        this.prisonerRescue = null;
        this.hasBossKey = false;
        this.victoryFlagEnabled = false;
        this.safeZones = [];
        this.vines = [];
        this.swingingVines = [];
        this.enemies = [];
        this.pendingBossSpawns = [];
        this.rocks = [];
        this.enemyProjectiles = [];

        this.totalCoins = 0;
        this.coinsCollected = 0;
        this.totalEnemies = this.spawnCount;
        this.enemiesDefeated = 0;

        this.gameOverTriggered = false;
        this.gameOverTimer = 0;

        this.currentTheme = theme;
        this.background.setTheme(this.currentTheme);
        this.lowestY = baseY + 420;

        this.player = new Player(arenaX + 80, baseY - 70);
        this.player.facingRight = true;
        this.camera.x = Math.max(0, this.player.x + this.player.width / 2 - this.camera.effectiveWidth / 2);

        this._initPrisonerRescue({
            platformX: rescuePlatform.x,
            platformY: rescuePlatform.y,
            platformWidth: rescuePlatform.width,
            platformHeight: rescuePlatform.height
        });

        const spawnMargin = 140;
        const spawnLeft = arenaX + spawnMargin;
        const spawnRight = arenaX + arenaW - spawnMargin;
        const selected = this.selectedTarget;
        let spawnedCount = 0;
        for (let i = 0; i < this.spawnCount; i++) {
            const t = this.spawnCount <= 1 ? 0.5 : (i / (this.spawnCount - 1));
            const spawnX = spawnLeft + (spawnRight - spawnLeft) * t;
            const spawned = this._createSelectedEntity(selected, spawnX, platform);
            if (spawned) {
                this.enemies.push(spawned);
                spawnedCount++;
            }
        }
        this.totalEnemies = spawnedCount;

        this._heartCache = getEmojiCanvas('\u2764\uFE0F', 24);
        this._musicCache = getEmojiCanvas('\u25B6\uFE0F', 24);
        this._muteCache = getEmojiCanvas('\u{1F507}', 24);
        this._unmuteCache = getEmojiCanvas('\u{1F50A}', 24);
        this._bombUICache = getEmojiCanvas('\u{1F4A3}', 24);
    }

    _createSelectedEntity(selected, x, platform) {
        if (!selected) return null;

        if (selected.kind === 'boss') {
            return new Boss(x, platform.y, platform, selected.bossType);
        }

        if (selected.kind === 'enemy_custom' && selected.type === 'jellyfish') {
            const jelly = new Enemy(x, platform.y - 46, platform);
            jelly.type = 'jellyfish';
            jelly.emoji = '🪼';
            jelly.width = 46;
            jelly.height = 46;
            jelly.x = x;
            jelly.y = platform.y - jelly.height;
            jelly.startX = jelly.x;
            jelly.startY = jelly.y;
            jelly.baseSpeed = 0;
            jelly.speed = 0;
            jelly.health = 1;
            jelly.maxHealth = 1;
            jelly.state = 'FLOAT';
            jelly.vx = 0;
            jelly.vy = 0;
            jelly._cachedEmoji = getEmojiCanvas(jelly.emoji, jelly.height);
            return jelly;
        }

        if (selected.kind === 'enemy') {
            for (let i = 0; i < 320; i++) {
                const enemy = new Enemy(x, platform.y - 80, platform);
                if (enemy.type === selected.type && enemy.emoji === selected.emoji) {
                    enemy.x = x;
                    if (enemy.type !== 'ghost' && enemy.type !== 'shooter' && enemy.type !== 'alien' && enemy.type !== 'bird' && enemy.type !== 'eagle' && enemy.type !== 'owl' && enemy.type !== 'crow' && enemy.type !== 'squid') {
                        enemy.y = platform.y - enemy.height;
                    }
                    enemy.startX = enemy.x;
                    enemy.startY = enemy.y;
                    return enemy;
                }
            }
        }

        return null;
    }
}

window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    const setupPanel = document.getElementById('dev-setup');
    const reopenBtn = document.getElementById('dev-reopen');
    const select = document.getElementById('dev-spawn-select');
    const countInput = document.getElementById('dev-spawn-count');
    const startBtn = document.getElementById('dev-start');

    let game = null;

    for (let i = 0; i < DEV_TARGETS.length; i++) {
        const option = document.createElement('option');
        option.value = DEV_TARGETS[i].id;
        option.textContent = DEV_TARGETS[i].label;
        select.appendChild(option);
    }

    const getSelectedTarget = () => {
        const selectedId = select.value;
        return DEV_TARGETS.find(target => target.id === selectedId) || DEV_TARGETS[0];
    };

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

    const getSpawnCount = () => {
        const raw = Number.parseInt(countInput.value, 10);
        if (!Number.isFinite(raw)) return 1;
        return Math.max(1, Math.min(20, raw));
    };

    const startOrReloadArena = () => {
        const target = getSelectedTarget();
        const spawnCount = getSpawnCount();
        countInput.value = String(spawnCount);

        if (!game) {
            game = new DevGame(canvas, target, spawnCount);
            updateSize();
            game.initLevel();
            game.state = GameState.PLAYING;
            game.input.update();
            if (game.audio && typeof game.audio.unlock === 'function') {
                game.audio.unlock();
            }
            game.start();
        } else {
            game.selectedTarget = target;
            game.spawnCount = spawnCount;
            game.initLevel();
            game.state = GameState.PLAYING;
            game.input.update();
        }

        setupPanel.classList.add('hidden');
        reopenBtn.classList.add('active');
    };

    startBtn.addEventListener('click', () => {
        startOrReloadArena();
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
