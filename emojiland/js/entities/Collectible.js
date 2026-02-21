import { Entity } from './Entity.js';
import { getEmojiCanvas } from '../EmojiCache.js';

export class Collectible extends Entity {
    constructor(x, y) {
        super(x, y, 30, 30);
        this.baseY = y;
        this.time = Math.random() * Math.PI * 2;
        this._cachedEmoji = getEmojiCanvas('🪙', 30);
    }

    update(dt) {
        this.time += dt * 3;
        this.y = this.baseY + Math.sin(this.time) * 5;
    }

    draw(ctx) {
        const cached = this._cachedEmoji;
        ctx.drawImage(cached.canvas, this.x - (cached.width - 30) / 2, this.y - (cached.height - 30) / 2);
    }
}
