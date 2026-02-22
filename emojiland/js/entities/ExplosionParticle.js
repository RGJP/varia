import { Entity } from './Entity.js';
import { getEmojiCanvas } from '../EmojiCache.js';

export class ExplosionParticle extends Entity {
    constructor(x, y) {
        super(x, y, 40, 40);
        this.life = 0.6; // Slightly longer life
        this.maxLife = 0.6;
        this._cachedEmoji = getEmojiCanvas('💥', 100); // Slightly better resolution
        this.scale = 0.1;
        // Random drift to make multiple look natural
        this.vx = (Math.random() - 0.5) * 150; // Slower drift
        this.vy = (Math.random() - 0.5) * 150;
    }

    update(dt) {
        this.life -= dt;
        if (this.life <= 0) {
            this.markedForDeletion = true;
        }
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.scale += dt * 3.0; // Expands at a controlled rate to match 120px radius
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.scale(this.scale, this.scale);

        const cached = this._cachedEmoji;
        ctx.drawImage(cached.canvas, -cached.width / 2, -cached.height / 2);

        ctx.restore();
    }
}
