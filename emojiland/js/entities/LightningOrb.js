import { Entity } from './Entity.js';
import { getEmojiCanvas } from '../EmojiCache.js';

export class LightningOrb extends Entity {
    constructor(x, y) {
        const orbSize = 72;
        super(x - orbSize / 2, y - orbSize / 2, orbSize, orbSize);
        this.speed = 620;
        this.turnRate = 8.8;
        this.vx = (Math.random() - 0.5) * 120;
        this.vy = -120 + Math.random() * 240;
        this.lifetime = 2.4;
        this.hitRadius = 42;
        this.maxChains = 7;
        this.chainCount = 0;
        this.targetEnemy = null;
        this.hitEnemies = new Set();
        this.fxTimer = 0;
        this._enemyCandidates = [];

        this._baseEmoji = getEmojiCanvas('\u26A1', 50);
        this._rotEmoji = this._buildRotatedEmoji(this._baseEmoji);
    }

    _buildRotatedEmoji(cached) {
        const size = Math.max(cached.width, cached.height) + 2;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.translate(size / 2, size / 2);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(cached.canvas, -cached.width / 2, -cached.height / 2);
        return { canvas, width: size, height: size };
    }

    _findNearestEnemy(game) {
        if (!game || !game.enemies) return null;
        let best = null;
        let bestDistSq = Infinity;
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const localSearchRadius = 950;
        const nearbyEnemies = (typeof game.queryEnemiesInAABB === 'function')
            ? game.queryEnemiesInAABB(
                cx - localSearchRadius,
                cy - localSearchRadius,
                cx + localSearchRadius,
                cy + localSearchRadius,
                this._enemyCandidates
            )
            : game.enemies;
        const searchPool = nearbyEnemies.length > 0 ? nearbyEnemies : game.enemies;

        for (let i = 0; i < searchPool.length; i++) {
            const enemy = searchPool[i];
            if (!enemy || enemy.markedForDeletion || this.hitEnemies.has(enemy)) continue;
            const ex = enemy.x + enemy.width / 2;
            const ey = enemy.y + enemy.height / 2;
            const dx = ex - cx;
            const dy = ey - cy;
            const distSq = dx * dx + dy * dy;
            if (distSq < bestDistSq) {
                bestDistSq = distSq;
                best = enemy;
            }
        }
        return best;
    }

    _damageTarget(enemy, game) {
        if (!enemy || enemy.markedForDeletion) return;
        if (enemy.type === 'jellyfish' && typeof enemy.stomp === 'function') {
            enemy.stomp(game);
            return;
        }
        if (enemy.takeDamage) {
            enemy.takeDamage(1, game);
            return;
        }
        enemy.markedForDeletion = true;
        if (game && game.player) game.player.score += 50;
        if (game && typeof game.registerEnemyDefeat === 'function') game.registerEnemyDefeat(enemy);
    }

    update(dt, game) {
        this.lifetime -= dt;
        if (this.lifetime <= 0) {
            this.markedForDeletion = true;
            return;
        }

        if (!this.targetEnemy || this.targetEnemy.markedForDeletion || this.hitEnemies.has(this.targetEnemy)) {
            this.targetEnemy = this._findNearestEnemy(game);
            if (!this.targetEnemy) {
                this.markedForDeletion = true;
                return;
            }
        }

        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const tx = this.targetEnemy.x + this.targetEnemy.width / 2;
        const ty = this.targetEnemy.y + this.targetEnemy.height / 2;
        const dx = tx - cx;
        const dy = ty - cy;
        const dist = Math.hypot(dx, dy);

        if (dist <= this.hitRadius + Math.max(this.targetEnemy.width, this.targetEnemy.height) * 0.2) {
            this._damageTarget(this.targetEnemy, game);
            this.hitEnemies.add(this.targetEnemy);
            this.chainCount++;
            if (game && game.particles) {
                // Punchy electric hit flash: bright core + wider halo so impacts feel weighty.
                game.particles.emit(tx, ty, 18, '#fff59d', [90, 320], [0.14, 0.3], [2.4, 6.2]);
                game.particles.emit(tx, ty, 14, '#ffd54f', [65, 250], [0.12, 0.24], [2.2, 5.4]);
                game.particles.emitExplosion(tx, ty, '#ffeb3b');
            }
            if (this.chainCount >= this.maxChains) {
                this.markedForDeletion = true;
                return;
            }
            this.targetEnemy = this._findNearestEnemy(game);
            if (!this.targetEnemy) {
                this.markedForDeletion = true;
                return;
            }
            return;
        }

        if (dist > 0.001) {
            const targetVx = (dx / dist) * this.speed;
            const targetVy = (dy / dist) * this.speed;
            const t = Math.min(1, dt * this.turnRate);
            this.vx += (targetVx - this.vx) * t;
            this.vy += (targetVy - this.vy) * t;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.fxTimer -= dt;
        if (this.fxTimer <= 0 && game && game.particles) {
            this.fxTimer = 0.07;
            const px = this.x + this.width / 2;
            const py = this.y + this.height / 2;
            game.particles.emit(px, py, 3, '#fff176', [35, 140], [0.09, 0.18], [1.2, 3]);
        }
    }

    draw(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const pulse = 0.78 + Math.sin(performance.now() * 0.02) * 0.22;

        ctx.save();
        const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 56);
        glow.addColorStop(0, `rgba(255, 245, 180, ${0.55 * pulse})`);
        glow.addColorStop(1, 'rgba(255, 230, 100, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, 56, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 238, 120, ${0.82 * pulse})`;
        ctx.beginPath();
        ctx.arc(cx, cy, 24, 0, Math.PI * 2);
        ctx.fill();

        const sprite = this._rotEmoji;
        ctx.drawImage(sprite.canvas, cx - sprite.width / 2, cy - sprite.height / 2);
        ctx.restore();
    }
}
