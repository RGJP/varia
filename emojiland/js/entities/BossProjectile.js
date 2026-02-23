import { Entity } from './Entity.js';
import { Physics } from '../Physics.js';
import { getEmojiCanvas } from '../EmojiCache.js';

// projectileType: 'drumstick' | 'stone' | 'skewer'
export class BossProjectile extends Entity {
    constructor(x, y, vx, vy, projectileType) {
        super(x, y, 40, 40);
        this.vx = vx;
        this.vy = vy;
        this.projectileType = projectileType;
        this.rotation = 0;
        this.bounceCount = 0;

        switch (projectileType) {
            case 'drumstick':
                this.emoji = '🍗';
                this.maxBounces = 2;
                break;
            case 'stone':
                this.emoji = '🥌';
                this.maxBounces = 0;
                break;
            case 'skewer':
                this.emoji = '🍢';
                this.maxBounces = 0;
                break;
        }

        this._cachedEmoji = getEmojiCanvas(this.emoji, 44);
    }

    update(dt, game) {
        // Apply gravity
        this.vy += Physics.GRAVITY * dt;
        if (this.vy > Physics.TERMINAL_VELOCITY) this.vy = Physics.TERMINAL_VELOCITY;

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.rotation += (this.vx > 0 ? 6 : -6) * dt;

        if (this.markedForDeletion) return;

        // Player collision
        if (game.player.invulnerableTimer <= 0) {
            if (Physics.checkAABB(this, game.player.getHitbox())) {
                game.player.takeDamage(game);
                game.audio.playHit();
                game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);

                // 🍢 skewer: slow + stun the player
                if (this.projectileType === 'skewer') {
                    game.player.slowTimer = 1.2;
                    game.player.stunTimer = 0.3;
                }

                this.markedForDeletion = true;
                return;
            }
        }

        // Platform collision
        const platforms = game._visiblePlatforms;
        for (let i = 0; i < platforms.length; i++) {
            const p = platforms[i];
            if (Physics.checkAABB(this, p)) {
                if (this.projectileType === 'drumstick' && this.bounceCount < this.maxBounces) {
                    // Bounce: reverse vy, lose a bit of energy
                    this.vy = -Math.abs(this.vy) * 0.65;
                    this.y = p.y - this.height;
                    this.bounceCount++;
                    game.particles.emitHit(this.x + this.width / 2, p.y);
                } else if (this.projectileType === 'stone') {
                    // Shockwave: burst of hit particles around impact point
                    const cx = this.x + this.width / 2;
                    const cy = p.y;
                    for (let k = 0; k < 8; k++) {
                        game.particles.emitHit(cx + Math.cos(k * Math.PI / 4) * 20, cy + Math.sin(k * Math.PI / 4) * 10);
                    }
                    this.markedForDeletion = true;
                } else {
                    game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
                    this.markedForDeletion = true;
                }
                break;
            }
        }

        // Off-screen cleanup
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
