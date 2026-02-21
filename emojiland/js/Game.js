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

export const GameState = {
    START_MENU: 0,
    PLAYING: 1,
    GAME_OVER: 2,
    VICTORY: 3
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

        this.audio = new AudioEngine();
        this.particles = new ParticleSystem();
        this.background = new Background(canvas.width, canvas.height);

        this.hitStopTimer = 0;

        this.lowestY = 800;

        this.totalCoins = 0;
        this.coinsCollected = 0;
        this.totalEnemies = 0;
        this.enemiesDefeated = 0;

        // Pre-cache UI emojis
        this._heartCache = getEmojiCanvas('❤️', 24);
        this._coinCache = getEmojiCanvas('🪙', 24);
        this._skullCache = getEmojiCanvas('☠️', 24);
        this._checkCache = getEmojiCanvas('✅', 24);
    }

    initLevel() {
        clearEmojiCache();
        const levelData = loadLevel();
        this.platforms = levelData.platforms;
        this.enemies = levelData.enemies;
        this.collectibles = levelData.collectibles;
        this.vines = levelData.vines || [];
        this.currentTheme = levelData.theme;
        this.rocks = [];
        this.enemyProjectiles = [];

        this.totalCoins = this.collectibles.length;
        this.coinsCollected = 0;
        this.totalEnemies = this.enemies.length;
        this.enemiesDefeated = 0;

        this.background.setTheme(this.currentTheme);

        this.lowestY = Math.max(...this.platforms.map(p => p.y + p.height)) + 200;

        this.player = new Player(100, 300);
        this.camera.x = 0;
        this.audio.playBackgroundMusic();

        // Re-cache UI emojis
        this._heartCache = getEmojiCanvas('❤️', 24);
        this._coinCache = getEmojiCanvas('🪙', 24);
        this._skullCache = getEmojiCanvas('☠️', 24);
        this._checkCache = getEmojiCanvas('✅', 24);
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
            if (this.state === GameState.PLAYING) {
                mobileUI.classList.add('active');
            } else {
                mobileUI.classList.remove('active');
            }
        }

        if (this.hitStopTimer > 0) {
            this.hitStopTimer -= dt;
            this.particles.update(dt);
            // Camera still updates shake during hit-stop
            this.camera.update(this.player, dt);
            return;
        }

        if (this.state === GameState.START_MENU) {
            if (this.input.isJustPressed('Enter') || this.input.isJustPressed('TouchScreen')) {
                this.initLevel();
                this.state = GameState.PLAYING;
            }
        }
        else if (this.state === GameState.PLAYING) {
            this.player.update(dt, this.input, this.platforms, this);

            if (this.player.health <= 0 || this.player.y > this.lowestY) {
                this.state = GameState.GAME_OVER;
                this.audio.fadeOutMusic(3000);
            }

            this.enemies.forEach(enemy => enemy.update(dt, this));
            this.collectibles.forEach(col => col.update(dt));
            this.rocks.forEach(rock => rock.update(dt, this));
            this.enemyProjectiles.forEach(proj => proj.update(dt, this));

            this.enemies = this.enemies.filter(e => !e.markedForDeletion);
            this.collectibles = this.collectibles.filter(c => !c.markedForDeletion);
            this.rocks = this.rocks.filter(r => !r.markedForDeletion);
            this.enemyProjectiles = this.enemyProjectiles.filter(p => !p.markedForDeletion);

            this.camera.update(this.player, dt);
            this.particles.update(dt);
        }
        else if (this.state === GameState.GAME_OVER || this.state === GameState.VICTORY) {
            if (this.input.isJustPressed('Enter') || this.input.isJustPressed('TouchScreen')) {
                this.initLevel();
                this.state = GameState.PLAYING;
            }
        }
    }

    triggerVictory() {
        this.state = GameState.VICTORY;
        this.audio.playWin();
        this.audio.fadeOutMusic(3000);
    }

    // Check if an entity is within the visible viewport (with margin)
    _isVisible(entity, margin = 200) {
        const left = this.camera.x - margin;
        const right = this.camera.x + this.canvas.width + margin;
        const top = this.camera.y - margin;
        const bottom = this.camera.y + this.canvas.height + margin;
        return (
            entity.x + entity.width > left &&
            entity.x < right &&
            entity.y + entity.height > top &&
            entity.y < bottom
        );
    }

    draw() {
        this.background.draw(this.ctx, this.camera.x, this.camera.y);

        if (this.state === GameState.PLAYING) {
            this.ctx.save();
            this.ctx.translate(-this.camera.x + this.camera.shakeOffsetX, -this.camera.y + this.camera.shakeOffsetY);

            // Viewport culling: only draw entities visible on screen
            const vines = this.vines;
            for (let i = 0; i < vines.length; i++) {
                if (this._isVisible(vines[i], 300)) vines[i].draw(this.ctx);
            }

            const platforms = this.platforms;
            for (let i = 0; i < platforms.length; i++) {
                if (this._isVisible(platforms[i], 300)) platforms[i].draw(this.ctx);
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

            this.player.draw(this.ctx);
            this.particles.draw(this.ctx);

            this.ctx.restore();
        }

        this.drawUI();
    }

    drawUI() {
        if (this.state === GameState.PLAYING) {
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

            // 2. Draw Coins indicator
            const coinCached = this._coinCache;
            ctx_drawCachedEmoji(this.ctx, coinCached, startX, currentY);

            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 24px "Outfit", sans-serif';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 4;
            this.ctx.shadowOffsetY = 2;

            if (this.totalCoins > 0 && this.coinsCollected >= this.totalCoins) {
                ctx_drawCachedEmoji(this.ctx, this._checkCache, startX + 32, currentY);
            } else {
                this.ctx.fillText(`${this.coinsCollected}/${this.totalCoins}`, startX + 32, currentY + 2);
            }

            currentY += lineSpacing;

            // 3. Draw Enemies indicator
            const skullCached = this._skullCache;
            ctx_drawCachedEmoji(this.ctx, skullCached, startX, currentY);

            if (this.totalEnemies > 0 && this.enemiesDefeated >= this.totalEnemies) {
                ctx_drawCachedEmoji(this.ctx, this._checkCache, startX + 32, currentY);
            } else {
                this.ctx.fillText(`${this.enemiesDefeated}/${this.totalEnemies}`, startX + 32, currentY + 2);
            }

            this.ctx.restore();
        } else {
            // Standard overlays for non-playing states
            this.drawMenuOverlays();
        }
    }

    drawMenuOverlays() {
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 10;

        if (this.state === GameState.START_MENU) {
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.font = 'bold 84px "Outfit", sans-serif';

            // Draw "EMOJILAND" with a gradient
            const gradient = this.ctx.createLinearGradient(0, this.canvas.height / 2 - 100, 0, this.canvas.height / 2 - 20);
            gradient.addColorStop(0, '#fff176');
            gradient.addColorStop(1, '#fbc02d');
            this.ctx.fillStyle = gradient;
            this.ctx.fillText('EMOJILAND', this.canvas.width / 2, this.canvas.height / 2 - 60);

            this.ctx.font = 'bold 28px "Outfit", sans-serif';
            this.ctx.fillStyle = 'white';
            const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
            this.ctx.fillText(isMobile ? 'Touch to Start' : 'Press ENTER to Start', this.canvas.width / 2, this.canvas.height / 2 + 40);

            this.ctx.font = '20px "Outfit", sans-serif';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.fillText('← → to Move | A to Jump | D to Throw Rocks', this.canvas.width / 2, this.canvas.height / 2 + 100);
            this.ctx.fillText('or use touch controls on mobile (HORIZONTAL)', this.canvas.width / 2, this.canvas.height / 2 + 130);
        } else if (this.state === GameState.GAME_OVER) {
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.font = 'bold 72px "Outfit", sans-serif';
            this.ctx.fillStyle = '#ff5252';
            this.ctx.fillText('IZDED', this.canvas.width / 2, this.canvas.height / 2 - 40);

            this.ctx.font = 'bold 28px "Outfit", sans-serif';
            this.ctx.fillStyle = 'white';
            const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
            this.ctx.fillText(isMobile ? 'Touch to Continue' : 'Press ENTER to Continue', this.canvas.width / 2, this.canvas.height / 2 + 40);
        } else if (this.state === GameState.VICTORY) {
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.font = 'bold 54px "Outfit", sans-serif';

            const gradient = this.ctx.createLinearGradient(0, this.canvas.height / 2 - 80, 0, this.canvas.height / 2);
            gradient.addColorStop(0, '#ffeb3b');
            gradient.addColorStop(1, '#ff9800');
            this.ctx.fillStyle = gradient;
            this.ctx.fillText('Level Complete! ✨', this.canvas.width / 2, this.canvas.height / 2 - 40);

            this.ctx.font = 'bold 28px "Outfit", sans-serif';
            this.ctx.fillStyle = 'white';
            const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
            this.ctx.fillText(isMobile ? 'Touch to Continue' : 'Press ENTER to Continue', this.canvas.width / 2, this.canvas.height / 2 + 40);
        }
        this.ctx.restore();
    }
}

// Helper to draw a cached emoji centered at a position (for UI)
function ctx_drawCachedEmoji(ctx, cached, x, y) {
    ctx.drawImage(cached.canvas, x - cached.width / 2 + 12, y - cached.height / 2);
}
