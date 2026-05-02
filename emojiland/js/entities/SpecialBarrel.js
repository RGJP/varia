import { Entity } from './Entity.js';
import { Physics } from '../Physics.js';
import { getEmojiCanvas } from '../EmojiCache.js';

export class SpecialBarrel extends Entity {
    constructor(x, y, size = 78) {
        super(x, y, size, size);
        this.size = size;
        this.time = Math.random() * Math.PI * 2;
        this.triggered = false;
        this._cachedEmoji = getEmojiCanvas('🍯', size);
        this._cachedStar = getEmojiCanvas('⭐', Math.round(size * 0.72));
    }

    update(dt, game) {
        this.time += dt;
        if (this.triggered || this.markedForDeletion || !game || !game.player) return;
        if (game.bonusZone) return;

        const playerBox = typeof game.player.getHitbox === 'function'
            ? game.player.getHitbox()
            : game.player;
        if (!Physics.checkAABB(this, playerBox)) return;

        this.triggered = true;
        if (typeof game.enterBonusZone === 'function') {
            game.enterBonusZone(this);
        }
    }

    draw(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const bob = Math.sin(this.time * 2.1) * 3;
        const tilt = Math.sin(this.time * 1.8) * 0.055;
        const labelBob = Math.sin(this.time * 4.2) * 5;
        const labelPulse = 0.86 + Math.sin(this.time * 5.4) * 0.14;
        const cached = this._cachedEmoji;
        const star = this._cachedStar;

        ctx.save();
        ctx.translate(cx, this.y - 54 + Math.sin(this.time * 3.2) * 6);
        ctx.rotate(Math.sin(this.time * 2.7) * 0.16);
        ctx.scale(0.92 + Math.sin(this.time * 5.0) * 0.08, 0.92 + Math.sin(this.time * 5.0) * 0.08);
        ctx.shadowColor = 'rgba(255, 235, 59, 0.75)';
        ctx.shadowBlur = 16;
        ctx.drawImage(star.canvas, -star.width / 2, -star.height / 2);
        ctx.restore();

        ctx.save();
        ctx.translate(cx, cy + bob);
        ctx.rotate(tilt);
        ctx.drawImage(cached.canvas, -cached.width / 2, -cached.height / 2);
        ctx.restore();

        ctx.save();
        ctx.translate(cx, this.y - 8 + labelBob);
        ctx.scale(labelPulse, labelPulse);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 18px "Outfit", sans-serif';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(50, 25, 0, 0.92)';
        ctx.shadowColor = 'rgba(255, 224, 102, 0.55)';
        ctx.shadowBlur = 10;
        ctx.strokeText('BONUS', 0, 0);
        ctx.fillStyle = '#ffe066';
        ctx.fillText('BONUS', 0, 0);
        ctx.restore();
    }
}
