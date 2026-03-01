function alphaFromColor(color, alpha) {
    if (typeof color !== 'string') return color;
    const hex = color.trim().match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
    if (hex) {
        let h = hex[1];
        if (h.length === 3) h = h.split('').map(ch => ch + ch).join('');
        const v = parseInt(h, 16);
        const r = (v >> 16) & 255;
        const g = (v >> 8) & 255;
        const b = v & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    if (color.startsWith('rgba(')) return color.replace(/rgba\(([^)]+),\s*[^)]+\)/, `rgba($1, ${alpha})`);
    if (color.startsWith('rgb(')) return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
    return color;
}

const SHAPE_DENSITY_REDUCTION = 0.15;

export class Background {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.theme = null;
        this._skyCache = null;
        this._qualityEma = 1;
        this._useLiteMode = false;
        this.layers = [];
        this.initLayers();
    }

    setTheme(theme) {
        this.theme = theme;
        this._skyCache = null;
        this._qualityEma = 1;
        this._useLiteMode = false;
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
                this.layers.push(this.createLayer(0.16, 8, 'rgba(18, 18, 22, 0.78)', 'ash-cloud'));
                this.layers.push(this.createLayer(0.3, 7, 'rgba(38, 32, 34, 0.6)', 'dark-cloud'));
                this.layers.push(this.createLayer(0.42, 7, mountainColor, 'volcano-real'));
                this.layers.push(this.createLayer(0.58, 10, hillColor, 'lava-ridge', 45));
                this.layers.push(this.createLayer(0.72, 8, '#1b0808', 'rock-spire', 18));
                break;
            case 'cyberpunk':
                this.layers.push(this.createLayer(0.12, 10, 'rgba(255, 80, 230, 0.2)', 'neon-haze'));
                this.layers.push(this.createLayer(0.32, 9, mountainColor, 'mega-tower'));
                this.layers.push(this.createLayer(0.52, 10, hillColor, 'antenna-spire', 40));
                this.layers.push(this.createLayer(0.72, 8, '#120024', 'city-band', 100));
                break;
            case 'desert':
                this.layers.push(this.createLayer(0.14, 8, 'rgba(255, 232, 188, 0.36)', 'dust-cloud'));
                this.layers.push(this.createLayer(0.34, 6, mountainColor, 'desert-pyramid'));
                this.layers.push(this.createLayer(0.56, 11, hillColor, 'desert-dune', 82));
                this.layers.push(this.createLayer(0.74, 10, '#8d6e53', 'desert-rock', 40));
                break;
            case 'ice':
                this.layers.push(this.createLayer(0.14, 10, 'rgba(245, 252, 255, 0.8)', 'frost-cloud'));
                this.layers.push(this.createLayer(0.34, 8, mountainColor, 'glacier-peak'));
                this.layers.push(this.createLayer(0.56, 10, hillColor, 'ice-ridge', 90));
                this.layers.push(this.createLayer(0.74, 9, '#d8efff', 'snow-drift', 36));
                break;
            case 'forest':
                this.layers.push(this.createLayer(0.16, 8, 'rgba(205, 232, 206, 0.32)', 'forest-cloud'));
                this.layers.push(this.createLayer(0.34, 9, mountainColor, 'forest-ridge'));
                this.layers.push(this.createLayer(0.54, 11, hillColor, 'pine-cluster', 80));
                this.layers.push(this.createLayer(0.72, 10, '#1f3b1f', 'forest-hill', 35));
                break;
            case 'prehistoric':
                this.layers.push(this.createLayer(0.14, 9, 'rgba(255, 220, 150, 0.28)', 'prehistoric-haze'));
                this.layers.push(this.createLayer(0.34, 8, mountainColor, 'prehistoric-mesa'));
                this.layers.push(this.createLayer(0.56, 10, hillColor, 'cycad-cluster', 74));
                this.layers.push(this.createLayer(0.74, 10, '#5b4a2e', 'fern-mound', 38));
                break;
            case 'underwater':
                this.layers.push(this.createLayer(0.12, 12, 'rgba(190, 238, 255, 0.28)', 'water-haze'));
                this.layers.push(this.createLayer(0.3, 9, mountainColor, 'reef-mass'));
                this.layers.push(this.createLayer(0.5, 11, hillColor, 'kelp-forest', 56));
                this.layers.push(this.createLayer(0.7, 12, '#2a6d88', 'coral-fan', 26));
                break;
            case 'haunted':
                this.layers.push(this.createLayer(0.14, 10, 'rgba(190, 170, 215, 0.24)', 'haunted-fog'));
                this.layers.push(this.createLayer(0.34, 8, mountainColor, 'haunted-spire'));
                this.layers.push(this.createLayer(0.56, 10, hillColor, 'dead-tree-gnarled', 62));
                this.layers.push(this.createLayer(0.74, 10, '#2a1a3d', 'grave-hill', 100));
                break;
            case 'sky':
                this.layers.push(this.createLayer(0.06, 7, 'rgba(255, 255, 255, 0.14)', 'sky-cirrus-band'));
                this.layers.push(this.createLayer(0.18, 8, 'rgba(255, 255, 255, 0.22)', 'sky-sunlit-cloud'));
                this.layers.push(this.createLayer(0.36, 3, '#d7ebf8', 'sky-archipelago-far'));
                this.layers.push(this.createLayer(0.54, 2, '#9ec4dd', 'sky-archipelago-mid'));
                this.layers.push(this.createLayer(0.76, 7, 'rgba(255, 255, 255, 0.36)', 'sky-sunlit-cloud'));
                break;
            case 'crystal':
                this.layers.push(this.createLayer(0.14, 10, 'rgba(172, 244, 255, 0.28)', 'crystal-haze'));
                this.layers.push(this.createLayer(0.34, 9, mountainColor, 'crystal-shard'));
                this.layers.push(this.createLayer(0.56, 10, hillColor, 'crystal-spire', 70));
                this.layers.push(this.createLayer(0.74, 9, '#0a5f6a', 'geode-ridge', 36));
                break;
            case 'steampunk':
                this.layers.push(this.createLayer(0.14, 10, 'rgba(186, 151, 123, 0.3)', 'steam-plume'));
                this.layers.push(this.createLayer(0.34, 9, mountainColor, 'smokestack-tower'));
                this.layers.push(this.createLayer(0.56, 10, hillColor, 'gear-spire', 80));
                this.layers.push(this.createLayer(0.74, 9, '#4d3424', 'factory-ridge', 42));
                break;
            case 'dreamscape':
                this.layers.push(this.createLayer(0.14, 11, 'rgba(255, 214, 230, 0.32)', 'dream-mist'));
                this.layers.push(this.createLayer(0.34, 9, mountainColor, 'dream-orb'));
                this.layers.push(this.createLayer(0.56, 10, hillColor, 'dream-ribbon', 80));
                this.layers.push(this.createLayer(0.74, 9, '#b489b4', 'dream-monolith', 44));
                break;
            case 'ancient':
                this.layers.push(this.createLayer(0.14, 8, 'rgba(214, 196, 170, 0.32)', 'ancient-dust'));
                this.layers.push(this.createLayer(0.34, 7, mountainColor, 'ziggurat'));
                this.layers.push(this.createLayer(0.56, 10, hillColor, 'obelisk-ruin', 80));
                this.layers.push(this.createLayer(0.74, 10, '#5f5144', 'ruin-mound', 42));
                break;
            case 'swamp':
                this.layers.push(this.createLayer(0.14, 10, 'rgba(150, 180, 145, 0.32)', 'swamp-fog'));
                this.layers.push(this.createLayer(0.34, 9, mountainColor, 'mangrove'));
                this.layers.push(this.createLayer(0.56, 11, hillColor, 'bog-mound', 46));
                this.layers.push(this.createLayer(0.74, 11, '#2f4535', 'swamp-reed', 28));
                break;
            case 'fungus':
                this.layers.push(this.createLayer(0.1, 22, 'rgba(244, 212, 255, 0.3)', 'fungus-ambient-spore'));
                this.layers.push(this.createLayer(0.26, 6, '#7d5b8e', 'fungus-canopy-far'));
                this.layers.push(this.createLayer(0.48, 6, '#604073', 'fungus-canopy-mid'));
                this.layers.push(this.createLayer(0.72, 6, '#41204f', 'fungus-cluster-near'));
                this.layers.push(this.createLayer(0.9, 10, 'rgba(219, 173, 238, 0.22)', 'fungus-mycelium-mist'));
                break;
            default:
                this.layers.push(this.createLayer(0.2, 10, cloudColor, 'cloud'));
                this.layers.push(this.createLayer(0.4, 15, mountainColor, 'mountain'));
                this.layers.push(this.createLayer(0.6, 20, hillColor, 'mountain', 100));
        }
    }

    resize(width, height) {
        const prevWidth = this.width || 1;
        const prevHeight = this.height || 1;
        const nextWidth = Math.max(1, Math.floor(width || 1));
        const nextHeight = Math.max(1, Math.floor(height || 1));
        const widthDelta = Math.abs(nextWidth - prevWidth);
        const heightDelta = Math.abs(nextHeight - prevHeight);
        const shouldRescaleGeometry = heightDelta > 2;

        // Preserve the level's generated background layout across runtime resizes
        // (e.g. adaptive DPR changes) so visuals never "re-roll" mid-level.
        if (shouldRescaleGeometry && Array.isArray(this.layers) && this.layers.length > 0) {
            const yScale = nextHeight / prevHeight;
            const geometricScale = Math.sqrt(yScale);
            for (let li = 0; li < this.layers.length; li++) {
                const layer = this.layers[li];
                if (!layer || !Array.isArray(layer.shapes)) continue;
                for (let si = 0; si < layer.shapes.length; si++) {
                    const shape = layer.shapes[si];
                    shape.y *= yScale;
                    shape.size *= geometricScale;
                    shape.width *= geometricScale;
                }
            }
        }

        this.width = nextWidth;
        this.height = nextHeight;
        if (heightDelta > 0 || widthDelta > 2) {
            this._skyCache = null;
        }
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

            if (shapeType === 'sky-cumulus') {
                shapes[i].size = 90 + Math.random() * 130;
                shapes[i].width = 240 + Math.random() * 380;
            }
            if (shapeType === 'sky-island') {
                shapes[i].size = 130 + Math.random() * 170;
                shapes[i].width = 210 + Math.random() * 260;
            }
            if (shapeType === 'sky-spire') {
                shapes[i].size = 150 + Math.random() * 190;
                shapes[i].width = 90 + Math.random() * 140;
            }

            // Adjust Y for sky/floating types
            if (shapeType === 'cloud' || shapeType === 'smoke' || shapeType === 'smoke-puff' ||
                shapeType === 'fluffy-cloud' || shapeType === 'mist' || shapeType === 'bubble' ||
                shapeType === 'sphere' || shapeType === 'snowball' || shapeType === 'ash-cloud' ||
                shapeType === 'dark-cloud' || shapeType === 'forest-cloud' || shapeType === 'frost-cloud' ||
                shapeType === 'dust-cloud') {
                shapes[i].y = Math.random() * this.height * 0.7;
            }
            if (shapeType === 'sky-cumulus') {
                shapes[i].y = this.height * 0.06 + Math.random() * this.height * 0.58 + yOffset;
            }
            if (shapeType === 'haunted-fog') {
                shapes[i].y = this.height * 0.16 + Math.random() * this.height * 0.5;
            }
            if (shapeType === 'neon-haze') {
                shapes[i].y = this.height * 0.08 + Math.random() * this.height * 0.4;
            }
            if (shapeType === 'ancient-dust') {
                shapes[i].y = this.height * 0.12 + Math.random() * this.height * 0.46;
            }
            if (shapeType === 'spore-haze') {
                shapes[i].y = this.height * 0.12 + Math.random() * this.height * 0.5;
            }
            if (shapeType === 'crystal-haze') {
                shapes[i].y = this.height * 0.1 + Math.random() * this.height * 0.5;
            }
            if (shapeType === 'steam-plume') {
                shapes[i].y = this.height * 0.08 + Math.random() * this.height * 0.48;
            }
            if (shapeType === 'dream-mist') {
                shapes[i].y = this.height * 0.1 + Math.random() * this.height * 0.5;
            }
            if (shapeType === 'prehistoric-haze') {
                shapes[i].y = this.height * 0.1 + Math.random() * this.height * 0.48;
            }
            if (shapeType === 'water-haze') {
                shapes[i].y = this.height * 0.12 + Math.random() * this.height * 0.62;
            }
            if (shapeType === 'crystal-shard' || shapeType === 'crystal-spire' || shapeType === 'geode-ridge') {
                shapes[i].y = this.height * 0.22 + Math.random() * this.height * 0.66;
            }
            if (shapeType === 'dream-orb' || shapeType === 'dream-ribbon' || shapeType === 'dream-monolith') {
                shapes[i].y = this.height * 0.2 + Math.random() * this.height * 0.66;
            }
            if (shapeType === 'prehistoric-mesa' || shapeType === 'cycad-cluster' || shapeType === 'fern-mound') {
                shapes[i].y = this.height * 0.24 + Math.random() * this.height * 0.66;
            }
            if (shapeType === 'smokestack-tower' || shapeType === 'gear-spire' || shapeType === 'factory-ridge') {
                shapes[i].y = this.height * 0.24 + Math.random() * this.height * 0.64;
            }
            if (shapeType === 'ziggurat' || shapeType === 'obelisk-ruin' || shapeType === 'ruin-mound') {
                shapes[i].y = this.height * 0.26 + Math.random() * this.height * 0.62;
            }
            if (shapeType === 'giant-mushroom' || shapeType === 'fungal-stalk' || shapeType === 'mycelium-mound') {
                shapes[i].y = this.height * 0.24 + Math.random() * this.height * 0.64;
            }
            if (shapeType === 'mega-tower' || shapeType === 'antenna-spire' || shapeType === 'city-band') {
                shapes[i].y = this.height * 0.24 + Math.random() * this.height * 0.62;
            }
            if (shapeType === 'reef-mass' || shapeType === 'kelp-forest' || shapeType === 'coral-fan') {
                shapes[i].y = this.height * 0.34 + Math.random() * this.height * 0.56;
            }
            if (shapeType === 'swamp-fog') {
                shapes[i].y = this.height * 0.18 + Math.random() * this.height * 0.45;
            }
            if (shapeType === 'sky-island') {
                shapes[i].y = this.height * 0.18 + Math.random() * this.height * 0.52;
            }
            if (shapeType === 'sky-spire') {
                shapes[i].y = this.height * 0.24 + Math.random() * this.height * 0.56;
            }

            if (shapeType === 'sky-cirrus-band') {
                shapes[i].size = 70 + Math.random() * 120;
                shapes[i].width = 380 + Math.random() * 520;
                shapes[i].y = this.height * 0.05 + Math.random() * this.height * 0.35 + yOffset;
            }
            if (shapeType === 'sky-archipelago-far') {
                shapes[i].size = 110 + Math.random() * 150;
                shapes[i].width = 220 + Math.random() * 320;
                shapes[i].y = this.height * 0.16 + Math.random() * this.height * 0.34 + yOffset;
            }
            if (shapeType === 'sky-archipelago-mid') {
                shapes[i].size = 140 + Math.random() * 200;
                shapes[i].width = 240 + Math.random() * 380;
                shapes[i].y = this.height * 0.28 + Math.random() * this.height * 0.36 + yOffset;
            }
            if (shapeType === 'sky-archipelago-near') {
                shapes[i].size = 170 + Math.random() * 220;
                shapes[i].width = 280 + Math.random() * 420;
                shapes[i].y = this.height * 0.38 + Math.random() * this.height * 0.34 + yOffset;
            }
            if (shapeType === 'sky-sunlit-cloud') {
                shapes[i].size = 130 + Math.random() * 180;
                shapes[i].width = 300 + Math.random() * 480;
                shapes[i].y = this.height * 0.56 + Math.random() * this.height * 0.28 + yOffset;
            }

            if (shapeType === 'fungus-ambient-spore') {
                shapes[i].size = 7 + Math.random() * 22;
                shapes[i].width = shapes[i].size * (1 + Math.random() * 0.35);
                shapes[i].y = Math.random() * this.height;
            }
            if (shapeType === 'fungus-canopy-far') {
                shapes[i].size = 160 + Math.random() * 220;
                shapes[i].width = 180 + Math.random() * 240;
                shapes[i].y = this.height * 0.28 + Math.random() * this.height * 0.26 + yOffset;
            }
            if (shapeType === 'fungus-canopy-mid') {
                shapes[i].size = 210 + Math.random() * 260;
                shapes[i].width = 210 + Math.random() * 280;
                shapes[i].y = this.height * 0.38 + Math.random() * this.height * 0.26 + yOffset;
            }
            if (shapeType === 'fungus-cluster-near') {
                shapes[i].size = 120 + Math.random() * 170;
                shapes[i].width = 180 + Math.random() * 260;
                shapes[i].y = this.height * 0.62 + Math.random() * this.height * 0.24 + yOffset;
            }
            if (shapeType === 'fungus-mycelium-mist') {
                shapes[i].size = 80 + Math.random() * 120;
                shapes[i].width = 320 + Math.random() * 440;
                shapes[i].y = this.height * 0.72 + Math.random() * this.height * 0.2 + yOffset;
            }
        }
        // Randomly thin shape population so removal is peppered and not obvious.
        if (shapes.length > 1 && SHAPE_DENSITY_REDUCTION > 0) {
            const kept = [];
            for (let i = 0; i < shapes.length; i++) {
                if (Math.random() >= SHAPE_DENSITY_REDUCTION) kept.push(shapes[i]);
            }
            if (kept.length === 0) kept.push(shapes[Math.floor(Math.random() * shapes.length)]);
            return { parallaxFactor, color, shapeType, shapes: kept };
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

    _drawLiteBackground(ctx, cameraX, cameraY, quality) {
        const maxLayers = Math.min(quality < 0.45 ? 1 : 2, this.layers.length);
        const step = quality < 0.35 ? 5 : (quality < 0.55 ? 4 : (quality < 0.72 ? 3 : 2));

        for (let li = 0; li < maxLayers; li++) {
            const layer = this.layers[li];
            const depthAlpha = 0.2 + li * 0.2;
            const offsetX = cameraX * layer.parallaxFactor * 0.35;
            const offsetY = cameraY * layer.parallaxFactor * 0.14;
            ctx.fillStyle = alphaFromColor(layer.color, depthAlpha);

            for (let si = 0; si < layer.shapes.length; si += step) {
                const shape = layer.shapes[si];
                let x = ((shape.x - offsetX) % 5000 + 5000) % 5000 - 1000;
                const y = shape.y - offsetY;
                if (x + shape.width < -220 || x - shape.width > this.width + 220) continue;

                ctx.beginPath();
                this.drawShape(ctx, layer.shapeType, x, y, shape);
                ctx.fill();
            }
        }
    }

    draw(ctx, cameraX, cameraY, quality = 1) {
        if (!this._skyCache) this._buildSkyCache();
        ctx.drawImage(this._skyCache, 0, 0, this.width, this.height);

        const horizon = ctx.createLinearGradient(0, this.height * 0.38, 0, this.height);
        horizon.addColorStop(0, 'rgba(255, 255, 255, 0)');
        horizon.addColorStop(1, 'rgba(0, 0, 0, 0.14)');
        ctx.fillStyle = horizon;
        ctx.fillRect(0, 0, this.width, this.height);

        const clampedQuality = Math.max(0, Math.min(1, Number(quality) || 1));
        this._qualityEma = this._qualityEma * 0.9 + clampedQuality * 0.1;
        // Hysteresis avoids rapid full<->lite toggling that looks like background redraw flicker.
        if (!this._useLiteMode && this._qualityEma < 0.72) {
            this._useLiteMode = true;
        } else if (this._useLiteMode && this._qualityEma > 0.94) {
            this._useLiteMode = false;
        }

        if (this._useLiteMode) {
            this._drawLiteBackground(ctx, cameraX, cameraY, this._qualityEma);
            return;
        }

        // Motion-comfort reduction: keep parallax movement much calmer.
        const motionScaleX = 0.45;
        const motionScaleY = 0.24;

        for (let li = 0; li < this.layers.length; li++) {
            const layer = this.layers[li];
            const depthAlpha = 0.28 + li * 0.22;
            const offsetX = cameraX * layer.parallaxFactor * motionScaleX;
            const offsetY = cameraY * (layer.parallaxFactor * 0.5) * motionScaleY;

            for (let si = 0; si < layer.shapes.length; si++) {
                const shape = layer.shapes[si];
                let x = ((shape.x - offsetX) % 5000 + 5000) % 5000 - 1000;
                let y = shape.y - offsetY;

                if (x + shape.width < -300 || x - shape.width > this.width + 300) continue;

                if (this.theme && this.theme.backgroundStyle === 'volcano') {
                    if (layer.shapeType === 'ash-cloud' || layer.shapeType === 'dark-cloud' ||
                        layer.shapeType === 'volcano-real' || layer.shapeType === 'lava-ridge' ||
                        layer.shapeType === 'rock-spire') {
                        this.drawVolcanicShape(ctx, layer.shapeType, x, y, shape, depthAlpha, layer.color);
                        continue;
                    }
                }
                if (this.theme && this.theme.backgroundStyle === 'forest') {
                    if (layer.shapeType === 'forest-cloud' || layer.shapeType === 'forest-ridge' ||
                        layer.shapeType === 'pine-cluster' || layer.shapeType === 'forest-hill') {
                        this.drawForestShape(ctx, layer.shapeType, x, y, shape, depthAlpha, layer.color);
                        continue;
                    }
                }
                if (this.theme && this.theme.backgroundStyle === 'ice') {
                    if (layer.shapeType === 'frost-cloud' || layer.shapeType === 'glacier-peak' ||
                        layer.shapeType === 'ice-ridge' || layer.shapeType === 'snow-drift') {
                        this.drawIceShape(ctx, layer.shapeType, x, y, shape, depthAlpha, layer.color);
                        continue;
                    }
                }
                if (this.theme && this.theme.backgroundStyle === 'desert') {
                    if (layer.shapeType === 'dust-cloud' || layer.shapeType === 'desert-pyramid' ||
                        layer.shapeType === 'desert-dune' || layer.shapeType === 'desert-rock') {
                        this.drawDesertShape(ctx, layer.shapeType, x, y, shape, depthAlpha, layer.color);
                        continue;
                    }
                }
                if (this.theme && this.theme.backgroundStyle === 'sky') {
                    if (layer.shapeType === 'sky-cirrus-band' || layer.shapeType === 'sky-archipelago-far' ||
                        layer.shapeType === 'sky-archipelago-mid' || layer.shapeType === 'sky-archipelago-near' ||
                        layer.shapeType === 'sky-sunlit-cloud') {
                        this.drawSkyShape(ctx, layer.shapeType, x, y, shape, depthAlpha, layer.color);
                        continue;
                    }
                }
                if (this.theme && this.theme.backgroundStyle === 'swamp') {
                    if (layer.shapeType === 'swamp-fog' || layer.shapeType === 'mangrove' ||
                        layer.shapeType === 'bog-mound' || layer.shapeType === 'swamp-reed') {
                        this.drawSwampShape(ctx, layer.shapeType, x, y, shape, depthAlpha, layer.color);
                        continue;
                    }
                }
                if (this.theme && this.theme.backgroundStyle === 'haunted') {
                    if (layer.shapeType === 'haunted-fog' || layer.shapeType === 'haunted-spire' ||
                        layer.shapeType === 'dead-tree-gnarled' || layer.shapeType === 'grave-hill') {
                        this.drawHauntedShape(ctx, layer.shapeType, x, y, shape, depthAlpha, layer.color);
                        continue;
                    }
                }
                if (this.theme && this.theme.backgroundStyle === 'underwater') {
                    if (layer.shapeType === 'water-haze' || layer.shapeType === 'reef-mass' ||
                        layer.shapeType === 'kelp-forest' || layer.shapeType === 'coral-fan') {
                        this.drawUnderwaterShape(ctx, layer.shapeType, x, y, shape, depthAlpha, layer.color);
                        continue;
                    }
                }
                if (this.theme && this.theme.backgroundStyle === 'cyberpunk') {
                    if (layer.shapeType === 'neon-haze' || layer.shapeType === 'mega-tower' ||
                        layer.shapeType === 'antenna-spire' || layer.shapeType === 'city-band') {
                        this.drawCyberpunkShape(ctx, layer.shapeType, x, y, shape, depthAlpha, layer.color);
                        continue;
                    }
                }
                if (this.theme && this.theme.backgroundStyle === 'ancient') {
                    if (layer.shapeType === 'ancient-dust' || layer.shapeType === 'ziggurat' ||
                        layer.shapeType === 'obelisk-ruin' || layer.shapeType === 'ruin-mound') {
                        this.drawAncientShape(ctx, layer.shapeType, x, y, shape, depthAlpha, layer.color);
                        continue;
                    }
                }
                if (this.theme && this.theme.backgroundStyle === 'fungus') {
                    if (layer.shapeType === 'fungus-ambient-spore' || layer.shapeType === 'fungus-canopy-far' ||
                        layer.shapeType === 'fungus-canopy-mid' || layer.shapeType === 'fungus-cluster-near' ||
                        layer.shapeType === 'fungus-mycelium-mist') {
                        this.drawFungusShape(ctx, layer.shapeType, x, y, shape, depthAlpha, layer.color);
                        continue;
                    }
                }
                if (this.theme && this.theme.backgroundStyle === 'crystal') {
                    if (layer.shapeType === 'crystal-haze' || layer.shapeType === 'crystal-shard' ||
                        layer.shapeType === 'crystal-spire' || layer.shapeType === 'geode-ridge') {
                        this.drawCrystalShape(ctx, layer.shapeType, x, y, shape, depthAlpha, layer.color);
                        continue;
                    }
                }
                if (this.theme && this.theme.backgroundStyle === 'steampunk') {
                    if (layer.shapeType === 'steam-plume' || layer.shapeType === 'smokestack-tower' ||
                        layer.shapeType === 'gear-spire' || layer.shapeType === 'factory-ridge') {
                        this.drawSteampunkShape(ctx, layer.shapeType, x, y, shape, depthAlpha, layer.color);
                        continue;
                    }
                }
                if (this.theme && this.theme.backgroundStyle === 'dreamscape') {
                    if (layer.shapeType === 'dream-mist' || layer.shapeType === 'dream-orb' ||
                        layer.shapeType === 'dream-ribbon' || layer.shapeType === 'dream-monolith') {
                        this.drawDreamscapeShape(ctx, layer.shapeType, x, y, shape, depthAlpha, layer.color);
                        continue;
                    }
                }
                if (this.theme && this.theme.backgroundStyle === 'prehistoric') {
                    if (layer.shapeType === 'prehistoric-haze' || layer.shapeType === 'prehistoric-mesa' ||
                        layer.shapeType === 'cycad-cluster' || layer.shapeType === 'fern-mound') {
                        this.drawPrehistoricShape(ctx, layer.shapeType, x, y, shape, depthAlpha, layer.color);
                        continue;
                    }
                }

                ctx.fillStyle = alphaFromColor(layer.color, depthAlpha);
                ctx.beginPath();
                this.drawShape(ctx, layer.shapeType, x, y, shape);
                ctx.fill();

                if (li > 0) {
                    ctx.strokeStyle = alphaFromColor(layer.color, 0.24);
                    ctx.lineWidth = 1.25;
                    ctx.stroke();
                }
            }
        }
    }

    drawVolcanicShape(ctx, type, x, y, shape, depthAlpha, baseColor) {
        const w = shape.width;
        const h = shape.size;
        const seed = shape.seed;
        const bottom = this.height + 520;

        if (type === 'ash-cloud' || type === 'dark-cloud') {
            const cloudAlpha = type === 'dark-cloud' ? depthAlpha * 0.9 : depthAlpha;
            ctx.fillStyle = alphaFromColor(baseColor, cloudAlpha);
            ctx.beginPath();
            ctx.ellipse(x - w * 0.22, y + h * 0.06, w * 0.22, h * 0.16, 0.05, 0, Math.PI * 2);
            ctx.ellipse(x, y - h * 0.06, w * 0.3, h * 0.2, -0.03, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.23, y + h * 0.01, w * 0.24, h * 0.17, 0.04, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.43, y + h * 0.04, w * 0.16, h * 0.12, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(8, 8, 10, 0.2)';
            ctx.beginPath();
            ctx.ellipse(x + w * 0.08, y + h * 0.14, w * 0.46, h * 0.08, 0, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        if (type === 'volcano-real') {
            const shoulderY = y + h * (0.28 + shape.variation * 0.08);
            const craterHalf = w * (0.07 + shape.variation * 0.04);
            const peakY = y + h * 0.08;

            const grad = ctx.createLinearGradient(0, peakY, 0, bottom);
            grad.addColorStop(0, '#4c2420');
            grad.addColorStop(0.35, alphaFromColor(baseColor, 0.95));
            grad.addColorStop(1, '#120707');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.56, bottom);
            ctx.bezierCurveTo(x - w * 0.52, y + h * 0.86, x - w * 0.25, shoulderY, x - craterHalf, peakY);
            ctx.lineTo(x + craterHalf, peakY);
            ctx.bezierCurveTo(x + w * 0.25, shoulderY + h * 0.03, x + w * 0.52, y + h * 0.88, x + w * 0.57, bottom);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.moveTo(x + w * 0.03, peakY + 2);
            ctx.bezierCurveTo(x + w * 0.2, shoulderY, x + w * 0.38, y + h * 0.72, x + w * 0.5, bottom);
            ctx.lineTo(x + w * 0.62, bottom);
            ctx.lineTo(x + craterHalf, peakY);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(15, 6, 6, 0.9)';
            ctx.beginPath();
            ctx.ellipse(x, peakY + h * 0.05, craterHalf * 1.35, h * 0.07, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 110, 30, 0.72)';
            ctx.beginPath();
            ctx.ellipse(x + Math.sin(seed) * 3, peakY + h * 0.05, craterHalf * 0.55, h * 0.035, 0, 0, Math.PI * 2);
            ctx.fill();

            const streams = shape.variation > 0.35 ? 2 : 1;
            for (let i = 0; i < streams; i++) {
                const side = i === 0 ? -1 : 1;
                const sx = x + side * (w * (0.06 + 0.09 * i));
                ctx.strokeStyle = 'rgba(255, 110, 40, 0.45)';
                ctx.lineWidth = 1.3 + i * 0.6;
                ctx.beginPath();
                ctx.moveTo(sx, peakY + h * 0.08);
                ctx.bezierCurveTo(
                    sx + side * w * 0.08,
                    y + h * 0.28,
                    sx + side * w * 0.06,
                    y + h * 0.62,
                    sx + side * w * 0.11,
                    y + h * 0.86
                );
                ctx.stroke();
            }
            return;
        }

        if (type === 'lava-ridge') {
            const grad = ctx.createLinearGradient(0, y, 0, bottom);
            grad.addColorStop(0, '#3d1512');
            grad.addColorStop(1, '#170707');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.62, bottom);
            const points = 7;
            for (let i = 0; i < points; i++) {
                const t = i / (points - 1);
                const px = x - w * 0.56 + t * w * 1.12;
                const py = y + h * (0.05 + Math.abs(Math.sin(seed * 0.01 + i * 0.8)) * 0.58);
                ctx.lineTo(px, py);
            }
            ctx.lineTo(x + w * 0.62, bottom);
            ctx.closePath();
            ctx.fill();

            const crackCount = 2 + (shape.variation > 0.5 ? 1 : 0);
            for (let i = 0; i < crackCount; i++) {
                const cx = x - w * 0.28 + i * w * 0.26;
                ctx.strokeStyle = 'rgba(255, 95, 25, 0.42)';
                ctx.lineWidth = 1 + i * 0.4;
                ctx.beginPath();
                ctx.moveTo(cx, y + h * (0.25 + i * 0.08));
                ctx.bezierCurveTo(
                    cx + w * 0.03,
                    y + h * (0.44 + i * 0.1),
                    cx - w * 0.01,
                    y + h * 0.68,
                    cx + w * 0.04,
                    y + h * 0.9
                );
                ctx.stroke();
            }
            return;
        }

        if (type === 'rock-spire') {
            const tipY = y - h * (0.24 + shape.variation * 0.2);
            ctx.fillStyle = alphaFromColor(baseColor, depthAlpha * 1.06);
            ctx.beginPath();
            ctx.moveTo(x - w * 0.13, bottom);
            ctx.lineTo(x - w * 0.02, y + h * 0.45);
            ctx.lineTo(x + w * 0.04, tipY);
            ctx.lineTo(x + w * 0.11, y + h * 0.38);
            ctx.lineTo(x + w * 0.2, bottom);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 150, 70, 0.2)';
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(x + w * 0.02, y + h * 0.34);
            ctx.lineTo(x + w * 0.06, y + h * 0.72);
            ctx.stroke();
        }
    }

    drawForestShape(ctx, type, x, y, shape, depthAlpha, baseColor) {
        const w = shape.width;
        const h = shape.size;
        const seed = shape.seed;
        const bottom = this.height + 520;

        if (type === 'forest-cloud') {
            ctx.fillStyle = alphaFromColor(baseColor, depthAlpha * 0.9);
            ctx.beginPath();
            ctx.ellipse(x - w * 0.2, y + h * 0.03, w * 0.2, h * 0.12, 0, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.04, y - h * 0.05, w * 0.3, h * 0.16, 0.03, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.3, y + h * 0.02, w * 0.22, h * 0.12, -0.04, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        if (type === 'forest-ridge') {
            const grad = ctx.createLinearGradient(0, y, 0, bottom);
            grad.addColorStop(0, '#395f3e');
            grad.addColorStop(0.4, alphaFromColor(baseColor, 0.9));
            grad.addColorStop(1, '#173019');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.62, bottom);
            ctx.bezierCurveTo(x - w * 0.5, y + h * 0.74, x - w * 0.26, y + h * 0.22, x - w * 0.1, y + h * 0.16);
            ctx.bezierCurveTo(x + w * 0.03, y + h * 0.02, x + w * 0.17, y + h * 0.26, x + w * 0.28, y + h * 0.18);
            ctx.bezierCurveTo(x + w * 0.44, y + h * 0.26, x + w * 0.54, y + h * 0.75, x + w * 0.62, bottom);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = 'rgba(210, 240, 215, 0.18)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.09, y + h * 0.2);
            ctx.lineTo(x + w * 0.14, y + h * 0.34);
            ctx.stroke();
            return;
        }

        if (type === 'pine-cluster') {
            const treeCount = 3;
            const baseY = y + h * 0.45;
            for (let i = 0; i < treeCount; i++) {
                const tx = x - w * 0.26 + i * (w * 0.26);
                const scale = 0.85 + i * 0.1;
                const tw = w * 0.18 * scale;
                const th = h * (0.8 + ((i + shape.variation) % 2) * 0.12);

                ctx.fillStyle = `rgba(22, 58, 26, ${Math.min(0.95, depthAlpha + 0.28)})`;
                ctx.beginPath();
                ctx.moveTo(tx, baseY - th);
                ctx.lineTo(tx - tw, baseY);
                ctx.lineTo(tx + tw, baseY);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = 'rgba(38, 79, 40, 0.45)';
                ctx.beginPath();
                ctx.moveTo(tx, baseY - th * 0.78);
                ctx.lineTo(tx - tw * 0.75, baseY - th * 0.16);
                ctx.lineTo(tx + tw * 0.75, baseY - th * 0.16);
                ctx.closePath();
                ctx.fill();

                // Extra-long trunk that extends past the visible screen for deep forest feel.
                const trunkW = Math.max(3, w * 0.028);
                ctx.fillStyle = 'rgba(28, 19, 13, 0.44)';
                ctx.fillRect(tx - trunkW * 0.5, baseY - 1, trunkW, bottom - baseY + 50);
            }
            return;
        }

        if (type === 'forest-hill') {
            const grad = ctx.createLinearGradient(0, y, 0, bottom);
            grad.addColorStop(0, '#365b34');
            grad.addColorStop(1, '#142716');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.78, bottom);
            ctx.bezierCurveTo(x - w * 0.32, y + h * 0.06, x + w * 0.08, y - h * 0.08, x + w * 0.76, bottom);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = 'rgba(120, 170, 118, 0.22)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.22, y + h * 0.32);
            ctx.bezierCurveTo(x - w * 0.04, y + h * (0.18 + (Math.sin(seed * 0.1) * 0.04)), x + w * 0.16, y + h * 0.34, x + w * 0.3, y + h * 0.28);
            ctx.stroke();

            ctx.fillStyle = 'rgba(38, 68, 35, 0.35)';
            ctx.fillRect(x - w * 0.06, y + h * 0.52, w * 0.12, h * 0.05);
        }
    }

    drawIceShape(ctx, type, x, y, shape, depthAlpha, baseColor) {
        const w = shape.width;
        const h = shape.size;
        const seed = shape.seed;
        const bottom = this.height + 520;

        if (type === 'frost-cloud') {
            ctx.fillStyle = alphaFromColor(baseColor, Math.min(0.95, depthAlpha + 0.1));
            ctx.beginPath();
            ctx.ellipse(x - w * 0.2, y + h * 0.02, w * 0.22, h * 0.11, 0.02, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.03, y - h * 0.05, w * 0.32, h * 0.15, 0, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.28, y + h * 0.01, w * 0.22, h * 0.11, -0.03, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        if (type === 'glacier-peak') {
            const peakY = y + h * 0.02;
            const grad = ctx.createLinearGradient(0, peakY, 0, bottom);
            grad.addColorStop(0, '#f2fbff');
            grad.addColorStop(0.35, alphaFromColor(baseColor, 0.92));
            grad.addColorStop(1, '#7fb9df');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.58, bottom);
            ctx.lineTo(x - w * 0.24, y + h * 0.34);
            ctx.lineTo(x - w * 0.09, peakY + h * 0.1);
            ctx.lineTo(x + w * 0.06, peakY);
            ctx.lineTo(x + w * 0.27, y + h * 0.38);
            ctx.lineTo(x + w * 0.56, bottom);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
            ctx.beginPath();
            ctx.moveTo(x - w * 0.05, peakY + h * 0.05);
            ctx.lineTo(x + w * 0.08, y + h * 0.24);
            ctx.lineTo(x + w * 0.13, y + h * 0.42);
            ctx.lineTo(x + w * 0.04, y + h * 0.32);
            ctx.closePath();
            ctx.fill();
            return;
        }

        if (type === 'ice-ridge') {
            const grad = ctx.createLinearGradient(0, y, 0, bottom);
            grad.addColorStop(0, '#e1f6ff');
            grad.addColorStop(0.4, '#9bd0ef');
            grad.addColorStop(1, '#5d8fb2');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.65, bottom);
            const points = 6;
            for (let i = 0; i < points; i++) {
                const t = i / (points - 1);
                const px = x - w * 0.56 + t * w * 1.1;
                const py = y + h * (0.06 + Math.abs(Math.sin(seed * 0.014 + i * 0.9)) * 0.5);
                ctx.lineTo(px, py);
            }
            ctx.lineTo(x + w * 0.66, bottom);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.34)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.2, y + h * 0.26);
            ctx.lineTo(x + w * 0.24, y + h * 0.42);
            ctx.stroke();
            return;
        }

        if (type === 'snow-drift') {
            const grad = ctx.createLinearGradient(0, y, 0, bottom);
            grad.addColorStop(0, '#f7fdff');
            grad.addColorStop(1, '#b8dff5');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.86, bottom);
            ctx.bezierCurveTo(x - w * 0.32, y + h * 0.08, x + w * 0.12, y - h * 0.06, x + w * 0.86, bottom);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.36)';
            ctx.beginPath();
            ctx.ellipse(x + w * 0.04, y + h * 0.36, w * 0.28, h * 0.08, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawDesertShape(ctx, type, x, y, shape, depthAlpha, baseColor) {
        const w = shape.width;
        const h = shape.size;
        const seed = shape.seed;
        const bottom = this.height + 520;

        if (type === 'dust-cloud') {
            ctx.fillStyle = alphaFromColor(baseColor, Math.min(0.9, depthAlpha + 0.05));
            ctx.beginPath();
            ctx.ellipse(x - w * 0.2, y + h * 0.03, w * 0.2, h * 0.1, 0.02, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.04, y - h * 0.05, w * 0.28, h * 0.14, 0, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.27, y + h * 0.01, w * 0.2, h * 0.1, -0.03, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        if (type === 'desert-pyramid') {
            // Huge equilateral pyramids: side lengths are derived from the base width.
            const baseHalf = w * (0.95 + shape.variation * 0.45);
            const sideLen = baseHalf * 2;
            const eqHeight = sideLen * 0.8660254; // sqrt(3)/2
            const baseY = this.height + 220 + shape.variation * 90;
            const peakY = baseY - eqHeight;
            const leftX = x - baseHalf;
            const rightX = x + baseHalf;

            const grad = ctx.createLinearGradient(leftX, peakY, rightX, baseY);
            grad.addColorStop(0, '#f8d18c');
            grad.addColorStop(0.45, alphaFromColor(baseColor, 0.95));
            grad.addColorStop(1, '#a97a3d');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(leftX, baseY);
            ctx.lineTo(x, peakY);
            ctx.lineTo(rightX, baseY);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(130, 92, 46, 0.38)';
            ctx.beginPath();
            ctx.moveTo(x, peakY);
            ctx.lineTo(rightX, baseY);
            ctx.lineTo(x + baseHalf * 0.13, baseY);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 225, 166, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, peakY + eqHeight * 0.08);
            ctx.lineTo(x + baseHalf * 0.2, peakY + eqHeight * 0.42);
            ctx.stroke();
            return;
        }

        if (type === 'desert-dune') {
            const grad = ctx.createLinearGradient(0, y, 0, bottom);
            grad.addColorStop(0, '#f7d889');
            grad.addColorStop(0.45, '#e7bf6a');
            grad.addColorStop(1, '#c5944b');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.92, bottom);
            ctx.bezierCurveTo(x - w * 0.4, y + h * 0.06, x + w * 0.08, y - h * 0.04, x + w * 0.92, bottom);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 235, 170, 0.28)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.24, y + h * 0.32);
            ctx.bezierCurveTo(
                x - w * 0.06,
                y + h * (0.2 + Math.sin(seed * 0.1) * 0.03),
                x + w * 0.16,
                y + h * 0.34,
                x + w * 0.34,
                y + h * 0.26
            );
            ctx.stroke();
            return;
        }

        if (type === 'desert-rock') {
            const rockTop = y + h * 0.16;
            const grad = ctx.createLinearGradient(0, rockTop, 0, bottom);
            grad.addColorStop(0, '#bb8a52');
            grad.addColorStop(0.5, '#92663d');
            grad.addColorStop(1, '#6f4b2b');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.24, bottom);
            ctx.lineTo(x - w * 0.18, y + h * 0.52);
            ctx.lineTo(x - w * 0.08, rockTop);
            ctx.lineTo(x + w * 0.05, y + h * 0.28);
            ctx.lineTo(x + w * 0.16, y + h * 0.58);
            ctx.lineTo(x + w * 0.24, bottom);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 214, 157, 0.24)';
            ctx.beginPath();
            ctx.moveTo(x - w * 0.07, y + h * 0.24);
            ctx.lineTo(x + w * 0.01, y + h * 0.4);
            ctx.lineTo(x - w * 0.03, y + h * 0.52);
            ctx.closePath();
            ctx.fill();
        }
    }

    drawSkyShape(ctx, type, x, y, shape, depthAlpha, baseColor) {
        const w = shape.width;
        const h = shape.size;
        const seed = shape.seed;

        if (type === 'sky-cirrus-band') {
            ctx.strokeStyle = alphaFromColor(baseColor, Math.min(0.24, depthAlpha * 0.34));
            ctx.lineWidth = Math.max(1, h * 0.055);
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x - w * 0.5, y + Math.sin(seed * 0.03) * h * 0.08);
            ctx.bezierCurveTo(
                x - w * 0.18,
                y - h * (0.22 + Math.sin(seed * 0.05) * 0.08),
                x + w * 0.2,
                y + h * (0.16 + Math.cos(seed * 0.07) * 0.06),
                x + w * 0.52,
                y - h * 0.06
            );
            ctx.stroke();
            return;
        }

        if (type === 'sky-archipelago-far' || type === 'sky-archipelago-mid' || type === 'sky-archipelago-near') {
            const near = type === 'sky-archipelago-near';
            const mid = type === 'sky-archipelago-mid';
            const islandAlpha = near ? 0.24 : (mid ? 0.18 : 0.12);
            const rockTopY = y + h * 0.2;
            const rockBottomY = y + h * 1.02;

            const rockGrad = ctx.createLinearGradient(0, rockTopY, 0, rockBottomY);
            if (near) {
                rockGrad.addColorStop(0, alphaFromColor('#8fb8cf', islandAlpha));
                rockGrad.addColorStop(0.45, alphaFromColor('#5f88a4', islandAlpha));
                rockGrad.addColorStop(1, alphaFromColor('#385772', islandAlpha));
            } else if (mid) {
                rockGrad.addColorStop(0, alphaFromColor('#b3cddd', islandAlpha));
                rockGrad.addColorStop(0.5, alphaFromColor('#7ea3bc', islandAlpha));
                rockGrad.addColorStop(1, alphaFromColor('#4e738d', islandAlpha));
            } else {
                rockGrad.addColorStop(0, alphaFromColor('#d7eaf7', islandAlpha));
                rockGrad.addColorStop(0.52, alphaFromColor('#aec9dc', islandAlpha));
                rockGrad.addColorStop(1, alphaFromColor('#7f9eb6', islandAlpha));
            }

            ctx.fillStyle = rockGrad;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.45, y + h * 0.26);
            ctx.bezierCurveTo(x - w * 0.32, y + h * 0.62, x - w * 0.16, y + h * 0.9, x - w * 0.04, rockBottomY);
            ctx.lineTo(x + w * 0.04, rockBottomY);
            ctx.bezierCurveTo(x + w * 0.16, y + h * 0.9, x + w * 0.32, y + h * 0.62, x + w * 0.45, y + h * 0.26);
            ctx.bezierCurveTo(x + w * 0.27, y + h * 0.12, x - w * 0.24, y + h * 0.1, x - w * 0.45, y + h * 0.26);
            ctx.closePath();
            ctx.fill();

            const turfGrad = ctx.createLinearGradient(0, y - h * 0.05, 0, y + h * 0.18);
            if (near) {
                turfGrad.addColorStop(0, alphaFromColor('#ecfff0', islandAlpha * 0.95));
                turfGrad.addColorStop(1, alphaFromColor('#9ad7aa', islandAlpha * 0.9));
            } else if (mid) {
                turfGrad.addColorStop(0, alphaFromColor('#f2fffb', islandAlpha * 0.9));
                turfGrad.addColorStop(1, alphaFromColor('#b6dde6', islandAlpha * 0.86));
            } else {
                turfGrad.addColorStop(0, alphaFromColor('#f7ffff', islandAlpha * 0.8));
                turfGrad.addColorStop(1, alphaFromColor('#d7eaf7', islandAlpha * 0.74));
            }
            ctx.fillStyle = turfGrad;
            ctx.beginPath();
            ctx.ellipse(x, y + h * 0.18, w * 0.46, h * 0.12, 0, Math.PI, 0, true);
            ctx.fill();

            if (near || mid) {
                ctx.strokeStyle = near ? 'rgba(46, 83, 72, 0.18)' : 'rgba(77, 108, 126, 0.14)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x - w * 0.14, y + h * 0.24);
                ctx.lineTo(x - w * 0.05, y + h * 0.34);
                ctx.moveTo(x + w * 0.08, y + h * 0.22);
                ctx.lineTo(x + w * 0.16, y + h * 0.31);
                ctx.stroke();
            }
            return;
        }

        if (type === 'sky-sunlit-cloud') {
            const puffCount = 5 + Math.floor(shape.variation * 4);
            for (let i = 0; i < puffCount; i++) {
                const t = puffCount === 1 ? 0.5 : i / (puffCount - 1);
                const px = x - w * 0.42 + t * w * 0.84;
                const py = y + Math.sin(seed * 0.017 + i * 1.4) * h * 0.16 - h * 0.02;
                const pr = h * (0.22 + 0.1 * Math.sin(seed * 0.009 + i * 0.9));
                const puff = ctx.createRadialGradient(
                    px - pr * 0.35,
                    py - pr * 0.32,
                    pr * 0.2,
                    px,
                    py,
                    pr
                );
                puff.addColorStop(0, `rgba(255, 255, 255, ${Math.min(0.56, depthAlpha * 0.52 + 0.12)})`);
                puff.addColorStop(1, alphaFromColor(baseColor, Math.min(0.3, depthAlpha * 0.34)));
                ctx.fillStyle = puff;
                ctx.beginPath();
                ctx.arc(px, py, pr, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = alphaFromColor(baseColor, Math.min(0.22, depthAlpha * 0.3));
            ctx.beginPath();
            ctx.ellipse(x, y + h * 0.09, w * 0.44, h * 0.16, 0, 0, Math.PI);
            ctx.fill();
        }
    }

    drawSwampShape(ctx, type, x, y, shape, depthAlpha, baseColor) {
        const w = shape.width;
        const h = shape.size;
        const seed = shape.seed;
        const bottom = this.height + 520;

        if (type === 'swamp-fog') {
            ctx.fillStyle = alphaFromColor(baseColor, Math.min(0.88, depthAlpha + 0.04));
            ctx.beginPath();
            ctx.ellipse(x - w * 0.22, y + h * 0.02, w * 0.22, h * 0.1, 0.02, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.03, y - h * 0.04, w * 0.3, h * 0.13, 0, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.28, y + h * 0.01, w * 0.21, h * 0.1, -0.03, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        if (type === 'mangrove') {
            const trunkTop = y + h * 0.16;
            const trunkBase = y + h * 0.86;

            ctx.strokeStyle = alphaFromColor(baseColor, Math.min(0.95, depthAlpha + 0.22));
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.moveTo(x, trunkTop);
            ctx.bezierCurveTo(x - w * 0.06, y + h * 0.36, x + w * 0.04, y + h * 0.62, x - w * 0.02, trunkBase);
            ctx.stroke();

            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.01, y + h * 0.34);
            ctx.bezierCurveTo(x - w * 0.16, y + h * 0.42, x - w * 0.18, y + h * 0.6, x - w * 0.22, y + h * 0.76);
            ctx.moveTo(x + w * 0.01, y + h * 0.4);
            ctx.bezierCurveTo(x + w * 0.15, y + h * 0.48, x + w * 0.18, y + h * 0.66, x + w * 0.24, y + h * 0.84);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(34, 54, 38, 0.45)';
            ctx.lineWidth = 1.2;
            for (let i = 0; i < 3; i++) {
                const rx = x - w * 0.08 + i * w * 0.08;
                ctx.beginPath();
                ctx.moveTo(rx, trunkBase - 2);
                ctx.bezierCurveTo(
                    rx + ((i % 2 === 0) ? 6 : -6),
                    y + h * 0.98,
                    rx + ((i % 2 === 0) ? -5 : 5),
                    y + h * 1.08,
                    rx + ((i % 2 === 0) ? 5 : -5),
                    y + h * 1.18
                );
                ctx.stroke();
            }
            return;
        }

        if (type === 'bog-mound') {
            const grad = ctx.createLinearGradient(0, y, 0, bottom);
            grad.addColorStop(0, '#4a624d');
            grad.addColorStop(0.48, alphaFromColor(baseColor, 0.94));
            grad.addColorStop(1, '#1f3126');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.84, bottom);
            ctx.bezierCurveTo(x - w * 0.36, y + h * 0.08, x + w * 0.12, y - h * 0.04, x + w * 0.82, bottom);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(58, 87, 56, 0.28)';
            ctx.beginPath();
            ctx.ellipse(x + w * 0.06, y + h * 0.38, w * 0.3, h * 0.1, 0, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        if (type === 'swamp-reed') {
            const baseY = y + h * 0.9;
            const reedCount = 4;
            for (let i = 0; i < reedCount; i++) {
                const rx = x - w * 0.18 + i * w * 0.12;
                const height = h * (0.38 + ((i + shape.variation) % 3) * 0.08);
                ctx.strokeStyle = 'rgba(52, 82, 46, 0.55)';
                ctx.lineWidth = 1.1;
                ctx.beginPath();
                ctx.moveTo(rx, baseY);
                ctx.quadraticCurveTo(
                    rx + Math.sin(seed * 0.03 + i) * 5,
                    baseY - height * 0.58,
                    rx + Math.sin(seed * 0.02 + i * 1.7) * 8,
                    baseY - height
                );
                ctx.stroke();
            }
        }
    }

    drawHauntedShape(ctx, type, x, y, shape, depthAlpha, baseColor) {
        const w = shape.width;
        const h = shape.size;
        const seed = shape.seed;
        const bottom = this.height + 520;

        if (type === 'haunted-fog') {
            ctx.fillStyle = alphaFromColor(baseColor, Math.min(0.78, depthAlpha + 0.02));
            ctx.beginPath();
            ctx.ellipse(x - w * 0.22, y + h * 0.03, w * 0.22, h * 0.1, 0.02, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.03, y - h * 0.06, w * 0.3, h * 0.15, 0, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.3, y + h * 0.01, w * 0.22, h * 0.1, -0.03, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        if (type === 'haunted-spire') {
            const tipY = y + h * 0.04;
            const grad = ctx.createLinearGradient(0, tipY, 0, bottom);
            grad.addColorStop(0, '#4a3d66');
            grad.addColorStop(0.45, alphaFromColor(baseColor, 0.92));
            grad.addColorStop(1, '#1d1530');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.2, bottom);
            ctx.lineTo(x - w * 0.14, y + h * 0.58);
            ctx.lineTo(x - w * 0.05, y + h * 0.24);
            ctx.lineTo(x, tipY);
            ctx.lineTo(x + w * 0.06, y + h * 0.28);
            ctx.lineTo(x + w * 0.14, y + h * 0.62);
            ctx.lineTo(x + w * 0.22, bottom);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(188, 164, 220, 0.18)';
            ctx.beginPath();
            ctx.moveTo(x - w * 0.02, y + h * 0.26);
            ctx.lineTo(x + w * 0.05, y + h * 0.54);
            ctx.lineTo(x + w * 0.01, y + h * 0.7);
            ctx.closePath();
            ctx.fill();
            return;
        }

        if (type === 'dead-tree-gnarled') {
            // The gnarled tree art was authored upside-down; flip vertically in place.
            ctx.save();
            const flipPivotY = y + h * 0.58;
            ctx.translate(0, flipPivotY * 2);
            ctx.scale(1, -1);

            const trunkTop = y + h * 0.2;
            const trunkBase = y + h * 0.94;

            ctx.strokeStyle = alphaFromColor(baseColor, Math.min(0.95, depthAlpha + 0.24));
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(x, trunkTop);
            ctx.bezierCurveTo(x - w * 0.03, y + h * 0.44, x + w * 0.04, y + h * 0.66, x - w * 0.01, trunkBase);
            ctx.stroke();

            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x, y + h * 0.34);
            ctx.bezierCurveTo(x - w * 0.16, y + h * 0.36, x - w * 0.2, y + h * 0.52, x - w * 0.26, y + h * 0.66);
            ctx.moveTo(x + w * 0.01, y + h * 0.42);
            ctx.bezierCurveTo(x + w * 0.14, y + h * 0.44, x + w * 0.19, y + h * 0.6, x + w * 0.25, y + h * 0.74);
            ctx.moveTo(x - w * 0.03, y + h * 0.55);
            ctx.bezierCurveTo(x - w * 0.11, y + h * 0.62, x - w * 0.08, y + h * 0.72, x - w * 0.14, y + h * 0.82);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(46, 30, 58, 0.45)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.06, trunkBase - 2);
            ctx.lineTo(x - w * 0.11, y + h * 1.12);
            ctx.moveTo(x + w * 0.04, trunkBase - 2);
            ctx.lineTo(x + w * 0.1, y + h * 1.16);
            ctx.stroke();
            ctx.restore();
            return;
        }

        if (type === 'grave-hill') {
            const grad = ctx.createLinearGradient(0, y, 0, bottom);
            grad.addColorStop(0, '#46345a');
            grad.addColorStop(0.5, '#2d1f43');
            grad.addColorStop(1, '#160f24');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.86, bottom);
            ctx.bezierCurveTo(x - w * 0.34, y + h * 0.1, x + w * 0.1, y - h * 0.06, x + w * 0.84, bottom);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(120, 104, 145, 0.26)';
            ctx.fillRect(x - w * 0.12, y + h * 0.3, w * 0.06, h * 0.22);
            ctx.fillRect(x + w * 0.06, y + h * 0.34, w * 0.05, h * 0.2);
            ctx.fillStyle = 'rgba(40, 28, 52, 0.45)';
            ctx.fillRect(x - w * 0.12, y + h * 0.3, w * 0.06, h * 0.03);
            ctx.fillRect(x + w * 0.06, y + h * 0.34, w * 0.05, h * 0.03);
        }
    }

    drawUnderwaterShape(ctx, type, x, y, shape, depthAlpha, baseColor) {
        const w = shape.width;
        const h = shape.size;
        const seed = shape.seed;
        const bottom = this.height + 520;

        if (type === 'water-haze') {
            ctx.fillStyle = alphaFromColor(baseColor, Math.min(0.82, depthAlpha + 0.04));
            ctx.beginPath();
            ctx.ellipse(x - w * 0.22, y + h * 0.02, w * 0.22, h * 0.1, 0.02, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.03, y - h * 0.04, w * 0.3, h * 0.13, 0, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.28, y + h * 0.01, w * 0.21, h * 0.1, -0.03, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        if (type === 'reef-mass') {
            const grad = ctx.createLinearGradient(0, y, 0, bottom);
            grad.addColorStop(0, '#2f7ea1');
            grad.addColorStop(0.5, alphaFromColor(baseColor, 0.94));
            grad.addColorStop(1, '#12405a');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.76, bottom);
            ctx.bezierCurveTo(x - w * 0.32, y + h * 0.08, x + w * 0.08, y - h * 0.05, x + w * 0.74, bottom);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(162, 224, 246, 0.2)';
            ctx.beginPath();
            ctx.ellipse(x + w * 0.06, y + h * 0.34, w * 0.28, h * 0.09, 0, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        if (type === 'kelp-forest') {
            const stalks = 4;
            const baseY = y + h * 0.94;
            for (let i = 0; i < stalks; i++) {
                const kx = x - w * 0.2 + i * w * 0.13;
                const kh = h * (0.4 + ((i + shape.variation) % 3) * 0.1);
                ctx.strokeStyle = 'rgba(34, 102, 70, 0.58)';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(kx, baseY);
                ctx.bezierCurveTo(
                    kx + Math.sin(seed * 0.02 + i * 0.9) * 9,
                    baseY - kh * 0.54,
                    kx + Math.sin(seed * 0.02 + i * 1.7) * 12,
                    baseY - kh * 0.82,
                    kx + Math.sin(seed * 0.02 + i * 2.3) * 8,
                    baseY - kh
                );
                ctx.stroke();
            }
            return;
        }

        if (type === 'coral-fan') {
            const baseY = y + h * 0.92;
            const branchCount = 5;
            ctx.strokeStyle = 'rgba(214, 136, 160, 0.52)';
            ctx.lineWidth = 1.4;
            for (let i = 0; i < branchCount; i++) {
                const angle = -0.9 + i * 0.45;
                const len = h * (0.28 + i * 0.03);
                const ex = x + Math.cos(angle) * len;
                const ey = baseY - Math.sin(-angle) * len;
                ctx.beginPath();
                ctx.moveTo(x, baseY);
                ctx.quadraticCurveTo(
                    x + Math.cos(angle) * len * 0.35 + Math.sin(seed * 0.03 + i) * 4,
                    baseY - len * 0.35,
                    ex,
                    ey
                );
                ctx.stroke();
            }
            ctx.fillStyle = 'rgba(142, 84, 112, 0.42)';
            ctx.fillRect(x - 2, baseY - 5, 4, 7);
        }
    }

    drawCyberpunkShape(ctx, type, x, y, shape, depthAlpha, baseColor) {
        const w = shape.width;
        const h = shape.size;
        const seed = shape.seed;
        const bottom = this.height + 520;

        if (type === 'neon-haze') {
            ctx.fillStyle = alphaFromColor(baseColor, Math.min(0.82, depthAlpha + 0.05));
            ctx.beginPath();
            ctx.ellipse(x - w * 0.2, y + h * 0.02, w * 0.2, h * 0.1, 0.02, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.04, y - h * 0.04, w * 0.3, h * 0.13, 0, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.28, y + h * 0.01, w * 0.21, h * 0.1, -0.03, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        if (type === 'mega-tower') {
            const towerW = w * (0.22 + shape.variation * 0.12);
            const towerTop = y + h * (0.1 + shape.variation * 0.12);
            const towerBottom = bottom;

            const grad = ctx.createLinearGradient(0, towerTop, 0, towerBottom);
            grad.addColorStop(0, '#5f2a7e');
            grad.addColorStop(0.48, alphaFromColor(baseColor, 0.94));
            grad.addColorStop(1, '#130024');
            ctx.fillStyle = grad;
            ctx.fillRect(x - towerW * 0.5, towerTop, towerW, towerBottom - towerTop);

            ctx.fillStyle = 'rgba(255, 52, 230, 0.28)';
            ctx.fillRect(x - towerW * 0.44, towerTop + h * 0.08, towerW * 0.88, Math.max(2, h * 0.04));

            ctx.strokeStyle = 'rgba(120, 210, 255, 0.34)';
            ctx.lineWidth = 1;
            const lines = 3 + (shape.variation > 0.5 ? 1 : 0);
            for (let i = 0; i < lines; i++) {
                const yy = towerTop + (i + 1) * ((towerBottom - towerTop) / (lines + 1));
                ctx.beginPath();
                ctx.moveTo(x - towerW * 0.46, yy);
                ctx.lineTo(x + towerW * 0.46, yy);
                ctx.stroke();
            }
            return;
        }

        if (type === 'antenna-spire') {
            const topY = y + h * 0.04;
            ctx.fillStyle = alphaFromColor(baseColor, Math.min(0.96, depthAlpha + 0.22));
            ctx.beginPath();
            ctx.moveTo(x - w * 0.12, bottom);
            ctx.lineTo(x - w * 0.06, y + h * 0.58);
            ctx.lineTo(x, topY);
            ctx.lineTo(x + w * 0.06, y + h * 0.58);
            ctx.lineTo(x + w * 0.12, bottom);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 110, 245, 0.48)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(x, topY);
            ctx.lineTo(x, topY - h * 0.12);
            ctx.stroke();

            ctx.fillStyle = 'rgba(80, 230, 255, 0.55)';
            ctx.fillRect(x - 1.5, topY - h * 0.12 - 3, 3, 3);
            return;
        }

        if (type === 'city-band') {
            const bandTop = y + h * (0.18 + Math.sin(seed * 0.02) * 0.04);
            const bandBottom = y + h * 0.62;
            ctx.fillStyle = alphaFromColor(baseColor, Math.min(0.86, depthAlpha + 0.18));
            ctx.fillRect(x - w * 0.5, bandTop, w, Math.max(8, bandBottom - bandTop));

            ctx.strokeStyle = 'rgba(255, 0, 214, 0.35)';
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.48, bandTop + (bandBottom - bandTop) * 0.32);
            ctx.lineTo(x + w * 0.48, bandTop + (bandBottom - bandTop) * 0.32);
            ctx.moveTo(x - w * 0.48, bandTop + (bandBottom - bandTop) * 0.68);
            ctx.lineTo(x + w * 0.48, bandTop + (bandBottom - bandTop) * 0.68);
            ctx.stroke();
        }
    }

    drawAncientShape(ctx, type, x, y, shape, depthAlpha, baseColor) {
        const w = shape.width;
        const h = shape.size;
        const seed = shape.seed;
        const bottom = this.height + 520;

        if (type === 'ancient-dust') {
            ctx.fillStyle = alphaFromColor(baseColor, Math.min(0.82, depthAlpha + 0.06));
            ctx.beginPath();
            ctx.ellipse(x - w * 0.22, y + h * 0.02, w * 0.22, h * 0.1, 0.02, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.03, y - h * 0.04, w * 0.3, h * 0.13, 0, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.28, y + h * 0.01, w * 0.21, h * 0.1, -0.03, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        if (type === 'ziggurat') {
            const baseHalf = w * (0.44 + shape.variation * 0.12);
            const baseY = y + h * 0.9;
            const levels = 4;
            const grad = ctx.createLinearGradient(0, y, 0, baseY);
            grad.addColorStop(0, '#b49a74');
            grad.addColorStop(0.45, alphaFromColor(baseColor, 0.95));
            grad.addColorStop(1, '#6e5841');
            ctx.fillStyle = grad;
            for (let i = 0; i < levels; i++) {
                const t = i / levels;
                const nextT = (i + 1) / levels;
                const hw = baseHalf * (1 - t * 0.58);
                const topY = y + h * (0.14 + t * 0.66);
                const botY = y + h * (0.14 + nextT * 0.66);
                ctx.fillRect(x - hw, topY, hw * 2, botY - topY);
            }

            ctx.fillStyle = 'rgba(228, 206, 170, 0.2)';
            ctx.fillRect(x - baseHalf * 0.08, y + h * 0.2, baseHalf * 0.16, h * 0.34);
            return;
        }

        if (type === 'obelisk-ruin') {
            const topY = y + h * 0.06;
            const grad = ctx.createLinearGradient(0, topY, 0, bottom);
            grad.addColorStop(0, '#c1aa82');
            grad.addColorStop(0.5, alphaFromColor(baseColor, 0.92));
            grad.addColorStop(1, '#594731');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.14, bottom);
            ctx.lineTo(x - w * 0.09, y + h * 0.58);
            ctx.lineTo(x - w * 0.02, topY);
            ctx.lineTo(x + w * 0.06, y + h * 0.55);
            ctx.lineTo(x + w * 0.14, bottom);
            ctx.closePath();
            ctx.fill();

            // Chips / weathering
            ctx.fillStyle = 'rgba(82, 63, 43, 0.35)';
            ctx.fillRect(x - w * 0.06, y + h * 0.34, w * 0.06, h * 0.06);
            ctx.fillRect(x + w * 0.02, y + h * 0.52, w * 0.05, h * 0.07);
            return;
        }

        if (type === 'ruin-mound') {
            const grad = ctx.createLinearGradient(0, y, 0, bottom);
            grad.addColorStop(0, '#8a7359');
            grad.addColorStop(0.5, '#6a5642');
            grad.addColorStop(1, '#403327');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.86, bottom);
            ctx.bezierCurveTo(x - w * 0.34, y + h * 0.1, x + w * 0.1, y - h * 0.05, x + w * 0.84, bottom);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(110, 86, 62, 0.32)';
            const blockCount = 3;
            for (let i = 0; i < blockCount; i++) {
                const bx = x - w * 0.14 + i * w * 0.12;
                const by = y + h * (0.34 + (i % 2) * 0.06);
                ctx.fillRect(bx, by, w * 0.07, h * 0.08);
            }
        }
    }

    drawFungusShape(ctx, type, x, y, shape, depthAlpha, baseColor) {
        const w = shape.width;
        const h = shape.size;
        const seed = shape.seed;
        const bottom = this.height + 520;

        if (type === 'fungus-ambient-spore') {
            const halo = ctx.createRadialGradient(x, y, 0, x, y, w * 0.85);
            halo.addColorStop(0, alphaFromColor(baseColor, Math.min(0.66, depthAlpha + 0.2)));
            halo.addColorStop(1, alphaFromColor(baseColor, 0));
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(x, y, w * 0.85, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 240, 255, 0.45)';
            ctx.beginPath();
            ctx.arc(x - w * 0.08, y - w * 0.1, Math.max(1.3, w * 0.22), 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        if (type === 'fungus-canopy-far' || type === 'fungus-canopy-mid') {
            const mid = type === 'fungus-canopy-mid';
            const stemW = w * (mid ? 0.2 : 0.15);
            const stemTop = y + h * 0.38;

            const stemGrad = ctx.createLinearGradient(0, stemTop, 0, bottom);
            stemGrad.addColorStop(0, mid ? '#ddb9ea' : '#caa8db');
            stemGrad.addColorStop(1, mid ? '#53336a' : '#65457e');
            ctx.fillStyle = stemGrad;
            ctx.beginPath();
            ctx.moveTo(x - stemW * 0.5, stemTop);
            ctx.bezierCurveTo(x - stemW, y + h * 0.7, x - stemW * 0.92, bottom, x - stemW * 0.65, bottom);
            ctx.lineTo(x + stemW * 0.65, bottom);
            ctx.bezierCurveTo(x + stemW * 0.95, y + h * 0.7, x + stemW, stemTop, x + stemW * 0.5, stemTop);
            ctx.closePath();
            ctx.fill();

            const capGrad = ctx.createRadialGradient(
                x - w * 0.14,
                y + h * 0.28,
                w * 0.08,
                x,
                y + h * 0.34,
                w * 0.58
            );
            capGrad.addColorStop(0, mid ? '#ffc4f0' : '#f2c4ec');
            capGrad.addColorStop(1, mid ? '#7b3f93' : '#8a5da5');
            ctx.fillStyle = capGrad;
            ctx.beginPath();
            ctx.ellipse(x, y + h * 0.36, w * 0.5, h * 0.3, 0, Math.PI, 0, false);
            ctx.fill();

            ctx.fillStyle = mid ? 'rgba(255, 242, 255, 0.28)' : 'rgba(245, 230, 255, 0.2)';
            for (let i = 0; i < 4; i++) {
                const sx = x - w * 0.24 + i * w * 0.16 + Math.sin(seed * 0.02 + i) * w * 0.02;
                const sy = y + h * (0.22 + (i % 2) * 0.07);
                ctx.beginPath();
                ctx.ellipse(sx, sy, w * 0.05, h * 0.04, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            return;
        }

        if (type === 'fungus-cluster-near') {
            const count = 3 + Math.floor(shape.variation * 4);
            for (let i = 0; i < count; i++) {
                const t = count === 1 ? 0.5 : i / (count - 1);
                const mx = x - w * 0.34 + t * w * 0.68;
                const mh = h * (0.46 + 0.26 * Math.sin(seed * 0.013 + i * 1.1));
                const mw = w * (0.16 + 0.06 * Math.cos(seed * 0.019 + i * 1.3));
                const stemTop = y + h * 0.16 + Math.sin(seed * 0.021 + i) * h * 0.04;

                const stemGrad = ctx.createLinearGradient(0, stemTop, 0, y + h);
                stemGrad.addColorStop(0, '#f3d6ff');
                stemGrad.addColorStop(1, '#9e73b3');
                ctx.fillStyle = stemGrad;
                ctx.beginPath();
                ctx.moveTo(mx - mw * 0.24, stemTop);
                ctx.quadraticCurveTo(mx - mw * 0.36, y + h * 0.62, mx - mw * 0.3, y + h);
                ctx.lineTo(mx + mw * 0.3, y + h);
                ctx.quadraticCurveTo(mx + mw * 0.36, y + h * 0.62, mx + mw * 0.24, stemTop);
                ctx.closePath();
                ctx.fill();

                const capGrad = ctx.createRadialGradient(mx - mw * 0.12, stemTop, mw * 0.1, mx, stemTop + mh * 0.1, mw * 0.62);
                capGrad.addColorStop(0, '#ffcfef');
                capGrad.addColorStop(1, '#7f2f95');
                ctx.fillStyle = capGrad;
                ctx.beginPath();
                ctx.ellipse(mx, stemTop + mh * 0.04, mw * 0.62, mh * 0.26, 0, Math.PI, 0, false);
                ctx.fill();

                ctx.fillStyle = 'rgba(255, 240, 255, 0.24)';
                ctx.beginPath();
                ctx.ellipse(mx - mw * 0.2, stemTop - mh * 0.08, mw * 0.12, mh * 0.08, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            return;
        }

        if (type === 'fungus-mycelium-mist') {
            const mist = ctx.createLinearGradient(x - w * 0.5, y - h * 0.2, x + w * 0.5, y + h * 0.3);
            mist.addColorStop(0, alphaFromColor(baseColor, 0));
            mist.addColorStop(0.4, alphaFromColor(baseColor, Math.min(0.32, depthAlpha + 0.08)));
            mist.addColorStop(1, alphaFromColor(baseColor, 0));
            ctx.fillStyle = mist;
            ctx.beginPath();
            ctx.ellipse(x, y, w * 0.5, h * 0.16, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(186, 139, 203, 0.2)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                const yy = y + h * 0.03 + i * h * 0.05;
                ctx.beginPath();
                ctx.moveTo(x - w * 0.3, yy);
                ctx.bezierCurveTo(
                    x - w * 0.12,
                    yy - h * 0.08,
                    x + w * 0.14,
                    yy + h * 0.08,
                    x + w * 0.3,
                    yy
                );
                ctx.stroke();
            }
        }
    }

    drawCrystalShape(ctx, type, x, y, shape, depthAlpha, baseColor) {
        const w = shape.width;
        const h = shape.size;
        const seed = shape.seed;
        const bottom = this.height + 520;

        if (type === 'crystal-haze') {
            ctx.fillStyle = alphaFromColor(baseColor, Math.min(0.86, depthAlpha + 0.04));
            ctx.beginPath();
            ctx.ellipse(x - w * 0.22, y + h * 0.02, w * 0.22, h * 0.1, 0.02, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.03, y - h * 0.05, w * 0.3, h * 0.14, 0, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.28, y + h * 0.01, w * 0.21, h * 0.1, -0.03, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        if (type === 'crystal-shard') {
            const topY = y + h * 0.06;
            const grad = ctx.createLinearGradient(0, topY, 0, bottom);
            grad.addColorStop(0, '#c9fbff');
            grad.addColorStop(0.5, alphaFromColor(baseColor, 0.92));
            grad.addColorStop(1, '#1c6f80');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.2, bottom);
            ctx.lineTo(x - w * 0.12, y + h * 0.55);
            ctx.lineTo(x - w * 0.03, topY);
            ctx.lineTo(x + w * 0.08, y + h * 0.5);
            ctx.lineTo(x + w * 0.2, bottom);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(225, 255, 255, 0.34)';
            ctx.beginPath();
            ctx.moveTo(x - w * 0.01, y + h * 0.24);
            ctx.lineTo(x + w * 0.05, y + h * 0.5);
            ctx.lineTo(x + w * 0.02, y + h * 0.66);
            ctx.closePath();
            ctx.fill();
            return;
        }

        if (type === 'crystal-spire') {
            const spires = 3;
            for (let i = 0; i < spires; i++) {
                const sx = x - w * 0.22 + i * w * 0.22;
                const sh = h * (0.36 + ((i + shape.variation) % 3) * 0.1);
                ctx.fillStyle = 'rgba(85, 188, 206, 0.54)';
                ctx.beginPath();
                ctx.moveTo(sx - w * 0.05, y + h * 0.96);
                ctx.lineTo(sx, y + h * (0.96 - sh / h));
                ctx.lineTo(sx + w * 0.05, y + h * 0.96);
                ctx.closePath();
                ctx.fill();
            }
            return;
        }

        if (type === 'geode-ridge') {
            const grad = ctx.createLinearGradient(0, y, 0, bottom);
            grad.addColorStop(0, '#56bfd1');
            grad.addColorStop(0.5, '#2b8ea3');
            grad.addColorStop(1, '#135a67');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.84, bottom);
            ctx.bezierCurveTo(x - w * 0.34, y + h * 0.08, x + w * 0.1, y - h * 0.04, x + w * 0.82, bottom);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = 'rgba(205, 249, 255, 0.28)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.24, y + h * 0.34);
            ctx.bezierCurveTo(
                x - w * 0.06,
                y + h * (0.22 + Math.sin(seed * 0.1) * 0.03),
                x + w * 0.16,
                y + h * 0.34,
                x + w * 0.32,
                y + h * 0.26
            );
            ctx.stroke();
        }
    }

    drawSteampunkShape(ctx, type, x, y, shape, depthAlpha, baseColor) {
        const w = shape.width;
        const h = shape.size;
        const seed = shape.seed;
        const bottom = this.height + 520;

        if (type === 'steam-plume') {
            ctx.fillStyle = alphaFromColor(baseColor, Math.min(0.84, depthAlpha + 0.04));
            ctx.beginPath();
            ctx.ellipse(x - w * 0.22, y + h * 0.02, w * 0.22, h * 0.1, 0.02, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.03, y - h * 0.05, w * 0.3, h * 0.14, 0, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.28, y + h * 0.01, w * 0.21, h * 0.1, -0.03, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        if (type === 'smokestack-tower') {
            const towerW = w * (0.2 + shape.variation * 0.1);
            const towerTop = y + h * (0.12 + shape.variation * 0.1);

            const grad = ctx.createLinearGradient(0, towerTop, 0, bottom);
            grad.addColorStop(0, '#8f6a4b');
            grad.addColorStop(0.5, alphaFromColor(baseColor, 0.94));
            grad.addColorStop(1, '#3b2417');
            ctx.fillStyle = grad;
            ctx.fillRect(x - towerW * 0.5, towerTop, towerW, bottom - towerTop);

            ctx.fillStyle = 'rgba(208, 158, 106, 0.26)';
            ctx.fillRect(x - towerW * 0.44, towerTop + h * 0.08, towerW * 0.88, Math.max(2, h * 0.04));

            ctx.fillStyle = 'rgba(70, 46, 28, 0.5)';
            ctx.fillRect(x - towerW * 0.6, towerTop - h * 0.06, towerW * 1.2, h * 0.06);
            return;
        }

        if (type === 'gear-spire') {
            const topY = y + h * 0.08;
            ctx.fillStyle = alphaFromColor(baseColor, Math.min(0.96, depthAlpha + 0.2));
            ctx.beginPath();
            ctx.moveTo(x - w * 0.13, bottom);
            ctx.lineTo(x - w * 0.08, y + h * 0.56);
            ctx.lineTo(x, topY);
            ctx.lineTo(x + w * 0.08, y + h * 0.56);
            ctx.lineTo(x + w * 0.13, bottom);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = 'rgba(214, 164, 112, 0.34)';
            ctx.lineWidth = 1.1;
            const gearR = Math.max(8, w * 0.07);
            ctx.beginPath();
            ctx.arc(x, y + h * 0.42, gearR, 0, Math.PI * 2);
            ctx.stroke();
            return;
        }

        if (type === 'factory-ridge') {
            const grad = ctx.createLinearGradient(0, y, 0, bottom);
            grad.addColorStop(0, '#866042');
            grad.addColorStop(0.5, '#5c3f2b');
            grad.addColorStop(1, '#2f1e14');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.84, bottom);
            ctx.bezierCurveTo(x - w * 0.34, y + h * 0.08, x + w * 0.1, y - h * 0.04, x + w * 0.82, bottom);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(157, 116, 79, 0.32)';
            const chimneys = 3;
            for (let i = 0; i < chimneys; i++) {
                const bx = x - w * 0.16 + i * w * 0.12;
                const by = y + h * (0.34 + (i % 2) * 0.06);
                ctx.fillRect(bx, by, w * 0.06, h * 0.14);
            }
        }
    }

    drawDreamscapeShape(ctx, type, x, y, shape, depthAlpha, baseColor) {
        const w = shape.width;
        const h = shape.size;
        const seed = shape.seed;
        const bottom = this.height + 520;

        if (type === 'dream-mist') {
            ctx.fillStyle = alphaFromColor(baseColor, Math.min(0.84, depthAlpha + 0.05));
            ctx.beginPath();
            ctx.ellipse(x - w * 0.22, y + h * 0.02, w * 0.22, h * 0.1, 0.02, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.03, y - h * 0.05, w * 0.3, h * 0.14, 0, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.28, y + h * 0.01, w * 0.21, h * 0.1, -0.03, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        if (type === 'dream-orb') {
            // Use faceted floating forms instead of round orb gradients so they read as distant scenery.
            const grad = ctx.createLinearGradient(x - w * 0.26, y - h * 0.2, x + w * 0.26, y + h * 0.24);
            grad.addColorStop(0, 'rgba(255, 232, 247, 0.56)');
            grad.addColorStop(0.5, alphaFromColor(baseColor, 0.72));
            grad.addColorStop(1, 'rgba(139, 104, 175, 0.3)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.24, y + h * 0.02);
            ctx.lineTo(x - w * 0.08, y - h * 0.16);
            ctx.lineTo(x + w * 0.14, y - h * 0.08);
            ctx.lineTo(x + w * 0.24, y + h * 0.08);
            ctx.lineTo(x + w * 0.02, y + h * 0.2);
            ctx.lineTo(x - w * 0.18, y + h * 0.14);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 220, 245, 0.18)';
            ctx.beginPath();
            ctx.moveTo(x - w * 0.06, y + h * 0.02);
            ctx.lineTo(x + w * 0.08, y - h * 0.04);
            ctx.lineTo(x + w * 0.03, y + h * 0.1);
            ctx.closePath();
            ctx.fill();
            return;
        }

        if (type === 'dream-ribbon') {
            const grad = ctx.createLinearGradient(x - w * 0.4, y, x + w * 0.4, y + h * 0.4);
            grad.addColorStop(0, '#ffd3ea');
            grad.addColorStop(0.45, alphaFromColor(baseColor, 0.92));
            grad.addColorStop(1, '#a98fd2');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.46, y + h * 0.36);
            ctx.bezierCurveTo(
                x - w * 0.2,
                y + h * (0.08 + Math.sin(seed * 0.03) * 0.06),
                x + w * 0.08,
                y + h * 0.58,
                x + w * 0.44,
                y + h * 0.26
            );
            ctx.lineTo(x + w * 0.44, y + h * 0.42);
            ctx.bezierCurveTo(
                x + w * 0.08,
                y + h * 0.74,
                x - w * 0.2,
                y + h * 0.26,
                x - w * 0.46,
                y + h * 0.52
            );
            ctx.closePath();
            ctx.fill();
            return;
        }

        if (type === 'dream-monolith') {
            const topY = y + h * 0.1;
            const grad = ctx.createLinearGradient(0, topY, 0, bottom);
            grad.addColorStop(0, '#f0d1ff');
            grad.addColorStop(0.5, '#c29cd9');
            grad.addColorStop(1, '#7d5c98');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.14, bottom);
            ctx.lineTo(x - w * 0.08, y + h * 0.58);
            ctx.lineTo(x, topY);
            ctx.lineTo(x + w * 0.08, y + h * 0.58);
            ctx.lineTo(x + w * 0.14, bottom);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 235, 255, 0.3)';
            ctx.beginPath();
            ctx.moveTo(x - w * 0.01, y + h * 0.28);
            ctx.lineTo(x + w * 0.04, y + h * 0.54);
            ctx.lineTo(x + w * 0.01, y + h * 0.7);
            ctx.closePath();
            ctx.fill();
        }
    }

    drawPrehistoricShape(ctx, type, x, y, shape, depthAlpha, baseColor) {
        const w = shape.width;
        const h = shape.size;
        const seed = shape.seed;
        const bottom = this.height + 520;

        if (type === 'prehistoric-haze') {
            ctx.fillStyle = alphaFromColor(baseColor, Math.min(0.82, depthAlpha + 0.04));
            ctx.beginPath();
            ctx.ellipse(x - w * 0.22, y + h * 0.02, w * 0.22, h * 0.1, 0.02, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.03, y - h * 0.05, w * 0.3, h * 0.14, 0, 0, Math.PI * 2);
            ctx.ellipse(x + w * 0.28, y + h * 0.01, w * 0.21, h * 0.1, -0.03, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        if (type === 'prehistoric-mesa') {
            const topY = y + h * 0.18;
            const grad = ctx.createLinearGradient(0, topY, 0, bottom);
            grad.addColorStop(0, '#8b6f4d');
            grad.addColorStop(0.5, alphaFromColor(baseColor, 0.92));
            grad.addColorStop(1, '#3b2e1f');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.42, topY);
            ctx.lineTo(x + w * 0.38, topY + h * 0.02);
            ctx.lineTo(x + w * 0.5, bottom);
            ctx.lineTo(x - w * 0.56, bottom);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(173, 142, 99, 0.25)';
            ctx.fillRect(x - w * 0.34, topY + h * 0.06, w * 0.62, h * 0.08);
            return;
        }

        if (type === 'cycad-cluster') {
            const plants = 3;
            const baseY = y + h * 0.9;
            for (let i = 0; i < plants; i++) {
                const px = x - w * 0.2 + i * w * 0.18;
                const ph = h * (0.3 + ((i + shape.variation) % 3) * 0.1);

                ctx.fillStyle = 'rgba(69, 106, 48, 0.52)';
                ctx.fillRect(px - 2, baseY - ph * 0.35, 4, ph * 0.35);

                ctx.strokeStyle = 'rgba(92, 145, 69, 0.58)';
                ctx.lineWidth = 1.1;
                const fronds = 5;
                for (let f = 0; f < fronds; f++) {
                    const a = -1.6 + f * (3.2 / (fronds - 1));
                    const len = ph * (0.44 + (f % 2) * 0.1);
                    ctx.beginPath();
                    ctx.moveTo(px, baseY - ph * 0.35);
                    ctx.lineTo(px + Math.cos(a) * len, baseY - ph * 0.35 + Math.sin(a) * len * 0.55);
                    ctx.stroke();
                }
            }
            return;
        }

        if (type === 'fern-mound') {
            const grad = ctx.createLinearGradient(0, y, 0, bottom);
            grad.addColorStop(0, '#7e6a45');
            grad.addColorStop(0.5, '#5f4f32');
            grad.addColorStop(1, '#2f291b');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.84, bottom);
            ctx.bezierCurveTo(x - w * 0.34, y + h * 0.08, x + w * 0.1, y - h * 0.04, x + w * 0.82, bottom);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = 'rgba(124, 170, 90, 0.28)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.22, y + h * 0.34);
            ctx.bezierCurveTo(
                x - w * 0.06,
                y + h * (0.22 + Math.sin(seed * 0.1) * 0.03),
                x + w * 0.16,
                y + h * 0.34,
                x + w * 0.32,
                y + h * 0.26
            );
            ctx.stroke();
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
                ctx.bezierCurveTo(x - w * 0.42, y + h * 0.9, x - w * 0.2, y + h * 0.22, x, y);
                ctx.bezierCurveTo(x + w * 0.22, y + h * 0.2, x + w * 0.44, y + h * 0.85, x + w / 2, this.height + 500);
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
                for (let i = 0; i < 6; i++) {
                    const t = i / 5;
                    const jitter = Math.sin(shape.seed + i * 1.73) * (h * 0.12);
                    ctx.lineTo(x - w / 2 + (i * w / 5), y + (i % 2 === 0 ? 0 : h * 0.45) + jitter);
                }
                ctx.lineTo(x + w / 2, this.height + 500);
                break;
            case 'skyscraper':
                ctx.rect(x - w / 4, y, w / 2, this.height - y + 500);
                ctx.rect(x - w / 7, y - h * 0.22, w / 3.5, h * 0.22);
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
                ctx.bezierCurveTo(x - w * 0.45, y + h * 0.08, x + w * 0.1, y - h * 0.1, x + w, this.height + 510);
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
                ctx.bezierCurveTo(x + w * 0.42, y + h * 0.22, x + w * 0.26, y + h * 0.88, x, y + h);
                ctx.bezierCurveTo(x - w * 0.26, y + h * 0.88, x - w * 0.42, y + h * 0.22, x - w / 2, y);
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
                ctx.lineTo(x + w * 0.38, y + h / 2);
                ctx.lineTo(x, y + h);
                ctx.lineTo(x - w * 0.38, y + h / 2);
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
