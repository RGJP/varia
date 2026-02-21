export class Particle {
    constructor(x, y, vx, vy, color, life, size) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = size;
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
        // Cap max active particles to prevent excessive draw calls
        this.maxParticles = 200;
    }

    emit(x, y, count, color, speedRange, lifeRange, sizeRange) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) break;
            const angle = Math.random() * Math.PI * 2;
            const speed = speedRange[0] + Math.random() * (speedRange[1] - speedRange[0]);
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const life = lifeRange[0] + Math.random() * (lifeRange[1] - lifeRange[0]);
            const size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
            this.particles.push(new Particle(x, y, vx, vy, color, life, size));
        }
    }

    emitExplosion(x, y, color) {
        this.emit(x, y, 15, color, [50, 200], [0.3, 0.8], [3, 8]);
    }

    emitDeath(x, y, color = 'white') {
        this.emit(x, y, 20, color, [100, 300], [0.4, 1.0], [4, 10]);
        this.emit(x, y, 10, 'lightgray', [50, 150], [0.5, 1.2], [2, 6]);
    }

    emitHit(x, y) {
        this.emit(x, y, 8, 'white', [100, 300], [0.1, 0.3], [2, 5]);
    }

    emitJump(x, y, color = 'rgba(200, 200, 200, 0.8)') {
        for (let i = 0; i < 4; i++) {
            if (this.particles.length >= this.maxParticles) break;
            const vx = (Math.random() - 0.5) * 50;
            const vy = -Math.random() * 50;
            this.particles.push(new Particle(x, y, vx, vy, color, 0.3, 3 + Math.random() * 2));
        }
    }

    update(dt) {
        // Update and filter dead in a single pass using a write index
        let writeIdx = 0;
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life > 0) {
                this.particles[writeIdx++] = p;
            }
        }
        this.particles.length = writeIdx;
    }

    draw(ctx) {
        // Batch particles by color for fewer state changes
        // For most cases we have a small number of distinct colors
        const byColor = new Map();
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            let arr = byColor.get(p.color);
            if (!arr) {
                arr = [];
                byColor.set(p.color, arr);
            }
            arr.push(p);
        }

        const savedAlpha = ctx.globalAlpha;
        for (const [color, particles] of byColor) {
            ctx.fillStyle = color;
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                const ratio = p.life / p.maxLife;
                if (ratio <= 0) continue;
                ctx.globalAlpha = ratio;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * ratio, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = savedAlpha;
    }
}
