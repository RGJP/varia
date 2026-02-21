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
        this._cachedEmoji = getEmojiCanvas('🔥', 40);
    }

    update(dt, game) {
        this.lifetime -= dt;
        if (this.lifetime <= 0) {
            this.markedForDeletion = true;
            if (game && game.particles) game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
            return;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (!this.markedForDeletion && game && game.player && game.player.invulnerableTimer <= 0) {
            if (Physics.checkAABB(this, game.player.getHitbox())) {
                game.player.takeDamage(game);
                this.markedForDeletion = true;
                if (game.audio) game.audio.playHit();
                if (game.particles) game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
            }
        }

        if (!this.markedForDeletion && game && game.platforms) {
            for (let platform of game.platforms) {
                if (Physics.checkAABB(this, platform)) {
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
            this._cachedEmoji = getEmojiCanvas(currentEmoji, 40);
            this._cachedEmojiKey = currentEmoji;
        }

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        // point flame in direction of travel
        this.rotation = this.facingRight ? Math.PI / 2 : -Math.PI / 2;
        ctx.rotate(this.rotation);

        const cached = this._cachedEmoji;
        ctx.drawImage(cached.canvas, -cached.width / 2, -cached.height / 2);

        ctx.restore();
    }
}
