import { Entity } from './Entity.js';
import { Physics } from '../Physics.js';
import { Rock } from './Rock.js';
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
        this.invulnerableTimer = 0;
        this.knockbackTimer = 0;

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

        this.airJumps = 1;

        this.score = 0;

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
    }

    update(dt, input, platforms, game) {
        // Timers
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= dt;
        }
        if (this.knockbackTimer > 0) {
            this.knockbackTimer -= dt;
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

        // Input
        // Attack
        if (input.isJustPressed('KeyD') && !this.isAttacking) {
            this.isAttacking = true;
            this.attackTimer = this.attackDuration;
            const throwX = this.facingRight ? this.x + this.width : this.x - 20;
            const rock = new Rock(throwX, this.y + this.height / 2 - 10, this.facingRight);
            game.rocks.push(rock);
            game.audio.playThrow();
        }

        // Vine Collision Logic
        if (!this.isClimbing && this.ignoreVineTimer <= 0 && game.vines) {
            for (let vine of game.vines) {
                // If the player overlaps a vine and we aren't heavily knocked back
                if (Physics.checkAABB(this, vine) && this.knockbackTimer <= 0) {
                    this.isClimbing = true;
                    this.currentVine = vine;
                    this.vx = 0;
                    this.vy = 0;
                    // Snap to vine horizontally
                    this.x = vine.x + vine.width / 2 - this.width / 2;
                    // Prevent immediate jump again
                    this.jumpBufferTimer = 0;
                    this.coyoteTimer = 0;
                    this.airJumps = 1;
                    break;
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
        } else if (!this.isClimbing) {
            if (input.isDown('ArrowLeft')) {
                this.vx = -this.speed;
                this.facingRight = false;
            } else if (input.isDown('ArrowRight')) {
                this.vx = this.speed;
                this.facingRight = true;
            } else {
                // Instant stop when no input is pressed, preventing sliding and feeling snappy
                this.vx = 0;
            }
        }

        // Jump
        if (this.jumpBufferTimer > 0 && !this.isClimbing) {
            if (this.coyoteTimer > 0) {
                this.vy = this.jumpForce;
                this.grounded = false;
                this.isJumping = true;
                this.jumpBufferTimer = 0;
                this.coyoteTimer = 0;
                game.audio.playJump();
                game.particles.emitJump(this.x + this.width / 2, this.y + this.height, game.currentTheme.particleColor);
            } else if (this.airJumps > 0) {
                this.vy = this.jumpForce;
                this.grounded = false;
                this.isJumping = true;
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

        if (this.isClimbing) {
            this.grounded = false;
            this.vy = 0;
            this.vx = 0;

            if (input.isDown('ArrowUp')) {
                this.vy = -200;
            } else if (input.isDown('ArrowDown')) {
                this.vy = 200;
            }

            this.y += this.vy * dt;

            // Clamp vertical movement so they can't leave the vine without jumping
            if (this.y < this.currentVine.y - this.height / 2) {
                this.y = this.currentVine.y - this.height / 2;
            }
            if (this.y > this.currentVine.y + this.currentVine.height - this.height / 2) {
                this.y = this.currentVine.y + this.currentVine.height - this.height / 2;
            }

            // Jump off the vine
            if (this.jumpBufferTimer > 0) {
                this.isClimbing = false;
                this.currentVine = null;
                this.vy = this.jumpForce;
                this.ignoreVineTimer = 0.3; // Prevent re-sticking
                this.isJumping = true;
                this.jumpBufferTimer = 0;
                game.audio.playJump();
                game.particles.emitJump(this.x + this.width / 2, this.y + this.height, game.currentTheme.particleColor);
            }
        } else {
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
            const hitbox = this.getHitbox();
            game.enemies.forEach(enemy => {
                if (!enemy.markedForDeletion && Physics.checkAABB(hitbox, enemy)) {
                    this.takeDamage(game);
                }
            });
        }

        // Collectibles
        game.collectibles.forEach(collectible => {
            if (!collectible.markedForDeletion && Physics.checkAABB(this, collectible)) {
                collectible.markedForDeletion = true;
                this.score += 10;
                game.coinsCollected++;
                game.audio.playCollect();
                game.particles.emit(collectible.x + 15, collectible.y + 15, 10, '#FFFF00', [50, 150], [0.2, 0.5], [2, 4]);
            }
        });

        // Victory state
        game.platforms.forEach(platform => {
            if (platform.isVictory) {
                const flagBox = platform.getFlagBox();
                if (Physics.checkAABB(this, platform) || (flagBox && Physics.checkAABB(this, flagBox))) {
                    game.triggerVictory();
                }
            }
        });
    }

    resolveCollision(platforms, axis) {
        for (let platform of platforms) {
            if (Physics.checkAABB(this, platform)) {
                if (axis === 'x') {
                    if (this.vx > 0) {
                        this.x = platform.x - this.width;
                    } else if (this.vx < 0) {
                        this.x = platform.x + platform.width;
                    }
                    this.vx = 0;
                } else if (axis === 'y') {
                    if (this.vy > 0) {
                        this.y = platform.y - this.height;
                        this.grounded = true;
                    } else if (this.vy < 0) {
                        this.y = platform.y + platform.height;
                    }
                    this.vy = 0;
                }
            }
        }
    }

    getHitbox() {
        return {
            x: this.x + 8,
            y: this.y + 8,
            width: this.width - 16,
            height: this.height - 8
        };
    }

    takeDamage(game) {
        this.health -= 1;
        this.invulnerableTimer = 1.0;
        this.knockbackTimer = 0.2; // brief loss of control for noticeable knockback

        this.vy = -300;
        this.vx = this.facingRight ? -200 : 200;

        if (game) {
            game.audio.playHurt();
            game.particles.emitExplosion(this.x + this.width / 2, this.y + this.height / 2, 'red');
            game.camera.shake(0.2, 10);
            game.hitStopTimer = 0.2;
        }
    }

    draw(ctx) {
        if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 20) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        if (!this.facingRight) {
            ctx.scale(-1, 1);
        }

        const cached = this._cachedEmoji;
        ctx.drawImage(cached.canvas, -cached.width / 2, -cached.height / 2 + 5);
        ctx.restore();
        ctx.globalAlpha = 1.0;
    }
}
