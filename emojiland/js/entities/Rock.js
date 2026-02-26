import { Entity } from './Entity.js';
import { Physics } from '../Physics.js';
import { getEmojiCanvas } from '../EmojiCache.js';

export class Rock extends Entity {
    constructor(x, y, facingRight, options = {}) {
        const sizeMultiplier = options.sizeMultiplier || 1;
        const size = 20 * sizeMultiplier;
        super(x, y, size, size);
        this.speed = 1500;
        this.vx = facingRight ? this.speed : -this.speed;
        this.vy = 0;
        this.facingRight = facingRight;
        this.rotation = 0;
        this.damage = options.damage || 1;
        this.phaseThroughSurfaces = !!options.phaseThroughSurfaces;
        this._cachedEmoji = getEmojiCanvas('\u{1FAA8}', Math.round(24 * sizeMultiplier));
    }

    update(dt, game) {
        this.x += this.vx * dt;
        this.rotation += (this.vx > 0 ? 10 : -10) * dt;

        // Check if Rock hits an enemy
        game.enemies.forEach(enemy => {
            if (!enemy.markedForDeletion && !this.markedForDeletion && Physics.checkAABB(this, enemy)) {
                this.markedForDeletion = true;
                if (game.particles) game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
                if (game.audio) game.audio.playHit();

                if (enemy.takeDamage) {
                    const isTurtle = enemy.type === 'patrol' && enemy.emoji === '🐢';
                    if (isTurtle && typeof enemy.stomp === 'function') {
                        enemy.stomp(game);
                    } else {
                        enemy.takeDamage(this.damage, game);
                    }
                } else {
                    enemy.markedForDeletion = true;
                    game.player.score += 50;
                    game.audio.playHit();
                    game.particles.emitHit(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                }
            }
        });

        // Check if Rock hits platforms (mostly walls or ground)
        if (!this.markedForDeletion && !this.phaseThroughSurfaces) {
            const platforms = game._visiblePlatforms;
            for (let i = 0; i < platforms.length; i++) {
                const platform = platforms[i];
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
