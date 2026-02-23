import { Entity } from './Entity.js';
import { getEmojiCanvas } from '../EmojiCache.js';

export class SwingingVine extends Entity {
    constructor(anchorX, anchorY, ropeLength) {
        // Initial bounding box — will be recalculated each frame
        super(anchorX - 12, anchorY, 24, ropeLength + 30);

        this.anchorX = anchorX;  // Center X of anchor block
        this.anchorY = anchorY;  // Top Y of anchor block
        this.ropeLength = ropeLength;

        // Anchor block dimensions
        this.anchorWidth = 40;
        this.anchorHeight = 30;

        // Swing parameters
        this.swingSpeed = 1.2 + Math.random() * 0.8; // 1.2–2.0 rad/s
        this.maxAngle = (Math.PI / 180) * (25 + Math.random() * 15); // 25°–40°
        this.swingTime = Math.random() * Math.PI * 2; // random starting phase
        this.currentAngle = 0;

        // Frame deltas for carrying the player
        this.dx = 0;
        this.dy = 0;
        this._prevTipX = 0;
        this._prevTipY = 0;

        // Vine width for collision
        this.vineWidth = 24;

        // Cache the emoji
        this._cachedEmoji = getEmojiCanvas('🌿', 32);

        // Cache anchor block
        this._anchorCache = null;
        this._buildAnchorCache();

        // Calculate initial position
        this._updateSwingPosition(0);
        this._prevTipX = this._tipX;
        this._prevTipY = this._tipY;
    }

    _buildAnchorCache() {
        const w = this.anchorWidth;
        const h = this.anchorHeight;
        let canvas;
        try {
            canvas = new OffscreenCanvas(w + 4, h + 4);
        } catch {
            canvas = document.createElement('canvas');
            canvas.width = w + 4;
            canvas.height = h + 4;
        }
        const ctx = canvas.getContext('2d');
        const ox = 2, oy = 2;

        // Brown/wooden block
        const grad = ctx.createLinearGradient(ox, oy, ox, oy + h);
        grad.addColorStop(0, '#8B6914');
        grad.addColorStop(0.5, '#6B4F12');
        grad.addColorStop(1, '#4A3610');
        ctx.fillStyle = grad;
        ctx.fillRect(ox, oy, w, h);

        // Top highlight
        ctx.fillStyle = '#A07820';
        ctx.fillRect(ox, oy, w, 4);

        // Outline
        ctx.strokeStyle = '#3A2808';
        ctx.lineWidth = 2;
        ctx.strokeRect(ox, oy, w, h);

        this._anchorCache = canvas;
    }

    _updateSwingPosition(dt) {
        this.swingTime += this.swingSpeed * dt;
        this.currentAngle = Math.sin(this.swingTime) * this.maxAngle;

        // Pivot is bottom-center of anchor block
        const pivotX = this.anchorX;
        const pivotY = this.anchorY + this.anchorHeight;

        // Tip position of the vine (bottom end)
        this._tipX = pivotX - Math.sin(this.currentAngle) * this.ropeLength;
        this._tipY = pivotY + Math.cos(this.currentAngle) * this.ropeLength;

        // Update bounding box for AABB collision
        // The vine sweeps between the pivot and the tip
        const minX = Math.min(pivotX, this._tipX) - this.vineWidth / 2;
        const maxX = Math.max(pivotX, this._tipX) + this.vineWidth / 2;
        this.x = minX;
        this.y = pivotY;
        this.width = maxX - minX;
        this.height = this._tipY - pivotY;
    }

    update(dt) {
        this._prevTipX = this._tipX;
        this._prevTipY = this._tipY;

        this._updateSwingPosition(dt);

        // Frame deltas for carrying player
        this.dx = this._tipX - this._prevTipX;
        this.dy = this._tipY - this._prevTipY;
    }

    // Get the world-space center X of the vine at a given Y position
    getVineCenterXAtY(worldY) {
        const pivotX = this.anchorX;
        const pivotY = this.anchorY + this.anchorHeight;
        const cosA = Math.cos(this.currentAngle);
        const dist = (worldY - pivotY) / (cosA || 1);
        const clmDist = Math.max(0, Math.min(this.ropeLength, dist));
        return pivotX - Math.sin(this.currentAngle) * clmDist;
    }

    // Get the vine top Y (just below anchor)
    getVineTopY() {
        return this.anchorY + this.anchorHeight;
    }

    // Get the vine bottom Y
    getVineBottomY() {
        return this._tipY;
    }

    // Check if a point-like entity overlaps this vine (more precise than AABB)
    checkCollision(entity) {
        const pivotX = this.anchorX;
        const pivotY = this.anchorY + this.anchorHeight;
        const entityCenterX = entity.x + entity.width / 2;
        const entityCenterY = entity.y + entity.height / 2;

        // Check if entity is within the vertical range of the rope
        if (entityCenterY < pivotY || entityCenterY > this._tipY) return false;

        // Get the vine center X at this Y
        const vineCX = this.getVineCenterXAtY(entityCenterY);

        // Check horizontal proximity (generous hitbox)
        const dist = Math.abs(entityCenterX - vineCX);
        return dist < (this.vineWidth / 2 + entity.width / 2);
    }

    draw(ctx) {
        const pivotX = this.anchorX;
        const pivotY = this.anchorY + this.anchorHeight;

        // Draw anchor block
        if (this._anchorCache) {
            ctx.drawImage(
                this._anchorCache,
                this.anchorX - this.anchorWidth / 2 - 2,
                this.anchorY - 2
            );
        }

        // Draw the swinging vine
        ctx.save();
        ctx.translate(pivotX, pivotY);
        ctx.rotate(this.currentAngle);

        // Draw vine segments downward
        const cached = this._cachedEmoji;
        const segmentHeight = 30;
        const count = Math.ceil(this.ropeLength / segmentHeight);

        ctx.beginPath();
        ctx.rect(-this.vineWidth / 2 - 20, 0, this.vineWidth + 40, this.ropeLength);
        ctx.clip();

        for (let i = 0; i < count; i++) {
            ctx.drawImage(
                cached.canvas,
                -cached.width / 2,
                i * segmentHeight
            );
        }

        ctx.restore();
    }
}
