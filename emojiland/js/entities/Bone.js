import { Entity } from './Entity.js';
import { Physics } from '../Physics.js';
import { getEmojiCanvas } from '../EmojiCache.js';

export class Bone extends Entity {
    constructor(x, y, facingRight) {
        // slightly larger or irregular shape for visual
        super(x, y, 30, 30);
        this.speed = 400;
        this.vx = facingRight ? this.speed : -this.speed;
        this.vy = -200; // tiny bit of arc
        this.facingRight = facingRight;
        this.rotation = 0;
        this.emojiOverride = null;
        // Default cache with bone; will be lazily updated if emojiOverride is set
        this._cachedEmoji = getEmojiCanvas('🦴', 40, true);
        this._cachedEmojiKey = '🦴';
    }

    update(dt, game) {
        this.vy += Physics.GRAVITY * dt;
        if (this.vy > Physics.TERMINAL_VELOCITY) {
            this.vy = Physics.TERMINAL_VELOCITY;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.rotation += (this.vx > 0 ? 15 : -15) * dt;

        // Check if Bone hits the player
        if (!this.markedForDeletion && game.player.invulnerableTimer <= 0) {
            if (Physics.checkAABB(this, game.player.getHitbox())) {
                game.player.takeDamage(game);
                this.markedForDeletion = true;
                game.audio.playHit();
                game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
            }
        }

        // Check if Bone hits platforms
        if (!this.markedForDeletion) {
            const platforms = game._visiblePlatforms;
            for (let i = 0; i < platforms.length; i++) {
                const platform = platforms[i];
                if (Physics.checkAABB(this, platform)) {
                    this.markedForDeletion = true;
                    game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
                    break;
                }
            }
        }

        // Delete if it goes offscreen or falls too far
        if (Math.abs(this.x - game.player.x) > 2000 || this.y > game.lowestY) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        // Update cache if emoji override changed
        const currentEmoji = this.emojiOverride || '🦴';
        if (currentEmoji !== this._cachedEmojiKey) {
            this._cachedEmoji = getEmojiCanvas(currentEmoji, 40, true);
            this._cachedEmojiKey = currentEmoji;
        }

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        const cached = this._cachedEmoji;
        ctx.drawImage(cached.canvas, -cached.width / 2, -cached.height / 2);

        ctx.restore();
    }
}
