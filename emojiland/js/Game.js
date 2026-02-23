import { InputHandler } from './InputHandler.js';
import { Camera } from './Camera.js';
import { Player } from './entities/Player.js';
import { loadLevel } from './environment/Level.js';
import { AudioEngine } from './AudioEngine.js';
import { ParticleSystem } from './ParticleSystem.js';
import { Background } from './Background.js';
import { Rock } from './entities/Rock.js';
import { clearEmojiCache } from './EmojiCache.js';
import { getEmojiCanvas } from './EmojiCache.js';
export function filterInPlace(array) {
    let writeIdx = 0;
    for (let i = 0; i < array.length; i++) {
        if (!array[i].markedForDeletion) {
            array[writeIdx++] = array[i];
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
        this.input = new InputHandler();
        this.camera = new Camera(canvas.width, canvas.height);

        this.state = GameState.START_MENU;
        this.lastTime = 0;

        this.player = null;
        this.platforms = [];
        this.enemies = [];
        this.collectibles = [];
        this.rocks = [];
        this.enemyProjectiles = [];
        this.vines = [];
        this.movingPlatforms = [];

        this.audio = new AudioEngine();
        this.particles = new ParticleSystem();
        this.background = new Background(canvas.width, canvas.height);

        this._visiblePlatforms = [];
        this._visibleVines = [];

        this.hitStopTimer = 0;

        this.lowestY = 800;

        this.totalCoins = 0;
        this.coinsCollected = 0;
        this.totalEnemies = 0;
        this.enemiesDefeated = 0;

        this.gameOverTriggered = false;
        this.gameOverTimer = 0;

        // Pre-cache UI emojis
        this._heartCache = getEmojiCanvas('❤️', 24);
        this._musicCache = getEmojiCanvas('▶️', 24);
        this._muteCache = getEmojiCanvas('🔇', 24);
        this._unmuteCache = getEmojiCanvas('🔊', 24);
        this._bombUICache = getEmojiCanvas('💣', 24);

        const startGameHandler = (e) => {
            if (this.state === GameState.START_MENU || ((this.state === GameState.GAME_OVER || this.state === GameState.VICTORY) && this.canRestart !== false)) {
                // IMPORTANT: Unlock audio FIRST, synchronously during the user gesture.
                // This must happen before fullscreen or anything else to satisfy
                // mobile browser autoplay policies.
                if (this.audio && typeof this.audio.unlock === 'function') {
                    this.audio.unlock();
                }

                // Request fullscreen (non-blocking, won't consume gesture on most browsers)
                try {
                    const elem = document.documentElement;
                    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                        if (elem.requestFullscreen) {
                            elem.requestFullscreen().catch(() => { });
                        } else if (elem.webkitRequestFullscreen) {
                            elem.webkitRequestFullscreen();
                        }
                    }
                } catch (err) {
                    // Fullscreen not supported or failed — continue anyway
                }

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
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const x = (clientX - rect.left) * scaleX;
            const y = (clientY - rect.top) * scaleY;

            // Health is at y=36
            // Bombs is at y=72
            // Next Song Button (▶️) is now at y=108
            // Hitbox: y from 84 to 132, x from 10 to 96
            if (x >= 10 && x <= 96 && y >= 84 && y <= 132) {
                this.audio.playBackgroundMusic();
                return true;
            }
            // Mute button (🔇/🔊) is now at y=144
            // Hitbox: y from 120 to 168, x from 10 to 62
            else if (x >= 10 && x <= 62 && y >= 120 && y <= 168) {
                this.audio.toggleMusicMute();
                return true;
            }
            return false;
        };

        const handleInteraction = (e) => {
            const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : 0));
            const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : 0));

            const hit = handleMusicClick(clientX, clientY);
            if (hit) {
                if (e.cancelable) e.preventDefault();
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
                if (this.audio && this.audio.pauseBackgroundMusic) {
                    this.audio.pauseBackgroundMusic();
                }
            }
        });
    }

    initLevel() {
        clearEmojiCache();
        const levelData = loadLevel();
        this.platforms = levelData.platforms;
        this.enemies = levelData.enemies;
        this.collectibles = levelData.collectibles;
        this.vines = levelData.vines || [];
        this.movingPlatforms = levelData.movingPlatforms || [];
        this.currentTheme = levelData.theme;
        this.rocks = [];
        this.enemyProjectiles = [];

        this.totalCoins = this.collectibles.length;
        this.coinsCollected = 0;
        this.totalEnemies = this.enemies.length;
        this.enemiesDefeated = 0;

        this.gameOverTriggered = false;
        this.gameOverTimer = 0;

        this.background.setTheme(this.currentTheme);

        this.lowestY = Math.max(...this.platforms.map(p => p.y + p.height)) + 200;

        this.player = new Player(100, 300);
        this.camera.x = 0;
        this.audio.playBackgroundMusic();

        // Re-cache UI emojis
        this._heartCache = getEmojiCanvas('❤️', 24);
        this._musicCache = getEmojiCanvas('▶️', 24);
        this._muteCache = getEmojiCanvas('🔇', 24);
        this._unmuteCache = getEmojiCanvas('🔊', 24);
        this._bombUICache = getEmojiCanvas('💣', 24);
    }

    start() {
        requestAnimationFrame((time) => this.loop(time));
    }

    resize(width, height) {
        if (this.camera) this.camera.resize(width, height);
        if (this.background) this.background.resize(width, height);
    }

    loop(time) {
        let dt = (time - this.lastTime) / 1000;
        this.lastTime = time;
        if (dt > 0.1) dt = 0.1;

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
            } else if (this.state === GameState.PAUSED) {
                this.state = GameState.PLAYING;
                this.audio.resumeBackgroundMusic && this.audio.resumeBackgroundMusic();

                try {
                    const elem = document.documentElement;
                    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                        if (elem.requestFullscreen) {
                            elem.requestFullscreen().catch(() => { });
                        } else if (elem.webkitRequestFullscreen) {
                            elem.webkitRequestFullscreen();
                        }
                    }
                } catch (err) { }
            }
        }

        if (this.state === GameState.PAUSED) {
            return;
        }

        if (this.hitStopTimer > 0) {
            this.hitStopTimer -= dt;
            this.particles.update(dt);
            this.camera.update(this.player, dt);
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

        // Update moving platforms and include in visible platforms for collision
        for (let i = 0; i < this.movingPlatforms.length; i++) {
            const mp = this.movingPlatforms[i];
            mp.update(dt);
            if (this._isVisible(mp, 800)) {
                this._visiblePlatforms.push(mp);
            }
        }

        if (this.state === GameState.PLAYING) {
            if (this.player.health <= 0 || this.player.y > this.lowestY) {
                if (!this.gameOverTriggered) {
                    this.gameOverTriggered = true;
                    this.gameOverTimer = 2.0;
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

            this.player.update(dt, this.input, this._visiblePlatforms, this);
            const enemies = this.enemies;
            for (let i = 0; i < enemies.length; i++) {
                if (this._isVisible(enemies[i], 1000)) {
                    enemies[i].update(dt, this);
                }
            }

            const collectibles = this.collectibles;
            for (let i = 0; i < collectibles.length; i++) {
                if (this._isVisible(collectibles[i], 1000)) {
                    collectibles[i].update(dt);
                }
            }

            const rocks = this.rocks;
            for (let i = 0; i < rocks.length; i++) {
                rocks[i].update(dt, this);
            }

            const enemyProjectiles = this.enemyProjectiles;
            for (let i = 0; i < enemyProjectiles.length; i++) {
                enemyProjectiles[i].update(dt, this);
            }

            this.enemies = filterInPlace(this.enemies);
            this.collectibles = filterInPlace(this.collectibles);
            this.rocks = filterInPlace(this.rocks);
            this.enemyProjectiles = filterInPlace(this.enemyProjectiles);

            this.camera.update(this.player, dt);
            this.particles.update(dt);
        }
    }

    triggerVictory() {
        this.state = GameState.VICTORY;
        this.canRestart = false;
        setTimeout(() => { this.canRestart = true; }, 1000);
        this.audio.playWin();
        this.audio.fadeOutMusic(1000);
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

    draw() {
        if (this.state === GameState.START_MENU) {
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, '#43a047'); // Green
            gradient.addColorStop(1, '#1b5e20'); // Dark Green
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.background.draw(this.ctx, this.camera.x, this.camera.y);
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

            const platforms = this._visiblePlatforms;
            for (let i = 0; i < platforms.length; i++) {
                platforms[i].draw(this.ctx);
            }

            const collectibles = this.collectibles;
            for (let i = 0; i < collectibles.length; i++) {
                if (this._isVisible(collectibles[i])) collectibles[i].draw(this.ctx);
            }

            const enemies = this.enemies;
            for (let i = 0; i < enemies.length; i++) {
                if (this._isVisible(enemies[i])) enemies[i].draw(this.ctx);
            }

            const rocks = this.rocks;
            for (let i = 0; i < rocks.length; i++) {
                rocks[i].draw(this.ctx);
            }

            const projectiles = this.enemyProjectiles;
            for (let i = 0; i < projectiles.length; i++) {
                projectiles[i].draw(this.ctx);
            }

            this.player.draw(this.ctx, this);
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

            const platforms = this.platforms;
            for (let i = 0; i < platforms.length; i++) {
                if (this._isVisible(platforms[i], 300)) platforms[i].draw(this.ctx);
            }

            const mps = this.movingPlatforms;
            for (let i = 0; i < mps.length; i++) {
                if (this._isVisible(mps[i], 300)) mps[i].draw(this.ctx);
            }

            const collectibles = this.collectibles;
            for (let i = 0; i < collectibles.length; i++) {
                if (this._isVisible(collectibles[i])) collectibles[i].draw(this.ctx);
            }

            const enemies = this.enemies;
            for (let i = 0; i < enemies.length; i++) {
                if (this._isVisible(enemies[i])) enemies[i].draw(this.ctx);
            }

            const rocks = this.rocks;
            for (let i = 0; i < rocks.length; i++) {
                rocks[i].draw(this.ctx);
            }

            const projectiles = this.enemyProjectiles;
            for (let i = 0; i < projectiles.length; i++) {
                projectiles[i].draw(this.ctx);
            }

            this.player.draw(this.ctx, this);
            this.particles.draw(this.ctx);

            this.ctx.restore();
        }

        this.drawUI();
    }

    drawUI() {
        if (this.state === GameState.PLAYING || this.state === GameState.PAUSED) {
            this.ctx.save();

            const startX = 24;
            let currentY = 36;
            const lineSpacing = 36;

            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';

            // 1. Draw Health using cached emoji
            const heartSpacing = 28;
            const heartCached = this._heartCache;
            for (let i = 0; i < this.player.maxHealth; i++) {
                const x = startX + i * heartSpacing;
                const isFull = i < this.player.health;

                this.ctx.globalAlpha = isFull ? 1.0 : 0.3;
                ctx_drawCachedEmoji(this.ctx, heartCached, x, currentY);
            }
            this.ctx.globalAlpha = 1.0;

            currentY += lineSpacing;

            // 2. Draw Bombs indicator
            const bombCached = this._bombUICache;
            ctx_drawCachedEmoji(this.ctx, bombCached, startX, currentY);

            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 24px "Outfit", sans-serif';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 4;
            this.ctx.shadowOffsetY = 2;

            this.ctx.fillText(`${this.player.bombs}`, startX + 32, currentY + 2);

            currentY += lineSpacing;

            // 3. Draw music song changer
            const musicCached = this._musicCache;
            ctx_drawCachedEmoji(this.ctx, musicCached, startX, currentY);

            currentY += lineSpacing;

            // 4. Draw Mute button
            const muteCached = this.audio.isMusicMuted ? this._muteCache : this._unmuteCache;
            ctx_drawCachedEmoji(this.ctx, muteCached, startX, currentY);


            this.ctx.restore();
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
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. Calculate Responsive Scale
        // Reference size 800x600, but we allow it to be smaller
        const baseWidth = 850;
        const baseHeight = 650;
        const scale = Math.min(this.canvas.width / baseWidth, this.canvas.height / baseHeight, 1.0);

        // 3. Move context to center and apply scale for all menu elements
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(scale, scale);

        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 10;

        if (this.state === GameState.START_MENU) {
            const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
            const time = Date.now() / 1000;

            // Title with Premium Gradient
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.font = 'bold 96px "Outfit", sans-serif';
            const gradient = this.ctx.createLinearGradient(0, -200, 0, -110);
            gradient.addColorStop(0, '#ffffff'); // White
            gradient.addColorStop(1, '#ffea00'); // Gold

            this.ctx.fillStyle = gradient;
            this.ctx.shadowColor = 'rgba(255, 234, 0, 0.4)';
            this.ctx.shadowBlur = 25;
            this.ctx.fillText('EMOJILAND', 0, -150);

            // Controls & Info Card
            const cardWidth = 760;
            const cardHeight = 220;
            const cardX = -cardWidth / 2;
            const cardY = -90;

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
            this.ctx.fillText('🎮 CONTROLS', cardX + 40, cardY + 40);

            this.ctx.font = '20px "Outfit", sans-serif';
            this.ctx.fillStyle = '#ffffff';

            let ly = cardY + 80;
            const yStep = 32;
            this.ctx.fillText('Arrows/Joystick : Move Character', cardX + 40, ly); ly += yStep;
            this.ctx.fillText('A : Jump (Mobile 🦘)', cardX + 40, ly); ly += yStep;
            this.ctx.fillText('D : Throw Rock (Mobile ⚔️)', cardX + 40, ly); ly += yStep;
            this.ctx.fillText('S : Drop Bomb (Mobile 💣)', cardX + 40, ly);

            // Vertical Divider
            this.ctx.beginPath();
            this.ctx.moveTo(0, cardY + 30);
            this.ctx.lineTo(0, cardY + cardHeight - 30);
            this.ctx.stroke();

            // Right Column: Objectives
            this.ctx.font = 'bold 24px "Outfit", sans-serif';
            this.ctx.fillStyle = '#ffd54f';
            this.ctx.fillText('🎯 OBJECTIVES', 40, cardY + 40);

            this.ctx.font = '20px "Outfit", sans-serif';
            this.ctx.fillStyle = '#ffffff';
            let ry = cardY + 80;
            this.ctx.fillText('🪙 Collect All Coins and Power-ups', 40, ry); ry += yStep;
            this.ctx.fillText('☠️ Defeat All Enemies', 40, ry); ry += yStep;
            this.ctx.fillText('🏁 Reach the end with the best score', 40, ry); ry += yStep;
            this.ctx.fillText('🎲 Levels are always unique', 40, ry);

            // Pulsing 'Start' Text
            const alpha = 0.6 + 0.4 * Math.sin(time * 3);
            this.ctx.font = 'bold 32px "Outfit", sans-serif';
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = `rgba(255, 255, 255, ${alpha * 0.5})`;
            this.ctx.shadowBlur = 10;
            this.ctx.fillText(isMobile ? ' TOUCH TO START ' : '► PRESS ENTER TO START ◄', 0, cardY + cardHeight + 50);

            // Subtle Music Attribution
            this.ctx.shadowBlur = 0;
            this.ctx.font = '14px "Outfit", sans-serif';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillText('All copyright free music from Pixabay', 0, cardY + cardHeight + 100);

        } else if (this.state === GameState.GAME_OVER) {
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.font = 'bold 72px "Outfit", sans-serif';
            this.ctx.fillStyle = '#ff5252';
            this.ctx.fillText('Game Over', 0, -40);

            this.ctx.font = 'bold 28px "Outfit", sans-serif';
            this.ctx.fillStyle = 'white';
            const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
            this.ctx.fillText(isMobile ? 'Touch to Play Again' : 'Press ENTER to Play Again', 0, 40);
        } else if (this.state === GameState.VICTORY) {
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // Victory Card
            const cardWidth = 600;
            const cardHeight = 320;
            const cardX = -cardWidth / 2;
            const cardY = -cardHeight / 2;

            // Glassmorphism effect for card
            this.ctx.fillStyle = 'rgba(30, 60, 30, 0.85)';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
            this.ctx.shadowBlur = 20;
            this.ctx.beginPath();
            if (this.ctx.roundRect) {
                this.ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 20);
            } else {
                this.ctx.rect(cardX, cardY, cardWidth, cardHeight);
            }
            this.ctx.fill();

            // Card Border
            this.ctx.strokeStyle = 'rgba(255, 235, 59, 0.3)';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            this.ctx.shadowBlur = 0;

            // Level Complete Title
            this.ctx.font = 'bold 64px "Outfit", sans-serif';
            const gradient = this.ctx.createLinearGradient(0, -cardHeight / 2 + 40, 0, -cardHeight / 2 + 110);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, '#ffeb3b');
            gradient.addColorStop(1, '#fbc02d');

            this.ctx.fillStyle = gradient;
            this.ctx.shadowColor = 'rgba(255, 235, 59, 0.4)';
            this.ctx.shadowBlur = 15;
            this.ctx.fillText('Level Complete!', 0, -cardHeight / 2 + 80);

            // Score Section
            const totalScore = this.player ? this.player.score : 0;
            this.ctx.shadowBlur = 0;
            this.ctx.font = 'bold 24px "Outfit", sans-serif';
            this.ctx.fillStyle = '#ffd54f';
            this.ctx.fillText('TOTAL SCORE', 0, -cardHeight / 2 + 160);

            this.ctx.font = 'bold 56px "Outfit", sans-serif';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(`${totalScore}`, 0, -cardHeight / 2 + 210);

            this.ctx.font = '32px "Outfit", sans-serif';
            this.ctx.fillText('⭐', -120, -cardHeight / 2 + 210);
            this.ctx.fillText('⭐', 120, -cardHeight / 2 + 210);

            // Separation Line
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(-cardWidth / 2 + 100, -cardHeight / 2 + 250);
            this.ctx.lineTo(cardWidth / 2 - 100, -cardHeight / 2 + 250);
            this.ctx.stroke();

            // Next Level Instruction
            const time = Date.now() / 1000;
            const alpha = 0.7 + 0.3 * Math.sin(time * 4);
            this.ctx.font = 'bold 24px "Outfit", sans-serif';
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
            this.ctx.fillText(isMobile ? 'Touch to Play Next Level' : 'Press ENTER to Play Next Level', 0, -cardHeight / 2 + 285);
        } else if (this.state === GameState.PAUSED) {
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.font = 'bold 72px "Outfit", sans-serif';
            this.ctx.fillStyle = 'white';
            this.ctx.fillText('Paused', 0, 0);
        }
        this.ctx.restore();
    }
}

// Helper to draw a cached emoji centered at a position (for UI)
function ctx_drawCachedEmoji(ctx, cached, x, y) {
    ctx.drawImage(cached.canvas, x - cached.width / 2 + 12, y - cached.height / 2);
}
