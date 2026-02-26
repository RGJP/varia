import { Entity } from './Entity.js';
import { Physics } from '../Physics.js';
import { getEmojiCanvas } from '../EmojiCache.js';

// projectileType: 'drumstick' | 'stone' | 'skewer' | 'web' | 'wrench' | 'venom' | 'flame' | 'boomerang' | 'banana' | 'icicle' | 'roar' | 'fossil' | 'needle' | 'scarab'
export class BossProjectile extends Entity {
    constructor(x, y, vx, vy, projectileType) {
        super(x, y, 40, 40);
        this.vx = vx;
        this.vy = vy;
        this.projectileType = projectileType;
        this.rotation = 0;
        this.bounceCount = 0;
        this.canBounceOnPlatforms = false;

        switch (projectileType) {
            case 'drumstick':
                this.emoji = String.fromCodePoint(0x1F357);
                this.maxBounces = 2;
                this.canBounceOnPlatforms = true;
                break;
            case 'stone':
                this.emoji = String.fromCodePoint(0x1F94C);
                this.maxBounces = 2;
                this.canBounceOnPlatforms = true;
                break;
            case 'skewer':
                this.emoji = String.fromCodePoint(0x1F362);
                this.maxBounces = 2;
                this.canBounceOnPlatforms = true;
                break;
            case 'web':
                this.emoji = String.fromCodePoint(0x1F578) + '\uFE0F';
                this.maxBounces = 0;
                this.webState = 'AIRBORNE';
                this.webPlatform = null;
                this.webFallStartY = y;
                this.webFallTimer = 0;
                this.webFallMaxTime = 3.5;
                this.webFallDespawnDistance = 900;
                break;
            case 'wrench':
                this.emoji = String.fromCodePoint(0x2692) + '\uFE0F';
                this.maxBounces = 0;
                this.ignoreGravity = true;
                break;
            case 'venom':
                this.emoji = String.fromCodePoint(0x1F7E2);
                this.maxBounces = 0;
                this.ignorePlatformTimer = 0.14; // Allow the lob to clear the caster platform edge.
                break;
            case 'flame':
                this.emoji = String.fromCodePoint(0x1F525);
                this.maxBounces = 0;
                // Dragon volley flames must stay on a flat lane.
                this.ignoreGravity = true;
                break;
            case 'boomerang':
                this.emoji = String.fromCodePoint(0x1FA83);
                this.maxBounces = 0;
                this.ignoreGravity = true;
                this.boomerangTimer = 0;
                this.boomerangReturnDelay = 0.42 + Math.random() * 0.12;
                this.boomerangLifetime = 1.65;
                this.boomerangReturned = false;
                this.boomerangTurnRate = 4.8;
                this.boomerangMaxSpeed = 640;
                break;
            case 'banana':
                this.emoji = String.fromCodePoint(0x1F34C);
                this.maxBounces = 1;
                this.canBounceOnPlatforms = true;
                this.bananaLifetime = 2.6;
                break;
            case 'icicle':
                this.emoji = String.fromCodePoint(0x1F9CA);
                this.maxBounces = 0;
                this.projectileLifetime = 2.3;
                break;
            case 'roar':
                this.emoji = String.fromCodePoint(0x1F4A8);
                this.maxBounces = 0;
                this.ignoreGravity = true;
                this.ignorePlatformTimer = 0.2;
                this.projectileLifetime = 0.9;
                break;
            case 'fossil':
                this.emoji = String.fromCodePoint(0x1F9B4);
                this.maxBounces = 1;
                this.canBounceOnPlatforms = true;
                this.projectileLifetime = 2.5;
                break;
            case 'needle':
                this.emoji = String.fromCodePoint(0x1FAA1);
                this.maxBounces = 0;
                this.ignoreGravity = true;
                this.ignorePlatformTimer = 0.16;
                this.projectileLifetime = 1.35;
                break;
            case 'scarab':
                this.emoji = String.fromCodePoint(0x1FAB2);
                this.maxBounces = 0;
                this.canBounceOnPlatforms = true;
                break;
            default:
                this.emoji = String.fromCodePoint(0x1FAA8);
                this.maxBounces = 0;
                break;
        }

        this._cachedEmoji = getEmojiCanvas(this.emoji, this.projectileType === 'web' ? 50 : 44);
    }

    update(dt, game) {
        if (this.projectileType === 'web') {
            this._updateWeb(dt, game);
            return;
        }
        if (this.projectileType === 'boomerang') {
            this._updateBoomerang(dt, game);
            return;
        }

        if (!this.ignoreGravity) {
            // Apply gravity
            this.vy += Physics.GRAVITY * dt;
            if (this.vy > Physics.TERMINAL_VELOCITY) this.vy = Physics.TERMINAL_VELOCITY;
        }

        const prevY = this.y;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        const spinSpeed = this.projectileType === 'banana' ? 8 : 6;
        this.rotation += (this.vx > 0 ? spinSpeed : -spinSpeed) * dt;
        if (this.ignorePlatformTimer > 0) this.ignorePlatformTimer -= dt;
        if (this.projectileType === 'banana' && this.bananaLifetime !== undefined) this.bananaLifetime -= dt;
        if (this.projectileLifetime !== undefined) this.projectileLifetime -= dt;

        if (this.markedForDeletion) return;

        // Player collision
        if (game.player.invulnerableTimer <= 0) {
            if (Physics.checkAABB(this, game.player.getHitbox())) {
                game.player.takeDamage(game);
                game.audio.playHit();
                game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);

                // ?? skewer: slow + stun the player
                if (this.projectileType === 'skewer') {
                    game.player.slowTimer = 1.2;
                    game.player.stunTimer = 0.3;
                } else if (this.projectileType === 'web') {
                    // Webs briefly lock movement and deal 1 damage.
                    game.player.stunTimer = Math.max(game.player.stunTimer, 0.5);
                } else if (this.projectileType === 'venom') {
                    // Venom hits are slippery and briefly slow the player.
                    game.player.slowTimer = Math.max(game.player.slowTimer || 0, 1.0);
                } else if (this.projectileType === 'banana') {
                    // Banana peel hit: mild slip/stagger combo.
                    game.player.slowTimer = Math.max(game.player.slowTimer || 0, 0.85);
                    game.player.stunTimer = Math.max(game.player.stunTimer || 0, 0.16);
                } else if (this.projectileType === 'icicle') {
                    // Cold hit: stronger brief slow.
                    game.player.slowTimer = Math.max(game.player.slowTimer || 0, 1.15);
                    game.player.stunTimer = Math.max(game.player.stunTimer || 0, 0.12);
                } else if (this.projectileType === 'roar') {
                    // Roar gust: tiny stagger and brief slow.
                    game.player.slowTimer = Math.max(game.player.slowTimer || 0, 0.7);
                    game.player.stunTimer = Math.max(game.player.stunTimer || 0, 0.1);
                } else if (this.projectileType === 'fossil') {
                    // Heavy fossil toss: stronger stagger.
                    game.player.slowTimer = Math.max(game.player.slowTimer || 0, 0.95);
                    game.player.stunTimer = Math.max(game.player.stunTimer || 0, 0.2);
                } else if (this.projectileType === 'needle') {
                    // Needle sting: quick puncture debuff.
                    game.player.slowTimer = Math.max(game.player.slowTimer || 0, 0.9);
                    game.player.stunTimer = Math.max(game.player.stunTimer || 0, 0.14);
                } else if (this.projectileType === 'scarab') {
                    // Beetle shell chunk: medium stagger.
                    game.player.slowTimer = Math.max(game.player.slowTimer || 0, 0.9);
                    game.player.stunTimer = Math.max(game.player.stunTimer || 0, 0.18);
                }

                this.markedForDeletion = true;
                return;
            }
        }

        // Platform collision
        const platforms = game._visiblePlatforms;
        for (let i = 0; i < platforms.length; i++) {
            const p = platforms[i];
            if (this.ignorePlatformTimer > 0) continue;

            const aabbHit = Physics.checkAABB(this, p);
            const overlapsX = this.x + this.width > p.x && this.x < p.x + p.width;
            const prevBottom = prevY + this.height;
            const currBottom = this.y + this.height;
            const crossedTop = this.vy >= 0 && overlapsX && prevBottom <= p.y && currBottom >= p.y;
            if (!aabbHit && !crossedTop) continue;

            if (this.projectileType === 'scarab' && crossedTop) {
                // Beetle scarabs should keep rolling on top surfaces until they fall off.
                this.y = p.y - this.height;
                this.vy = 0;
                if (Math.abs(this.vx) < 110) this.vx = this.vx >= 0 ? 110 : -110;
                break;
            } else if (this.canBounceOnPlatforms && crossedTop && this.bounceCount < this.maxBounces) {
                // Top-crossing bounce prevents high-speed tunneling through platform tops.
                this.vy = -Math.abs(this.vy) * 0.65;
                this.y = p.y - this.height;
                this.bounceCount++;
                game.particles.emitHit(this.x + this.width / 2, p.y);
            } else {
                game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
                this.markedForDeletion = true;
            }
            break;
        }

        // Off-screen cleanup
        if (Math.abs(this.x - game.player.x) > 2000 || this.y > game.lowestY || (this.projectileType === 'banana' && this.bananaLifetime <= 0) || (this.projectileLifetime !== undefined && this.projectileLifetime <= 0)) {
            this.markedForDeletion = true;
        }
    }

    _updateBoomerang(dt, game) {
        this.boomerangTimer += dt;
        this.boomerangLifetime -= dt;

        if (!this.boomerangReturned && this.boomerangTimer >= this.boomerangReturnDelay) {
            this.boomerangReturned = true;
        }

        if (this.boomerangReturned && game && game.player) {
            const tx = game.player.x + game.player.width / 2;
            const ty = game.player.y + game.player.height / 2;
            const dx = tx - (this.x + this.width / 2);
            const dy = ty - (this.y + this.height / 2);
            const dist = Math.hypot(dx, dy) || 1;
            const currSpeed = Math.hypot(this.vx, this.vy);
            const desiredSpeed = Math.min(this.boomerangMaxSpeed, Math.max(280, currSpeed));
            const targetVx = (dx / dist) * desiredSpeed;
            const targetVy = (dy / dist) * desiredSpeed;
            const turn = Math.max(0, Math.min(1, dt * this.boomerangTurnRate));
            this.vx += (targetVx - this.vx) * turn;
            this.vy += (targetVy - this.vy) * turn;
        } else {
            this.vy += Math.sin(this.boomerangTimer * 12) * 16 * dt;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.rotation += (this.vx > 0 ? 10 : -10) * dt;

        // Player collision
        if (game.player.invulnerableTimer <= 0) {
            if (Physics.checkAABB(this, game.player.getHitbox())) {
                game.player.takeDamage(game);
                game.audio.playHit();
                game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
                this.markedForDeletion = true;
                return;
            }
        }

        if (this.boomerangLifetime <= 0 || Math.abs(this.x - game.player.x) > 2400 || this.y > game.lowestY + 320 || this.y < -1200) {
            this.markedForDeletion = true;
        }
    }

    _updateWeb(dt, game) {
        const prevBottom = this.y + this.height;

        if (this.webState === 'SLIDING') {
            this.x += this.vx * dt;
            this.y = this.webPlatform.y - this.height;
            this.vy = 0;
        } else {
            this.vy += Physics.GRAVITY * dt;
            if (this.vy > Physics.TERMINAL_VELOCITY) this.vy = Physics.TERMINAL_VELOCITY;
            this.x += this.vx * dt;
            this.y += this.vy * dt;
        }

        this.rotation += (this.vx > 0 ? 6 : -6) * dt;
        if (this.markedForDeletion) return;

        // Player collision
        if (game.player.invulnerableTimer <= 0 && Physics.checkAABB(this, game.player.getHitbox())) {
            game.player.takeDamage(game);
            game.audio.playHit();
            game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
            game.player.stunTimer = Math.max(game.player.stunTimer, 0.5);
            this.markedForDeletion = true;
            return;
        }

        if (this.webState === 'AIRBORNE') {
            const platforms = game._visiblePlatforms;
            for (let i = 0; i < platforms.length; i++) {
                const p = platforms[i];
                const overlapsX = this.x + this.width > p.x && this.x < p.x + p.width;
                const crossedTop = prevBottom <= p.y && this.y + this.height >= p.y;
                if (this.vy >= 0 && overlapsX && crossedTop) {
                    this.webState = 'SLIDING';
                    this.webPlatform = p;
                    this.y = p.y - this.height;
                    this.vy = 0;
                    break;
                }
            }
        }

        if (this.webState === 'SLIDING') {
            const p = this.webPlatform;
            const stillOnSurface = p && this.x + this.width > p.x && this.x < p.x + p.width;
            if (!stillOnSurface) {
                this.webState = 'FALLING';
                this.webPlatform = null;
                this.webFallStartY = this.y;
                this.webFallTimer = 0;
            }
        } else if (this.webState === 'FALLING') {
            this.webFallTimer += dt;
            const fallenDistance = this.y - this.webFallStartY;
            if (fallenDistance >= this.webFallDespawnDistance || this.webFallTimer >= this.webFallMaxTime) {
                this.markedForDeletion = true;
            }
        }

        // Keep airborne webs bounded vertically if they never land.
        if (this.webState === 'AIRBORNE' && this.y > game.lowestY) {
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
