import { Entity } from './Entity.js';
import { Physics } from '../Physics.js';
import { getEmojiCanvas } from '../EmojiCache.js';

// projectileType: 'drumstick' | 'stone' | 'skewer' | 'web' | 'wrench' | 'venom' | 'flame' | 'boomerang' | 'banana' | 'coconut' | 'egg' | 'icicle' | 'roar' | 'fossil' | 'needle' | 'scarab' | 'juggle_ball' | 'cigarette' | 'smoke_cloud'
export class BossProjectile extends Entity {
    constructor(x, y, vx, vy, projectileType) {
        super(x, y, 40, 40);
        this.vx = vx;
        this.vy = vy;
        this.projectileType = projectileType;
        this.rotation = 0;
        this.bounceCount = 0;
        this.canBounceOnPlatforms = false;
        this.rollOnLand = false;
        this.icicleRolling = false;
        this.icicleRollSpeed = 220;

        switch (projectileType) {
            case 'drumstick':
                this.emoji = String.fromCodePoint(0x1F357);
                this.maxBounces = 2;
                this.canBounceOnPlatforms = true;
                break;
            case 'stone':
                this.emoji = String.fromCodePoint(0x1F335);
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
            case 'coconut':
                this.emoji = String.fromCodePoint(0x1F965);
                this.maxBounces = 0;
                // Let coconuts land on top surfaces and roll off edges, similar to beetle scarabs.
                this.canBounceOnPlatforms = true;
                break;
            case 'egg':
                this.emoji = String.fromCodePoint(0x1F95A);
                this.maxBounces = 0;
                this.canBounceOnPlatforms = false;
                this.projectileLifetime = 2.4;
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
            case 'juggle_ball':
                this.emoji = String.fromCodePoint(0x1F534); // red ball by default (can be overridden by boss)
                this.maxBounces = 3;
                this.canBounceOnPlatforms = true;
                this.projectileLifetime = 3.4;
                break;
            case 'shockwave':
                this.emoji = String.fromCodePoint(0x1F4A8); // 💨-style wave
                this.maxBounces = 0;
                this.ignoreGravity = true;
                this.ignorePlatformTimer = 0.25;
                this.projectileLifetime = 0.85;
                this.width = 56;
                this.height = 48;
                break;
            case 'tornado':
                this.emoji = String.fromCodePoint(0x1F32A) + '\uFE0F'; // 🌪️
                this.maxBounces = 0;
                this.ignoreGravity = true;
                this.ignorePlatformTimer = 0.2;
                this.projectileLifetime = 3.0;
                this.width = 116;
                this.height = 116;
                this.tornadoShakePhase = Math.random() * Math.PI * 2;
                break;
            case 'cigarette':
                this.emoji = String.fromCodePoint(0x1F6AC); // 🚬
                this.maxBounces = 0;
                this.width = 56;
                this.height = 56;
                this.projectileLifetime = 3.8;
                this.ignorePlatformTimer = 0.06;
                this.cigaretteDetonated = false;
                this.smokeBurstCount = 1;
                this.smokeSpread = 90;
                this.smokeMaxRadius = 182;
                this.smokeDuration = 3.8;
                this.smokeWarmup = 0.18;
                this.smokeTick = 0.34;
                this.maxSmokeClouds = 6;
                break;
            case 'smoke_cloud':
                this.emoji = String.fromCodePoint(0x1F32B) + '\uFE0F'; // 🌫️
                this.maxBounces = 0;
                this.ignoreGravity = true;
                this.ignorePlatformTimer = 999;
                this.width = 72;
                this.height = 72;
                this.noDirectHit = true;
                this.smokeCenterX = x + this.width / 2;
                this.smokeGroundY = y + this.height * 0.88;
                this.smokeAge = 0;
                this.smokeDuration = 3.6;
                this.smokeStartRadius = 34;
                this.smokeMaxRadius = 170;
                this.smokeRadius = this.smokeStartRadius;
                this.smokeGrowTime = 0.42;
                this.smokeWarmupTimer = 0.18;
                this.smokeHitTimer = 0;
                this.smokeTick = 0.34;
                this.smokeDriftPhase = Math.random() * Math.PI * 2;
                this.smokePulsePhase = Math.random() * Math.PI * 2;
                break;
            default:
                this.emoji = String.fromCodePoint(0x1FAA8);
                this.maxBounces = 0;
                break;
        }

        let cacheSize = 44;
        if (this.projectileType === 'web') cacheSize = 50;
        else if (this.projectileType === 'tornado') cacheSize = 116;
        else if (this.projectileType === 'shockwave') cacheSize = 50;
        else if (this.projectileType === 'cigarette') cacheSize = 56;
        else if (this.projectileType === 'smoke_cloud') cacheSize = 74;
        this._cachedEmoji = getEmojiCanvas(this.emoji, cacheSize);
        this._platformCandidates = [];
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
        if (this.projectileType === 'smoke_cloud') {
            this._updateSmokeCloud(dt, game);
            return;
        }
        const prevY = this.y;
        if (this.camelCorkscrew) {
            this._updateCamelCorkscrew(dt);
        } else {
            if (!this.ignoreGravity) {
                // Apply gravity
                this.vy += Physics.GRAVITY * dt;
                if (this.vy > Physics.TERMINAL_VELOCITY) this.vy = Physics.TERMINAL_VELOCITY;
            }

            this.x += this.vx * dt;
            this.y += this.vy * dt;
        }
        if (this.projectileType === 'tornado') {
            this.tornadoShakePhase = (this.tornadoShakePhase || 0) + dt * 18;
            this.rotation = 0;
        } else {
            const spinSpeed = (this.projectileType === 'banana' || this.projectileType === 'coconut' || this.projectileType === 'egg' || this.projectileType === 'cigarette') ? 8 : 6;
            this.rotation += (this.vx > 0 ? spinSpeed : -spinSpeed) * dt;
        }
        if (this.ignorePlatformTimer > 0) this.ignorePlatformTimer -= dt;
        if (this.projectileType === 'banana' && this.bananaLifetime !== undefined) this.bananaLifetime -= dt;
        if (this.projectileLifetime !== undefined) this.projectileLifetime -= dt;

        if (this.markedForDeletion) return;

        // Player collision
        const playerHitbox = game.player.getHitbox();
        const hitPlayer = Physics.checkAABB(this, playerHitbox);

        // Cigarettes should not create smoke in mid-air; player contact only damages and deletes the projectile.
        if (hitPlayer && this.projectileType === 'cigarette') {
            if (game.player.invulnerableTimer <= 0) {
                game.player.takeDamage(game);
                if (game.audio) game.audio.playHit();
                if (game.particles) game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
                game.player.slowTimer = Math.max(game.player.slowTimer || 0, 0.25);
            }
            this.markedForDeletion = true;
            return;
        }

        if (!this.noDirectHit && game.player.invulnerableTimer <= 0) {
            if (hitPlayer) {
                // Tornado: no damage — immediate capture spin, then high launch.
                if (this.projectileType === 'tornado') {
                    if (typeof game.player.beginTornadoTrap === 'function') {
                        game.player.beginTornadoTrap(
                            this.x + this.width / 2,
                            this.y + this.height / 2,
                            this.width,
                            this.height
                        );
                    } else {
                        game.player.tornadoTrapTimer = Math.max(game.player.tornadoTrapTimer || 0, 0.2);
                    }
                    if (game.audio) game.audio.playHit();
                    if (game.particles) game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
                    this.markedForDeletion = true;
                    return;
                }

                game.player.takeDamage(game);
                game.audio.playHit();
                game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);

                // Shockwave: knockback + brief slow/stun (takeDamage already applies knockback).
                if (this.projectileType === 'shockwave') {
                    game.player.slowTimer = Math.max(game.player.slowTimer || 0, 0.65);
                    game.player.stunTimer = Math.max(game.player.stunTimer || 0, 0.12);
                } else if (this.projectileType === 'skewer') {
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
                } else if (this.projectileType === 'coconut') {
                    // Coconut hit: heavier impact than banana.
                    game.player.slowTimer = Math.max(game.player.slowTimer || 0, 1.0);
                    game.player.stunTimer = Math.max(game.player.stunTimer || 0, 0.22);
                } else if (this.projectileType === 'egg') {
                    // Egg bonk: light stagger.
                    game.player.slowTimer = Math.max(game.player.slowTimer || 0, 0.82);
                    game.player.stunTimer = Math.max(game.player.stunTimer || 0, 0.14);
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
                // (shockwave handled above)

                this.markedForDeletion = true;
                return;
            }
        }

        // Platform collision
        const platformQueryTop = Math.min(prevY, this.y) - 4;
        const platformQueryBottom = Math.max(prevY + this.height, this.y + this.height) + 4;
        const platforms = (game && typeof game.queryVisiblePlatformsInAABB === 'function')
            ? game.queryVisiblePlatformsInAABB(
                this.x,
                platformQueryTop,
                this.x + this.width,
                platformQueryBottom,
                this._platformCandidates
            )
            : game._visiblePlatforms;
        for (let i = 0; i < platforms.length; i++) {
            const p = platforms[i];
            if (this.ignorePlatformTimer > 0) continue;

            const aabbHit = Physics.checkAABB(this, p);
            const overlapsX = this.x + this.width > p.x && this.x < p.x + p.width;
            const prevBottom = prevY + this.height;
            const currBottom = this.y + this.height;
            const crossedTop = this.vy >= 0 && overlapsX && prevBottom <= p.y && currBottom >= p.y;
            if (!aabbHit && !crossedTop) continue;

            if (this.projectileType === 'cigarette') {
                if (crossedTop) {
                    this._detonateCigarette(game, p.y);
                } else {
                    this.markedForDeletion = true;
                }
                break;
            } else if ((this.projectileType === 'scarab' || this.projectileType === 'coconut') && crossedTop) {
                // Beetle scarabs and monkey coconuts should keep rolling on top surfaces until they fall off.
                this.y = p.y - this.height;
                this.vy = 0;
                if (Math.abs(this.vx) < 110) this.vx = this.vx >= 0 ? 110 : -110;
                break;
            } else if (this.projectileType === 'icicle' && this.rollOnLand && crossedTop) {
                // Mammoth frost shards should land, slide, and naturally fall off edges.
                const wasRolling = this.icicleRolling;
                this.y = p.y - this.height;
                this.vy = 0;
                if (!wasRolling) {
                    this.icicleRolling = true;
                    const dir = this.vx >= 0 ? 1 : -1;
                    this.vx = dir * this.icicleRollSpeed;
                    game.particles.emitHit(this.x + this.width / 2, p.y);
                } else if (Math.abs(this.vx) < this.icicleRollSpeed * 0.7) {
                    const dir = this.vx >= 0 ? 1 : -1;
                    this.vx = dir * this.icicleRollSpeed * 0.7;
                }
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

        // Cigarettes timing out in air should disappear without spawning smoke.
        if (this.projectileType === 'cigarette' && this.projectileLifetime !== undefined && this.projectileLifetime <= 0) {
            this.markedForDeletion = true;
            return;
        }

        // Off-screen cleanup
        if (Math.abs(this.x - game.player.x) > 2000 || this.y > game.lowestY || (this.projectileType === 'banana' && this.bananaLifetime <= 0) || (this.projectileLifetime !== undefined && this.projectileLifetime <= 0)) {
            this.markedForDeletion = true;
        }
    }

    _updateCamelCorkscrew(dt) {
        if (!this.camelCorkscrewAxisYInitialized) {
            this.camelCorkscrewAxisY = this.y;
            this.camelCorkscrewAxisYInitialized = true;
        }
        this.camelCorkscrewTime = (this.camelCorkscrewTime || 0) + dt;
        const amp = this.camelCorkscrewAmplitude || 30;
        const omega = this.camelCorkscrewOmega || 11.5;
        const phase = this.camelCorkscrewPhase || 0;
        const tilt = this.camelCorkscrewTilt || 0;
        this.x += this.vx * dt;
        this.camelCorkscrewAxisY += tilt * dt;
        this.y = this.camelCorkscrewAxisY + Math.sin(this.camelCorkscrewTime * omega + phase) * amp;
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
            const queryTop = Math.min(prevBottom - this.height, this.y) - 4;
            const queryBottom = Math.max(prevBottom, this.y + this.height) + 4;
            const platforms = (game && typeof game.queryVisiblePlatformsInAABB === 'function')
                ? game.queryVisiblePlatformsInAABB(
                    this.x,
                    queryTop,
                    this.x + this.width,
                    queryBottom,
                    this._platformCandidates
                )
                : game._visiblePlatforms;
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

    _updateSmokeCloud(dt, game) {
        this.smokeAge += dt;
        if (this.smokeHitTimer > 0) this.smokeHitTimer -= dt;
        if (this.smokeWarmupTimer > 0) this.smokeWarmupTimer -= dt;
        this.smokePulsePhase += dt;
        this.smokeDriftPhase += dt * 1.7;

        const growDuration = Math.max(0.0001, this.smokeGrowTime || 0.42);
        const growT = Math.max(0, Math.min(1, this.smokeAge / growDuration));
        this.smokeRadius = this.smokeStartRadius + (this.smokeMaxRadius - this.smokeStartRadius) * growT;

        // Keep the AABB roughly aligned to the smoke footprint for broad-phase culling.
        this.width = this.smokeRadius * 2;
        this.height = this.smokeRadius * 1.5;
        this.x = this.smokeCenterX - this.width / 2;
        this.y = this.smokeGroundY - this.height;

        if (game && game.player) {
            const player = game.player;
            const hitbox = player.getHitbox ? player.getHitbox() : player;
            const px = hitbox.x + hitbox.width / 2;
            const py = hitbox.y + hitbox.height * 0.7;
            const cloudCenterY = this.smokeGroundY - this.smokeRadius * 0.28;
            const dx = px - this.smokeCenterX;
            const dy = (py - cloudCenterY) / 0.72;
            const dist = Math.hypot(dx, dy);
            const insideCloud = dist < this.smokeRadius * 0.92;

            if (insideCloud) {
                player.slowTimer = Math.max(player.slowTimer || 0, 0.45);
            }

            if (insideCloud && this.smokeWarmupTimer <= 0 && this.smokeHitTimer <= 0 && player.invulnerableTimer <= 0) {
                player.takeDamage(game);
                player.stunTimer = Math.max(player.stunTimer || 0, 0.09);
                this.smokeHitTimer = this.smokeTick || 0.34;
                if (game.audio) game.audio.playHit();
                if (game.particles) game.particles.emitHit(px, py);
            }
        }

        if (this.smokeAge >= this.smokeDuration) {
            this.markedForDeletion = true;
        }
    }

    _enforceSmokeCloudBudget(game, maxClouds = 6) {
        if (!game || !Array.isArray(game.enemyProjectiles)) return;
        const activeClouds = [];
        for (let i = 0; i < game.enemyProjectiles.length; i++) {
            const p = game.enemyProjectiles[i];
            if (!p || p.markedForDeletion || p.projectileType !== 'smoke_cloud') continue;
            activeClouds.push(p);
        }
        if (activeClouds.length < maxClouds) return;

        // Keep newest clouds and despawn the oldest ones first.
        activeClouds.sort((a, b) => (b.smokeAge || 0) - (a.smokeAge || 0));
        const removeCount = activeClouds.length - maxClouds + 1;
        for (let i = 0; i < removeCount; i++) {
            activeClouds[i].markedForDeletion = true;
        }
    }

    _spawnSmokeCloud(game, centerX, groundY, options = {}) {
        if (!game || !Array.isArray(game.enemyProjectiles)) return;
        const radius = Math.max(70, options.radius || this.smokeMaxRadius || 170);
        const maxClouds = Math.max(1, options.maxClouds || this.maxSmokeClouds || 6);
        this._enforceSmokeCloudBudget(game, maxClouds);

        const size = Math.max(68, Math.round(radius * 0.62));
        const cloud = new BossProjectile(centerX - size / 2, groundY - size * 0.92, 0, 0, 'smoke_cloud');
        cloud.smokeCenterX = centerX;
        cloud.smokeGroundY = groundY;
        cloud.smokeDuration = Math.max(1.4, options.duration || this.smokeDuration || 3.8);
        cloud.smokeStartRadius = Math.max(22, radius * 0.25);
        cloud.smokeMaxRadius = radius;
        cloud.smokeRadius = cloud.smokeStartRadius;
        cloud.smokeGrowTime = Math.max(0.16, options.growTime || 0.42);
        cloud.smokeWarmupTimer = Math.max(0, options.warmup ?? this.smokeWarmup ?? 0.18);
        cloud.smokeTick = Math.max(0.2, options.tick || this.smokeTick || 0.34);
        cloud.smokeHitTimer = 0;
        cloud.smokeAge = 0;
        cloud.smokeDriftPhase = Math.random() * Math.PI * 2;
        cloud.smokePulsePhase = Math.random() * Math.PI * 2;
        game.enemyProjectiles.push(cloud);
    }

    _detonateCigarette(game, impactY = null) {
        if (this.cigaretteDetonated) return;
        this.cigaretteDetonated = true;

        const centerX = this.x + this.width / 2;
        const groundY = impactY != null ? impactY : (this.y + this.height * 0.9);
        const burstCount = Math.max(1, Math.min(3, Math.round(this.smokeBurstCount || 1)));
        const spread = this.smokeSpread || 90;
        const baseRadius = this.smokeMaxRadius || 182;
        const maxClouds = Math.max(1, this.maxSmokeClouds || 6);

        for (let i = 0; i < burstCount; i++) {
            const lane = burstCount <= 1 ? 0 : (i - (burstCount - 1) / 2);
            const offset = lane * spread + (Math.random() - 0.5) * (burstCount <= 1 ? 14 : 24);
            const laneScale = burstCount <= 1 ? 1 : Math.max(0.76, 1 - Math.abs(lane) * 0.18);
            this._spawnSmokeCloud(game, centerX + offset, groundY, {
                radius: baseRadius * laneScale,
                duration: this.smokeDuration || 3.8,
                warmup: this.smokeWarmup || 0.18,
                tick: this.smokeTick || 0.34,
                maxClouds
            });
        }

        if (game && game.particles) {
            game.particles.emitHit(centerX, groundY - 10);
        }
        this.markedForDeletion = true;
    }

    _drawSmokeCloud(ctx) {
        const radius = this.smokeRadius || 0;
        if (radius <= 2) return;

        const cx = this.smokeCenterX != null ? this.smokeCenterX : (this.x + this.width / 2);
        const groundY = this.smokeGroundY != null ? this.smokeGroundY : (this.y + this.height);
        const cy = groundY - radius * 0.28;
        const life = Math.max(0, Math.min(1, 1 - (this.smokeAge || 0) / Math.max(0.0001, this.smokeDuration || 3.6)));
        const pulse = 0.5 + Math.sin((this.smokePulsePhase || 0) * 8 + this.smokeAge * 6.5) * 0.5;

        ctx.save();

        // Core smoke volume.
        ctx.globalAlpha = Math.max(0.08, (0.18 + pulse * 0.12) * life);
        ctx.fillStyle = '#1f3b1a';
        ctx.beginPath();
        ctx.ellipse(cx, cy + radius * 0.06, radius * 1.02, radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = Math.max(0.06, (0.16 + pulse * 0.1) * life);
        ctx.fillStyle = '#2b5a24';
        ctx.beginPath();
        ctx.ellipse(cx - radius * 0.24, cy - radius * 0.04, radius * 0.55, radius * 0.42, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + radius * 0.22, cy - radius * 0.02, radius * 0.58, radius * 0.44, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Animated wisps.
        const wispCount = 4;
        for (let i = 0; i < wispCount; i++) {
            const a = (this.smokeDriftPhase || 0) * (0.9 + i * 0.07) + i * 1.55;
            const wx = cx + Math.cos(a) * radius * 0.42;
            const wy = cy + Math.sin(a * 1.2) * radius * 0.2 - radius * 0.12;
            const wr = radius * (0.16 + (i % 2) * 0.05);
            ctx.globalAlpha = Math.max(0.05, (0.09 + pulse * 0.07) * life);
            ctx.fillStyle = '#3f7d33';
            ctx.beginPath();
            ctx.arc(wx, wy, wr, 0, Math.PI * 2);
            ctx.fill();
        }

        // Perimeter ring + warmup warning.
        if (this.smokeWarmupTimer > 0) {
            const warmupRatio = Math.max(0, Math.min(1, 1 - this.smokeWarmupTimer / Math.max(0.001, this.smokeWarmup || 0.18)));
            const warmPulse = 0.6 + Math.sin(this.smokeAge * 22) * 0.4;
            ctx.globalAlpha = (0.28 + warmPulse * 0.3) * life;
            ctx.strokeStyle = '#9ffb83';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(cx, groundY - radius * 0.05, radius * (0.82 + warmupRatio * 0.18), radius * 0.36, 0, 0, Math.PI * 2);
            ctx.stroke();
            if (!this._warnCache) this._warnCache = getEmojiCanvas(String.fromCodePoint(0x26A0) + '\uFE0F', 22);
            ctx.globalAlpha = (0.4 + warmPulse * 0.32) * life;
            ctx.drawImage(this._warnCache.canvas, cx - this._warnCache.width / 2, cy - radius * 0.92);
        } else {
            ctx.globalAlpha = (0.12 + pulse * 0.1) * life;
            ctx.strokeStyle = '#84d071';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(cx, groundY - radius * 0.05, radius * 0.84, radius * 0.34, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    draw(ctx) {
        if (this.projectileType === 'smoke_cloud') {
            this._drawSmokeCloud(ctx);
            return;
        }

        ctx.save();
        let drawX = this.x + this.width / 2;
        let drawY = this.y + this.height / 2;
        if (this.projectileType === 'tornado') {
            const phase = this.tornadoShakePhase || 0;
            drawX += Math.sin(phase * 1.35) * 4.5;
            drawY += Math.sin(phase * 2.05 + 0.7) * 2.2;
        }
        ctx.translate(drawX, drawY);
        const cached = this._cachedEmoji;
        if (this.camelGroundSpike) {
            const total = Math.max(0.001, this.camelGroundSpikeLifetime || 3.0);
            const elapsed = total - Math.max(0, this.projectileLifetime || 0);
            const riseIn = Math.max(0, Math.min(1, elapsed / 0.24));
            const settleOut = Math.max(0, Math.min(1, (Math.max(0, (this.projectileLifetime || 0) - 0.2)) / 0.2));
            const scaleY = Math.max(0.05, riseIn * settleOut);
            ctx.scale(1, scaleY);
            ctx.translate(0, (1 - scaleY) * (cached.height * 0.5));
        } else if (this.projectileType !== 'tornado') {
            ctx.rotate(this.rotation);
        }
        ctx.drawImage(cached.canvas, -cached.width / 2, -cached.height / 2);
        ctx.restore();
    }
}
