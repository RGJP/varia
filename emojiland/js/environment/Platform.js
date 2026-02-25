function _hexToRgb(hex) {
    if (typeof hex !== 'string') return null;
    const value = hex.trim();
    const m = value.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
    if (!m) return null;
    let h = m[1];
    if (h.length === 3) h = h.split('').map(ch => ch + ch).join('');
    const num = parseInt(h, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function _rgbToHex(r, g, b) {
    const toHex = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function _shadeColor(color, amount) {
    const rgb = _hexToRgb(color);
    if (!rgb) return color;
    const factor = 1 + amount;
    return _rgbToHex(rgb.r * factor, rgb.g * factor, rgb.b * factor);
}

function _alphaColor(color, alpha) {
    const rgb = _hexToRgb(color);
    if (rgb) return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    return color;
}

function _roundedRectPath(ctx, x, y, w, h, r) {
    const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
}

export class Platform {
    constructor(x, y, width, height, isVictory = false, theme = null) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.isVictory = isVictory;
        this.theme = theme;
        // Pre-render the platform to an offscreen canvas
        this._cache = null;
        this._buildCache();
    }

    _buildCache() {
        const w = Math.ceil(this.width);
        const h = Math.ceil(this.height);
        if (w <= 0 || h <= 0) return;

        let canvas;
        try {
            canvas = new OffscreenCanvas(w + 8, h + 8); // extra for stroke
        } catch {
            canvas = document.createElement('canvas');
            canvas.width = w + 8;
            canvas.height = h + 8;
        }
        const ctx = canvas.getContext('2d');
        // Draw at (4,4) to leave room for the stroke on all sides
        const ox = 4;
        const oy = 4;

        if (this.isVictory) {
            const radius = Math.min(18, h * 0.35);
            const goldGrad = ctx.createLinearGradient(0, oy, 0, oy + h);
            goldGrad.addColorStop(0, '#fff8b0');
            goldGrad.addColorStop(0.25, '#ffe066');
            goldGrad.addColorStop(0.7, '#f4b400');
            goldGrad.addColorStop(1, '#b8860b');

            _roundedRectPath(ctx, ox, oy, w, h, radius);
            ctx.fillStyle = goldGrad;
            ctx.fill();

            const shine = ctx.createLinearGradient(0, oy, 0, oy + Math.max(1, h * 0.45));
            shine.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
            shine.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = shine;
            _roundedRectPath(ctx, ox + 2, oy + 2, Math.max(1, w - 4), Math.max(1, h * 0.45), Math.max(2, radius - 2));
            ctx.fill();

            ctx.strokeStyle = '#8c6200';
            ctx.lineWidth = 3;
            _roundedRectPath(ctx, ox, oy, w, h, radius);
            ctx.stroke();
        } else {
            const pTheme = this.theme ? this.theme.platform : {
                dirt: '#5D4037',
                grass: '#4CAF50',
                texture: '#4e342e',
                outline: '#3e2723'
            };
            const isVolcanic = !!(this.theme && this.theme.backgroundStyle === 'volcano');
            const isForest = !!(this.theme && this.theme.backgroundStyle === 'forest');
            const isIce = !!(this.theme && this.theme.backgroundStyle === 'ice');
            const isDesert = !!(this.theme && this.theme.backgroundStyle === 'desert');
            const isSky = !!(this.theme && this.theme.backgroundStyle === 'sky');
            const isSwamp = !!(this.theme && this.theme.backgroundStyle === 'swamp');
            const isHaunted = !!(this.theme && this.theme.backgroundStyle === 'haunted');
            const isUnderwater = !!(this.theme && this.theme.backgroundStyle === 'underwater');
            const isCyberpunk = !!(this.theme && this.theme.backgroundStyle === 'cyberpunk');
            const isAncient = !!(this.theme && this.theme.backgroundStyle === 'ancient');
            const isFungus = !!(this.theme && this.theme.backgroundStyle === 'fungus');
            const isCrystal = !!(this.theme && this.theme.backgroundStyle === 'crystal');
            const isSteampunk = !!(this.theme && this.theme.backgroundStyle === 'steampunk');
            const isDreamscape = !!(this.theme && this.theme.backgroundStyle === 'dreamscape');
            const isPrehistoric = !!(this.theme && this.theme.backgroundStyle === 'prehistoric');

            const bodyRadius = Math.min(16, h * 0.25);
            const grassH = Math.max(10, Math.min(24, h * 0.22));

            if (isVolcanic) {
                const rockGrad = ctx.createLinearGradient(0, oy, 0, oy + h);
                rockGrad.addColorStop(0, '#3a1816');
                rockGrad.addColorStop(0.4, '#27100f');
                rockGrad.addColorStop(1, '#120707');
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.fillStyle = rockGrad;
                ctx.fill();

                const crustH = Math.max(8, Math.min(18, h * 0.2));
                const crustGrad = ctx.createLinearGradient(0, oy, 0, oy + crustH);
                crustGrad.addColorStop(0, '#5a2a1f');
                crustGrad.addColorStop(1, '#2b1411');
                _roundedRectPath(ctx, ox + 1, oy + 1, Math.max(1, w - 2), crustH, Math.max(4, bodyRadius - 2));
                ctx.fillStyle = crustGrad;
                ctx.fill();

                const fissures = Math.max(2, Math.floor(w / 100));
                for (let i = 0; i < fissures; i++) {
                    const fx = ox + w * (0.18 + (i / Math.max(1, fissures - 1)) * 0.64);
                    ctx.strokeStyle = 'rgba(255, 110, 35, 0.45)';
                    ctx.lineWidth = 1.3 + (i % 2) * 0.4;
                    ctx.beginPath();
                    ctx.moveTo(fx, oy + crustH + 3);
                    ctx.bezierCurveTo(
                        fx + ((i % 2 === 0) ? 4 : -4),
                        oy + h * 0.45,
                        fx + ((i % 2 === 0) ? -3 : 3),
                        oy + h * 0.68,
                        fx + ((i % 2 === 0) ? 5 : -5),
                        oy + h - 7
                    );
                    ctx.stroke();
                }

                ctx.fillStyle = 'rgba(255, 140, 70, 0.22)';
                for (let i = 0; i < Math.max(3, Math.floor(w / 80)); i++) {
                    const lx = ox + 10 + ((i * 47 + w * 0.11) % Math.max(10, w - 20));
                    const ly = oy + crustH + 8 + ((i * 21) % Math.max(8, h - crustH - 16));
                    ctx.fillRect(lx, ly, 4 + (i % 2), 2 + (i % 3));
                }

                ctx.strokeStyle = '#5d2520';
                ctx.lineWidth = 3;
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.stroke();
                this._cache = canvas;
                return;
            }

            if (isForest) {
                const soilGrad = ctx.createLinearGradient(0, oy, 0, oy + h);
                soilGrad.addColorStop(0, '#4c3728');
                soilGrad.addColorStop(0.45, '#3f2c21');
                soilGrad.addColorStop(1, '#2a1b14');
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.fillStyle = soilGrad;
                ctx.fill();

                const mossH = Math.max(9, Math.min(20, h * 0.22));
                const mossGrad = ctx.createLinearGradient(0, oy, 0, oy + mossH);
                mossGrad.addColorStop(0, '#6fa659');
                mossGrad.addColorStop(0.55, '#4e8641');
                mossGrad.addColorStop(1, '#3b6b34');
                _roundedRectPath(ctx, ox + 1, oy + 1, Math.max(1, w - 2), mossH, Math.max(4, bodyRadius - 2));
                ctx.fillStyle = mossGrad;
                ctx.fill();

                ctx.fillStyle = 'rgba(84, 122, 64, 0.42)';
                const sodStep = 10;
                for (let x = ox + 2; x < ox + w - 4; x += sodStep) {
                    const tuftW = Math.min(sodStep + 3, ox + w - 4 - x);
                    const tuftH = 2 + ((x * 13) % 5);
                    ctx.fillRect(x, oy + mossH - 1, tuftW, tuftH);
                }

                const rootCount = Math.max(2, Math.floor(w / 110));
                for (let i = 0; i < rootCount; i++) {
                    const rx = ox + w * (0.2 + i * (0.6 / Math.max(1, rootCount - 1)));
                    ctx.strokeStyle = 'rgba(92, 62, 42, 0.55)';
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.moveTo(rx, oy + mossH + 5);
                    ctx.bezierCurveTo(
                        rx + ((i % 2 === 0) ? 5 : -5),
                        oy + h * 0.4,
                        rx + ((i % 2 === 0) ? -4 : 4),
                        oy + h * 0.66,
                        rx + ((i % 2 === 0) ? 4 : -4),
                        oy + h - 8
                    );
                    ctx.stroke();
                }

                ctx.fillStyle = 'rgba(60, 90, 48, 0.35)';
                for (let i = 0; i < Math.max(4, Math.floor(w / 65)); i++) {
                    const px = ox + 8 + ((i * 41 + w * 0.18) % Math.max(10, w - 16));
                    const py = oy + mossH + 8 + ((i * 23) % Math.max(8, h - mossH - 16));
                    ctx.fillRect(px, py, 3 + (i % 3), 2 + ((i + 1) % 3));
                }

                ctx.strokeStyle = '#2f4427';
                ctx.lineWidth = 3;
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.stroke();
                this._cache = canvas;
                return;
            }

            if (isIce) {
                const iceGrad = ctx.createLinearGradient(0, oy, 0, oy + h);
                iceGrad.addColorStop(0, '#eaf8ff');
                iceGrad.addColorStop(0.45, '#cbeaff');
                iceGrad.addColorStop(1, '#8fc5e7');
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.fillStyle = iceGrad;
                ctx.fill();

                const snowCapH = Math.max(9, Math.min(18, h * 0.2));
                const snowGrad = ctx.createLinearGradient(0, oy, 0, oy + snowCapH);
                snowGrad.addColorStop(0, '#ffffff');
                snowGrad.addColorStop(1, '#eaf6ff');
                _roundedRectPath(ctx, ox + 1, oy + 1, Math.max(1, w - 2), snowCapH, Math.max(4, bodyRadius - 2));
                ctx.fillStyle = snowGrad;
                ctx.fill();

                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                const driftStep = 11;
                for (let x = ox + 2; x < ox + w - 4; x += driftStep) {
                    const driftW = Math.min(driftStep + 3, ox + w - 4 - x);
                    const driftH = 1 + ((x * 11) % 4);
                    ctx.fillRect(x, oy + snowCapH - 1, driftW, driftH);
                }

                const crackCount = Math.max(2, Math.floor(w / 95));
                for (let i = 0; i < crackCount; i++) {
                    const cx = ox + w * (0.16 + i * (0.68 / Math.max(1, crackCount - 1)));
                    ctx.strokeStyle = 'rgba(110, 170, 210, 0.52)';
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.moveTo(cx, oy + snowCapH + 4);
                    ctx.bezierCurveTo(
                        cx + ((i % 2 === 0) ? 4 : -4),
                        oy + h * 0.44,
                        cx + ((i % 2 === 0) ? -3 : 3),
                        oy + h * 0.68,
                        cx + ((i % 2 === 0) ? 5 : -5),
                        oy + h - 7
                    );
                    ctx.stroke();
                }

                ctx.fillStyle = 'rgba(255, 255, 255, 0.26)';
                for (let i = 0; i < Math.max(4, Math.floor(w / 70)); i++) {
                    const px = ox + 7 + ((i * 43 + w * 0.12) % Math.max(10, w - 16));
                    const py = oy + snowCapH + 7 + ((i * 27) % Math.max(8, h - snowCapH - 15));
                    ctx.fillRect(px, py, 3 + (i % 3), 2 + ((i + 1) % 3));
                }

                ctx.strokeStyle = '#7aaed0';
                ctx.lineWidth = 3;
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.stroke();
                this._cache = canvas;
                return;
            }

            if (isDesert) {
                const sandstoneGrad = ctx.createLinearGradient(0, oy, 0, oy + h);
                sandstoneGrad.addColorStop(0, '#d5a764');
                sandstoneGrad.addColorStop(0.45, '#bf8d52');
                sandstoneGrad.addColorStop(1, '#946b3f');
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.fillStyle = sandstoneGrad;
                ctx.fill();

                const sandCapH = Math.max(9, Math.min(18, h * 0.2));
                const sandCapGrad = ctx.createLinearGradient(0, oy, 0, oy + sandCapH);
                sandCapGrad.addColorStop(0, '#ffe7a8');
                sandCapGrad.addColorStop(1, '#f2c979');
                _roundedRectPath(ctx, ox + 1, oy + 1, Math.max(1, w - 2), sandCapH, Math.max(4, bodyRadius - 2));
                ctx.fillStyle = sandCapGrad;
                ctx.fill();

                ctx.fillStyle = 'rgba(255, 225, 150, 0.45)';
                const ridgeStep = 11;
                for (let x = ox + 2; x < ox + w - 4; x += ridgeStep) {
                    const ridgeW = Math.min(ridgeStep + 2, ox + w - 4 - x);
                    const ridgeH = 1 + ((x * 9) % 4);
                    ctx.fillRect(x, oy + sandCapH - 1, ridgeW, ridgeH);
                }

                const strataCount = Math.max(2, Math.floor(h / 38));
                ctx.strokeStyle = 'rgba(130, 93, 53, 0.35)';
                ctx.lineWidth = 1.8;
                for (let i = 0; i < strataCount; i++) {
                    const yLine = oy + sandCapH + 12 + i * ((h - sandCapH - 18) / Math.max(1, strataCount - 1));
                    ctx.beginPath();
                    ctx.moveTo(ox + 7, yLine);
                    ctx.bezierCurveTo(ox + w * 0.28, yLine - 2, ox + w * 0.66, yLine + 4, ox + w - 9, yLine);
                    ctx.stroke();
                }

                ctx.fillStyle = 'rgba(145, 102, 57, 0.34)';
                for (let i = 0; i < Math.max(4, Math.floor(w / 62)); i++) {
                    const px = ox + 8 + ((i * 37 + w * 0.14) % Math.max(10, w - 16));
                    const py = oy + sandCapH + 8 + ((i * 23) % Math.max(8, h - sandCapH - 16));
                    ctx.fillRect(px, py, 3 + (i % 3), 2 + ((i + 1) % 3));
                }

                ctx.strokeStyle = '#7a5732';
                ctx.lineWidth = 3;
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.stroke();
                this._cache = canvas;
                return;
            }

            if (isSky) {
                const bodyGrad = ctx.createLinearGradient(0, oy, 0, oy + h);
                bodyGrad.addColorStop(0, '#eaf8ff');
                bodyGrad.addColorStop(0.45, '#cfe9f8');
                bodyGrad.addColorStop(1, '#a8cde2');
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.fillStyle = bodyGrad;
                ctx.fill();

                const cloudCapH = Math.max(9, Math.min(18, h * 0.2));
                const cloudCapGrad = ctx.createLinearGradient(0, oy, 0, oy + cloudCapH);
                cloudCapGrad.addColorStop(0, '#ffffff');
                cloudCapGrad.addColorStop(1, '#eaf6ff');
                _roundedRectPath(ctx, ox + 1, oy + 1, Math.max(1, w - 2), cloudCapH, Math.max(4, bodyRadius - 2));
                ctx.fillStyle = cloudCapGrad;
                ctx.fill();

                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                const puffStep = 12;
                for (let x = ox + 2; x < ox + w - 4; x += puffStep) {
                    const puffW = Math.min(puffStep + 3, ox + w - 4 - x);
                    const puffH = 1 + ((x * 7) % 4);
                    ctx.fillRect(x, oy + cloudCapH - 1, puffW, puffH);
                }

                ctx.strokeStyle = 'rgba(132, 172, 198, 0.36)';
                ctx.lineWidth = 1.5;
                const veinCount = Math.max(2, Math.floor(w / 100));
                for (let i = 0; i < veinCount; i++) {
                    const vx = ox + w * (0.18 + i * (0.64 / Math.max(1, veinCount - 1)));
                    ctx.beginPath();
                    ctx.moveTo(vx, oy + cloudCapH + 5);
                    ctx.bezierCurveTo(vx + 4, oy + h * 0.42, vx - 3, oy + h * 0.68, vx + 4, oy + h - 8);
                    ctx.stroke();
                }

                ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
                for (let i = 0; i < Math.max(4, Math.floor(w / 72)); i++) {
                    const px = ox + 8 + ((i * 39 + w * 0.13) % Math.max(10, w - 16));
                    const py = oy + cloudCapH + 8 + ((i * 21) % Math.max(8, h - cloudCapH - 16));
                    ctx.fillRect(px, py, 3 + (i % 3), 2 + ((i + 1) % 3));
                }

                ctx.strokeStyle = '#7eaaca';
                ctx.lineWidth = 3;
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.stroke();
                this._cache = canvas;
                return;
            }

            if (isSwamp) {
                const mudGrad = ctx.createLinearGradient(0, oy, 0, oy + h);
                mudGrad.addColorStop(0, '#4a3a2a');
                mudGrad.addColorStop(0.45, '#3c2f23');
                mudGrad.addColorStop(1, '#2b2219');
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.fillStyle = mudGrad;
                ctx.fill();

                const mossH = Math.max(9, Math.min(18, h * 0.2));
                const mossGrad = ctx.createLinearGradient(0, oy, 0, oy + mossH);
                mossGrad.addColorStop(0, '#7ea05a');
                mossGrad.addColorStop(0.55, '#5f7f46');
                mossGrad.addColorStop(1, '#486437');
                _roundedRectPath(ctx, ox + 1, oy + 1, Math.max(1, w - 2), mossH, Math.max(4, bodyRadius - 2));
                ctx.fillStyle = mossGrad;
                ctx.fill();

                ctx.fillStyle = 'rgba(122, 154, 91, 0.38)';
                const sodStep = 10;
                for (let x = ox + 2; x < ox + w - 4; x += sodStep) {
                    const tuftW = Math.min(sodStep + 2, ox + w - 4 - x);
                    const tuftH = 2 + ((x * 15) % 4);
                    ctx.fillRect(x, oy + mossH - 1, tuftW, tuftH);
                }

                ctx.strokeStyle = 'rgba(84, 64, 45, 0.55)';
                ctx.lineWidth = 1.3;
                const rootCount = Math.max(2, Math.floor(w / 100));
                for (let i = 0; i < rootCount; i++) {
                    const rx = ox + w * (0.18 + i * (0.64 / Math.max(1, rootCount - 1)));
                    ctx.beginPath();
                    ctx.moveTo(rx, oy + mossH + 4);
                    ctx.bezierCurveTo(
                        rx + ((i % 2 === 0) ? 4 : -4),
                        oy + h * 0.42,
                        rx + ((i % 2 === 0) ? -3 : 3),
                        oy + h * 0.68,
                        rx + ((i % 2 === 0) ? 5 : -5),
                        oy + h - 7
                    );
                    ctx.stroke();
                }

                ctx.fillStyle = 'rgba(70, 98, 58, 0.32)';
                for (let i = 0; i < Math.max(4, Math.floor(w / 68)); i++) {
                    const px = ox + 8 + ((i * 41 + w * 0.16) % Math.max(10, w - 16));
                    const py = oy + mossH + 8 + ((i * 19) % Math.max(8, h - mossH - 16));
                    ctx.fillRect(px, py, 3 + (i % 3), 2 + ((i + 1) % 3));
                }

                ctx.strokeStyle = '#3a4f31';
                ctx.lineWidth = 3;
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.stroke();
                this._cache = canvas;
                return;
            }

            if (isHaunted) {
                const stoneGrad = ctx.createLinearGradient(0, oy, 0, oy + h);
                stoneGrad.addColorStop(0, '#3a3248');
                stoneGrad.addColorStop(0.46, '#2d2539');
                stoneGrad.addColorStop(1, '#1c1726');
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.fillStyle = stoneGrad;
                ctx.fill();

                const cursedCapH = Math.max(9, Math.min(18, h * 0.2));
                const cursedGrad = ctx.createLinearGradient(0, oy, 0, oy + cursedCapH);
                cursedGrad.addColorStop(0, '#8f74b6');
                cursedGrad.addColorStop(0.55, '#6e5793');
                cursedGrad.addColorStop(1, '#544274');
                _roundedRectPath(ctx, ox + 1, oy + 1, Math.max(1, w - 2), cursedCapH, Math.max(4, bodyRadius - 2));
                ctx.fillStyle = cursedGrad;
                ctx.fill();

                ctx.fillStyle = 'rgba(165, 140, 202, 0.34)';
                const ridgeStep = 11;
                for (let x = ox + 2; x < ox + w - 4; x += ridgeStep) {
                    const ridgeW = Math.min(ridgeStep + 2, ox + w - 4 - x);
                    const ridgeH = 1 + ((x * 9) % 4);
                    ctx.fillRect(x, oy + cursedCapH - 1, ridgeW, ridgeH);
                }

                ctx.strokeStyle = 'rgba(115, 96, 146, 0.52)';
                ctx.lineWidth = 1.3;
                const crackCount = Math.max(2, Math.floor(w / 100));
                for (let i = 0; i < crackCount; i++) {
                    const cx = ox + w * (0.18 + i * (0.64 / Math.max(1, crackCount - 1)));
                    ctx.beginPath();
                    ctx.moveTo(cx, oy + cursedCapH + 5);
                    ctx.bezierCurveTo(
                        cx + ((i % 2 === 0) ? 4 : -4),
                        oy + h * 0.42,
                        cx + ((i % 2 === 0) ? -3 : 3),
                        oy + h * 0.68,
                        cx + ((i % 2 === 0) ? 5 : -5),
                        oy + h - 8
                    );
                    ctx.stroke();
                }

                ctx.fillStyle = 'rgba(173, 157, 200, 0.2)';
                for (let i = 0; i < Math.max(4, Math.floor(w / 72)); i++) {
                    const px = ox + 8 + ((i * 39 + w * 0.12) % Math.max(10, w - 16));
                    const py = oy + cursedCapH + 8 + ((i * 21) % Math.max(8, h - cursedCapH - 16));
                    ctx.fillRect(px, py, 3 + (i % 3), 2 + ((i + 1) % 3));
                }

                ctx.strokeStyle = '#4a3a62';
                ctx.lineWidth = 3;
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.stroke();
                this._cache = canvas;
                return;
            }

            if (isUnderwater) {
                const reefGrad = ctx.createLinearGradient(0, oy, 0, oy + h);
                reefGrad.addColorStop(0, '#2f7ea1');
                reefGrad.addColorStop(0.46, '#226381');
                reefGrad.addColorStop(1, '#153f56');
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.fillStyle = reefGrad;
                ctx.fill();

                const foamCapH = Math.max(9, Math.min(18, h * 0.2));
                const foamGrad = ctx.createLinearGradient(0, oy, 0, oy + foamCapH);
                foamGrad.addColorStop(0, '#bff1ff');
                foamGrad.addColorStop(0.55, '#8dd8ee');
                foamGrad.addColorStop(1, '#62b7d3');
                _roundedRectPath(ctx, ox + 1, oy + 1, Math.max(1, w - 2), foamCapH, Math.max(4, bodyRadius - 2));
                ctx.fillStyle = foamGrad;
                ctx.fill();

                ctx.fillStyle = 'rgba(190, 243, 255, 0.36)';
                const rippleStep = 11;
                for (let x = ox + 2; x < ox + w - 4; x += rippleStep) {
                    const rippleW = Math.min(rippleStep + 2, ox + w - 4 - x);
                    const rippleH = 1 + ((x * 11) % 4);
                    ctx.fillRect(x, oy + foamCapH - 1, rippleW, rippleH);
                }

                ctx.strokeStyle = 'rgba(87, 171, 188, 0.48)';
                ctx.lineWidth = 1.2;
                const veinCount = Math.max(2, Math.floor(w / 100));
                for (let i = 0; i < veinCount; i++) {
                    const vx = ox + w * (0.18 + i * (0.64 / Math.max(1, veinCount - 1)));
                    ctx.beginPath();
                    ctx.moveTo(vx, oy + foamCapH + 5);
                    ctx.bezierCurveTo(vx + 4, oy + h * 0.42, vx - 3, oy + h * 0.68, vx + 4, oy + h - 8);
                    ctx.stroke();
                }

                ctx.fillStyle = 'rgba(132, 210, 226, 0.24)';
                for (let i = 0; i < Math.max(4, Math.floor(w / 72)); i++) {
                    const px = ox + 8 + ((i * 37 + w * 0.13) % Math.max(10, w - 16));
                    const py = oy + foamCapH + 8 + ((i * 19) % Math.max(8, h - foamCapH - 16));
                    ctx.fillRect(px, py, 3 + (i % 3), 2 + ((i + 1) % 3));
                }

                ctx.strokeStyle = '#2f7696';
                ctx.lineWidth = 3;
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.stroke();
                this._cache = canvas;
                return;
            }

            if (isCyberpunk) {
                const alloyGrad = ctx.createLinearGradient(0, oy, 0, oy + h);
                alloyGrad.addColorStop(0, '#24203a');
                alloyGrad.addColorStop(0.46, '#1a1630');
                alloyGrad.addColorStop(1, '#0c0a1e');
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.fillStyle = alloyGrad;
                ctx.fill();

                const neonCapH = Math.max(9, Math.min(18, h * 0.2));
                const neonGrad = ctx.createLinearGradient(0, oy, 0, oy + neonCapH);
                neonGrad.addColorStop(0, '#00f5ff');
                neonGrad.addColorStop(0.55, '#00b8ff');
                neonGrad.addColorStop(1, '#8a2be2');
                _roundedRectPath(ctx, ox + 1, oy + 1, Math.max(1, w - 2), neonCapH, Math.max(4, bodyRadius - 2));
                ctx.fillStyle = neonGrad;
                ctx.fill();

                ctx.fillStyle = 'rgba(255, 34, 220, 0.38)';
                const edgeStep = 11;
                for (let x = ox + 2; x < ox + w - 4; x += edgeStep) {
                    const edgeW = Math.min(edgeStep + 2, ox + w - 4 - x);
                    const edgeH = 1 + ((x * 9) % 4);
                    ctx.fillRect(x, oy + neonCapH - 1, edgeW, edgeH);
                }

                ctx.strokeStyle = 'rgba(120, 205, 255, 0.42)';
                ctx.lineWidth = 1.2;
                const panelCount = Math.max(2, Math.floor(w / 95));
                for (let i = 0; i < panelCount; i++) {
                    const px = ox + w * (0.18 + i * (0.64 / Math.max(1, panelCount - 1)));
                    ctx.beginPath();
                    ctx.moveTo(px, oy + neonCapH + 5);
                    ctx.bezierCurveTo(px + 4, oy + h * 0.42, px - 3, oy + h * 0.68, px + 4, oy + h - 8);
                    ctx.stroke();
                }

                ctx.fillStyle = 'rgba(0, 238, 255, 0.2)';
                for (let i = 0; i < Math.max(4, Math.floor(w / 72)); i++) {
                    const px = ox + 8 + ((i * 37 + w * 0.14) % Math.max(10, w - 16));
                    const py = oy + neonCapH + 8 + ((i * 17) % Math.max(8, h - neonCapH - 16));
                    ctx.fillRect(px, py, 3 + (i % 3), 2 + ((i + 1) % 3));
                }

                ctx.strokeStyle = '#3e4fa5';
                ctx.lineWidth = 3;
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.stroke();
                this._cache = canvas;
                return;
            }

            if (isAncient) {
                const stoneGrad = ctx.createLinearGradient(0, oy, 0, oy + h);
                stoneGrad.addColorStop(0, '#b49772');
                stoneGrad.addColorStop(0.46, '#967a5a');
                stoneGrad.addColorStop(1, '#6f583f');
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.fillStyle = stoneGrad;
                ctx.fill();

                const dustCapH = Math.max(9, Math.min(18, h * 0.2));
                const dustGrad = ctx.createLinearGradient(0, oy, 0, oy + dustCapH);
                dustGrad.addColorStop(0, '#e2c89f');
                dustGrad.addColorStop(0.55, '#d0b387');
                dustGrad.addColorStop(1, '#b39169');
                _roundedRectPath(ctx, ox + 1, oy + 1, Math.max(1, w - 2), dustCapH, Math.max(4, bodyRadius - 2));
                ctx.fillStyle = dustGrad;
                ctx.fill();

                ctx.fillStyle = 'rgba(231, 208, 168, 0.34)';
                const edgeStep = 11;
                for (let x = ox + 2; x < ox + w - 4; x += edgeStep) {
                    const edgeW = Math.min(edgeStep + 2, ox + w - 4 - x);
                    const edgeH = 1 + ((x * 9) % 4);
                    ctx.fillRect(x, oy + dustCapH - 1, edgeW, edgeH);
                }

                ctx.strokeStyle = 'rgba(122, 98, 71, 0.42)';
                ctx.lineWidth = 1.6;
                const strataCount = Math.max(2, Math.floor(h / 40));
                for (let i = 0; i < strataCount; i++) {
                    const yLine = oy + dustCapH + 12 + i * ((h - dustCapH - 18) / Math.max(1, strataCount - 1));
                    ctx.beginPath();
                    ctx.moveTo(ox + 7, yLine);
                    ctx.bezierCurveTo(ox + w * 0.28, yLine - 2, ox + w * 0.66, yLine + 4, ox + w - 9, yLine);
                    ctx.stroke();
                }

                ctx.fillStyle = 'rgba(128, 101, 72, 0.28)';
                for (let i = 0; i < Math.max(4, Math.floor(w / 68)); i++) {
                    const px = ox + 8 + ((i * 35 + w * 0.14) % Math.max(10, w - 16));
                    const py = oy + dustCapH + 8 + ((i * 21) % Math.max(8, h - dustCapH - 16));
                    ctx.fillRect(px, py, 3 + (i % 3), 2 + ((i + 1) % 3));
                }

                ctx.strokeStyle = '#7a6248';
                ctx.lineWidth = 3;
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.stroke();
                this._cache = canvas;
                return;
            }

            if (isFungus) {
                const fungalGrad = ctx.createLinearGradient(0, oy, 0, oy + h);
                fungalGrad.addColorStop(0, '#6b3b7c');
                fungalGrad.addColorStop(0.46, '#542b67');
                fungalGrad.addColorStop(1, '#341845');
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.fillStyle = fungalGrad;
                ctx.fill();

                const capH = Math.max(9, Math.min(18, h * 0.2));
                const capGrad = ctx.createLinearGradient(0, oy, 0, oy + capH);
                capGrad.addColorStop(0, '#efb6ff');
                capGrad.addColorStop(0.55, '#d184f0');
                capGrad.addColorStop(1, '#a54dc9');
                _roundedRectPath(ctx, ox + 1, oy + 1, Math.max(1, w - 2), capH, Math.max(4, bodyRadius - 2));
                ctx.fillStyle = capGrad;
                ctx.fill();

                ctx.fillStyle = 'rgba(247, 198, 255, 0.34)';
                const puffStep = 10;
                for (let x = ox + 2; x < ox + w - 4; x += puffStep) {
                    const puffW = Math.min(puffStep + 2, ox + w - 4 - x);
                    const puffH = 1 + ((x * 9) % 4);
                    ctx.fillRect(x, oy + capH - 1, puffW, puffH);
                }

                ctx.strokeStyle = 'rgba(192, 128, 220, 0.44)';
                ctx.lineWidth = 1.2;
                const veinCount = Math.max(2, Math.floor(w / 96));
                for (let i = 0; i < veinCount; i++) {
                    const vx = ox + w * (0.18 + i * (0.64 / Math.max(1, veinCount - 1)));
                    ctx.beginPath();
                    ctx.moveTo(vx, oy + capH + 5);
                    ctx.bezierCurveTo(vx + 4, oy + h * 0.42, vx - 3, oy + h * 0.68, vx + 4, oy + h - 8);
                    ctx.stroke();
                }

                ctx.fillStyle = 'rgba(233, 176, 255, 0.24)';
                for (let i = 0; i < Math.max(4, Math.floor(w / 70)); i++) {
                    const px = ox + 8 + ((i * 37 + w * 0.13) % Math.max(10, w - 16));
                    const py = oy + capH + 8 + ((i * 19) % Math.max(8, h - capH - 16));
                    ctx.fillRect(px, py, 3 + (i % 3), 2 + ((i + 1) % 3));
                }

                ctx.strokeStyle = '#6f3f8f';
                ctx.lineWidth = 3;
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.stroke();
                this._cache = canvas;
                return;
            }

            if (isCrystal) {
                const crystalGrad = ctx.createLinearGradient(0, oy, 0, oy + h);
                crystalGrad.addColorStop(0, '#6fd2e2');
                crystalGrad.addColorStop(0.46, '#3ca5bb');
                crystalGrad.addColorStop(1, '#1f6d7f');
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.fillStyle = crystalGrad;
                ctx.fill();

                const frostCapH = Math.max(9, Math.min(18, h * 0.2));
                const frostGrad = ctx.createLinearGradient(0, oy, 0, oy + frostCapH);
                frostGrad.addColorStop(0, '#ebfeff');
                frostGrad.addColorStop(0.55, '#bdf1f7');
                frostGrad.addColorStop(1, '#88dce8');
                _roundedRectPath(ctx, ox + 1, oy + 1, Math.max(1, w - 2), frostCapH, Math.max(4, bodyRadius - 2));
                ctx.fillStyle = frostGrad;
                ctx.fill();

                ctx.fillStyle = 'rgba(232, 255, 255, 0.34)';
                const edgeStep = 10;
                for (let x = ox + 2; x < ox + w - 4; x += edgeStep) {
                    const edgeW = Math.min(edgeStep + 2, ox + w - 4 - x);
                    const edgeH = 1 + ((x * 9) % 4);
                    ctx.fillRect(x, oy + frostCapH - 1, edgeW, edgeH);
                }

                ctx.strokeStyle = 'rgba(151, 230, 244, 0.42)';
                ctx.lineWidth = 1.2;
                const veinCount = Math.max(2, Math.floor(w / 96));
                for (let i = 0; i < veinCount; i++) {
                    const vx = ox + w * (0.18 + i * (0.64 / Math.max(1, veinCount - 1)));
                    ctx.beginPath();
                    ctx.moveTo(vx, oy + frostCapH + 5);
                    ctx.bezierCurveTo(vx + 4, oy + h * 0.42, vx - 3, oy + h * 0.68, vx + 4, oy + h - 8);
                    ctx.stroke();
                }

                ctx.fillStyle = 'rgba(196, 245, 255, 0.24)';
                for (let i = 0; i < Math.max(4, Math.floor(w / 70)); i++) {
                    const px = ox + 8 + ((i * 37 + w * 0.13) % Math.max(10, w - 16));
                    const py = oy + frostCapH + 8 + ((i * 19) % Math.max(8, h - frostCapH - 16));
                    ctx.fillRect(px, py, 3 + (i % 3), 2 + ((i + 1) % 3));
                }

                ctx.strokeStyle = '#2f8396';
                ctx.lineWidth = 3;
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.stroke();
                this._cache = canvas;
                return;
            }

            if (isSteampunk) {
                const brassGrad = ctx.createLinearGradient(0, oy, 0, oy + h);
                brassGrad.addColorStop(0, '#a47a4f');
                brassGrad.addColorStop(0.46, '#7a5738');
                brassGrad.addColorStop(1, '#4a3323');
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.fillStyle = brassGrad;
                ctx.fill();

                const pipeCapH = Math.max(9, Math.min(18, h * 0.2));
                const pipeGrad = ctx.createLinearGradient(0, oy, 0, oy + pipeCapH);
                pipeGrad.addColorStop(0, '#d6ac6e');
                pipeGrad.addColorStop(0.55, '#b98a53');
                pipeGrad.addColorStop(1, '#8f683f');
                _roundedRectPath(ctx, ox + 1, oy + 1, Math.max(1, w - 2), pipeCapH, Math.max(4, bodyRadius - 2));
                ctx.fillStyle = pipeGrad;
                ctx.fill();

                ctx.fillStyle = 'rgba(231, 190, 132, 0.34)';
                const seamStep = 10;
                for (let x = ox + 2; x < ox + w - 4; x += seamStep) {
                    const seamW = Math.min(seamStep + 2, ox + w - 4 - x);
                    const seamH = 1 + ((x * 9) % 4);
                    ctx.fillRect(x, oy + pipeCapH - 1, seamW, seamH);
                }

                ctx.strokeStyle = 'rgba(118, 84, 52, 0.44)';
                ctx.lineWidth = 1.4;
                const panelCount = Math.max(2, Math.floor(w / 96));
                for (let i = 0; i < panelCount; i++) {
                    const px = ox + w * (0.18 + i * (0.64 / Math.max(1, panelCount - 1)));
                    ctx.beginPath();
                    ctx.moveTo(px, oy + pipeCapH + 5);
                    ctx.bezierCurveTo(px + 4, oy + h * 0.42, px - 3, oy + h * 0.68, px + 4, oy + h - 8);
                    ctx.stroke();
                }

                ctx.fillStyle = 'rgba(225, 178, 120, 0.26)';
                for (let i = 0; i < Math.max(4, Math.floor(w / 70)); i++) {
                    const px = ox + 8 + ((i * 37 + w * 0.13) % Math.max(10, w - 16));
                    const py = oy + pipeCapH + 8 + ((i * 19) % Math.max(8, h - pipeCapH - 16));
                    ctx.fillRect(px, py, 3 + (i % 3), 2 + ((i + 1) % 3));
                }

                ctx.strokeStyle = '#6a4a2f';
                ctx.lineWidth = 3;
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.stroke();
                this._cache = canvas;
                return;
            }

            if (isDreamscape) {
                const surrealGrad = ctx.createLinearGradient(0, oy, 0, oy + h);
                surrealGrad.addColorStop(0, '#f4d7e8');
                surrealGrad.addColorStop(0.46, '#d9b7d7');
                surrealGrad.addColorStop(1, '#b89ccc');
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.fillStyle = surrealGrad;
                ctx.fill();

                const dreamCapH = Math.max(9, Math.min(18, h * 0.2));
                const dreamCapGrad = ctx.createLinearGradient(0, oy, 0, oy + dreamCapH);
                dreamCapGrad.addColorStop(0, '#ffe6f3');
                dreamCapGrad.addColorStop(0.55, '#f4cfe8');
                dreamCapGrad.addColorStop(1, '#dcb7e8');
                _roundedRectPath(ctx, ox + 1, oy + 1, Math.max(1, w - 2), dreamCapH, Math.max(4, bodyRadius - 2));
                ctx.fillStyle = dreamCapGrad;
                ctx.fill();

                ctx.fillStyle = 'rgba(255, 227, 247, 0.34)';
                const puffStep = 10;
                for (let x = ox + 2; x < ox + w - 4; x += puffStep) {
                    const puffW = Math.min(puffStep + 2, ox + w - 4 - x);
                    const puffH = 1 + ((x * 9) % 4);
                    ctx.fillRect(x, oy + dreamCapH - 1, puffW, puffH);
                }

                ctx.strokeStyle = 'rgba(190, 149, 210, 0.42)';
                ctx.lineWidth = 1.2;
                const veinCount = Math.max(2, Math.floor(w / 96));
                for (let i = 0; i < veinCount; i++) {
                    const vx = ox + w * (0.18 + i * (0.64 / Math.max(1, veinCount - 1)));
                    ctx.beginPath();
                    ctx.moveTo(vx, oy + dreamCapH + 5);
                    ctx.bezierCurveTo(vx + 4, oy + h * 0.42, vx - 3, oy + h * 0.68, vx + 4, oy + h - 8);
                    ctx.stroke();
                }

                ctx.fillStyle = 'rgba(249, 206, 240, 0.24)';
                for (let i = 0; i < Math.max(4, Math.floor(w / 70)); i++) {
                    const px = ox + 8 + ((i * 37 + w * 0.13) % Math.max(10, w - 16));
                    const py = oy + dreamCapH + 8 + ((i * 19) % Math.max(8, h - dreamCapH - 16));
                    ctx.fillRect(px, py, 3 + (i % 3), 2 + ((i + 1) % 3));
                }

                ctx.strokeStyle = '#a57fb7';
                ctx.lineWidth = 3;
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.stroke();
                this._cache = canvas;
                return;
            }

            if (isPrehistoric) {
                const earthGrad = ctx.createLinearGradient(0, oy, 0, oy + h);
                earthGrad.addColorStop(0, '#7a6642');
                earthGrad.addColorStop(0.46, '#5f4f33');
                earthGrad.addColorStop(1, '#3b311f');
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.fillStyle = earthGrad;
                ctx.fill();

                const mossCapH = Math.max(9, Math.min(18, h * 0.2));
                const mossGrad = ctx.createLinearGradient(0, oy, 0, oy + mossCapH);
                mossGrad.addColorStop(0, '#8cb45f');
                mossGrad.addColorStop(0.55, '#6f9448');
                mossGrad.addColorStop(1, '#517337');
                _roundedRectPath(ctx, ox + 1, oy + 1, Math.max(1, w - 2), mossCapH, Math.max(4, bodyRadius - 2));
                ctx.fillStyle = mossGrad;
                ctx.fill();

                ctx.fillStyle = 'rgba(173, 206, 120, 0.32)';
                const edgeStep = 10;
                for (let x = ox + 2; x < ox + w - 4; x += edgeStep) {
                    const edgeW = Math.min(edgeStep + 2, ox + w - 4 - x);
                    const edgeH = 1 + ((x * 9) % 4);
                    ctx.fillRect(x, oy + mossCapH - 1, edgeW, edgeH);
                }

                ctx.strokeStyle = 'rgba(112, 94, 62, 0.44)';
                ctx.lineWidth = 1.3;
                const seamCount = Math.max(2, Math.floor(w / 96));
                for (let i = 0; i < seamCount; i++) {
                    const sx = ox + w * (0.18 + i * (0.64 / Math.max(1, seamCount - 1)));
                    ctx.beginPath();
                    ctx.moveTo(sx, oy + mossCapH + 5);
                    ctx.bezierCurveTo(sx + 4, oy + h * 0.42, sx - 3, oy + h * 0.68, sx + 4, oy + h - 8);
                    ctx.stroke();
                }

                ctx.fillStyle = 'rgba(124, 153, 88, 0.24)';
                for (let i = 0; i < Math.max(4, Math.floor(w / 70)); i++) {
                    const px = ox + 8 + ((i * 37 + w * 0.13) % Math.max(10, w - 16));
                    const py = oy + mossCapH + 8 + ((i * 19) % Math.max(8, h - mossCapH - 16));
                    ctx.fillRect(px, py, 3 + (i % 3), 2 + ((i + 1) % 3));
                }

                ctx.strokeStyle = '#5b4a2f';
                ctx.lineWidth = 3;
                _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
                ctx.stroke();
                this._cache = canvas;
                return;
            }

            const dirtGrad = ctx.createLinearGradient(0, oy, 0, oy + h);
            dirtGrad.addColorStop(0, _shadeColor(pTheme.dirt, 0.18));
            dirtGrad.addColorStop(0.2, pTheme.dirt);
            dirtGrad.addColorStop(1, _shadeColor(pTheme.dirt, -0.22));
            _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
            ctx.fillStyle = dirtGrad;
            ctx.fill();

            const ao = ctx.createLinearGradient(0, oy + grassH, 0, oy + grassH + 16);
            ao.addColorStop(0, _alphaColor('#000000', 0.28));
            ao.addColorStop(1, _alphaColor('#000000', 0));
            ctx.fillStyle = ao;
            ctx.fillRect(ox + 2, oy + grassH, Math.max(1, w - 4), 16);

            const grassGrad = ctx.createLinearGradient(0, oy, 0, oy + grassH);
            grassGrad.addColorStop(0, _shadeColor(pTheme.grass, 0.35));
            grassGrad.addColorStop(1, _shadeColor(pTheme.grass, -0.08));
            _roundedRectPath(ctx, ox + 1, oy + 1, Math.max(1, w - 2), grassH, Math.max(4, bodyRadius - 2));
            ctx.fillStyle = grassGrad;
            ctx.fill();

            // Irregular sod edge for more organic silhouette.
            ctx.fillStyle = _shadeColor(pTheme.grass, -0.22);
            const sodStep = 12;
            for (let x = ox + 2; x < ox + w - 4; x += sodStep) {
                const tuftW = Math.min(sodStep + 4, ox + w - 4 - x);
                const tuftH = 2 + ((x * 17) % 6);
                ctx.fillRect(x, oy + grassH - 1, tuftW, tuftH);
            }

            // Stone/soil strata.
            ctx.strokeStyle = _alphaColor(pTheme.texture, 0.35);
            ctx.lineWidth = 2;
            const strataCount = Math.max(2, Math.floor(h / 42));
            for (let i = 0; i < strataCount; i++) {
                const yLine = oy + grassH + 14 + i * ((h - grassH - 20) / Math.max(1, strataCount - 1));
                ctx.beginPath();
                ctx.moveTo(ox + 8, yLine);
                ctx.bezierCurveTo(ox + w * 0.28, yLine - 3, ox + w * 0.66, yLine + 5, ox + w - 10, yLine - 1);
                ctx.stroke();
            }

            // Pebble/chunk detail
            ctx.fillStyle = _alphaColor(pTheme.texture, 0.45);
            const chunks = Math.max(5, Math.floor(w / 55));
            for (let i = 0; i < chunks; i++) {
                const px = ox + 8 + ((i * 53 + w * 0.17) % Math.max(12, w - 18));
                const py = oy + grassH + 16 + ((i * 29 + h * 0.13) % Math.max(8, h - grassH - 24));
                const pw = 4 + (i % 4);
                const ph = 3 + ((i * 2) % 4);
                ctx.fillRect(px, py, pw, ph);
            }

            ctx.strokeStyle = _shadeColor(pTheme.outline, -0.12);
            ctx.lineWidth = 3;
            _roundedRectPath(ctx, ox, oy, w, h, bodyRadius);
            ctx.stroke();
        }

        this._cache = canvas;
    }

    getFlagBox() {
        if (!this.isVictory) return null;
        return {
            x: this.x + this.width / 2 - 2,
            y: this.y - 80,
            width: 40,
            height: 80
        };
    }

    draw(ctx) {
        if (this._cache) {
            ctx.drawImage(this._cache, this.x - 4, this.y - 4);
        }

        // Draw flag on top for victory platform (extends above the cached area)
        if (this.isVictory) {
            // Flag pole
            ctx.fillStyle = 'white';
            ctx.fillRect(this.x + this.width / 2 - 2, this.y - 80, 4, 80);

            // Flag
            ctx.fillStyle = '#ff5252';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2 + 2, this.y - 80);
            ctx.lineTo(this.x + this.width / 2 + 40, this.y - 60);
            ctx.lineTo(this.x + this.width / 2 + 2, this.y - 40);
            ctx.fill();
        }
    }
}
