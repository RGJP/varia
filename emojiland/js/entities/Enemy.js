import { Entity } from './Entity.js';
import { Physics } from '../Physics.js';
import { Bone } from './Bone.js';
import { Fireball } from './Fireball.js';
import { getEmojiCanvas } from '../EmojiCache.js';

const TYPE_PATROL = 'patrol';
const TYPE_CHASER = 'chaser'; // 👹
const TYPE_JUMPER = 'jumper'; // 🐸
const TYPE_SHOOTER = 'shooter'; // 🧙‍♂️
const TYPE_FLYER = 'flyer'; // 🦇

const TYPE_GHOST = 'ghost'; // 👻
const TYPE_ZOMBIE = 'zombie'; // 🧟‍♂️
const TYPE_DINO = 'dino'; // 🦕
const TYPE_SQUID = 'squid'; // 🦑
const TYPE_CRAB = 'crab'; // 🦀
const TYPE_BIRD = 'bird'; // 🐦
const TYPE_EAGLE = 'eagle'; // 🦅
const TYPE_OWL = 'owl'; // 🦉
const TYPE_CROW = 'crow'; // 🐦‍⬛

export class Enemy extends Entity {
    constructor(x, y, platform) {
        const rand = Math.random();
        let type, width, height, emoji, baseSpeed, health;

        if (rand < 0.08) {
            type = TYPE_PATROL; width = 40; height = 40; emoji = '🐢'; baseSpeed = 50; health = 2;
        } else if (rand < 0.16) {
            type = TYPE_CHASER; width = 55; height = 55; emoji = '👹'; baseSpeed = 100; health = 4;
        } else if (rand < 0.24) {
            type = TYPE_JUMPER; width = 35; height = 35; emoji = '🐸'; baseSpeed = 80; health = 2;
        } else if (rand < 0.32) {
            type = TYPE_SHOOTER; width = 45; height = 55; emoji = '🧙‍♂️'; baseSpeed = 40; health = 3;
        } else if (rand < 0.40) {
            type = TYPE_FLYER; width = 35; height = 35; emoji = '🦇'; baseSpeed = 100; health = 1;
        } else if (rand < 0.45) {
            type = TYPE_BIRD; width = 30; height = 30; emoji = '🐦'; baseSpeed = 140; health = 1;
        } else if (rand < 0.50) {
            type = TYPE_EAGLE; width = 40; height = 40; emoji = '🦅'; baseSpeed = 90; health = 2;
        } else if (rand < 0.55) {
            type = TYPE_OWL; width = 40; height = 40; emoji = '🦉'; baseSpeed = 90; health = 2;
        } else if (rand < 0.60) {
            type = TYPE_CROW; width = 35; height = 35; emoji = '🐦‍⬛'; baseSpeed = 120; health = 1;
        } else if (rand < 0.68) {
            type = TYPE_GHOST; width = 45; height = 45; emoji = '👻'; baseSpeed = 40; health = 2;
        } else if (rand < 0.76) {
            type = TYPE_ZOMBIE; width = 40; height = 50; emoji = '🧟‍♂️'; baseSpeed = 30; health = 3;
        } else if (rand < 0.84) {
            type = TYPE_DINO; width = 70; height = 70; emoji = '🦕'; baseSpeed = 60; health = 5;
        } else if (rand < 0.92) {
            type = TYPE_SQUID; width = 45; height = 45; emoji = '🦑'; baseSpeed = 90; health = 2;
        } else {
            type = TYPE_CRAB; width = 35; height = 35; emoji = '🦀'; baseSpeed = 220; health = 2;
        }

        let actualY = platform.y - height;
        if (type === TYPE_FLYER || type === TYPE_SQUID || type === TYPE_BIRD || type === TYPE_EAGLE || type === TYPE_OWL || type === TYPE_CROW) {
            actualY -= 140 + Math.random() * 50;
        } else if (type === TYPE_GHOST || type === TYPE_SHOOTER) {
            actualY -= 60 + Math.random() * 80;
        }

        super(x, actualY, width, height);
        this.type = type;
        this.emoji = emoji;
        this.baseSpeed = baseSpeed;
        this.speed = this.baseSpeed;
        this.health = health;
        this.maxHealth = health;

        this.platform = platform;
        this.facingRight = Math.random() > 0.5;

        this.vx = this.facingRight ? this.speed : -this.speed;
        this.vy = 0;

        this.state = 'IDLE';
        this.stateTimer = 0;

        this.startY = actualY;
        this.timeAlive = Math.random() * 100;
        this.attackCooldown = 0;

        this.revivesRemaining = (this.type === TYPE_ZOMBIE) ? 1 : 0;
        this.damageFlashTimer = 0;

        if (this.type === TYPE_PATROL) this.state = 'PATROL';
        if (this.type === TYPE_CHASER) this.state = 'PATROL';
        if (this.type === TYPE_JUMPER) this.state = 'PATROL';
        if (this.type === TYPE_SHOOTER) this.state = 'HOVER';
        if (this.type === TYPE_FLYER) this.state = 'FLY';
        if (this.type === TYPE_BIRD) this.state = 'FLY';
        if (this.type === TYPE_EAGLE) this.state = 'FLY';
        if (this.type === TYPE_OWL) this.state = 'FLY';
        if (this.type === TYPE_CROW) this.state = 'FLY';
        if (this.type === TYPE_GHOST) this.state = 'HOVER';
        if (this.type === TYPE_ZOMBIE) this.state = 'PATROL';
        if (this.type === TYPE_DINO) this.state = 'PATROL';
        if (this.type === TYPE_SQUID) this.state = 'FLY';
        if (this.type === TYPE_CRAB) {
            this.state = 'SCUTTLE';
            this.stateTimer = 1.0;
        }

        // Pre-cache emoji
        this._cachedEmoji = getEmojiCanvas(this.emoji, this.height);
    }

    takeDamage(amount, game) {
        if (this.state === 'HIDE' && this.type === TYPE_CRAB) {
            // Invulnerable while hiding
            if (game && game.audio) game.audio.playHit();
            return;
        }

        this.health -= amount;
        this.damageFlashTimer = 0.2;

        if (this.health <= 0) {
            if (this.type === TYPE_ZOMBIE && this.revivesRemaining > 0) {
                this.revivesRemaining--;
                this.health = 1;
                this.state = 'REVIVING';
                this.stateTimer = 2.0;
                this.vx = 0;
                if (game && game.particles) game.particles.emitHit(this.x + this.width / 2, this.y + this.height);
                if (game && game.audio) game.audio.playHit();
            } else {
                this.markedForDeletion = true;
                if (game && game.particles) game.particles.emitDeath(this.x + this.width / 2, this.y + this.height / 2);
                if (game && game.player) game.player.score += 50;
                if (game) game.enemiesDefeated++;
                if (game && game.camera) game.camera.shake(0.1, 5);
                if (game) game.hitStopTimer = 0.1;
            }
        }
    }

    update(dt, game) {
        if (this.state === 'REVIVING') {
            this.stateTimer -= dt;
            if (this.stateTimer <= 0) {
                this.state = 'LUNGE';
                this.speed = this.baseSpeed * 3;
            }
            return; // don't update physics or anything else while reviving
        }

        this.timeAlive += dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.damageFlashTimer > 0) this.damageFlashTimer -= dt;

        let player = game ? game.player : null;
        let distToPlayerX = player ? player.x - this.x : Infinity;
        let distToPlayerY = player ? player.y - this.y : Infinity;
        let distToPlayer = Math.hypot(distToPlayerX, distToPlayerY);

        switch (this.type) {
            case TYPE_PATROL: this.updatePatrol(dt); break;
            case TYPE_CHASER: this.updateChaser(dt, game, player, distToPlayer, distToPlayerX); break;
            case TYPE_JUMPER: this.updateJumper(dt, player, distToPlayer); break;
            case TYPE_SHOOTER: this.updateShooter(dt, game, player, distToPlayer, distToPlayerX); break;
            case TYPE_FLYER: this.updateFlyer(dt, player, distToPlayer, distToPlayerX); break;
            case TYPE_BIRD: this.updateFlyer(dt, player, distToPlayer, distToPlayerX); break;
            case TYPE_EAGLE: this.updateFlyer(dt, player, distToPlayer, distToPlayerX); break;
            case TYPE_OWL: this.updateFlyer(dt, player, distToPlayer, distToPlayerX); break;
            case TYPE_CROW: this.updateFlyer(dt, player, distToPlayer, distToPlayerX); break;
            case TYPE_GHOST: this.updateGhost(dt, player, distToPlayer, distToPlayerX); break;
            case TYPE_ZOMBIE: this.updateZombie(dt, game, player, distToPlayer, distToPlayerX); break;
            case TYPE_DINO: this.updateDino(dt, game, player, distToPlayer, distToPlayerX); break;
            case TYPE_SQUID: this.updateSquid(dt, game, player, distToPlayer, distToPlayerX); break;
            case TYPE_CRAB: this.updateCrab(dt, player, distToPlayer, distToPlayerX); break;
        }

        if (this.type !== TYPE_FLYER && this.type !== TYPE_BIRD && this.type !== TYPE_EAGLE && this.type !== TYPE_OWL && this.type !== TYPE_CROW && this.type !== TYPE_GHOST && this.type !== TYPE_SQUID && this.type !== TYPE_SHOOTER) {
            this.vy += Physics.GRAVITY * dt;
            if (this.vy > Physics.TERMINAL_VELOCITY) this.vy = Physics.TERMINAL_VELOCITY;

            this.x += this.vx * dt;
            this.y += this.vy * dt;

            let platLeft = this.platform.x;
            let platRight = this.platform.x + this.platform.width;

            if (this.x + this.width > platRight) {
                this.x = platRight - this.width;
                this.facingRight = false;
                this.vx = -Math.abs(this.vx);
                if (this.state === 'CHARGE') this.state = 'PATROL';
            } else if (this.x < platLeft) {
                this.x = platLeft;
                this.facingRight = true;
                this.vx = Math.abs(this.vx);
                if (this.state === 'CHARGE') this.state = 'PATROL';
            }

            if (this.vy > 0 && this.y + this.height >= this.platform.y) {
                this.y = this.platform.y - this.height;

                if (this.type === TYPE_JUMPER && this.state === 'JUMP') {
                    this.state = 'IDLE';
                    this.stateTimer = 0.5 + Math.random() * 1;
                    this.vx = 0;
                    this.vy = 0;
                    if (game && game.particles) game.particles.emitHit(this.x + this.width / 2, this.y + this.height);
                } else if (this.type === TYPE_DINO && this.state === 'STOMP_JUMP') {
                    this.state = 'PATROL';
                    this.vx = this.facingRight ? this.baseSpeed : -this.baseSpeed;
                    this.vy = 0;
                    if (game && game.camera) {
                        game.camera.shake(0.3, 10);
                        if (game.audio) game.audio.playHit();
                        if (game.particles) game.particles.emitExplosion(this.x + this.width / 2, this.y + this.height, '#8B4513');
                    }
                } else {
                    this.vy = 0;
                }
            }
        } else {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
        }
    }

    updatePatrol(dt) {
        this.state = 'PATROL';
        this.speed = this.baseSpeed;
        this.vx = this.facingRight ? this.speed : -this.speed;
    }

    updateChaser(dt, game, player, dist, distX) {
        const aggroRange = 350;
        if (this.state === 'PATROL') {
            this.speed = this.baseSpeed * 0.4;
            this.vx = this.facingRight ? this.speed : -this.speed;

            if (dist < aggroRange && Math.abs(distX) > 20 && Math.abs(player.y - this.y) < 150) {
                this.state = 'WARN';
                this.stateTimer = 0.5;
                this.vx = 0;
            }
        } else if (this.state === 'WARN') {
            this.stateTimer -= dt;
            this.facingRight = distX > 0;
            if (this.stateTimer <= 0) {
                this.state = 'CHARGE';
                this.speed = this.baseSpeed * 2.5;
                this.vx = this.facingRight ? this.speed : -this.speed;
            }
        } else if (this.state === 'CHARGE') {
            this.vx = this.facingRight ? this.speed : -this.speed;
            if (dist > aggroRange + 200) {
                this.state = 'PATROL';
            }

            if (this.attackCooldown <= 0 && game && game.enemyProjectiles) {
                const throwX = this.facingRight ? this.x + this.width + 5 : this.x - 30;
                const fireball = new Fireball(throwX, this.y + this.height / 2 - 15, this.facingRight);
                game.enemyProjectiles.push(fireball);
                if (game && game.audio) game.audio.playThrow();
                this.attackCooldown = 1.5 + Math.random() * 1.5;
            }
        }
    }

    updateJumper(dt, player, dist) {
        this.stateTimer -= dt;
        if (this.state === 'IDLE' && this.stateTimer <= 0) {
            this.state = 'JUMP';
            this.vy = -(350 + Math.random() * 200);
            if (dist < 400 && player) {
                this.facingRight = player.x > this.x;
            } else {
                this.facingRight = Math.random() > 0.5;
            }
            this.vx = this.facingRight ? this.baseSpeed * 2.5 : -this.baseSpeed * 2.5;
        } else if (this.state === 'PATROL') {
            this.state = 'IDLE';
            this.stateTimer = 1;
            this.vx = 0;
        }
    }

    updateShooter(dt, game, player, dist, distX) {
        // Slow flowing movement
        this.speed = this.baseSpeed;
        this.vx = this.facingRight ? this.speed : -this.speed;

        // Platform bounds check
        let platLeft = this.platform.x;
        let platRight = this.platform.x + this.platform.width;
        if (this.x + this.width > platRight) {
            this.x = platRight - this.width;
            this.facingRight = false;
        } else if (this.x < platLeft) {
            this.x = platLeft;
            this.facingRight = true;
        }

        // Flowing vertical oscillation
        this.y = this.startY + Math.sin(this.timeAlive * 1.2) * 40;

        const shootRange = 500;
        if (player && dist < shootRange && Math.abs(player.y - this.y) < 200) {
            // Turn to face player when in range
            this.facingRight = distX > 0;

            if (this.attackCooldown <= 0) {
                this.state = 'ATTACK';
                this.attackCooldown = 3.0 + Math.random() * 2.0;
                const throwX = this.facingRight ? this.x + this.width + 5 : this.x - 20;
                const bone = new Bone(throwX, this.y + this.height / 2 - 15, this.facingRight);
                bone.emojiOverride = '✨';
                game.enemyProjectiles.push(bone);
                if (game.audio) game.audio.playThrow();
                this.stateTimer = 0.5;
            } else if (this.stateTimer > 0) {
                this.stateTimer -= dt;
            } else {
                this.state = 'HOVER';
            }
        } else {
            this.state = 'HOVER';
        }
    }

    updateFlyer(dt, player, dist, distX) {
        const swoopRange = 400;
        if (dist < swoopRange && player) {
            this.facingRight = distX > 0;
            const diveSpeed = this.baseSpeed * 1.5;
            this.vx = this.facingRight ? diveSpeed : -diveSpeed;

            if (player.y > this.y && Math.abs(distX) < 200) {
                this.startY += 100 * dt;
            } else if (this.startY < this.platform.y - 120) {
                this.startY -= 40 * dt;
            }
            this.state = 'ATTACK';
        } else {
            this.vx = this.facingRight ? this.baseSpeed * 0.8 : -this.baseSpeed * 0.8;
            if (this.x < this.platform.x - 50) this.facingRight = true;
            else if (this.x > this.platform.x + this.platform.width - this.width + 50) this.facingRight = false;
            this.state = 'FLY';

            let defaultY = this.platform.y - 150;
            if (this.startY < defaultY - 5) this.startY += 20 * dt;
            else if (this.startY > defaultY + 5) this.startY -= 20 * dt;
        }
        this.y = this.startY + Math.sin(this.timeAlive * 3.5) * 50;
    }

    updateGhost(dt, player, dist, distX) {
        const chaseSpeed = this.baseSpeed;
        if (player && dist < 600) {
            let dirX = player.x - this.x;
            let dirY = player.y - this.y;
            let len = Math.hypot(dirX, dirY);
            if (len > 0) {
                this.vx = (dirX / len) * chaseSpeed;
                this.vy = (dirY / len) * chaseSpeed;
            }
            this.facingRight = dirX > 0;
        } else {
            this.vx = Math.sin(this.timeAlive * 2) * 20;
            this.vy = Math.cos(this.timeAlive * 1.5) * 20;
        }
    }

    updateZombie(dt, game, player, dist, distX) {
        const shootRange = 400;
        if (player && dist < shootRange && Math.abs(player.y - this.y) < 150) {
            this.vx = 0;
            this.facingRight = distX > 0;
            if (this.attackCooldown <= 0) {
                this.state = 'ATTACK';
                this.attackCooldown = 2.0 + Math.random() * 1.0;
                const throwX = this.facingRight ? this.x + this.width + 5 : this.x - 20;
                const bone = new Bone(throwX, this.y + this.height / 2 - 15, this.facingRight);
                game.enemyProjectiles.push(bone);
                if (game.audio) game.audio.playThrow();
                this.stateTimer = 0.3;
            } else if (this.stateTimer > 0) {
                this.stateTimer -= dt;
            } else {
                this.state = 'IDLE';
            }
        } else {
            this.state = 'PATROL';
            this.speed = this.baseSpeed;
            this.vx = this.facingRight ? this.speed : -this.speed;
        }
    }

    updateDino(dt, game, player, dist, distX) {
        if (this.state === 'PATROL') {
            this.speed = this.baseSpeed;
            this.vx = this.facingRight ? this.speed : -this.speed;

            if (player && dist < 300 && Math.random() < 0.02) {
                this.state = 'STOMP_JUMP';
                this.vy = -600;
                this.vx = this.facingRight ? this.speed * 2 : -this.speed * 2;
                if (game && game.audio) game.audio.playJump();
            }
        }
    }

    updateSquid(dt, game, player, dist, distX) {
        this.vx = this.facingRight ? this.baseSpeed : -this.baseSpeed;
        if (this.x < this.platform.x) this.facingRight = true;
        if (this.x > this.platform.x + this.platform.width - this.width) this.facingRight = false;

        this.y = this.startY + Math.sin(this.timeAlive * 2) * 40;

        if (player && Math.abs(distX) < 40 && player.y > this.y && this.attackCooldown <= 0) {
            this.state = 'ATTACK';
            this.attackCooldown = 1.5;
            const ink = new Bone(this.x + this.width / 2, this.y + this.height, this.facingRight);
            ink.vy = 400; // Straight down!
            ink.vx = 0;
            ink.emojiOverride = '💧';
            game.enemyProjectiles.push(ink);
            if (game.audio) game.audio.playThrow();
        }
    }

    updateCrab(dt, player, dist, distX) {
        if (this.stateTimer > 0) this.stateTimer -= dt;

        if (this.state === 'SCUTTLE') {
            this.speed = this.baseSpeed;
            this.vx = this.facingRight ? this.speed : -this.speed;

            if (this.stateTimer <= 0) {
                if (Math.random() < 0.4) {
                    this.state = 'HIDE';
                    this.stateTimer = 1.0 + Math.random();
                    this.vx = 0;
                } else {
                    this.facingRight = !this.facingRight;
                    this.stateTimer = 0.5 + Math.random();
                }
            }
        } else if (this.state === 'HIDE') {
            if (this.stateTimer <= 0) {
                this.state = 'SCUTTLE';
                this.stateTimer = 0.5 + Math.random() * 2;
                this.facingRight = player ? player.x > this.x : Math.random() > 0.5;
            }
        }
    }

    draw(ctx) {
        ctx.save();

        let drawX = this.x + this.width / 2;
        let drawY = this.y + this.height / 2;
        let scaleX = 1;
        let scaleY = 1;
        let alpha = 1.0;

        // Damage flash: simple alpha tint instead of expensive ctx.filter
        if (this.damageFlashTimer > 0) {
            alpha = 0.5 + Math.sin(this.damageFlashTimer * 30) * 0.5;
        }

        if (this.type === TYPE_JUMPER && (this.state === 'JUMP' || this.state === 'IDLE')) {
            if (this.state === 'JUMP') { scaleX = 0.8; scaleY = 1.2; }
            else if (this.stateTimer < 0.2) { scaleX = 1.2; scaleY = 0.8; drawY += this.height * 0.1; }
        } else if (this.type === TYPE_DINO && this.state === 'STOMP_JUMP') {
            scaleX = 0.9; scaleY = 1.1;
        }

        if (this.state === 'ATTACK') {
            scaleX = 1.1; scaleY = 1.1;
        }

        if (this.type === TYPE_GHOST) {
            alpha = 0.5 + Math.sin(this.timeAlive * 3) * 0.3;
        }

        if (this.type === TYPE_CRAB && this.state === 'HIDE') {
            scaleX = 1.3; scaleY = 0.5;
            drawY += this.height * 0.25;
        }

        if (this.state === 'REVIVING' && this.type === TYPE_ZOMBIE) {
            scaleX = 0.8; scaleY = 0.8;
            drawY += this.height * 0.1;
            alpha = (Math.floor(this.timeAlive * 10) % 2 === 0) ? 0.5 : 1.0;
        }

        ctx.globalAlpha = alpha;

        ctx.translate(drawX, drawY);

        if (this.state === 'REVIVING' && this.type === TYPE_ZOMBIE) {
            ctx.rotate(Math.PI / 2); // lie down
        }

        if (this.facingRight) {
            ctx.scale(-1 * scaleX, 1 * scaleY);
        } else {
            ctx.scale(1 * scaleX, 1 * scaleY);
        }

        let yOffset = this.height * 0.1;

        if (this.state === 'PATROL' && this.type !== TYPE_FLYER && this.type !== TYPE_BIRD && this.type !== TYPE_EAGLE && this.type !== TYPE_OWL && this.type !== TYPE_CROW && this.type !== TYPE_JUMPER && this.type !== TYPE_DINO && this.type !== TYPE_GHOST) {
            yOffset -= Math.abs(Math.sin(this.timeAlive * 12)) * 6;
            ctx.rotate(Math.sin(this.timeAlive * 8) * 0.15); // Waddling
        } else if (this.type === TYPE_DINO && this.state === 'PATROL') {
            yOffset -= Math.abs(Math.sin(this.timeAlive * 6)) * 4;
            ctx.rotate(Math.sin(this.timeAlive * 4) * 0.1);
        } else if (this.state === 'IDLE' && this.type !== TYPE_FLYER && this.type !== TYPE_GHOST) {
            yOffset -= Math.sin(this.timeAlive * 4) * 2;
        } else if (this.type === TYPE_FLYER || this.type === TYPE_BIRD || this.type === TYPE_EAGLE || this.type === TYPE_OWL || this.type === TYPE_CROW || this.type === TYPE_SQUID) {
            ctx.rotate(Math.sin(this.timeAlive * 15) * 0.25);
        } else if (this.type === TYPE_GHOST || this.type === TYPE_SHOOTER) {
            yOffset += Math.sin(this.timeAlive * 2) * 5;
            if (this.type === TYPE_SHOOTER) {
                ctx.rotate(Math.sin(this.timeAlive * 1.5) * 0.1);
            }
        } else if (this.state === 'LUNGE') {
            ctx.rotate(0.3); // leaning forward
        }

        const cached = this._cachedEmoji;
        ctx.drawImage(cached.canvas, -cached.width / 2, -cached.height / 2 + yOffset);
        ctx.restore();
    }
}
