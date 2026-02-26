import { Platform } from './Platform.js';

export class TrampolinePlatform extends Platform {
    constructor(x, y, width, height, theme = null) {
        super(x, y, width, height, false, theme);
        this.isTrampoline = true;
        this._buildTrampolineCache();
    }

    _buildTrampolineCache() {
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

        const radius = Math.min(12, h * 0.45);

        // Outer rubber tire body.
        const bodyGrad = ctx.createLinearGradient(0, oy, 0, oy + h);
        bodyGrad.addColorStop(0, '#2f2f2f');
        bodyGrad.addColorStop(0.45, '#1d1d1d');
        bodyGrad.addColorStop(1, '#090909');
        ctx.fillStyle = bodyGrad;
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(ox, oy, w, h, radius);
            ctx.fill();
        } else {
            ctx.fillRect(ox, oy, w, h);
        }

        // Bright spring band.
        const bandH = Math.max(6, Math.min(12, h * 0.45));
        const bandGrad = ctx.createLinearGradient(0, oy + 2, 0, oy + bandH + 2);
        bandGrad.addColorStop(0, '#fff176');
        bandGrad.addColorStop(1, '#ffc107');
        ctx.fillStyle = bandGrad;
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(ox + 2, oy + 2, Math.max(1, w - 4), bandH, Math.max(4, radius - 2));
            ctx.fill();
        } else {
            ctx.fillRect(ox + 2, oy + 2, Math.max(1, w - 4), bandH);
        }

        // Chevron spring marks for visual readability.
        ctx.strokeStyle = 'rgba(120, 80, 10, 0.65)';
        ctx.lineWidth = 2;
        const step = 14;
        const yMid = oy + 2 + bandH * 0.55;
        for (let x = ox + 8; x < ox + w - 8; x += step) {
            ctx.beginPath();
            ctx.moveTo(x - 4, yMid - 3);
            ctx.lineTo(x, yMid + 2);
            ctx.lineTo(x + 4, yMid - 3);
            ctx.stroke();
        }

        // Side bolts.
        ctx.fillStyle = '#585858';
        const boltY = oy + h * 0.62;
        for (let x = ox + 12; x < ox + w - 10; x += 28) {
            ctx.beginPath();
            ctx.arc(x, boltY, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(ox, oy, w, h, radius);
            ctx.stroke();
        } else {
            ctx.strokeRect(ox, oy, w, h);
        }

        this._cache = canvas;
    }
}
