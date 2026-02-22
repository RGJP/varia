import { Entity } from './Entity.js';
import { Physics } from '../Physics.js';
import { getEmojiCanvas } from '../EmojiCache.js';

export class Peanut extends Entity {
    constructor(x, y, vx, vy) {
        super(x, y, 20, 20);
        this.vx = vx;
        this.vy = vy;
        this.rotation = 0;
        this.rotationSpeed = (vx > 0 ? 1 : -1) * (10 + Math.random() * 8);
        this._cachedEmoji = getEmojiCanvas('🥜', 24, true);
    }

    update(dt, game) {
        this.vy += Physics.GRAVITY * dt;
        if (this.vy > Physics.TERMINAL_VELOCITY) {
            this.vy = Physics.TERMINAL_VELOCITY;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.rotation += this.rotationSpeed * dt;

        // Hit player
        if (!this.markedForDeletion && game.player.invulnerableTimer <= 0) {
            if (Physics.checkAABB(this, game.player.getHitbox())) {
                game.player.takeDamage(game);
                this.markedForDeletion = true;
                game.audio.playHit();
                game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
            }
        }

        // Hit platforms
        if (!this.markedForDeletion) {
            const platforms = game._visiblePlatforms;
            for (let i = 0; i < platforms.length; i++) {
                if (Physics.checkAABB(this, platforms[i])) {
                    this.markedForDeletion = true;
                    game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
                    break;
                }
            }
        }

        // Out of bounds cleanup
        if (Math.abs(this.x - game.player.x) > 2000 || this.y > game.lowestY) {
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
