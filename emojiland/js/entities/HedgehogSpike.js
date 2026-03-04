import { Entity } from './Entity.js';
import { Physics } from '../Physics.js';

export class HedgehogSpike extends Entity {
    constructor(x, y, angle, speed = 310) {
        const size = 18;
        super(x - size / 2, y - size / 2, size, size);

        this.speed = speed;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.rotation = Math.atan2(this.vy, this.vx) + Math.PI / 2;
        this.lifetime = 3.0;
        this._platformCandidates = [];
    }

    update(dt, game) {
        this.lifetime -= dt;
        if (this.lifetime <= 0) {
            this.markedForDeletion = true;
            return;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.rotation = Math.atan2(this.vy, this.vx) + Math.PI / 2;

        if (!this.markedForDeletion && game.player && game.player.invulnerableTimer <= 0) {
            if (Physics.checkAABB(this, game.player.getHitbox())) {
                game.player.takeDamage(game);
                this.markedForDeletion = true;
                if (game.audio) game.audio.playHit();
                if (game.particles) game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2, '#8a5b33');
            }
        }

        if (!this.markedForDeletion && game && game._visiblePlatforms) {
            const platforms = (typeof game.queryVisiblePlatformsInAABB === 'function')
                ? game.queryVisiblePlatformsInAABB(this.x, this.y, this.x + this.width, this.y + this.height, this._platformCandidates)
                : game._visiblePlatforms;
            for (let i = 0; i < platforms.length; i++) {
                if (Physics.checkAABB(this, platforms[i])) {
                    this.markedForDeletion = true;
                    if (game.particles) game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2, '#6e4322');
                    break;
                }
            }
        }

        if (game && game.player && (Math.abs(this.x - game.player.x) > 2200 || this.y > game.lowestY + 900 || this.y < -1300)) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const visualScale = 1.12;
        const spikeLength = this.height * 1.28 * visualScale;
        const halfBase = this.width * 0.3 * visualScale;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.rotation);

        ctx.beginPath();
        ctx.moveTo(0, -spikeLength * 0.68);
        ctx.lineTo(halfBase, spikeLength * 0.44);
        ctx.lineTo(0, spikeLength * 0.2);
        ctx.lineTo(-halfBase, spikeLength * 0.44);
        ctx.closePath();
        ctx.fillStyle = '#8a5b33';
        ctx.fill();

        ctx.strokeStyle = '#7a0000';
        ctx.lineWidth = 1.8;
        ctx.lineJoin = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, -spikeLength * 0.32, Math.max(1.2, this.width * 0.12), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 239, 210, 0.72)';
        ctx.fill();

        ctx.restore();
    }
}
