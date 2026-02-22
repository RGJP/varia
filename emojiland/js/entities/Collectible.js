import { Entity } from './Entity.js';
import { getEmojiCanvas } from '../EmojiCache.js';

export class Collectible extends Entity {
    constructor(x, y, type = 'coin') {
        const isSpecial = type === 'health' || type === 'bomb' || type === 'diamond_powerup' || type === 'fire_powerup' || type === 'full_health';
        const size = isSpecial ? 50 : 30;
        super(x, y, size, size);
        this.baseY = y;
        this.time = Math.random() * Math.PI * 2;
        this.type = type;
        const emoji = type === 'health' ? '❤️' :
            type === 'bomb' ? '💣' :
                type === 'diamond_powerup' ? '🪨' :
                    type === 'fire_powerup' ? '🔥' :
                        type === 'full_health' ? '🧚' : '🪙';
        this.isPowerUp = type === 'diamond_powerup' || type === 'fire_powerup' || type === 'full_health';
        this.isReplenish = type === 'health' || type === 'bomb';
        this._cachedEmoji = getEmojiCanvas(emoji, size);
    }

    update(dt) {
        this.time += dt * 3;
        this.y = this.baseY + Math.sin(this.time) * 5;
    }

    draw(ctx) {
        const cached = this._cachedEmoji;
        ctx.drawImage(cached.canvas, this.x - (cached.width - this.width) / 2, this.y - (cached.height - this.height) / 2);

        if (this.isReplenish || this.isPowerUp) {
            const hoverMultiplier = this.isPowerUp ? 0.8 : 0.5;
            const pOffsetY = -(this.height * hoverMultiplier) + Math.sin(this.time * 2) * 3;

            ctx.save();
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const textX = this.x + this.width / 2;
            const textY = this.y + pOffsetY;

            ctx.lineJoin = 'round';
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#000000';

            const text = this.isPowerUp ? 'POWER UP' : '+';
            ctx.strokeText(text, textX, textY);

            ctx.fillStyle = '#FFD700'; // Same styling
            ctx.fillText(text, textX, textY);

            ctx.restore();
        }

        if (this.type === 'full_health') {
            if (!this._heartEmoji) {
                this._heartEmoji = getEmojiCanvas('💖', 20);
            }
            const numHearts = 6;
            const radius = 45;
            const timeOffset = this.time * 2;

            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            for (let i = 0; i < numHearts; i++) {
                const angle = timeOffset + (i * Math.PI * 2 / numHearts);
                const ox = Math.cos(angle) * radius - this._heartEmoji.width / 2;
                const oy = Math.sin(angle) * radius - this._heartEmoji.height / 2;
                ctx.drawImage(this._heartEmoji.canvas, ox, oy);
            }
            ctx.restore();
        }
    }
}
