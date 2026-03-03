import { Entity } from './Entity.js';
import { Physics } from '../Physics.js';
import { getEmojiCanvas } from '../EmojiCache.js';

export class Barrel extends Entity {
    constructor(x, y, facingRight) {
        super(x, y, 40, 40);
        this.speed = 250;
        this.vx = facingRight ? this.speed : -this.speed;
        this.vy = 0;
        this.rotation = 0;
        this.facingRight = facingRight;
        this._cachedEmoji = getEmojiCanvas('🛢️', 40);
        this._platformCandidates = [];
    }

    update(dt, game) {
        // Gravity
        this.vy += Physics.GRAVITY * dt;
        if (this.vy > Physics.TERMINAL_VELOCITY) {
            this.vy = Physics.TERMINAL_VELOCITY;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Visual rotation - roll based on horizontal movement
        // circumference = PI * diameter. Approx 125 for 40px width.
        // rotation (radians) = distance / radius
        const radius = this.width / 2;
        this.rotation += (this.vx * dt) / radius;

        // Collision with platforms
        const platforms = (game && typeof game.queryVisiblePlatformsInAABB === 'function')
            ? game.queryVisiblePlatformsInAABB(this.x, this.y, this.x + this.width, this.y + this.height, this._platformCandidates)
            : game._visiblePlatforms;
        let onGround = false;

        for (let i = 0; i < platforms.length; i++) {
            const platform = platforms[i];
            if (Physics.checkAABB(this, platform)) {
                // Determine collision side
                const overlapX = Math.min(this.x + this.width, platform.x + platform.width) - Math.max(this.x, platform.x);
                const overlapY = Math.min(this.y + this.height, platform.y + platform.height) - Math.max(this.y, platform.y);

                if (overlapX > overlapY) {
                    // Top or bottom collision
                    if (this.vy > 0 && this.y + this.height - (this.vy * dt) <= platform.y) {
                        this.y = platform.y - this.height;
                        // Bounce!
                        this.vy = -200 - Math.random() * 100;
                        onGround = true;
                    } else if (this.vy < 0 && this.y - (this.vy * dt) >= platform.y + platform.height) {
                        this.y = platform.y + platform.height;
                        this.vy = 0;
                    }
                } else {
                    // Side collision - Bounce horizontally!
                    // Only trigger side bounce if we are clearly hitting the side, not just rolling off
                    const centerBarrel = this.x + this.width / 2;
                    const centerPlatform = platform.x + platform.width / 2;

                    if (this.vx > 0 && centerBarrel < centerPlatform) {
                        this.x = platform.x - this.width;
                        this.vx = -this.speed;
                        this.facingRight = false;
                    } else if (this.vx < 0 && centerBarrel > centerPlatform) {
                        this.x = platform.x + platform.width;
                        this.vx = this.speed;
                        this.facingRight = true;
                    }
                }
            }
        }

        // Check player collision
        if (!this.markedForDeletion && game.player && game.player.invulnerableTimer <= 0) {
            if (Physics.checkAABB(this, game.player.getHitbox())) {
                game.player.takeDamage(game);
                // Barrels don't necessarily break on hitting the player, they keep rolling!
                // But let's add a small hit effect
                if (game.particles) {
                    game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
                }
            }
        }

        // Delete if way offscreen or falls too far
        if (Math.abs(this.x - game.player.x) > 2500 || this.y > game.lowestY + 500) {
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
