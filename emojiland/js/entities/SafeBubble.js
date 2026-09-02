import { Entity } from './Entity.js';
import { getEmojiCanvas } from '../EmojiCache.js';

export class SafeBarrel extends Entity {
    constructor(centerX, centerY, size = 100, isRotator = false, holdDuration = 0.3, initialAngle = 0, isStepped = true) {
        super(centerX - size / 2, centerY - size / 2, size, size);
        this.centerX = centerX;
        this.centerY = centerY;
        this.size = size;
        this.time = Math.random() * Math.PI * 2;
        this.isRotator = !!isRotator;
        this.isStepped = !!isStepped;
        this.holdDuration = Math.max(0.1, holdDuration || 0.3); // Stay for 0.3 seconds at each 45° angle
        this.transitionDuration = 0.04; // Lightning-fast 40ms snap click between angles
        this.stepAngle = Math.PI / 4; // 45 degrees
        
        // Calculate initial step index (0..7)
        let step = Math.round(initialAngle / this.stepAngle) % 8;
        if (step < 0) step += 8;
        this.currentStep = step;
        this.stepTimer = 0;
        this.angle = this.currentStep * this.stepAngle;
        this._cachedEmoji = getEmojiCanvas('🍯', size);
    }

    update(dt) {
        this.time += dt;
        if (this.isRotator) {
            if (this.isStepped) {
                this.stepTimer += dt;
                const totalStepTime = this.holdDuration + this.transitionDuration;
                if (this.stepTimer >= totalStepTime) {
                    this.stepTimer -= totalStepTime;
                    this.currentStep = (this.currentStep + 1) % 8;
                }

                const baseAngle = this.currentStep * this.stepAngle;
                if (this.stepTimer < this.holdDuration) {
                    // Firmly held at current 45° angle for 1 second
                    this.angle = baseAngle;
                } else {
                    // Snappy 45° click transition to next direction
                    const progress = (this.stepTimer - this.holdDuration) / this.transitionDuration;
                    const ease = Math.sin(progress * Math.PI / 2);
                    this.angle = baseAngle + ease * this.stepAngle;
                }
            } else {
                this.angle += 2.6 * dt;
                if (this.angle >= Math.PI * 2) this.angle -= Math.PI * 2;
                else if (this.angle < 0) this.angle += Math.PI * 2;
            }
        }
    }

    containsEntity(entity, padding = 8) {
        if (!entity) return false;
        const ex = entity.x + entity.width / 2;
        const ey = entity.y + entity.height / 2;
        if (this.isRotator) {
            const dx = ex - this.centerX;
            const dy = ey - this.centerY;
            const entryRadius = this.width * 0.44;
            return Math.hypot(dx, dy) <= (entryRadius + padding);
        }
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
        if (this.isRotator) {
            const ex = entity.x + entity.width / 2;
            const ey = entity.y + entity.height / 2;
            const dx = ex - this.centerX;
            const dy = ey - this.centerY;
            return Math.hypot(dx, dy) <= this.width * 0.46;
        }
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
        ctx.save();

        if (this.isRotator) {
            ctx.translate(this.centerX, this.centerY);

            // Draw rotating barrel with directional aim arrow
            ctx.save();
            ctx.rotate(this.angle);

            // Barrel body: rotate so the top opening of the emoji faces the exit arrow (+X)
            ctx.save();
            ctx.rotate(Math.PI / 2);
            const cached = this._cachedEmoji;
            ctx.drawImage(cached.canvas, -cached.width / 2, -cached.height / 2);
            ctx.restore();

            // Draw bold DKC Arrow on the middle of the barrel pointing out
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 2;

            ctx.fillStyle = '#ffe066';
            ctx.strokeStyle = '#261600';
            ctx.lineWidth = 3.5;
            ctx.lineJoin = 'round';

            ctx.beginPath();
            // Starts at middle of barrel and points out to the top opening
            ctx.moveTo(-16, -7);
            ctx.lineTo(14, -7);
            ctx.lineTo(14, -18);
            ctx.lineTo(44, 0);
            ctx.lineTo(14, 18);
            ctx.lineTo(14, 7);
            ctx.lineTo(-16, 7);
            ctx.closePath();

            ctx.fill();
            ctx.stroke();

            ctx.restore();

            ctx.restore();
        } else {
            const wobbleY = Math.sin(this.time * 1.6) * 2.2;
            const tilt = Math.sin(this.time * 1.4) * 0.06;
            const cached = this._cachedEmoji;

            ctx.translate(this.centerX, this.centerY + wobbleY);
            ctx.rotate(tilt);

            ctx.drawImage(cached.canvas, -cached.width / 2, -cached.height / 2);
        }

        ctx.restore();
    }
}

// Backward-compatible export name for existing imports.
export { SafeBarrel as SafeBubble };
