import { Entity } from './Entity.js';
import { getEmojiCanvas } from '../EmojiCache.js';

export class SafeBarrel extends Entity {
    constructor(centerX, centerY, size = 100) {
        super(centerX - size / 2, centerY - size / 2, size, size);
        this.centerX = centerX;
        this.centerY = centerY;
        this.size = size;
        this.time = Math.random() * Math.PI * 2;
        this._cachedEmoji = getEmojiCanvas('🍯', size);
    }

    update(dt) {
        this.time += dt;
    }

    containsEntity(entity, padding = 8) {
        if (!entity) return false;
        const ex = entity.x + entity.width / 2;
        const ey = entity.y + entity.height / 2;
        // Honey-pot glyph appears visually right-heavy; keep trigger on pot body center.
        const triggerX = this.centerX + this.width * 0.24;
        const triggerY = this.centerY + this.height * 0.06;
        const dx = ex - triggerX;
        const dy = ey - triggerY;
        const entryRadius = this.width * 0.39;
        if (Math.hypot(dx, dy) <= (entryRadius + padding)) return true;

        // Edge magnet: if player center reaches outer body bounds, immediately capture.
        const edgePadX = this.width * 0.06 + padding;
        const edgePadY = this.height * 0.11 + padding;
        const left = this.x - edgePadX;
        const right = this.x + this.width + edgePadX;
        const top = this.y - edgePadY;
        const bottom = this.y + this.height + edgePadY;
        return ex >= left && ex <= right && ey >= top && ey <= bottom;
    }

    shouldPullInFromBelow(entity) {
        if (!entity) return false;
        const ex = entity.x + entity.width / 2;
        const ey = entity.y + entity.height / 2;
        const bottomY = this.centerY + this.height * 0.5;
        const horizontalReach = this.width * 0.42;
        const verticalReach = this.height * 0.46;
        const verticalOffset = ey - bottomY;

        const isUnderBottomLip = verticalOffset >= -entity.height * 0.25 && verticalOffset <= verticalReach;
        const isAligned = Math.abs(ex - this.centerX) <= horizontalReach;
        const isMovingTowardBarrel = entity.vy < 80;
        return isUnderBottomLip && isAligned && isMovingTowardBarrel;
    }

    draw(ctx) {
        const wobbleY = Math.sin(this.time * 1.6) * 2.2;
        const tilt = Math.sin(this.time * 1.4) * 0.06;
        const cached = this._cachedEmoji;

        ctx.save();

        ctx.translate(this.centerX, this.centerY + wobbleY);
        ctx.rotate(tilt);

        // Soft smoke plume, positioned above the opening of the honey pot.
        const smokeBaseX = this.size * 0.08;
        const smokeBaseY = -this.size * 0.53;
        for (let i = 0; i < 4; i++) {
            const t = this.time * 1.5 + i * 0.9;
            const px = smokeBaseX + Math.sin(t) * (4.5 + i * 3.2);
            const py = smokeBaseY - i * 11 + Math.cos(t * 0.8) * 2.3;
            const r = 8.5 + i * 3.1;
            const alpha = 0.28 - i * 0.048;
            ctx.fillStyle = `rgba(235, 235, 235, ${Math.max(0.08, alpha)})`;
            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.drawImage(cached.canvas, -cached.width / 2, -cached.height / 2);
        ctx.restore();
    }
}

// Backward-compatible export name for existing imports.
export { SafeBarrel as SafeBubble };
