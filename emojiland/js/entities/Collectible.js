import { Entity } from './Entity.js';
import { getEmojiCanvas } from '../EmojiCache.js';

export class Collectible extends Entity {
    constructor(x, y, type = 'coin', letter = null) {
        const isSpecial = type === 'health' || type === 'bomb' || type === 'diamond_powerup' || type === 'fire_powerup' || type === 'frost_powerup' || type === 'full_health' || type === 'wing_powerup' || type === 'letter';
        const size = isSpecial ? 50 : 30;
        super(x, y, size, size);
        this.baseY = y;
        this.time = Math.random() * Math.PI * 2;
        this.type = type;
        this.letter = (type === 'letter' && letter) ? String(letter).toUpperCase() : null;
        const emoji = type === 'health' ? '\u2764\uFE0F' :
            type === 'bomb' ? '\u{1F4A3}' :
                type === 'diamond_powerup' ? '\u{1FAA8}' :
                    type === 'fire_powerup' ? '\u{1F525}' :
                        type === 'frost_powerup' ? '\u2744\uFE0F' :
                        type === 'full_health' ? '\u{1F9DA}' :
                            type === 'wing_powerup' ? '\u{1FAB6}' :
                                type === 'letter' ? (this.letter || 'E') : '\u{1FA99}';
        this.isPowerUp = type === 'diamond_powerup' || type === 'fire_powerup' || type === 'frost_powerup' || type === 'full_health' || type === 'wing_powerup';
        this.isReplenish = type === 'health' || type === 'bomb';
        this._cachedEmoji = getEmojiCanvas(emoji, size);
    }

    update(dt) {
        this.time += dt * 3;
        this.y = this.baseY + Math.sin(this.time) * 5;
    }

    draw(ctx) {
        if (this.type === 'letter') {
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            const pulse = 0.72 + Math.sin(this.time * 5) * 0.28;
            const tileSize = this.width - 6;
            const tileX = cx - tileSize / 2;
            const tileY = cy - tileSize / 2;
            const radius = 9;

            ctx.save();

            // Outer glow ring for distance readability.
            const glow = ctx.createRadialGradient(cx, cy, 8, cx, cy, tileSize * 0.9);
            glow.addColorStop(0, `rgba(255, 240, 130, ${0.42 * pulse})`);
            glow.addColorStop(1, 'rgba(255, 220, 90, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(cx, cy, tileSize * 0.9, 0, Math.PI * 2);
            ctx.fill();

            // Main collectible tile.
            const tileGrad = ctx.createLinearGradient(tileX, tileY, tileX, tileY + tileSize);
            tileGrad.addColorStop(0, '#ffe082');
            tileGrad.addColorStop(1, '#ffb300');
            ctx.fillStyle = tileGrad;
            if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(tileX, tileY, tileSize, tileSize, radius);
                ctx.fill();
            } else {
                ctx.fillRect(tileX, tileY, tileSize, tileSize);
            }

            // Border and highlight
            ctx.strokeStyle = '#8a5200';
            ctx.lineWidth = 3;
            if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(tileX, tileY, tileSize, tileSize, radius);
                ctx.stroke();
            } else {
                ctx.strokeRect(tileX, tileY, tileSize, tileSize);
            }
            ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
            if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(tileX + 3, tileY + 3, tileSize - 6, Math.max(8, tileSize * 0.22), 6);
                ctx.fill();
            } else {
                ctx.fillRect(tileX + 3, tileY + 3, tileSize - 6, Math.max(8, tileSize * 0.22));
            }

            // Letter mark
            const letter = this.letter || 'E';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 30px "Outfit", sans-serif';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 5;
            ctx.strokeStyle = '#3a2300';
            ctx.strokeText(letter, cx, cy + 1);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(letter, cx, cy + 1);

            ctx.restore();
            return;
        }

        const cached = this._cachedEmoji;
        ctx.drawImage(cached.canvas, this.x - (cached.width - this.width) / 2, this.y - (cached.height - this.height) / 2);

        if (this.isReplenish || this.isPowerUp) {
            const hoverMultiplier = this.isPowerUp ? 0.6 : 0.5;
            const pOffsetY = -(this.height * hoverMultiplier) + Math.sin(this.time * 2) * 3;

            ctx.save();
            ctx.font = this.isPowerUp ? 'bold 20px Arial' : 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const textX = this.x + this.width / 2;
            const textY = this.y + pOffsetY;

            ctx.lineJoin = 'round';
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#000000';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            const text = this.isPowerUp ? 'POWER UP' : '+';
            ctx.strokeText(text, textX, textY);

            ctx.fillStyle = '#FFD700'; // Same styling
            ctx.fillText(text, textX, textY);

            ctx.restore();
        }

        if (this.type === 'full_health') {
            if (!this._heartEmoji) {
                this._heartEmoji = getEmojiCanvas('\u{1F496}', 20);
            }
            const numHearts = 6;
            const radius = 45;
            const timeOffset = this.time * 0.9;

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
