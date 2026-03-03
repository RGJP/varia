import { Entity } from './Entity.js';
import { Physics } from '../Physics.js';
import { getEmojiCanvas } from '../EmojiCache.js';

export class Worm extends Entity {
    constructor(x, y, facingRight, emoji = '\uD83D\uDC0D') {
        super(x, y, 35, 35);
        this.speed = 300;
        this.vx = facingRight ? this.speed : -this.speed;
        this.vy = -300; // Popping up slightly before falling
        this.facingRight = facingRight;
        this.rotation = 0;
        this.rotationSpeed = (facingRight ? 1 : -1) * (10 + Math.random() * 5);
        this._cachedEmoji = getEmojiCanvas(emoji, 30, true);
        this._platformCandidates = [];
    }

    update(dt, game) {
        this.vy += Physics.GRAVITY * dt;
        if (this.vy > Physics.TERMINAL_VELOCITY) {
            this.vy = Physics.TERMINAL_VELOCITY;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Fun, fast rotation!
        this.rotation += this.rotationSpeed * dt;

        // Check if Worm hits the player
        if (!this.markedForDeletion && game.player.invulnerableTimer <= 0) {
            if (Physics.checkAABB(this, game.player.getHitbox())) {
                game.player.takeDamage(game);
                this.markedForDeletion = true;
                game.audio.playHit();
                game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
            }
        }

        // Check if Worm hits platforms
        if (!this.markedForDeletion) {
            const platforms = (game && typeof game.queryVisiblePlatformsInAABB === 'function')
                ? game.queryVisiblePlatformsInAABB(this.x, this.y, this.x + this.width, this.y + this.height, this._platformCandidates)
                : game._visiblePlatforms;
            for (let i = 0; i < platforms.length; i++) {
                if (Physics.checkAABB(this, platforms[i])) {
                    this.markedForDeletion = true;
                    game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
                    break;
                }
            }
        }

        // Delete if it goes offscreen or falls too far
        if (Math.abs(this.x - game.player.x) > 2000 || this.y > game.lowestY) {
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

