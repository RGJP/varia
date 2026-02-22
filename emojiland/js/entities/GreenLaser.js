import { Entity } from './Entity.js';
import { Physics } from '../Physics.js';

export class GreenLaser extends Entity {
    constructor(x, y, angle) {
        // Small vertical box for laser
        super(x - 4, y, 8, 25);
        this.speed = 300;
        this.angle = angle;
        // Direction typically straight down plus some spread
        // So angle is relative to strictly downward
        const direction = Math.PI / 2 + angle;
        this.vx = Math.cos(direction) * this.speed;
        this.vy = Math.sin(direction) * this.speed;
        this.rotation = direction;
    }

    update(dt, game) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Check hit player
        if (!this.markedForDeletion && game.player && game.player.invulnerableTimer <= 0) {
            if (Physics.checkAABB(this, game.player.getHitbox())) {
                game.player.takeDamage(game);
                this.markedForDeletion = true;
                if (game.audio) game.audio.playHit();
                if (game.particles) game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
            }
        }

        // Check hit platforms
        if (!this.markedForDeletion && game._visiblePlatforms) {
            const platforms = game._visiblePlatforms;
            for (let i = 0; i < platforms.length; i++) {
                if (Physics.checkAABB(this, platforms[i])) {
                    this.markedForDeletion = true;
                    if (game.particles) game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2, '#0f0');
                    break;
                }
            }
        }

        // Delete if too far offscreen
        if (game.player && Math.abs(this.x - game.player.x) > 2000 || this.y > game.lowestY + 1000) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        // Rotate so it aligns with its direction of travel
        // Draw centered
        ctx.rotate(this.rotation - Math.PI / 2);

        // Green laser with black border
        ctx.fillStyle = '#00FF00';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 0.5;

        ctx.beginPath();
        // Give it a slightly rounded look or just a rectangle
        const w = this.width;
        const h = this.height;
        ctx.roundRect(-w / 2, -h / 2, w, h, 4);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}
