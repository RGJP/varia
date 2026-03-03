import { Entity } from './Entity.js';
import { Physics } from '../Physics.js';
import { getEmojiCanvas } from '../EmojiCache.js';

export class Fireball extends Entity {
    constructor(x, y, facingRight) {
        // big fireball
        super(x, y, 35, 35);
        this.speed = 350; // dodgable speed
        this.vx = facingRight ? this.speed : -this.speed;
        this.vy = 0;
        this.facingRight = facingRight;
        this.rotation = 0;
        this.lifetime = 2.0 + Math.random() * 1.0; // burns out after 2-3 seconds
        this.emojiOverride = null;
        this._cachedEmojiKey = '🔥';
        this._cachedEmoji = getEmojiCanvas('🔥', 40, true);
        this._rockCandidates = [];
        this._platformCandidates = [];
    }

    update(dt, game) {
        this.lifetime -= dt;
        if (this.lifetime <= 0) {
            this.markedForDeletion = true;
            if (game && game.particles) game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
            return;
        }

        // Homing logic
        if (game && game.player) {
            const dx = game.player.x + game.player.width / 2 - (this.x + this.width / 2);
            const dy = game.player.y + game.player.height / 2 - (this.y + this.height / 2);
            const dist = Math.hypot(dx, dy);

            if (dist > 0) {
                // Slower turning rate for a more dodgable missile feel
                const turnSpeed = 200 * dt;
                const targetVx = (dx / dist) * this.speed;
                const targetVy = (dy / dist) * this.speed;

                // Gradually adjust current velocity towards target velocity
                this.vx += (targetVx - this.vx) * (turnSpeed / this.speed);
                this.vy += (targetVy - this.vy) * (turnSpeed / this.speed);

                // Maintain constant speed
                const currentSpeed = Math.hypot(this.vx, this.vy);
                if (currentSpeed > 0) {
                    this.vx = (this.vx / currentSpeed) * this.speed;
                    this.vy = (this.vy / currentSpeed) * this.speed;
                }
            }
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Check if hit by player Rock
        if (!this.markedForDeletion && game && game.rocks) {
            const rocks = (typeof game.queryRocksInAABB === 'function')
                ? game.queryRocksInAABB(this.x, this.y, this.x + this.width, this.y + this.height, this._rockCandidates)
                : game.rocks;
            for (let i = 0; i < rocks.length; i++) {
                const rock = rocks[i];
                if (!rock.markedForDeletion && Physics.checkAABB(this, rock)) {
                    this.markedForDeletion = true;
                    rock.markedForDeletion = true;
                    if (game.audio) game.audio.playHit();
                    if (game.particles) game.particles.emitExplosion(this.x + this.width / 2, this.y + this.height / 2, 'orange');
                    if (game.player) game.player.score += 25;
                    return; // Stop processing this fireball
                }
            }
        }

        if (!this.markedForDeletion && game && game.player && game.player.invulnerableTimer <= 0) {
            if (Physics.checkAABB(this, game.player.getHitbox())) {
                game.player.takeDamage(game);
                this.markedForDeletion = true;
                if (game.audio) game.audio.playHit();
                if (game.particles) game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
            }
        }

        if (!this.markedForDeletion && game && game._visiblePlatforms) {
            const platforms = (typeof game.queryVisiblePlatformsInAABB === 'function')
                ? game.queryVisiblePlatformsInAABB(this.x, this.y, this.x + this.width, this.y + this.height, this._platformCandidates)
                : game._visiblePlatforms;
            for (let i = 0; i < platforms.length; i++) {
                if (Physics.checkAABB(this, platforms[i])) {
                    this.markedForDeletion = true;
                    if (game.particles) game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
                    break;
                }
            }
        }

        if (game && game.player && Math.abs(this.x - game.player.x) > 2000) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        const currentEmoji = this.emojiOverride || '🔥';
        if (currentEmoji !== this._cachedEmojiKey) {
            this._cachedEmoji = getEmojiCanvas(currentEmoji, 40, true);
            this._cachedEmojiKey = currentEmoji;
        }

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        // point flame in direction of travel
        this.rotation = Math.atan2(this.vy, this.vx) + Math.PI / 2;
        ctx.rotate(this.rotation);

        const cached = this._cachedEmoji;
        ctx.drawImage(cached.canvas, -cached.width / 2, -cached.height / 2);

        ctx.restore();
    }
}
