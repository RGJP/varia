import { InputHandler } from './InputHandler.js';
import { Camera } from './Camera.js';
import { Player } from './entities/Player.js';
import { Boss } from './entities/Enemy.js';
import { loadLevel } from './environment/Level.js';
import { AudioEngine } from './AudioEngine.js';
import { ParticleSystem } from './ParticleSystem.js';
import { Background } from './Background.js';
import { Rock } from './entities/Rock.js';
import { Collectible } from './entities/Collectible.js';
import { clearEmojiCache } from './EmojiCache.js';
import { getEmojiCanvas } from './EmojiCache.js';
export function filterInPlace(array) {
    let writeIdx = 0;
    for (let i = 0; i < array.length; i++) {
        const item = array[i];
        if (!item) continue;
        const keepDuringDeathPop = item && item.markedForDeletion &&
            typeof item.deathPopTimer === 'number' && item.deathPopTimer > 0;
        if (!item.markedForDeletion || keepDuringDeathPop) {
            array[writeIdx++] = item;
        }
    }
    array.length = writeIdx;
    return array;
}

export const GameState = {
    START_MENU: 0,
    PLAYING: 1,
    GAME_OVER: 2,
    VICTORY: 3,
    PAUSED: 4
};

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });
        this.pixelRatio = 1;
        this.viewportWidth = Math.max(1, Math.floor(canvas.clientWidth || canvas.width || 1));
        this.viewportHeight = Math.max(1, Math.floor(canvas.clientHeight || canvas.height || 1));
        this.input = new InputHandler();
        this.camera = new Camera(this.viewportWidth, this.viewportHeight);

        // Wire up the camera zoom toggle button (mobile only)
        setTimeout(() => {
            const camBtn = document.getElementById('btn-camera');
            if (camBtn) {
                camBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const newLabel = this.camera.cycleZoom();
                    camBtn.textContent = newLabel;
                }, { passive: false });
            }
        }, 0);

        this.state = GameState.START_MENU;
        this.lastTime = 0;
        this.difficultyOptions = [
            { id: 'easy', label: '🌱 Easy', hearts: 18 },
            { id: 'normal', label: '⚖️ Normal', hearts: 6 },
            { id: 'heroic', label: '🧗 Hard', hearts: 3 }
        ];
        this.selectedDifficultyId = null;

        this.player = null;
        this.platforms = [];
        this.enemies = [];
        this.pendingBossSpawns = [];
        this.collectibles = [];
        this.pendingBossStarDrops = [];
        this.safeZones = [];
        this.rocks = [];
        this.lightningOrbs = [];
        this.enemyProjectiles = [];
        this.prisonerRescue = null;
        this.hasBossKey = false;
        this.victoryFlagEnabled = false;
        this.vines = [];
        this.swingingVines = [];
        this.movingPlatforms = [];

        this.audio = new AudioEngine();
        this.particles = new ParticleSystem();
        this.background = new Background(this.viewportWidth, this.viewportHeight);
        this.isMobileDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth < 900;
        this._lastFullscreenGestureAt = 0;
        this._installGlobalFullscreenGestureHooks();
        const pauseBtn = document.getElementById('btn-pause');
        if (pauseBtn) {
            // Request fullscreen directly from pause button gestures on mobile.
            // `click` may fire after state already flipped back to PLAYING.
            const requestFullscreenOnPauseBtnGesture = (e) => {
                if (!this.isMobileDevice) return;
                if (this.state !== GameState.PAUSED && this.state !== GameState.PLAYING) return;
                if (e && e.cancelable) e.preventDefault();
                this._requestFullscreenBestEffort();
            };
            pauseBtn.addEventListener('touchend', requestFullscreenOnPauseBtnGesture, { passive: false });
            pauseBtn.addEventListener('click', requestFullscreenOnPauseBtnGesture);
        }

        this._visiblePlatforms = [];
        this._visibleVines = [];
        this._visibleSwingingVines = [];
        this._victoryPlatforms = [];
        this._playerCollisionContext = {
            enemies: [],
            collectibles: [],
            safeZones: [],
            vines: [],
            swingingVines: [],
            victoryPlatforms: []
        };

        this.lowestY = 800;

        this.totalCoins = 0;
        this.coinsCollected = 0;
        this.totalEnemies = 0;
        this.totalCompletionEnemies = 0;
        this.completionEnemiesDefeated = 0;
        this.enemiesDefeated = 0;
        this.totalCompletionCoins = 0;
        this.lastVictoryEmojiBonus = 0;
        this.fpsDisplay = 60;
        this.layoutVariantLabel = 'V:N/A';
        this.performanceQuality = 1;
        this._performanceAdjustTimer = 0;
        this._qualityRecoveryHold = 0;
        this.targetFrameRate = 60;
        this._panicRecoveryWindow = 5;
        this._topFpsStreak = 0;
        this._particlePanicMode = false;
        if (this.particles && typeof this.particles.setMobileMode === 'function') {
            this.particles.setMobileMode(this.isMobileDevice);
        }
        if (this.particles && typeof this.particles.setQuality === 'function') {
            this.particles.setQuality(this.performanceQuality);
        }
        if (this.particles && typeof this.particles.setPanicMode === 'function') {
            this.particles.setPanicMode(false);
        }

        this.gameOverTriggered = false;
        this.gameOverTimer = 0;
        this._autoPausedByVisibility = false;
        this._bossMusicEngaged = false;
        this._lastCameraBtnLeft = null;
        this.startMenuTrackNumber = 21;

        // Pre-cache UI emojis
        this._heartCache = getEmojiCanvas('\u2764\uFE0F', 24);
        this._musicCache = getEmojiCanvas('\u25B6\uFE0F', 24);
        this._muteCache = getEmojiCanvas('\u{1F507}', 24);
        this._unmuteCache = getEmojiCanvas('\u{1F50A}', 24);
        this._bombUICache = getEmojiCanvas('\u{1F4A3}', 24);
        this._deathGearCache = getEmojiCanvas('\u{1F525}', 26);

        const startGameHandler = (e) => {
            if (this.state === GameState.START_MENU || ((this.state === GameState.GAME_OVER || this.state === GameState.VICTORY) && this.canRestart !== false)) {
                if (this.state === GameState.START_MENU && !this.selectedDifficultyId) {
                    if (e && e.preventDefault && e.cancelable) e.preventDefault();
                    return;
                }

                // IMPORTANT: Unlock audio FIRST, synchronously during the user gesture.
                // This must happen before fullscreen or anything else to satisfy
                // mobile browser autoplay policies.
                if (this.audio && typeof this.audio.unlock === 'function') {
                    this.audio.unlock();
                }

                // Request fullscreen (non-blocking, won't consume gesture on most browsers)
                this._requestFullscreenBestEffort();

                this.initLevel();
                this.state = GameState.PLAYING;
                this.input.update(); // Flush initial inputs to prevent immediate jumps

                // Prevent duplicate starts from firing
                if (e && e.preventDefault && e.cancelable) e.preventDefault();
            }
        };

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Enter') startGameHandler(e);
        });

        const handleMusicClick = (clientX, clientY) => {
            if (this.state !== GameState.PLAYING && this.state !== GameState.PAUSED) return false;
            const point = this._clientToViewportPoint(clientX, clientY);
            const x = point.x;
            const y = point.y;

            // Health is at y=36
            // Bombs is at y=72
            // Next Song button is now at y=108
            // Hitbox: y from 84 to 132, x from 10 to 96
            if (x >= 10 && x <= 96 && y >= 84 && y <= 132) {
                this.audio.playBackgroundMusic();
                return true;
            }
            // Mute button is now at y=144
            // Hitbox: y from 120 to 168, x from 10 to 62
            else if (x >= 10 && x <= 62 && y >= 120 && y <= 168) {
                this.audio.toggleMusicMute();
                return true;
            }
            return false;
        };

        const isOrientationWarningVisible = () => {
            const warning = document.getElementById('orientation-warning');
            if (!warning) return false;
            const styles = window.getComputedStyle(warning);
            return styles.display !== 'none' && styles.visibility !== 'hidden' && styles.opacity !== '0';
        };

        const handleInteraction = (e) => {
            if (isOrientationWarningVisible()) {
                if (e && e.cancelable) e.preventDefault();
                return;
            }
            if (this.state === GameState.START_MENU) {
                this._ensureStartMenuMusicFromGesture();
            }

            const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : 0));
            const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : 0));

            const hit = handleMusicClick(clientX, clientY);
            if (hit) {
                if (e.cancelable) e.preventDefault();
                return;
            }

            if (this.state === GameState.START_MENU) {
                const layout = this._getStartMenuLayout();
                if (layout) {
                    const point = this._clientToViewportPoint(clientX, clientY);
                    const canvasX = point.x;
                    const canvasY = point.y;
                    const x = (canvasX - layout.centerX) / layout.scale;
                    const y = (canvasY - layout.centerY) / layout.scale;
                    for (let i = 0; i < layout.buttons.length; i++) {
                        const btn = layout.buttons[i];
                        if (
                            x >= btn.x &&
                            x <= btn.x + btn.width &&
                            y >= btn.y &&
                            y <= btn.y + btn.height
                        ) {
                            this.selectedDifficultyId = btn.id;
                            if (e && e.cancelable) e.preventDefault();
                            return;
                        }
                    }
                }
            } else if (this.state === GameState.GAME_OVER) {
                const scale = this._getMenuOverlayScale(GameState.GAME_OVER);
                const center = this._getGameOverOverlayCenter(scale);
                const point = this._clientToViewportPoint(clientX, clientY);
                const canvasX = point.x;
                const canvasY = point.y;
                const x = (canvasX - center.x) / scale;
                const y = (canvasY - center.y) / scale;
                const keepBtn = this._getGameOverKeepPlayingButton();
                if (
                    x >= keepBtn.x &&
                    x <= keepBtn.x + keepBtn.width &&
                    y >= keepBtn.y &&
                    y <= keepBtn.y + keepBtn.height
                ) {
                    startGameHandler(e);
                    return;
                }

                const changeBtn = this._getGameOverChangeDifficultyButton();
                if (
                    x >= changeBtn.x &&
                    x <= changeBtn.x + changeBtn.width &&
                    y >= changeBtn.y &&
                    y <= changeBtn.y + changeBtn.height
                ) {
                    this.selectedDifficultyId = null;
                    this.state = GameState.START_MENU;
                    this._ensureStartMenuMusicFromGesture();
                    if (e && e.cancelable) e.preventDefault();
                    return;
                }
                if (e && e.cancelable) e.preventDefault();
                return;
            }
            startGameHandler(e);
        };

        window.addEventListener('touchend', handleInteraction, { passive: false });
        window.addEventListener('click', (e) => {
            // Only handle if it's NOT a touch event (to avoid double triggering on mobile)
            if (e.pointerType === 'touch') return; // For pointer events
            if (e.detail === 0) return; // detail=0 can sometimes mean non-mouse
            if (window.TouchEvent && e instanceof TouchEvent) return;
            handleInteraction(e);
        });

        window.addEventListener('blur', () => {
            if (this.state === GameState.PLAYING) {
                this.state = GameState.PAUSED;
                this._autoPausedByVisibility = true;
                if (this.audio && this.audio.pauseBackgroundMusic) {
                    this.audio.pauseBackgroundMusic();
                }
                if (this.audio && this.audio.pauseLightningBuzz) {
                    this.audio.pauseLightningBuzz();
                }
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (this.state === GameState.PLAYING) {
                    this.state = GameState.PAUSED;
                    this._autoPausedByVisibility = true;
                    if (this.audio && this.audio.pauseBackgroundMusic) {
                        this.audio.pauseBackgroundMusic();
                    }
                    if (this.audio && this.audio.pauseLightningBuzz) {
                        this.audio.pauseLightningBuzz();
                    }
                }
            } else if (this._autoPausedByVisibility && this.state === GameState.PAUSED) {
                // Do not auto-resume after app/tab return; require explicit user unpause.
                this._autoPausedByVisibility = false;
                this.lastTime = 0;
            }
        });
    }

    _installGlobalFullscreenGestureHooks() {
        const onUserGesture = () => {
            if (!this.isMobileDevice) return;
            if (this.state !== GameState.PLAYING && this.state !== GameState.PAUSED) return;
            this._requestFullscreenBestEffort();
        };

        window.addEventListener('touchend', onUserGesture, { passive: true, capture: true });
        window.addEventListener('pointerup', onUserGesture, { passive: true, capture: true });
        window.addEventListener('click', onUserGesture, { capture: true });
    }

    _requestFullscreenBestEffort() {
        try {
            const now = performance.now();
            if (now - this._lastFullscreenGestureAt < 250) return;

            // Avoid calling fullscreen API when browser doesn't report active user gesture.
            const userActivation = navigator.userActivation;
            if (userActivation && !userActivation.isActive) return;

            if (document.fullscreenElement || document.webkitFullscreenElement) return;
            this._lastFullscreenGestureAt = now;
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen().catch(() => { });
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }
        } catch (err) {
            // Continue even if fullscreen is unsupported or denied.
        }
    }

    _ensureStartMenuMusicFromGesture() {
        if (!this.audio || this.state !== GameState.START_MENU) return;
        const warning = document.getElementById('orientation-warning');
        if (warning) {
            const styles = window.getComputedStyle(warning);
            const warningVisible = styles.display !== 'none' && styles.visibility !== 'hidden' && styles.opacity !== '0';
            if (warningVisible) return;
        }
        if (typeof this.audio.unlock === 'function') {
            this.audio.unlock();
        }

        const hasLiveTrack = !!(this.audio.currentMusicAudio && !this.audio.currentMusicAudio.paused);
        if (hasLiveTrack && this.audio.lastSongNumber === this.startMenuTrackNumber) return;

        if (typeof this.audio.playBackgroundMusicTrack === 'function') {
            this.audio.playBackgroundMusicTrack(this.startMenuTrackNumber);
        }
    }

    initLevel() {
        clearEmojiCache();
        this._bossMusicEngaged = false;
        this._topFpsStreak = 0;
        this._particlePanicMode = false;
        this.performanceQuality = 1;
        this._qualityRecoveryHold = 0;
        this._performanceAdjustTimer = 0;
        if (this.particles && typeof this.particles.setPanicMode === 'function') {
            this.particles.setPanicMode(false);
        }
        if (this.particles && typeof this.particles.setQuality === 'function') {
            this.particles.setQuality(this.performanceQuality);
        }
        if (this.audio && typeof this.audio.stopLightningBuzz === 'function') this.audio.stopLightningBuzz();
        const levelData = loadLevel();
        this.platforms = levelData.platforms;
        this.enemies = levelData.enemies;
        this.pendingBossSpawns = levelData.bossSpawns || [];
        this.collectibles = levelData.collectibles;
        this.pendingBossStarDrops = [];
        this.prisonerRescue = null;
        this.hasBossKey = false;
        this.victoryFlagEnabled = false;
        this.safeZones = levelData.safeZones || [];
        this.vines = levelData.vines || [];
        this.swingingVines = levelData.swingingVines || [];
        this.movingPlatforms = levelData.movingPlatforms || [];
        this.currentTheme = levelData.theme;
        this.layoutVariantLabel = levelData.layoutVariantLabel || 'V:N/A';
        this.rocks = [];
        this.lightningOrbs = [];
        this.enemyProjectiles = [];
        this._initPrisonerRescue(levelData.prisonerRescue);

        this.totalCoins = this.collectibles.length;
        this._victoryPlatforms = [];
        for (let i = 0; i < this.platforms.length; i++) {
            const platform = this.platforms[i];
            if (platform && platform.isVictory) {
                platform.flagActive = false;
                this._victoryPlatforms.push(platform);
            }
        }
        this.coinsCollected = 0;
        this.totalEnemies = this.enemies.length + this.pendingBossSpawns.length;
        this.totalCompletionEnemies = 0;
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            if (enemy && !enemy.bossType && enemy.countsForCompletionObjective !== false) {
                this.totalCompletionEnemies++;
            }
        }
        this.completionEnemiesDefeated = 0;
        this.enemiesDefeated = 0;
        this.totalCompletionCoins = 0;
        for (let i = 0; i < this.collectibles.length; i++) {
            const collectible = this.collectibles[i];
            if (collectible && collectible.type === 'coin') this.totalCompletionCoins++;
        }

        this.gameOverTriggered = false;
        this.gameOverTimer = 0;

        this.background.setTheme(this.currentTheme);

        this.lowestY = Math.max(...this.platforms.map(p => p.y + p.height)) + 200;

        this.player = new Player(100, 300);
        const selectedDifficulty = this.difficultyOptions.find(d => d.id === this.selectedDifficultyId);
        if (selectedDifficulty) {
            this.player.maxHealth = selectedDifficulty.hearts;
            this.player.health = selectedDifficulty.hearts;
        }
        this.camera.x = 0;
        this.audio.playBackgroundMusic();

        // Re-cache UI emojis
        this._heartCache = getEmojiCanvas('\u2764\uFE0F', 24);
        this._musicCache = getEmojiCanvas('\u25B6\uFE0F', 24);
        this._muteCache = getEmojiCanvas('\u{1F507}', 24);
        this._unmuteCache = getEmojiCanvas('\u{1F50A}', 24);
        this._bombUICache = getEmojiCanvas('\u{1F4A3}', 24);
    }

    _initPrisonerRescue(rescueData) {
        if (!rescueData) {
            this.prisonerRescue = null;
            this.victoryFlagEnabled = true;
            for (let i = 0; i < this._victoryPlatforms.length; i++) {
                this._victoryPlatforms[i].flagActive = true;
            }
            return;
        }
        const prisonerEmojis = ['🐇', '🧝‍♀️', '🧚‍♀️', '🧸', '🐈', '🐈', '🐈', '🐅', '🐩', '🐕', '🐀', '🐆', '🦌', '🐄', '🦜', '💩'];
        const emoji = prisonerEmojis[Math.floor(Math.random() * prisonerEmojis.length)];
        const cageSize = 94;
        const prisonerSize = 62;
        const centerX = rescueData.platformX + rescueData.platformWidth * 0.5;
        const floorY = rescueData.platformY - 6;
        const prisonerX = centerX - prisonerSize / 2;
        const prisonerY = floorY - prisonerSize;
        this.prisonerRescue = {
            emoji,
            emojiCache: getEmojiCanvas(emoji, prisonerSize),
            keyEmojiCache: getEmojiCanvas('\u{1F511}', 30),
            state: 'LOCKED',
            x: prisonerX,
            y: prisonerY,
            width: prisonerSize,
            height: prisonerSize,
            alpha: 1,
            floorY,
            platformRef: {
                x: rescueData.platformX,
                y: rescueData.platformY,
                width: rescueData.platformWidth,
                height: rescueData.platformHeight
            },
            cage: {
                width: cageSize,
                height: cageSize,
                alpha: 1
            },
            helpPulse: 0,
            screamTimer: 5,
            screamPulse: 0,
            rescueLabelTimer: 0,
            danceTimer: 0,
            escapeTargets: null,
            escapeTarget: null,
            vx: 0,
            vy: 0,
            onGround: true,
            keyAnim: null,
            unlockSfxPlayed: false,
            jumpCooldown: 0.08,
            despawnAlpha: 1
        };
    }

    _isAabbOverlap(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    tryRescuePrisoner(player) {
        const rescue = this.prisonerRescue;
        if (!rescue || rescue.state !== 'LOCKED' || !player) return false;
        const bossCleared = this.pendingBossSpawns.length === 0 && !this.hasAliveBoss();
        if (!bossCleared || !this.hasBossKey) return false;
        const cageRect = this._getPrisonerCageRect(rescue);
        const unlockRangePadding = 24;
        const unlockRect = {
            x: cageRect.x - unlockRangePadding,
            y: cageRect.y - unlockRangePadding,
            width: cageRect.width + unlockRangePadding * 2,
            height: cageRect.height + unlockRangePadding * 2
        };
        if (!this._isAabbOverlap(player, unlockRect)) return false;
        const lockTarget = {
            x: cageRect.x + cageRect.width * 0.5,
            y: cageRect.y + cageRect.height * 0.6 + 6
        };
        const playerCenter = {
            x: player.x + player.width * 0.5,
            y: player.y + player.height * 0.5
        };
        rescue.keyAnim = {
            fromX: playerCenter.x,
            fromY: playerCenter.y,
            toX: lockTarget.x,
            toY: lockTarget.y,
            t: 0,
            duration: 0.34
        };
        rescue.state = 'KEY_TRAVEL';
        rescue.unlockSfxPlayed = false;
        this.hasBossKey = false;
        rescue.rescueLabelTimer = 5.2;
        this.victoryFlagEnabled = true;
        for (let i = 0; i < this._victoryPlatforms.length; i++) {
            this._victoryPlatforms[i].flagActive = true;
        }
        return true;
    }

    _getPrisonerCageRect(rescue) {
        return {
            x: rescue.x + rescue.width / 2 - rescue.cage.width / 2,
            y: rescue.y + rescue.height - rescue.cage.height,
            width: rescue.cage.width,
            height: rescue.cage.height
        };
    }

    _buildPrisonerEscapeTargets(rescue) {
        if (!rescue) return [];
        const startX = rescue.x + rescue.width / 2;
        const candidates = [];
        for (let i = 0; i < this.platforms.length; i++) {
            const p = this.platforms[i];
            if (!p || p.width < 120) continue;
            const cx = p.x + p.width / 2;
            if (cx >= startX - 12) continue;
            candidates.push({
                x: cx,
                y: p.y - rescue.height
            });
        }
        candidates.sort((a, b) => b.x - a.x);
        const hops = [];
        let prevX = startX;
        let prevY = rescue.y;
        for (let i = 0; i < candidates.length; i++) {
            const c = candidates[i];
            const dx = prevX - c.x;
            if (dx < 150 || dx > 680) continue;
            if (Math.abs(c.y - prevY) > 260) continue;
            hops.push(c);
            prevX = c.x;
            prevY = c.y;
            if (hops.length >= 7) break;
        }
        if (hops.length === 0 || (startX - hops[hops.length - 1].x) < 680) {
            hops.push({ x: startX - 900, y: rescue.floorY - rescue.height });
        }
        return hops;
    }

    _startPrisonerEscapeJump(rescue, target) {
        if (!rescue || !target) return;
        const gravity = 1450;
        const fromX = rescue.x;
        const fromY = rescue.y;
        const toX = target.x - rescue.width / 2;
        const toY = target.y;
        const dx = toX - fromX;
        const distance = Math.max(1, Math.abs(dx));
        const jumpTime = Math.max(0.38, Math.min(0.7, distance / 360));
        rescue.vx = dx / jumpTime;
        rescue.vy = (toY - fromY - 0.5 * gravity * jumpTime * jumpTime) / jumpTime;
        rescue.escapeTarget = { x: toX, y: toY, gravity };
        rescue.onGround = false;
    }

    _updatePrisonerRescue(dt) {
        const rescue = this.prisonerRescue;
        if (!rescue) return;
        rescue.helpPulse += dt * 5;
        const isBossFightActive = this.hasAliveBoss() || this.pendingBossSpawns.length > 0;
        if (rescue.state === 'LOCKED') {
            if (isBossFightActive) {
                rescue.screamTimer -= dt;
                if (rescue.screamTimer <= 0) {
                    rescue.screamTimer = 5;
                    rescue.screamPulse = 0.9;
                }
            } else {
                rescue.screamTimer = 5;
            }
            rescue.screamPulse = Math.max(0, rescue.screamPulse - dt * 1.8);
            return;
        }

        if (rescue.state === 'KEY_TRAVEL') {
            if (!rescue.keyAnim) {
                rescue.state = 'UNLOCKING';
                return;
            }
            rescue.keyAnim.t += dt / Math.max(0.01, rescue.keyAnim.duration);
            if (rescue.keyAnim.t >= 1) {
                rescue.keyAnim = null;
                rescue.state = 'UNLOCKING';
            }
            return;
        }

        if (rescue.state === 'UNLOCKING') {
            if (!rescue.unlockSfxPlayed) {
                rescue.unlockSfxPlayed = true;
                if (this.audio && typeof this.audio.playPadlockUnlock === 'function') {
                    this.audio.playPadlockUnlock();
                }
            }
            rescue.cage.alpha = Math.max(0, rescue.cage.alpha - dt * 2.5);
            rescue.danceTimer += dt;
            if (rescue.cage.alpha <= 0) {
                rescue.state = 'FREED_CELEBRATE';
                rescue.danceTimer = 0;
            }
            return;
        }

        if (rescue.state === 'FREED_CELEBRATE') {
            rescue.danceTimer += dt;
            rescue.rescueLabelTimer -= dt;
            const jumpsFinished = rescue.danceTimer >= 3.85;
            if (jumpsFinished || rescue.rescueLabelTimer <= 0) {
                rescue.state = 'ESCAPING';
                rescue.escapeTargets = this._buildPrisonerEscapeTargets(rescue);
                rescue.escapeTarget = null;
                rescue.vx = 0;
                rescue.vy = 0;
                rescue.jumpCooldown = 0.06;
            }
            return;
        }

        if (rescue.state === 'ESCAPING') {
            rescue.jumpCooldown = Math.max(0, rescue.jumpCooldown - dt);
            if (rescue.onGround && !rescue.escapeTarget && rescue.jumpCooldown <= 0) {
                if (Array.isArray(rescue.escapeTargets) && rescue.escapeTargets.length > 0) {
                    const target = rescue.escapeTargets.shift();
                    this._startPrisonerEscapeJump(rescue, target);
                } else {
                    rescue.escapeTarget = { x: this.camera.x - 320, y: rescue.y, gravity: 1450 };
                    rescue.vx = -460;
                    rescue.vy = -240;
                    rescue.onGround = false;
                }
            }

            if (!rescue.onGround) {
                const gravity = (rescue.escapeTarget && rescue.escapeTarget.gravity) ? rescue.escapeTarget.gravity : 1450;
                rescue.vy += gravity * dt;
                rescue.x += rescue.vx * dt;
                rescue.y += rescue.vy * dt;

                if (rescue.escapeTarget) {
                    const tx = rescue.escapeTarget.x;
                    const reachedX = rescue.vx <= 0 ? (rescue.x <= tx) : (rescue.x >= tx);
                    if (reachedX && rescue.vy >= 0) {
                        rescue.x = tx;
                        rescue.y = rescue.escapeTarget.y;
                        rescue.vx = 0;
                        rescue.vy = 0;
                        rescue.onGround = true;
                        rescue.escapeTarget = null;
                        rescue.jumpCooldown = 0.08;
                    }
                }
            }

            if (rescue.x + rescue.width < this.camera.x - 240) {
                rescue.state = 'DESPAWNING';
            }
            return;
        }

        if (rescue.state === 'DESPAWNING') {
            rescue.despawnAlpha = Math.max(0, rescue.despawnAlpha - dt * 1.7);
            rescue.x -= 170 * dt;
            if (rescue.despawnAlpha <= 0 || rescue.x + rescue.width < this.camera.x - 320) {
                rescue.state = 'DONE';
            }
        }
    }

    _drawPrisonerCage(ctx, rescue) {
        const cageRect = this._getPrisonerCageRect(rescue);
        const alpha = Math.max(0, Math.min(1, rescue.cage.alpha));
        if (alpha <= 0) return;
        ctx.save();
        ctx.globalAlpha *= alpha;

        const r = 10;
        const x = cageRect.x;
        const y = cageRect.y;
        const w = cageRect.width;
        const h = cageRect.height;
        const topArcH = Math.max(16, h * 0.18);

        // See-through classic cage look: dark iron bars with minimal fill.
        ctx.strokeStyle = 'rgba(22, 22, 24, 0.95)';
        ctx.fillStyle = 'rgba(22, 22, 24, 0.08)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y + topArcH, w, h - topArcH, r);
        } else {
            ctx.rect(x, y + topArcH, w, h - topArcH);
        }
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = 'rgba(10, 10, 11, 0.98)';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(x + 8, y + topArcH);
        ctx.quadraticCurveTo(x + w / 2, y - topArcH * 0.72, x + w - 8, y + topArcH);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + 14, y + h - 2);
        ctx.lineTo(x + w - 14, y + h - 2);
        ctx.stroke();

        const bars = 8;
        ctx.strokeStyle = 'rgba(18, 18, 20, 0.96)';
        ctx.lineWidth = 3;
        for (let i = 0; i < bars; i++) {
            const bx = x + 10 + (i * (w - 20) / (bars - 1));
            ctx.beginPath();
            ctx.moveTo(bx, y + topArcH + 2);
            ctx.lineTo(bx, y + h - 4);
            ctx.stroke();
        }

        const lockW = 16;
        const lockH = 13;
        const lockX = x + w / 2 - lockW / 2;
        const lockY = y + h * 0.6;
        ctx.fillStyle = 'rgba(35, 35, 38, 0.98)';
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(lockX, lockY, lockW, lockH, 3);
            ctx.fill();
        } else {
            ctx.fillRect(lockX, lockY, lockW, lockH);
        }
        ctx.strokeStyle = 'rgba(6, 6, 7, 1)';
        ctx.lineWidth = 1.6;
        ctx.strokeRect(lockX, lockY, lockW, lockH);
        ctx.beginPath();
        ctx.arc(lockX + lockW / 2, lockY, 4.2, Math.PI, 0);
        ctx.stroke();

        ctx.restore();
    }

    _drawPrisonerRescue(ctx) {
        const rescue = this.prisonerRescue;
        if (!rescue || rescue.state === 'DONE') return;

        const inView = this._isVisible({
            x: rescue.x - 90,
            y: rescue.y - 140,
            width: rescue.width + 180,
            height: rescue.height + 220
        }, 120);
        if (!inView) return;

        ctx.save();
        const alpha = rescue.state === 'DESPAWNING' ? rescue.despawnAlpha : 1;
        ctx.globalAlpha *= Math.max(0, Math.min(1, alpha));

        const celebrateActive = rescue.state === 'FREED_CELEBRATE';
        const celebrateT = celebrateActive ? Math.max(0, rescue.danceTimer) : 0;
        const wigglePhase = celebrateActive && celebrateT < 0.9;
        const jumpPhase = celebrateActive && celebrateT >= 0.9 && celebrateT < 1.85;
        const crankPhase = celebrateActive && celebrateT >= 1.85 && celebrateT < 3.85;
        const danceOffset = (rescue.state === 'UNLOCKING')
            ? (Math.sin(rescue.danceTimer * 7) * 2.2 - Math.abs(Math.sin(rescue.danceTimer * 8.5)) * 4.5)
            : (jumpPhase
                ? (-Math.abs(Math.sin((celebrateT - 0.9) * 18.5)) * 15.5)
                : (crankPhase
                    ? (-Math.abs(Math.sin((celebrateT - 1.85) * 20.0)) * 5.4)
                    : (celebrateActive ? Math.sin(celebrateT * 8.5) * 1.8 : 0)));
        const screamShake = (rescue.state === 'LOCKED' && rescue.screamPulse > 0)
            ? Math.sin(rescue.helpPulse * 35) * (2.4 * rescue.screamPulse)
            : 0;
        const px = rescue.x + screamShake;
        const py = rescue.y + danceOffset;

        if (rescue.emojiCache) {
            if (celebrateActive) {
                // Ordered celebration: wiggle/tilt -> a few hops -> jog/crank wind-up.
                const centerX = px + rescue.width / 2 + (
                    jumpPhase
                        ? Math.sin(celebrateT * 6.2) * 2.2
                        : (crankPhase ? Math.sin((celebrateT - 1.85) * 22.0) * 6.8 : Math.sin(celebrateT * 6.2) * 4.8)
                );
                const centerY = py + rescue.height / 2;
                const wiggleRotation = wigglePhase
                    ? Math.sin(celebrateT * 12.6) * 0.34
                    : (crankPhase ? Math.sin((celebrateT - 1.85) * 18.0) * 0.2 : Math.sin(celebrateT * 9.5) * 0.12);
                const flipScaleX = wigglePhase
                    ? (Math.cos(celebrateT * 6.6) >= 0 ? 1 : -1)
                    : 1;
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.rotate(wiggleRotation);
                ctx.scale(flipScaleX, 1);
                ctx.drawImage(rescue.emojiCache.canvas, -rescue.emojiCache.width / 2, -rescue.emojiCache.height / 2);
                ctx.restore();
            } else {
                ctx.drawImage(rescue.emojiCache.canvas, px - (rescue.emojiCache.width - rescue.width) / 2, py - (rescue.emojiCache.height - rescue.height) / 2);
            }
        }

        if (rescue.state === 'LOCKED' || rescue.state === 'KEY_TRAVEL' || rescue.state === 'UNLOCKING') {
            this._drawPrisonerCage(ctx, rescue);
        }

        if (rescue.state === 'KEY_TRAVEL' && rescue.keyAnim && rescue.keyEmojiCache) {
            const k = rescue.keyAnim;
            const t = Math.max(0, Math.min(1, k.t));
            const eased = 1 - Math.pow(1 - t, 3);
            const arc = Math.sin(t * Math.PI) * 28;
            const kx = k.fromX + (k.toX - k.fromX) * eased;
            const ky = k.fromY + (k.toY - k.fromY) * eased - arc;
            const keyW = rescue.keyEmojiCache.width;
            const keyH = rescue.keyEmojiCache.height;

            ctx.save();
            ctx.translate(kx, ky);
            ctx.rotate((1 - t) * 0.45 - 0.25);
            ctx.drawImage(rescue.keyEmojiCache.canvas, -keyW / 2, -keyH / 2);
            ctx.restore();
        }

        if (rescue.state === 'LOCKED') {
            const pulse = 1 + Math.sin(rescue.helpPulse) * 0.08 + rescue.screamPulse * 0.26;
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `bold ${Math.round(26 * pulse)}px "Outfit", sans-serif`;
            ctx.fillStyle = rescue.screamPulse > 0 ? '#ff8a80' : '#fff2f2';
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.82)';
            ctx.lineWidth = 5;
            const tx = rescue.x + rescue.width / 2 + screamShake * 1.5;
            const ty = rescue.y - 44 - rescue.screamPulse * 8;
            ctx.strokeText('Help Me! 😢', tx, ty);
            ctx.fillText('Help Me! 😢', tx, ty);
            ctx.restore();
        } else if (rescue.state === 'FREED_CELEBRATE') {
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 28px "Outfit", sans-serif';
            ctx.fillStyle = '#e8ff7a';
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.82)';
            ctx.lineWidth = 5;
            const tx = rescue.x + rescue.width / 2;
            const ty = rescue.y - 44;
            ctx.strokeText('Yay, I’m free! 🥰', tx, ty);
            ctx.fillText('Yay, I’m free! 🥰', tx, ty);
            ctx.restore();
        }

        ctx.restore();
    }

    start() {
        requestAnimationFrame((time) => this.loop(time));
    }

    resize(width, height, pixelRatio = 1) {
        const safeWidth = Math.max(1, Math.floor(width || 1));
        const safeHeight = Math.max(1, Math.floor(height || 1));
        const safePixelRatio = Math.max(1, Number.isFinite(pixelRatio) ? pixelRatio : 1);
        this.viewportWidth = safeWidth;
        this.viewportHeight = safeHeight;
        this.pixelRatio = safePixelRatio;
        if (this.camera) this.camera.resize(safeWidth, safeHeight);
        if (this.background) this.background.resize(safeWidth, safeHeight);
    }

    _clientToViewportPoint(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const normalizedX = rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
        const normalizedY = rect.height > 0 ? (clientY - rect.top) / rect.height : 0;
        return {
            x: normalizedX * this.viewportWidth,
            y: normalizedY * this.viewportHeight
        };
    }

    loop(time) {
        let dt = (time - this.lastTime) / 1000;
        const hadPreviousFrame = this.lastTime > 0;
        this.lastTime = time;
        if (dt > 0.1) dt = 0.1;
        if (hadPreviousFrame && dt > 0) {
            const instantFps = 1 / dt;
            this.fpsDisplay = this.fpsDisplay * 0.9 + instantFps * 0.1;
            const lowThreshold = this.targetFrameRate * 0.88;
            const recoverThreshold = this.targetFrameRate * 0.92;

            // Keep background rendering untouched; only clamp particle/VFX density.
            const frameDropped = instantFps < lowThreshold;
            if (frameDropped) {
                this._particlePanicMode = true;
                this._topFpsStreak = 0;
            } else if (this._particlePanicMode && instantFps >= recoverThreshold) {
                this._topFpsStreak += dt;
                if (this._topFpsStreak >= 0.35) {
                    this._particlePanicMode = false;
                    this._topFpsStreak = 0;
                    this.performanceQuality = 1;
                    this._qualityRecoveryHold = 0;
                }
            } else if (this._particlePanicMode) {
                this._topFpsStreak = 0;
            }
            if (this.particles && typeof this.particles.setPanicMode === 'function') {
                this.particles.setPanicMode(this._particlePanicMode);
            }

            this._performanceAdjustTimer += dt;
            if (this._performanceAdjustTimer >= 0.12) {
                const elapsed = this._performanceAdjustTimer;
                if (this.fpsDisplay < lowThreshold) {
                    const floor = this.isMobileDevice ? 0.12 : 0.15;
                    const dropStep = this.isMobileDevice ? 0.2 : 0.16;
                    this.performanceQuality = Math.max(floor, this.performanceQuality - dropStep);
                    if (this.fpsDisplay < this.targetFrameRate * 0.9) {
                        this.performanceQuality = Math.max(floor, this.performanceQuality - 0.12);
                    }
                    this._qualityRecoveryHold = Math.max(
                        this._qualityRecoveryHold,
                        this.isMobileDevice ? 12 : 8
                    );
                } else {
                    if (!this._particlePanicMode) {
                        this._qualityRecoveryHold = Math.max(0, this._qualityRecoveryHold - elapsed);
                        if (this._qualityRecoveryHold <= 0 && this.fpsDisplay > recoverThreshold) {
                            this.performanceQuality = Math.min(1, this.performanceQuality + (this.isMobileDevice ? 0.004 : 0.006));
                        }
                    }
                }

                if (this.particles && typeof this.particles.setQuality === 'function') {
                    this.particles.setQuality(this.performanceQuality);
                }
                this._performanceAdjustTimer = 0;
            }
        }

        this.update(dt);
        this.draw();

        this.input.update();

        requestAnimationFrame((time) => this.loop(time));
    }

    update(dt) {
        const mobileUI = document.getElementById('mobile-ui');
        if (mobileUI) {
            if (this.state === GameState.PLAYING || this.state === GameState.PAUSED) {
                mobileUI.classList.add('active');
            } else {
                mobileUI.classList.remove('active');
            }
        }

        if (this.input.isJustPressed('KeyP')) {
            if (this.state === GameState.PLAYING) {
                this.state = GameState.PAUSED;
                this.audio.pauseBackgroundMusic && this.audio.pauseBackgroundMusic();
                this.audio.pauseLightningBuzz && this.audio.pauseLightningBuzz();
            } else if (this.state === GameState.PAUSED) {
                this.state = GameState.PLAYING;
                this.audio.resumeBackgroundMusic && this.audio.resumeBackgroundMusic();
                this.audio.resumeLightningBuzz && this.audio.resumeLightningBuzz();
            }
        }

        if (this.state === GameState.PAUSED) {
            return;
        }

        // Update visible collections for culling
        this._visiblePlatforms.length = 0;
        for (let i = 0; i < this.platforms.length; i++) {
            if (this._isVisible(this.platforms[i], 800)) {
                this._visiblePlatforms.push(this.platforms[i]);
            }
        }
        this._visibleVines.length = 0;
        for (let i = 0; i < this.vines.length; i++) {
            if (this._isVisible(this.vines[i], 800)) {
                this._visibleVines.push(this.vines[i]);
            }
        }
        this._visibleSwingingVines.length = 0;
        for (let i = 0; i < this.swingingVines.length; i++) {
            if (this._isVisible(this.swingingVines[i], 800)) {
                this._visibleSwingingVines.push(this.swingingVines[i]);
            }
        }

        const safeZones = this.safeZones;
        for (let i = 0; i < safeZones.length; i++) {
            safeZones[i].update(dt);
        }

        // Update moving platforms and include in visible platforms for collision
        for (let i = 0; i < this.movingPlatforms.length; i++) {
            const mp = this.movingPlatforms[i];
            mp.update(dt);
            if (this._isVisible(mp, 800)) {
                this._visiblePlatforms.push(mp);
            }
        }

        if (this.state === GameState.PLAYING) {
            if (this.player.health <= 0 || (this.player.y + this.player.height) > this.lowestY) {
                if (!this.gameOverTriggered) {
                    this.gameOverTriggered = true;
                    this.gameOverTimer = 2.0;
                    if (this.audio && typeof this.audio.stopLightningBuzz === 'function') this.audio.stopLightningBuzz();
                    if (this.audio && typeof this.audio.playDeathTune === 'function') {
                        this.audio.playDeathTune();
                    }
                    this.audio.fadeOutMusic(1000);
                }
            }

            if (this.gameOverTriggered) {
                this.gameOverTimer -= dt;
                if (this.gameOverTimer <= 0) {
                    this.state = GameState.GAME_OVER;
                    this.canRestart = false;
                    setTimeout(() => { this.canRestart = true; }, 1000);
                }
                return; // Stop update of everything else
            }

            this._spawnNearbyBosses();
            const collisionContext = this._buildPlayerCollisionContext();
            this.player.update(dt, this.input, this._visiblePlatforms, this, collisionContext);

            // Update swinging vines
            const svines = this._visibleSwingingVines;
            for (let i = 0; i < svines.length; i++) {
                svines[i].update(dt);
            }

            const enemies = this.enemies;
            const updateMargin = 1000;
            const updateLeft = this.camera.x - updateMargin;
            const updateRight = this.camera.x + this.camera.effectiveWidth + updateMargin;
            const updateTop = this.camera.y - updateMargin;
            const updateBottom = this.camera.y + this.camera.effectiveHeight + updateMargin;
            for (let i = 0; i < enemies.length; i++) {
                const enemy = enemies[i];
                if (
                    enemy.x + enemy.width > updateLeft &&
                    enemy.x < updateRight &&
                    enemy.y + enemy.height > updateTop &&
                    enemy.y < updateBottom
                ) {
                    enemies[i].update(dt, this);
                }
            }

            // Fairness: when dropping to 1 HP during an active boss fight, spawn up to 2 hearts per boss.
            const activeBoss = this.enemies.find(e => e instanceof Boss && !e.markedForDeletion && e.activated);
            if (activeBoss && this.player) {
                if (typeof activeBoss._pityHeartSpawns !== 'number') activeBoss._pityHeartSpawns = 0;
                if (typeof activeBoss._pityHeartLastHealth !== 'number') activeBoss._pityHeartLastHealth = this.player.health;

                const droppedToOneHeart = this.player.health <= 1 && activeBoss._pityHeartLastHealth > 1;
                if (droppedToOneHeart && activeBoss._pityHeartSpawns < 2) {
                    this._spawnBossPityHeart(activeBoss);
                    activeBoss._pityHeartSpawns += 1;
                }

                activeBoss._pityHeartLastHealth = this.player.health;
            }

            const collectibles = this.collectibles;
            this._updatePendingBossStarDrops(dt);
            this._updatePrisonerRescue(dt);
            for (let i = 0; i < collectibles.length; i++) {
                const collectible = collectibles[i];
                if (
                    collectible.x + collectible.width > updateLeft &&
                    collectible.x < updateRight &&
                    collectible.y + collectible.height > updateTop &&
                    collectible.y < updateBottom
                ) {
                    collectibles[i].update(dt);
                }
            }

            const rocks = this.rocks;
            for (let i = 0; i < rocks.length; i++) {
                rocks[i].update(dt, this);
            }

            const lightningOrbs = this.lightningOrbs;
            for (let i = 0; i < lightningOrbs.length; i++) {
                lightningOrbs[i].update(dt, this);
            }

            const enemyProjectiles = this.enemyProjectiles;
            for (let i = 0; i < enemyProjectiles.length; i++) {
                enemyProjectiles[i].update(dt, this);
            }

            this.enemies = filterInPlace(this.enemies);
            this.collectibles = filterInPlace(this.collectibles);
            this.rocks = filterInPlace(this.rocks);
            this.lightningOrbs = filterInPlace(this.lightningOrbs);
            this.enemyProjectiles = filterInPlace(this.enemyProjectiles);
            if (this._bossMusicEngaged && !this.hasAliveBoss()) {
                this._bossMusicEngaged = false;
                if (this.audio && typeof this.audio.exitBossMusicToPrevious === 'function') {
                    this.audio.exitBossMusicToPrevious({ fadeOutMs: 220, fadeInMs: 260 });
                }
            }

            this.camera.update(this.player, dt);
            this.particles.update(dt);
        }
    }

    triggerVictory() {
        if (!this.canTriggerVictory()) return;
        if (this.audio && typeof this.audio.stopLightningBuzz === 'function') this.audio.stopLightningBuzz();
        this.lastVictoryEmojiBonus = 0;
        if (this.player && this.player.collectedLetters) {
            const hasAllEmojiLetters = ['E', 'M', 'O', 'J', 'I'].every(letter => this.player.collectedLetters[letter]);
            if (hasAllEmojiLetters) {
                this.lastVictoryEmojiBonus = 3000;
                this.player.score += this.lastVictoryEmojiBonus;
            }
        }
        this.state = GameState.VICTORY;
        this.canRestart = false;
        setTimeout(() => { this.canRestart = true; }, 1000);
        if (this.audio && typeof this.audio.playVictoryJingle === 'function') {
            this.audio.playVictoryJingle();
        }
        this.audio.fadeOutMusic(1000);
    }

    hasAliveBoss() {
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            if (enemy instanceof Boss && !enemy.markedForDeletion) return true;
        }
        return false;
    }

    canTriggerVictory() {
        return this.victoryFlagEnabled && this.pendingBossSpawns.length === 0 && !this.hasAliveBoss();
    }

    _spawnNearbyBosses() {
        if (!this.player || this.pendingBossSpawns.length === 0) return;
        const SPAWN_DISTANCE_X = 450;
        let writeIdx = 0;
        let spawnedBoss = false;
        for (let i = 0; i < this.pendingBossSpawns.length; i++) {
            const spawn = this.pendingBossSpawns[i];
            const shouldSpawn = Math.abs(this.player.x - spawn.x) <= SPAWN_DISTANCE_X;
            if (shouldSpawn) {
                this.player.clearActivePowerUps();
                this.player.bombs = 0;
                if (Array.isArray(this.lightningOrbs) && this.lightningOrbs.length > 0) {
                    this.lightningOrbs.length = 0;
                }
                if (this.audio && typeof this.audio.stopLightningBuzz === 'function') {
                    this.audio.stopLightningBuzz();
                }
                this.enemies.push(new Boss(spawn.x, spawn.y, spawn.platform, spawn.bossType));
                spawnedBoss = true;
            } else {
                this.pendingBossSpawns[writeIdx++] = spawn;
            }
        }
        this.pendingBossSpawns.length = writeIdx;
        if (spawnedBoss && this.audio) {
            this._bossMusicEngaged = true;
            if (typeof this.audio.enterRandomBossMusic === 'function') {
                this.audio.enterRandomBossMusic({ fadeInMs: 120 });
            } else if (typeof this.audio.enterBossMusic === 'function') {
                this.audio.enterBossMusic(28, { startAt: 10, fadeInMs: 120 });
            } else if (this.audio.playBackgroundMusicTrack) {
                this.audio.playBackgroundMusicTrack(28, { startAt: 10, fadeInMs: 120 });
            }
        }
    }

    _spawnBossPityHeart(boss) {
        if (!boss || !boss.platform || !this.player) return;

        const p = boss.platform;
        const margin = 70;
        const minX = p.x + margin;
        const maxX = p.x + p.width - margin - 50; // 50 ~= health pickup size
        if (maxX <= minX) return;

        const playerCenterX = this.player.x + this.player.width / 2;
        const playerOnLeftHalf = playerCenterX < (p.x + p.width / 2);

        // Prefer spawning on the opposite half of the platform to keep it "away from player".
        const halfMid = p.x + p.width / 2;
        let spawnMin = playerOnLeftHalf ? halfMid + 20 : minX;
        let spawnMax = playerOnLeftHalf ? maxX : halfMid - 20;

        // Fallback if halves are too narrow.
        if (spawnMax <= spawnMin) {
            spawnMin = minX;
            spawnMax = maxX;
        }

        const x = spawnMin + Math.random() * (spawnMax - spawnMin);
        const y = p.y - 70;
        this.collectibles.push(new Collectible(x, y, 'health'));
    }

    _updatePendingBossStarDrops(dt) {
        if (!Array.isArray(this.pendingBossStarDrops) || this.pendingBossStarDrops.length === 0) return;
        let writeIdx = 0;
        for (let i = 0; i < this.pendingBossStarDrops.length; i++) {
            const drop = this.pendingBossStarDrops[i];
            if (!drop) continue;
            drop.timer -= dt;
            if (drop.timer <= 0) {
                this.collectibles.push(new Collectible(drop.x, drop.y, 'boss_star', null, drop.size));
            } else {
                this.pendingBossStarDrops[writeIdx++] = drop;
            }
        }
        this.pendingBossStarDrops.length = writeIdx;
    }

    _buildPlayerCollisionContext() {
        const ctx = this._playerCollisionContext;
        ctx.enemies.length = 0;
        ctx.collectibles.length = 0;
        ctx.safeZones.length = 0;
        ctx.vines.length = 0;
        ctx.swingingVines.length = 0;
        ctx.victoryPlatforms.length = 0;

        const player = this.player;
        if (!player) return ctx;

        const marginX = 320;
        const marginY = 260;
        const left = player.x - marginX;
        const right = player.x + player.width + marginX;
        const top = player.y - marginY;
        const bottom = player.y + player.height + marginY;

        const intersects = (entity) => (
            entity.x < right &&
            entity.x + entity.width > left &&
            entity.y < bottom &&
            entity.y + entity.height > top
        );

        const enemies = this.enemies;
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if (!enemy || enemy.markedForDeletion) continue;
            if (intersects(enemy)) ctx.enemies.push(enemy);
        }

        const collectibles = this.collectibles;
        for (let i = 0; i < collectibles.length; i++) {
            const collectible = collectibles[i];
            if (!collectible || collectible.markedForDeletion) continue;
            if (intersects(collectible)) ctx.collectibles.push(collectible);
        }

        const safeZones = this.safeZones;
        for (let i = 0; i < safeZones.length; i++) {
            const zone = safeZones[i];
            if (intersects(zone)) ctx.safeZones.push(zone);
        }

        const vines = this.vines;
        for (let i = 0; i < vines.length; i++) {
            const vine = vines[i];
            if (intersects(vine)) ctx.vines.push(vine);
        }

        const swingingVines = this.swingingVines;
        for (let i = 0; i < swingingVines.length; i++) {
            const sv = swingingVines[i];
            if (intersects(sv)) ctx.swingingVines.push(sv);
        }

        const victoryPlatforms = this._victoryPlatforms;
        for (let i = 0; i < victoryPlatforms.length; i++) {
            const platform = victoryPlatforms[i];
            if (intersects(platform)) ctx.victoryPlatforms.push(platform);
        }

        return ctx;
    }

    // Check if an entity is within the visible viewport (with margin)
    _isVisible(entity, margin = 200) {
        const left = this.camera.x - margin;
        const right = this.camera.x + this.camera.effectiveWidth + margin;
        const top = this.camera.y - margin;
        const bottom = this.camera.y + this.camera.effectiveHeight + margin;
        return (
            entity.x + entity.width > left &&
            entity.x < right &&
            entity.y + entity.height > top &&
            entity.y < bottom
        );
    }

    _getMenuOverlayScale(state = this.state) {
        let baseWidth = 850;
        let baseHeight = 650;
        if (state === GameState.START_MENU) {
            baseWidth = 920;
            baseHeight = 560;
        } else if (state === GameState.GAME_OVER) {
            baseWidth = 760;
            baseHeight = 260;
        } else if (state === GameState.VICTORY) {
            baseWidth = 680;
            baseHeight = 420;
        }
        const edgePadding = 20;
        const availableWidth = Math.max(1, this.viewportWidth - edgePadding * 2);
        const availableHeight = Math.max(1, this.viewportHeight - edgePadding * 2);
        return Math.min(availableWidth / baseWidth, availableHeight / baseHeight);
    }

    _getStartMenuCardLayout() {
        const cardWidth = 780;
        const cardHeight = 255;
        const cardX = -cardWidth / 2;
        const cardY = -102;
        return { cardWidth, cardHeight, cardX, cardY };
    }

    _getStartMenuDifficultyButtons() {
        const { cardY, cardHeight } = this._getStartMenuCardLayout();
        const buttons = [];
        const buttonY = cardY + cardHeight + 22;
        const buttonWidth = 216;
        const buttonHeight = 44;
        const buttonGap = 14;
        const rowWidth = this.difficultyOptions.length * buttonWidth + (this.difficultyOptions.length - 1) * buttonGap;
        const buttonX = -rowWidth / 2;
        for (let i = 0; i < this.difficultyOptions.length; i++) {
            const option = this.difficultyOptions[i];
            buttons.push({
                id: option.id,
                label: option.label,
                x: buttonX + i * (buttonWidth + buttonGap),
                y: buttonY,
                width: buttonWidth,
                height: buttonHeight
            });
        }
        return {
            buttons
        };
    }

    _getStartMenuLayout() {
        if (this.state !== GameState.START_MENU) return null;
        const scale = this._getMenuOverlayScale(GameState.START_MENU);
        const card = this._getStartMenuCardLayout();
        const difficulty = this._getStartMenuDifficultyButtons();
        const startCenter = this._getStartMenuOverlayCenter(scale);
        return {
            scale,
            centerX: startCenter.x,
            centerY: startCenter.y,
            ...card
            ,
            buttons: difficulty.buttons
        };
    }

    _getStartMenuOverlayCenter(scale) {
        // Vertically center the full start-menu composition (title to attribution line).
        const localTop = -192;
        const localBottom = 313;
        const localMid = (localTop + localBottom) / 2;
        return {
            x: this.viewportWidth / 2,
            y: this.viewportHeight / 2 - localMid * scale
        };
    }

    _getGameOverOverlayCenter(scale) {
        // Recenter game-over stack (title + two buttons).
        const localTop = -94;
        const localBottom = 128;
        const localMid = (localTop + localBottom) / 2;
        return {
            x: this.viewportWidth / 2,
            y: this.viewportHeight / 2 - localMid * scale
        };
    }

    _getGameOverChangeDifficultyButton() {
        return {
            x: -180,
            y: 76,
            width: 360,
            height: 52
        };
    }

    _getGameOverKeepPlayingButton() {
        return {
            x: -180,
            y: 12,
            width: 360,
            height: 52
        };
    }

    _syncMobileCameraButtonPosition(heartCount) {
        const camBtn = document.getElementById('btn-camera');
        if (!camBtn) return;

        // Keep camera toggle immediately after the final heart icon in the HUD row.
        const startX = 24;
        const heartSpacing = 28;
        const heartIconWidth = 24;
        const gapAfterHearts = 10;
        const safeHeartCount = Math.max(1, heartCount | 0);
        const left = Math.round(startX + (safeHeartCount - 1) * heartSpacing + heartIconWidth + gapAfterHearts);

        if (this._lastCameraBtnLeft !== left) {
            camBtn.style.left = `${left}px`;
            this._lastCameraBtnLeft = left;
        }
    }

    _drawDeathTrapLine(ctx) {
        if (!this._deathGearCache) return;

        const trapY = this.lowestY;
        const verticalMargin = 180;
        const topVisible = this.camera.y - verticalMargin;
        const bottomVisible = this.camera.y + this.camera.effectiveHeight + verticalMargin;
        if (trapY < topVisible || trapY > bottomVisible) return;

        const spacing = 22;
        const marginX = 110;
        const left = this.camera.x - marginX;
        const right = this.camera.x + this.camera.effectiveWidth + marginX;
        const startX = Math.floor(left / spacing) * spacing;
        const halfW = this._deathGearCache.width / 2;
        const halfH = this._deathGearCache.height / 2;
        const drawY = trapY - halfH;
        const gearCanvas = this._deathGearCache.canvas;
        for (let x = startX; x <= right; x += spacing) {
            ctx.drawImage(gearCanvas, x - halfW, drawY);
        }
    }

    _drawLightningLinks(ctx) {
        if (!this.player || !Array.isArray(this.lightningOrbs) || this.lightningOrbs.length === 0) return;

        const px = this.player.x + this.player.width / 2;
        const py = this.player.y + this.player.height / 2 + 4;
        const t = (this.lastTime || 0) * 0.001;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 0; i < this.lightningOrbs.length; i++) {
            const orb = this.lightningOrbs[i];
            if (!orb || orb.markedForDeletion) continue;

            const ox = orb.x + orb.width / 2;
            const oy = orb.y + orb.height / 2;
            const dx = ox - px;
            const dy = oy - py;
            const dist = Math.hypot(dx, dy);
            if (dist < 2) continue;

            const nx = -dy / dist;
            const ny = dx / dist;
            const segments = Math.max(4, Math.min(8, Math.floor(dist / 90) + 3));
            const amp = Math.min(16, 5 + dist * 0.018);

            ctx.beginPath();
            ctx.moveTo(px, py);
            for (let s = 1; s < segments; s++) {
                const u = s / segments;
                const baseX = px + dx * u;
                const baseY = py + dy * u;
                const taper = 1 - Math.abs(u - 0.5) * 0.9;
                const wobble = Math.sin(u * 11 + t * 24 + i * 1.9) * amp * taper;
                ctx.lineTo(baseX + nx * wobble, baseY + ny * wobble);
            }
            ctx.lineTo(ox, oy);
            ctx.strokeStyle = 'rgba(255, 235, 120, 0.45)';
            ctx.lineWidth = 4.6;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(px, py);
            for (let s = 1; s < segments; s++) {
                const u = s / segments;
                const baseX = px + dx * u;
                const baseY = py + dy * u;
                const taper = 1 - Math.abs(u - 0.5) * 0.9;
                const wobble = Math.sin(u * 11 + t * 26 + i * 2.1) * amp * 0.65 * taper;
                ctx.lineTo(baseX + nx * wobble, baseY + ny * wobble);
            }
            ctx.lineTo(ox, oy);
            ctx.strokeStyle = 'rgba(255, 251, 210, 0.78)';
            ctx.lineWidth = 2.1;
            ctx.stroke();
        }

        ctx.restore();
    }

    draw() {
        this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
        if (this.state === GameState.START_MENU) {
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.viewportHeight);
            gradient.addColorStop(0, '#43a047'); // Green
            gradient.addColorStop(1, '#1b5e20'); // Dark Green
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);
        } else {
            this.background.draw(this.ctx, this.camera.x, this.camera.y, this.performanceQuality);
        }

        if (this.state === GameState.PLAYING) {
            this.ctx.save();
            this.ctx.scale(this.camera.zoom, this.camera.zoom);
            this.ctx.translate(-this.camera.x, -this.camera.y);

            // Viewport culling: only draw entities visible on screen
            const vines = this._visibleVines;
            for (let i = 0; i < vines.length; i++) {
                vines[i].draw(this.ctx);
            }
            const svines = this._visibleSwingingVines;
            for (let i = 0; i < svines.length; i++) {
                svines[i].draw(this.ctx);
            }

            const platforms = this._visiblePlatforms;
            for (let i = 0; i < platforms.length; i++) {
                platforms[i].draw(this.ctx);
            }
            this._drawDeathTrapLine(this.ctx);

            const collectibles = this.collectibles;
            const drawMargin = 200;
            const drawLeft = this.camera.x - drawMargin;
            const drawRight = this.camera.x + this.camera.effectiveWidth + drawMargin;
            const drawTop = this.camera.y - drawMargin;
            const drawBottom = this.camera.y + this.camera.effectiveHeight + drawMargin;
            for (let i = 0; i < collectibles.length; i++) {
                const collectible = collectibles[i];
                if (
                    collectible.x + collectible.width > drawLeft &&
                    collectible.x < drawRight &&
                    collectible.y + collectible.height > drawTop &&
                    collectible.y < drawBottom
                ) {
                    collectible.draw(this.ctx);
                }
            }
            this._drawPrisonerRescue(this.ctx);

            const safeZones = this.safeZones;
            for (let i = 0; i < safeZones.length; i++) {
                const zone = safeZones[i];
                if (
                    zone.x + zone.width > drawLeft &&
                    zone.x < drawRight &&
                    zone.y + zone.height > drawTop &&
                    zone.y < drawBottom
                ) {
                    zone.draw(this.ctx);
                }
            }

            const enemies = this.enemies;
            for (let i = 0; i < enemies.length; i++) {
                const enemy = enemies[i];
                if (
                    enemy.x + enemy.width > drawLeft &&
                    enemy.x < drawRight &&
                    enemy.y + enemy.height > drawTop &&
                    enemy.y < drawBottom
                ) {
                    enemy.draw(this.ctx);
                }
            }

            const rocks = this.rocks;
            for (let i = 0; i < rocks.length; i++) {
                rocks[i].draw(this.ctx);
            }

            const lightningOrbs = this.lightningOrbs;
            for (let i = 0; i < lightningOrbs.length; i++) {
                lightningOrbs[i].draw(this.ctx);
            }

            const projectiles = this.enemyProjectiles;
            for (let i = 0; i < projectiles.length; i++) {
                projectiles[i].draw(this.ctx);
            }

            this.player.draw(this.ctx, this);
            this._drawLightningLinks(this.ctx);
            this.particles.draw(this.ctx);
            this.ctx.restore();
        } else if (this.state === GameState.PAUSED) {
            // Draw frozen game state
            this.ctx.save();
            this.ctx.scale(this.camera.zoom, this.camera.zoom);
            this.ctx.translate(-this.camera.x, -this.camera.y);

            const vines = this.vines;
            for (let i = 0; i < vines.length; i++) {
                if (this._isVisible(vines[i], 300)) vines[i].draw(this.ctx);
            }
            const svines = this.swingingVines;
            for (let i = 0; i < svines.length; i++) {
                if (this._isVisible(svines[i], 300)) svines[i].draw(this.ctx);
            }

            const platforms = this.platforms;
            for (let i = 0; i < platforms.length; i++) {
                if (this._isVisible(platforms[i], 300)) platforms[i].draw(this.ctx);
            }
            this._drawDeathTrapLine(this.ctx);

            const mps = this.movingPlatforms;
            for (let i = 0; i < mps.length; i++) {
                if (this._isVisible(mps[i], 300)) mps[i].draw(this.ctx);
            }

            const collectibles = this.collectibles;
            for (let i = 0; i < collectibles.length; i++) {
                if (this._isVisible(collectibles[i])) collectibles[i].draw(this.ctx);
            }
            this._drawPrisonerRescue(this.ctx);

            const safeZones = this.safeZones;
            for (let i = 0; i < safeZones.length; i++) {
                if (this._isVisible(safeZones[i])) safeZones[i].draw(this.ctx);
            }

            const enemies = this.enemies;
            for (let i = 0; i < enemies.length; i++) {
                if (this._isVisible(enemies[i])) enemies[i].draw(this.ctx);
            }

            const rocks = this.rocks;
            for (let i = 0; i < rocks.length; i++) {
                rocks[i].draw(this.ctx);
            }

            const lightningOrbs = this.lightningOrbs;
            for (let i = 0; i < lightningOrbs.length; i++) {
                lightningOrbs[i].draw(this.ctx);
            }

            const projectiles = this.enemyProjectiles;
            for (let i = 0; i < projectiles.length; i++) {
                projectiles[i].draw(this.ctx);
            }

            this.player.draw(this.ctx, this);
            this._drawLightningLinks(this.ctx);
            this.particles.draw(this.ctx);

            this.ctx.restore();
        }

        this.drawUI();
        if (this.state !== GameState.START_MENU) {
            this.drawFpsCounter();
        }
    }

    drawFpsCounter() {
        this.ctx.save();
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        this.ctx.font = '12px "Outfit", sans-serif';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        this.ctx.fillText(`${Math.round(this.fpsDisplay)} ${this.layoutVariantLabel}`, this.viewportWidth / 2, this.viewportHeight - 8);
        this.ctx.restore();
    }

    drawUI() {
        if (this.state === GameState.PLAYING || this.state === GameState.PAUSED) {
            this.ctx.save();

            const startX = 24;
            let currentY = 36;
            const lineSpacing = 36;

            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';

            // 1. Draw compact health indicator: ❤️xN
            const heartCached = this._heartCache;
            this._syncMobileCameraButtonPosition(2);
            ctx_drawCachedEmoji(this.ctx, heartCached, startX, currentY);
            this.ctx.globalAlpha = 1.0;
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 24px "Outfit", sans-serif';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.78)';
            this.ctx.shadowBlur = 6;
            this.ctx.shadowOffsetY = 2.5;
            this.ctx.fillText(`${Math.max(0, this.player.health | 0)}`, startX + 32, currentY + 2);

            currentY += lineSpacing;

            // 2. Draw Bombs indicator
            const bombCached = this._bombUICache;
            ctx_drawCachedEmoji(this.ctx, bombCached, startX, currentY);

            this.ctx.fillText(`${this.player.bombs}`, startX + 32, currentY + 2);

            currentY += lineSpacing;

            // 3. Draw music song changer
            const musicCached = this._musicCache;
            ctx_drawCachedEmoji(this.ctx, musicCached, startX, currentY);

            currentY += lineSpacing;

            // 4. Draw Mute button
            const muteCached = this.audio.isMusicMuted ? this._muteCache : this._unmuteCache;
            ctx_drawCachedEmoji(this.ctx, muteCached, startX, currentY);

            // 5. EMOJI letter collectibles progress
            currentY += lineSpacing;
            const letters = ['E', 'M', 'O', 'J', 'I'];
            const collected = (this.player && this.player.collectedLetters) ? this.player.collectedLetters : {};
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            const tileSize = 16;
            const tileRadius = 4;
            const letterSpacing = 18;
            const letterStartX = startX + tileSize / 2;
            const emojiTrackerWidth = tileSize + (letters.length - 1) * letterSpacing;
            for (let i = 0; i < letters.length; i++) {
                const letter = letters[i];
                const isCollected = !!collected[letter];
                const cx = letterStartX + i * letterSpacing;
                const tileX = cx - tileSize / 2;
                const tileY = currentY - tileSize / 2 + 2;
                const alpha = isCollected ? 0.98 : 0.32;

                this.ctx.save();
                this.ctx.globalAlpha = alpha;

                const tileGrad = this.ctx.createLinearGradient(tileX, tileY, tileX, tileY + tileSize);
                tileGrad.addColorStop(0, '#ffe082');
                tileGrad.addColorStop(1, '#ffb300');
                this.ctx.fillStyle = tileGrad;
                if (this.ctx.roundRect) {
                    this.ctx.beginPath();
                    this.ctx.roundRect(tileX, tileY, tileSize, tileSize, tileRadius);
                    this.ctx.fill();
                } else {
                    this.ctx.fillRect(tileX, tileY, tileSize, tileSize);
                }

                this.ctx.strokeStyle = '#8a5200';
                this.ctx.lineWidth = 1.5;
                if (this.ctx.roundRect) {
                    this.ctx.beginPath();
                    this.ctx.roundRect(tileX, tileY, tileSize, tileSize, tileRadius);
                    this.ctx.stroke();
                } else {
                    this.ctx.strokeRect(tileX, tileY, tileSize, tileSize);
                }

                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
                if (this.ctx.roundRect) {
                    this.ctx.beginPath();
                    this.ctx.roundRect(tileX + 1.5, tileY + 1.5, tileSize - 3, Math.max(3, tileSize * 0.24), 3);
                    this.ctx.fill();
                } else {
                    this.ctx.fillRect(tileX + 1.5, tileY + 1.5, tileSize - 3, Math.max(3, tileSize * 0.24));
                }

                this.ctx.font = 'bold 13px "Outfit", sans-serif';
                this.ctx.lineJoin = 'round';
                this.ctx.shadowColor = 'transparent';
                this.ctx.shadowBlur = 0;
                this.ctx.shadowOffsetX = 0;
                this.ctx.shadowOffsetY = 0;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillText(letter, cx, tileY + tileSize / 2 + 0.5);
                this.ctx.restore();
            }
            currentY += 20;

            const completion = this.getLevelCompletionPercent();
            this.ctx.textAlign = 'left';
            this.ctx.font = 'bold 16px "Outfit", sans-serif';
            const completionText = `${completion}%`;
            const textWidth = this.ctx.measureText(completionText).width;
            const gap = 6;
            const completionTextX = startX + emojiTrackerWidth - textWidth;
            const barX = startX;
            const barW = Math.max(10, completionTextX - barX - gap);
            const barH = 6;
            const barY = currentY + 2 - barH / 2;
            const fillW = Math.round(barW * (completion / 100));
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
            this.ctx.fillRect(barX, barY, barW, barH);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.52)';
            this.ctx.fillRect(barX, barY, fillW, barH);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.fillText(completionText, completionTextX, currentY + 2);

            if (this.player && this.player.inSafeBubble) {
                const panelX = startX;
                const panelY = currentY + 18;
                const panelW = 132;
                const panelH = 26;
                this.ctx.fillStyle = 'rgba(160, 108, 40, 0.24)';
                this.ctx.strokeStyle = 'rgba(255, 213, 132, 0.55)';
                this.ctx.lineWidth = 1.5;
                this.ctx.beginPath();
                if (this.ctx.roundRect) {
                    this.ctx.roundRect(panelX, panelY, panelW, panelH, 12);
                } else {
                    this.ctx.rect(panelX, panelY, panelW, panelH);
                }
                this.ctx.fill();
                this.ctx.stroke();
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.font = 'bold 14px "Outfit", sans-serif';
                this.ctx.fillStyle = '#ffe6b3';
                this.ctx.fillText('IN BARREL', panelX + panelW / 2, panelY + panelH / 2 + 0.5);
            }


            this.ctx.restore();
        }

        if (this.state === GameState.PLAYING || this.state === GameState.PAUSED) {
            // Find active boss (if any)
            const activeBoss = this.enemies.find(e => e instanceof Boss && !e.markedForDeletion && e.activated);
            if (activeBoss) {
                this._drawBossHealthBar(activeBoss);
            }
        }

        if (this.state !== GameState.PLAYING) {
            // Standard overlays for non-playing states
            this.drawMenuOverlays();
        }
    }

    drawMenuOverlays() {
        this.ctx.save();

        // 1. Universal background overlay (non-scaled)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);

        // 2. Calculate responsive overlay scale.
        const scale = this._getMenuOverlayScale(this.state);

        // 3. Move context to center and apply scale for all menu elements
        let menuCenterX = this.viewportWidth / 2;
        let menuCenterY = this.viewportHeight / 2;
        if (this.state === GameState.START_MENU) {
            const startCenter = this._getStartMenuOverlayCenter(scale);
            menuCenterX = startCenter.x;
            menuCenterY = startCenter.y;
        } else if (this.state === GameState.GAME_OVER) {
            const overCenter = this._getGameOverOverlayCenter(scale);
            menuCenterX = overCenter.x;
            menuCenterY = overCenter.y;
        }
        this.ctx.translate(menuCenterX, menuCenterY);
        this.ctx.scale(scale, scale);

        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 10;

        if (this.state === GameState.START_MENU) {
            const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
            const time = Date.now() / 1000;
            const { cardWidth, cardHeight, cardX, cardY } = this._getStartMenuCardLayout();
            const { buttons } = this._getStartMenuDifficultyButtons();

            // Title with Premium Gradient
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.font = 'bold 84px "Outfit", sans-serif';
            const gradient = this.ctx.createLinearGradient(0, -200, 0, -110);
            gradient.addColorStop(0, '#ffffff'); // White
            gradient.addColorStop(1, '#ffea00'); // Gold

            this.ctx.fillStyle = gradient;
            this.ctx.shadowColor = 'rgba(255, 234, 0, 0.4)';
            this.ctx.shadowBlur = 25;
            this.ctx.fillText('⭐EmojiLand⭐', 0, -150);

            // Controls & Objectives Card

            // Glassmorphism effect for card
            this.ctx.fillStyle = 'rgba(20, 60, 20, 0.7)';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
            this.ctx.shadowBlur = 15;
            this.ctx.beginPath();
            if (this.ctx.roundRect) {
                this.ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 20);
            } else {
                this.ctx.rect(cardX, cardY, cardWidth, cardHeight);
            }
            this.ctx.fill();

            // Card Inner Border
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Reset shadows for content
            this.ctx.shadowBlur = 0;

            // Left Column: Controls
            this.ctx.textAlign = 'left';
            this.ctx.font = 'bold 24px "Outfit", sans-serif';
            this.ctx.fillStyle = '#ffd54f';
            this.ctx.fillText('CONTROLS', cardX + 40, cardY + 40);

            this.ctx.font = '20px "Outfit", sans-serif';
            this.ctx.fillStyle = '#ffffff';

            let ly = cardY + 74;
            const yStep = 30;
            this.ctx.fillText('KB Arrows or Joystick : Move', cardX + 40, ly); ly += yStep;
            this.ctx.fillText('A or 🦘 : Jump', cardX + 40, ly); ly += yStep;
            this.ctx.fillText('D or 🪨⬆️ : Attack / Charge', cardX + 40, ly); ly += yStep;
            this.ctx.fillText('S or 💣 Drop Bomb From Above', cardX + 40, ly); ly += yStep;
            this.ctx.fillText('P or ⏯️: Pause/Unpause', cardX + 40, ly); ly += yStep;
            this.ctx.fillText('W or 🌀: Spawn a Portal', cardX + 40, ly);

            // Vertical Divider
            this.ctx.beginPath();
            this.ctx.moveTo(0, cardY + 30);
            this.ctx.lineTo(0, cardY + cardHeight - 30);
            this.ctx.stroke();

            // Right Column: Objectives
            this.ctx.font = 'bold 24px "Outfit", sans-serif';
            this.ctx.fillStyle = '#ffd54f';
            this.ctx.fillText('OBJECTIVES', 40, cardY + 40);

            this.ctx.font = '20px "Outfit", sans-serif';
            this.ctx.fillStyle = '#ffffff';
            let ry = cardY + 74;
            this.ctx.fillText('🪙 Reach 100% level completion', 40, ry); ry += yStep;
            this.ctx.fillText('☠️ Defeat All Enemies', 40, ry); ry += yStep;
            this.ctx.fillText('⚜️ Save the Prisoner', 40, ry); ry += yStep;
            this.ctx.fillText('🚩 Reach the end with the best score', 40, ry); ry += yStep;
            this.ctx.fillText('🎰 Experiment, Explore, Enjoy', 40, ry); ry += yStep;
            this.ctx.fillText('🎲 Levels are always unique!', 40, ry);

            for (let i = 0; i < buttons.length; i++) {
                const btn = buttons[i];
                const isSelected = this.selectedDifficultyId === btn.id;
                this.ctx.fillStyle = isSelected ? 'rgba(255, 213, 79, 0.35)' : 'rgba(255, 255, 255, 0.1)';
                this.ctx.strokeStyle = isSelected ? 'rgba(255, 238, 156, 0.95)' : 'rgba(255, 255, 255, 0.28)';
                this.ctx.lineWidth = isSelected ? 3 : 2;
                this.ctx.beginPath();
                if (this.ctx.roundRect) {
                    this.ctx.roundRect(btn.x, btn.y, btn.width, btn.height, 16);
                } else {
                    this.ctx.rect(btn.x, btn.y, btn.width, btn.height);
                }
                this.ctx.fill();
                this.ctx.stroke();

                this.ctx.font = 'bold 20px "Outfit", sans-serif';
                this.ctx.fillStyle = '#ffffff';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(btn.label, btn.x + btn.width / 2, btn.y + btn.height / 2 + 1);
            }

            // Pulsing 'Start' Text
            const alpha = 0.6 + 0.4 * Math.sin(time * 3);
            this.ctx.font = 'bold 32px "Outfit", sans-serif';
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = `rgba(255, 255, 255, ${alpha * 0.5})`;
            this.ctx.shadowBlur = 10;
            if (this.selectedDifficultyId) {
                this.ctx.fillText(isMobile ? 'TOUCH TO START' : 'PRESS ENTER TO START', 0, cardY + cardHeight + 108);
            } else {
                this.ctx.fillText('SELECT DIFFICULTY TO START', 0, cardY + cardHeight + 108);
            }

            // Subtle Music Attribution
            this.ctx.shadowBlur = 0;
            this.ctx.font = '14px "Outfit", sans-serif';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillText('🎵 Music from Pixabay & Suno • Game Version 1.43', 0, cardY + cardHeight + 152);

        } else if (this.state === GameState.GAME_OVER) {
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.font = 'bold 72px "Outfit", sans-serif';
            this.ctx.fillStyle = '#ff5252';
            this.ctx.fillText('Game Over', 0, -40);

            const keepBtn = this._getGameOverKeepPlayingButton();
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.34)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            if (this.ctx.roundRect) {
                this.ctx.roundRect(keepBtn.x, keepBtn.y, keepBtn.width, keepBtn.height, 14);
            } else {
                this.ctx.rect(keepBtn.x, keepBtn.y, keepBtn.width, keepBtn.height);
            }
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.font = 'bold 24px "Outfit", sans-serif';
            this.ctx.fillStyle = '#ffd54f';
            this.ctx.fillText('Keep Playing ▶️', keepBtn.x + keepBtn.width / 2, keepBtn.y + keepBtn.height / 2 + 1);

            const changeBtn = this._getGameOverChangeDifficultyButton();
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.34)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            if (this.ctx.roundRect) {
                this.ctx.roundRect(changeBtn.x, changeBtn.y, changeBtn.width, changeBtn.height, 14);
            } else {
                this.ctx.rect(changeBtn.x, changeBtn.y, changeBtn.width, changeBtn.height);
            }
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.font = 'bold 24px "Outfit", sans-serif';
            this.ctx.fillStyle = '#ffd54f';
            this.ctx.fillText('Change Difficulty ⚙️', changeBtn.x + changeBtn.width / 2, changeBtn.y + changeBtn.height / 2 + 1);
        } else if (this.state === GameState.VICTORY) {
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // Victory Card
            const cardWidth = 620;
            const cardHeight = 340;
            const cardX = -cardWidth / 2;
            const cardY = -cardHeight / 2;

            // Glassmorphism effect for card
            this.ctx.fillStyle = 'rgba(30, 60, 30, 0.85)';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
            this.ctx.shadowBlur = 20;
            this.ctx.beginPath();
            if (this.ctx.roundRect) {
                this.ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 24);
            } else {
                this.ctx.rect(cardX, cardY, cardWidth, cardHeight);
            }
            this.ctx.fill();

            // Card Border
            this.ctx.strokeStyle = 'rgba(255, 235, 59, 0.3)';
            this.ctx.lineWidth = 2.5;
            this.ctx.stroke();

            this.ctx.shadowBlur = 0;
            const topY = -cardHeight / 2;

            // Level Complete Title
            this.ctx.font = 'bold 58px "Outfit", sans-serif';
            const gradient = this.ctx.createLinearGradient(0, topY + 24, 0, topY + 100);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, '#ffeb3b');
            gradient.addColorStop(1, '#fbc02d');

            this.ctx.fillStyle = gradient;
            this.ctx.shadowColor = 'rgba(255, 235, 59, 0.4)';
            this.ctx.shadowBlur = 15;
            this.ctx.fillText('Level Complete!', 0, topY + 68);

            // Score Section
            const totalScore = this.player ? this.player.score : 0;
            const completionPercent = this.getLevelCompletionPercent();
            this.ctx.shadowBlur = 0;
            this.ctx.font = 'bold 22px "Outfit", sans-serif';
            this.ctx.fillStyle = '#ffd54f';
            this.ctx.fillText('TOTAL SCORE', 0, topY + 132);

            this.ctx.font = 'bold 44px "Outfit", sans-serif';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(`\u2B50 ${totalScore} \u2022 ${completionPercent}% \u2B50`, 0, topY + 184);

            // Separation Line
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(-cardWidth / 2 + 96, topY + 255);
            this.ctx.lineTo(cardWidth / 2 - 96, topY + 255);
            this.ctx.stroke();

            // Next Level Instruction
            const time = Date.now() / 1000;
            const alpha = 0.7 + 0.3 * Math.sin(time * 4);
            this.ctx.font = 'bold 24px "Outfit", sans-serif';
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
            this.ctx.fillText(isMobile ? 'Touch to Play Next Level' : 'Press ENTER to Play Next Level', 0, topY + 302);
        } else if (this.state === GameState.PAUSED) {
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.font = 'bold 72px "Outfit", sans-serif';
            this.ctx.fillStyle = 'white';
            this.ctx.fillText('Paused', 0, 0);
        }
        this.ctx.restore();
    }

    _drawBossHealthBar(boss) {
        const ctx = this.ctx;
        ctx.save();

        const barW = 320;
        const barH = 20;
        const barX = (this.viewportWidth - barW) / 2;
        const barY = 14;
        const fillRatio = Math.max(0, boss.health / boss.maxHealth);

        // Background panel
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        const panelPad = 10;
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(barX - panelPad, barY - panelPad, barW + panelPad * 2, barH + panelPad * 2 + 26, 10);
            ctx.fill();
        } else {
            ctx.fillRect(barX - panelPad, barY - panelPad, barW + panelPad * 2, barH + panelPad * 2 + 26);
        }

        // Boss label
        ctx.font = 'bold 13px "Outfit", sans-serif';
        ctx.fillStyle = '#ffca28';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const bossName = boss.displayName || 'BOSS';
        ctx.fillText(`${boss.emoji}  ${bossName}`, this.viewportWidth / 2, barY);

        // Bar background
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(barX, barY + 18, barW, barH);

        // Fill color transitions from green to yellow to red
        let barColor;
        if (fillRatio > 0.6) barColor = '#4caf50';
        else if (fillRatio > 0.3) barColor = '#ffc107';
        else barColor = '#f44336';

        ctx.fillStyle = barColor;
        ctx.fillRect(barX, barY + 18, barW * fillRatio, barH);

        // Border
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(barX, barY + 18, barW, barH);

        ctx.restore();
    }

    registerEnemyDefeat(enemy) {
        this.enemiesDefeated++;
        if (enemy && !enemy.bossType && enemy.countsForCompletionObjective !== false) {
            this.completionEnemiesDefeated++;
        }
    }

    getLevelCompletionPercent() {
        const letterKeys = ['E', 'M', 'O', 'J', 'I'];
        const collected = (this.player && this.player.collectedLetters) ? this.player.collectedLetters : {};
        let lettersCollected = 0;
        for (let i = 0; i < letterKeys.length; i++) {
            if (collected[letterKeys[i]]) lettersCollected++;
        }

        const completionEnemyTotal = Math.max(0, this.totalCompletionEnemies);
        const totalObjectives = Math.max(0, this.totalCompletionCoins) + completionEnemyTotal + letterKeys.length;
        if (totalObjectives <= 0) return 100;

        const completedCoins = Math.min(Math.max(0, this.coinsCollected), Math.max(0, this.totalCompletionCoins));
        const completedEnemies = Math.min(Math.max(0, this.completionEnemiesDefeated), completionEnemyTotal);
        const completedLetters = Math.min(Math.max(0, lettersCollected), letterKeys.length);
        const completedObjectives = completedCoins + completedEnemies + completedLetters;

        if (completedObjectives >= totalObjectives) return 100;
        return Math.floor((completedObjectives * 100) / totalObjectives);
    }
}

// Helper to draw a cached emoji centered at a position (for UI)
function ctx_drawCachedEmoji(ctx, cached, x, y) {
    ctx.drawImage(cached.canvas, x - cached.width / 2 + 12, y - cached.height / 2);
}


