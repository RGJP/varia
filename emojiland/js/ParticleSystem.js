export class Particle {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.color = '';
        this.life = 0;
        this.maxLife = 0;
        this.size = 0;
        this.fadeInverse = false;
    }

    init(x, y, vx, vy, color, life, size, fadeInverse = false) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.fadeInverse = fadeInverse;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.baseMaxParticles = 700;
        this.maxParticles = this.baseMaxParticles;
        this.quality = 1;
        this.panicMode = false;
        this.mobileMode = false;
        this.emissionScale = 1;
        this.lifeDecayMultiplier = 1;
        this.renderSizeScale = 1;
        this.drawStride = 1;
        this.drawAsSquaresOnly = false;
        this.emissionTokenRate = 700;
        this.emissionTokens = this.emissionTokenRate;
        this.pool = [];
        for (let i = 0; i < this.baseMaxParticles; i++) {
            this.pool.push(new Particle());
        }
        this._byColor = new Map();
    }

    setMobileMode(enabled) {
        this.mobileMode = !!enabled;
        this.setQuality(this.quality);
    }

    setPanicMode(enabled) {
        const next = !!enabled;
        if (this.panicMode === next) return;
        this.panicMode = next;
        this.setQuality(this.quality);
        if (this.panicMode) {
            this._panicCullParticles();
        }
    }

    setQuality(quality) {
        const minQuality = this.mobileMode ? 0.12 : 0.15;
        this.quality = Math.max(minQuality, Math.min(1, quality));
        const scaledMax = this.mobileMode
            ? this.baseMaxParticles * (0.09 + Math.pow(this.quality, 2.1) * 0.91)
            : this.baseMaxParticles * (0.12 + Math.pow(this.quality, 1.9) * 0.88);
        this.maxParticles = Math.max(this.mobileMode ? 80 : 120, Math.floor(scaledMax));
        this.emissionScale = this.mobileMode
            ? Math.pow(this.quality, 3.2) * 0.9
            : Math.pow(this.quality, 2.7) * 0.9;
        this.lifeDecayMultiplier = this.mobileMode
            ? (1 + (1 - this.quality) * 3.4)
            : (1 + (1 - this.quality) * 2.6);
        this.renderSizeScale = 0.6 + this.quality * 0.4;
        this.drawStride = this.quality < 0.2 ? 6
            : (this.quality < 0.32 ? 5
                : (this.quality < 0.45 ? 4
                    : (this.quality < 0.62 ? 3
                        : (this.quality < 0.78 ? 2 : 1))));
        this.drawAsSquaresOnly = this.quality < 0.82;
        this.emissionTokenRate = this.mobileMode
            ? Math.floor(90 + Math.pow(this.quality, 2.6) * 360)
            : Math.floor(120 + Math.pow(this.quality, 2.2) * 520);

        if (this.panicMode) {
            this.maxParticles = Math.min(this.maxParticles, this.mobileMode ? 34 : 46);
            this.emissionScale *= 0.05;
            this.lifeDecayMultiplier *= 3.1;
            this.renderSizeScale *= 0.8;
            this.drawStride = Math.max(this.drawStride, 14);
            this.drawAsSquaresOnly = true;
            this.emissionTokenRate = Math.min(this.emissionTokenRate, this.mobileMode ? 20 : 28);
        }
        this.emissionTokens = Math.min(this.emissionTokens, this.emissionTokenRate * 1.5);
    }

    _scaledCount(baseCount, minCount = 1) {
        if (this.panicMode) {
            return Math.max(0, Math.floor(baseCount * this.emissionScale));
        }
        const scaled = Math.floor(baseCount * this.emissionScale);
        if (minCount <= 0) return Math.max(0, scaled);
        return Math.max(minCount, scaled);
    }

    _panicCullParticles() {
        const keepStride = this.mobileMode ? 9 : 7;
        let writeIdx = 0;
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            if (i % keepStride === 0 && writeIdx < this.maxParticles) {
                this.particles[writeIdx++] = p;
            } else {
                this.pool.push(p);
            }
        }
        this.particles.length = writeIdx;
        this.emissionTokens = Math.min(this.emissionTokens, this.emissionTokenRate * 0.4);
    }

    _getParticle() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        return null; // Pool exhausted, do not emit
    }

    emit(x, y, count, color, speedRange, lifeRange, sizeRange) {
        if (count <= 0) return;
        const minCount = this.panicMode ? 0 : ((count >= 12 && this.quality >= 0.2) ? 1 : 0);
        const reducedCount = this._scaledCount(count / 4, minCount);
        const allowedCount = Math.min(reducedCount, Math.max(0, Math.floor(this.emissionTokens)));
        if (allowedCount <= 0) return;
        this.emissionTokens = Math.max(0, this.emissionTokens - allowedCount);
        for (let i = 0; i < allowedCount; i++) {
            if (this.particles.length >= this.maxParticles) break;
            const p = this._getParticle();
            if (!p) break;
            const angle = Math.random() * Math.PI * 2;
            const speed = speedRange[0] + Math.random() * (speedRange[1] - speedRange[0]);
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const life = lifeRange[0] + Math.random() * (lifeRange[1] - lifeRange[0]);
            const size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
            p.init(x, y, vx, vy, color, life, size);
            this.particles.push(p);
        }
    }

    emitExplosion(x, y, color) {
        this.emit(x, y, 15, color, [50, 200], [0.3, 0.8], [3, 8]);
    }

    emitDeath(x, y, color = 'white') {
        this.emit(x, y, 20, color, [100, 300], [0.4, 1.0], [4, 10]);
        this.emit(x, y, 10, 'lightgray', [50, 150], [0.5, 1.2], [2, 6]);
    }

    emitGreenSmoke(x, y, radius = 180) {
        const greenColors = [
            'rgba(34, 139, 34, 0.4)', // Fainter base
            'rgba(50, 205, 50, 0.35)',
            'rgba(0, 128, 0, 0.3)',
            'rgba(107, 142, 35, 0.25)',
        ];
        const count = this._scaledCount(5);
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) break;
            const p = this._getParticle();
            if (!p) break;
            const angle = Math.random() * Math.PI * 2;

            const life = 1.2 + Math.random() * 0.8;
            const speed = (radius / life) * (0.9 + Math.random() * 0.1); // More consistent edge reach

            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = 20 + Math.random() * 30; // Even larger puffier clouds
            const color = greenColors[Math.floor(Math.random() * greenColors.length)];
            p.init(x, y, vx, vy, color, life, size, true); // fadeInverse = true
            this.particles.push(p);
        }
    }

    /** Two little green smoke rings (e.g. for troll hit feedback). */
    emitGreenSmokeRings(x, y) {
        const greenColors = [
            'rgba(34, 139, 34, 0.35)',
            'rgba(50, 205, 50, 0.3)',
            'rgba(107, 142, 35, 0.25)',
        ];
        const rings = 2;
        const particlesPerRing = 4;
        for (let r = 0; r < rings; r++) {
            if (this.particles.length >= this.maxParticles) break;
            const baseSpeed = 28 + r * 12 + Math.random() * 8;
            const life = 0.35 + Math.random() * 0.2;
            const size = 6 + Math.random() * 5;
            for (let i = 0; i < particlesPerRing; i++) {
                if (this.particles.length >= this.maxParticles) break;
                const p = this._getParticle();
                if (!p) break;
                const angle = (i / particlesPerRing) * Math.PI * 2 + Math.random() * 0.3;
                const speed = baseSpeed * (0.9 + Math.random() * 0.2);
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                const color = greenColors[Math.floor(Math.random() * greenColors.length)];
                p.init(x, y, vx, vy, color, life, size, true);
                this.particles.push(p);
            }
        }
    }

    emitHit(x, y) {
        this.emit(x, y, 15, 'white', [150, 400], [0.2, 0.4], [3, 6]);
    }

    emitStomp(x, y) {
        // Big horizontal smoke cloud — large particles fanning left and right
        const smokeColors = [
            'rgba(180,180,180,0.9)',
            'rgba(210,200,190,0.85)',
            'rgba(220,210,200,0.8)',
            'rgba(160,160,160,0.7)',
            'rgba(200,195,185,0.75)',
        ];
        const count = this._scaledCount(18);
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) break;
            const p = this._getParticle();
            if (!p) break;
            // Spread angle: mostly horizontal cone (−45° to +45° either side)
            const side = Math.random() < 0.5 ? -1 : 1;
            const angle = (Math.PI + side * (Math.PI * 0.15 + Math.random() * Math.PI * 0.3));
            const speed = 80 + Math.random() * 220;
            const vx = Math.cos(angle) * speed;
            // Upward bias so the cloud rises slightly then fades
            const vy = -(20 + Math.random() * 80);
            const life = 0.55 + Math.random() * 0.45;
            const size = 12 + Math.random() * 22;
            const color = smokeColors[Math.floor(Math.random() * smokeColors.length)];
            p.init(x, y, vx, vy, color, life, size);
            this.particles.push(p);
        }
    }

    emitFireworks(x, y, intensity = 1) {
        const colors = ['#FFD700', '#FF4D6D', '#00C2FF', '#7CFC00', '#FF8C00', '#b388ff', '#ffffff'];
        const bursts = this._scaledCount(Math.max(3, Math.round(4 * intensity)), 1);
        for (let b = 0; b < bursts; b++) {
            const burstColor = colors[Math.floor(Math.random() * colors.length)];
            const count = this._scaledCount(Math.max(18, Math.round(24 * intensity)), 6);
            for (let i = 0; i < count; i++) {
                if (this.particles.length >= this.maxParticles) return;
                const p = this._getParticle();
                if (!p) return;
                const angle = (Math.PI * 2 * i) / count + Math.random() * 0.12;
                const speed = 180 + Math.random() * 250 + b * 28 * intensity;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed - (30 + Math.random() * 60);
                const life = 0.7 + Math.random() * 0.65 + intensity * 0.08;
                const size = 3 + Math.random() * (5 + intensity * 2.2);
                p.init(x, y, vx, vy, burstColor, life, size);
                this.particles.push(p);
            }
        }
    }

    emitFireworksLite(x, y, intensity = 1) {
        const colors = ['#FFD700', '#FF4D6D', '#00C2FF', '#ffffff'];
        const bursts = this._scaledCount(Math.max(1, Math.round(2 * intensity)), 1);
        for (let b = 0; b < bursts; b++) {
            const burstColor = colors[Math.floor(Math.random() * colors.length)];
            const count = this._scaledCount(Math.max(8, Math.round(10 * intensity)), 4);
            for (let i = 0; i < count; i++) {
                if (this.particles.length >= this.maxParticles) return;
                const p = this._getParticle();
                if (!p) return;
                const angle = (Math.PI * 2 * i) / count + Math.random() * 0.18;
                const speed = 120 + Math.random() * 130 + b * 18 * intensity;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed - (16 + Math.random() * 34);
                const life = 0.38 + Math.random() * 0.34;
                const size = 2 + Math.random() * 3;
                p.init(x, y, vx, vy, burstColor, life, size);
                this.particles.push(p);
            }
        }
    }

    emitFireworksShow(x, y, intensity = 1) {
        const rings = Math.max(2, Math.round(3 * intensity));
        for (let r = 0; r < rings; r++) {
            const ringT = rings <= 1 ? 0 : r / (rings - 1);
            const ringRadius = 35 + ringT * (120 + intensity * 40);
            const ringBursts = Math.max(6, Math.round(8 + intensity * 4));
            for (let i = 0; i < ringBursts; i++) {
                const a = (i / ringBursts) * Math.PI * 2 + Math.random() * 0.2;
                const ox = Math.cos(a) * ringRadius;
                const oy = Math.sin(a) * ringRadius * 0.6 - 40;
                this.emitFireworks(x + ox, y + oy, 0.62 + intensity * 0.28);
            }
        }
        this.emitFireworks(x, y - 35, 1.25 + intensity * 0.35);
    }

    emitJump(x, y, color = 'rgba(200, 200, 200, 0.8)') {
        for (let i = 0; i < 2; i++) {
            if (this.particles.length >= this.maxParticles) break;
            const p = this._getParticle();
            if (!p) break;
            const vx = (Math.random() - 0.5) * 50;
            const vy = -Math.random() * 50;
            p.init(x, y, vx, vy, color, 0.3, 3 + Math.random() * 2);
            this.particles.push(p);
        }
    }

    clearGreenSmoke(x, y, searchRadius = 300) {
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            if (p.fadeInverse) {
                const dx = p.x - x;
                const dy = p.y - y;
                if (Math.hypot(dx, dy) < searchRadius) {
                    p.fadeInverse = false;
                    p.maxLife = 0.4;
                    p.life = 0.4;
                }
            }
        }
    }

    update(dt) {
        // Update and filter dead in a single pass using a write index
        let writeIdx = 0;
        const decay = this.lifeDecayMultiplier;
        const tokenCap = this.emissionTokenRate * 1.5;
        this.emissionTokens = Math.min(tokenCap, this.emissionTokens + this.emissionTokenRate * dt);
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt * decay;
            if (p.life > 0) {
                this.particles[writeIdx++] = p;
            } else {
                this.pool.push(p); // return to pool
            }
        }
        this.particles.length = writeIdx;
    }

    draw(ctx, cullLeft = -Infinity, cullRight = Infinity, cullTop = -Infinity, cullBottom = Infinity) {
        const byColor = this._byColor;
        for (const arr of byColor.values()) {
            arr.length = 0; // Clear without deallocating
        }

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            if (
                p.x + p.size < cullLeft ||
                p.x - p.size > cullRight ||
                p.y + p.size < cullTop ||
                p.y - p.size > cullBottom
            ) {
                continue;
            }
            let arr = byColor.get(p.color);
            if (!arr) {
                arr = [];
                byColor.set(p.color, arr);
            }
            arr.push(p);
        }

        const savedAlpha = ctx.globalAlpha;
        for (const [color, particles] of byColor) {
            if (particles.length === 0) continue;
            ctx.fillStyle = color;
            for (let i = 0; i < particles.length; i += this.drawStride) {
                const p = particles[i];
                const ratio = p.life / p.maxLife;
                if (ratio <= 0) continue;
                // If fadeInverse is true, it's faint at start and opaque at end of life
                ctx.globalAlpha = p.fadeInverse ? (1 - ratio) : ratio;
                const drawRadius = p.size * (p.fadeInverse ? 1 : ratio) * this.renderSizeScale;
                if (this.drawAsSquaresOnly || drawRadius <= 2.2) {
                    const d = drawRadius * 2;
                    ctx.fillRect(p.x - drawRadius, p.y - drawRadius, d, d);
                } else {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, drawRadius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        ctx.globalAlpha = savedAlpha;
    }
}
