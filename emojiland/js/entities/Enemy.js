import { Entity } from './Entity.js';
import { Physics } from '../Physics.js';
import { Bone } from './Bone.js';
import { Fireball } from './Fireball.js';
import { Laser } from './Laser.js';
import { Worm } from './Worm.js';
import { Shrimp } from './Shrimp.js';
import { Peanut } from './Peanut.js';
import { GreenLaser } from './GreenLaser.js';
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
const TYPE_SQUIRREL = 'squirrel'; // 🐿️
const TYPE_BIRD = 'bird'; // 🐦
const TYPE_EAGLE = 'eagle'; // 🦅
const TYPE_OWL = 'owl'; // 🦉
const TYPE_CROW = 'crow'; // 🐦‍⬛
const TYPE_LIZARD = 'lizard'; // 🦗
const TYPE_ALIEN = 'alien'; // 👽
const TYPE_TROLL = 'troll'; // 🧌

export class Enemy extends Entity {
    constructor(x, y, platform) {
        let type, width, height, emoji, baseSpeed, health;

        // All enemy types with equal spawn chance
        const ENEMY_POOL = [
            { type: TYPE_PATROL, width: 40, height: 40, emoji: '🐢', baseSpeed: 50, health: 2 },
            { type: TYPE_CHASER, width: 55, height: 55, emoji: '👹', baseSpeed: 100, health: 4 },
            { type: TYPE_JUMPER, width: 35, height: 35, emoji: '🐸', baseSpeed: 80, health: 2 },
            { type: TYPE_SHOOTER, width: 50, height: 60, emoji: '🧙‍♂️', baseSpeed: 75, health: 3 },
            { type: TYPE_FLYER, width: 35, height: 35, emoji: '🦇', baseSpeed: 100, health: 1 },
            { type: TYPE_BIRD, width: 30, height: 30, emoji: '🐦', baseSpeed: 140, health: 1 },
            { type: TYPE_EAGLE, width: 40, height: 40, emoji: '🦅', baseSpeed: 90, health: 2 },
            { type: TYPE_OWL, width: 40, height: 40, emoji: '🦉', baseSpeed: 90, health: 2 },
            { type: TYPE_CROW, width: 35, height: 35, emoji: '🐦‍⬛', baseSpeed: 120, health: 1 },
            { type: TYPE_GHOST, width: 45, height: 45, emoji: '👻', baseSpeed: 40, health: 2 },
            { type: TYPE_ZOMBIE, width: 40, height: 50, emoji: '🧟‍♂️', baseSpeed: 30, health: 3 },
            { type: TYPE_DINO, width: 70, height: 70, emoji: '🦕', baseSpeed: 60, health: 5 },
            { type: TYPE_SQUID, width: 45, height: 45, emoji: '🦑', baseSpeed: 90, health: 2 },
            { type: TYPE_LIZARD, width: 40, height: 40, emoji: '🦗', baseSpeed: 40, health: 2 },
            { type: TYPE_CRAB, width: 35, height: 35, emoji: '🦀', baseSpeed: 220, health: 2 },
            { type: TYPE_SQUIRREL, width: 38, height: 38, emoji: '🐿️', baseSpeed: 160, health: 2 },
            { type: TYPE_TROLL, width: 60, height: 60, emoji: '🧌', baseSpeed: 40, health: 6 },
            { type: TYPE_ALIEN, width: 45, height: 45, emoji: '👽', baseSpeed: 80, health: 4 },
        ];

        const pick = ENEMY_POOL[Math.floor(Math.random() * ENEMY_POOL.length)];
        type = pick.type;
        width = pick.width;
        height = pick.height;
        emoji = pick.emoji;
        baseSpeed = pick.baseSpeed;
        health = pick.health;

        let actualY = platform.y - height;
        if (type === TYPE_FLYER || type === TYPE_SQUID || type === TYPE_BIRD || type === TYPE_EAGLE || type === TYPE_OWL || type === TYPE_CROW) {
            actualY -= 140 + Math.random() * 50;
        } else if (type === TYPE_GHOST || type === TYPE_SHOOTER) {
            actualY -= 60 + Math.random() * 80;
        } else if (type === TYPE_ALIEN) {
            actualY -= 220 + Math.random() * 50; // hover higher — still killable with a thrown rock
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
        this.startX = x;
        this.timeAlive = Math.random() * 100;
        this.attackCooldown = 0;

        this.revivesRemaining = (this.type === TYPE_ZOMBIE) ? 1 : 0;
        this.damageFlashTimer = 0;
        this.burstCount = 0;
        this.burstTimer = 0;

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
        if (this.type === TYPE_SQUIRREL) {
            this.state = 'SCUTTLE';
            this.stateTimer = 1.2;
        }
        if (this.type === TYPE_LIZARD) {
            this.state = 'PATROL';
            this.tongueLength = 0;
            this.tongueState = 'IDLE';
            this.tongueMax = 250;
        }
        if (this.type === TYPE_ALIEN) {
            this.state = 'FLY';
        }
        if (this.type === TYPE_TROLL) {
            this.state = 'PATROL';
        }

        // Pre-cache emoji
        this._cachedEmoji = getEmojiCanvas(this.emoji, this.height);
        this._tongueRect = { x: 0, y: 0, width: 0, height: 0 };
    }

    takeDamage(amount, game) {
        this.health -= amount;
        this.damageFlashTimer = 0.2;

        if (game && game.particles) {
            game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
        }

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
            case TYPE_FLYER: this.updateFlyer(dt, player, distToPlayer, distToPlayerX, game); break;
            case TYPE_BIRD: this.updateFlyer(dt, player, distToPlayer, distToPlayerX, game); break;
            case TYPE_EAGLE: this.updateFlyer(dt, player, distToPlayer, distToPlayerX, game); break;
            case TYPE_OWL: this.updateFlyer(dt, player, distToPlayer, distToPlayerX, game); break;
            case TYPE_CROW: this.updateFlyer(dt, player, distToPlayer, distToPlayerX, game); break;
            case TYPE_GHOST: this.updateGhost(dt, player, distToPlayer, distToPlayerX); break;
            case TYPE_ZOMBIE: this.updateZombie(dt, game, player, distToPlayer, distToPlayerX); break;
            case TYPE_DINO: this.updateDino(dt, game, player, distToPlayer, distToPlayerX); break;
            case TYPE_SQUID: this.updateSquid(dt, game, player, distToPlayer, distToPlayerX); break;
            case TYPE_CRAB: this.updateCrab(dt, player, distToPlayer, distToPlayerX, game); break;
            case TYPE_SQUIRREL: this.updateSquirrel(dt, player, distToPlayer, distToPlayerX, game); break;
            case TYPE_LIZARD: this.updateLizard(dt, game, player, distToPlayer, distToPlayerX); break;
            case TYPE_ALIEN: this.updateAlien(dt, game, player, distToPlayer, distToPlayerX); break;
            case TYPE_TROLL: this.updatePatrol(dt); break;
        }

        if (this.type === TYPE_TROLL && player && player.invulnerableTimer <= 0) {
            const cloudRadius = 180;
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            const pcx = player.x + player.width / 2;
            const pcy = player.y + player.height / 2;
            if (Math.hypot(pcx - cx, pcy - cy) < cloudRadius) {
                player.takeDamage(game);
            }
        }

        if (this.type !== TYPE_FLYER && this.type !== TYPE_BIRD && this.type !== TYPE_EAGLE && this.type !== TYPE_OWL && this.type !== TYPE_CROW && this.type !== TYPE_GHOST && this.type !== TYPE_SQUID && this.type !== TYPE_SHOOTER && this.type !== TYPE_ALIEN) {
            this.vy += Physics.GRAVITY * dt;
            if (this.vy > Physics.TERMINAL_VELOCITY) this.vy = Physics.TERMINAL_VELOCITY;

            this.x += this.vx * dt;
            this.y += this.vy * dt;

            let platLeft = this.platform.x;
            let platRight = this.platform.x + this.platform.width;

            if (this.x + this.width > platRight) {
                this.x = platRight - this.width;
                if (this.vx !== 0) this.facingRight = false;
                this.vx = -Math.abs(this.vx);
                if (this.state === 'CHARGE') this.state = 'PATROL';
                if (this.type === TYPE_LIZARD && this.tongueState !== 'IDLE') this.tongueState = 'RETRACTING';
            } else if (this.x < platLeft) {
                this.x = platLeft;
                if (this.vx !== 0) this.facingRight = true;
                this.vx = Math.abs(this.vx);
                if (this.state === 'CHARGE') this.state = 'PATROL';
                if (this.type === TYPE_LIZARD && this.tongueState !== 'IDLE') this.tongueState = 'RETRACTING';
            }

            if (this.vy > 0 && this.y + this.height >= this.platform.y) {
                this.y = this.platform.y - this.height;

                if (this.type === TYPE_JUMPER && this.state === 'JUMP') {
                    this.state = 'IDLE';
                    this.stateTimer = 0.1 + Math.random() * 0.2;
                    this.vx = 0;
                    this.vy = 0;
                    if (game && game.particles) game.particles.emitHit(this.x + this.width / 2, this.y + this.height);
                } else if (this.type === TYPE_DINO && this.state === 'STOMP_JUMP') {
                    this.state = 'PATROL';
                    this.vx = this.facingRight ? this.baseSpeed : -this.baseSpeed;
                    this.vy = 0;
                    if (game && game.camera) {
                        if (game.audio) game.audio.playHit();
                        // Big cloud-of-smoke effect at the dino's feet
                        if (game.particles) {
                            const stompX = this.x + this.width / 2;
                            const stompY = this.y + this.height;
                            game.particles.emitStomp(stompX, stompY);
                            game.particles.emitStomp(stompX - 25, stompY);
                            game.particles.emitStomp(stompX + 25, stompY);
                        }
                    }
                    if (player && distToPlayer < 600) {
                        player.stunTimer = 0.6;
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
        // Always patrol at full speed
        this.state = 'PATROL';
        this.speed = this.baseSpeed;
        this.vx = this.facingRight ? this.speed : -this.speed;

        // Periodically fire a homing fireball toward the player — always, regardless of Y offset or range
        if (this.attackCooldown <= 0 && game && game.enemyProjectiles && player) {
            // Aim the initial velocity straight at the player (homing will do the rest)
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            const dx = (player.x + player.width / 2) - cx;
            const dy = (player.y + player.height / 2) - cy;
            const aimRight = dx >= 0;

            // Spawn just outside the ogre's edge facing the player
            const spawnX = aimRight ? this.x + this.width + 5 : this.x - 40;
            const spawnY = cy - 15;

            const fireball = new Fireball(spawnX, spawnY, aimRight);

            // Override initial velocity to point directly at the player
            const len = Math.hypot(dx, dy) || 1;
            fireball.vx = (dx / len) * fireball.speed;
            fireball.vy = (dy / len) * fireball.speed;

            game.enemyProjectiles.push(fireball);
            this.attackCooldown = 1.0 + Math.random() * 1.0; // 1.0 – 2.0 seconds
            this.facingRight = aimRight;
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
            this.stateTimer = 0.2;
            this.vx = 0;
        }
    }

    updateShooter(dt, game, player, dist, distX) {
        // Circular orbit — cos for X, sin for Y (90° apart = true ellipse)
        const orbitSpeed = 2.5;
        const orbitRadiusX = 160;
        const orbitRadiusY = 120;
        this.x = this.startX + Math.cos(this.timeAlive * orbitSpeed) * orbitRadiusX;
        this.y = this.startY + Math.sin(this.timeAlive * orbitSpeed) * orbitRadiusY;

        // Face the direction of horizontal travel (derivative of cos is -sin)
        this.facingRight = Math.sin(this.timeAlive * orbitSpeed) < 0;

        // Since we set x/y directly, zero out vx/vy so update()'s else branch doesn't interfere
        this.vx = 0;
        this.vy = 0;

        const shootRange = 500;
        if (player && dist < shootRange && Math.abs(player.y - this.y) < 200) {
            // Turn to face player when in range
            this.facingRight = distX > 0;

            if (this.attackCooldown <= 0) {
                this.state = 'ATTACK';
                this.attackCooldown = 3.0 + Math.random() * 2.0;

                const centerX = this.x + this.width / 2;
                const centerY = this.y + this.height / 2;

                const numLasers = 8;
                for (let i = 0; i < numLasers; i++) {
                    const angle = (i / numLasers) * Math.PI * 2;
                    const laser = new Laser(centerX, centerY, angle);
                    game.enemyProjectiles.push(laser);
                }

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

    updateFlyer(dt, player, dist, distX, game) {
        const swoopRange = 400;
        const comfortZone = 90; // minimum distance — bird backs off rather than cramming into the player
        if (dist < swoopRange && player) {
            this.facingRight = distX > 0;
            // Slow way down inside the comfort zone so the player gets breathing room
            const speedMult = dist < comfortZone ? 0.3 : 1.5;
            const diveSpeed = this.baseSpeed * speedMult;
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

        // Cartoony worm throwing logic for birds
        const isBird = this.type === 'eagle' || this.type === 'owl' || this.type === 'crow';
        if (isBird && player && dist < 600 && game) {
            if (this.attackCooldown <= 0) {
                this.attackCooldown = 1.5 + Math.random() * 2.0;
                const centerX = this.x + this.width / 2;
                const centerY = this.y + this.height / 2;
                const worm = new Worm(centerX, centerY, player.x > this.x);
                game.enemyProjectiles.push(worm);
            }
        }
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

            // Reduce frequency from 0.02 to 0.005 to make it less OP
            if (player && dist < 600 && Math.random() < 0.005) {
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
        }
    }

    updateCrab(dt, player, dist, distX, game) {
        if (this.stateTimer > 0) this.stateTimer -= dt;

        if (this.state === 'SCUTTLE') {
            this.speed = this.baseSpeed;
            this.vx = this.facingRight ? this.speed : -this.speed;

            if (this.stateTimer <= 0) {
                const rand = Math.random();
                // Increase shrimp throw frequency from 0.4 to 0.7
                if (rand < 0.7) {
                    this.state = 'SHOOT';
                    this.stateTimer = 1.5;
                    this.vx = 0;
                    this.chargeCount = 3;
                    this.shootTimer = 0;
                    this.facingRight = distX > 0;
                } else {
                    this.facingRight = !this.facingRight;
                    this.stateTimer = 0.3 + Math.random() * 0.7; // Faster decision making
                }
            }

        } else if (this.state === 'SHOOT') {
            if (this.shootTimer > 0) this.shootTimer -= dt;

            if (this.shootTimer <= 0 && this.chargeCount > 0 && game) {
                this.chargeCount--;
                this.shootTimer = 0.3; // interval between bursts

                const centerX = this.x + this.width / 2;
                const centerY = this.y;
                // Arc upwards, slightly randomized
                const upVel = -400 - Math.random() * 100;
                const xVel = 100 + Math.random() * 150;
                const shrimp = new Shrimp(centerX, centerY, this.facingRight, upVel, xVel);
                game.enemyProjectiles.push(shrimp);
            }

            if (this.stateTimer <= 0 || (this.chargeCount <= 0 && this.shootTimer <= 0)) {
                this.state = 'SCUTTLE';
                this.stateTimer = 0.3 + Math.random() * 0.7; // Faster decision making
            }
        }
    }

    updateSquirrel(dt, player, dist, distX, game) {
        if (this.stateTimer > 0) this.stateTimer -= dt;

        if (this.state === 'SCUTTLE') {
            this.speed = this.baseSpeed;
            this.vx = this.facingRight ? this.speed : -this.speed;

            if (this.stateTimer <= 0) {
                const rand = Math.random();
                if (rand < 0.4 && player && dist < 800) {
                    this.state = 'SHOOT';
                    this.stateTimer = 2.0;
                    this.vx = 0;
                    this.chargeCount = 2; // Firing 2 peanuts in a sequence
                    this.shootTimer = 0;
                    this.facingRight = distX > 0;
                } else {
                    this.facingRight = !this.facingRight;
                    this.stateTimer = 0.5 + Math.random();
                }
            }

        } else if (this.state === 'SHOOT') {
            if (this.shootTimer > 0) this.shootTimer -= dt;

            if (this.shootTimer <= 0 && this.chargeCount > 0 && game && player) {
                this.chargeCount--;
                this.shootTimer = 0.3; // interval between peanuts

                const centerX = this.x + this.width / 2;
                const centerY = this.y;

                // Targeted arc logic:
                const targetX = player.x + player.width / 2;
                // Aim slightly above player center
                const targetY = player.y + player.height / 2;

                const dx = targetX - centerX;
                const dy = targetY - centerY;

                // Choose a time of flight based on horizontal distance
                // 0.8 to 1.5 seconds depending on distance
                const baseTime = Math.max(0.8, Math.abs(dx) / 400);
                const timeOfFlight = baseTime * (0.9 + Math.random() * 0.2);

                const vx = dx / timeOfFlight;
                // vy = (dy - 0.5 * g * t^2) / t
                const vy = (dy - 0.5 * Physics.GRAVITY * timeOfFlight * timeOfFlight) / timeOfFlight;

                const peanut = new Peanut(centerX, centerY, vx, vy);
                game.enemyProjectiles.push(peanut);
            }

            if (this.stateTimer <= 0 || (this.chargeCount <= 0 && this.shootTimer <= 0)) {
                this.state = 'SCUTTLE';
                this.stateTimer = 0.8 + Math.random();
            }
        }
    }

    updateLizard(dt, game, player, dist, distX) {
        if (this.tongueState === 'IDLE') {
            this.speed = this.baseSpeed;
            this.vx = this.facingRight ? this.speed : -this.speed;

            const shootRange = 250;
            const isNearPlayer = player && Math.abs(player.y + player.height / 2 - (this.y + this.height / 2)) < 50 && dist < shootRange;
            const shouldTrigger = this.attackCooldown <= 0 && (isNearPlayer || Math.random() < 0.01);

            if (shouldTrigger) {
                if (isNearPlayer) this.facingRight = distX > 0;
                this.vx = 0;
                this.tongueState = 'EXTENDING';
                this.tongueLength = 0;
                if (game.audio) game.audio.playThrow();
            }
        } else if (this.tongueState === 'EXTENDING') {
            this.vx = 0;
            this.tongueLength += 600 * dt;
            if (this.tongueLength >= this.tongueMax) {
                this.tongueLength = this.tongueMax;
                this.tongueState = 'RETRACTING';
            }
            this.checkTongueCollision(game);
        } else if (this.tongueState === 'RETRACTING') {
            this.vx = 0;
            this.tongueLength -= 1500 * dt;
            if (this.tongueLength <= 0) {
                this.tongueLength = 0;
                this.tongueState = 'IDLE';
                this.attackCooldown = 0.5 + Math.random();
            }
        }
    }

    checkTongueCollision(game) {
        let centerX = this.x + this.width / 2;
        let ty = this.y + this.height / 2 - 4;
        let tx = this.facingRight ? centerX : centerX - this.tongueLength;
        let tw = this.tongueLength;
        let th = 8;

        const rect = this._tongueRect;
        rect.x = tx; rect.y = ty; rect.width = tw; rect.height = th;

        if (game.player && game.player.invulnerableTimer <= 0 && Physics.checkAABB(rect, game.player.getHitbox())) {
            game.player.takeDamage(game);
            this.tongueState = 'RETRACTING';
        }
    }

    updateAlien(dt, game, player, dist, distX) {
        this.vx = this.facingRight ? this.baseSpeed : -this.baseSpeed;
        if (this.x < this.platform.x - 50) this.facingRight = true;
        if (this.x > this.platform.x + this.platform.width - this.width + 50) this.facingRight = false;

        this.y = this.startY + Math.sin(this.timeAlive * 3) * 30;

        const isPlayerUnder = player && Math.abs(distX) < 1000;

        // 2 seconds firing, 1 second pause gap
        const alienCycle = this.timeAlive % 3.0;  // Cycle duration is now 3 seconds
        const isFiringWindow = alienCycle < 2.0;  // Firing happens during the first 2 seconds

        if (this.attackCooldown <= 0 && game && game.enemyProjectiles && isPlayerUnder && isFiringWindow) {
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height - 10; // little lower inside emoji

            const spread = (Math.random() - 0.5) * 0.3; // Spread angle
            const laser = new GreenLaser(centerX, centerY, spread);
            game.enemyProjectiles.push(laser);

            this.attackCooldown = 0.15; // Constant shower
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
            // Full fade in/out — 0% to 100% opacity
            alpha = Math.max(0, 0.5 + Math.sin(this.timeAlive * 1.5) * 0.7);
        }

        if (this.type === TYPE_SHOOTER) {
            // Full fade in/out — 0% to 100% opacity
            alpha = 0.5 + Math.sin(this.timeAlive * 1.6) * 0.5;
        }



        if (this.state === 'REVIVING' && this.type === TYPE_ZOMBIE) {
            scaleX = 0.8; scaleY = 0.8;
            drawY += this.height * 0.1;
            alpha = (Math.floor(this.timeAlive * 10) % 2 === 0) ? 0.5 : 1.0;
        }

        ctx.globalAlpha = alpha;

        ctx.translate(drawX, drawY);

        if (this.type === TYPE_TROLL) {
            ctx.save();
            ctx.globalAlpha = 0.6 + Math.sin(this.timeAlive * 3) * 0.2; // Pulsing opacity
            const cloudRadius = 180;
            const grad = ctx.createRadialGradient(0, 0, 40, 0, 0, cloudRadius);
            grad.addColorStop(0, 'rgba(255, 0, 0, 0.8)'); // Inner red
            grad.addColorStop(0.5, 'rgba(139, 0, 0, 0.6)'); // Dark red middle
            grad.addColorStop(1, 'rgba(255, 0, 0, 0)'); // Fades out completely

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, cloudRadius, 0, Math.PI * 2);
            ctx.fill();

            // Add a very clear boundary stroke - double layered for "warning" vibe
            // 1. Solid deep red base
            ctx.strokeStyle = 'rgba(139, 0, 0, 0.8)';
            ctx.lineWidth = 1;
            ctx.setLineDash([]);
            ctx.stroke();

            // 2. Bright dashed overlay for movement/clarity
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1;
            ctx.setLineDash([15, 15]);
            ctx.lineDashOffset = this.timeAlive * 20; // Scrolling dashes
            ctx.stroke();

            ctx.restore();
        }

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
        } else if (this.type === TYPE_FLYER || this.type === TYPE_BIRD || this.type === TYPE_EAGLE || this.type === TYPE_OWL || this.type === TYPE_CROW || this.type === TYPE_SQUID || this.type === TYPE_ALIEN) {
            if (this.type === TYPE_ALIEN) {
                ctx.rotate(Math.sin(this.timeAlive * 5) * 0.1);
            } else {
                ctx.rotate(Math.sin(this.timeAlive * 15) * 0.25);
            }
        } else if (this.type === TYPE_GHOST || this.type === TYPE_SHOOTER) {
            yOffset += Math.sin(this.timeAlive * 2) * 5;
            if (this.type === TYPE_SHOOTER) {
                ctx.rotate(Math.sin(this.timeAlive * 1.5) * 0.1);
            }
        } else if (this.state === 'LUNGE') {
            ctx.rotate(0.3); // leaning forward
        }

        if (this.type === TYPE_LIZARD && this.tongueState !== 'IDLE') {
            ctx.fillStyle = '#FF69B4'; // hot pink tongue
            let tongueW = this.tongueLength / scaleX;
            let tongueY = 5; // Offset from center vertically
            // Local space: drawing left from center because of ctx.scale
            ctx.fillRect(-tongueW, tongueY - 4, tongueW, 8);

            ctx.beginPath();
            ctx.arc(-tongueW, tongueY, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        const cached = this._cachedEmoji;
        ctx.drawImage(cached.canvas, -cached.width / 2, -cached.height / 2 + yOffset);
        ctx.restore();
    }
}
