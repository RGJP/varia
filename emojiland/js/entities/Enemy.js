import { Entity } from './Entity.js';
import { Physics } from '../Physics.js';
import { Bone } from './Bone.js';
import { Fireball } from './Fireball.js';
import { Laser } from './Laser.js';
import { Worm } from './Worm.js';
import { Shrimp } from './Shrimp.js';
import { Peanut } from './Peanut.js';
import { UfoProjectile } from './UfoProjectile.js';
import { Barrel } from './Barrel.js';
import { getEmojiCanvas } from '../EmojiCache.js';
import { BossProjectile } from './BossProjectile.js';

const BOSS_TYPES = ['boss_chick', 'boss_moai', 'boss_hedgehog', 'boss_spider', 'boss_dragon', 'boss_robot'];

const TYPE_PATROL = 'patrol';
const TYPE_CHASER = 'chaser'; // 👹
const TYPE_JUMPER = 'jumper'; // 🐸
const TYPE_SHOOTER = 'shooter'; // 🧞
const TYPE_FLYER = 'flyer';

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
const TYPE_ALIEN = 'alien'; // 🛸
const TYPE_TROLL = 'troll'; // 🧌
const TYPE_APE = 'ape'; // 🦍
const TYPE_SPIDER = 'spider'; // 🕷️
const TYPE_MINI_SPIDER = 'mini_spider'; // 🕷️
const SHOOTER_OPACITY_SPEED = 1.6;

export class Enemy extends Entity {
    constructor(x, y, platform) {
        let type, width, height, emoji, baseSpeed, health;

        // All enemy types with equal spawn chance
        const ENEMY_POOL = [
            { type: TYPE_PATROL, width: 46, height: 46, emoji: '🐢', baseSpeed: 50, health: 2 },
            { type: TYPE_CHASER, width: 55, height: 55, emoji: '👹', baseSpeed: 100, health: 4 },
            { type: TYPE_JUMPER, width: 35, height: 35, emoji: '🐸', baseSpeed: 80, health: 2 },
            { type: TYPE_SHOOTER, width: 50, height: 60, emoji: '🧞', baseSpeed: 75, health: 3 },
            { type: TYPE_BIRD, width: 30, height: 30, emoji: '🐦', baseSpeed: 140, health: 1 },
            { type: TYPE_EAGLE, width: 40, height: 40, emoji: '🦅', baseSpeed: 90, health: 2 },
            { type: TYPE_OWL, width: 40, height: 40, emoji: '🦉', baseSpeed: 90, health: 2 },
            { type: TYPE_CROW, width: 35, height: 35, emoji: '🐦‍⬛', baseSpeed: 120, health: 1 },
            { type: TYPE_GHOST, width: 45, height: 45, emoji: '👻', baseSpeed: 40, health: 2 },
            { type: TYPE_ZOMBIE, width: 40, height: 50, emoji: '🧟‍♂️', baseSpeed: 30, health: 3 },
            { type: TYPE_DINO, width: 70, height: 70, emoji: '🦕', baseSpeed: 60, health: 5 },
            { type: TYPE_SQUID, width: 45, height: 45, emoji: '🦑', baseSpeed: 90, health: 2 },
            { type: TYPE_LIZARD, width: 40, height: 40, emoji: '🦗', baseSpeed: 40, health: 2 },
            { type: TYPE_CRAB, width: 42, height: 42, emoji: '🦀', baseSpeed: 220, health: 2 },
            { type: TYPE_SQUIRREL, width: 44, height: 44, emoji: '🐿️', baseSpeed: 160, health: 2 },
            { type: TYPE_TROLL, width: 60, height: 60, emoji: '🧌', baseSpeed: 40, health: 6 },
            { type: TYPE_ALIEN, width: 45, height: 45, emoji: '🛸', baseSpeed: 80, health: 4 },
            { type: TYPE_APE, width: 60, height: 60, emoji: '🦍', baseSpeed: 0, health: 5 },
            { type: TYPE_SPIDER, width: 70, height: 70, emoji: '🕷️', baseSpeed: 100, health: 4 },
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
        this.shooterPeakLock = false;

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
        if (this.type === TYPE_APE) {
            this.state = 'IDLE';
        }
        if (this.type === TYPE_SPIDER || this.type === TYPE_MINI_SPIDER) {
            this.state = 'PATROL';
            this.stateTimer = 1.0 + Math.random() * 1.0; // Jump timer
        }

        // Pre-cache emoji
        this._cachedEmoji = getEmojiCanvas(this.emoji, this.height);
        this._tongueRect = { x: 0, y: 0, width: 0, height: 0 };
    }

    takeDamage(amount, game) {
        this.health -= amount;
        this.damageFlashTimer = 0.2;

        if (game && game.particles) {
            if (this.type === TYPE_TROLL) {
                // Larger burst of green smoke when hit
                for (let i = 0; i < 5; i++) {
                    game.particles.emitGreenSmoke(this.x + this.width / 2, this.y + this.height / 2);
                }
            } else {
                game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
            }
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
                if (game && game.particles) {
                    const cx = this.x + this.width / 2;
                    const cy = this.y + this.height / 2;
                    game.particles.emitDeath(cx, cy);
                    if (this.type === TYPE_TROLL) {
                        game.particles.clearGreenSmoke(cx, cy);
                    }
                }
                if (game && game.player) game.player.score += 50;
                if (game) game.enemiesDefeated++;

                // Spider split logic
                if (this.type === TYPE_SPIDER && game) {
                    // Spawn 3 mini spiders with a slight delay represented by the update cycle
                    // For immediate spawning but visual delay, we can just spawn them now
                    // The prompt mentioned "a split-second respawn delay"
                    // We can achieve this by having the game handle it or just spawning them here
                    for (let i = 0; i < 3; i++) {
                        const mini = new Enemy(this.x + (i - 1) * 20, this.y, this.platform);
                        mini.type = TYPE_MINI_SPIDER;
                        mini.width = 45;
                        mini.height = 45;
                        mini.emoji = '🕷️';
                        mini._cachedEmoji = getEmojiCanvas(mini.emoji, mini.height);
                        mini.baseSpeed = 100;
                        mini.speed = mini.baseSpeed;
                        mini.health = 1;
                        mini.maxHealth = 1;
                        mini.state = 'PATROL';
                        mini.stateTimer = 0.5 + Math.random() * 1.0;
                        mini.vy = -300 - Math.random() * 200; // Popping out
                        mini.vx = (i - 1) * 100;
                        mini.y = this.y;
                        game.enemies.push(mini);
                        game.totalEnemies++; // Ensure they count towards total enemies for victory
                    }
                }
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
            case TYPE_APE: this.updateApe(dt, game, player, distToPlayer, distToPlayerX); break;
            case TYPE_SPIDER: this.updateSpider(dt, player, distToPlayer, game); break;
            case TYPE_MINI_SPIDER: this.updateSpider(dt, player, distToPlayer, game); break;
        }

        if (this.type === TYPE_TROLL && game && game.particles) {
            // Constantly emanate a bit of smoke
            if (this.timeAlive % 0.2 < dt) {
                game.particles.emitGreenSmoke(this.x + this.width / 2, this.y + this.height / 2);
            }

            if (player && player.invulnerableTimer <= 0) {
                const cloudRadius = 180;
                const cx = this.x + this.width / 2;
                const cy = this.y + this.height / 2;
                const pcx = player.x + player.width / 2;
                const pcy = player.y + player.height / 2;
                if (Math.hypot(pcx - cx, pcy - cy) < cloudRadius) {
                    player.takeDamage(game);
                }
            }
        }

        if (this.type !== TYPE_FLYER && this.type !== TYPE_BIRD && this.type !== TYPE_EAGLE && this.type !== TYPE_OWL && this.type !== TYPE_CROW && this.type !== TYPE_GHOST && this.type !== TYPE_SQUID && this.type !== TYPE_SHOOTER && this.type !== TYPE_ALIEN) {
            this.vy += Physics.GRAVITY * dt;
            if (this.vy > Physics.TERMINAL_VELOCITY) this.vy = Physics.TERMINAL_VELOCITY;

            this.x += this.vx * dt;
            this.y += this.vy * dt;

            // Spiders in JUMP state are free to leave their platform
            const isSpiderJumping = (this.type === TYPE_SPIDER || this.type === TYPE_MINI_SPIDER) && this.state === 'JUMP';

            if (!isSpiderJumping) {
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
            }

            // Spiders can land on ANY platform, not just their home platform
            if (this.vy > 0 && (this.type === TYPE_SPIDER || this.type === TYPE_MINI_SPIDER) && game) {
                const allPlats = game.platforms;
                let landed = false;
                for (let pi = 0; pi < allPlats.length; pi++) {
                    const p = allPlats[pi];
                    if (this.y + this.height >= p.y && this.y + this.height <= p.y + 20 &&
                        this.x + this.width > p.x && this.x < p.x + p.width) {
                        this.y = p.y - this.height;
                        this.vy = 0;
                        this.platform = p; // adopt new home platform
                        if (this.state === 'JUMP') {
                            this.state = 'PATROL';
                            this.stateTimer = 1.0 + Math.random() * 2.0;
                        }
                        landed = true;
                        break;
                    }
                }
                // Also check moving platforms
                if (!landed && game.movingPlatforms) {
                    for (let pi = 0; pi < game.movingPlatforms.length; pi++) {
                        const p = game.movingPlatforms[pi];
                        if (this.y + this.height >= p.y && this.y + this.height <= p.y + 20 &&
                            this.x + this.width > p.x && this.x < p.x + p.width) {
                            this.y = p.y - this.height;
                            this.vy = 0;
                            this.platform = p;
                            if (this.state === 'JUMP') {
                                this.state = 'PATROL';
                                this.stateTimer = 1.0 + Math.random() * 2.0;
                            }
                            landed = true;
                            break;
                        }
                    }
                }
            } else if (this.vy > 0 && this.y + this.height >= this.platform.y) {
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
                    if (game && game.audio && typeof game.audio.playStomp === 'function') {
                        game.audio.playStomp();
                    }
                    if (game && game.camera) {
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
        // Irregular genie movement: layered waves + phase modulation for a squiggly hover path.
        const t = this.timeAlive;
        const phase = this.startX * 0.01;
        const prevX = this.x;

        const baseWobbleX = Math.cos((t * 2.1) + (Math.sin(t * 0.8) * 0.9)) * 125;
        const baseWobbleY = Math.sin((t * 2.8) + (Math.cos(t * 1.0) * 0.7)) * 68;
        const squiggleX = Math.sin((t * 6.7) + phase) * 22 + Math.sin((t * 3.9) + phase * 1.7) * 12;
        const squiggleY = Math.cos((t * 5.1) + phase * 1.3) * 13 + Math.sin((t * 7.4) + phase) * 8;

        this.x = this.startX + baseWobbleX + squiggleX;
        this.y = this.startY + baseWobbleY + squiggleY;

        // Face where it is drifting on X so the genie feels less robotic.
        this.facingRight = (this.x - prevX) >= 0;

        // Since we set x/y directly, zero out vx/vy so update()'s else branch doesn't interfere
        this.vx = 0;
        this.vy = 0;
        const shooterOpacity = 0.5 + Math.sin(this.timeAlive * SHOOTER_OPACITY_SPEED) * 0.5;
        const atFullOpacity = shooterOpacity >= 0.995;
        if (!atFullOpacity) this.shooterPeakLock = false;

        if (player) {
            // Turn to face player at any distance
            this.facingRight = distX > 0;

            if (atFullOpacity && !this.shooterPeakLock) {
                this.state = 'ATTACK';
                this.shooterPeakLock = true;

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
                const projectileEmoji = this.type === TYPE_OWL ? '\uD83D\uDC01' : undefined;
                const worm = new Worm(centerX, centerY, player.x > this.x, projectileEmoji);
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
            const projectile = new UfoProjectile(centerX, centerY, spread);
            game.enemyProjectiles.push(projectile);

            this.attackCooldown = 0.15; // Constant shower
        }
    }

    updateApe(dt, game, player, dist, distX) {
        // Great Ape is stationary, just faces the player
        if (player && dist < 800) {
            this.facingRight = distX > 0;

            if (this.attackCooldown <= 0) {
                this.state = 'ATTACK';
                this.attackCooldown = 2.0;

                const centerX = this.x + this.width / 2;
                const centerY = this.y + this.height / 2;

                // Spawn barrel in front of ape
                const throwX = this.facingRight ? this.x + this.width : this.x - 40;
                const barrel = new Barrel(throwX, this.y + this.height - 40, this.facingRight);
                game.enemyProjectiles.push(barrel);

                this.stateTimer = 0.5;
            } else if (this.stateTimer > 0) {
                this.stateTimer -= dt;
            } else {
                this.state = 'IDLE';
            }
        } else {
            this.state = 'IDLE';
        }

        this.vx = 0;
        this.vy = 0;
    }

    updateSpider(dt, player, dist, game) {
        if (this.stateTimer > 0) this.stateTimer -= dt;

        if (this.state === 'PATROL') {
            this.speed = this.baseSpeed;
            this.vx = this.facingRight ? this.speed : -this.speed;

            if (this.stateTimer <= 0) {
                this.state = 'JUMP';
                let startY = this.y + this.height;
                let startX = this.x + this.width / 2;
                let targetPlat = null;

                if (game) {
                    let validPlatforms = [];
                    for (let i = 0; i < game.platforms.length; i++) {
                        let p = game.platforms[i];
                        if (p === this.platform) continue;
                        let dy = p.y - startY;
                        let dx = (p.x + p.width / 2) - startX;
                        // Filter out platforms that are too high or too far to reasonably jump to
                        if (dy > -250 && Math.abs(dx) < 600 && Math.abs(dx) > 50) {
                            validPlatforms.push(p);
                        }
                    }

                    if (validPlatforms.length > 0) {
                        // Check if player is on a valid platform
                        if (player && dist < 600) {
                            for (let i = 0; i < validPlatforms.length; i++) {
                                let p = validPlatforms[i];
                                if (player.x + player.width > p.x && player.x < p.x + p.width &&
                                    Math.abs(player.y + player.height - p.y) < 50) {
                                    targetPlat = p;
                                    break;
                                }
                            }
                        }
                        if (!targetPlat) {
                            targetPlat = validPlatforms[Math.floor(Math.random() * validPlatforms.length)];
                        }
                    }
                }

                if (targetPlat) {
                    // Calculate exact jump physics
                    let targetX = targetPlat.x + targetPlat.width / 2;
                    // Add some random scatter so it doesn't always land dead center
                    targetX += (Math.random() - 0.5) * (targetPlat.width * 0.5);
                    let targetY = targetPlat.y;

                    let dy = targetY - startY;
                    let dx = targetX - startX;

                    // Choose apex height at least 100px above start, and 50px above target
                    let apex = Math.min(startY - 100, targetY - 50);
                    let h = startY - apex;

                    this.vy = -Math.sqrt(2 * Physics.GRAVITY * h);

                    let a = 0.5 * Physics.GRAVITY;
                    let b = this.vy;
                    let c = -dy;
                    let discriminant = b * b - 4 * a * c;

                    if (discriminant >= 0) {
                        let t = (-b + Math.sqrt(discriminant)) / (2 * a);
                        this.vx = dx / t;
                        this.facingRight = this.vx > 0;
                    } else {
                        // Fallback (mathematically shouldn't happen given the apex)
                        this.vy = -400;
                        this.vx = dx > 0 ? 200 : -200;
                        this.facingRight = this.vx > 0;
                    }
                } else {
                    // No valid platform, do a small safe hop on current platform
                    this.vy = -(250 + Math.random() * 150);
                    let centerDist = (this.platform.x + this.platform.width / 2) - startX;
                    this.vx = centerDist > 0 ? 100 : -100;
                    this.facingRight = this.vx > 0;
                }
            }
        } else if (this.state === 'JUMP') {
            // physics handles the jump arc; landing is resolved in update()
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
            alpha = 0.5 + Math.sin(this.timeAlive * SHOOTER_OPACITY_SPEED) * 0.5;
        }



        if (this.state === 'REVIVING' && this.type === TYPE_ZOMBIE) {
            scaleX = 0.8; scaleY = 0.8;
            drawY += this.height * 0.1;
            alpha = (Math.floor(this.timeAlive * 10) % 2 === 0) ? 0.5 : 1.0;
        }

        if (this.type === TYPE_SPIDER || this.type === TYPE_MINI_SPIDER) {
            // Subtle glow to separate spiders from dark backgrounds without hard outlines.
            ctx.shadowColor = 'rgba(255, 70, 70, 0.85)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        ctx.globalAlpha = alpha;

        ctx.translate(drawX, drawY);

        if (this.type === TYPE_TROLL) {
            // Troll used to have a red aura here, now it just emanates smoke via update()
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

// ─────────────────────────────────────────────────────────────
//  Boss  (large end-of-level encounter, ~4× player size)
// ─────────────────────────────────────────────────────────────
export class Boss extends Entity {
    constructor(x, y, platform, bossType) {
        const resolvedBossType = bossType || BOSS_TYPES[Math.floor(Math.random() * BOSS_TYPES.length)];
        const size = resolvedBossType === 'boss_spider' ? 92 : (resolvedBossType === 'boss_dragon' ? 170 : (resolvedBossType === 'boss_robot' ? 156 : 160));
        super(x, y - size, size, size);

        this.bossType = resolvedBossType;
        this.platform = platform;
        this.facingRight = true;

        this.maxHealth = this.bossType === 'boss_spider'
            ? 12 + Math.floor(Math.random() * 7)
            : 16 + Math.floor(Math.random() * 15);
        this.health = this.maxHealth;
        this.damageFlashTimer = 0;
        this.attackCooldown = 1.8;
        this.timeAlive = 0;
        this.distToPlayer = Infinity;
        this.activated = false;
        this.spawnFadeTimer = 0;
        this.spawnFadeDuration = 0.65;

        // Boss flavor + UI identity
        const nonsenseNames = [
            'GRONKLE SNOOT',
            'BEEPUS MAXIMUS',
            'LORD WOBBLETOOTH',
            'ZORP THE UNHELPFUL',
            'CAPTAIN NIBBLEFOG',
            'DR. BONKLETON',
            'QUEEN FLOMPA',
            'MECHA NOODLE V',
            'THUDWICK PRIME',
            'SIR CRUMBLEDOOM',
            'BLORPATRON IX',
            'ADMIRAL PUDDLEBITE',
            'GRIZZLE VON ZAP',
            'MUNCHLORD OMEGA',
            'PROFESSOR SKEDADDLE',
            'BUNKERSPROCKET',
            'GIGGLEFANG',
            'SPROINGULON',
            'DREAD MUFFIN',
            'WOBBLY TYRANT'
        ];
        this.displayName = nonsenseNames[Math.floor(Math.random() * nonsenseNames.length)];

        this.phase = 1;
        this.attackTelegraphTimer = 0;
        this.attackTelegraphDuration = 0;
        this.pendingAttack = null;

        // Aerial movement defaults
        this.movementState = 'WAVE';
        this.movementTimer = 3.5 + Math.random() * 3.0;
        this.anchorX = platform.x + platform.width / 2 - this.width / 2;
        this.anchorY = platform.y - this.height - 250;
        this.targetX = this.x;
        this.targetY = this.y;
        this.maxMoveSpeed = 560;
        this.repositionCooldown = 2.0 + Math.random() * 1.5;
        this.repositionBurstTimer = 0;
        this.aerialSwoopTimer = 0;
        this.aerialSwoopDuration = 0.75;
        this.aerialSwoopDepth = 0;
        this.aerialMinionPhase = Math.random() * Math.PI * 2;
        this.aerialMinionRadius = 88 + Math.random() * 24;

        // Spider-specific state
        this.spiderState = 'SCUTTLE';
        this.spiderStateTimer = 1.0 + Math.random() * 0.8;
        this.spiderDirection = Math.random() > 0.5 ? 1 : -1;
        this.spiderTargetX = this.x;
        this.webTelegraphDuration = 0.55;
        this.webTelegraphTimer = 0;
        this.spiderWebBurstShots = 0;
        this.spiderWebBurstTotal = 0;
        this.spiderWebBurstTimer = 0;
        this.spiderWebBurstInterval = 0.13;
        this.spiderWebBurstSpreads = [];
        this.spiderVenomCooldown = 1.8 + Math.random() * 1.0;
        this.spiderPounceCooldown = 2.2;
        this.spiderPounceTelegraph = 0;
        this.spiderPounceTimer = 0;
        this.spiderPounceDir = 0;

        // Dragon (boss_dragon) grounded fire-cone state
        this.dragonPatrolDir = Math.random() > 0.5 ? 1 : -1;
        this.dragonFireTelegraphTimer = 0;
        this.dragonFireTelegraphDuration = 0.9;
        this.dragonFireActiveTimer = 0;
        this.dragonFireDuration = 0.8;
        this.dragonFireRange = 370;
        this.dragonFireHalfAngle = Math.PI * 0.32;
        this.dragonFireHitTimer = 0;
        this.dragonConeAimOffset = 0;
        this.dragonConeSweepDir = Math.random() > 0.5 ? 1 : -1;
        this.dragonAttackPattern = 'cone'; // 'cone' | 'volley'
        this.dragonVolleyShots = 0;
        this.dragonVolleyTimer = 0;

        // Robot (boss_robot) grounded rush/grab/throw + wrench toss
        this.robotState = 'PATROL';
        this.robotPatrolDir = Math.random() > 0.5 ? 1 : -1;
        this.robotRushDir = 0;
        this.robotRushTimer = 0;
        this.robotRushCooldown = 1.5 + Math.random() * 0.8;
        this.robotGrabTimer = 0;
        this.robotWrenchCooldown = 1.4 + Math.random() * 0.7;
        this.robotWrenchTelegraphTimer = 0;
        this.robotWrenchTelegraphDuration = 0.34;
        this.robotQueuedWrenchDir = 1;
        this.robotThrowLightTimer = 0;
        this.robotThrowLightDuration = 0.62;
        this.robotThrowLightX = 0;
        this.robotThrowLightY = 0;

        switch (this.bossType) {
            case 'boss_chick': this.emoji = String.fromCodePoint(0x1F423); break;
            case 'boss_moai': this.emoji = String.fromCodePoint(0x1F5FF); break;
            case 'boss_hedgehog': this.emoji = String.fromCodePoint(0x1F47A); break;
            case 'boss_spider': this.emoji = String.fromCodePoint(0x1F577) + '\uFE0F'; break;
            case 'boss_dragon': this.emoji = String.fromCodePoint(0x1F409); break;
            case 'boss_robot': this.emoji = String.fromCodePoint(0x1F3CB) + '\uFE0F\u200D\u2642\uFE0F'; break;
            default: this.emoji = String.fromCodePoint(0x1F5FF); break;
        }
        this.minionEmoji = this.emoji;

        this._cachedEmoji = getEmojiCanvas(this.emoji, size);
    }

    _updatePhase() {
        const ratio = this.health / this.maxHealth;
        this.phase = ratio > 0.66 ? 1 : (ratio > 0.33 ? 2 : 3);
    }

    _angleDelta(a, b) {
        let d = a - b;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        return d;
    }

    _isPlayerInDragonFireCone(player) {
        if (!player || this.bossType !== 'boss_dragon') return false;
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const px = player.x + player.width / 2;
        const py = player.y + player.height / 2;
        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > this.dragonFireRange) return false;
        const facingAngle = (this.facingRight ? 0 : Math.PI) + this.dragonConeAimOffset;
        const playerAngle = Math.atan2(dy, dx);
        return Math.abs(this._angleDelta(playerAngle, facingAngle)) <= this.dragonFireHalfAngle;
    }

    takeDamage(amount, game) {
        this.health -= amount;
        this.damageFlashTimer = 0.15;
        this._updatePhase();

        if (game && game.particles) {
            game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
        }

        if (this.health <= 0) {
            this.markedForDeletion = true;
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            if (game && game.particles) {
                // Bigger, more obvious boss-defeat celebration burst.
                game.particles.emitFireworks(cx, cy);
                game.particles.emitFireworks(cx - 60, cy - 35);
                game.particles.emitFireworks(cx + 60, cy - 35);
                game.particles.emitDeath(cx, cy);
                game.particles.emitDeath(cx - 26, cy + 10);
                game.particles.emitDeath(cx + 26, cy + 10);
                for (let i = 0; i < 22; i++) {
                    const a = (i / 22) * Math.PI * 2;
                    const r = 130 + Math.random() * 90;
                    game.particles.emitDeath(
                        cx + Math.cos(a) * r,
                        cy + Math.sin(a) * r
                    );
                }
            }
            if (game && game.audio && typeof game.audio.playBossVictoryClimb === 'function') {
                game.audio.playBossVictoryClimb();
            }
            if (game && game.player) {
                game.player.score += 700;
            }
            if (game) game.enemiesDefeated++;
        }
    }

    _spawnProjectile(game, player, projectileType, speed, spreadAngle = 0, arcBias = 0) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const dx = (player.x + player.width / 2) - cx;
        const dy = (player.y + player.height / 2) - cy;
        const baseAngle = Math.atan2(dy, dx);
        const a = baseAngle + spreadAngle;

        const vx = Math.cos(a) * speed;
        const vy = Math.sin(a) * speed + arcBias;
        const proj = new BossProjectile(cx, cy, vx, vy, projectileType);
        game.enemyProjectiles.push(proj);
        this.facingRight = dx >= 0;
    }

    _queueAttack(player) {
        if (!player) return;

        const phaseScale = this.phase === 1 ? 1 : (this.phase === 2 ? 1.2 : 1.4);
        this.attackTelegraphDuration = 0.42 / phaseScale;
        this.attackTelegraphTimer = this.attackTelegraphDuration;

        if (this.bossType === 'boss_chick') {
            this.pendingAttack = {
                pattern: 'fan',
                projectile: 'drumstick',
                speed: 350 + this.phase * 18,
                arcBias: -70,
                spreads: this.phase >= 3 ? [-0.2, 0, 0.2] : (this.phase >= 2 ? [-0.12, 0.12] : [0])
            };
            this.attackCooldown = 1.8 - (this.phase - 1) * 0.2 + Math.random() * 0.5;
        } else if (this.bossType === 'boss_moai') {
            this.pendingAttack = {
                pattern: 'fan',
                projectile: 'stone',
                speed: 560 + this.phase * 35,
                arcBias: 0,
                spreads: this.phase >= 3 ? [-0.08, 0, 0.08] : [0]
            };
            this.attackCooldown = 2.2 - (this.phase - 1) * 0.15 + Math.random() * 0.55;
        } else if (this.bossType === 'boss_hedgehog') {
            const shots = this.phase >= 3 ? 4 : (this.phase >= 2 ? 3 : 2);
            this.pendingAttack = {
                pattern: 'burst',
                projectile: 'skewer',
                speed: 390 + this.phase * 22,
                arcBias: 0,
                shots,
                interval: Math.max(0.24, 0.38 - this.phase * 0.035),
                burstTimer: 0
            };
            this.attackCooldown = 2.75 - (this.phase - 1) * 0.18 + Math.random() * 0.7;
        }
    }

    _executeAttackStep(game, player, dt) {
        if (!this.pendingAttack || !player) return;

        if (this.pendingAttack.pattern === 'fan') {
            const spreads = this.pendingAttack.spreads || [0];
            for (let i = 0; i < spreads.length; i++) {
                this._spawnProjectile(game, player, this.pendingAttack.projectile, this.pendingAttack.speed, spreads[i], this.pendingAttack.arcBias || 0);
            }
            this.pendingAttack = null;
            return;
        }

        // Burst pattern
        this.pendingAttack.burstTimer -= dt;
        if (this.pendingAttack.burstTimer <= 0 && this.pendingAttack.shots > 0) {
            const swing = this.pendingAttack.shots % 2 === 0 ? -0.07 : 0.07;
            this._spawnProjectile(game, player, this.pendingAttack.projectile, this.pendingAttack.speed, swing, this.pendingAttack.arcBias || 0);
            this.pendingAttack.shots--;
            this.pendingAttack.burstTimer = this.pendingAttack.interval;
        }

        if (this.pendingAttack.shots <= 0) {
            this.pendingAttack = null;
        }
    }

    _updateAerialBoss(dt, game, player) {
        if (this.movementTimer > 0) this.movementTimer -= dt;
        if (this.repositionCooldown > 0) this.repositionCooldown -= dt;
        if (this.repositionBurstTimer > 0) this.repositionBurstTimer -= dt;
        if (this.aerialSwoopTimer > 0) this.aerialSwoopTimer -= dt;

        // Switch between path styles.
        if (this.movementTimer <= 0) {
            this.movementState = this.movementState === 'WAVE' ? 'ORBIT' : 'WAVE';
            this.movementTimer = 3.2 + Math.random() * 3.4;
        }

        // Occasional quick reposition keeps fights active but readable.
        if (this.repositionCooldown <= 0 && player) {
            const left = this.platform.x + 20;
            const right = this.platform.x + this.platform.width - this.width - 20;
            const desired = player.x + player.width / 2 + (Math.random() > 0.5 ? -260 : 260) - this.width / 2;
            this.targetX = Math.max(left, Math.min(right, desired));
            this.targetY = this.anchorY + 50 + Math.sin(this.timeAlive * 3.2) * 40;
            this.repositionBurstTimer = 0.48;
            this.repositionCooldown = 2.6 + Math.random() * 1.8;
            this.aerialSwoopTimer = this.aerialSwoopDuration;
            this.aerialSwoopDepth = 95 + Math.random() * 70;
        }

        if (this.movementState === 'WAVE') {
            this.targetX = this.anchorX + Math.sin(this.timeAlive * (0.8 + this.phase * 0.12)) * (this.platform.width * (0.32 + this.phase * 0.04));
            this.targetY = this.anchorY + Math.sin(this.timeAlive * 1.4) * (70 + this.phase * 10) + Math.cos(this.timeAlive * 0.75) * 45;
        } else {
            const radiusX = 210 + this.phase * 40;
            const radiusY = 110 + this.phase * 22;
            const speed = 1.0 + this.phase * 0.14;
            this.targetX = this.anchorX + Math.cos(this.timeAlive * speed) * radiusX;
            this.targetY = this.anchorY + Math.sin(this.timeAlive * speed) * radiusY;
        }

        // Lower aerial passes during swoops so grounded attacks can reach more reliably.
        const swoopProgress = this.aerialSwoopDuration > 0
            ? Math.max(0, Math.min(1, this.aerialSwoopTimer / this.aerialSwoopDuration))
            : 0;
        const swoopCurve = Math.sin((1 - swoopProgress) * Math.PI);
        this.targetY += this.aerialSwoopDepth * swoopCurve;

        const topY = this.platform.y - this.height - 430;
        const bottomY = this.platform.y - this.height - 26;
        this.targetY = Math.max(topY, Math.min(bottomY, this.targetY));

        const toTargetX = this.targetX - this.x;
        const toTargetY = this.targetY - this.y;
        const dist = Math.hypot(toTargetX, toTargetY);
        if (dist > 0) {
            const speedMult = this.repositionBurstTimer > 0 ? 1.9 : 1;
            const maxStep = this.maxMoveSpeed * (1 + this.phase * 0.08) * speedMult * dt;
            const step = Math.min(dist, maxStep);
            this.x += (toTargetX / dist) * step;
            this.y += (toTargetY / dist) * step;
        }

        if (this.attackTelegraphTimer > 0) {
            this.attackTelegraphTimer -= dt;
            if (this.attackTelegraphTimer <= 0) {
                this._executeAttackStep(game, player, dt);
            }
            return;
        }

        if (this.pendingAttack) {
            this._executeAttackStep(game, player, dt);
            return;
        }

        if (this.attackCooldown <= 0 && player) {
            this._queueAttack(player);
        }
    }

    _updateSpiderBoss(dt, game, player) {
        const left = this.platform.x + 8;
        const right = this.platform.x + this.platform.width - this.width - 8;
        this.y = this.platform.y - this.height;
        if (this.x < left) this.x = left;
        if (this.x > right) this.x = right;

        if (this.spiderPounceCooldown > 0) this.spiderPounceCooldown -= dt;
        if (this.spiderVenomCooldown > 0) this.spiderVenomCooldown -= dt;

        if (player) {
            const playerCenterX = player.x + player.width / 2;
            const spiderCenterX = this.x + this.width / 2;
            this.facingRight = playerCenterX > spiderCenterX;
        }

        if (this.spiderPounceTelegraph > 0) {
            this.spiderPounceTelegraph -= dt;
            this.vx = 0;
            if (this.spiderPounceTelegraph <= 0) {
                this.spiderPounceTimer = 0.25;
            }
            return;
        }

        if (this.spiderPounceTimer > 0) {
            this.spiderPounceTimer -= dt;
            this.vx = this.spiderPounceDir * (320 + this.phase * 30);
            this.x += this.vx * dt;
            this.x = Math.max(left, Math.min(right, this.x));
            return;
        }

        if (this.webTelegraphTimer > 0) {
            this.webTelegraphTimer -= dt;
            this.vx = 0;
            this.spiderState = 'TELEGRAPH';
            if (this.webTelegraphTimer <= 0 && player) {
                const burstCount = this.phase >= 3
                    ? (Math.random() < 0.45 ? 3 : 2)
                    : 2;
                this.spiderWebBurstTotal = burstCount;
                this.spiderWebBurstShots = burstCount;
                this.spiderWebBurstTimer = 0;
                this.spiderWebBurstInterval = 0.11 + Math.random() * 0.06;
                this.spiderWebBurstSpreads = burstCount === 3 ? [-0.14, 0, 0.14] : [-0.09, 0.09];
            }
            return;
        }

        if (this.spiderWebBurstShots > 0) {
            this.spiderWebBurstTimer -= dt;
            this.vx = 0;
            this.spiderState = 'TELEGRAPH';
            if (this.spiderWebBurstTimer <= 0 && player) {
                const shotIndex = this.spiderWebBurstTotal - this.spiderWebBurstShots;
                const spread = this.spiderWebBurstSpreads[Math.max(0, Math.min(shotIndex, this.spiderWebBurstSpreads.length - 1))] || 0;
                this._spawnProjectile(game, player, 'web', 430 + this.phase * 28, spread, -120);
                this.spiderWebBurstShots--;
                this.spiderWebBurstTimer = this.spiderWebBurstInterval;
                if (this.spiderWebBurstShots <= 0) {
                    this.attackCooldown = 1.9 + Math.random() * 1.1;
                    this.spiderState = 'PAUSE';
                    this.spiderStateTimer = 0.35;
                }
            }
            return;
        }

        if (this.attackCooldown <= 0 && player) {
            const venomChance = this.phase >= 3 ? 0.33 : (this.phase >= 2 ? 0.27 : 0.20);
            if (this.spiderVenomCooldown <= 0 && Math.random() < venomChance) {
                const toPlayer = (player.x + player.width / 2) - (this.x + this.width / 2);
                const dir = Math.sign(toPlayer) || (this.facingRight ? 1 : -1);
                const spawnX = this.x + this.width / 2 + dir * (this.width * 0.26);
                const spawnY = this.y + this.height * 0.2;
                const baseVx = 320 + this.phase * 34;
                const baseVy = 408 + this.phase * 30;
                const spreadMultipliers = [-0.40, -0.20, 0, 0.20, 0.40];
                for (let i = 0; i < spreadMultipliers.length; i++) {
                    const spread = spreadMultipliers[i];
                    const vx = dir * (baseVx + spread * 240 + Math.random() * 24);
                    const vy = -(baseVy - Math.abs(spread) * 58 + Math.random() * 24);
                    const shotY = spawnY - Math.abs(spread) * 10;
                    game.enemyProjectiles.push(new BossProjectile(spawnX, shotY, vx, vy, 'venom'));
                }
                this.attackCooldown = 1.7 + Math.random() * 0.95;
                this.spiderVenomCooldown = 2.3 + Math.random() * 1.7;
                this.spiderState = 'PAUSE';
                this.spiderStateTimer = 0.25 + Math.random() * 0.2;
                this.vx = 0;
                return;
            }

            if (Math.random() < (this.phase >= 3 ? 0.028 : 0.02)) {
                this.webTelegraphTimer = this.webTelegraphDuration;
                this.spiderState = 'TELEGRAPH';
                this.vx = 0;
                return;
            }
        }

        // Fair pounce when player is in medium range with a clear tell.
        if (this.spiderPounceCooldown <= 0 && player) {
            const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
            if (Math.abs(dx) > 90 && Math.abs(dx) < 280 && Math.random() < 0.015) {
                this.spiderPounceDir = Math.sign(dx) || (this.facingRight ? 1 : -1);
                this.spiderPounceTelegraph = 0.28;
                this.spiderPounceCooldown = 2.2 + Math.random() * 1.0;
                return;
            }
        }

        this.spiderStateTimer -= dt;
        if (this.spiderStateTimer <= 0) {
            if (this.spiderState === 'SCUTTLE') {
                this.spiderState = 'REPOSITION';
                this.spiderStateTimer = 0.55 + Math.random() * 0.55;
                if (player) {
                    const desired = player.x + player.width / 2 + (Math.random() > 0.5 ? -135 : 135) - this.width / 2;
                    this.spiderTargetX = Math.max(left, Math.min(right, desired));
                } else {
                    this.spiderTargetX = Math.max(left, Math.min(right, this.x + (Math.random() > 0.5 ? 120 : -120)));
                }
            } else if (this.spiderState === 'REPOSITION') {
                this.spiderState = 'PAUSE';
                this.spiderStateTimer = 0.28 + Math.random() * 0.32;
                this.vx = 0;
            } else {
                this.spiderState = 'SCUTTLE';
                this.spiderStateTimer = 0.7 + Math.random() * 0.9;
                this.spiderDirection = Math.random() > 0.5 ? 1 : -1;
            }
        }

        if (this.spiderState === 'SCUTTLE') {
            const scuttleSpeed = 170 + Math.sin(this.timeAlive * 8) * 18 + this.phase * 12;
            this.vx = this.spiderDirection * scuttleSpeed;
            this.x += this.vx * dt;
            if (this.x <= left || this.x >= right) {
                this.spiderDirection *= -1;
                this.x = Math.max(left, Math.min(right, this.x));
            }
        } else if (this.spiderState === 'REPOSITION') {
            const delta = this.spiderTargetX - this.x;
            const dir = Math.sign(delta);
            this.vx = dir * (150 + this.phase * 8);
            this.x += this.vx * dt;
            if (Math.abs(delta) < 8) {
                this.spiderState = 'PAUSE';
                this.spiderStateTimer = 0.25 + Math.random() * 0.25;
                this.vx = 0;
            }
        } else {
            this.vx = 0;
        }
    }

    _updateDragonBoss(dt, game, player) {
        const left = this.platform.x + 8;
        const right = this.platform.x + this.platform.width - this.width - 8;
        this.y = this.platform.y - this.height;
        this.x = Math.max(left, Math.min(right, this.x));

        if (this.dragonFireTelegraphTimer > 0) {
            this.dragonFireTelegraphTimer -= dt;
            this.vx = 0;
            if (this.dragonFireTelegraphTimer <= 0) {
                if (this.dragonAttackPattern === 'volley') {
                    this.dragonVolleyShots = this.phase >= 3 ? 6 : (this.phase >= 2 ? 5 : 4);
                    this.dragonVolleyTimer = 0;
                } else {
                    this.dragonFireActiveTimer = this.dragonFireDuration;
                    this.dragonFireHitTimer = 0;
                }
            }
            return;
        }

        if (this.dragonFireActiveTimer > 0) {
            this.dragonFireActiveTimer -= dt;
            this.vx = 0;
            this.dragonFireHitTimer -= dt;
            const fireProgress = 1 - Math.max(0, this.dragonFireActiveTimer / this.dragonFireDuration);
            this.dragonConeAimOffset = Math.sin(fireProgress * Math.PI * 1.25) * (0.18 + this.phase * 0.04) * this.dragonConeSweepDir;
            if (player && player.invulnerableTimer <= 0 && this.dragonFireHitTimer <= 0 && this._isPlayerInDragonFireCone(player)) {
                player.takeDamage(game);
                this.dragonFireHitTimer = 0.28;
            }
            if (this.dragonFireActiveTimer <= 0) {
                this.dragonConeAimOffset = 0;
                this.attackCooldown = 2.7 - (this.phase - 1) * 0.25 + Math.random() * 0.55;
            }
            return;
        }

        if (this.dragonVolleyShots > 0) {
            this.vx = 0;
            this.dragonConeAimOffset = 0;
            this.dragonVolleyTimer -= dt;
            if (this.dragonVolleyTimer <= 0 && player) {
                const shotIdx = this.dragonVolleyShots;
                const dir = this.facingRight ? 1 : -1;
                const spawnX = this.x + this.width / 2 + dir * (this.width * 0.22);
                const spawnY = this.y + this.height * 0.46;
                const speed = 360 + this.phase * 26 + (shotIdx % 2 === 0 ? 12 : -6);
                game.enemyProjectiles.push(new BossProjectile(spawnX, spawnY, dir * speed, 0, 'flame'));
                if (this.phase >= 3 && shotIdx % 3 === 0) {
                    game.enemyProjectiles.push(new BossProjectile(spawnX, spawnY + 10, dir * (335 + this.phase * 22), 0, 'flame'));
                }
                this.dragonVolleyShots--;
                this.dragonVolleyTimer = 0.16 + Math.random() * 0.08;
                if (this.dragonVolleyShots <= 0) {
                    this.attackCooldown = 2.35 - (this.phase - 1) * 0.18 + Math.random() * 0.55;
                }
            }
            return;
        }

        const patrolSpeed = 120 + this.phase * 10;
        this.vx = this.dragonPatrolDir * patrolSpeed;
        this.x += this.vx * dt;
        if (this.x <= left) {
            this.x = left;
            this.dragonPatrolDir = 1;
        } else if (this.x >= right) {
            this.x = right;
            this.dragonPatrolDir = -1;
        }

        if (player) {
            this.facingRight = (player.x + player.width / 2) > (this.x + this.width / 2);
        } else {
            this.facingRight = this.dragonPatrolDir > 0;
        }

        if (this.attackCooldown <= 0 && player) {
            this.dragonAttackPattern = Math.random() < (this.phase >= 2 ? 0.45 : 0.35) ? 'volley' : 'cone';
            this.dragonConeSweepDir = Math.random() > 0.5 ? 1 : -1;
            this.dragonConeAimOffset = 0;
            this.dragonFireTelegraphTimer = this.dragonAttackPattern === 'volley'
                ? (0.62 + Math.random() * 0.18)
                : this.dragonFireTelegraphDuration;
            this.vx = 0;
        }
    }

    _updateRobotBoss(dt, game, player) {
        const left = this.platform.x + 8;
        const right = this.platform.x + this.platform.width - this.width - 8;
        this.y = this.platform.y - this.height;
        this.x = Math.max(left, Math.min(right, this.x));

        if (this.robotRushCooldown > 0) this.robotRushCooldown -= dt;
        if (this.robotWrenchCooldown > 0) this.robotWrenchCooldown -= dt;
        if (this.robotThrowLightTimer > 0) this.robotThrowLightTimer -= dt;

        if (player && this.robotWrenchTelegraphTimer > 0) {
            this.robotWrenchTelegraphTimer -= dt;
            this.vx = 0;
            if (this.robotWrenchTelegraphTimer <= 0) {
                const dir = this.robotQueuedWrenchDir || (this.facingRight ? 1 : -1);
                const speed = 520 + this.phase * 45;
                const spawnX = this.x + this.width / 2 + dir * (this.width * 0.32);
                const spawnY = this.y + this.height * 0.52;
                game.enemyProjectiles.push(new BossProjectile(spawnX, spawnY, dir * speed, 0, 'wrench'));
                this.robotWrenchCooldown = 1.35 - (this.phase - 1) * 0.1 + Math.random() * 0.45;
            }
        } else if (player && this.robotWrenchCooldown <= 0) {
            const toPlayer = (player.x + player.width / 2) - (this.x + this.width / 2);
            this.robotQueuedWrenchDir = Math.sign(toPlayer) || (this.facingRight ? 1 : -1);
            this.robotWrenchTelegraphTimer = this.robotWrenchTelegraphDuration;
        }

        if (this.robotState === 'GRAB') {
            this.vx = 0;
            this.robotGrabTimer -= dt;
            if (player) {
                player.x = this.x + this.width / 2 - player.width / 2;
                player.y = this.y - player.height - 4;
                player.vx = 0;
                player.vy = 0;
            }
            if (this.robotGrabTimer <= 0 && player) {
                player.vx = 0;
                player.vy = -820;
                player.grounded = false;
                player.isJumping = true;
                if (typeof player.forceFullJump === 'boolean') player.forceFullJump = true;
                this.robotThrowLightTimer = this.robotThrowLightDuration;
                this.robotThrowLightX = player.x + player.width / 2;
                this.robotThrowLightY = player.y + player.height / 2;
                this.robotState = 'PATROL';
                this.robotRushCooldown = 2.4 + Math.random() * 1.1;
            }
            return;
        }

        if (this.robotState === 'RUSH') {
            this.robotRushTimer -= dt;
            this.vx = this.robotRushDir * (360 + this.phase * 14);
            this.x += this.vx * dt;
            if (this.x <= left || this.x >= right) {
                this.x = Math.max(left, Math.min(right, this.x));
                this.robotState = 'PATROL';
                this.robotRushCooldown = 1.5 + Math.random() * 0.7;
                return;
            }

            if (player && Physics.checkAABB(this, player.getHitbox())) {
                this.robotState = 'GRAB';
                this.robotGrabTimer = 0.22;
                this.vx = 0;
                this.facingRight = this.robotRushDir > 0;
                return;
            }

            if (this.robotRushTimer <= 0) {
                this.robotState = 'PATROL';
                this.robotRushCooldown = 1.4 + Math.random() * 0.9;
            }
            return;
        }

        // PATROL
        const patrolSpeed = 130 + this.phase * 10;
        this.vx = this.robotPatrolDir * patrolSpeed;
        this.x += this.vx * dt;
        if (this.x <= left) {
            this.x = left;
            this.robotPatrolDir = 1;
        } else if (this.x >= right) {
            this.x = right;
            this.robotPatrolDir = -1;
        }

        if (player) {
            const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
            this.facingRight = dx >= 0;
            const shouldRush = this.robotRushCooldown <= 0 && Math.abs(dx) < 340 && Math.random() < 0.03;
            if (shouldRush) {
                this.robotState = 'RUSH';
                this.robotRushDir = Math.sign(dx) || this.robotPatrolDir;
                this.robotRushTimer = 0.55;
                this.vx = 0;
            }
        } else {
            this.facingRight = this.robotPatrolDir > 0;
        }
    }

    update(dt, game) {
        if (this.damageFlashTimer > 0) this.damageFlashTimer -= dt;
        this.spawnFadeTimer += dt;
        if (game && game.player && !this.activated) {
            const dx = game.player.x - this.x;
            if (Math.abs(dx) < 600) {
                this.activated = true;
            }
        }

        if (!this.activated) return;
        this.timeAlive += dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        this._updatePhase();

        const player = game ? game.player : null;

        if (this.bossType === 'boss_spider') {
            this._updateSpiderBoss(dt, game, player);
        } else if (this.bossType === 'boss_dragon') {
            this._updateDragonBoss(dt, game, player);
        } else if (this.bossType === 'boss_robot') {
            this._updateRobotBoss(dt, game, player);
        } else {
            this._updateAerialBoss(dt, game, player);
        }

        if (player) {
            this.facingRight = (player.x + player.width / 2) > (this.x + this.width / 2);
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            this.distToPlayer = Math.hypot(dx, dy);
        } else {
            this.distToPlayer = Infinity;
        }

        // Contact damage is slightly forgiving while telegraphing/charging.
        const inFairWindow = this.attackTelegraphTimer > 0
            || this.webTelegraphTimer > 0
            || this.spiderPounceTelegraph > 0
            || this.dragonFireTelegraphTimer > 0
            || this.dragonVolleyShots > 0
            || this.robotWrenchTelegraphTimer > 0
            || this.robotState === 'RUSH'
            || this.robotState === 'GRAB';
        if (game && player && player.invulnerableTimer <= 0 && !inFairWindow) {
            if (Physics.checkAABB(this, player.getHitbox())) {
                player.takeDamage(game);
            }
        }
    }

    draw(ctx) {
        const damageAlpha = this.damageFlashTimer > 0
            ? (0.5 + Math.sin(this.damageFlashTimer * 40) * 0.5)
            : 1.0;
        const spawnAlpha = Math.min(1, this.spawnFadeTimer / this.spawnFadeDuration);
        const alpha = damageAlpha * spawnAlpha;

        ctx.save();
        ctx.globalAlpha = alpha;

        if (this.bossType !== 'boss_spider' && this.bossType !== 'boss_dragon') {
            ctx.shadowColor = 'rgba(255, 80, 0, 0.6)';
            ctx.shadowBlur = 20;
        }

        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        ctx.translate(cx, cy);
        const shouldFlipSprite = this.bossType === 'boss_dragon' ? this.facingRight : !this.facingRight;
        if (shouldFlipSprite) ctx.scale(-1, 1);

        if (this.attackTelegraphTimer > 0) {
            ctx.scale(1.06, 1.06);
        }
        if (this.spiderPounceTelegraph > 0) {
            ctx.scale(1.1, 0.9);
        }

        const cached = this._cachedEmoji;
        ctx.drawImage(cached.canvas, -cached.width / 2, -cached.height / 2);

        // Cosmetic wingmen for all bosses; visual flair only (no collision/damage).
        if (!this._bossMinionCache) this._bossMinionCache = getEmojiCanvas(this.minionEmoji, 24);
        const minionCount = 5;
        const orbitBase = (this.bossType === 'boss_spider' || this.bossType === 'boss_robot')
            ? (this.width * 0.38 + Math.sin(this.timeAlive * 2.3) * 6)
            : (this.aerialMinionRadius + Math.sin(this.timeAlive * 2.1) * 8);
        for (let i = 0; i < minionCount; i++) {
            const a = this.aerialMinionPhase + this.timeAlive * (this.bossType === 'boss_dragon' ? 1.8 : 1.45) + (i / minionCount) * Math.PI * 2;
            const mx = Math.cos(a) * orbitBase;
            const my = Math.sin(a * 1.2) * (orbitBase * 0.52) - this.height * 0.06;
            ctx.globalAlpha = alpha * (0.55 + 0.18 * Math.sin(this.timeAlive * 6 + i));
            ctx.drawImage(this._bossMinionCache.canvas, mx - this._bossMinionCache.width / 2, my - this._bossMinionCache.height / 2);
        }
        ctx.globalAlpha = alpha;

        if (this.bossType === 'boss_dragon') {
            if (!this._fireTellCache) this._fireTellCache = getEmojiCanvas(String.fromCodePoint(0x1F525), 28);
            const mouthX = -this.width * 0.22;

            if (this.dragonAttackPattern === 'cone' && (this.dragonFireTelegraphTimer > 0 || this.dragonFireActiveTimer > 0)) {
                const half = this.dragonFireHalfAngle;
                const fireRange = this.dragonFireRange;
                const rows = this.dragonFireTelegraphTimer > 0 ? 4 : 6;
                const telePulse = 0.45 + Math.sin(this.timeAlive * 20) * 0.3;
                for (let r = 1; r <= rows; r++) {
                    const t = r / (rows + 0.7);
                    const radius = fireRange * t * (0.84 + Math.sin(this.timeAlive * 5 + r) * 0.08);
                    const rowHalf = half * t;
                    const embers = Math.max(2, Math.floor(2 + r * 1.8));
                    for (let i = 0; i < embers; i++) {
                        const blend = embers <= 1 ? 0.5 : i / (embers - 1);
                        const a = (-rowHalf + blend * rowHalf * 2) + this.dragonConeAimOffset * (0.7 + 0.3 * t);
                        const fx = mouthX + Math.cos(a) * radius * -1;
                        const fy = Math.sin(a) * radius * 0.9;
                        const flicker = 0.75 + Math.sin(this.timeAlive * 11 + r * 0.8 + i) * 0.25;
                        const alphaMul = this.dragonFireTelegraphTimer > 0 ? (0.12 + telePulse * 0.28) : (0.25 + 0.22 * flicker);
                        ctx.globalAlpha = alpha * alphaMul;
                        ctx.drawImage(this._fireTellCache.canvas, fx - this._fireTellCache.width / 2, fy - this._fireTellCache.height / 2);
                    }
                }
                ctx.globalAlpha = alpha;
                ctx.drawImage(this._fireTellCache.canvas, mouthX - this._fireTellCache.width * 0.35, -this._fireTellCache.height / 2);
            } else if (this.dragonAttackPattern === 'volley' && this.dragonFireTelegraphTimer > 0) {
                const pulse = 0.6 + Math.sin(this.timeAlive * 24) * 0.4;
                for (let i = 0; i < 3; i++) {
                    const a = this.timeAlive * 2.5 + (i / 3) * Math.PI * 2;
                    const rx = Math.cos(a) * (24 + i * 4);
                    const ry = -this.height * 0.45 + Math.sin(a * 1.3) * 12;
                    ctx.globalAlpha = alpha * (0.35 + pulse * 0.45);
                    ctx.drawImage(this._fireTellCache.canvas, rx - this._fireTellCache.width / 2, ry - this._fireTellCache.height / 2);
                }
                ctx.globalAlpha = alpha;
            } else if (this.dragonVolleyShots > 0) {
                const pulse = 0.55 + Math.sin(this.timeAlive * 18) * 0.35;
                ctx.globalAlpha = alpha * (0.35 + pulse * 0.35);
                ctx.drawImage(this._fireTellCache.canvas, mouthX - this._fireTellCache.width * 0.35, -this._fireTellCache.height / 2);
                ctx.globalAlpha = alpha;
            }
        }

        const isTelegraphing = this.attackTelegraphTimer > 0 || this.webTelegraphTimer > 0 || this.spiderPounceTelegraph > 0 || this.dragonFireTelegraphTimer > 0;
        if (isTelegraphing) {
            const pulse = 0.55 + Math.sin(this.timeAlive * 24) * 0.45;
            if (!this._warnCache) this._warnCache = getEmojiCanvas(String.fromCodePoint(0x26A0) + '\uFE0F', 26);
            ctx.globalAlpha = 0.45 + pulse * 0.55;
            ctx.drawImage(this._warnCache.canvas, -this._warnCache.width / 2, -this.height / 2 - 30);
            ctx.globalAlpha = alpha;
        }

        if (this.bossType === 'boss_spider' && this.webTelegraphTimer > 0) {
            if (!this._webTellCache) this._webTellCache = getEmojiCanvas(String.fromCodePoint(0x1F578) + '\uFE0F', 28);
            ctx.drawImage(this._webTellCache.canvas, -this._webTellCache.width / 2, -this.height / 2 - 56);
        }

        if (this.bossType === 'boss_robot' && this.robotWrenchTelegraphTimer > 0) {
            if (!this._wrenchTellCache) this._wrenchTellCache = getEmojiCanvas(String.fromCodePoint(0x2692) + '\uFE0F', 28);
            const pulse = 0.7 + Math.sin(this.timeAlive * 28) * 0.3;
            ctx.globalAlpha = alpha * Math.max(0.45, pulse);
            ctx.drawImage(this._wrenchTellCache.canvas, -this._wrenchTellCache.width / 2, -this.height / 2 - 54);
            ctx.globalAlpha = alpha;
        }

        ctx.restore();

        if (this.bossType === 'boss_robot' && this.robotThrowLightTimer > 0) {
            const t = Math.max(0, this.robotThrowLightTimer / this.robotThrowLightDuration);
            const beamW = 62 + (1 - t) * 30;
            const beamH = 280 + (1 - t) * 120;
            const bx = this.robotThrowLightX - beamW / 2;
            const by = this.robotThrowLightY - beamH * 0.72;
            const beamGrad = ctx.createLinearGradient(0, by, 0, by + beamH);
            beamGrad.addColorStop(0, `rgba(120, 210, 255, ${0.05 + t * 0.24})`);
            beamGrad.addColorStop(0.45, `rgba(70, 180, 255, ${0.12 + t * 0.32})`);
            beamGrad.addColorStop(1, `rgba(40, 120, 255, ${0.03 + t * 0.16})`);
            ctx.save();
            ctx.fillStyle = beamGrad;
            if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(bx, by, beamW, beamH, 18);
                ctx.fill();
            } else {
                ctx.fillRect(bx, by, beamW, beamH);
            }
            ctx.restore();
        }

        if (this.activated && this.bossType !== 'boss_spider') {
            const barW = this.width * 1.1;
            const barH = 12;
            const barX = this.x + (this.width - barW) / 2;
            const barY = this.y - 22;
            const fillRatio = Math.max(0, this.health / this.maxHealth);

            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

            let barColor;
            if (fillRatio > 0.6) barColor = '#4caf50';
            else if (fillRatio > 0.3) barColor = '#ffc107';
            else barColor = '#f44336';

            ctx.fillStyle = barColor;
            ctx.fillRect(barX, barY, barW * fillRatio, barH);

            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barW, barH);
        }
    }
}
