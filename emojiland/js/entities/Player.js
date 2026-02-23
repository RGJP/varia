import { Entity } from './Entity.js';
import { Physics } from '../Physics.js';
import { Rock } from './Rock.js';
import { Bomb } from './Bomb.js';
import { getEmojiCanvas } from '../EmojiCache.js';

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 64, 64);
        this.speed = 300;
        this.jumpForce = -600;
        this.facingRight = true;
        this.grounded = false;

        this.maxHealth = 5;
        this.health = this.maxHealth;
        this.bombs = 3;
        this.invulnerableTimer = 0;
        this.knockbackTimer = 0;
        this.stunTimer = 0;
        this.slowTimer = 0;

        this.attackTimer = 0;
        this.isAttacking = false;
        this.attackDuration = 0.05; // 50ms

        this.coyoteTime = 0.1;
        this.coyoteTimer = 0;
        this.jumpBufferTime = 0.1;
        this.jumpBufferTimer = 0;
        this.isJumping = false;

        this.isClimbing = false;
        this.currentVine = null;
        this.ignoreVineTimer = 0;
        this.vineClimbDist = 0; // distance along swinging vine rope from pivot

        this.airJumps = 1;

        this.score = 0;
        this.rotation = 0;
        this.isSpinning = false;
        this.spinDirection = 1;
        this.spinBaseRotation = 0;

        this.diamondPowerUpTimer = 0;
        this.diamondShootTimer = 0;

        this.firePowerUpTimer = 0;
        this.firePowerUpRotation = 0;
        this.pulseTimer = 0;
        this.attackChargeTimer = 0;
        this.maxAttackChargeTime = 1.5;
        this.chargeIndicatorDelay = 0.14;
        this.isChargingAttack = false;

        const icons = [
            "🚶‍➡️",
            "🚶‍♀️‍➡️",
            "💃",
            "🕺",
            "🧑‍🦼‍➡️",
            "🧑‍🦯‍➡️",
            "🧎‍➡️",
            "🧎‍♀️‍➡️",
            "🧎‍♂️‍➡️"
        ];
        this.emoji = icons[Math.floor(Math.random() * icons.length)];
        // Pre-cache the emoji
        this._cachedEmoji = getEmojiCanvas(this.emoji, 64);

        this._hitbox = { x: 0, y: 0, width: 0, height: 0 };
        this._updateHitbox();
        this._fireboxes = [];
        for (let i = 0; i < 3; i++) {
            this._fireboxes.push({ x: 0, y: 0, width: 30, height: 30 });
        }
    }

    update(dt, input, platforms, game) {
        // Timers
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= dt;
        }
        this._updateHitbox();
        if (this.knockbackTimer > 0) {
            this.knockbackTimer -= dt;
        }
        if (this.stunTimer > 0) {
            this.stunTimer -= dt;
        }
        if (this.slowTimer > 0) {
            this.slowTimer -= dt;
        }
        if (this.ignoreVineTimer > 0) {
            this.ignoreVineTimer -= dt;
        }

        if (this.grounded) {
            this.coyoteTimer = this.coyoteTime;
            this.airJumps = 1;
        } else {
            this.coyoteTimer -= dt;
        }

        if (input.isJustPressed('KeyA')) {
            this.jumpBufferTimer = this.jumpBufferTime;
        } else {
            this.jumpBufferTimer -= dt;
        }

        if (this.isAttacking) {
            this.attackTimer -= dt;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
            }
        }

        if (this.diamondPowerUpTimer > 0) {
            this.diamondPowerUpTimer -= dt;
            this.diamondShootTimer -= dt;
            if (this.diamondShootTimer <= 0) {
                this.diamondShootTimer = 0.08; // Fast auto fire
                const throwX = this.facingRight ? this.x + this.width : this.x - 20;
                const rock = new Rock(throwX, this.y + this.height / 2 - 10, this.facingRight);
                game.rocks.push(rock);
                if (game.audio) game.audio.playThrow();
            }
        }

        if (this.firePowerUpTimer > 0) {
            this.firePowerUpTimer -= dt;
            this.firePowerUpRotation += (Math.PI * 4) * dt; // Fast spin
        }

        this.pulseTimer += dt;

        // Input
        // Drop Bomb
        if (!game.gameOverTriggered && this.stunTimer <= 0 && input.isJustPressed('KeyS')) {
            if (this.bombs > 0) {
                this.bombs--;
                const bombX = this.x + this.width / 2 - 12; // Center bomb
                const bombY = this.y + this.height - 12;
                const bomb = new Bomb(bombX, bombY);
                game.rocks.push(bomb);
                if (game.audio) game.audio.playThrow();
            }
        }

        // Attack charge and release
        const canChargeAttack = !game.gameOverTriggered && this.stunTimer <= 0 && !this.isClimbing;
        if (!canChargeAttack) {
            this.attackChargeTimer = 0;
            this.isChargingAttack = false;
        } else {
            if (input.isDown('KeyD')) {
                this.isChargingAttack = true;
                this.attackChargeTimer = Math.min(this.maxAttackChargeTime, this.attackChargeTimer + dt);
            }
            if (input.isJustReleased('KeyD') && this.isChargingAttack) {
                this.isAttacking = true;
                this.attackTimer = this.attackDuration;

                const fullyCharged = this.attackChargeTimer >= this.maxAttackChargeTime;
                const sizeMultiplier = fullyCharged ? 3 : 1;
                const rockSize = 20 * sizeMultiplier;
                const throwX = this.facingRight ? this.x + this.width : this.x - rockSize;
                const throwY = this.y + this.height / 2 - rockSize / 2;

                const rock = new Rock(throwX, throwY, this.facingRight, {
                    sizeMultiplier,
                    damage: fullyCharged ? 5 : 1,
                    phaseThroughSurfaces: fullyCharged
                });
                game.rocks.push(rock);
                if (game.audio) game.audio.playThrow();

                this.attackChargeTimer = 0;
                this.isChargingAttack = false;
            }
        }

        // Vine Collision Logic
        if (!this.isClimbing && this.ignoreVineTimer <= 0 && this.knockbackTimer <= 0) {
            // Check static vines
            if (game.vines) {
                for (let vine of game.vines) {
                    if (Physics.checkAABB(this, vine)) {
                        this.isClimbing = true;
                        this.currentVine = vine;
                        this.vx = 0;
                        this.vy = 0;
                        this.x = vine.x + vine.width / 2 - this.width / 2;
                        this.jumpBufferTimer = 0;
                        this.coyoteTimer = 0;
                        this.airJumps = 1;
                        break;
                    }
                }
            }
            // Check swinging vines
            if (!this.isClimbing && game.swingingVines) {
                for (let sv of game.swingingVines) {
                    if (sv.checkCollision(this)) {
                        this.isClimbing = true;
                        this.currentVine = sv;
                        this.vx = 0;
                        this.vy = 0;
                        // Compute how far along the rope the player grabbed on
                        const pivotY = sv.anchorY + sv.anchorHeight;
                        const playerCenterY = this.y + this.height / 2;
                        // Approximate distance along rope from the player's Y
                        const cosA = Math.cos(sv.currentAngle);
                        this.vineClimbDist = Math.max(0, Math.min(sv.ropeLength, (playerCenterY - pivotY) / (cosA || 1)));
                        // Snap position immediately
                        const pivotX = sv.anchorX;
                        this.x = pivotX - Math.sin(sv.currentAngle) * this.vineClimbDist - this.width / 2;
                        this.y = pivotY + Math.cos(sv.currentAngle) * this.vineClimbDist - this.height / 2;
                        this.jumpBufferTimer = 0;
                        this.coyoteTimer = 0;
                        this.airJumps = 1;
                        break;
                    }
                }
            }
        }

        // Movement
        if (this.knockbackTimer > 0) {
            // Apply standard friction during knockback so player slides a bit from the hit
            if (this.vx > 0) {
                this.vx -= Physics.FRICTION * dt;
                if (this.vx < 0) this.vx = 0;
            } else if (this.vx < 0) {
                this.vx += Physics.FRICTION * dt;
                if (this.vx > 0) this.vx = 0;
            }
        } else if (this.stunTimer > 0) {
            if (this.grounded) {
                this.vx = 0;
            }
        } else if (!this.isClimbing && !game.gameOverTriggered) {
            const effectiveSpeed = this.slowTimer > 0 ? this.speed * 0.4 : this.speed;
            if (input.isDown('ArrowLeft')) {
                this.vx = -effectiveSpeed;
                this.facingRight = false;
            } else if (input.isDown('ArrowRight')) {
                this.vx = effectiveSpeed;
                this.facingRight = true;
            } else {
                // Instant stop when no input is pressed, preventing sliding and feeling snappy
                this.vx = 0;
            }
        }

        // Jump
        if (!game.gameOverTriggered && this.stunTimer <= 0 && this.jumpBufferTimer > 0 && !this.isClimbing) {
            if (this.coyoteTimer > 0) {
                this.vy = this.jumpForce;
                this.grounded = false;
                this.isJumping = true;
                this.isSpinning = true;
                this.spinDirection = this.facingRight ? 1 : -1;
                this.spinBaseRotation = this.rotation;
                this.jumpBufferTimer = 0;
                this.coyoteTimer = 0;
                game.audio.playJump();
                game.particles.emitJump(this.x + this.width / 2, this.y + this.height, game.currentTheme.particleColor);
            } else if (this.airJumps > 0) {
                this.vy = this.jumpForce;
                this.grounded = false;
                this.isJumping = true;
                this.isSpinning = true;
                this.spinDirection = this.facingRight ? 1 : -1;
                this.spinBaseRotation = this.rotation;
                this.jumpBufferTimer = 0;
                this.airJumps--;
                game.audio.playJump();
                game.particles.emitJump(this.x + this.width / 2, this.y + this.height, game.currentTheme.particleColor);
            }
        }

        // Variable Jump Height
        if (!input.isDown('KeyA') && this.isJumping && this.vy < 0 && !this.isClimbing) {
            this.vy *= 0.5; // Cut jump short
            this.isJumping = false;
        }

        if (!this.grounded && !this.isClimbing && this.isSpinning) {
            const spinSpeed = this.isJumping ? Math.PI * 4 : Math.PI * 2.4; // slower rotation for cut-short jumps
            let increment = spinSpeed * dt;
            let currentDir = this.facingRight ? 1 : -1;

            this.rotation += currentDir * increment;

            let maxRelativeRotation = Math.PI * 2;
            if (!this.isJumping && Math.abs(this.rotation - this.spinBaseRotation) > maxRelativeRotation) {
                this.rotation = this.spinBaseRotation + maxRelativeRotation * Math.sign(this.rotation - this.spinBaseRotation);
            }
        } else {
            this.rotation = 0;
            if (this.grounded || this.isClimbing) {
                this.isSpinning = false;
            }
        }

        if (this.isClimbing) {
            this.grounded = false;
            this.vy = 0;
            this.vx = 0;

            const isSwinging = this.currentVine && typeof this.currentVine.getVineCenterXAtY === 'function';

            // For swinging vines: position player directly from angle + distance
            if (isSwinging) {
                const sv = this.currentVine;
                const pivotX = sv.anchorX;
                const pivotY = sv.anchorY + sv.anchorHeight;

                // Climb up/down adjusts distance along the rope
                if (input.isDown('ArrowUp')) {
                    this.vineClimbDist -= 200 * dt;
                } else if (input.isDown('ArrowDown')) {
                    this.vineClimbDist += 200 * dt;
                }

                // Clamp to rope length
                if (this.vineClimbDist < this.height * 0.3) {
                    this.vineClimbDist = this.height * 0.3;
                }
                if (this.vineClimbDist > sv.ropeLength - this.height * 0.3) {
                    this.vineClimbDist = sv.ropeLength - this.height * 0.3;
                }

                // Compute exact position from the vine's current angle
                this.x = pivotX - Math.sin(sv.currentAngle) * this.vineClimbDist - this.width / 2;
                this.y = pivotY + Math.cos(sv.currentAngle) * this.vineClimbDist - this.height / 2;

                // Allow changing facing direction while on vine
                if (input.isDown('ArrowLeft')) {
                    this.facingRight = false;
                } else if (input.isDown('ArrowRight')) {
                    this.facingRight = true;
                }
            } else {
                // Static vine: original logic
                if (input.isDown('ArrowUp')) {
                    this.vy = -200;
                } else if (input.isDown('ArrowDown')) {
                    this.vy = 200;
                }

                this.y += this.vy * dt;

                // Allow changing facing direction while on vine
                if (input.isDown('ArrowLeft')) {
                    this.facingRight = false;
                } else if (input.isDown('ArrowRight')) {
                    this.facingRight = true;
                }

                if (this.y < this.currentVine.y - this.height * 0.5) {
                    this.y = this.currentVine.y - this.height * 0.5;
                }
                if (this.y > this.currentVine.y + this.currentVine.height - this.height) {
                    this.y = this.currentVine.y + this.currentVine.height - this.height;
                }
            }

            // Jump off the vine
            if (this.jumpBufferTimer > 0) {
                this.isClimbing = false;
                this.currentVine = null;
                this.vy = this.jumpForce;
                this.ignoreVineTimer = 0.3; // Prevent re-sticking
                this.isJumping = true;
                this.isSpinning = true;
                this.spinDirection = this.facingRight ? 1 : -1;
                this.spinBaseRotation = this.rotation;
                this.jumpBufferTimer = 0;
                game.audio.playJump();
                game.particles.emitJump(this.x + this.width / 2, this.y + this.height, game.currentTheme.particleColor);
            }
        } else {
            // Carry player on moving platforms BEFORE collision resolution
            // This prevents vertical movers from causing X-axis collision artifacts
            for (let platform of platforms) {
                if (platform.isMovingPlatform) {
                    const oldPlatformY = platform.y - platform.dy;
                    const tolerance = 4 + Math.abs(platform.dy);
                    if (Math.abs((this.y + this.height) - oldPlatformY) <= tolerance &&
                        this.x + this.width > platform.x && this.x < platform.x + platform.width) {

                        if (this.grounded) {
                            this.x += platform.dx;
                            this.y = platform.y - this.height - 0.01; // tiny offset prevents X-collision float snag
                            break;
                        }
                    }
                }
            }

            // Gravity
            this.vy += Physics.GRAVITY * dt;
            if (this.vy > Physics.TERMINAL_VELOCITY) {
                this.vy = Physics.TERMINAL_VELOCITY;
            }

            // X Collision
            this.x += this.vx * dt;

            // Invisible wall at the start of the level to prevent walking off-screen
            if (this.x < 0) {
                this.x = 0;
                this.vx = 0;
            }

            this.resolveCollision(platforms, 'x');

            // Y Collision
            this.y += this.vy * dt;
            this.grounded = false;
            this.resolveCollision(platforms, 'y');
        }

        // Enemy Collision logic
        if (this.invulnerableTimer <= 0) {
            const hitbox = this._hitbox;

            const fireboxes = this._fireboxes;
            let numFireballsActive = 0;
            if (this.firePowerUpTimer > 0) {
                if (this.firePowerUpTimer > 2.0) {
                    numFireballsActive = 3;
                } else if (this.firePowerUpTimer > 1.0) {
                    numFireballsActive = 2;
                } else {
                    numFireballsActive = 1;
                }
                const radius = 50;
                for (let i = 0; i < numFireballsActive; i++) {
                    const angle = this.firePowerUpRotation + (i * Math.PI * 2 / numFireballsActive);
                    const fx = this.x + this.width / 2 + Math.cos(angle) * radius;
                    const fy = this.y + this.height / 2 + Math.sin(angle) * radius + 5;
                    fireboxes[i].x = fx - 15;
                    fireboxes[i].y = fy - 15;
                }
            }

            game.enemies.forEach(enemy => {
                if (enemy.markedForDeletion) return;

                let hitByFireball = false;
                for (let i = 0; i < numFireballsActive; i++) {
                    if (Physics.checkAABB(fireboxes[i], enemy)) {
                        hitByFireball = true;
                        break;
                    }
                }

                if (hitByFireball || (Physics.checkAABB(hitbox, enemy) && this.firePowerUpTimer > 0)) {
                    // Fire power up insta-kills or damages enemies
                    if (enemy.takeDamage) {
                        enemy.takeDamage(enemy.health, game);
                    } else {
                        enemy.markedForDeletion = true;
                        if (game.audio) game.audio.playHit();
                        if (game.particles) game.particles.emitHit(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#FF4500');
                    }
                } else if (Physics.checkAABB(hitbox, enemy)) {
                    const stompableEmojis = ['🐢', '🐸', '🐦', '🦅', '🦉', '🐦‍⬛', '🦇', '🧟‍♂️', '🦑', '🦗', '🐿️', '🕷️'];
                    if (stompableEmojis.includes(enemy.emoji) && this.vy > 0 && hitbox.y + hitbox.height - (this.vy * dt) <= enemy.y + enemy.height * 0.5) {
                        enemy.takeDamage(enemy.health, game);
                        this.vy = this.jumpForce;
                        this.grounded = false;
                        this.isJumping = true;
                        this.isSpinning = true;
                        this.spinDirection = this.facingRight ? 1 : -1;
                        this.spinBaseRotation = this.rotation;
                        if (game.audio) game.audio.playJump();
                    } else {
                        this.takeDamage(game);
                    }
                }
            });
        }

        // Collectibles
        game.collectibles.forEach(collectible => {
            if (!collectible.markedForDeletion && Physics.checkAABB(this, collectible)) {
                collectible.markedForDeletion = true;
                const centerX = collectible.x + collectible.width / 2;
                const centerY = collectible.y + collectible.height / 2;
                if (collectible.type === 'health') {
                    this.health = Math.min(this.health + 1, this.maxHealth);
                    game.audio.playCollect();
                    game.particles.emit(centerX, centerY, 15, '#FF0000', [50, 150], [0.2, 0.5], [2, 4]);
                } else if (collectible.type === 'bomb') {
                    this.bombs += 1;
                    if (game.audio) game.audio.playCollect();
                    game.particles.emit(centerX, centerY, 15, '#444444', [50, 150], [0.2, 0.5], [2, 4]);
                } else if (collectible.type === 'diamond_powerup') {
                    this.diamondPowerUpTimer = 5.0;
                    if (game.audio) game.audio.playCollect();
                    game.particles.emit(centerX, centerY, 20, '#888888', [50, 200], [0.2, 0.5], [3, 5]);
                } else if (collectible.type === 'full_health') {
                    this.health = this.maxHealth;
                    if (game.audio) game.audio.playCollect();
                    game.particles.emit(centerX, centerY, 30, '#FF69B4', [50, 250], [0.2, 0.6], [3, 6]);
                } else if (collectible.type === 'fire_powerup') {
                    this.firePowerUpTimer = 8.0;
                    if (game.audio) game.audio.playCollect();
                    game.particles.emit(centerX, centerY, 20, '#FF4500', [50, 200], [0.2, 0.5], [3, 5]);
                } else {
                    this.score += 10;
                    game.coinsCollected++;
                    game.audio.playCollect();
                    game.particles.emit(centerX, centerY, 10, '#FFFF00', [50, 150], [0.2, 0.5], [2, 4]);
                }
            }
        });

        // Victory state
        game.platforms.forEach(platform => {
            if (platform.isVictory) {
                const flagBox = platform.getFlagBox();
                if (Physics.checkAABB(this, platform) || (flagBox && Physics.checkAABB(this, flagBox))) {
                    if (game.canTriggerVictory()) {
                        game.triggerVictory();
                    }
                }
            }
        });
    }

    resolveCollision(platforms, axis) {
        for (let platform of platforms) {
            if (Physics.checkAABB(this, platform)) {
                if (axis === 'x') {
                    // Check if we are really "beside" the platform. 
                    // If the Y overlap is tiny, it's likely a corner snag from a jump/fall, so skip X resolution.
                    const overlapY = Math.min(this.y + this.height, platform.y + platform.height) - Math.max(this.y, platform.y);
                    if (overlapY < 12) continue;

                    if (this.vx > 0) {
                        this.x = platform.x - this.width;
                        this.vx = 0;
                    } else if (this.vx < 0) {
                        this.x = platform.x + platform.width;
                        this.vx = 0;
                    } else if (platform.isMovingPlatform && platform.dx !== 0) {
                        // If platform moves into player while they are still
                        if (platform.dx > 0) this.x = platform.x + platform.width;
                        else if (platform.dx < 0) this.x = platform.x - this.width;
                    }
                } else if (axis === 'y') {
                    // Similar check for X overlap to prevent side/corner snags
                    const overlapX = Math.min(this.x + this.width, platform.x + platform.width) - Math.max(this.x, platform.x);
                    if (overlapX < 8) continue;

                    // Extra corner-snag protection when moving upward:
                    // If the player barely clips the corner of a platform while jumping,
                    // skip the Y resolution entirely to avoid being pushed below.
                    if (this.vy < 0 && overlapX < this.width * 0.25) continue;

                    if (this.vy > 0) {
                        this.y = platform.y - this.height;
                        this.grounded = true;
                    } else if (this.vy < 0) {
                        // If platform is a MovingPlatform, push player to top instead of bumping head
                        if (platform.isMovingPlatform) {
                            this.y = platform.y - this.height;
                            this.grounded = true;
                        } else {
                            this.y = platform.y + platform.height;
                        }
                    } else if (platform.isMovingPlatform) {
                        // vy is 0, but we collided. A moving platform hit us.
                        // If it's hitting us while moving down, push us to the top.
                        if (platform.dy > 0) {
                            this.y = platform.y - this.height;
                            this.grounded = true;
                        } else if (platform.dy < 0) {
                            // Hit from below while moving up? Push us UP to the top.
                            this.y = platform.y - this.height;
                            this.grounded = true;
                        }
                    }
                    this.vy = 0;
                }
            }
        }
    }

    _updateHitbox() {
        this._hitbox.x = this.x + 8;
        this._hitbox.y = this.y + 8;
        this._hitbox.width = this.width - 16;
        this._hitbox.height = this.height - 8;
    }

    getHitbox() {
        return this._hitbox;
    }

    takeDamage(game) {
        if (this.firePowerUpTimer > 0) return;
        this.health -= 1;
        this.invulnerableTimer = 1.0;
        this.knockbackTimer = 0.2; // brief loss of control for noticeable knockback

        this.vy = -300;
        this.vx = this.facingRight ? -200 : 200;

        if (game) {
            game.audio.playHurt();
            game.particles.emitExplosion(this.x + this.width / 2, this.y + this.height / 2, 'red');
            game.hitStopTimer = 0.2;
        }
    }

    draw(ctx, game) {
        if (!game?.gameOverTriggered && this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 20) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        ctx.save();

        if (this.health === 1 && (!game || !game.gameOverTriggered)) {
            const pulse = (Math.sin(this.pulseTimer * 12) + 1) / 2;
            ctx.shadowBlur = 25 * pulse;
            ctx.shadowColor = `rgba(255, 0, 0, ${pulse})`;
        }

        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        if (this.rotation !== 0 && (!game || !game.gameOverTriggered)) {
            ctx.rotate(this.rotation);
        }

        if (!this.facingRight && (!game || !game.gameOverTriggered)) {
            ctx.scale(-1, 1);
        }

        let cached = this._cachedEmoji;
        let yOffset = 5;

        if (game && game.gameOverTriggered) {
            if (!this._deathTombstoneCache) {
                this._deathTombstoneCache = getEmojiCanvas('🪦', 64);
            }
            cached = this._deathTombstoneCache;
            yOffset = 0;

            // Visual feedback for "turning" into a tombstone
            const progress = Math.max(0, Math.min(1, (1.0 - game.gameOverTimer) / 1.0));
            ctx.scale(1 + progress * 0.1, 1 + progress * 0.1);
        }

        ctx.drawImage(cached.canvas, -cached.width / 2, -cached.height / 2 + yOffset);

        if (this.stunTimer > 0 && (!game || !game.gameOverTriggered)) {
            if (!this._stunEmoji) {
                this._stunEmoji = getEmojiCanvas('😵‍💫', 40);
            }
            ctx.save();
            if (!this.facingRight) ctx.scale(-1, 1);
            if (this.rotation !== 0) ctx.rotate(-this.rotation);
            const shakeX = (Math.random() - 0.5) * 8;
            const shakeY = (Math.random() - 0.5) * 8;
            ctx.drawImage(this._stunEmoji.canvas, -this._stunEmoji.width / 2 + shakeX, -this.height / 2 - 65 + shakeY);
            ctx.restore();
        }

        if (this.firePowerUpTimer > 0) {
            if (!this._fireEmoji) {
                this._fireEmoji = getEmojiCanvas('🔥', 30);
            }
            let numFireballs = 3;
            if (this.firePowerUpTimer <= 1.0) {
                numFireballs = 1;
            } else if (this.firePowerUpTimer <= 2.0) {
                numFireballs = 2;
            }
            const radius = 50;
            // Un-flip if we flipped for player facing direction so fireballs spin normally
            if (!this.facingRight) {
                ctx.scale(-1, 1);
            }
            if (this.rotation !== 0) {
                ctx.rotate(-this.rotation); // un-rotate player rotation
            }
            for (let i = 0; i < numFireballs; i++) {
                const angle = this.firePowerUpRotation + (i * Math.PI * 2 / numFireballs);
                const ox = Math.cos(angle) * radius - this._fireEmoji.width / 2;
                const oy = Math.sin(angle) * radius - this._fireEmoji.height / 2 + 5;
                ctx.drawImage(this._fireEmoji.canvas, ox, oy);
            }
        }

        ctx.restore();

        if (!game?.gameOverTriggered && this.isChargingAttack && this.attackChargeTimer > this.chargeIndicatorDelay) {
            const chargeRatio = Math.max(0, Math.min(1, this.attackChargeTimer / this.maxAttackChargeTime));
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;

            ctx.save();
            ctx.strokeStyle = chargeRatio >= 1 ? '#ffd700' : '#ff9800';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.45 + chargeRatio * 0.4;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 38 + chargeRatio * 16, 0, Math.PI * 2);
            ctx.stroke();

            const barW = 70;
            const barH = 8;
            const barX = centerX - barW / 2;
            const barY = this.y - 16;
            ctx.globalAlpha = 0.9;
            ctx.fillStyle = 'rgba(0,0,0,0.45)';
            ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
            ctx.fillStyle = chargeRatio >= 1 ? '#ffd700' : '#ff9800';
            ctx.fillRect(barX, barY, barW * chargeRatio, barH);
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barW, barH);
            ctx.restore();
        }

        ctx.globalAlpha = 1.0;
    }
}
