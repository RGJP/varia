import { Platform } from './Platform.js';

export class MovingPlatform extends Platform {
    constructor(x, y, width, height, moveAxis, range, speed, theme) {
        super(x, y, width, height, false, theme);

        this.moveAxis = moveAxis; // 'x' or 'y'
        this.startPos = moveAxis === 'x' ? x : y;
        this.endPos = this.startPos + range;
        this.speed = speed;
        this.direction = 1;

        // Frame deltas so the player can be carried
        this.dx = 0;
        this.dy = 0;

        this.isMovingPlatform = true;

        // Rebuild cache with metallic look
        this._buildMovingCache();
    }

    _buildMovingCache() {
        const w = Math.ceil(this.width);
        const h = Math.ceil(this.height);
        if (w <= 0 || h <= 0) return;

        let canvas;
        try {
            canvas = new OffscreenCanvas(w + 8, h + 8);
        } catch {
            canvas = document.createElement('canvas');
            canvas.width = w + 8;
            canvas.height = h + 8;
        }
        const ctx = canvas.getContext('2d');
        const ox = 4;
        const oy = 4;

        // Metallic / industrial body
        const grad = ctx.createLinearGradient(ox, oy, ox, oy + h);
        grad.addColorStop(0, '#7E8C9A');   // light steel
        grad.addColorStop(0.3, '#5C6A78'); // medium steel
        grad.addColorStop(1, '#3D4A56');   // dark steel
        ctx.fillStyle = grad;
        ctx.fillRect(ox, oy, w, h);

        // Top highlight strip
        ctx.fillStyle = '#A0B0C0';
        ctx.fillRect(ox, oy, w, Math.min(6, h));

        // Rivet / bolt details
        ctx.fillStyle = '#2C3A46';
        const rivetSize = 6;
        const rivetY = oy + Math.min(14, h - rivetSize);
        for (let rx = 12; rx < w - 6; rx += 30) {
            ctx.beginPath();
            ctx.arc(ox + rx, rivetY, rivetSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Hazard stripes on sides
        ctx.fillStyle = '#FFC107';
        const stripeW = Math.min(8, w / 4);
        ctx.fillRect(ox, oy, stripeW, h);
        ctx.fillRect(ox + w - stripeW, oy, stripeW, h);

        // Outline
        ctx.strokeStyle = '#2C3A46';
        ctx.lineWidth = 3;
        ctx.strokeRect(ox, oy, w, h);

        // Direction arrow indicator
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        const centerX = ox + w / 2;
        const centerY = oy + h / 2;
        const arrowSize = Math.min(12, w / 4, h / 2);

        if (this.moveAxis === 'x') {
            // Left arrow
            ctx.beginPath();
            ctx.moveTo(centerX - arrowSize * 2, centerY);
            ctx.lineTo(centerX - arrowSize, centerY - arrowSize);
            ctx.lineTo(centerX - arrowSize, centerY + arrowSize);
            ctx.fill();
            // Right arrow
            ctx.beginPath();
            ctx.moveTo(centerX + arrowSize * 2, centerY);
            ctx.lineTo(centerX + arrowSize, centerY - arrowSize);
            ctx.lineTo(centerX + arrowSize, centerY + arrowSize);
            ctx.fill();
        } else {
            // Up arrow
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - arrowSize * 1.5);
            ctx.lineTo(centerX - arrowSize, centerY - arrowSize * 0.5);
            ctx.lineTo(centerX + arrowSize, centerY - arrowSize * 0.5);
            ctx.fill();
            // Down arrow
            ctx.beginPath();
            ctx.moveTo(centerX, centerY + arrowSize * 1.5);
            ctx.lineTo(centerX - arrowSize, centerY + arrowSize * 0.5);
            ctx.lineTo(centerX + arrowSize, centerY + arrowSize * 0.5);
            ctx.fill();
        }

        this._cache = canvas;
    }

    update(dt) {
        const prevX = this.x;
        const prevY = this.y;

        if (this.moveAxis === 'x') {
            this.x += this.speed * this.direction * dt;
            if (this.x >= this.endPos) {
                this.x = this.endPos;
                this.direction = -1;
            } else if (this.x <= this.startPos) {
                this.x = this.startPos;
                this.direction = 1;
            }
        } else {
            this.y += this.speed * this.direction * dt;
            if (this.y >= this.endPos) {
                this.y = this.endPos;
                this.direction = -1;
            } else if (this.y <= this.startPos) {
                this.y = this.startPos;
                this.direction = 1;
            }
        }

        this.dx = this.x - prevX;
        this.dy = this.y - prevY;
    }
}
