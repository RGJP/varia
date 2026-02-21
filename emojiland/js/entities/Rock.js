import { Entity } from './Entity.js';
import { Physics } from '../Physics.js';
import { getEmojiCanvas } from '../EmojiCache.js';

export class Rock extends Entity {
    constructor(x, y, facingRight) {
        // Rock is small, maybe 20x20
        super(x, y, 20, 20);
        this.speed = 1500;
        this.vx = facingRight ? this.speed : -this.speed;
        this.vy = 0;
        this.facingRight = facingRight;
        this.rotation = 0;
        this._cachedEmoji = getEmojiCanvas('🪨', 24);
    }

    update(dt, game) {
        this.x += this.vx * dt;
        this.rotation += (this.vx > 0 ? 10 : -10) * dt;

        // Check if Rock hits an enemy
        game.enemies.forEach(enemy => {
            if (!enemy.markedForDeletion && !this.markedForDeletion && Physics.checkAABB(this, enemy)) {
                this.markedForDeletion = true;
                if (enemy.takeDamage) {
                    enemy.takeDamage(1, game);
                } else {
                    enemy.markedForDeletion = true;
                    game.player.score += 50;
                    game.audio.playHit();
                    game.particles.emitHit(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                    game.camera.shake(0.1, 5);
                    game.hitStopTimer = 0.1;
                }
            }
        });

        // Check if Rock hits platforms (mostly walls or ground)
        if (!this.markedForDeletion) {
            for (let platform of game.platforms) {
                if (Physics.checkAABB(this, platform)) {
                    this.markedForDeletion = true;
                    // Optional: hit effect on wall
                    game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
                    break;
                }
            }
        }

        // Delete if it goes way offscreen
        if (Math.abs(this.x - game.player.x) > 2000) {
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
