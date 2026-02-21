export class Background {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.theme = null;
        this._skyCache = null;
        this.layers = [];
        this.initLayers();
    }

    setTheme(theme) {
        this.theme = theme;
        this._skyCache = null;
        this.initLayers();
    }

    initLayers() {
        this.layers = [];
        const style = this.theme ? this.theme.backgroundStyle : 'default';

        const cloudColor = this.theme ? this.theme.cloudColor : 'rgba(255, 255, 255, 0.5)';
        const mountainColor = this.theme ? this.theme.mountainColor : '#4a5b6e';
        const hillColor = this.theme ? this.theme.hillColor : '#2d433b';

        // High-end parallax configuration - AAA feel
        switch (style) {
            case 'volcano':
                this.layers.push(this.createLayer(0.2, 15, cloudColor, 'smoke'));
                this.layers.push(this.createLayer(0.4, 10, mountainColor, 'volcano'));
                this.layers.push(this.createLayer(0.6, 15, hillColor, 'jagged', 50));
                break;
            case 'cyberpunk':
                this.layers.push(this.createLayer(0.15, 12, 'rgba(255, 0, 255, 0.15)', 'pillar'));
                this.layers.push(this.createLayer(0.35, 10, mountainColor, 'skyscraper'));
                this.layers.push(this.createLayer(0.6, 15, hillColor, 'skyscraper', 100));
                break;
            case 'desert':
                this.layers.push(this.createLayer(0.1, 8, cloudColor, 'cloud'));
                this.layers.push(this.createLayer(0.4, 12, mountainColor, 'dune'));
                this.layers.push(this.createLayer(0.7, 15, hillColor, 'dune', 80));
                break;
            case 'ice':
                this.layers.push(this.createLayer(0.2, 20, cloudColor, 'snowball'));
                this.layers.push(this.createLayer(0.4, 12, mountainColor, 'iceberg'));
                this.layers.push(this.createLayer(0.6, 18, hillColor, 'iceberg', 120));
                break;
            case 'forest':
            case 'prehistoric':
                this.layers.push(this.createLayer(0.2, 10, cloudColor, 'cloud'));
                this.layers.push(this.createLayer(0.4, 15, mountainColor, 'pine-tree'));
                this.layers.push(this.createLayer(0.6, 20, hillColor, 'round-hill', 100));
                break;
            case 'underwater':
                this.layers.push(this.createLayer(0.2, 30, 'rgba(255, 255, 255, 0.2)', 'bubble'));
                this.layers.push(this.createLayer(0.4, 15, mountainColor, 'seaweed'));
                this.layers.push(this.createLayer(0.6, 20, hillColor, 'coral', 50));
                break;
            case 'haunted':
                this.layers.push(this.createLayer(0.2, 10, cloudColor, 'mist'));
                this.layers.push(this.createLayer(0.4, 12, mountainColor, 'dead-tree'));
                this.layers.push(this.createLayer(0.6, 15, hillColor, 'jagged', 100));
                break;
            case 'sky':
                this.layers.push(this.createLayer(0.2, 20, cloudColor, 'fluffy-cloud'));
                this.layers.push(this.createLayer(0.4, 8, mountainColor, 'floating-island'));
                this.layers.push(this.createLayer(0.6, 12, hillColor, 'floating-island', 150));
                break;
            case 'crystal':
                this.layers.push(this.createLayer(0.2, 15, cloudColor, 'crystal-cluster'));
                this.layers.push(this.createLayer(0.4, 12, mountainColor, 'crystal-pillar'));
                this.layers.push(this.createLayer(0.6, 15, hillColor, 'crystal-pillar', 100));
                break;
            case 'steampunk':
                this.layers.push(this.createLayer(0.2, 15, cloudColor, 'smoke-puff'));
                this.layers.push(this.createLayer(0.4, 12, mountainColor, 'industrial-tower'));
                this.layers.push(this.createLayer(0.6, 15, hillColor, 'cog', 100));
                break;
            case 'dreamscape':
                this.layers.push(this.createLayer(0.25, 20, cloudColor, 'sphere'));
                this.layers.push(this.createLayer(0.45, 12, mountainColor, 'impossible-shape'));
                this.layers.push(this.createLayer(0.65, 18, hillColor, 'impossible-shape', 100));
                break;
            case 'ancient':
                this.layers.push(this.createLayer(0.2, 8, cloudColor, 'cloud'));
                this.layers.push(this.createLayer(0.4, 10, mountainColor, 'pyramid'));
                this.layers.push(this.createLayer(0.6, 12, hillColor, 'monolith', 100));
                break;
            case 'swamp':
                this.layers.push(this.createLayer(0.2, 15, cloudColor, 'mist'));
                this.layers.push(this.createLayer(0.4, 12, mountainColor, 'dead-tree'));
                this.layers.push(this.createLayer(0.7, 18, hillColor, 'round-hill', 50));
                break;
            case 'fungus':
                this.layers.push(this.createLayer(0.2, 15, cloudColor, 'smoke'));
                this.layers.push(this.createLayer(0.4, 12, mountainColor, 'mushroom'));
                this.layers.push(this.createLayer(0.6, 20, hillColor, 'mushroom', 80));
                break;
            default:
                this.layers.push(this.createLayer(0.2, 10, cloudColor, 'cloud'));
                this.layers.push(this.createLayer(0.4, 15, mountainColor, 'mountain'));
                this.layers.push(this.createLayer(0.6, 20, hillColor, 'mountain', 100));
        }
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this._skyCache = null;
        this.initLayers();
    }

    createLayer(parallaxFactor, count, color, shapeType, yOffset = 0) {
        const shapes = [];
        for (let i = 0; i < count; i++) {
            shapes.push({
                x: Math.random() * 5000,
                y: this.height - Math.random() * 400 - yOffset,
                size: 50 + Math.random() * 150,
                width: 100 + Math.random() * 300,
                variation: Math.random(),
                seed: Math.random() * 1000
            });

            // Adjust Y for sky/floating types
            if (shapeType === 'cloud' || shapeType === 'smoke' || shapeType === 'smoke-puff' ||
                shapeType === 'fluffy-cloud' || shapeType === 'mist' || shapeType === 'bubble' ||
                shapeType === 'sphere' || shapeType === 'snowball') {
                shapes[i].y = Math.random() * this.height * 0.7;
            }
        }
        return { parallaxFactor, color, shapeType, shapes };
    }

    _buildSkyCache() {
        const skyColors = this.theme ? this.theme.skyGradient : ['#0a0a2a', '#87ceeb'];
        let canvas;
        try {
            canvas = new OffscreenCanvas(2, this.height);
        } catch {
            canvas = document.createElement('canvas');
            canvas.width = 2;
            canvas.height = this.height;
        }
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, skyColors[0]);
        gradient.addColorStop(1, skyColors[1]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 2, this.height);
        this._skyCache = canvas;
    }

    draw(ctx, cameraX, cameraY) {
        if (!this._skyCache) this._buildSkyCache();
        ctx.drawImage(this._skyCache, 0, 0, this.width, this.height);

        for (let li = 0; li < this.layers.length; li++) {
            const layer = this.layers[li];
            ctx.fillStyle = layer.color;
            ctx.beginPath();

            const offsetX = cameraX * layer.parallaxFactor;
            const offsetY = cameraY * (layer.parallaxFactor * 0.5);

            for (let si = 0; si < layer.shapes.length; si++) {
                const shape = layer.shapes[si];
                let x = ((shape.x - offsetX) % 5000 + 5000) % 5000 - 1000;
                let y = shape.y - offsetY;

                if (x + shape.width < -300 || x - shape.width > this.width + 300) continue;

                this.drawShape(ctx, layer.shapeType, x, y, shape);
            }
            ctx.fill();
        }
    }

    drawShape(ctx, type, x, y, shape) {
        const w = shape.width;
        const h = shape.size;

        switch (type) {
            case 'cloud':
            case 'smoke':
            case 'mist':
                ctx.moveTo(x, y);
                ctx.arc(x, y, h / 2, 0, Math.PI * 2);
                ctx.arc(x + w / 3, y - h / 4, h / 1.5, 0, Math.PI * 2);
                ctx.arc(x + w / 1.5, y, h / 2, 0, Math.PI * 2);
                break;
            case 'fluffy-cloud':
                ctx.moveTo(x, y);
                for (let i = 0; i < 3; i++) {
                    ctx.arc(x + (i * w / 4), y + Math.sin(i + shape.seed) * 10, h / 2, 0, Math.PI * 2);
                }
                break;
            case 'mountain':
                ctx.moveTo(x - w / 2, this.height + 500);
                ctx.lineTo(x, y);
                ctx.lineTo(x + w / 2, this.height + 500);
                break;
            case 'volcano':
                ctx.moveTo(x - w / 2, this.height + 500);
                ctx.lineTo(x - w / 4, y + h / 3);
                ctx.lineTo(x, y);
                ctx.lineTo(x + w / 4, y + h / 3);
                ctx.lineTo(x + w / 2, this.height + 500);
                break;
            case 'jagged':
                ctx.moveTo(x - w / 2, this.height + 500);
                for (let i = 0; i < 5; i++) {
                    ctx.lineTo(x - w / 2 + (i * w / 4), y + (i % 2 === 0 ? 0 : h / 2));
                }
                ctx.lineTo(x + w / 2, this.height + 500);
                break;
            case 'skyscraper':
                ctx.rect(x - w / 4, y, w / 2, this.height - y + 500);
                break;
            case 'dune':
                ctx.moveTo(x - w, this.height + 510);
                ctx.bezierCurveTo(x - w / 2, y, x + w / 2, y, x + w, this.height + 510);
                break;
            case 'iceberg':
                ctx.moveTo(x - w / 2, this.height + 500);
                ctx.lineTo(x - w / 3, y + h / 4);
                ctx.lineTo(x - w / 6, y);
                ctx.lineTo(x + w / 6, y + h / 2);
                ctx.lineTo(x + w / 3, y + h / 6);
                ctx.lineTo(x + w / 2, this.height + 500);
                break;
            case 'pine-tree':
                const trunkW = w / 10;
                ctx.rect(x - trunkW / 2, y + h / 2, trunkW, this.height - y);
                ctx.moveTo(x - w / 2, y + h);
                ctx.lineTo(x, y);
                ctx.lineTo(x + w / 2, y + h);
                break;
            case 'round-hill':
                ctx.moveTo(x - w, this.height + 510);
                ctx.quadraticCurveTo(x, y, x + w, this.height + 510);
                break;
            case 'bubble':
            case 'sphere':
            case 'snowball':
                ctx.moveTo(x + h / 2, y);
                ctx.arc(x, y, h / 2, 0, Math.PI * 2);
                break;
            case 'seaweed':
                ctx.moveTo(x, this.height + 510);
                for (let i = 0; i < 5; i++) {
                    ctx.quadraticCurveTo(x + Math.sin(y / 50 + i + shape.seed) * 20, y + (i * h / 5), x, y + ((i + 1) * h / 5));
                }
                break;
            case 'floating-island':
                ctx.moveTo(x - w / 2, y);
                ctx.lineTo(x + w / 2, y);
                ctx.lineTo(x + w / 4, y + h);
                ctx.lineTo(x - w / 4, y + h);
                ctx.closePath();
                break;
            case 'crystal-pillar':
                ctx.moveTo(x - w / 4, this.height + 500);
                ctx.lineTo(x - w / 4, y + h / 4);
                ctx.lineTo(x, y);
                ctx.lineTo(x + w / 4, y + h / 4);
                ctx.lineTo(x + w / 4, this.height + 500);
                break;
            case 'industrial-tower':
                ctx.rect(x - w / 6, y, w / 3, this.height - y + 500);
                ctx.rect(x - w / 4, y + h / 2, w / 2, h / 10);
                break;
            case 'pyramid':
                ctx.moveTo(x - w, this.height + 500);
                ctx.lineTo(x, y);
                ctx.lineTo(x + w, this.height + 500);
                break;
            case 'monolith':
                ctx.rect(x - w / 8, y, w / 4, this.height - y + 500);
                break;
            case 'impossible-shape':
                ctx.moveTo(x, y);
                ctx.lineTo(x + w / 2, y + h / 2);
                ctx.lineTo(x, y + h);
                ctx.lineTo(x - w / 2, y + h / 2);
                ctx.closePath();
                break;
            case 'mushroom':
                ctx.rect(x - w / 10, y + h / 2, w / 5, this.height - y);
                ctx.moveTo(x + w / 2, y + h / 2);
                ctx.ellipse(x, y + h / 2, w / 2, h / 2, 0, 0, Math.PI, true);
                break;
            case 'pillar':
                ctx.rect(x - w / 10, y, w / 5, this.height - y + 500);
                break;
            case 'coral':
                ctx.moveTo(x, this.height + 500);
                ctx.lineTo(x - w / 4, y + h / 2);
                ctx.lineTo(x - w / 2, y);
                ctx.moveTo(x, this.height + 500);
                ctx.lineTo(x + w / 4, y + h / 2);
                ctx.lineTo(x + w / 2, y);
                break;
            case 'smoke-puff':
                ctx.moveTo(x, y);
                for (let i = 0; i < 3; i++) {
                    ctx.arc(x + Math.cos(i) * w / 3, y + Math.sin(i) * w / 3, h / 2, 0, Math.PI * 2);
                }
                break;
            case 'crystal-cluster':
                ctx.moveTo(x, y);
                ctx.lineTo(x + w / 4, y + h / 2);
                ctx.lineTo(x, y + h);
                ctx.lineTo(x - w / 4, y + h / 2);
                ctx.closePath();
                ctx.moveTo(x + w / 3, y + h / 3);
                ctx.lineTo(x + w / 2, y + h / 1.5);
                ctx.lineTo(x + w / 3, y + h);
                ctx.lineTo(x + w / 6, y + h / 1.5);
                ctx.closePath();
                break;
            default:
                ctx.moveTo(x - w / 2, this.height + 500);
                ctx.lineTo(x, y);
                ctx.lineTo(x + w / 2, this.height + 500);
        }
    }
}
