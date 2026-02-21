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
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(ox, oy, w, h);
            ctx.strokeStyle = '#B8860B';
            ctx.lineWidth = 4;
            ctx.strokeRect(ox, oy, w, h);
        } else {
            const pTheme = this.theme ? this.theme.platform : {
                dirt: '#5D4037',
                grass: '#4CAF50',
                texture: '#4e342e',
                outline: '#3e2723'
            };

            // Dirt body
            ctx.fillStyle = pTheme.dirt;
            ctx.fillRect(ox, oy, w, h);

            // Grass top
            ctx.fillStyle = pTheme.grass;
            ctx.fillRect(ox, oy, w, Math.min(20, h));

            // Texture elements
            ctx.fillStyle = pTheme.texture;
            for (let i = 10; i < w; i += 40) {
                if (i + 10 < w && h > 20) {
                    ctx.fillRect(ox + i, oy + 20 + (i % 3) * 10, 15, 10);
                }
            }

            // Outline
            ctx.strokeStyle = pTheme.outline;
            ctx.lineWidth = 4;
            ctx.strokeRect(ox, oy, w, h);
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
