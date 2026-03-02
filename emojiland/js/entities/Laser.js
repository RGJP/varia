import { Entity } from './Entity.js';
import { Physics } from '../Physics.js';
import { getEmojiCanvas } from '../EmojiCache.js';

export class Laser extends Entity {
    constructor(x, y, angle) {
        // Smaller projectile for tighter dodge windows and cleaner visuals
        super(x - 11, y - 11, 22, 22);
        this.speed = 250;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        // Point the emoji in the direction of travel
        this.rotation = angle + Math.PI / 2;
        this.emoji = '⚡';
        this._cachedEmoji = getEmojiCanvas(this.emoji, 44, true);
    }

    update(dt, game) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Check hit player
        if (!this.markedForDeletion && game.player.invulnerableTimer <= 0) {
            if (Physics.checkAABB(this, game.player.getHitbox())) {
                game.player.takeDamage(game);
                this.markedForDeletion = true;
                if (game.audio) game.audio.playHit();
                if (game.particles) game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
            }
        }

        // Check hit platforms (can optionally make lasers go through walls)
        if (!this.markedForDeletion) {
            const platforms = game._visiblePlatforms;
            for (let i = 0; i < platforms.length; i++) {
                if (Physics.checkAABB(this, platforms[i])) {
                    this.markedForDeletion = true;
                    if (game.particles) game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
                    break;
                }
            }
        }

        // Delete if too far
        if (Math.abs(this.x - game.player.x) > 2000 || this.y > game.lowestY + 1000 || this.y < -2000) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        const cached = this._cachedEmoji;
        ctx.drawImage(cached.canvas, -cached.width / 2, -cached.height / 2);

        ctx.restore();
    }
}
