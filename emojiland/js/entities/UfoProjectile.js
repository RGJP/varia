import { Entity } from './Entity.js';
import { Physics } from '../Physics.js';

export class UfoProjectile extends Entity {
    constructor(x, y, angle, shape) {
        // Size: Reduced from 32 to 24 (~53% of saucer width)
        const size = 24;
        super(x - size / 2, y, size, size);

        this.speed = 250;
        this.angle = angle;
        // Direction typically straight down plus some spread
        const direction = Math.PI / 2 + angle;
        this.vx = Math.cos(direction) * this.speed;
        this.vy = Math.sin(direction) * this.speed;

        // Randomly pick a shape if not provided
        const shapes = ['sphere', 'triangle', 'square'];
        this.shape = shape || shapes[Math.floor(Math.random() * shapes.length)];

        // Rotation for visual variety, especially for triangle and square
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 10;
        this._platformCandidates = [];
    }

    update(dt, game) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.rotation += dt * this.rotationSpeed;

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
            const platforms = (typeof game.queryVisiblePlatformsInAABB === 'function')
                ? game.queryVisiblePlatformsInAABB(this.x, this.y, this.x + this.width, this.y + this.height, this._platformCandidates)
                : game._visiblePlatforms;
            for (let i = 0; i < platforms.length; i++) {
                if (Physics.checkAABB(this, platforms[i])) {
                    this.markedForDeletion = true;
                    if (game.particles) game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2, '#FFD700');
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
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const radius = this.width / 2;

        ctx.translate(cx, cy);
        ctx.rotate(this.rotation);

        // Solid color
        ctx.fillStyle = '#FFFF00';

        ctx.beginPath();
        if (this.shape === 'sphere') {
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
        } else if (this.shape === 'triangle') {
            // Equilateral-ish triangle
            const h = radius * 2 * (Math.sqrt(3) / 2);
            ctx.moveTo(0, -radius);
            ctx.lineTo(radius, radius * 0.8);
            ctx.lineTo(-radius, radius * 0.8);
            ctx.closePath();
        } else if (this.shape === 'square') {
            ctx.rect(-radius * 0.8, -radius * 0.8, radius * 1.6, radius * 1.6);
        }
        ctx.fill();

        // Consistent highlight for unified "glossy" look
        ctx.beginPath();
        ctx.arc(-radius * 0.4, -radius * 0.4, radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();

        ctx.restore();
    }
}
