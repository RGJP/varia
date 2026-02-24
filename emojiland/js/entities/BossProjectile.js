import { Entity } from './Entity.js';
import { Physics } from '../Physics.js';
import { getEmojiCanvas } from '../EmojiCache.js';

// projectileType: 'drumstick' | 'stone' | 'skewer' | 'web' | 'wrench'
export class BossProjectile extends Entity {
    constructor(x, y, vx, vy, projectileType) {
        super(x, y, 40, 40);
        this.vx = vx;
        this.vy = vy;
        this.projectileType = projectileType;
        this.rotation = 0;
        this.bounceCount = 0;

        switch (projectileType) {
            case 'drumstick':
                this.emoji = String.fromCodePoint(0x1F357);
                this.maxBounces = 2;
                break;
            case 'stone':
                this.emoji = String.fromCodePoint(0x1F94C);
                this.maxBounces = 0;
                break;
            case 'skewer':
                this.emoji = String.fromCodePoint(0x1F362);
                this.maxBounces = 0;
                break;
            case 'web':
                this.emoji = String.fromCodePoint(0x1F578) + '\uFE0F';
                this.maxBounces = 0;
                this.webState = 'AIRBORNE';
                this.webPlatform = null;
                this.webFallStartY = y;
                this.webFallTimer = 0;
                this.webFallMaxTime = 3.5;
                this.webFallDespawnDistance = 900;
                break;
            case 'wrench':
                this.emoji = String.fromCodePoint(0x1F527);
                this.maxBounces = 0;
                this.ignoreGravity = true;
                break;
            default:
                this.emoji = String.fromCodePoint(0x1FAA8);
                this.maxBounces = 0;
                break;
        }

        this._cachedEmoji = getEmojiCanvas(this.emoji, this.projectileType === 'web' ? 50 : 44);
    }

    update(dt, game) {
        if (this.projectileType === 'web') {
            this._updateWeb(dt, game);
            return;
        }

        if (!this.ignoreGravity) {
            // Apply gravity
            this.vy += Physics.GRAVITY * dt;
            if (this.vy > Physics.TERMINAL_VELOCITY) this.vy = Physics.TERMINAL_VELOCITY;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.rotation += (this.vx > 0 ? 6 : -6) * dt;

        if (this.markedForDeletion) return;

        // Player collision
        if (game.player.invulnerableTimer <= 0) {
            if (Physics.checkAABB(this, game.player.getHitbox())) {
                game.player.takeDamage(game);
                game.audio.playHit();
                game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);

                // ?? skewer: slow + stun the player
                if (this.projectileType === 'skewer') {
                    game.player.slowTimer = 1.2;
                    game.player.stunTimer = 0.3;
                } else if (this.projectileType === 'web') {
                    // Webs briefly lock movement and deal 1 damage.
                    game.player.stunTimer = Math.max(game.player.stunTimer, 0.5);
                }

                this.markedForDeletion = true;
                return;
            }
        }

        // Platform collision
        const platforms = game._visiblePlatforms;
        for (let i = 0; i < platforms.length; i++) {
            const p = platforms[i];
            if (Physics.checkAABB(this, p)) {
                if (this.projectileType === 'drumstick' && this.bounceCount < this.maxBounces) {
                    // Bounce: reverse vy, lose a bit of energy
                    this.vy = -Math.abs(this.vy) * 0.65;
                    this.y = p.y - this.height;
                    this.bounceCount++;
                    game.particles.emitHit(this.x + this.width / 2, p.y);
                } else if (this.projectileType === 'stone') {
                    // Shockwave: burst of hit particles around impact point
                    const cx = this.x + this.width / 2;
                    const cy = p.y;
                    for (let k = 0; k < 8; k++) {
                        game.particles.emitHit(cx + Math.cos(k * Math.PI / 4) * 20, cy + Math.sin(k * Math.PI / 4) * 10);
                    }
                    this.markedForDeletion = true;
                } else {
                    game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
                    this.markedForDeletion = true;
                }
                break;
            }
        }

        // Off-screen cleanup
        if (Math.abs(this.x - game.player.x) > 2000 || this.y > game.lowestY) {
            this.markedForDeletion = true;
        }
    }

    _updateWeb(dt, game) {
        const prevBottom = this.y + this.height;

        if (this.webState === 'SLIDING') {
            this.x += this.vx * dt;
            this.y = this.webPlatform.y - this.height;
            this.vy = 0;
        } else {
            this.vy += Physics.GRAVITY * dt;
            if (this.vy > Physics.TERMINAL_VELOCITY) this.vy = Physics.TERMINAL_VELOCITY;
            this.x += this.vx * dt;
            this.y += this.vy * dt;
        }

        this.rotation += (this.vx > 0 ? 6 : -6) * dt;
        if (this.markedForDeletion) return;

        // Player collision
        if (game.player.invulnerableTimer <= 0 && Physics.checkAABB(this, game.player.getHitbox())) {
            game.player.takeDamage(game);
            game.audio.playHit();
            game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
            game.player.stunTimer = Math.max(game.player.stunTimer, 0.5);
            this.markedForDeletion = true;
            return;
        }

        if (this.webState === 'AIRBORNE') {
            const platforms = game._visiblePlatforms;
            for (let i = 0; i < platforms.length; i++) {
                const p = platforms[i];
                const overlapsX = this.x + this.width > p.x && this.x < p.x + p.width;
                const crossedTop = prevBottom <= p.y && this.y + this.height >= p.y;
                if (this.vy >= 0 && overlapsX && crossedTop) {
                    this.webState = 'SLIDING';
                    this.webPlatform = p;
                    this.y = p.y - this.height;
                    this.vy = 0;
                    break;
                }
            }
        }

        if (this.webState === 'SLIDING') {
            const p = this.webPlatform;
            const stillOnSurface = p && this.x + this.width > p.x && this.x < p.x + p.width;
            if (!stillOnSurface) {
                this.webState = 'FALLING';
                this.webPlatform = null;
                this.webFallStartY = this.y;
                this.webFallTimer = 0;
            }
        } else if (this.webState === 'FALLING') {
            this.webFallTimer += dt;
            const fallenDistance = this.y - this.webFallStartY;
            if (fallenDistance >= this.webFallDespawnDistance || this.webFallTimer >= this.webFallMaxTime) {
                this.markedForDeletion = true;
            }
        }

        // Keep airborne webs bounded vertically if they never land.
        if (this.webState === 'AIRBORNE' && this.y > game.lowestY) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        const cached = this._cachedEmoji;
        ctx.drawImage(cached.canvas, -cached.width / 2, -cached.height / 2);
        ctx.restore();
    }
}

