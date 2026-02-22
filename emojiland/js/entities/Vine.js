import { Entity } from './Entity.js';
import { getEmojiCanvas } from '../EmojiCache.js';

export class Vine extends Entity {
    constructor(x, y, height) {
        // Vine is skinny
        super(x, y, 24, height);
        // We'll use the vine/herb emoji
        this._cachedEmoji = getEmojiCanvas('🌿', 32);
    }

    update(dt) {
        // Static entity
    }

    draw(ctx) {
        const cached = this._cachedEmoji;
        // Calculate how many emojis we need to stack to reach the height
        const count = Math.ceil(this.height / 30);

        ctx.save();
        ctx.beginPath();
        ctx.rect(this.x - 20, this.y, this.width + 40, this.height);
        ctx.clip();
        for (let i = 0; i < count; i++) {
            // Draw stacked vertically
            ctx.drawImage(cached.canvas, this.x + this.width / 2 - cached.width / 2, this.y + i * 30);
        }
        ctx.restore();
    }
}
