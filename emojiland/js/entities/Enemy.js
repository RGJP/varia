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
import { triggerBombExplosionAt } from './Bomb.js';
import { getEmojiCanvas } from '../EmojiCache.js';
import { BossProjectile } from './BossProjectile.js';

const BOSS_TYPES = ['boss_chick', 'boss_moai', 'boss_tengu', 'boss_spider', 'boss_dragon', 'boss_manliftingweights', 'boss_lobster', 'boss_kangaroo', 'boss_monkey', 'boss_mammoth', 'boss_trex', 'boss_mosquito', 'boss_beetle', 'boss_juggler', 'boss_honeybee'];

const TYPE_PATROL = 'patrol';
const TYPE_CHASER = 'chaser'; // 👹
const TYPE_JUMPER = 'jumper'; // 🐸
const TYPE_SHOOTER = 'shooter'; // 🐡
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
const TYPE_JELLYFISH = 'jellyfish'; // 🪼
const TYPE_LOBSTER_MINION = 'lobster_minion'; // 🦞
const TYPE_PEACOCK = 'peacock'; // 🦚
const TYPE_ENRAGED = 'enraged'; // 😡

export class Enemy extends Entity {
    constructor(x, y, platform) {
        let type, width, height, emoji, baseSpeed, health;

        // All enemy types with equal spawn chance
        const ENEMY_POOL = [
            { type: TYPE_PATROL, width: 58, height: 58, emoji: '🐢', baseSpeed: 50, health: 2 },
            { type: TYPE_CHASER, width: 55, height: 55, emoji: '👹', baseSpeed: 100, health: 4 },
            { type: TYPE_JUMPER, width: 52, height: 52, emoji: '🐸', baseSpeed: 64, health: 2 },
            { type: TYPE_SHOOTER, width: 50, height: 60, emoji: '🐡', baseSpeed: 75, health: 3 },
            { type: TYPE_EAGLE, width: 56, height: 56, emoji: '🦅', baseSpeed: 90, health: 2 },
            { type: TYPE_OWL, width: 40, height: 40, emoji: '🦉', baseSpeed: 90, health: 2 },
            { type: TYPE_CROW, width: 48, height: 48, emoji: '🐦‍⬛', baseSpeed: 120, health: 1 },
            { type: TYPE_GHOST, width: 45, height: 45, emoji: '👻', baseSpeed: 40, health: 2 },
            { type: TYPE_ZOMBIE, width: 54, height: 64, emoji: '🧟‍♂️', baseSpeed: 30, health: 3 },
            { type: TYPE_DINO, width: 98, height: 98, emoji: '🦕', baseSpeed: 60, health: 5 },
            { type: TYPE_SQUID, width: 58, height: 58, emoji: '🦑', baseSpeed: 90, health: 2 },
            { type: TYPE_LIZARD, width: 54, height: 54, emoji: '🦗', baseSpeed: 40, health: 2 },
            { type: TYPE_CRAB, width: 56, height: 56, emoji: '🦀', baseSpeed: 220, health: 2 },
            { type: TYPE_SQUIRREL, width: 44, height: 44, emoji: '🐿️', baseSpeed: 160, health: 2 },
            { type: TYPE_TROLL, width: 76, height: 76, emoji: '🧌', baseSpeed: 40, health: 6 },
            { type: TYPE_ALIEN, width: 62, height: 62, emoji: '🛸', baseSpeed: 80, health: 4 },
            { type: TYPE_APE, width: 78, height: 78, emoji: '🦍', baseSpeed: 0, health: 5 },
            { type: TYPE_SPIDER, width: 70, height: 70, emoji: '🕷️', baseSpeed: 100, health: 4 },
            { type: TYPE_PEACOCK, width: 66, height: 66, emoji: '🦚', baseSpeed: 70, health: 3 },
            { type: TYPE_ENRAGED, width: 55, height: 55, emoji: '😡', baseSpeed: 95, health: 3 },
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
        this.turtleFlipped = false;
        this.turtleFlipTimer = 0;
        this.turtleRecovering = false;
        this.turtleRecoverTimer = 0;
        this.turtleRecoverDuration = 0.32;
        this.shellHitCooldownTimer = 0;
        this.alienStompCount = 0;
        this.countsForCompletionObjective = true;
        this.deathPopDuration = 0;
        this.deathPopTimer = 0;
        this._deathPopCache = null;

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
            this.toxicCloudBaseRadius = 130;
            this.toxicCloudPulse = Math.random() * Math.PI * 2;
            this.toxicCloudDamageCooldown = 0;
            this.toxicCloudTick = 0.6;
            this._toxicSkullCache = getEmojiCanvas('💀', 18);
        }
        if (this.type === TYPE_APE) {
            this.state = 'IDLE';
        }
        if (this.type === TYPE_SPIDER || this.type === TYPE_MINI_SPIDER) {
            this.state = 'PATROL';
            this.stateTimer = 1.0 + Math.random() * 1.0; // Jump timer
        }
        if (this.type === TYPE_PEACOCK) {
            this.state = 'PATROL';
            this.stateTimer = 0.6 + Math.random() * 0.8;
            this.peacockFacingPlayer = false;
            this._peacockMirrorCache = getEmojiCanvas('🪞', 32);
        }
        if (this.type === TYPE_ENRAGED) {
            this.state = 'PATROL';
            this.kamikazeArmed = false;
            this.kamikazeCountdownDuration = 3.0;
            this.kamikazeCountdown = 0;
        }
        if (this.type === TYPE_SHOOTER) {
            this.attackCooldown = 0.35 + Math.random() * 1.25;
        }

        // Keep shooter visually larger without changing gameplay hitbox/mechanics.
        const emojiRenderSize = this.type === TYPE_SHOOTER ? Math.round(this.height * 1.25) : this.height;
        this._cachedEmoji = getEmojiCanvas(this.emoji, emojiRenderSize);
        this._tongueRect = { x: 0, y: 0, width: 0, height: 0 };
    }

    isFacingWorldX(worldX) {
        const centerX = this.x + this.width / 2;
        return this.facingRight ? worldX >= centerX : worldX <= centerX;
    }

    shouldReflectRock(rock, game) {
        if (this.type !== TYPE_PEACOCK || !rock || rock.reflectedByEnemy) return false;
        const rockCenterX = rock.x + rock.width / 2;
        if (!this.isFacingWorldX(rockCenterX)) return false;

        this.damageFlashTimer = Math.max(this.damageFlashTimer, 0.08);
        if (game?.particles) game.particles.emitHit(rockCenterX, rock.y + rock.height / 2);
        if (game?.audio) game.audio.playHit();
        return true;
    }

    takeDamage(amount, game) {
        if (this.markedForDeletion) return;

        if (this.type === TYPE_ENRAGED) {
            this.damageFlashTimer = 0.2;
            if (game && game.particles) {
                game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
            }
            if (!this.kamikazeArmed) {
                this.kamikazeArmed = true;
                this.kamikazeCountdown = this.kamikazeCountdownDuration;
                if (game && game.audio) game.audio.playHit();
            }
            return;
        }

        // Jellyfish are stomp-only enemies.
        if (this.type === TYPE_JELLYFISH) {
            if (game && game.particles) game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
            return;
        }

        const isTurtle = this.type === TYPE_PATROL && this.emoji === '🐢';
        const isFlippedShell = isTurtle && this.turtleFlipped && Math.abs(this.vx) <= 1;
        if (isFlippedShell) {
            // Flipped turtle now transitions into shell-slide on next damage instead of dying.
            let kickDir = this.facingRight ? 1 : -1;
            if (game && game.player) {
                const turtleCenterX = this.x + this.width / 2;
                const playerCenterX = game.player.x + game.player.width / 2;
                // Kick away from the player's side for readable, controllable behavior.
                kickDir = turtleCenterX >= playerCenterX ? 1 : -1;
            }
            this.kickShell(kickDir, game);
            return;
        }

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
                if (this._shouldUseLowPerfDeathPop(game)) this._startDeathPop();
                if (game && game.particles) {
                    const cx = this.x + this.width / 2;
                    const cy = this.y + this.height / 2;
                    game.particles.emitDeath(cx, cy);
                    if (this.type === TYPE_TROLL) {
                        game.particles.clearGreenSmoke(cx, cy);
                    }
                }
                if (game && game.player) game.player.score += 50;
                if (game && typeof game.registerEnemyDefeat === 'function') game.registerEnemyDefeat(this);

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
                        mini.countsForCompletionObjective = false;
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
        if (this.markedForDeletion) {
            if (this.deathPopTimer > 0) {
                this.deathPopTimer = Math.max(0, this.deathPopTimer - dt);
            }
            return;
        }

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
        if (this.turtleFlipped && this.turtleFlipTimer > 0) this.turtleFlipTimer = Math.max(0, this.turtleFlipTimer - dt);
        if (this.turtleRecovering && this.turtleRecoverTimer > 0) this.turtleRecoverTimer = Math.max(0, this.turtleRecoverTimer - dt);
        if (this.shellHitCooldownTimer > 0) this.shellHitCooldownTimer = Math.max(0, this.shellHitCooldownTimer - dt);
        if (this.type === TYPE_TROLL) {
            this.toxicCloudPulse += dt * 2.4;
            if (this.toxicCloudDamageCooldown > 0) {
                this.toxicCloudDamageCooldown = Math.max(0, this.toxicCloudDamageCooldown - dt);
            }
        }
        if (this.type === TYPE_ENRAGED && this.kamikazeArmed && !this.markedForDeletion) {
            this.kamikazeCountdown = Math.max(0, this.kamikazeCountdown - dt);
            if (this.kamikazeCountdown <= 0) {
                this._triggerKamikazeExplosion(game);
                return;
            }
        }

        let player = game ? game.player : null;
        let distToPlayerX = player ? player.x - this.x : Infinity;
        let distToPlayerY = player ? player.y - this.y : Infinity;
        let distToPlayer = Math.hypot(distToPlayerX, distToPlayerY);
        if (this.type === TYPE_PEACOCK) {
            const playerCenterX = player ? (player.x + player.width / 2) : null;
            this.peacockFacingPlayer = !!player && this.isFacingWorldX(playerCenterX);
        }

        switch (this.type) {
            case TYPE_PATROL: this.updatePatrol(dt); break;
            case TYPE_CHASER: this.updateChaser(dt, game, player, distToPlayer, distToPlayerX); break;
            case TYPE_JUMPER: this.updateJumper(dt, player, distToPlayer, game); break;
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
            case TYPE_JELLYFISH: this.updateJellyfish(dt, player); break;
            case TYPE_LOBSTER_MINION: this.updateLobsterMinion(dt); break;
            case TYPE_PEACOCK: this.updatePatrol(dt); break;
            case TYPE_ENRAGED: this.updateEnraged(dt, game); break;
        }

        if (this.type === TYPE_TROLL && game) {
            if (player && player.invulnerableTimer <= 0) {
                const cloudRadius = this.toxicCloudBaseRadius + Math.sin(this.toxicCloudPulse) * 16 + 14;
                const cx = this.x + this.width / 2;
                const cy = this.y + this.height / 2;
                const pcx = player.x + player.width / 2;
                const pcy = player.y + player.height / 2;
                if (Math.hypot(pcx - cx, pcy - cy) < cloudRadius && this.toxicCloudDamageCooldown <= 0) {
                    player.takeDamage(game);
                    this.toxicCloudDamageCooldown = this.toxicCloudTick;
                }
            }
        }

        if (this.type !== TYPE_FLYER && this.type !== TYPE_BIRD && this.type !== TYPE_EAGLE && this.type !== TYPE_OWL && this.type !== TYPE_CROW && this.type !== TYPE_GHOST && this.type !== TYPE_SQUID && this.type !== TYPE_SHOOTER && this.type !== TYPE_ALIEN && this.type !== TYPE_JELLYFISH) {
            const prevX = this.x;
            const prevY = this.y;
            this.vy += Physics.GRAVITY * dt;
            if (this.vy > Physics.TERMINAL_VELOCITY) this.vy = Physics.TERMINAL_VELOCITY;

            this.x += this.vx * dt;
            this.y += this.vy * dt;

            // Spiders in JUMP state are free to leave their platform
            const isSpiderJumping = (this.type === TYPE_SPIDER || this.type === TYPE_MINI_SPIDER) && this.state === 'JUMP';
            const isJumperJumping = this.type === TYPE_JUMPER && this.state === 'JUMP';
            const isEnragedJumping = this.type === TYPE_ENRAGED && this.state === 'JUMP';
            const isSlidingShell = this.type === TYPE_PATROL &&
                this.emoji === '🐢' &&
                this.turtleFlipped &&
                !this.turtleRecovering &&
                Math.abs(this.vx) > 1;

            if (isSlidingShell && game) {
                this._resolveSlidingShellWorldCollisions(game, prevX, prevY);
            }

            if (!isSpiderJumping && !isJumperJumping && !isEnragedJumping && !isSlidingShell) {
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

            // Only allow fallback "home platform" snap when crossing the top plane.
            // This prevents shells from being teleported back to platform tops from side/bottom contacts.
            const homeLandingTolerance = 14;
            const crossedHomeTop = this.platform && (prevY + this.height <= this.platform.y + homeLandingTolerance);

            // Spiders can land on ANY platform, not just their home platform
            if (this.vy > 0 && ((this.type === TYPE_SPIDER || this.type === TYPE_MINI_SPIDER) || isJumperJumping || isEnragedJumping) && game) {
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
                            if (this.type === TYPE_JUMPER) {
                                this.state = 'IDLE';
                                this.stateTimer = 0.1 + Math.random() * 0.2;
                                this.vx = 0;
                                if (game && game.particles) game.particles.emitHit(this.x + this.width / 2, this.y + this.height);
                            } else {
                                this.state = 'PATROL';
                            }
                            if (this.type === TYPE_SPIDER || this.type === TYPE_MINI_SPIDER) {
                                this.stateTimer = 1.0 + Math.random() * 2.0;
                            }
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
                                if (this.type === TYPE_JUMPER) {
                                    this.state = 'IDLE';
                                    this.stateTimer = 0.1 + Math.random() * 0.2;
                                    this.vx = 0;
                                    if (game && game.particles) game.particles.emitHit(this.x + this.width / 2, this.y + this.height);
                                } else {
                                    this.state = 'PATROL';
                                }
                                if (this.type === TYPE_SPIDER || this.type === TYPE_MINI_SPIDER) {
                                    this.stateTimer = 1.0 + Math.random() * 2.0;
                                }
                            }
                            landed = true;
                            break;
                        }
                    }
                }
            } else if (
                !isSlidingShell &&
                this.vy > 0 &&
                crossedHomeTop &&
                this.y + this.height >= this.platform.y &&
                this.x + this.width > this.platform.x &&
                this.x < this.platform.x + this.platform.width
            ) {
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

            if (game && this.y > game.lowestY + 120) {
                if (!this.markedForDeletion) {
                    this.markedForDeletion = true;
                    if (this._shouldUseLowPerfDeathPop(game)) this._startDeathPop();
                    if (game.particles) {
                        game.particles.emitDeath(this.x + this.width / 2, game.lowestY - 10);
                    }
                    if (typeof game.registerEnemyDefeat === 'function') {
                        game.registerEnemyDefeat(this);
                    }
                }
                return;
            }
        } else {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
        }

        this.tryDamageEnemiesAsSlidingShell(game);
    }

    updatePatrol(dt) {
        if (this.turtleFlipped) {
            this.state = Math.abs(this.vx) > 1 ? 'SHELL_SLIDE' : 'SHELL';
            return;
        }
        this.state = 'PATROL';
        this.speed = this.baseSpeed;
        this.vx = this.facingRight ? this.speed : -this.speed;
    }

    updateLobsterMinion(dt) {
        if (this.stateTimer > 0) this.stateTimer -= dt;
        this.state = 'SCUTTLE';
        this.speed = this.baseSpeed;
        this.vx = this.facingRight ? this.speed : -this.speed;
        if (this.stateTimer <= 0) {
            this.facingRight = !this.facingRight;
            this.stateTimer = 0.35 + Math.random() * 0.7;
        }
    }

    updateEnraged(dt, game) {
        if (!this.kamikazeArmed || !game || !game.enemies) {
            this.updatePatrol(dt);
            return;
        }
        if (this.state === 'JUMP') return;

        // During countdown, home toward the nearest enemy (prefer same platform)
        // so the player can intentionally route the explosion into enemy packs.
        let target = null;
        let bestScore = Infinity;
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const enemies = game.enemies;
        for (let i = 0; i < enemies.length; i++) {
            const other = enemies[i];
            if (!other || other === this || other.markedForDeletion) continue;
            const ox = other.x + other.width / 2;
            const oy = other.y + other.height / 2;
            const dx = ox - cx;
            const dy = oy - cy;
            const dist = Math.hypot(dx, dy);
            const samePlatform = other.platform === this.platform;
            const score = dist + (samePlatform ? 0 : 900);
            if (score < bestScore) {
                bestScore = score;
                target = other;
            }
        }

        if (!target) {
            this.updatePatrol(dt);
            return;
        }

        const tx = target.x + target.width / 2;
        const dir = tx >= cx ? 1 : -1;
        this.facingRight = dir > 0;
        this.state = 'PATROL';
        this.speed = Math.max(this.baseSpeed * 1.45, 165);
        this.vx = dir * this.speed;

        // If target is on another platform and we're at the edge, jump across.
        if (target.platform && target.platform !== this.platform && Math.abs(this.vy) < 1) {
            const edgeMargin = 18;
            const atEdge = dir > 0
                ? (this.x + this.width >= this.platform.x + this.platform.width - edgeMargin)
                : (this.x <= this.platform.x + edgeMargin);
            if (atEdge) {
                this._startEnragedJumpToPlatform(target.platform, dir);
            }
        }
    }

    _startEnragedJumpToPlatform(targetPlat, fallbackDir = 1) {
        if (!targetPlat) return;

        const startY = this.y + this.height;
        const startX = this.x + this.width / 2;
        let targetX = targetPlat.x + targetPlat.width / 2 + (Math.random() - 0.5) * (targetPlat.width * 0.45);
        if (targetX < targetPlat.x + 10) targetX = targetPlat.x + 10;
        if (targetX > targetPlat.x + targetPlat.width - 10) targetX = targetPlat.x + targetPlat.width - 10;
        const targetY = targetPlat.y;

        const dy = targetY - startY;
        const dx = targetX - startX;
        const apex = Math.min(startY - 120, targetY - 60);
        const h = Math.max(30, startY - apex);
        this.vy = -Math.sqrt(2 * Physics.GRAVITY * h);

        const a = 0.5 * Physics.GRAVITY;
        const b = this.vy;
        const c = -dy;
        const discriminant = b * b - 4 * a * c;
        if (discriminant >= 0) {
            const t = (-b + Math.sqrt(discriminant)) / (2 * a);
            this.vx = dx / Math.max(0.12, t);
        } else {
            this.vy = -430;
            this.vx = (fallbackDir >= 0 ? 1 : -1) * 220;
        }

        this.facingRight = this.vx > 0;
        this.state = 'JUMP';
    }

    _triggerKamikazeExplosion(game) {
        if (this.markedForDeletion) return;
        this.markedForDeletion = true;
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        if (game && game.player) game.player.score += 50;
        if (game && typeof game.registerEnemyDefeat === 'function') game.registerEnemyDefeat(this);
        triggerBombExplosionAt(game, cx, cy, this);
    }

    stomp(game) {
        if (this.type === TYPE_JELLYFISH) {
            this.markedForDeletion = true;
            if (this._shouldUseLowPerfDeathPop(game)) this._startDeathPop();
            if (game && game.particles) game.particles.emitDeath(this.x + this.width / 2, this.y + this.height / 2);
            if (game && game.player) game.player.score += 50;
            if (game && typeof game.registerEnemyDefeat === 'function') game.registerEnemyDefeat(this);
            return;
        }

        if (this.type === TYPE_ALIEN) {
            this.alienStompCount += 1;
            if (this.alienStompCount >= 3) this.takeDamage(this.health, game);
            else this.takeDamage(1, game);
            return;
        }

        const isTurtle = this.type === TYPE_PATROL && this.emoji === '🐢';
        if (!isTurtle) {
            this.takeDamage(this.health, game);
            return;
        }

        // Mario-style shell behavior:
        // first stomp flips the turtle on its back (still alive),
        // next hit while flipped launches shell-slide.
        if (!this.turtleFlipped) {
            this.turtleFlipped = true;
            this.turtleFlipTimer = 2.0;
            this.turtleRecovering = false;
            this.turtleRecoverTimer = 0;
            this.state = 'SHELL';
            this.vx = 0;
            this.vy = 0;
            this.health = Math.max(1, this.health - 1);
            this.damageFlashTimer = 0.14;
            if (game && game.particles) {
                game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
            }
            return;
        }

        this.takeDamage(this.health, game);
    }

    kickShell(kickDir, game) {
        const isTurtle = this.type === TYPE_PATROL && this.emoji === '🐢';
        if (!isTurtle || !this.turtleFlipped) return false;

        const dir = kickDir >= 0 ? 1 : -1;
        this.facingRight = dir > 0;
        this.state = 'SHELL_SLIDE';
        this.vx = dir * 620;
        this.vy = 0;
        this.damageFlashTimer = 0.08;
        this.shellHitCooldownTimer = 0;
        if (game && game.audio) game.audio.playHit();
        if (game && game.particles) {
            game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2);
        }
        return true;
    }

    tryDamageEnemiesAsSlidingShell(game) {
        const isSlidingShell = this.type === TYPE_PATROL &&
            this.emoji === '🐢' &&
            this.turtleFlipped &&
            !this.turtleRecovering &&
            Math.abs(this.vx) > 1;
        if (!isSlidingShell || !game || !game.enemies || this.shellHitCooldownTimer > 0) return;

        for (let i = 0; i < game.enemies.length; i++) {
            const target = game.enemies[i];
            if (!target || target === this || target.markedForDeletion || !target.takeDamage) continue;
            if (!Physics.checkAABB(this, target)) continue;
            target.takeDamage(1, game);
            this.shellHitCooldownTimer = 0.08;
            break;
        }
    }

    _resolveSlidingShellWorldCollisions(game, prevX, prevY) {
        if (!game) return;
        const allPlats = [];
        if (game.platforms) {
            for (let i = 0; i < game.platforms.length; i++) allPlats.push(game.platforms[i]);
        }
        if (game.movingPlatforms) {
            for (let i = 0; i < game.movingPlatforms.length; i++) allPlats.push(game.movingPlatforms[i]);
        }

        for (let i = 0; i < allPlats.length; i++) {
            const p = allPlats[i];
            if (!p || !Physics.checkAABB(this, p)) continue;

            const overlapX = Math.min(this.x + this.width, p.x + p.width) - Math.max(this.x, p.x);
            const overlapY = Math.min(this.y + this.height, p.y + p.height) - Math.max(this.y, p.y);
            if (overlapX <= 0 || overlapY <= 0) continue;

            const prevRight = prevX + this.width;
            const prevLeft = prevX;
            const prevTop = prevY;
            const prevBottom = prevY + this.height;
            const sideSkin = 6;
            const verticalSkin = 1.25;

            const cameFromLeft = prevRight <= p.x + sideSkin;
            const cameFromRight = prevLeft >= p.x + p.width - sideSkin;
            // Keep top/bottom crossing strict to avoid side corner contacts being
            // misread as "from above/below" and snapping shells back onto ledges.
            const cameFromAbove = prevBottom <= p.y + verticalSkin;
            const cameFromBelow = prevTop >= p.y + p.height - verticalSkin;

            // Shells are primarily horizontal movers; prefer side resolution unless
            // we clearly crossed the top/bottom plane this frame.
            const preferHorizontal = Math.abs(this.vx) >= Math.abs(this.vy);

            if ((cameFromLeft || cameFromRight) && (overlapX <= overlapY + 2 || preferHorizontal)) {
                if (cameFromLeft) {
                    this.x = p.x - this.width - 0.01;
                    this.vx = -Math.abs(this.vx);
                    this.facingRight = false;
                } else {
                    this.x = p.x + p.width + 0.01;
                    this.vx = Math.abs(this.vx);
                    this.facingRight = true;
                }
                continue;
            }

            if ((cameFromAbove || cameFromBelow) && overlapY <= overlapX + 2) {
                if (cameFromAbove && this.vy >= 0) {
                    this.y = p.y - this.height;
                    this.vy = 0;
                    this.platform = p;
                } else if (cameFromBelow && this.vy <= 0) {
                    this.y = p.y + p.height + 0.01;
                    if (this.vy < 0) this.vy = 0;
                }
                continue;
            }

            if (overlapX < overlapY || preferHorizontal) {
                if (this.x + this.width / 2 < p.x + p.width / 2) {
                    this.x = p.x - this.width - 0.01;
                    this.vx = -Math.abs(this.vx);
                    this.facingRight = false;
                } else {
                    this.x = p.x + p.width + 0.01;
                    this.vx = Math.abs(this.vx);
                    this.facingRight = true;
                }
            } else {
                if (cameFromAbove && this.vy >= 0) {
                    this.y = p.y - this.height;
                    this.vy = 0;
                    this.platform = p;
                } else if (cameFromBelow && this.vy <= 0) {
                    this.y = p.y + p.height + 0.01;
                    if (this.vy < 0) this.vy = 0;
                } else {
                    // Ambiguous corner contact: resolve sideways to avoid popping up to platform tops.
                    if (this.x + this.width / 2 < p.x + p.width / 2) {
                        this.x = p.x - this.width - 0.01;
                        this.vx = -Math.abs(this.vx);
                        this.facingRight = false;
                    } else {
                        this.x = p.x + p.width + 0.01;
                        this.vx = Math.abs(this.vx);
                        this.facingRight = true;
                    }
                }
            }
        }
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

    updateJumper(dt, player, dist, game) {
        this.stateTimer -= dt;
        if (this.state === 'IDLE' && this.stateTimer <= 0) {
            this.state = 'JUMP';
            const startY = this.y + this.height;
            const startX = this.x + this.width / 2;
            let targetPlat = null;

            if (game) {
                const allPlats = [];
                for (let i = 0; i < game.platforms.length; i++) allPlats.push(game.platforms[i]);
                if (game.movingPlatforms) {
                    for (let i = 0; i < game.movingPlatforms.length; i++) allPlats.push(game.movingPlatforms[i]);
                }
                const valid = [];
                for (let i = 0; i < allPlats.length; i++) {
                    const p = allPlats[i];
                    if (!p || p === this.platform) continue;
                    const dy = p.y - startY;
                    const dx = (p.x + p.width / 2) - startX;
                    if (dy > -240 && dy < 260 && Math.abs(dx) < 520 && Math.abs(dx) > 60) {
                        valid.push(p);
                    }
                }

                if (valid.length > 0) {
                    if (player && dist < 560) {
                        for (let i = 0; i < valid.length; i++) {
                            const p = valid[i];
                            if (player.x + player.width > p.x && player.x < p.x + p.width &&
                                Math.abs(player.y + player.height - p.y) < 60) {
                                targetPlat = p;
                                break;
                            }
                        }
                    }
                    if (!targetPlat) {
                        targetPlat = valid[Math.floor(Math.random() * valid.length)];
                    }
                }
            }

            if (targetPlat) {
                let targetX = targetPlat.x + targetPlat.width / 2;
                targetX += (Math.random() - 0.5) * (targetPlat.width * 0.45);
                const targetY = targetPlat.y;
                const dy = targetY - startY;
                const dx = targetX - startX;
                const apex = Math.min(startY - 92, targetY - 46);
                const h = Math.max(28, startY - apex);
                this.vy = -Math.sqrt(2 * Physics.GRAVITY * h);
                const a = 0.5 * Physics.GRAVITY;
                const b = this.vy;
                const c = -dy;
                const disc = b * b - 4 * a * c;
                if (disc >= 0) {
                    const t = (-b + Math.sqrt(disc)) / (2 * a);
                    this.vx = dx / Math.max(0.14, t);
                } else {
                    this.vx = dx >= 0 ? 170 : -170;
                }
                this.facingRight = this.vx > 0;
            } else {
                this.vy = -(330 + Math.random() * 150);
                if (dist < 400 && player) {
                    this.facingRight = player.x > this.x;
                } else {
                    this.facingRight = Math.random() > 0.5;
                }
                this.vx = this.facingRight ? this.baseSpeed * 2.2 : -this.baseSpeed * 2.2;
            }
        } else if (this.state === 'PATROL') {
            this.state = 'IDLE';
            this.stateTimer = 0.2;
            this.vx = 0;
        }
    }

    updateShooter(dt, game, player, dist, distX) {
        // Smooth genie movement: perfect circular orbit whose center drifts gently.
        const t = this.timeAlive;
        const phase = this.startX * 0.013 + this.startY * 0.004;
        const geniePathSpeed = 1.4;
        const centerX = this.startX + Math.sin(t * 0.34 * geniePathSpeed + phase * 0.8) * 78;
        const centerY = this.startY + Math.cos(t * 0.27 * geniePathSpeed + phase * 1.1) * 38;
        const orbitRadiusX = 112;
        const orbitRadiusY = 112;
        const orbitAngle = t * 1.38 * geniePathSpeed + phase;

        this.x = centerX + Math.cos(orbitAngle) * orbitRadiusX;
        this.y = centerY + Math.sin(orbitAngle) * orbitRadiusY;

        // Since we set x/y directly, zero out vx/vy so update()'s else branch doesn't interfere
        this.vx = 0;
        this.vy = 0;
        if (player) {
            // Turn to face player at any distance
            this.facingRight = distX > 0;

            if (this.attackCooldown <= 0) {
                this.state = 'ATTACK';

                const centerX = this.x + this.width / 2;
                const centerY = this.y + this.height / 2;

                const numLasers = 8;
                for (let i = 0; i < numLasers; i++) {
                    const angle = (i / numLasers) * Math.PI * 2;
                    const laser = new Laser(centerX, centerY, angle);
                    game.enemyProjectiles.push(laser);
                }

                this.attackCooldown = 0.45 + Math.random() * 1.55;
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
                // Vertical stomp: jump straight up, then slam straight down.
                this.vx = 0;
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

    updateJellyfish(dt, player) {
        this.state = 'FLOAT';
        this.vx = 0;
        this.vy = 0;
        this.x = this.startX + Math.sin(this.timeAlive * 1.6 + this.startY * 0.01) * 18;
        this.y = this.startY + Math.sin(this.timeAlive * 2.2 + this.startX * 0.008) * 22;
        if (player) this.facingRight = (player.x + player.width / 2) > (this.x + this.width / 2);
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
        if (this.markedForDeletion) {
            if (this.deathPopTimer > 0) {
                if (!this._deathPopCache) {
                    this._deathPopCache = getEmojiCanvas('💥', Math.max(28, Math.round(this.height * 0.85)));
                }
                const cached = this._deathPopCache;
                const t = Math.max(0, Math.min(1, this.deathPopTimer / this.deathPopDuration));
                const scale = 0.9 + (1 - t) * 0.25;
                ctx.save();
                ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
                ctx.scale(scale, scale);
                ctx.globalAlpha = 0.9;
                ctx.drawImage(cached.canvas, -cached.width / 2, -cached.height / 2);
                ctx.restore();
            }
            return;
        }

        ctx.save();
        if (this.type === TYPE_TROLL) {
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height * 0.55;
            const pulse = 0.5 + 0.5 * Math.sin(this.toxicCloudPulse);
            const radiusOuter = this.toxicCloudBaseRadius + 16 + pulse * 14;
            const radiusMid = radiusOuter * 0.72;
            const radiusInner = radiusOuter * 0.48;

            ctx.save();
            // Lightweight AOE visualization: no dynamic gradients, just layered fills/rings.
            ctx.fillStyle = 'rgba(58, 132, 62, 0.14)';
            ctx.beginPath();
            ctx.arc(cx, cy, radiusOuter, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(92, 172, 90, 0.14)';
            ctx.beginPath();
            ctx.arc(cx, cy, radiusMid, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(140, 224, 132, 0.13)';
            ctx.beginPath();
            ctx.arc(cx, cy, radiusInner, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(170, 235, 160, 0.22)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, radiusOuter * 0.98, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(208, 250, 200, 0.18)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, radiusMid * 0.98, 0, Math.PI * 2);
            ctx.stroke();

            // Subtle drifting puffs to communicate toxicity at low render cost.
            for (let i = 0; i < 4; i++) {
                const a = this.toxicCloudPulse * 0.65 + i * (Math.PI * 0.5);
                const pr = radiusMid + (Math.sin(this.timeAlive * 1.7 + i) * 8);
                const px = cx + Math.cos(a) * pr;
                const py = cy + Math.sin(a) * pr * 0.6;
                const puffR = 9 + (i % 2) * 3;
                ctx.fillStyle = `rgba(170, 235, 160, ${0.15 + (i % 2) * 0.05})`;
                ctx.beginPath();
                ctx.arc(px, py, puffR, 0, Math.PI * 2);
                ctx.fill();
            }

            // Clear hazard cue: 3 skulls orbiting the toxic AOE.
            const skull = this._toxicSkullCache;
            if (skull) {
                const skullCount = 3;
                const skullOrbitR = radiusOuter * 0.97;
                for (let i = 0; i < skullCount; i++) {
                    const a = this.timeAlive * 1.55 + i * (Math.PI * 2 / skullCount);
                    const sx = cx + Math.cos(a) * skullOrbitR - skull.width / 2;
                    const sy = cy + Math.sin(a) * skullOrbitR * 0.92 - skull.height / 2;
                    ctx.globalAlpha = 0.86;
                    ctx.drawImage(skull.canvas, sx, sy);
                }
                ctx.globalAlpha = 1;
            }
            ctx.restore();
        }

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
            // Blowfish is always fully visible.
            alpha = 1.0;
        }



        if (this.state === 'REVIVING' && this.type === TYPE_ZOMBIE) {
            // Keep reviving zombie at full alive-size, only rotate/flash.
            scaleX = 1; scaleY = 1;
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
        if (this.turtleFlipped && this.type === TYPE_PATROL && this.emoji === '🐢') {
            let shellAngle = Math.PI;
            if (this.turtleRecovering && this.turtleRecoverDuration > 0) {
                const t = 1 - Math.max(0, Math.min(1, this.turtleRecoverTimer / this.turtleRecoverDuration));
                shellAngle = Math.PI * (1 - t);
            }
            ctx.rotate(shellAngle);
        }

        if (this.facingRight) {
            ctx.scale(-1 * scaleX, 1 * scaleY);
        } else {
            ctx.scale(1 * scaleX, 1 * scaleY);
        }

        let yOffset = this.height * 0.1;
        if (this.turtleFlipped && this.type === TYPE_PATROL && this.emoji === '🐢') {
            // Rotated shell needs a lower visual anchor so it sits on the platform.
            yOffset = -this.height * 0.05;
        }

        if (this.state === 'PATROL' && this.type !== TYPE_FLYER && this.type !== TYPE_BIRD && this.type !== TYPE_EAGLE && this.type !== TYPE_OWL && this.type !== TYPE_CROW && this.type !== TYPE_JUMPER && this.type !== TYPE_DINO && this.type !== TYPE_GHOST) {
            yOffset -= Math.abs(Math.sin(this.timeAlive * 12)) * 6;
            ctx.rotate(Math.sin(this.timeAlive * 8) * 0.15); // Waddling
        } else if (this.type === TYPE_DINO && this.state === 'PATROL') {
            yOffset -= Math.abs(Math.sin(this.timeAlive * 6)) * 4;
            ctx.rotate(Math.sin(this.timeAlive * 4) * 0.1);
        } else if (this.state === 'IDLE' && this.type !== TYPE_FLYER && this.type !== TYPE_GHOST) {
            yOffset -= Math.sin(this.timeAlive * 4) * 2;
        } else if (this.type === TYPE_FLYER || this.type === TYPE_BIRD || this.type === TYPE_EAGLE || this.type === TYPE_OWL || this.type === TYPE_CROW || this.type === TYPE_SQUID || this.type === TYPE_ALIEN || this.type === TYPE_JELLYFISH) {
            if (this.type === TYPE_ALIEN) {
                ctx.rotate(Math.sin(this.timeAlive * 5) * 0.1);
            } else if (this.type === TYPE_JELLYFISH) {
                ctx.rotate(Math.sin(this.timeAlive * 3.2) * 0.1);
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

        if (this.type === TYPE_PEACOCK && this.peacockFacingPlayer && this._peacockMirrorCache) {
            const mirror = this._peacockMirrorCache;
            const bob = Math.sin(this.timeAlive * 8) * 1.5;
            const mx = this.facingRight
                ? (this.x + this.width - mirror.width * 0.28)
                : (this.x - mirror.width * 0.72);
            const my = this.y + this.height * 0.42 - mirror.height / 2 + bob;
            ctx.save();
            ctx.globalAlpha = 0.96;
            ctx.drawImage(mirror.canvas, mx, my);
            ctx.restore();
        }

        if (this.type === TYPE_ENRAGED && this.kamikazeArmed && !this.markedForDeletion) {
            const countdown = Math.max(1, Math.ceil(this.kamikazeCountdown));
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.font = 'bold 48px "Outfit", sans-serif';
            ctx.lineWidth = 6;
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillStyle = '#ffd6d6';
            const tx = this.x + this.width / 2;
            const ty = this.y - 12;
            const label = `🧨 ${countdown}`;
            ctx.strokeText(label, tx, ty);
            ctx.fillText(label, tx, ty);
            ctx.restore();
        }
    }

    _shouldUseLowPerfDeathPop(game) {
        return !!(game && game.particles && game.particles.panicMode);
    }

    _startDeathPop() {
        this.deathPopDuration = 0.18;
        this.deathPopTimer = this.deathPopDuration;
        this.vx = 0;
        this.vy = 0;
    }
}

// ─────────────────────────────────────────────────────────────
//  Boss  (large end-of-level encounter, ~4× player size)
// ─────────────────────────────────────────────────────────────
export class Boss extends Entity {
    constructor(x, y, platform, bossType) {
        const normalizedBossType = bossType === 'boss_hedgehog'
            ? 'boss_tengu'
            : (bossType === 'boss_robot' ? 'boss_manliftingweights' : bossType);
        const resolvedBossType = normalizedBossType || BOSS_TYPES[Math.floor(Math.random() * BOSS_TYPES.length)];
        const bossSizes = {
            boss_spider: 122,
            boss_dragon: 170,
            boss_manliftingweights: 156,
            boss_lobster: 150,
            boss_kangaroo: 154,
            boss_monkey: 150,
            boss_mammoth: 168,
            boss_trex: 166,
            boss_mosquito: 144,
            boss_beetle: 158,
            boss_juggler: 154,
            boss_honeybee: 150
        };
        const size = bossSizes[resolvedBossType] || 160;
        super(x, y - size, size, size);

        this.bossType = resolvedBossType;
        this.platform = platform;
        this.facingRight = true;

        this.maxHealth = 25 + Math.floor(Math.random() * 11);
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
        this.maxMoveSpeed = 470;
        this.repositionCooldown = 2.0 + Math.random() * 1.5;
        this.repositionBurstTimer = 0;
        this.aerialLowSwoopTimer = 0;
        this.aerialLowSwoopDuration = 1.45;
        this.aerialSwoopTimer = 0;
        this.aerialSwoopDuration = 1.2;
        this.aerialSwoopDepth = 0;
        this.chickMovementMode = 'LOOP'; // 'LOOP' | 'SWOOP'
        this.chickMovementModeTimer = 2.4 + Math.random() * 1.2;
        this.chickPanicFlapTimer = 0;
        this.chickDiveCooldown = 1.7 + Math.random() * 0.9;
        this.chickDiveTimer = 0;
        this.chickDiveDir = Math.random() > 0.5 ? 1 : -1;
        this.chickDiveTargetX = this.x;
        this.chickDiveTargetY = this.y;

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
        this.spiderVenomTelegraphTimer = 0;
        this.spiderVenomDir = 0;
        this.spiderPounceCooldown = 2.2;
        this.spiderPounceTelegraph = 0;
        this.spiderPounceTimer = 0;
        this.spiderPounceDir = 0;
        this.spiderMinionCooldown = 2.9 + Math.random() * 1.1;

        // Dragon (boss_dragon) grounded fire-cone state
        this.dragonPatrolDir = Math.random() > 0.5 ? 1 : -1;
        this.dragonFireTelegraphTimer = 0;
        this.dragonFireTelegraphDuration = 0.5;
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
        this.dragonVolleyLaneY = this.y + this.height * 0.3;

        // Moai (boss_moai): grounded sentinel pressure with gaze beams, meteor rain, and quake bursts.
        this.moaiState = 'PATROL'; // 'PATROL' | 'GAZE' | 'METEOR' | 'QUAKE'
        this.moaiPatrolDir = Math.random() > 0.5 ? 1 : -1;
        this.moaiTelegraphTimer = 0;
        this.moaiTelegraphType = 'gaze_beam'; // 'gaze_beam' | 'meteor_rain' | 'quake'
        this.moaiBeamShots = 0;
        this.moaiBeamTimer = 0;
        this.moaiMeteorWaves = 0;
        this.moaiMeteorTimer = 0;
        this.moaiMeteorCenterX = this.x + this.width / 2;
        this.moaiQuakeWaves = 0;
        this.moaiQuakeTimer = 0;
        this.moaiHoverCenterY = this.platform.y - this.height - 210;

        // Man lifting weights (boss_manliftingweights) grounded rush/grab/throw + wrench toss
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

        // Lobster (boss_lobster): grounded scuttle + shrimp barrage + lobster minion calls.
        this.lobsterPatrolDir = Math.random() > 0.5 ? 1 : -1;
        this.lobsterTelegraphTimer = 0;
        this.lobsterTelegraphType = 'spray'; // 'spray' | 'dash'
        this.lobsterShrimpShots = 0;
        this.lobsterShrimpTimer = 0;
        this.lobsterDashTimer = 0;
        this.lobsterDashDir = 0;
        this.lobsterDashFxTimer = 0;
        this.lobsterMinionCooldown = 2.8 + Math.random() * 1.2;

        // Kangaroo (boss_kangaroo): grounded hop duels, pouch boomerangs, and leap slams.
        this.kangarooState = 'PATROL'; // 'PATROL' | 'LEAP'
        this.kangarooPatrolDir = Math.random() > 0.5 ? 1 : -1;
        this.kangarooHopCycle = Math.random() * Math.PI * 2;
        this.kangarooTelegraphTimer = 0;
        this.kangarooTelegraphType = 'boomerang'; // 'boomerang' | 'slam'
        this.kangarooBoomerangShots = 0;
        this.kangarooBoomerangTimer = 0;
        this.kangarooLeapTargetX = this.x;
        this.kangarooLeapVx = 0;
        this.kangarooLeapVy = 0;
        this.kangarooLeapLandFxTimer = 0;

        // Monkey (boss_monkey): trickster canopy cycles + coconut juggles + dive-bombs.
        this.monkeyState = 'PATROL'; // 'PATROL' | 'CANOPY_ASCEND' | 'CANOPY' | 'ASCEND' | 'DIVE'
        this.monkeyPatrolDir = Math.random() > 0.5 ? 1 : -1;
        this.monkeyHopCycle = Math.random() * Math.PI * 2;
        this.monkeyTelegraphTimer = 0;
        this.monkeyTelegraphType = 'banana_rain'; // 'banana_rain' | 'coconut_burst' | 'dive'
        this.monkeyCoconutShots = 0;
        this.monkeyCoconutTimer = 0;
        this.monkeyCanopyTimer = 0;
        this.monkeyCanopyDir = 1;
        this.monkeyCanopyY = this.platform.y - this.height - 240;
        this.monkeyCanopyTargetX = this.x;
        this.monkeyCanopyTargetY = this.y;
        this.monkeyBananaDropTimer = 0;
        this.monkeyDiveTargetX = this.x;
        this.monkeyDiveVx = 0;
        this.monkeyDiveVy = 0;
        this.monkeyAscendTargetY = this.y;
        this.monkeyAscendTimer = 0;

        // Mammoth (boss_mammoth): heavy charge lanes + frost fan + icicle rain.
        this.mammothState = 'PATROL'; // 'PATROL' | 'CHARGE'
        this.mammothPatrolDir = Math.random() > 0.5 ? 1 : -1;
        this.mammothTelegraphTimer = 0;
        this.mammothTelegraphType = 'charge'; // 'charge' | 'frost_fan' | 'icicle_rain'
        this.mammothChargeDir = 0;
        this.mammothChargeTimer = 0;
        this.mammothChargeFxTimer = 0;
        this.mammothFrostShots = 0;
        this.mammothFrostTimer = 0;
        this.mammothRainWaves = 0;
        this.mammothRainTimer = 0;
        this.mammothRainCenterX = this.x + this.width / 2;

        // T-Rex (boss_trex): shockwave roars + fossil volleys + feral lunges.
        this.trexState = 'PATROL'; // 'PATROL' | 'LUNGE'
        this.trexPatrolDir = Math.random() > 0.5 ? 1 : -1;
        this.trexTelegraphTimer = 0;
        this.trexTelegraphType = 'roar'; // 'roar' | 'fossil' | 'lunge'
        this.trexRoarWaves = 0;
        this.trexRoarTimer = 0;
        this.trexFossilShots = 0;
        this.trexFossilTimer = 0;
        this.trexLungeTimer = 0;
        this.trexLungeDir = 0;
        this.trexLungeFxTimer = 0;

        // Mosquito (boss_mosquito): aerial harassment with needle fans, swarm dashes, and blood-trail dives.
        this.mosquitoState = 'HOVER'; // 'HOVER' | 'DASH' | 'DRAIN'
        this.mosquitoPatrolDir = Math.random() > 0.5 ? 1 : -1;
        this.mosquitoHoverCenterY = this.platform.y - this.height - 190;
        this.mosquitoTelegraphTimer = 0;
        this.mosquitoTelegraphType = 'needle_fan'; // 'needle_fan' | 'swarm' | 'drain'
        this.mosquitoNeedleShots = 0;
        this.mosquitoNeedleTimer = 0;
        this.mosquitoSwarmBursts = 0;
        this.mosquitoSwarmTimer = 0;
        this.mosquitoDashTimer = 0;
        this.mosquitoDashVx = 0;
        this.mosquitoDashVy = 0;
        this.mosquitoDrainTimer = 0;
        this.mosquitoDrainTrailTimer = 0;

        // Beetle (boss_beetle): armored rolls + scarab shell volleys + burrow ambushes.
        this.beetleState = 'PATROL'; // 'PATROL' | 'ROLL' | 'BURROW'
        this.beetlePatrolDir = Math.random() > 0.5 ? 1 : -1;
        this.beetleTelegraphTimer = 0;
        this.beetleTelegraphType = 'roll'; // 'roll' | 'scarab_spray' | 'burrow'
        this.beetleRollDir = 0;
        this.beetleRollTimer = 0;
        this.beetleRollFxTimer = 0;
        this.beetleSprayShots = 0;
        this.beetleSprayTimer = 0;
        this.beetleBurrowTimer = 0;
        this.beetleBurrowTargetX = this.x;

        // Juggler (boss_juggler): goofy circus duel with cascades, rain bursts, and rolling ball sprints.
        this.jugglerState = 'PATROL'; // 'PATROL' | 'CASCADE' | 'RAIN' | 'ROLL'
        this.jugglerPatrolDir = Math.random() > 0.5 ? 1 : -1;
        this.jugglerHopCycle = Math.random() * Math.PI * 2;
        this.jugglerTelegraphTimer = 0;
        this.jugglerTelegraphType = 'cascade'; // 'cascade' | 'rain' | 'roll'
        this.jugglerCascadeShots = 0;
        this.jugglerCascadeTimer = 0;
        this.jugglerRainWaves = 0;
        this.jugglerRainTimer = 0;
        this.jugglerRainCenterX = this.x + this.width / 2;
        this.jugglerRollTimer = 0;
        this.jugglerRollDir = 0;
        this.jugglerRollFxTimer = 0;

        // Honeybee (boss_honeybee): lane-sweep swarms with high/mid/low telegraphed mixups.
        this.honeybeePatrolDir = Math.random() > 0.5 ? 1 : -1;
        this.honeybeeHoverCenterY = this.platform.y - this.height - 170;
        this.honeybeeTelegraphTimer = 0;
        this.honeybeeTelegraphType = 'high'; // 'high' | 'mid' | 'low'
        this.honeybeeGatherTimer = 0;
        this.honeybeeGatherDuration = 0;
        this.honeybeeDeployTimer = 0;
        this.honeybeeDeployDuration = 0;
        this.honeybeeSwarmActiveTimer = 0;
        this.honeybeeSwarmDuration = 0;
        this.honeybeeSwarmType = 'high'; // 'high' | 'mid' | 'low'
        this.honeybeeSwarmHitTimer = 0;

        switch (this.bossType) {
            case 'boss_chick': this.emoji = String.fromCodePoint(0x1F423); break;
            case 'boss_moai': this.emoji = String.fromCodePoint(0x1F5FF); break;
            case 'boss_tengu': this.emoji = String.fromCodePoint(0x1F47A); break;
            case 'boss_spider': this.emoji = String.fromCodePoint(0x1F577) + '\uFE0F'; break;
            case 'boss_dragon': this.emoji = String.fromCodePoint(0x1F409); break;
            case 'boss_manliftingweights': this.emoji = String.fromCodePoint(0x1F3CB) + '\uFE0F\u200D\u2642\uFE0F'; break;
            case 'boss_lobster': this.emoji = String.fromCodePoint(0x1F99E); break;
            case 'boss_kangaroo': this.emoji = String.fromCodePoint(0x1F998); break;
            case 'boss_monkey': this.emoji = String.fromCodePoint(0x1F412); break;
            case 'boss_mammoth': this.emoji = String.fromCodePoint(0x1F9A3); break;
            case 'boss_trex': this.emoji = String.fromCodePoint(0x1F996); break;
            case 'boss_mosquito': this.emoji = String.fromCodePoint(0x1F99F); break;
            case 'boss_beetle': this.emoji = String.fromCodePoint(0x1FAB2); break;
            case 'boss_juggler': this.emoji = String.fromCodePoint(0x1F939); break;
            case 'boss_honeybee': this.emoji = String.fromCodePoint(0x1F41D); break;
            default: this.emoji = String.fromCodePoint(0x1F5FF); break;
        }
        if (this.bossType === 'boss_lobster') {
            const lobsterNames = [
                'LOBSTER MOBSTER',
                'SIR SNIPSNAP',
                'CLAWD THE CHAOTIC',
                'CAPTAIN CRUSTACEAN',
                'THE SHRIMP DEALER'
            ];
            this.displayName = lobsterNames[Math.floor(Math.random() * lobsterNames.length)];
        } else if (this.bossType === 'boss_kangaroo') {
            const kangarooNames = [
                'POUCH PUNISHER',
                'SKIPPY UPPERCUT',
                'BOOMERANGER PRIME',
                'K.O. KANGAROO',
                'THUNDER POUCH'
            ];
            this.displayName = kangarooNames[Math.floor(Math.random() * kangarooNames.length)];
        } else if (this.bossType === 'boss_monkey') {
            const monkeyNames = [
                'BANANA BANDIT',
                'KING MISCHIEF',
                'COCONUT CONDUCTOR',
                'CANOPY MENACE',
                'PRIMATE PANDEMONIUM'
            ];
            this.displayName = monkeyNames[Math.floor(Math.random() * monkeyNames.length)];
        } else if (this.bossType === 'boss_mammoth') {
            const mammothNames = [
                'GLACIAL JUGGERNAUT',
                'TUSK THUNDER',
                'ICE AGE EMPEROR',
                'BLIZZARD RAM',
                'PERMAFROST COLOSSUS'
            ];
            this.displayName = mammothNames[Math.floor(Math.random() * mammothNames.length)];
        } else if (this.bossType === 'boss_trex') {
            const trexNames = [
                'PRIMAL TYRANT',
                'BONECRUSHER REX',
                'ROARLORD OMEGA',
                'THUNDERJAW',
                'THE LAST CARNIVORE'
            ];
            this.displayName = trexNames[Math.floor(Math.random() * trexNames.length)];
        } else if (this.bossType === 'boss_mosquito') {
            const mosquitoNames = [
                'NIGHT WHINE',
                'BLOOD TAX COLLECTOR',
                'PLAGUE NEEDLE',
                'THE BUZZING BARON',
                'VECTOR PRIME'
            ];
            this.displayName = mosquitoNames[Math.floor(Math.random() * mosquitoNames.length)];
        } else if (this.bossType === 'boss_beetle') {
            const beetleNames = [
                'CARAPACE COMMANDER',
                'SCARAB SIEGELORD',
                'DUNE BULLDOZER',
                'CHITIN SHREDDER',
                'THE IRON ELYTRON'
            ];
            this.displayName = beetleNames[Math.floor(Math.random() * beetleNames.length)];
        } else if (this.bossType === 'boss_juggler') {
            const jugglerNames = [
                'CIRCUS CHAOS',
                'THE HONK JUGGLER',
                'CAPTAIN BOUNCEBRAIN',
                'RINGMASTER MAYHEM',
                'LORD HYPERJUGGLE'
            ];
            this.displayName = jugglerNames[Math.floor(Math.random() * jugglerNames.length)];
        } else if (this.bossType === 'boss_honeybee') {
            const honeybeeNames = [
                'QUEEN STINGER',
                'HIVE HOWLER',
                'NECTAR NEMESIS',
                'BUZZSTORM REGENT',
                'SWARM SOVEREIGN'
            ];
            this.displayName = honeybeeNames[Math.floor(Math.random() * honeybeeNames.length)];
        }

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

    _getDragonMouthOffset() {
        return {
            x: this.width * 0.36,
            y: -this.height * 0.25
        };
    }

    _getDragonMouthPosition() {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const mouthOffset = this._getDragonMouthOffset();
        return {
            x: centerX + (this.facingRight ? mouthOffset.x : -mouthOffset.x),
            y: centerY + mouthOffset.y
        };
    }

    _isPlayerInDragonFireCone(player) {
        if (!player || this.bossType !== 'boss_dragon') return false;
        const mouth = this._getDragonMouthPosition();
        const px = player.x + player.width / 2;
        const py = player.y + player.height / 2;
        const dx = px - mouth.x;
        const dy = py - mouth.y;
        const dist = Math.hypot(dx, dy);
        if (dist > this.dragonFireRange) return false;
        const facingAngle = (this.facingRight ? 0 : Math.PI) + this.dragonConeAimOffset;
        const playerAngle = Math.atan2(dy, dx);
        return Math.abs(this._angleDelta(playerAngle, facingAngle)) <= this.dragonFireHalfAngle;
    }

    _isBossVfxLite(game) {
        // Force-lite boss VFX for consistent frame pacing across devices.
        // This only affects visual density (particles/telegraph richness), not gameplay logic.
        return true;
    }

    _getHoneybeeSwarmBand(type) {
        if (!this.platform) return null;
        const high = { y: this.platform.y - 210, height: 70 };
        const low = { y: this.platform.y - 42, height: 62 };
        if (type === 'high') return high;
        if (type === 'low') {
            return low;
        }
        const highCenter = high.y + high.height / 2;
        const lowCenter = low.y + low.height / 2;
        const midCenter = (highCenter + lowCenter) * 0.5;
        const midHeight = Math.round((high.height + low.height) * 0.5);
        return { y: Math.round(midCenter - midHeight / 2), height: midHeight };
    }

    _isPlayerInHoneybeeSwarm(player, type) {
        if (!player || !this.platform) return false;
        const band = this._getHoneybeeSwarmBand(type);
        if (!band) return false;
        const hitbox = player.getHitbox ? player.getHitbox() : player;
        const bossCenterX = this.x + this.width / 2;
        
        let minX = this.platform.x + 12;
        let maxX = this.platform.x + this.platform.width - 12;
        
        // Front-facing horizontal swarm restriction
        if (this.facingRight) {
            minX = bossCenterX;
        } else {
            maxX = bossCenterX;
        }
        
        return (
            hitbox.x + hitbox.width > minX &&
            hitbox.x < maxX &&
            hitbox.y + hitbox.height > band.y &&
            hitbox.y < band.y + band.height
        );
    }

    _emitBossFx(game, x, y, count, color, speedRange, lifeRange, sizeRange) {
        if (!game || !game.particles) return;
        const lite = this._isBossVfxLite(game);
        const scaledCount = lite ? Math.max(2, Math.floor(count * 0.4)) : count;
        const scaledSpeed = lite
            ? [speedRange[0] * 0.8, speedRange[1] * 0.85]
            : speedRange;
        const scaledLife = lite
            ? [lifeRange[0] * 0.85, lifeRange[1] * 0.85]
            : lifeRange;
        game.particles.emit(x, y, scaledCount, color, scaledSpeed, scaledLife, sizeRange);
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
            if (game && Array.isArray(game.pendingBossStarDrops)) {
                const dropSize = (game.player && game.player.width) ? game.player.width : 72;
                const dropX = this.x + this.width / 2 - dropSize / 2;
                const dropY = this.y + this.height / 2 - dropSize / 2;
                game.pendingBossStarDrops.push({
                    x: dropX,
                    y: dropY,
                    size: dropSize,
                    timer: 0.3
                });
            }
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            if (game && game.particles) {
                // Always run full boss-defeat celebration, even in performance mode.
                game.particles.emitFireworksShow(cx, cy, 1.4);
                game.particles.emitFireworks(cx - 90, cy - 46, 1.2);
                game.particles.emitFireworks(cx + 90, cy - 46, 1.2);
                game.particles.emitFireworks(cx, cy - 95, 1.45);
                game.particles.emitDeath(cx, cy);
                game.particles.emitDeath(cx - 26, cy + 10);
                game.particles.emitDeath(cx + 26, cy + 10);
                const ringBursts = 22;
                for (let i = 0; i < ringBursts; i++) {
                    const a = (i / ringBursts) * Math.PI * 2;
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
            if (game && typeof game.registerEnemyDefeat === 'function') game.registerEnemyDefeat(this);
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

    _spawnProjectileAtAngle(game, projectileType, speed, angle, arcBias = 0) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed + arcBias;
        game.enemyProjectiles.push(new BossProjectile(cx, cy, vx, vy, projectileType));
        this.facingRight = vx >= 0;
    }

    _spawnChickRainWave(game, player, waveIdx = 0) {
        if (!game || !player) return;
        const centerX = player.x + player.width / 2;
        const topY = Math.min(this.y - 80, this.platform.y - this.height - 360);
        const phaseSpread = 180 + this.phase * 24;
        const lanes = this.phase >= 3 ? 5 : (this.phase >= 2 ? 4 : 3);
        for (let i = 0; i < lanes; i++) {
            const t = lanes <= 1 ? 0.5 : i / (lanes - 1);
            const laneOffset = (t - 0.5) * phaseSpread;
            const jitter = (Math.random() - 0.5) * 30;
            const spawnX = centerX + laneOffset + jitter;
            const fallSpeed = 360 + this.phase * 24 + Math.random() * 40;
            const drift = (Math.random() - 0.5) * 90 + Math.sin((waveIdx + i) * 0.9) * 36;
            const shot = new BossProjectile(spawnX, topY, drift, fallSpeed, 'egg');
            game.enemyProjectiles.push(shot);
        }
    }

    _queueAttack(player) {
        if (!player) return;

        const phaseScale = this.phase === 1 ? 1 : (this.phase === 2 ? 1.2 : 1.4);
        this.attackTelegraphDuration = 0.42 / phaseScale;
        this.attackTelegraphTimer = this.attackTelegraphDuration;

        if (this.bossType === 'boss_chick') {
            const roll = Math.random();
            if (roll < 0.46) {
                this.pendingAttack = {
                    pattern: 'fan',
                    projectile: 'drumstick',
                    speed: 330 + this.phase * 14,
                    arcBias: -68,
                    spreads: this.phase >= 3 ? [-0.2, -0.06, 0.06, 0.2] : (this.phase >= 2 ? [-0.14, 0, 0.14] : [-0.07, 0.07])
                };
                this.attackTelegraphDuration = (this.phase >= 2 ? 0.42 : 0.48) / phaseScale;
            } else if (roll < 0.76) {
                this.pendingAttack = {
                    pattern: 'spiral',
                    projectile: 'egg',
                    speed: 290 + this.phase * 12,
                    steps: this.phase >= 3 ? 7 : (this.phase >= 2 ? 6 : 5),
                    interval: Math.max(0.16, 0.22 - this.phase * 0.015),
                    timer: 0,
                    angle: Math.random() * Math.PI * 2,
                    angleStep: (Math.PI / 5) * (Math.random() > 0.5 ? 1 : -1),
                    mirror: this.phase >= 3
                };
                this.attackTelegraphDuration = (this.phase >= 2 ? 0.4 : 0.46) / phaseScale;
            } else {
                this.pendingAttack = {
                    pattern: 'rain',
                    waves: this.phase >= 3 ? 3 : (this.phase >= 2 ? 3 : 2),
                    interval: Math.max(0.26, 0.4 - this.phase * 0.02),
                    timer: 0
                };
                this.attackTelegraphDuration = 0.56 / phaseScale;
            }
            this.attackTelegraphTimer = this.attackTelegraphDuration;
            this.attackCooldown = 1.95 + Math.random() * 0.75 + (3 - this.phase) * 0.22;
        } else if (this.bossType === 'boss_tengu') {
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

        if (this.pendingAttack.pattern === 'spiral') {
            this.pendingAttack.timer -= dt;
            if (this.pendingAttack.timer <= 0 && this.pendingAttack.steps > 0) {
                const angle = this.pendingAttack.angle || 0;
                this._spawnProjectileAtAngle(game, this.pendingAttack.projectile || 'drumstick', this.pendingAttack.speed || 360, angle, this.pendingAttack.arcBias || 0);
                if (this.pendingAttack.mirror) {
                    this._spawnProjectileAtAngle(game, this.pendingAttack.projectile || 'drumstick', this.pendingAttack.speed || 360, angle + Math.PI, this.pendingAttack.arcBias || 0);
                }
                this.pendingAttack.angle = angle + (this.pendingAttack.angleStep || 0.6);
                this.pendingAttack.steps--;
                this.pendingAttack.timer = this.pendingAttack.interval || 0.12;
            }

            if (this.pendingAttack.steps <= 0) {
                this.pendingAttack = null;
            }
            return;
        }

        if (this.pendingAttack.pattern === 'rain') {
            this.pendingAttack.timer -= dt;
            if (this.pendingAttack.timer <= 0 && this.pendingAttack.waves > 0) {
                this._spawnChickRainWave(game, player, this.pendingAttack.waves);
                this.pendingAttack.waves--;
                this.pendingAttack.timer = this.pendingAttack.interval || 0.3;
            }
            if (this.pendingAttack.waves <= 0) {
                this.pendingAttack = null;
            }
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

    _updateChickBoss(dt, game, player) {
        if (this.chickMovementModeTimer > 0) this.chickMovementModeTimer -= dt;
        if (this.chickPanicFlapTimer > 0) this.chickPanicFlapTimer -= dt;
        if (this.chickDiveCooldown > 0) this.chickDiveCooldown -= dt;
        if (this.chickDiveTimer > 0) this.chickDiveTimer -= dt;

        if (this.chickMovementModeTimer <= 0) {
            this.chickMovementMode = this.chickMovementMode === 'LOOP' ? 'SWOOP' : 'LOOP';
            this.chickMovementModeTimer = this.chickMovementMode === 'LOOP'
                ? (3.1 + Math.random() * 1.3)
                : (1.5 + Math.random() * 0.7);
            this.chickPanicFlapTimer = 0.32 + Math.random() * 0.25;
        }

        const left = this.platform.x + 16;
        const right = this.platform.x + this.platform.width - this.width - 16;
        const highY = this.platform.y - this.height - 320;
        const lowY = this.platform.y - this.height - 18;
        const cruiseY = this.platform.y - this.height - 160;

        if (this.chickDiveTimer <= 0 && this.chickDiveCooldown <= 0 && player && Math.random() < (this.phase >= 3 ? 0.015 : 0.01)) {
            this.chickDiveTimer = this.phase >= 3 ? 1.05 : 0.95;
            this.chickDiveCooldown = 2.9 + Math.random() * 1.3;
            const playerCenter = player.x + player.width / 2;
            const chickCenter = this.x + this.width / 2;
            this.chickDiveDir = playerCenter >= chickCenter ? -1 : 1;
            const swoopDistance = 170 + Math.random() * 70;
            this.chickDiveTargetX = Math.max(left, Math.min(right, this.x + this.chickDiveDir * swoopDistance));
            this.chickDiveTargetY = lowY;
        }

        if (this.chickDiveTimer > 0) {
            const fullDiveTime = this.phase >= 3 ? 1.05 : 0.95;
            const progress = 1 - Math.max(0, this.chickDiveTimer / fullDiveTime);
            const downRatio = Math.min(1, progress / 0.55);
            const upRatio = Math.max(0, (progress - 0.55) / 0.45);
            const yTarget = progress < 0.55
                ? (cruiseY + (this.chickDiveTargetY - cruiseY) * downRatio)
                : (this.chickDiveTargetY + (cruiseY - this.chickDiveTargetY) * upRatio);
            const xTarget = this.chickDiveTargetX + Math.sin(progress * Math.PI) * 28 * this.chickDiveDir;
            this.targetX = Math.max(left, Math.min(right, xTarget));
            this.targetY = Math.max(highY, Math.min(lowY, yTarget));
        } else if (this.chickMovementMode === 'LOOP') {
            this.targetX = this.anchorX + Math.sin(this.timeAlive * 0.75) * (this.platform.width * 0.25) + Math.sin(this.timeAlive * 1.4) * 14;
            this.targetY = cruiseY + Math.cos(this.timeAlive * 0.95) * 24 + Math.sin(this.timeAlive * 1.3) * 12;
        } else {
            const awayDir = player
                ? (((player.x + player.width / 2) >= (this.x + this.width / 2)) ? -1 : 1)
                : (this.facingRight ? -1 : 1);
            const awayX = this.x + awayDir * (125 + Math.sin(this.timeAlive * 0.8) * 35);
            this.targetX = Math.max(left, Math.min(right, awayX));
            this.targetY = this.platform.y - this.height - (86 + Math.sin(this.timeAlive * 1.2) * 14);
        }

        if (this.chickPanicFlapTimer > 0) {
            this.targetY += Math.sin(this.timeAlive * 8) * 3;
        }

        this.targetX = Math.max(left, Math.min(right, this.targetX));
        this.targetY = Math.max(highY, Math.min(lowY, this.targetY));

        const toTargetX = this.targetX - this.x;
        const toTargetY = this.targetY - this.y;
        const dist = Math.hypot(toTargetX, toTargetY);
        if (dist > 0) {
            const cruiseSpeed = 175 + this.phase * 12;
            const speedBoost = this.chickDiveTimer > 0 ? 1.18 : 1;
            const maxStep = cruiseSpeed * speedBoost * dt;
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

    _updateAerialBoss(dt, game, player) {
        if (this.movementTimer > 0) this.movementTimer -= dt;
        if (this.repositionCooldown > 0) this.repositionCooldown -= dt;
        if (this.repositionBurstTimer > 0) this.repositionBurstTimer -= dt;
        if (this.aerialLowSwoopTimer > 0) this.aerialLowSwoopTimer -= dt;
        if (this.aerialSwoopTimer > 0) this.aerialSwoopTimer -= dt;

        // Switch between path styles.
        if (this.movementTimer <= 0) {
            this.movementState = this.movementState === 'WAVE' ? 'ORBIT' : 'WAVE';
            this.movementTimer = 4.8 + Math.random() * 1.2;
        }

        // Periodic smooth repositions keep pressure on the player without twitchy snaps.
        if (this.repositionCooldown <= 0 && player) {
            const left = this.platform.x + 20;
            const right = this.platform.x + this.platform.width - this.width - 20;
            const desired = player.x + player.width / 2 + (Math.random() > 0.5 ? -180 : 180) - this.width / 2;
            this.targetX = Math.max(left, Math.min(right, desired));
            this.targetY = this.platform.y - this.height - (52 + Math.random() * 26);
            this.repositionBurstTimer = 0.9;
            this.repositionCooldown = 3.2 + Math.random() * 1.7;
            this.aerialLowSwoopTimer = this.aerialLowSwoopDuration + Math.random() * 0.35;
            this.aerialSwoopTimer = this.aerialSwoopDuration;
            this.aerialSwoopDepth = 80 + Math.random() * 40;
        }

        if (this.movementState === 'WAVE') {
            this.targetX = this.anchorX + Math.sin(this.timeAlive * (0.55 + this.phase * 0.08)) * (this.platform.width * (0.22 + this.phase * 0.03));
            this.targetY = this.anchorY + Math.sin(this.timeAlive * 1.0) * (52 + this.phase * 8) + Math.cos(this.timeAlive * 0.5) * 28;
        } else {
            const radiusX = 150 + this.phase * 26;
            const radiusY = 80 + this.phase * 16;
            const speed = 0.72 + this.phase * 0.08;
            this.targetX = this.anchorX + Math.cos(this.timeAlive * speed) * radiusX;
            this.targetY = this.anchorY + Math.sin(this.timeAlive * speed) * radiusY;
        }

        // During low swoops, bias motion lower and closer to player for fair rock windows.
        if (this.aerialLowSwoopTimer > 0 && player) {
            const left = this.platform.x + 20;
            const right = this.platform.x + this.platform.width - this.width - 20;
            const followX = Math.max(left, Math.min(right, player.x + player.width / 2 - this.width / 2));
            const lowY = this.platform.y - this.height - (40 + Math.sin(this.timeAlive * 2.2) * 10);
            this.targetX = this.targetX * 0.7 + followX * 0.3;
            this.targetY = this.targetY * 0.35 + lowY * 0.65;
        }

        // Lower aerial passes during swoops so grounded attacks can reach more reliably.
        const swoopProgress = this.aerialSwoopDuration > 0
            ? Math.max(0, Math.min(1, this.aerialSwoopTimer / this.aerialSwoopDuration))
            : 0;
        const swoopCurve = Math.sin((1 - swoopProgress) * Math.PI);
        this.targetY += this.aerialSwoopDepth * swoopCurve;

        const topY = this.platform.y - this.height - 380;
        const bottomY = this.platform.y - this.height - 12;
        this.targetY = Math.max(topY, Math.min(bottomY, this.targetY));

        const toTargetX = this.targetX - this.x;
        const toTargetY = this.targetY - this.y;
        const dist = Math.hypot(toTargetX, toTargetY);
        if (dist > 0) {
            const speedMult = this.repositionBurstTimer > 0 ? 1.2 : 1;
            const maxStep = this.maxMoveSpeed * (1 + this.phase * 0.05) * speedMult * dt;
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

        if (this.spiderMinionCooldown > 0) this.spiderMinionCooldown -= dt;
        if (this.spiderMinionCooldown <= 0) {
            this._spawnSpiderMinion(game);
            this.spiderMinionCooldown = (this.phase >= 3 ? 2.4 : (this.phase >= 2 ? 2.9 : 3.4)) + Math.random() * 1.0;
        }

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

        if (this.spiderVenomTelegraphTimer > 0) {
            this.spiderVenomTelegraphTimer -= dt;
            this.vx = 0;
            this.spiderState = 'TELEGRAPH';
            if (this.spiderVenomTelegraphTimer <= 0) {
                const dir = this.spiderVenomDir || (this.facingRight ? 1 : -1);
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
            }
            return;
        }

        if (this.attackCooldown <= 0 && player) {
            const venomChance = this.phase >= 3 ? 0.33 : (this.phase >= 2 ? 0.27 : 0.20);
            if (this.spiderVenomCooldown <= 0 && Math.random() < venomChance) {
                const toPlayer = (player.x + player.width / 2) - (this.x + this.width / 2);
                this.spiderVenomDir = Math.sign(toPlayer) || (this.facingRight ? 1 : -1);
                this.spiderVenomTelegraphTimer = this.phase >= 3 ? 0.34 : (this.phase >= 2 ? 0.42 : 0.5);
                this.spiderState = 'TELEGRAPH';
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
                    this.dragonVolleyLaneY = this._getDragonMouthPosition().y;
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
                const mouth = this._getDragonMouthPosition();
                const dir = this.facingRight ? 1 : -1;
                const speed = 400 + this.phase * 24;
                game.enemyProjectiles.push(new BossProjectile(mouth.x, this.dragonVolleyLaneY, dir * speed, 0, 'flame'));
                this.dragonVolleyShots--;
                this.dragonVolleyTimer = 0.17;
                if (this.dragonVolleyShots <= 0) {
                    this.attackCooldown = 2.35 - (this.phase - 1) * 0.18 + Math.random() * 0.55;
                }
            }
            return;
        }

        const patrolSpeed = 175 + this.phase * 22;
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
            const coneTelegraph = this.phase >= 3 ? 0.35 : (this.phase >= 2 ? 0.42 : this.dragonFireTelegraphDuration);
            const volleyTelegraph = this.phase >= 3 ? 0.26 : (this.phase >= 2 ? 0.32 : 0.38);
            this.dragonFireTelegraphTimer = this.dragonAttackPattern === 'volley'
                ? (volleyTelegraph + Math.random() * 0.08)
                : coneTelegraph;
            this.vx = 0;
        }
    }

    _countActiveLobsterMinions(game) {
        if (!game || !game.enemies) return 0;
        let count = 0;
        for (let i = 0; i < game.enemies.length; i++) {
            const enemy = game.enemies[i];
            if (!enemy.markedForDeletion && enemy.type === TYPE_LOBSTER_MINION) {
                count++;
            }
        }
        return count;
    }

    _countActiveSpiderMinions(game) {
        if (!game || !game.enemies) return 0;
        let count = 0;
        for (let i = 0; i < game.enemies.length; i++) {
            const enemy = game.enemies[i];
            if (!enemy.markedForDeletion && enemy.type === TYPE_MINI_SPIDER) {
                count++;
            }
        }
        return count;
    }

    _countActiveShrimpProjectiles(game) {
        if (!game || !game.enemyProjectiles) return 0;
        let count = 0;
        for (let i = 0; i < game.enemyProjectiles.length; i++) {
            const p = game.enemyProjectiles[i];
            if (!p.markedForDeletion && p instanceof Shrimp) count++;
        }
        return count;
    }

    _spawnLobsterMinion(game) {
        if (!game || !this.platform) return;
        const minionLimit = this.phase >= 3 ? 3 : 2;
        if (this._countActiveLobsterMinions(game) >= minionLimit) return;

        const left = this.platform.x + 20;
        const right = this.platform.x + this.platform.width - 62;
        const sideBias = Math.random() < 0.5 ? -1 : 1;
        const spawnX = Math.max(left, Math.min(right, this.x + this.width / 2 + sideBias * (70 + Math.random() * 70)));

        const mini = new Enemy(spawnX, this.platform.y - 42, this.platform);
        mini.type = TYPE_LOBSTER_MINION;
        mini.emoji = String.fromCodePoint(0x1F99E);
        mini.width = 42;
        mini.height = 42;
        mini.x = spawnX;
        mini.y = this.platform.y - mini.height;
        mini.startX = mini.x;
        mini.startY = mini.y;
        mini.baseSpeed = 125 + this.phase * 12;
        mini.speed = mini.baseSpeed;
        mini.health = 1;
        mini.maxHealth = 1;
        mini.countsForCompletionObjective = false;
        mini.state = 'SCUTTLE';
        mini.stateTimer = 0.35 + Math.random() * 0.7;
        mini.facingRight = sideBias > 0;
        mini.vx = mini.facingRight ? mini.speed : -mini.speed;
        mini.vy = 0;
        mini._cachedEmoji = getEmojiCanvas(mini.emoji, mini.height);
        game.enemies.push(mini);
        game.totalEnemies++;

        if (game.particles) {
            const mx = mini.x + mini.width / 2;
            const my = mini.y + mini.height / 2;
            this._emitBossFx(game, mx, my, 8, '#ffad7a', [40, 120], [0.14, 0.35], [1.2, 2.8]);
        }
    }

    _spawnSpiderMinion(game) {
        if (!game || !this.platform) return;
        const minionLimit = this.phase >= 3 ? 4 : (this.phase >= 2 ? 3 : 2);
        if (this._countActiveSpiderMinions(game) >= minionLimit) return;
        const miniSize = 42;

        // Spawn from boss core, then let the mini settle onto and patrol the boss platform.
        const spawnCenterX = this.x + this.width / 2;
        const spawnCenterY = this.y + this.height * 0.52;
        const mini = new Enemy(spawnCenterX - miniSize / 2, spawnCenterY - miniSize / 2, this.platform);
        mini.type = TYPE_MINI_SPIDER;
        mini.emoji = String.fromCodePoint(0x1F577) + '\uFE0F';
        mini.width = miniSize;
        mini.height = miniSize;
        mini.x = spawnCenterX - mini.width / 2;
        mini.y = spawnCenterY - mini.height / 2;
        mini.startX = mini.x;
        mini.startY = mini.y;
        mini.platform = this.platform;
        mini.baseSpeed = 115 + this.phase * 10;
        mini.speed = mini.baseSpeed;
        mini.health = 1;
        mini.maxHealth = 1;
        mini.countsForCompletionObjective = false;
        mini.state = 'PATROL';
        mini.stateTimer = 0.8 + Math.random() * 1.2;
        mini.facingRight = Math.random() > 0.5;
        mini.vx = mini.facingRight ? mini.speed : -mini.speed;
        mini.vy = -(180 + Math.random() * 70); // short emergence hop from the core
        mini._cachedEmoji = getEmojiCanvas(mini.emoji, mini.height);

        game.enemies.push(mini);
        game.totalEnemies++;

        if (game.particles) {
            const mx = mini.x + mini.width / 2;
            const my = mini.y + mini.height / 2;
            this._emitBossFx(game, mx, my, 7, '#cdb7ff', [45, 130], [0.1, 0.3], [1.2, 2.7]);
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

    _updateLobsterBoss(dt, game, player) {
        const left = this.platform.x + 8;
        const right = this.platform.x + this.platform.width - this.width - 8;
        this.y = this.platform.y - this.height;
        this.x = Math.max(left, Math.min(right, this.x));

        if (this.lobsterMinionCooldown > 0) this.lobsterMinionCooldown -= dt;
        if (this.lobsterMinionCooldown <= 0) {
            this._spawnLobsterMinion(game);
            this.lobsterMinionCooldown = (this.phase >= 3 ? 3.0 : (this.phase >= 2 ? 3.4 : 3.8)) + Math.random() * 1.0;
        }

        if (this.lobsterTelegraphTimer > 0) {
            this.lobsterTelegraphTimer -= dt;
            this.vx = 0;
            if (player) {
                this.facingRight = (player.x + player.width / 2) > (this.x + this.width / 2);
            }
            if (this.lobsterTelegraphTimer <= 0) {
                if (this.lobsterTelegraphType === 'dash') {
                    this.lobsterDashDir = this.facingRight ? 1 : -1;
                    this.lobsterDashTimer = 0.32 + this.phase * 0.06;
                    this.lobsterDashFxTimer = 0;
                } else {
                    this.lobsterShrimpShots = this.phase >= 3 ? 6 : (this.phase >= 2 ? 5 : 4);
                    this.lobsterShrimpTimer = 0;
                }
            }
            return;
        }

        if (this.lobsterDashTimer > 0) {
            this.lobsterDashTimer -= dt;
            this.vx = this.lobsterDashDir * (320 + this.phase * 42);
            this.x += this.vx * dt;
            if (this.x <= left || this.x >= right) {
                this.x = Math.max(left, Math.min(right, this.x));
                this.lobsterDashTimer = 0;
            }
            this.lobsterDashFxTimer -= dt;
            if (this.lobsterDashFxTimer <= 0 && game && game.particles) {
                this.lobsterDashFxTimer = this._isBossVfxLite(game) ? 0.14 : 0.08;
                this._emitBossFx(game, this.x + this.width / 2, this.y + this.height * 0.7, 7, '#ffd6a6', [40, 120], [0.1, 0.26], [1.2, 2.6]);
            }
            if (this.lobsterDashTimer <= 0) {
                this.vx = 0;
                this.attackCooldown = 1.35 + Math.random() * 0.6;
            }
            return;
        }

        if (this.lobsterShrimpShots > 0) {
            this.vx = 0;
            this.lobsterShrimpTimer -= dt;
            if (this.lobsterShrimpTimer <= 0 && game) {
                const shrimpBudgetOk = this._countActiveShrimpProjectiles(game) < 18;
                const dir = this.facingRight ? 1 : -1;
                if (shrimpBudgetOk) {
                    const shotIndex = (this.phase >= 3 ? 6 : (this.phase >= 2 ? 5 : 4)) - this.lobsterShrimpShots;
                    const spawnX = this.x + this.width / 2 + dir * (this.width * 0.26);
                    const spawnY = this.y + this.height * 0.34;
                    const upVel = -340 - this.phase * 25 - Math.sin(shotIndex * 1.25) * 40;
                    const xVel = 220 + this.phase * 20 + ((shotIndex % 2 === 0) ? 28 : -18);
                    game.enemyProjectiles.push(new Shrimp(spawnX, spawnY, dir > 0, upVel, xVel));
                    if (game.particles) {
                        this._emitBossFx(game, spawnX, spawnY, 6, '#ffb199', [45, 140], [0.12, 0.3], [1.2, 2.8]);
                    }
                }
                this.lobsterShrimpShots--;
                this.lobsterShrimpTimer = 0.12;
                if (this.lobsterShrimpShots <= 0) {
                    this.attackCooldown = 1.65 + Math.random() * 0.75;
                }
            }
            return;
        }

        const patrolSpeed = 130 + this.phase * 14;
        this.vx = this.lobsterPatrolDir * patrolSpeed;
        this.x += this.vx * dt;
        if (this.x <= left) {
            this.x = left;
            this.lobsterPatrolDir = 1;
        } else if (this.x >= right) {
            this.x = right;
            this.lobsterPatrolDir = -1;
        }

        if (player) {
            const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
            this.facingRight = dx >= 0;
            if (this.attackCooldown <= 0) {
                const canDash = Math.abs(dx) > 110 && Math.abs(dx) < 420;
                const chooseDash = canDash && Math.random() < (this.phase >= 3 ? 0.5 : 0.4);
                this.lobsterTelegraphType = chooseDash ? 'dash' : 'spray';
                this.lobsterTelegraphTimer = chooseDash
                    ? (this.phase >= 3 ? 0.18 : (this.phase >= 2 ? 0.22 : 0.26))
                    : (this.phase >= 3 ? 0.28 : (this.phase >= 2 ? 0.32 : 0.36));
                this.vx = 0;
            }
        } else {
            this.facingRight = this.lobsterPatrolDir > 0;
        }
    }

    _spawnKangarooStompDebris(game) {
        if (!game) return;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height * 0.58;
        const speed = 250 + this.phase * 26;
        const shards = this.phase >= 3 ? 6 : (this.phase >= 2 ? 5 : 4);
        for (let i = 0; i < shards; i++) {
            const lane = i - (shards - 1) / 2;
            const dir = lane === 0 ? (Math.random() > 0.5 ? 1 : -1) : Math.sign(lane);
            const vx = dir * (speed + Math.abs(lane) * 42 + Math.random() * 34);
            const vy = -260 - Math.abs(lane) * 20 - Math.random() * 42;
            game.enemyProjectiles.push(new BossProjectile(centerX, centerY, vx, vy, 'stone'));
        }
    }

    _updateKangarooBoss(dt, game, player) {
        const left = this.platform.x + 8;
        const right = this.platform.x + this.platform.width - this.width - 8;
        const groundY = this.platform.y - this.height;

        if (this.kangarooLeapLandFxTimer > 0) this.kangarooLeapLandFxTimer -= dt;

        if (this.kangarooTelegraphTimer > 0) {
            this.kangarooTelegraphTimer -= dt;
            this.vx = 0;
            this.y = groundY;
            if (player) this.facingRight = (player.x + player.width / 2) > (this.x + this.width / 2);
            if (this.kangarooTelegraphTimer <= 0) {
                if (this.kangarooTelegraphType === 'boomerang') {
                    this.kangarooBoomerangShots = this.phase >= 3 ? 4 : (this.phase >= 2 ? 3 : 2);
                    this.kangarooBoomerangTimer = 0;
                } else {
                    this.kangarooState = 'LEAP';
                    const leapWindow = Math.max(0.5, 0.78 - this.phase * 0.08);
                    const playerBiasX = player
                        ? (player.x + player.width / 2 - this.width / 2 + (Math.random() * 80 - 40))
                        : this.x + this.kangarooPatrolDir * 220;
                    this.kangarooLeapTargetX = Math.max(left, Math.min(right, playerBiasX));
                    this.kangarooLeapVx = (this.kangarooLeapTargetX - this.x) / leapWindow;
                    this.kangarooLeapVy = -(680 + this.phase * 45);
                }
            }
            return;
        }

        if (this.kangarooBoomerangShots > 0) {
            this.vx = 0;
            this.y = groundY;
            this.kangarooBoomerangTimer -= dt;
            if (this.kangarooBoomerangTimer <= 0 && player) {
                const total = this.phase >= 3 ? 4 : (this.phase >= 2 ? 3 : 2);
                const shotIndex = total - this.kangarooBoomerangShots;
                const spreadPattern = total === 4 ? [-0.26, -0.09, 0.09, 0.26] : (total === 3 ? [-0.18, 0, 0.18] : [-0.12, 0.12]);
                const spread = spreadPattern[Math.max(0, Math.min(shotIndex, spreadPattern.length - 1))];
                this._spawnProjectile(game, player, 'boomerang', 420 + this.phase * 34, spread, -12);
                this.kangarooBoomerangShots--;
                this.kangarooBoomerangTimer = 0.13;
                if (this.kangarooBoomerangShots <= 0) {
                    this.attackCooldown = 1.55 + Math.random() * 0.75;
                }
            }
            return;
        }

        if (this.kangarooState === 'LEAP') {
            this.kangarooLeapVy += Physics.GRAVITY * 0.95 * dt;
            this.x += this.kangarooLeapVx * dt;
            this.y += this.kangarooLeapVy * dt;
            this.vx = this.kangarooLeapVx;
            this.facingRight = this.vx >= 0;

            if (this.x <= left || this.x >= right) {
                this.x = Math.max(left, Math.min(right, this.x));
                this.kangarooLeapVx *= -0.45;
            }

            if (this.y >= groundY) {
                this.y = groundY;
                this.kangarooState = 'PATROL';
                this.kangarooLeapVy = 0;
                this.kangarooLeapVx = 0;
                this.kangarooHopCycle = Math.random() * Math.PI * 2;
                this.kangarooLeapLandFxTimer = 0.22;
                this._spawnKangarooStompDebris(game);
                if (game && game.particles) {
                    this._emitBossFx(game, this.x + this.width / 2, this.y + this.height * 0.9, 11, '#ffd8a8', [50, 150], [0.12, 0.32], [1.2, 2.9]);
                }
                this.attackCooldown = 1.45 + Math.random() * 0.7;
            }
            return;
        }

        // PATROL: rhythmic forward hops.
        const patrolSpeed = 150 + this.phase * 16;
        this.vx = this.kangarooPatrolDir * patrolSpeed;
        this.x += this.vx * dt;
        if (this.x <= left) {
            this.x = left;
            this.kangarooPatrolDir = 1;
        } else if (this.x >= right) {
            this.x = right;
            this.kangarooPatrolDir = -1;
        }

        this.kangarooHopCycle += dt * (5.4 + this.phase * 0.55);
        const hopLift = Math.max(0, Math.sin(this.kangarooHopCycle)) * (16 + this.phase * 3);
        this.y = groundY - hopLift;

        if (player) {
            const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
            this.facingRight = dx >= 0;
            if (this.attackCooldown <= 0) {
                const canSlam = Math.abs(dx) > 130 && Math.abs(dx) < 460;
                const chooseSlam = canSlam && Math.random() < (this.phase >= 3 ? 0.6 : (this.phase >= 2 ? 0.52 : 0.44));
                this.kangarooTelegraphType = chooseSlam ? 'slam' : 'boomerang';
                this.kangarooTelegraphTimer = chooseSlam
                    ? (this.phase >= 3 ? 0.2 : (this.phase >= 2 ? 0.24 : 0.3))
                    : (this.phase >= 3 ? 0.18 : (this.phase >= 2 ? 0.24 : 0.3));
                this.kangarooLeapTargetX = Math.max(left, Math.min(right, player.x + player.width / 2 - this.width / 2));
                this.vx = 0;
            }
        } else {
            this.facingRight = this.kangarooPatrolDir > 0;
        }
    }

    _spawnMoaiQuakeBurst(game) {
        if (!game) return;
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height * 0.78;
        const lanes = this.phase >= 3 ? 3 : 2;
        for (let dir = -1; dir <= 1; dir += 2) {
            for (let i = 0; i < lanes; i++) {
                const vx = dir * (220 + this.phase * 18 + i * 95 + Math.random() * 30);
                const vy = 20 + i * 28 + Math.random() * 18;
                game.enemyProjectiles.push(new BossProjectile(cx, cy, vx, vy, 'stone'));
            }
        }
    }

    _updateMoaiBoss(dt, game, player) {
        const left = this.platform.x + 12;
        const right = this.platform.x + this.platform.width - this.width - 12;
        const groundY = this.platform.y - this.height;
        const highY = this.platform.y - this.height - (200 + this.phase * 18);
        const lowY = groundY - (16 + this.phase * 2);
        const swoopBlend = (Math.sin(this.timeAlive * 0.58) + 1) * 0.5;
        const hoverBaseY = highY + (lowY - highY) * swoopBlend;
        this.moaiHoverCenterY += (hoverBaseY - this.moaiHoverCenterY) * Math.min(1, dt * 2.2);
        const hoverY = this.moaiHoverCenterY + Math.sin(this.timeAlive * (2.1 + this.phase * 0.2)) * (18 + this.phase * 2);

        if (this.moaiTelegraphTimer > 0) {
            this.moaiTelegraphTimer -= dt;
            this.vx = 0;
            this.y = hoverY;
            if (player) this.facingRight = (player.x + player.width / 2) > (this.x + this.width / 2);
            if (this.moaiTelegraphTimer <= 0) {
                if (this.moaiTelegraphType === 'gaze_beam') {
                    this.moaiState = 'GAZE';
                    this.moaiBeamShots = this.phase >= 3 ? 7 : (this.phase >= 2 ? 6 : 5);
                    this.moaiBeamTimer = 0;
                } else if (this.moaiTelegraphType === 'meteor_rain') {
                    this.moaiState = 'METEOR';
                    this.moaiMeteorWaves = this.phase >= 3 ? 4 : (this.phase >= 2 ? 3 : 2);
                    this.moaiMeteorTimer = 0;
                    this.moaiMeteorCenterX = player ? (player.x + player.width / 2) : (this.x + this.width / 2 + this.moaiPatrolDir * 120);
                } else {
                    this.moaiState = 'QUAKE';
                    this.moaiQuakeWaves = this.phase >= 3 ? 3 : 2;
                    this.moaiQuakeTimer = 0;
                }
            }
            return;
        }

        if (this.moaiState === 'GAZE') {
            this.vx = 0;
            this.y = hoverY;
            this.moaiBeamTimer -= dt;
            if (this.moaiBeamTimer <= 0) {
                const total = this.phase >= 3 ? 7 : (this.phase >= 2 ? 6 : 5);
                const shotIndex = total - this.moaiBeamShots;
                const verticalPattern = [-0.2, -0.08, 0.05, 0.18, 0, -0.12, 0.12];
                const tilt = verticalPattern[shotIndex % verticalPattern.length];
                const dir = this.facingRight ? 1 : -1;
                const eyeX = this.x + this.width / 2 + dir * (this.width * 0.24);
                const eyeY = this.y + this.height * 0.34;
                const vx = dir * (640 + this.phase * 34);
                const vy = tilt * (250 + this.phase * 35);
                game.enemyProjectiles.push(new BossProjectile(eyeX, eyeY, vx, vy, 'needle'));
                this.moaiBeamShots--;
                this.moaiBeamTimer = 0.08;
                if (this.moaiBeamShots <= 0) {
                    this.moaiState = 'PATROL';
                    this.attackCooldown = 1.45 + Math.random() * 0.65;
                }
            }
            return;
        }

        if (this.moaiState === 'METEOR') {
            this.vx = 0;
            this.y = hoverY;
            this.moaiMeteorTimer -= dt;
            if (this.moaiMeteorTimer <= 0) {
                const drops = this.phase >= 3 ? 5 : 4;
                for (let i = 0; i < drops; i++) {
                    const lane = i - (drops - 1) / 2;
                    const dropX = Math.max(left + 30, Math.min(right + this.width - 30, this.moaiMeteorCenterX + lane * 78 + (Math.random() * 46 - 23)));
                    const dropY = this.y - 380 - Math.random() * 120;
                    const vx = Math.random() * 44 - 22;
                    const vy = 350 + this.phase * 34 + Math.random() * 50;
                    game.enemyProjectiles.push(new BossProjectile(dropX, dropY, vx, vy, 'stone'));
                }
                this.moaiMeteorWaves--;
                this.moaiMeteorTimer = 0.2;
                if (this.moaiMeteorWaves <= 0) {
                    this.moaiState = 'PATROL';
                    this.attackCooldown = 1.8 + Math.random() * 0.75;
                }
            }
            return;
        }

        if (this.moaiState === 'QUAKE') {
            this.vx = 0;
            this.y = hoverY;
            this.moaiQuakeTimer -= dt;
            if (this.moaiQuakeTimer <= 0) {
                this._spawnMoaiQuakeBurst(game);
                this.moaiQuakeWaves--;
                this.moaiQuakeTimer = 0.18;
                if (this.moaiQuakeWaves <= 0) {
                    this.moaiState = 'PATROL';
                    this.attackCooldown = 1.55 + Math.random() * 0.7;
                }
            }
            return;
        }

        // PATROL: slow sentinel glide while hovering.
        const patrolSpeed = 96 + this.phase * 12;
        this.vx = this.moaiPatrolDir * patrolSpeed;
        this.x += this.vx * dt;
        this.y = hoverY;
        if (this.x <= left) {
            this.x = left;
            this.moaiPatrolDir = 1;
        } else if (this.x >= right) {
            this.x = right;
            this.moaiPatrolDir = -1;
        }

        if (player) {
            const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
            this.facingRight = dx >= 0;
            if (this.attackCooldown <= 0) {
                const dist = Math.abs(dx);
                const roll = Math.random();
                if (dist > 190 && dist < 850 && roll < 0.42) {
                    this.moaiTelegraphType = 'gaze_beam';
                } else if (roll < 0.72) {
                    this.moaiTelegraphType = 'meteor_rain';
                    this.moaiMeteorCenterX = player.x + player.width / 2;
                } else {
                    this.moaiTelegraphType = 'quake';
                }
                this.moaiTelegraphTimer = this.moaiTelegraphType === 'gaze_beam'
                    ? (this.phase >= 3 ? 0.22 : (this.phase >= 2 ? 0.28 : 0.34))
                    : (this.moaiTelegraphType === 'meteor_rain'
                        ? (this.phase >= 3 ? 0.2 : (this.phase >= 2 ? 0.26 : 0.33))
                        : (this.phase >= 3 ? 0.18 : (this.phase >= 2 ? 0.24 : 0.3)));
                this.vx = 0;
            }
        } else {
            this.facingRight = this.moaiPatrolDir > 0;
        }
    }

    _spawnMonkeyLandingBurst(game) {
        if (!game) return;
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height * 0.72;
        const shots = this.phase >= 3 ? 6 : (this.phase >= 2 ? 5 : 4);
        for (let i = 0; i < shots; i++) {
            const lane = i - (shots - 1) / 2;
            const dir = lane === 0 ? (Math.random() > 0.5 ? 1 : -1) : Math.sign(lane);
            const vx = dir * (240 + this.phase * 20 + Math.abs(lane) * 38 + Math.random() * 24);
            const vy = -240 - Math.abs(lane) * 18 - Math.random() * 45;
            game.enemyProjectiles.push(new BossProjectile(cx, cy, vx, vy, 'banana'));
        }
    }

    _updateMonkeyBoss(dt, game, player) {
        const left = this.platform.x + 8;
        const right = this.platform.x + this.platform.width - this.width - 8;
        const groundY = this.platform.y - this.height;
        const canopyY = Math.max(56, this.platform.y - this.height - (210 + this.phase * 16));
        this.monkeyCanopyY = canopyY;

        // Safety: recover immediately if an invalid transform sneaks in.
        if (!Number.isFinite(this.x) || !Number.isFinite(this.y)) {
            this.x = Math.max(left, Math.min(right, this.platform.x + this.platform.width * 0.5 - this.width * 0.5));
            this.y = groundY;
            this.monkeyState = 'PATROL';
            this.monkeyTelegraphTimer = 0;
            this.monkeyCoconutShots = 0;
            this.monkeyDiveVx = 0;
            this.monkeyDiveVy = 0;
            this.monkeyAscendTimer = 0;
            this.monkeyAscendTargetY = canopyY;
        }

        if (this.monkeyTelegraphTimer > 0) {
            this.monkeyTelegraphTimer -= dt;
            this.vx = 0;
            this.y = groundY;
            if (player) this.facingRight = (player.x + player.width / 2) > (this.x + this.width / 2);
            if (this.monkeyTelegraphTimer <= 0) {
                if (this.monkeyTelegraphType === 'coconut_burst') {
                    this.monkeyCoconutShots = this.phase >= 3 ? 5 : (this.phase >= 2 ? 4 : 3);
                    this.monkeyCoconutTimer = 0;
                } else if (this.monkeyTelegraphType === 'banana_rain') {
                    this.monkeyState = 'CANOPY_ASCEND';
                    if (player) {
                        const playerMid = player.x + player.width / 2;
                        if (playerMid > this.platform.x + this.platform.width / 2) {
                            this.monkeyCanopyTargetX = left + 24;
                            this.monkeyCanopyDir = 1;
                        } else {
                            this.monkeyCanopyTargetX = right - 24;
                            this.monkeyCanopyDir = -1;
                        }
                    } else {
                        this.monkeyCanopyTargetX = Math.max(left, Math.min(right, this.x + this.monkeyPatrolDir * 140));
                        this.monkeyCanopyDir = this.monkeyPatrolDir;
                    }
                    this.monkeyCanopyTargetY = canopyY;
                    this.monkeyCanopyTimer = 0;
                    this.monkeyBananaDropTimer = 0;
                } else {
                    this.monkeyState = 'ASCEND';
                    const diveWindow = Math.max(0.42, 0.62 - this.phase * 0.05);
                    const target = player ? (player.x + player.width / 2 - this.width / 2 + (Math.random() * 60 - 30)) : (this.x + this.monkeyPatrolDir * 190);
                    this.monkeyDiveTargetX = Math.max(left, Math.min(right, target));
                    this.monkeyDiveVx = (this.monkeyDiveTargetX - this.x) / diveWindow;
                    this.monkeyDiveVy = 0;
                    this.monkeyAscendTargetY = Math.max(canopyY + 12, groundY - (176 + this.phase * 20));
                    this.monkeyAscendTimer = Math.max(0.22, 0.34 - this.phase * 0.025);
                }
            }
            return;
        }

        if (this.monkeyState === 'CANOPY_ASCEND') {
            const dx = this.monkeyCanopyTargetX - this.x;
            const dy = this.monkeyCanopyTargetY - this.y;
            const moveSpeedX = 520 + this.phase * 45;
            const moveSpeedY = 600 + this.phase * 35;
            const stepX = Math.min(Math.abs(dx), moveSpeedX * dt) * Math.sign(dx || 0);
            const stepY = Math.min(Math.abs(dy), moveSpeedY * dt) * Math.sign(dy || 0);

            this.x += stepX;
            this.y += stepY;
            this.vx = dt > 0 ? (stepX / dt) : 0;
            if (Math.abs(this.vx) > 1) this.facingRight = this.vx > 0;

            const arrived = Math.abs(dx) <= 2.5 && Math.abs(dy) <= 2.5;
            if (arrived) {
                this.x = this.monkeyCanopyTargetX;
                this.y = this.monkeyCanopyTargetY;
                this.monkeyState = 'CANOPY';
                this.monkeyCanopyTimer = 1.25 + this.phase * 0.22;
                this.monkeyBananaDropTimer = 0.04;
            }
            return;
        }

        if (this.monkeyCoconutShots > 0) {
            this.vx = 0;
            this.y = groundY;
            this.monkeyCoconutTimer -= dt;
            if (this.monkeyCoconutTimer <= 0 && player) {
                const total = this.phase >= 3 ? 5 : (this.phase >= 2 ? 4 : 3);
                const shotIndex = total - this.monkeyCoconutShots;
                const spreads = total === 5 ? [-0.24, -0.11, 0, 0.11, 0.24] : (total === 4 ? [-0.2, -0.07, 0.07, 0.2] : [-0.12, 0, 0.12]);
                const spread = spreads[Math.max(0, Math.min(shotIndex, spreads.length - 1))];
                this._spawnProjectile(game, player, 'coconut', 500 + this.phase * 28, spread, -95);
                this.monkeyCoconutShots--;
                this.monkeyCoconutTimer = 0.11;
                if (this.monkeyCoconutShots <= 0) {
                    this.attackCooldown = 1.5 + Math.random() * 0.75;
                }
            }
            return;
        }

        if (this.monkeyState === 'ASCEND') {
            this.monkeyAscendTimer -= dt;
            const targetY = this.monkeyAscendTargetY;
            const riseSpeed = 560 + this.phase * 40;
            const riseStep = riseSpeed * dt;
            this.y = Math.max(targetY, this.y - riseStep);

            const steering = Math.max(-360, Math.min(360, (this.monkeyDiveTargetX - this.x) * 4.8));
            this.vx = steering;
            this.x += this.vx * dt;
            this.x = Math.max(left, Math.min(right, this.x));
            this.facingRight = this.vx >= 0;

            if (this.y <= targetY + 0.5 || this.monkeyAscendTimer <= 0) {
                this.monkeyState = 'DIVE';
                const diveWindow = Math.max(0.36, 0.52 - this.phase * 0.04);
                this.monkeyDiveVx = (this.monkeyDiveTargetX - this.x) / diveWindow;
                this.monkeyDiveVy = 180 + this.phase * 28;
            }
            return;
        }

        if (this.monkeyState === 'CANOPY') {
            this.monkeyCanopyTimer -= dt;
            const canopySpeed = 250 + this.phase * 28;
            this.x += this.monkeyCanopyDir * canopySpeed * dt;
            this.y = canopyY + Math.sin(this.timeAlive * 8.5) * 8;
            this.vx = this.monkeyCanopyDir * canopySpeed;
            this.facingRight = this.monkeyCanopyDir > 0;
            if (this.x <= left || this.x >= right) {
                this.x = Math.max(left, Math.min(right, this.x));
                this.monkeyCanopyDir *= -1;
            }

            this.monkeyBananaDropTimer -= dt;
            if (this.monkeyBananaDropTimer <= 0) {
                const px = player ? (player.x + player.width / 2) : (this.x + this.width / 2 + this.monkeyCanopyDir * 80);
                const dx = px - (this.x + this.width / 2);
                const vx = Math.max(-260, Math.min(260, dx * 1.9 + (Math.random() * 70 - 35)));
                const vy = 250 + this.phase * 30;
                game.enemyProjectiles.push(new BossProjectile(this.x + this.width / 2, this.y + this.height * 0.7, vx, vy, 'banana'));
                this.monkeyBananaDropTimer = Math.max(0.1, 0.18 - this.phase * 0.02);
            }

            if (this.monkeyCanopyTimer <= 0) {
                this.monkeyState = 'DIVE';
                const diveWindow = Math.max(0.4, 0.58 - this.phase * 0.05);
                const target = player ? (player.x + player.width / 2 - this.width / 2 + (Math.random() * 70 - 35)) : (this.x + this.monkeyCanopyDir * 180);
                this.monkeyDiveTargetX = Math.max(left, Math.min(right, target));
                this.monkeyDiveVx = (this.monkeyDiveTargetX - this.x) / diveWindow;
                // From canopy we should dive down immediately, not pop further upward.
                this.monkeyDiveVy = 260 + this.phase * 30;
            }
            return;
        }

        if (this.monkeyState === 'DIVE') {
            this.monkeyDiveVy += Physics.GRAVITY * dt;
            this.x += this.monkeyDiveVx * dt;
            this.y += this.monkeyDiveVy * dt;
            this.vx = this.monkeyDiveVx;
            this.facingRight = this.vx >= 0;
            if (this.x <= left || this.x >= right) {
                this.x = Math.max(left, Math.min(right, this.x));
                this.monkeyDiveVx *= -0.35;
            }

            if (this.y >= groundY) {
                this.y = groundY;
                this.monkeyState = 'PATROL';
                this.monkeyDiveVx = 0;
                this.monkeyDiveVy = 0;
                this.monkeyAscendTimer = 0;
                this.monkeyHopCycle = Math.random() * Math.PI * 2;
                this._spawnMonkeyLandingBurst(game);
                if (game && game.particles) {
                    this._emitBossFx(game, this.x + this.width / 2, this.y + this.height * 0.92, 12, '#ffe29a', [55, 160], [0.12, 0.34], [1.2, 3.0]);
                }
                this.attackCooldown = 1.3 + Math.random() * 0.65;
            }
            return;
        }

        // PATROL: short, jittery monkey hops.
        const patrolSpeed = 145 + this.phase * 14;
        this.vx = this.monkeyPatrolDir * patrolSpeed;
        this.x += this.vx * dt;
        if (this.x <= left) {
            this.x = left;
            this.monkeyPatrolDir = 1;
        } else if (this.x >= right) {
            this.x = right;
            this.monkeyPatrolDir = -1;
        }
        this.monkeyHopCycle += dt * (6.2 + this.phase * 0.45);
        this.y = groundY - Math.max(0, Math.sin(this.monkeyHopCycle)) * (12 + this.phase * 2.5);

        if (player) {
            const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
            this.facingRight = dx >= 0;
            if (this.attackCooldown <= 0) {
                const dist = Math.abs(dx);
                const canDive = dist > 140 && dist < 460;
                const roll = Math.random();
                if (canDive && roll < (this.phase >= 3 ? 0.45 : 0.34)) {
                    this.monkeyTelegraphType = 'dive';
                    this.monkeyDiveTargetX = Math.max(left, Math.min(right, player.x + player.width / 2 - this.width / 2));
                } else if (roll < 0.72) {
                    this.monkeyTelegraphType = 'banana_rain';
                } else {
                    this.monkeyTelegraphType = 'coconut_burst';
                }
                this.monkeyTelegraphTimer = this.monkeyTelegraphType === 'banana_rain'
                    ? (this.phase >= 3 ? 0.2 : (this.phase >= 2 ? 0.25 : 0.32))
                    : (this.monkeyTelegraphType === 'dive'
                        ? (this.phase >= 3 ? 0.18 : (this.phase >= 2 ? 0.23 : 0.3))
                        : (this.phase >= 3 ? 0.22 : (this.phase >= 2 ? 0.28 : 0.34)));
                this.vx = 0;
            }
        } else {
            this.facingRight = this.monkeyPatrolDir > 0;
        }
    }

    _spawnMammothIcicleRain(game) {
        if (!game) return;
        const wavesLeft = this.mammothRainWaves;
        const lanes = this.phase >= 3 ? 4 : (this.phase >= 2 ? 3 : 3);
        const spacing = 62;
        for (let i = 0; i < lanes; i++) {
            const lane = i - (lanes - 1) / 2;
            const x = this.mammothRainCenterX + lane * spacing + (Math.random() * 20 - 10);
            const y = this.platform.y - this.height - 330 - Math.random() * 110 - (wavesLeft * 12);
            const vy = 470 + this.phase * 36 + Math.random() * 30;
            const vx = lane * 6;
            game.enemyProjectiles.push(new BossProjectile(x, y, vx, vy, 'icicle'));
        }
    }

    _updateMammothBoss(dt, game, player) {
        const left = this.platform.x + 8;
        const right = this.platform.x + this.platform.width - this.width - 8;
        const groundY = this.platform.y - this.height;
        this.y = groundY;

        if (this.mammothTelegraphTimer > 0) {
            this.mammothTelegraphTimer -= dt;
            this.vx = 0;
            if (player) this.facingRight = (player.x + player.width / 2) > (this.x + this.width / 2);
            if (this.mammothTelegraphTimer <= 0) {
                if (this.mammothTelegraphType === 'charge') {
                    this.mammothState = 'CHARGE';
                    this.mammothChargeDir = this.facingRight ? 1 : -1;
                    this.mammothChargeTimer = 0.42 + this.phase * 0.1;
                    this.mammothChargeFxTimer = 0;
                } else if (this.mammothTelegraphType === 'frost_fan') {
                    this.mammothFrostShots = this.phase >= 3 ? 4 : (this.phase >= 2 ? 3 : 2);
                    this.mammothFrostTimer = 0;
                } else {
                    this.mammothRainWaves = this.phase >= 3 ? 3 : (this.phase >= 2 ? 3 : 2);
                    this.mammothRainTimer = 0;
                }
            }
            return;
        }

        if (this.mammothFrostShots > 0) {
            this.vx = 0;
            this.mammothFrostTimer -= dt;
            if (this.mammothFrostTimer <= 0 && player) {
                const spreads = this.phase >= 3 ? [-0.24, -0.08, 0.08, 0.24] : (this.phase >= 2 ? [-0.18, 0, 0.18] : [-0.12, 0.12]);
                const cx = this.x + this.width / 2;
                const cy = this.y + this.height / 2;
                const dx = (player.x + player.width / 2) - cx;
                const dy = (player.y + player.height / 2) - cy;
                const baseAngle = Math.atan2(dy, dx);
                const shotSpeed = 510 + this.phase * 32;
                for (let i = 0; i < spreads.length; i++) {
                    const a = baseAngle + spreads[i];
                    const vx = Math.cos(a) * shotSpeed;
                    const vy = Math.sin(a) * shotSpeed - 16;
                    const shard = new BossProjectile(cx, cy, vx, vy, 'icicle');
                    shard.rollOnLand = true;
                    shard.icicleRollSpeed = 210 + this.phase * 18;
                    shard.projectileLifetime = 3.4;
                    game.enemyProjectiles.push(shard);
                }
                this.facingRight = dx >= 0;
                this.mammothFrostShots--;
                this.mammothFrostTimer = 0.16;
                if (this.mammothFrostShots <= 0) this.attackCooldown = 1.6 + Math.random() * 0.75;
            }
            return;
        }

        if (this.mammothRainWaves > 0) {
            this.vx = 0;
            this.mammothRainTimer -= dt;
            if (this.mammothRainTimer <= 0) {
                // Keep rain around the telegraphed center; only slight drift per wave.
                this.mammothRainCenterX += (Math.random() * 44 - 22);
                this.mammothRainCenterX = Math.max(left + 78, Math.min(right + this.width - 78, this.mammothRainCenterX));
                this._spawnMammothIcicleRain(game);
                this.mammothRainWaves--;
                this.mammothRainTimer = Math.max(0.24, 0.38 - this.phase * 0.03);
                if (this.mammothRainWaves <= 0) this.attackCooldown = 1.8 + Math.random() * 0.8;
            }
            return;
        }

        if (this.mammothState === 'CHARGE') {
            this.mammothChargeTimer -= dt;
            this.vx = this.mammothChargeDir * (330 + this.phase * 34);
            this.x += this.vx * dt;
            this.facingRight = this.vx >= 0;
            if (this.x <= left || this.x >= right) {
                this.x = Math.max(left, Math.min(right, this.x));
                this.mammothState = 'PATROL';
                this.attackCooldown = 1.25 + Math.random() * 0.7;
                this.mammothChargeTimer = 0;
                return;
            }
            this.mammothChargeFxTimer -= dt;
            if (this.mammothChargeFxTimer <= 0 && game && game.particles) {
                this.mammothChargeFxTimer = this._isBossVfxLite(game) ? 0.14 : 0.09;
                this._emitBossFx(game, this.x + this.width * 0.5, this.y + this.height * 0.88, 8, '#e6f7ff', [40, 125], [0.1, 0.25], [1.2, 2.6]);
            }
            if (this.mammothChargeTimer <= 0) {
                this.mammothState = 'PATROL';
                this.attackCooldown = 1.35 + Math.random() * 0.8;
            }
            return;
        }

        // PATROL
        const patrolSpeed = 122 + this.phase * 11;
        this.vx = this.mammothPatrolDir * patrolSpeed;
        this.x += this.vx * dt;
        if (this.x <= left) {
            this.x = left;
            this.mammothPatrolDir = 1;
        } else if (this.x >= right) {
            this.x = right;
            this.mammothPatrolDir = -1;
        }

        if (player) {
            const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
            const dist = Math.abs(dx);
            this.facingRight = dx >= 0;
            if (this.attackCooldown <= 0) {
                const roll = Math.random();
                if (dist > 150 && dist < 500 && roll < (this.phase >= 3 ? 0.45 : 0.35)) {
                    this.mammothTelegraphType = 'charge';
                } else if (roll < 0.7) {
                    this.mammothTelegraphType = 'icicle_rain';
                } else {
                    this.mammothTelegraphType = 'frost_fan';
                }
                this.mammothTelegraphTimer = this.mammothTelegraphType === 'charge'
                    ? (this.phase >= 3 ? 0.16 : (this.phase >= 2 ? 0.22 : 0.28))
                    : (this.mammothTelegraphType === 'frost_fan'
                        ? (this.phase >= 3 ? 0.2 : (this.phase >= 2 ? 0.25 : 0.32))
                        : (this.phase >= 3 ? 0.48 : (this.phase >= 2 ? 0.56 : 0.66)));
                this.mammothRainCenterX = Math.max(left + 78, Math.min(right + this.width - 78, player.x + player.width / 2));
                this.vx = 0;
            }
        } else {
            this.facingRight = this.mammothPatrolDir > 0;
        }
    }

    _spawnTrexRoarWave(game) {
        if (!game) return;
        const dir = this.facingRight ? 1 : -1;
        const mouthX = this.x + this.width / 2 + dir * (this.width * 0.2);
        const baseY = this.y + this.height * 0.46;
        const lanes = this.phase >= 3 ? 4 : 3;
        for (let i = 0; i < lanes; i++) {
            const lane = i - (lanes - 1) / 2;
            const y = baseY + lane * 22;
            const speed = 430 + this.phase * 36 + Math.abs(lane) * 26;
            game.enemyProjectiles.push(new BossProjectile(mouthX, y, dir * speed, lane * 10, 'roar'));
        }
    }

    _spawnTrexImpactBurst(game) {
        if (!game) return;
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height * 0.72;
        const count = this.phase >= 3 ? 6 : (this.phase >= 2 ? 5 : 4);
        for (let i = 0; i < count; i++) {
            const lane = i - (count - 1) / 2;
            const dir = lane === 0 ? (Math.random() > 0.5 ? 1 : -1) : Math.sign(lane);
            const vx = dir * (250 + this.phase * 22 + Math.abs(lane) * 34 + Math.random() * 24);
            const vy = -220 - Math.abs(lane) * 18 - Math.random() * 40;
            game.enemyProjectiles.push(new BossProjectile(cx, cy, vx, vy, 'stone'));
        }
    }

    _updateTrexBoss(dt, game, player) {
        const left = this.platform.x + 8;
        const right = this.platform.x + this.platform.width - this.width - 8;
        const groundY = this.platform.y - this.height;
        this.y = groundY;

        if (this.trexTelegraphTimer > 0) {
            this.trexTelegraphTimer -= dt;
            this.vx = 0;
            if (player) this.facingRight = (player.x + player.width / 2) > (this.x + this.width / 2);
            if (this.trexTelegraphTimer <= 0) {
                if (this.trexTelegraphType === 'roar') {
                    this.trexRoarWaves = this.phase >= 3 ? 4 : (this.phase >= 2 ? 3 : 2);
                    this.trexRoarTimer = 0;
                } else if (this.trexTelegraphType === 'fossil') {
                    this.trexFossilShots = this.phase >= 3 ? 5 : (this.phase >= 2 ? 4 : 3);
                    this.trexFossilTimer = 0;
                } else {
                    this.trexState = 'LUNGE';
                    this.trexLungeDir = this.facingRight ? 1 : -1;
                    this.trexLungeTimer = 0.36 + this.phase * 0.08;
                    this.trexLungeFxTimer = 0;
                }
            }
            return;
        }

        if (this.trexRoarWaves > 0) {
            this.vx = 0;
            this.trexRoarTimer -= dt;
            if (this.trexRoarTimer <= 0) {
                this._spawnTrexRoarWave(game);
                this.trexRoarWaves--;
                this.trexRoarTimer = Math.max(0.12, 0.2 - this.phase * 0.02);
                if (this.trexRoarWaves <= 0) this.attackCooldown = 1.45 + Math.random() * 0.75;
            }
            return;
        }

        if (this.trexFossilShots > 0) {
            this.vx = 0;
            this.trexFossilTimer -= dt;
            if (this.trexFossilTimer <= 0 && player) {
                const total = this.phase >= 3 ? 5 : (this.phase >= 2 ? 4 : 3);
                const shotIndex = total - this.trexFossilShots;
                const spreads = total === 5 ? [-0.22, -0.1, 0, 0.1, 0.22] : (total === 4 ? [-0.18, -0.06, 0.06, 0.18] : [-0.12, 0, 0.12]);
                const spread = spreads[Math.max(0, Math.min(shotIndex, spreads.length - 1))];
                this._spawnProjectile(game, player, 'fossil', 520 + this.phase * 35, spread, -75);
                this.trexFossilShots--;
                this.trexFossilTimer = 0.12;
                if (this.trexFossilShots <= 0) this.attackCooldown = 1.55 + Math.random() * 0.8;
            }
            return;
        }

        if (this.trexState === 'LUNGE') {
            this.trexLungeTimer -= dt;
            this.vx = this.trexLungeDir * (360 + this.phase * 40);
            this.x += this.vx * dt;
            this.facingRight = this.vx >= 0;
            if (this.x <= left || this.x >= right) {
                this.x = Math.max(left, Math.min(right, this.x));
                this.trexState = 'PATROL';
                this._spawnTrexImpactBurst(game);
                this.attackCooldown = 1.25 + Math.random() * 0.65;
                return;
            }
            this.trexLungeFxTimer -= dt;
            if (this.trexLungeFxTimer <= 0 && game && game.particles) {
                this.trexLungeFxTimer = this._isBossVfxLite(game) ? 0.14 : 0.08;
                this._emitBossFx(game, this.x + this.width * 0.5, this.y + this.height * 0.88, 8, '#ffdcb5', [45, 125], [0.11, 0.28], [1.2, 2.7]);
            }
            if (this.trexLungeTimer <= 0) {
                this.trexState = 'PATROL';
                this._spawnTrexImpactBurst(game);
                this.attackCooldown = 1.35 + Math.random() * 0.7;
            }
            return;
        }

        // PATROL
        const patrolSpeed = 130 + this.phase * 13;
        this.vx = this.trexPatrolDir * patrolSpeed;
        this.x += this.vx * dt;
        if (this.x <= left) {
            this.x = left;
            this.trexPatrolDir = 1;
        } else if (this.x >= right) {
            this.x = right;
            this.trexPatrolDir = -1;
        }

        if (player) {
            const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
            const dist = Math.abs(dx);
            this.facingRight = dx >= 0;
            if (this.attackCooldown <= 0) {
                const roll = Math.random();
                if (dist > 140 && dist < 470 && roll < (this.phase >= 3 ? 0.44 : 0.34)) {
                    this.trexTelegraphType = 'lunge';
                } else if (roll < 0.68) {
                    this.trexTelegraphType = 'roar';
                } else {
                    this.trexTelegraphType = 'fossil';
                }
                this.trexTelegraphTimer = this.trexTelegraphType === 'lunge'
                    ? (this.phase >= 3 ? 0.14 : (this.phase >= 2 ? 0.2 : 0.26))
                    : (this.trexTelegraphType === 'roar'
                        ? (this.phase >= 3 ? 0.18 : (this.phase >= 2 ? 0.24 : 0.3))
                        : (this.phase >= 3 ? 0.2 : (this.phase >= 2 ? 0.26 : 0.33)));
                this.vx = 0;
            }
        } else {
            this.facingRight = this.trexPatrolDir > 0;
        }
    }

    _updateMosquitoBoss(dt, game, player) {
        const left = this.platform.x + 8;
        const right = this.platform.x + this.platform.width - this.width - 8;
        const top = this.platform.y - this.height - 360;
        const bottom = this.platform.y - this.height - 24;
        const centerY = this.mosquitoHoverCenterY;
        const personalSpaceRadius = 212;
        const playerCenterX = player ? (player.x + player.width / 2) : null;
        const playerCenterY = player ? (player.y + player.height / 2) : null;
        const clampCenterX = (value) => Math.max(left + this.width / 2, Math.min(right + this.width / 2, value));
        const clampCenterY = (value) => Math.max(top + this.height / 2, Math.min(bottom + this.height / 2, value));
        const enforceStandOff = (targetCenterX, targetCenterY, minDistance) => {
            let cx = clampCenterX(targetCenterX);
            let cy = clampCenterY(targetCenterY);
            if (playerCenterX == null || playerCenterY == null || minDistance <= 0) {
                return { x: cx, y: cy };
            }
            let dx = cx - playerCenterX;
            let dy = cy - playerCenterY;
            let dist = Math.hypot(dx, dy);
            if (dist < minDistance) {
                if (dist < 0.001) {
                    dx = this.facingRight ? 1 : -1;
                    dy = -0.4;
                    dist = Math.hypot(dx, dy);
                }
                const push = minDistance - dist;
                cx += (dx / dist) * push;
                cy += (dy / dist) * push;
                cx = clampCenterX(cx);
                cy = clampCenterY(cy);
            }
            return { x: cx, y: cy };
        };

        if (this.mosquitoTelegraphTimer > 0) {
            this.mosquitoTelegraphTimer -= dt;
            this.vx = 0;
            this.vy = 0;
            if (player) this.facingRight = (player.x + player.width / 2) > (this.x + this.width / 2);
            if (this.mosquitoTelegraphTimer <= 0) {
                if (this.mosquitoTelegraphType === 'needle_fan') {
                    this.mosquitoNeedleShots = this.phase >= 3 ? 4 : (this.phase >= 2 ? 3 : 2);
                    this.mosquitoNeedleTimer = 0;
                } else if (this.mosquitoTelegraphType === 'swarm') {
                    this.mosquitoState = 'DASH';
                    this.mosquitoSwarmBursts = this.phase >= 3 ? 5 : (this.phase >= 2 ? 4 : 3);
                    this.mosquitoSwarmTimer = 0;
                    this.mosquitoDashTimer = 0;
                } else {
                    this.mosquitoState = 'DRAIN';
                    this.mosquitoDrainTimer = 0.56 + this.phase * 0.08;
                    this.mosquitoDrainTrailTimer = 0;
                    const selfCenterX = this.x + this.width / 2;
                    const selfCenterY = this.y + this.height / 2;
                    const baseTargetX = playerCenterX != null ? playerCenterX : (selfCenterX + (this.facingRight ? 140 : -140));
                    const baseTargetY = playerCenterY != null ? (playerCenterY - 20) : (selfCenterY + 20);
                    const sideSign = selfCenterX <= baseTargetX ? -1 : 1;
                    const leadX = sideSign * (118 + this.phase * 14);
                    const leadY = -26 + Math.sin(this.timeAlive * 4.8) * 22;
                    const drainTarget = enforceStandOff(
                        baseTargetX + leadX,
                        baseTargetY + leadY,
                        personalSpaceRadius + 10 + this.phase * 6
                    );
                    const dx = drainTarget.x - selfCenterX;
                    const dy = drainTarget.y - selfCenterY;
                    const dist = Math.hypot(dx, dy) || 1;
                    const speed = Math.min(620 + this.phase * 26, 430 + this.phase * 28 + dist * 0.36);
                    this.mosquitoDashVx = (dx / dist) * speed;
                    this.mosquitoDashVy = (dy / dist) * speed;
                }
            }
            return;
        }

        if (this.mosquitoNeedleShots > 0) {
            this.vx = 0;
            this.vy = 0;
            this.y = Math.max(top, Math.min(bottom, centerY + Math.sin(this.timeAlive * 9) * 24));
            this.mosquitoNeedleTimer -= dt;
            if (this.mosquitoNeedleTimer <= 0 && player) {
                const spreads = this.phase >= 3 ? [-0.2, 0, 0.2] : (this.phase >= 2 ? [-0.14, 0.14] : [-0.1, 0.1]);
                for (let i = 0; i < spreads.length; i++) {
                    this._spawnProjectile(game, player, 'needle', 600 + this.phase * 35, spreads[i], 0);
                }
                this.mosquitoNeedleShots--;
                this.mosquitoNeedleTimer = 0.16;
                if (this.mosquitoNeedleShots <= 0) {
                    this.attackCooldown = 1.45 + Math.random() * 0.7;
                }
            }
            return;
        }

        if (this.mosquitoState === 'DASH') {
            if (this.mosquitoDashTimer > 0) {
                this.mosquitoDashTimer -= dt;
                this.x += this.mosquitoDashVx * dt;
                this.y += this.mosquitoDashVy * dt;
                this.vx = this.mosquitoDashVx;
                this.vy = this.mosquitoDashVy;
                this.facingRight = this.vx >= 0;
                if (this.x <= left || this.x >= right || this.y <= top || this.y >= bottom) {
                    this.x = Math.max(left, Math.min(right, this.x));
                    this.y = Math.max(top, Math.min(bottom, this.y));
                    this.mosquitoDashTimer = 0;
                }
            } else {
                this.mosquitoSwarmTimer -= dt;
                if (this.mosquitoSwarmTimer <= 0 && this.mosquitoSwarmBursts > 0) {
                    const selfCenterX = this.x + this.width / 2;
                    const selfCenterY = this.y + this.height / 2;
                    const flankDir = Math.random() < 0.5 ? -1 : 1;
                    const px = playerCenterX != null
                        ? (playerCenterX + flankDir * (120 + this.phase * 10 + Math.random() * 36))
                        : (selfCenterX + this.mosquitoPatrolDir * 120);
                    const py = playerCenterY != null
                        ? (playerCenterY - 24 + (Math.random() * 100 - 50))
                        : (centerY + (Math.random() * 60 - 30));
                    const target = enforceStandOff(px, py, playerCenterX != null ? (personalSpaceRadius + this.phase * 4) : 0);
                    const dx = target.x - selfCenterX;
                    const dy = target.y - selfCenterY;
                    const dist = Math.hypot(dx, dy) || 1;
                    const speed = Math.min(650 + this.phase * 24, 420 + this.phase * 30 + dist * 0.42);
                    this.mosquitoDashVx = (dx / dist) * speed;
                    this.mosquitoDashVy = (dy / dist) * speed;
                    this.mosquitoDashTimer = Math.max(0.18, Math.min(0.3, dist / Math.max(1, speed)));
                    this.mosquitoSwarmBursts--;
                    this.mosquitoSwarmTimer = 0.14;
                }
            }
            if (this.mosquitoSwarmBursts <= 0 && this.mosquitoDashTimer <= 0) {
                this.mosquitoState = 'HOVER';
                this.attackCooldown = 1.3 + Math.random() * 0.7;
            }
            return;
        }

        if (this.mosquitoState === 'DRAIN') {
            this.mosquitoDrainTimer -= dt;
            this.x += this.mosquitoDashVx * dt;
            this.y += this.mosquitoDashVy * dt;
            this.vx = this.mosquitoDashVx;
            this.vy = this.mosquitoDashVy;
            this.facingRight = this.vx >= 0;

            if (this.x <= left || this.x >= right) {
                this.x = Math.max(left, Math.min(right, this.x));
                this.mosquitoDashVx *= -1;
            }
            if (this.y <= top || this.y >= bottom) {
                this.y = Math.max(top, Math.min(bottom, this.y));
                this.mosquitoDashVy *= -1;
            }

            this.mosquitoDrainTrailTimer -= dt;
            if (this.mosquitoDrainTrailTimer <= 0) {
                this.mosquitoDrainTrailTimer = 0.08;
                const driftX = (Math.random() * 120 - 60);
                const vx = driftX;
                const vy = 260 + this.phase * 18;
                game.enemyProjectiles.push(new BossProjectile(this.x + this.width / 2, this.y + this.height * 0.5, vx, vy, 'venom'));
            }

            if (this.mosquitoDrainTimer <= 0) {
                this.mosquitoState = 'HOVER';
                this.attackCooldown = 1.45 + Math.random() * 0.7;
            }
            return;
        }

        // HOVER patrol.
        const patrolSpeed = 198 + this.phase * 14;
        this.vx = this.mosquitoPatrolDir * patrolSpeed;
        this.x += this.vx * dt;
        if (this.x <= left) {
            this.x = left;
            this.mosquitoPatrolDir = 1;
        } else if (this.x >= right) {
            this.x = right;
            this.mosquitoPatrolDir = -1;
        }
        this.y = centerY + Math.sin(this.timeAlive * 6.6) * (46 + this.phase * 3) + Math.cos(this.timeAlive * 2.8) * 15;
        this.y = Math.max(top, Math.min(bottom, this.y));

        if (playerCenterX != null && playerCenterY != null) {
            const selfCenterX = this.x + this.width / 2;
            const selfCenterY = this.y + this.height / 2;
            const closeDist = Math.hypot(selfCenterX - playerCenterX, (selfCenterY - playerCenterY) * 0.78);
            if (closeDist < personalSpaceRadius) {
                const awayDir = selfCenterX >= playerCenterX ? 1 : -1;
                this.mosquitoPatrolDir = awayDir;
                const urgency = (personalSpaceRadius - closeDist) / personalSpaceRadius;
                this.x += awayDir * (120 + urgency * 130) * dt;
                this.x = Math.max(left, Math.min(right, this.x));
                this.y -= (22 + urgency * 28) * dt;
                this.y = Math.max(top, Math.min(bottom, this.y));
            }
        }

        if (player) {
            const dx = (playerCenterX) - (this.x + this.width / 2);
            const dist = Math.abs(dx);
            this.facingRight = dx >= 0;
            if (this.attackCooldown <= 0) {
                const roll = Math.random();
                const tooCloseForDive = dist < (personalSpaceRadius + 18);
                if (dist > personalSpaceRadius && dist < 460 && roll < (this.phase >= 3 ? 0.38 : 0.3)) {
                    this.mosquitoTelegraphType = 'drain';
                } else if (!tooCloseForDive && roll < 0.68) {
                    this.mosquitoTelegraphType = 'swarm';
                } else {
                    this.mosquitoTelegraphType = 'needle_fan';
                }
                this.mosquitoTelegraphTimer = this.mosquitoTelegraphType === 'drain'
                    ? (this.phase >= 3 ? 0.2 : (this.phase >= 2 ? 0.28 : 0.34))
                    : (this.mosquitoTelegraphType === 'swarm'
                        ? (this.phase >= 3 ? 0.22 : (this.phase >= 2 ? 0.3 : 0.38))
                        : (this.phase >= 3 ? 0.2 : (this.phase >= 2 ? 0.26 : 0.33)));
                this.vx = 0;
                this.vy = 0;
            }
        } else {
            this.facingRight = this.mosquitoPatrolDir > 0;
        }
    }

    _spawnBeetleEmergeBurst(game) {
        if (!game) return;
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height * 0.74;
        const count = this.phase >= 3 ? 7 : (this.phase >= 2 ? 6 : 5);
        for (let i = 0; i < count; i++) {
            const lane = i - (count - 1) / 2;
            const dir = lane === 0 ? (Math.random() > 0.5 ? 1 : -1) : Math.sign(lane);
            const vx = dir * (230 + this.phase * 20 + Math.abs(lane) * 30 + Math.random() * 22);
            const vy = -220 - Math.abs(lane) * 16 - Math.random() * 36;
            game.enemyProjectiles.push(new BossProjectile(cx, cy, vx, vy, 'scarab'));
        }
    }

    _updateBeetleBoss(dt, game, player) {
        const left = this.platform.x + 8;
        const right = this.platform.x + this.platform.width - this.width - 8;
        const groundY = this.platform.y - this.height;

        if (this.beetleTelegraphTimer > 0) {
            this.beetleTelegraphTimer -= dt;
            this.vx = 0;
            this.y = groundY;
            if (player) this.facingRight = (player.x + player.width / 2) > (this.x + this.width / 2);
            if (this.beetleTelegraphTimer <= 0) {
                if (this.beetleTelegraphType === 'roll') {
                    this.beetleState = 'ROLL';
                    this.beetleRollDir = this.facingRight ? 1 : -1;
                    this.beetleRollTimer = 0.48 + this.phase * 0.11;
                    this.beetleRollFxTimer = 0;
                } else if (this.beetleTelegraphType === 'scarab_spray') {
                    this.beetleSprayShots = this.phase >= 3 ? 5 : (this.phase >= 2 ? 4 : 3);
                    this.beetleSprayTimer = 0;
                } else {
                    this.beetleState = 'BURROW';
                    this.beetleBurrowTimer = 0.58 + this.phase * 0.08;
                    const target = player ? (player.x + player.width / 2 - this.width / 2 + (Math.random() * 90 - 45)) : (this.x + this.beetlePatrolDir * 180);
                    this.beetleBurrowTargetX = Math.max(left, Math.min(right, target));
                }
            }
            return;
        }

        if (this.beetleSprayShots > 0) {
            this.vx = 0;
            this.y = groundY;
            this.beetleSprayTimer -= dt;
            if (this.beetleSprayTimer <= 0 && player) {
                const total = this.phase >= 3 ? 5 : (this.phase >= 2 ? 4 : 3);
                const shotIndex = total - this.beetleSprayShots;
                const spreads = total === 5 ? [-0.24, -0.1, 0, 0.1, 0.24] : (total === 4 ? [-0.18, -0.06, 0.06, 0.18] : [-0.12, 0, 0.12]);
                const spread = spreads[Math.max(0, Math.min(shotIndex, spreads.length - 1))];
                this._spawnProjectile(game, player, 'scarab', 470 + this.phase * 34, spread, -66);
                this.beetleSprayShots--;
                this.beetleSprayTimer = 0.13;
                if (this.beetleSprayShots <= 0) {
                    this.attackCooldown = 1.52 + Math.random() * 0.72;
                }
            }
            return;
        }

        if (this.beetleState === 'ROLL') {
            this.beetleRollTimer -= dt;
            this.vx = this.beetleRollDir * (350 + this.phase * 38);
            this.x += this.vx * dt;
            this.y = groundY;
            this.facingRight = this.vx >= 0;
            if (this.x <= left || this.x >= right) {
                this.x = Math.max(left, Math.min(right, this.x));
                this.beetleRollDir *= -1;
                this.beetleRollTimer *= 0.6;
            }
            this.beetleRollFxTimer -= dt;
            if (this.beetleRollFxTimer <= 0 && game && game.particles) {
                this.beetleRollFxTimer = this._isBossVfxLite(game) ? 0.14 : 0.08;
                this._emitBossFx(game, this.x + this.width * 0.5, this.y + this.height * 0.9, 8, '#d6c2a3', [40, 120], [0.1, 0.26], [1.2, 2.5]);
            }
            if (this.beetleRollTimer <= 0) {
                this.beetleState = 'PATROL';
                this.attackCooldown = 1.3 + Math.random() * 0.68;
            }
            return;
        }

        if (this.beetleState === 'BURROW') {
            this.beetleBurrowTimer -= dt;
            const toTarget = this.beetleBurrowTargetX - this.x;
            const move = Math.sign(toTarget) * Math.min(Math.abs(toTarget), (290 + this.phase * 24) * dt);
            this.x += move;
            this.y = groundY + 16 + Math.sin((this.beetleBurrowTimer * 20) + this.x * 0.02) * 4;
            this.vx = 0;
            if (this.beetleBurrowTimer <= 0) {
                this.y = groundY;
                this.beetleState = 'PATROL';
                this._spawnBeetleEmergeBurst(game);
                if (game && game.particles) {
                    this._emitBossFx(game, this.x + this.width / 2, this.y + this.height * 0.9, 12, '#e2c594', [50, 150], [0.12, 0.32], [1.2, 2.9]);
                }
                this.attackCooldown = 1.42 + Math.random() * 0.74;
            }
            return;
        }

        // PATROL
        const patrolSpeed = 126 + this.phase * 12;
        this.vx = this.beetlePatrolDir * patrolSpeed;
        this.x += this.vx * dt;
        this.y = groundY;
        if (this.x <= left) {
            this.x = left;
            this.beetlePatrolDir = 1;
        } else if (this.x >= right) {
            this.x = right;
            this.beetlePatrolDir = -1;
        }

        if (player) {
            const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
            const dist = Math.abs(dx);
            this.facingRight = dx >= 0;
            if (this.attackCooldown <= 0) {
                const rollChance = dist > 130 && dist < 470 && Math.random() < (this.phase >= 3 ? 0.45 : 0.35);
                if (rollChance) {
                    this.beetleTelegraphType = 'roll';
                } else if (Math.random() < 0.58) {
                    this.beetleTelegraphType = 'burrow';
                } else {
                    this.beetleTelegraphType = 'scarab_spray';
                }
                this.beetleTelegraphTimer = this.beetleTelegraphType === 'roll'
                    ? (this.phase >= 3 ? 0.15 : (this.phase >= 2 ? 0.21 : 0.28))
                    : (this.beetleTelegraphType === 'burrow'
                        ? (this.phase >= 3 ? 0.18 : (this.phase >= 2 ? 0.24 : 0.31))
                        : (this.phase >= 3 ? 0.2 : (this.phase >= 2 ? 0.26 : 0.34)));
                this.vx = 0;
            }
        } else {
            this.facingRight = this.beetlePatrolDir > 0;
        }
    }

    _spawnJugglerBall(game, x, y, vx, vy, emoji = null) {
        if (!game) return;
        const shot = new BossProjectile(x, y, vx, vy, 'juggle_ball');
        if (emoji) {
            shot.emoji = emoji;
            shot._cachedEmoji = getEmojiCanvas(emoji, 44);
        }
        game.enemyProjectiles.push(shot);
    }

    _spawnJugglerRainWave(game) {
        if (!game) return;
        const lanes = this.phase >= 3 ? 5 : (this.phase >= 2 ? 4 : 4);
        const palette = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣'];
        for (let i = 0; i < lanes; i++) {
            const t = lanes <= 1 ? 0.5 : i / (lanes - 1);
            const laneOffset = (t - 0.5) * (148 + this.phase * 20);
            const x = this.jugglerRainCenterX + laneOffset + (Math.random() * 28 - 14);
            const y = this.y - 260 - Math.random() * 90;
            const vx = (Math.random() * 52 - 26) + Math.sin(this.timeAlive * 3 + i) * 14;
            const vy = 360 + this.phase * 38 + Math.random() * 44;
            const emoji = palette[(i + this.phase) % palette.length];
            this._spawnJugglerBall(game, x, y, vx, vy, emoji);
        }
    }

    _updateJugglerBoss(dt, game, player) {
        const left = this.platform.x + 8;
        const right = this.platform.x + this.platform.width - this.width - 8;
        const groundY = this.platform.y - this.height;
        this.y = groundY;

        if (this.jugglerTelegraphTimer > 0) {
            this.jugglerTelegraphTimer -= dt;
            this.vx = 0;
            if (player) this.facingRight = (player.x + player.width / 2) > (this.x + this.width / 2);
            if (this.jugglerTelegraphTimer <= 0) {
                if (this.jugglerTelegraphType === 'cascade') {
                    this.jugglerState = 'CASCADE';
                    this.jugglerCascadeShots = this.phase >= 3 ? 8 : (this.phase >= 2 ? 7 : 6);
                    this.jugglerCascadeTimer = 0;
                } else if (this.jugglerTelegraphType === 'rain') {
                    this.jugglerState = 'RAIN';
                    this.jugglerRainWaves = this.phase >= 3 ? 3 : 2;
                    this.jugglerRainTimer = 0;
                    this.jugglerRainCenterX = player ? (player.x + player.width / 2) : (this.x + this.width / 2);
                } else {
                    this.jugglerState = 'ROLL';
                    this.jugglerRollDir = this.facingRight ? 1 : -1;
                    this.jugglerRollTimer = this.phase >= 3 ? 1.05 : (this.phase >= 2 ? 0.92 : 0.8);
                    this.jugglerRollFxTimer = 0;
                }
            }
            return;
        }

        if (this.jugglerState === 'CASCADE') {
            this.vx = 0;
            this.jugglerCascadeTimer -= dt;
            if (this.jugglerCascadeTimer <= 0 && this.jugglerCascadeShots > 0) {
                const total = this.phase >= 3 ? 8 : (this.phase >= 2 ? 7 : 6);
                const idx = total - this.jugglerCascadeShots;
                const dir = idx % 2 === 0 ? 1 : -1;
                const sideX = this.x + this.width / 2 + dir * (this.width * 0.22);
                const sideY = this.y + this.height * 0.34;
                const speed = 330 + this.phase * 22 + Math.random() * 26;
                const angle = (dir > 0 ? -0.56 : -2.58) + Math.sin(idx * 1.4) * 0.08;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed - 32;
                const palette = ['🔴', '🟡', '🔵', '🟣', '🟢', '🟠'];
                const emoji = palette[idx % palette.length];
                this._spawnJugglerBall(game, sideX, sideY, vx, vy, emoji);
                this.jugglerCascadeShots--;
                this.jugglerCascadeTimer = Math.max(0.09, 0.15 - this.phase * 0.015);
                if (this.jugglerCascadeShots <= 0) {
                    this.jugglerState = 'PATROL';
                    this.attackCooldown = 1.5 + Math.random() * 0.7;
                }
            }
            return;
        }

        if (this.jugglerState === 'RAIN') {
            this.vx = 0;
            this.jugglerRainTimer -= dt;
            if (this.jugglerRainTimer <= 0) {
                this._spawnJugglerRainWave(game);
                this.jugglerRainWaves--;
                this.jugglerRainTimer = this.phase >= 3 ? 0.28 : 0.34;
                if (this.jugglerRainWaves <= 0) {
                    this.jugglerState = 'PATROL';
                    this.attackCooldown = 1.8 + Math.random() * 0.7;
                }
            }
            return;
        }

        if (this.jugglerState === 'ROLL') {
            this.jugglerRollTimer -= dt;
            const speed = 410 + this.phase * 32;
            this.vx = this.jugglerRollDir * speed;
            this.x += this.vx * dt;
            this.y = groundY + Math.sin(this.timeAlive * 24) * 4;
            if (this.x <= left || this.x >= right) {
                this.x = Math.max(left, Math.min(right, this.x));
                this.jugglerRollDir *= -1;
                this.facingRight = this.jugglerRollDir > 0;
            }

            this.jugglerRollFxTimer -= dt;
            if (this.jugglerRollFxTimer <= 0) {
                const back = this.jugglerRollDir > 0 ? -1 : 1;
                const spawnX = this.x + this.width / 2 + back * (this.width * 0.2);
                const spawnY = this.y + this.height * 0.45;
                const vx = back * (120 + Math.random() * 60);
                const vy = -280 - Math.random() * 110;
                this._spawnJugglerBall(game, spawnX, spawnY, vx, vy, '🟡');
                this.jugglerRollFxTimer = this.phase >= 3 ? 0.18 : 0.24;
            }

            if (this.jugglerRollTimer <= 0) {
                this.jugglerState = 'PATROL';
                this.y = groundY;
                this.attackCooldown = 1.55 + Math.random() * 0.75;
            }
            return;
        }

        // PATROL: goofy bouncy side-step to set up readable attack windows.
        const patrolSpeed = 135 + this.phase * 14;
        this.vx = this.jugglerPatrolDir * patrolSpeed;
        this.x += this.vx * dt;
        if (this.x <= left) {
            this.x = left;
            this.jugglerPatrolDir = 1;
        } else if (this.x >= right) {
            this.x = right;
            this.jugglerPatrolDir = -1;
        }
        this.jugglerHopCycle += dt * (6.5 + this.phase * 0.4);
        this.y = groundY - Math.max(0, Math.sin(this.jugglerHopCycle)) * (9 + this.phase * 2);

        if (player) {
            const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
            const dist = Math.abs(dx);
            this.facingRight = dx >= 0;
            if (this.attackCooldown <= 0) {
                const roll = Math.random();
                if (dist > 150 && dist < 520 && roll < (this.phase >= 3 ? 0.42 : 0.32)) {
                    this.jugglerTelegraphType = 'roll';
                    this.jugglerTelegraphTimer = (this.phase >= 3 ? 0.2 : (this.phase >= 2 ? 0.26 : 0.34)) + 0.5;
                } else if (roll < 0.7) {
                    this.jugglerTelegraphType = 'cascade';
                    this.jugglerTelegraphTimer = (this.phase >= 3 ? 0.18 : (this.phase >= 2 ? 0.24 : 0.32)) + 0.5;
                } else {
                    this.jugglerTelegraphType = 'rain';
                    this.jugglerTelegraphTimer = (this.phase >= 3 ? 0.22 : (this.phase >= 2 ? 0.3 : 0.38)) + 0.5;
                    this.jugglerRainCenterX = player.x + player.width / 2;
                }
                this.vx = 0;
            }
        } else {
            this.facingRight = this.jugglerPatrolDir > 0;
        }
    }

    _updateHoneybeeBoss(dt, game, player) {
        const left = this.platform.x + 12;
        const right = this.platform.x + this.platform.width - this.width - 12;
        const baseHoverY = this.platform.y - this.height - (156 + Math.sin(this.timeAlive * 0.7) * 22);
        this.honeybeeHoverCenterY += (baseHoverY - this.honeybeeHoverCenterY) * Math.min(1, dt * 2.4);
        const hoverBob = Math.sin(this.timeAlive * (2.6 + this.phase * 0.18)) * (18 + this.phase * 2);

        if (this.honeybeeSwarmHitTimer > 0) this.honeybeeSwarmHitTimer -= dt;

        if (this.honeybeeGatherTimer > 0) {
            this.honeybeeGatherTimer -= dt;
            this.honeybeeTelegraphTimer = Math.max(0, this.honeybeeTelegraphTimer - dt);
            this.vx = 0;
            this.y = this.honeybeeHoverCenterY + hoverBob * 0.35;
            if (player) this.facingRight = (player.x + player.width / 2) > (this.x + this.width / 2);
            if (this.honeybeeGatherTimer <= 0) {
                this.honeybeeDeployDuration = this.phase >= 3 ? 0.32 : (this.phase >= 2 ? 0.36 : 0.42);
                this.honeybeeDeployTimer = this.honeybeeDeployDuration;
            }
            return;
        }

        if (this.honeybeeDeployTimer > 0) {
            this.honeybeeDeployTimer -= dt;
            this.honeybeeTelegraphTimer = Math.max(0, this.honeybeeTelegraphTimer - dt);
            this.vx = 0;
            this.y = this.honeybeeHoverCenterY + hoverBob * 0.42;
            if (player) this.facingRight = (player.x + player.width / 2) > (this.x + this.width / 2);
            if (this.honeybeeDeployTimer <= 0) {
                this.honeybeeSwarmType = this.honeybeeTelegraphType;
                this.honeybeeSwarmDuration = this.phase >= 3 ? 1.16 : (this.phase >= 2 ? 1.04 : 0.92);
                if (this.honeybeeSwarmType === 'mid') {
                    this.honeybeeSwarmDuration *= 0.78;
                }
                this.honeybeeSwarmActiveTimer = this.honeybeeSwarmDuration;
                this.honeybeeSwarmHitTimer = 0;
                this.honeybeeTelegraphTimer = 0;
            }
            return;
        }

        if (this.honeybeeSwarmActiveTimer > 0) {
            this.honeybeeSwarmActiveTimer -= dt;
            this.vx = 0;
            this.y = this.honeybeeHoverCenterY + hoverBob * 0.5;
            if (player) this.facingRight = (player.x + player.width / 2) > (this.x + this.width / 2);
            const swarmElapsed = this.honeybeeSwarmDuration - this.honeybeeSwarmActiveTimer;
            const damageActive = swarmElapsed >= 0.14;
            if (damageActive && player && player.invulnerableTimer <= 0 && this.honeybeeSwarmHitTimer <= 0 && this._isPlayerInHoneybeeSwarm(player, this.honeybeeSwarmType)) {
                player.takeDamage(game);
                this.honeybeeSwarmHitTimer = 0.28;
            }
            if (this.honeybeeSwarmActiveTimer <= 0) {
                this.attackCooldown = 1.3 + Math.random() * 0.7;
            }
            return;
        }

        const patrolSpeed = 150 + this.phase * 15;
        this.vx = this.honeybeePatrolDir * patrolSpeed;
        this.x += this.vx * dt;
        this.y = this.honeybeeHoverCenterY + hoverBob;
        if (this.x <= left) {
            this.x = left;
            this.honeybeePatrolDir = 1;
        } else if (this.x >= right) {
            this.x = right;
            this.honeybeePatrolDir = -1;
        }

        if (player) {
            this.facingRight = (player.x + player.width / 2) > (this.x + this.width / 2);
            if (this.attackCooldown <= 0) {
                const honeybeeSwarmTypes = ['high', 'mid', 'low'];
                this.honeybeeTelegraphType = honeybeeSwarmTypes[Math.floor(Math.random() * honeybeeSwarmTypes.length)];
                this.honeybeeGatherDuration = this.phase >= 3 ? 0.44 : (this.phase >= 2 ? 0.5 : 0.58);
                this.honeybeeGatherTimer = this.honeybeeGatherDuration;
                this.honeybeeDeployDuration = this.phase >= 3 ? 0.32 : (this.phase >= 2 ? 0.36 : 0.42);
                this.honeybeeDeployTimer = 0;
                this.honeybeeTelegraphTimer = this.honeybeeGatherDuration + this.honeybeeDeployDuration;
                this.vx = 0;
            }
        } else {
            this.facingRight = this.honeybeePatrolDir > 0;
        }
    }

    update(dt, game) {
        this._lastGameRef = game || null;
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
        } else if (this.bossType === 'boss_chick') {
            this._updateChickBoss(dt, game, player);
        } else if (this.bossType === 'boss_moai') {
            this._updateMoaiBoss(dt, game, player);
        } else if (this.bossType === 'boss_dragon') {
            this._updateDragonBoss(dt, game, player);
        } else if (this.bossType === 'boss_manliftingweights') {
            this._updateRobotBoss(dt, game, player);
        } else if (this.bossType === 'boss_lobster') {
            this._updateLobsterBoss(dt, game, player);
        } else if (this.bossType === 'boss_kangaroo') {
            this._updateKangarooBoss(dt, game, player);
        } else if (this.bossType === 'boss_monkey') {
            this._updateMonkeyBoss(dt, game, player);
        } else if (this.bossType === 'boss_mammoth') {
            this._updateMammothBoss(dt, game, player);
        } else if (this.bossType === 'boss_trex') {
            this._updateTrexBoss(dt, game, player);
        } else if (this.bossType === 'boss_mosquito') {
            this._updateMosquitoBoss(dt, game, player);
        } else if (this.bossType === 'boss_beetle') {
            this._updateBeetleBoss(dt, game, player);
        } else if (this.bossType === 'boss_juggler') {
            this._updateJugglerBoss(dt, game, player);
        } else if (this.bossType === 'boss_honeybee') {
            this._updateHoneybeeBoss(dt, game, player);
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
            || this.spiderVenomTelegraphTimer > 0
            || this.spiderPounceTelegraph > 0
            || this.moaiTelegraphTimer > 0
            || this.moaiState === 'GAZE'
            || this.moaiState === 'METEOR'
            || this.moaiState === 'QUAKE'
            || this.dragonFireTelegraphTimer > 0
            || this.dragonVolleyShots > 0
            || this.robotWrenchTelegraphTimer > 0
            || this.robotState === 'RUSH'
            || this.robotState === 'GRAB'
            || this.lobsterTelegraphTimer > 0
            || this.lobsterDashTimer > 0
            || this.lobsterShrimpShots > 0
            || this.kangarooTelegraphTimer > 0
            || this.kangarooBoomerangShots > 0
            || this.kangarooState === 'LEAP'
            || this.monkeyTelegraphTimer > 0
            || this.monkeyCoconutShots > 0
            || this.monkeyState === 'CANOPY_ASCEND'
            || this.monkeyState === 'ASCEND'
            || this.monkeyState === 'CANOPY'
            || this.monkeyState === 'DIVE'
            || this.mammothTelegraphTimer > 0
            || this.mammothFrostShots > 0
            || this.mammothRainWaves > 0
            || this.mammothState === 'CHARGE'
            || this.trexTelegraphTimer > 0
            || this.trexRoarWaves > 0
            || this.trexFossilShots > 0
            || this.trexState === 'LUNGE'
            || this.mosquitoTelegraphTimer > 0
            || this.mosquitoNeedleShots > 0
            || this.mosquitoSwarmBursts > 0
            || this.mosquitoDashTimer > 0
            || this.mosquitoState === 'DRAIN'
            || this.beetleTelegraphTimer > 0
            || this.beetleSprayShots > 0
            || this.beetleState === 'ROLL'
            || this.beetleState === 'BURROW'
            || this.jugglerTelegraphTimer > 0
            || this.jugglerCascadeShots > 0
            || this.jugglerRainWaves > 0
            || this.jugglerState === 'ROLL'
            || this.honeybeeTelegraphTimer > 0
            || this.honeybeeSwarmActiveTimer > 0;
        if (game && player && player.invulnerableTimer <= 0 && !inFairWindow) {
            if (Physics.checkAABB(this, player.getHitbox())) {
                player.takeDamage(game);
            }
        }
    }

    draw(ctx) {
        const lowVfx = this._isBossVfxLite(this._lastGameRef);
        const damageAlpha = this.damageFlashTimer > 0
            ? (0.5 + Math.sin(this.damageFlashTimer * 40) * 0.5)
            : 1.0;
        const spawnAlpha = Math.min(1, this.spawnFadeTimer / this.spawnFadeDuration);
        const alpha = damageAlpha * spawnAlpha;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Removed boss glow blur to avoid expensive per-frame shadow rendering.
        ctx.shadowBlur = 0;

        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        ctx.translate(cx, cy);
        const useDirectFacing = this.bossType === 'boss_dragon' || this.bossType === 'boss_kangaroo';
        let shouldFlipSprite = useDirectFacing ? this.facingRight : !this.facingRight;
        const emojiFacingInvertedBosses = new Set(['boss_monkey', 'boss_trex', 'boss_mammoth', 'boss_mosquito', 'boss_honeybee']);
        if (emojiFacingInvertedBosses.has(this.bossType)) {
            shouldFlipSprite = !shouldFlipSprite;
        }
        // Mobile-only visual fix: beetle emoji appears mirrored relative to movement.
        if (this.bossType === 'boss_beetle' && this._lastGameRef && this._lastGameRef.isMobileDevice) {
            shouldFlipSprite = !shouldFlipSprite;
        }
        if (shouldFlipSprite) ctx.scale(-1, 1);

        if (this.attackTelegraphTimer > 0) {
            ctx.scale(1.06, 1.06);
            if (this.bossType === 'boss_juggler') {
                // Extra squash/stretch for clearer "wind-up" readability.
                ctx.scale(1.08, 0.92);
            }
        }
        if (this.spiderPounceTelegraph > 0) {
            ctx.scale(1.1, 0.9);
        }
        if (this.spiderVenomTelegraphTimer > 0) {
            ctx.scale(1.04, 1.04);
        }

        const cached = this._cachedEmoji;
        ctx.drawImage(cached.canvas, -cached.width / 2, -cached.height / 2);
        if (this.bossType === 'boss_dragon') {
            if (!this._fireTellCache) this._fireTellCache = getEmojiCanvas(String.fromCodePoint(0x1F525), 28);
            const mouthOffset = this._getDragonMouthOffset();
            const mouthX = -mouthOffset.x;
            const mouthY = mouthOffset.y;

            if (this.dragonAttackPattern === 'cone' && (this.dragonFireTelegraphTimer > 0 || this.dragonFireActiveTimer > 0)) {
                const half = this.dragonFireHalfAngle;
                const fireRange = this.dragonFireRange;
                const rows = lowVfx
                    ? (this.dragonFireTelegraphTimer > 0 ? 2 : 3)
                    : (this.dragonFireTelegraphTimer > 0 ? 4 : 6);
                const telePulse = 0.45 + Math.sin(this.timeAlive * 20) * 0.3;
                for (let r = 1; r <= rows; r++) {
                    const t = r / (rows + 0.7);
                    const radius = fireRange * t * (0.84 + Math.sin(this.timeAlive * 5 + r) * 0.08);
                    const rowHalf = half * t;
                    const embers = lowVfx
                        ? Math.max(1, Math.floor(1 + r * 1.1))
                        : Math.max(2, Math.floor(2 + r * 1.8));
                    for (let i = 0; i < embers; i++) {
                        const blend = embers <= 1 ? 0.5 : i / (embers - 1);
                        const a = (-rowHalf + blend * rowHalf * 2) + this.dragonConeAimOffset * (0.7 + 0.3 * t);
                        const fx = mouthX + Math.cos(a) * radius * -1;
                        const fy = mouthY + Math.sin(a) * radius * 0.9;
                        const flicker = 0.75 + Math.sin(this.timeAlive * 11 + r * 0.8 + i) * 0.25;
                        const alphaMul = this.dragonFireTelegraphTimer > 0 ? (0.14 + telePulse * 0.3) : Math.min(1, 0.94 + 0.06 * flicker);
                        ctx.globalAlpha = this.dragonFireActiveTimer > 0 ? 1 : (alpha * alphaMul);
                        ctx.drawImage(this._fireTellCache.canvas, fx - this._fireTellCache.width / 2, fy - this._fireTellCache.height / 2);
                    }
                }
                ctx.globalAlpha = this.dragonFireActiveTimer > 0 ? 1 : alpha;
                ctx.drawImage(this._fireTellCache.canvas, mouthX - this._fireTellCache.width * 0.35, mouthY - this._fireTellCache.height / 2);
            } else if (this.dragonAttackPattern === 'volley' && this.dragonFireTelegraphTimer > 0) {
                const pulse = 0.6 + Math.sin(this.timeAlive * 24) * 0.4;
                const lineLen = this.dragonFireRange * 0.82;
                const lineY = this.dragonVolleyLaneY - (this.y + this.height / 2);
                const startX = mouthX;
                const endX = mouthX - lineLen;
                ctx.strokeStyle = `rgba(255, 170, 30, ${0.55 + pulse * 0.35})`;
                ctx.lineWidth = 8;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(startX, lineY);
                ctx.lineTo(endX, lineY);
                ctx.stroke();
                for (let i = 0; i < 3; i++) {
                    const a = this.timeAlive * 2.5 + (i / 3) * Math.PI * 2;
                    const rx = startX - lineLen * (0.25 + i * 0.22) + Math.cos(a) * 6;
                    const ry = lineY + Math.sin(a * 1.3) * 6;
                    ctx.globalAlpha = alpha * (0.45 + pulse * 0.45);
                    ctx.drawImage(this._fireTellCache.canvas, rx - this._fireTellCache.width / 2, ry - this._fireTellCache.height / 2);
                }
                if (!this._warnCache) this._warnCache = getEmojiCanvas(String.fromCodePoint(0x26A0) + '\uFE0F', 26);
                ctx.globalAlpha = alpha * (0.55 + pulse * 0.4);
                ctx.drawImage(this._warnCache.canvas, endX - this._warnCache.width / 2, lineY - this._warnCache.height / 2);
                ctx.globalAlpha = alpha;
            } else if (this.dragonVolleyShots > 0) {
                const pulse = 0.55 + Math.sin(this.timeAlive * 18) * 0.35;
                ctx.globalAlpha = alpha * (0.35 + pulse * 0.35);
                ctx.drawImage(this._fireTellCache.canvas, mouthX - this._fireTellCache.width * 0.35, mouthY - this._fireTellCache.height / 2);
                ctx.globalAlpha = alpha;
            }
        }

        if (this.bossType === 'boss_chick' && this.attackTelegraphTimer > 0 && this.pendingAttack) {
            const pulse = 0.55 + Math.sin(this.timeAlive * 24) * 0.45;
            const pattern = this.pendingAttack.pattern;
            if (pattern === 'fan' || pattern === 'burst') {
                if (!this._chickSnackTellCache) this._chickSnackTellCache = getEmojiCanvas(String.fromCodePoint(0x1F357), 28);
                const count = pattern === 'burst' ? 3 : 2;
                const spread = 24;
                for (let i = 0; i < count; i++) {
                    const offset = (i - (count - 1) / 2) * spread;
                    ctx.globalAlpha = alpha * (0.42 + pulse * 0.45);
                    ctx.drawImage(this._chickSnackTellCache.canvas, offset - this._chickSnackTellCache.width / 2, -this.height / 2 - 52 - Math.abs(offset) * 0.1);
                }
            } else if (pattern === 'spiral') {
                if (!this._chickSpiralTellCache) this._chickSpiralTellCache = getEmojiCanvas(String.fromCodePoint(0x1F300), 28);
                const radius = 22 + pulse * 6;
                for (let i = 0; i < 2; i++) {
                    const a = this.timeAlive * 6 + i * Math.PI;
                    const ox = Math.cos(a) * radius;
                    const oy = -this.height / 2 - 50 + Math.sin(a) * 7;
                    ctx.globalAlpha = alpha * (0.45 + pulse * 0.4);
                    ctx.drawImage(this._chickSpiralTellCache.canvas, ox - this._chickSpiralTellCache.width / 2, oy - this._chickSpiralTellCache.height / 2);
                }
            } else if (pattern === 'rain') {
                if (!this._chickRainTellCache) this._chickRainTellCache = getEmojiCanvas(String.fromCodePoint(0x1F95A), 27);
                for (let i = -1; i <= 1; i++) {
                    ctx.globalAlpha = alpha * (0.45 + pulse * 0.4);
                    ctx.drawImage(this._chickRainTellCache.canvas, i * 24 - this._chickRainTellCache.width / 2, -this.height / 2 - 56 + Math.abs(i) * 5);
                }
            }
            ctx.globalAlpha = alpha;
        }

        const isTelegraphing = this.attackTelegraphTimer > 0
            || this.webTelegraphTimer > 0
            || this.spiderVenomTelegraphTimer > 0
            || this.spiderPounceTelegraph > 0
            || this.dragonFireTelegraphTimer > 0
            || this.lobsterTelegraphTimer > 0
            || this.kangarooTelegraphTimer > 0
            || this.monkeyTelegraphTimer > 0
            || this.mammothTelegraphTimer > 0
            || this.trexTelegraphTimer > 0
            || this.mosquitoTelegraphTimer > 0
            || this.beetleTelegraphTimer > 0
            || this.jugglerTelegraphTimer > 0
            || this.honeybeeTelegraphTimer > 0;
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
        if (this.bossType === 'boss_spider' && this.spiderVenomTelegraphTimer > 0) {
            if (!this._venomTellCache) this._venomTellCache = getEmojiCanvas(String.fromCodePoint(0x1F9EA), 28);
            const pulse = 0.62 + Math.sin(this.timeAlive * 24) * 0.32;
            ctx.globalAlpha = alpha * (0.45 + pulse * 0.45);
            ctx.drawImage(this._venomTellCache.canvas, -this._venomTellCache.width / 2, -this.height / 2 - 86);
            ctx.globalAlpha = alpha;
        }

        if (this.bossType === 'boss_manliftingweights' && this.robotWrenchTelegraphTimer > 0) {
            if (!this._wrenchTellCache) this._wrenchTellCache = getEmojiCanvas(String.fromCodePoint(0x2692) + '\uFE0F', 28);
            const pulse = 0.7 + Math.sin(this.timeAlive * 28) * 0.3;
            ctx.globalAlpha = alpha * Math.max(0.45, pulse);
            ctx.drawImage(this._wrenchTellCache.canvas, -this._wrenchTellCache.width / 2, -this.height / 2 - 54);
            ctx.globalAlpha = alpha;
        }

        if (this.bossType === 'boss_lobster' && this.lobsterTelegraphTimer > 0) {
            if (!this._shrimpTellCache) this._shrimpTellCache = getEmojiCanvas(String.fromCodePoint(0x1F990), 26);
            const pulse = 0.58 + Math.sin(this.timeAlive * 24) * 0.35;
            if (this.lobsterTelegraphType === 'spray') {
                const spread = 28;
                for (let i = -1; i <= 1; i++) {
                    ctx.globalAlpha = alpha * (0.45 + pulse * 0.4);
                    ctx.drawImage(this._shrimpTellCache.canvas, i * spread - this._shrimpTellCache.width / 2, -this.height / 2 - 44 - Math.abs(i) * 7);
                }
            } else {
                if (!this._warnCache) this._warnCache = getEmojiCanvas(String.fromCodePoint(0x26A0) + '\uFE0F', 26);
                ctx.globalAlpha = alpha * (0.48 + pulse * 0.42);
                ctx.drawImage(this._warnCache.canvas, -this._warnCache.width / 2 - 20, -this.height / 2 - 44);
                ctx.drawImage(this._warnCache.canvas, -this._warnCache.width / 2 + 20, -this.height / 2 - 44);
            }
            ctx.globalAlpha = alpha;
        }

        if (this.bossType === 'boss_lobster' && this.lobsterShrimpShots > 0) {
            if (!this._shrimpTellCache) this._shrimpTellCache = getEmojiCanvas(String.fromCodePoint(0x1F990), 26);
            const pulse = 0.5 + Math.sin(this.timeAlive * 20) * 0.35;
            ctx.globalAlpha = alpha * (0.35 + pulse * 0.4);
            ctx.drawImage(this._shrimpTellCache.canvas, -this._shrimpTellCache.width / 2, -this.height * 0.18);
            ctx.globalAlpha = alpha;
        }

        if (this.bossType === 'boss_lobster' && this.lobsterDashTimer > 0) {
            const forward = this.facingRight ? 1 : -1;
            ctx.strokeStyle = `rgba(255, 190, 120, ${0.45 + Math.sin(this.timeAlive * 28) * 0.2})`;
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-forward * 18, 6);
            ctx.lineTo(-forward * 52, 6);
            ctx.moveTo(-forward * 12, -10);
            ctx.lineTo(-forward * 44, -10);
            ctx.stroke();
        }

        if (this.bossType === 'boss_moai' && this.moaiTelegraphTimer > 0) {
            const pulse = 0.58 + Math.sin(this.timeAlive * 24) * 0.34;
            if (this.moaiTelegraphType === 'gaze_beam') {
                if (!this._eyeTellCache) this._eyeTellCache = getEmojiCanvas(String.fromCodePoint(0x1F441) + '\uFE0F', 27);
                const dir = this.facingRight ? 1 : -1;
                ctx.globalAlpha = alpha * (0.42 + pulse * 0.45);
                ctx.drawImage(this._eyeTellCache.canvas, dir * 18 - this._eyeTellCache.width / 2, -this.height * 0.16 - this._eyeTellCache.height / 2);
                ctx.strokeStyle = `rgba(255, 150, 90, ${0.38 + pulse * 0.4})`;
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(dir * 12, -this.height * 0.14);
                ctx.lineTo(dir * 82, -this.height * 0.1);
                ctx.stroke();
            } else if (this.moaiTelegraphType === 'meteor_rain') {
                if (!this._warnCache) this._warnCache = getEmojiCanvas(String.fromCodePoint(0x26A0) + '\uFE0F', 26);
                const markerX = this.moaiMeteorCenterX - (this.x + this.width / 2);
                ctx.globalAlpha = alpha * (0.4 + pulse * 0.42);
                ctx.drawImage(this._warnCache.canvas, markerX - this._warnCache.width / 2, -this.height / 2 - 52);
                ctx.drawImage(this._warnCache.canvas, markerX - this._warnCache.width / 2, -this.height / 2 - 24);
            } else {
                if (!this._stoneTellCache) this._stoneTellCache = getEmojiCanvas(String.fromCodePoint(0x1F94C), 24);
                for (let i = -1; i <= 1; i++) {
                    ctx.globalAlpha = alpha * (0.4 + pulse * 0.4);
                    ctx.drawImage(this._stoneTellCache.canvas, i * 28 - this._stoneTellCache.width / 2, this.height * 0.22 - Math.abs(i) * 4);
                }
            }
            ctx.globalAlpha = alpha;
        }

        if (this.bossType === 'boss_moai' && this.moaiState === 'GAZE') {
            const dir = this.facingRight ? 1 : -1;
            const beamPulse = 0.54 + Math.sin(this.timeAlive * 40) * 0.36;
            ctx.strokeStyle = `rgba(255, 190, 130, ${0.28 + beamPulse * 0.3})`;
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(dir * 14, -this.height * 0.14);
            ctx.lineTo(dir * 86, -this.height * 0.1);
            ctx.stroke();
        }

        if (this.bossType === 'boss_kangaroo' && this.kangarooTelegraphTimer > 0) {
            const pulse = 0.58 + Math.sin(this.timeAlive * 24) * 0.34;
            if (this.kangarooTelegraphType === 'boomerang') {
                if (!this._boomerangTellCache) this._boomerangTellCache = getEmojiCanvas(String.fromCodePoint(0x1FA83), 26);
                for (let i = -1; i <= 1; i++) {
                    ctx.globalAlpha = alpha * (0.38 + pulse * 0.42);
                    ctx.drawImage(this._boomerangTellCache.canvas, i * 26 - this._boomerangTellCache.width / 2, -this.height / 2 - 44 - Math.abs(i) * 5);
                }
            } else {
                if (!this._warnCache) this._warnCache = getEmojiCanvas(String.fromCodePoint(0x26A0) + '\uFE0F', 26);
                const markerX = (this.kangarooLeapTargetX + this.width / 2) - (this.x + this.width / 2);
                ctx.globalAlpha = alpha * (0.44 + pulse * 0.4);
                ctx.drawImage(this._warnCache.canvas, markerX - this._warnCache.width / 2, this.height * 0.22);
                ctx.drawImage(this._warnCache.canvas, -this._warnCache.width / 2, -this.height / 2 - 48);
            }
            ctx.globalAlpha = alpha;
        }

        if (this.bossType === 'boss_kangaroo' && this.kangarooState === 'LEAP') {
            ctx.strokeStyle = `rgba(255, 210, 120, ${0.4 + Math.sin(this.timeAlive * 30) * 0.18})`;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            const dir = this.facingRight ? 1 : -1;
            ctx.beginPath();
            ctx.moveTo(-dir * 14, 8);
            ctx.lineTo(-dir * 44, 2);
            ctx.moveTo(-dir * 10, -6);
            ctx.lineTo(-dir * 38, -16);
            ctx.stroke();
        }

        if (this.bossType === 'boss_monkey' && this.monkeyTelegraphTimer > 0) {
            const pulse = 0.58 + Math.sin(this.timeAlive * 24) * 0.34;
            if (this.monkeyTelegraphType === 'banana_rain') {
                if (!this._bananaTellCache) this._bananaTellCache = getEmojiCanvas(String.fromCodePoint(0x1F34C), 26);
                for (let i = -1; i <= 1; i++) {
                    ctx.globalAlpha = alpha * (0.4 + pulse * 0.42);
                    ctx.drawImage(this._bananaTellCache.canvas, i * 24 - this._bananaTellCache.width / 2, -this.height / 2 - 45 - Math.abs(i) * 6);
                }
            } else if (this.monkeyTelegraphType === 'coconut_burst') {
                if (!this._coconutTellCache) this._coconutTellCache = getEmojiCanvas(String.fromCodePoint(0x1F965), 26);
                const spread = 24;
                for (let i = -1; i <= 1; i++) {
                    ctx.globalAlpha = alpha * (0.42 + pulse * 0.4);
                    ctx.drawImage(this._coconutTellCache.canvas, i * spread - this._coconutTellCache.width / 2, -this.height / 2 - 44);
                }
            } else {
                if (!this._warnCache) this._warnCache = getEmojiCanvas(String.fromCodePoint(0x26A0) + '\uFE0F', 26);
                const markerX = (this.monkeyDiveTargetX + this.width / 2) - (this.x + this.width / 2);
                ctx.globalAlpha = alpha * (0.44 + pulse * 0.42);
                ctx.drawImage(this._warnCache.canvas, markerX - this._warnCache.width / 2, this.height * 0.22);
                ctx.drawImage(this._warnCache.canvas, -this._warnCache.width / 2, -this.height / 2 - 48);
            }
            ctx.globalAlpha = alpha;
        }

        if (this.bossType === 'boss_monkey' && this.monkeyState === 'CANOPY') {
            ctx.strokeStyle = `rgba(181, 255, 179, ${0.26 + Math.sin(this.timeAlive * 10) * 0.12})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-14, -this.height / 2 - 8);
            ctx.lineTo(-14, -this.height / 2 - 48);
            ctx.moveTo(12, -this.height / 2 - 6);
            ctx.lineTo(12, -this.height / 2 - 44);
            ctx.stroke();
        }

        if (this.bossType === 'boss_monkey' && this.monkeyState === 'DIVE') {
            const dir = this.facingRight ? 1 : -1;
            ctx.strokeStyle = `rgba(255, 230, 150, ${0.4 + Math.sin(this.timeAlive * 28) * 0.16})`;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-dir * 12, 4);
            ctx.lineTo(-dir * 44, -10);
            ctx.moveTo(-dir * 4, 16);
            ctx.lineTo(-dir * 34, 4);
            ctx.stroke();
        }

        if (this.bossType === 'boss_mammoth' && this.mammothTelegraphTimer > 0) {
            const pulse = 0.58 + Math.sin(this.timeAlive * 24) * 0.34;
            if (this.mammothTelegraphType === 'charge') {
                if (!this._warnCache) this._warnCache = getEmojiCanvas(String.fromCodePoint(0x26A0) + '\uFE0F', 26);
                ctx.globalAlpha = alpha * (0.45 + pulse * 0.42);
                ctx.drawImage(this._warnCache.canvas, -this._warnCache.width / 2 - 18, -this.height / 2 - 45);
                ctx.drawImage(this._warnCache.canvas, -this._warnCache.width / 2 + 18, -this.height / 2 - 45);
            } else if (this.mammothTelegraphType === 'frost_fan') {
                if (!this._iceTellCache) this._iceTellCache = getEmojiCanvas(String.fromCodePoint(0x1F9CA), 26);
                for (let i = -1; i <= 1; i++) {
                    ctx.globalAlpha = alpha * (0.4 + pulse * 0.42);
                    ctx.drawImage(this._iceTellCache.canvas, i * 24 - this._iceTellCache.width / 2, -this.height / 2 - 45 - Math.abs(i) * 6);
                }
            } else {
                if (!this._snowTellCache) this._snowTellCache = getEmojiCanvas(String.fromCodePoint(0x2744) + '\uFE0F', 24);
                const markerX = this.mammothRainCenterX - (this.x + this.width / 2);
                const headMarkerX = Math.max(-110, Math.min(110, markerX * 0.42));
                const lanes = this.phase >= 3 ? 4 : (this.phase >= 2 ? 3 : 3);
                const spacing = 62;
                const halfWidth = ((lanes - 1) * spacing) * 0.5 + 22;
                const zoneY = -this.height / 2 - 66;
                const zoneH = 22;

                ctx.fillStyle = `rgba(184, 226, 255, ${0.12 + pulse * 0.12})`;
                ctx.fillRect(headMarkerX - halfWidth, zoneY, halfWidth * 2, zoneH);
                ctx.strokeStyle = `rgba(214, 244, 255, ${0.3 + pulse * 0.22})`;
                ctx.lineWidth = 2;
                ctx.strokeRect(headMarkerX - halfWidth, zoneY, halfWidth * 2, zoneH);

                for (let i = -2; i <= 2; i++) {
                    const tx = headMarkerX + i * (halfWidth * 0.45);
                    ctx.strokeStyle = `rgba(190, 236, 255, ${0.2 + pulse * 0.18})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(tx, zoneY - 12);
                    ctx.lineTo(tx, zoneY);
                    ctx.stroke();
                }

                for (let i = -1; i <= 1; i++) {
                    ctx.globalAlpha = alpha * (0.42 + pulse * 0.4);
                    ctx.drawImage(this._snowTellCache.canvas, headMarkerX + i * 26 - this._snowTellCache.width / 2, zoneY - 18 - Math.abs(i) * 3);
                }
                if (!this._warnCache) this._warnCache = getEmojiCanvas(String.fromCodePoint(0x26A0) + '\uFE0F', 26);
                ctx.globalAlpha = alpha * (0.42 + pulse * 0.35);
                ctx.drawImage(this._warnCache.canvas, headMarkerX - halfWidth - this._warnCache.width * 0.5, zoneY - 6);
                ctx.drawImage(this._warnCache.canvas, headMarkerX + halfWidth - this._warnCache.width * 0.5, zoneY - 6);
            }
            ctx.globalAlpha = alpha;
        }

        if (this.bossType === 'boss_mammoth' && this.mammothState === 'CHARGE') {
            const dir = this.facingRight ? 1 : -1;
            ctx.strokeStyle = `rgba(210, 245, 255, ${0.42 + Math.sin(this.timeAlive * 28) * 0.16})`;
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-dir * 16, -6);
            ctx.lineTo(-dir * 56, -14);
            ctx.moveTo(-dir * 18, 10);
            ctx.lineTo(-dir * 62, 14);
            ctx.stroke();
        }

        if (this.bossType === 'boss_trex' && this.trexTelegraphTimer > 0) {
            const pulse = 0.6 + Math.sin(this.timeAlive * 24) * 0.34;
            if (this.trexTelegraphType === 'roar') {
                if (!this._roarTellCache) this._roarTellCache = getEmojiCanvas(String.fromCodePoint(0x1F50A), 26);
                for (let i = 0; i < 3; i++) {
                    ctx.globalAlpha = alpha * (0.42 + pulse * 0.4);
                    ctx.drawImage(this._roarTellCache.canvas, i * 22 - this._roarTellCache.width / 2 - 22, -this.height / 2 - 46 - i * 4);
                }
            } else if (this.trexTelegraphType === 'fossil') {
                if (!this._fossilTellCache) this._fossilTellCache = getEmojiCanvas(String.fromCodePoint(0x1F9B4), 26);
                for (let i = -1; i <= 1; i++) {
                    ctx.globalAlpha = alpha * (0.42 + pulse * 0.4);
                    ctx.drawImage(this._fossilTellCache.canvas, i * 24 - this._fossilTellCache.width / 2, -this.height / 2 - 44 - Math.abs(i) * 6);
                }
            } else {
                if (!this._warnCache) this._warnCache = getEmojiCanvas(String.fromCodePoint(0x26A0) + '\uFE0F', 26);
                ctx.globalAlpha = alpha * (0.46 + pulse * 0.4);
                ctx.drawImage(this._warnCache.canvas, -this._warnCache.width / 2 - 18, -this.height / 2 - 46);
                ctx.drawImage(this._warnCache.canvas, -this._warnCache.width / 2 + 18, -this.height / 2 - 46);
            }
            ctx.globalAlpha = alpha;
        }

        if (this.bossType === 'boss_trex' && this.trexState === 'LUNGE') {
            const dir = this.facingRight ? 1 : -1;
            ctx.strokeStyle = `rgba(255, 220, 170, ${0.4 + Math.sin(this.timeAlive * 28) * 0.16})`;
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-dir * 18, -4);
            ctx.lineTo(-dir * 64, -16);
            ctx.moveTo(-dir * 10, 10);
            ctx.lineTo(-dir * 52, 14);
            ctx.stroke();
        }

        if (this.bossType === 'boss_mosquito' && this.mosquitoTelegraphTimer > 0) {
            const pulse = 0.6 + Math.sin(this.timeAlive * 24) * 0.32;
            if (this.mosquitoTelegraphType === 'needle_fan') {
                if (!this._needleTellCache) this._needleTellCache = getEmojiCanvas(String.fromCodePoint(0x1FAA1), 25);
                for (let i = -1; i <= 1; i++) {
                    ctx.globalAlpha = alpha * (0.42 + pulse * 0.4);
                    ctx.drawImage(this._needleTellCache.canvas, i * 22 - this._needleTellCache.width / 2, -this.height / 2 - 44 - Math.abs(i) * 6);
                }
            } else if (this.mosquitoTelegraphType === 'swarm') {
                if (!this._windTellCache) this._windTellCache = getEmojiCanvas(String.fromCodePoint(0x1F4A8), 25);
                for (let i = 0; i < 3; i++) {
                    ctx.globalAlpha = alpha * (0.4 + pulse * 0.42);
                    ctx.drawImage(this._windTellCache.canvas, i * 20 - this._windTellCache.width / 2 - 20, -this.height / 2 - 44 - i * 4);
                }
            } else {
                if (!this._bloodTellCache) this._bloodTellCache = getEmojiCanvas(String.fromCodePoint(0x1FA78), 25);
                if (!this._warnCache) this._warnCache = getEmojiCanvas(String.fromCodePoint(0x26A0) + '\uFE0F', 26);
                ctx.globalAlpha = alpha * (0.44 + pulse * 0.4);
                ctx.drawImage(this._bloodTellCache.canvas, -this._bloodTellCache.width / 2, -this.height / 2 - 46);
                ctx.drawImage(this._warnCache.canvas, -this._warnCache.width / 2, -this.height / 2 - 70);
            }
            ctx.globalAlpha = alpha;
        }

        if (this.bossType === 'boss_mosquito' && this.mosquitoState === 'DASH') {
            const dir = this.facingRight ? 1 : -1;
            ctx.strokeStyle = `rgba(214, 255, 190, ${0.38 + Math.sin(this.timeAlive * 30) * 0.16})`;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-dir * 10, 0);
            ctx.lineTo(-dir * 38, -10);
            ctx.moveTo(-dir * 4, 12);
            ctx.lineTo(-dir * 30, 8);
            ctx.stroke();
        }

        if (this.bossType === 'boss_mosquito' && this.mosquitoState === 'DRAIN') {
            ctx.strokeStyle = `rgba(255, 110, 90, ${0.32 + Math.sin(this.timeAlive * 28) * 0.14})`;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(0, -2);
            ctx.lineTo(-18, 16);
            ctx.moveTo(6, 2);
            ctx.lineTo(20, 20);
            ctx.stroke();
        }

        if (this.bossType === 'boss_juggler' && this.jugglerTelegraphTimer > 0) {
            const pulse = 0.58 + Math.sin(this.timeAlive * 24) * 0.34;
            if (this.jugglerTelegraphType === 'cascade') {
                if (!this._jugglerBallTellCache) this._jugglerBallTellCache = getEmojiCanvas('🟡', 30);
                ctx.fillStyle = `rgba(255, 210, 90, ${0.14 + pulse * 0.14})`;
                ctx.beginPath();
                ctx.ellipse(0, -this.height / 2 - 36, this.width * 0.34, 22, 0, 0, Math.PI * 2);
                ctx.fill();
                for (let i = -1; i <= 1; i++) {
                    ctx.globalAlpha = alpha * (0.56 + pulse * 0.38);
                    ctx.drawImage(this._jugglerBallTellCache.canvas, i * 30 - this._jugglerBallTellCache.width / 2, -this.height / 2 - 50 - Math.abs(i) * 7);
                }
            } else if (this.jugglerTelegraphType === 'rain') {
                if (!this._warnCache) this._warnCache = getEmojiCanvas(String.fromCodePoint(0x26A0) + '\uFE0F', 30);
                if (!this._jugglerRainTellCache) this._jugglerRainTellCache = getEmojiCanvas('🔴', 28);
                const markerX = this.jugglerRainCenterX - (this.x + this.width / 2);
                const laneW = 128 + this.phase * 16;
                const laneH = 26;
                const laneY = -this.height / 2 - 70;
                ctx.fillStyle = `rgba(255, 96, 96, ${0.12 + pulse * 0.16})`;
                ctx.fillRect(markerX - laneW / 2, laneY, laneW, laneH);
                ctx.strokeStyle = `rgba(255, 196, 120, ${0.36 + pulse * 0.26})`;
                ctx.lineWidth = 2.5;
                ctx.strokeRect(markerX - laneW / 2, laneY, laneW, laneH);
                ctx.globalAlpha = alpha * (0.52 + pulse * 0.4);
                ctx.drawImage(this._warnCache.canvas, markerX - this._warnCache.width / 2, laneY - 18);
                ctx.drawImage(this._warnCache.canvas, markerX - laneW * 0.38 - this._warnCache.width / 2, laneY - 8);
                ctx.drawImage(this._warnCache.canvas, markerX + laneW * 0.38 - this._warnCache.width / 2, laneY - 8);
                ctx.drawImage(this._jugglerRainTellCache.canvas, markerX - this._jugglerRainTellCache.width / 2, laneY + 2);
            } else {
                if (!this._warnCache) this._warnCache = getEmojiCanvas(String.fromCodePoint(0x26A0) + '\uFE0F', 30);
                if (!this._rollTellCache) this._rollTellCache = getEmojiCanvas('🟠', 28);
                const dir = this.facingRight ? 1 : -1;
                const laneLen = 120;
                const laneY = this.height * 0.2;
                ctx.strokeStyle = `rgba(255, 206, 115, ${0.42 + pulse * 0.26})`;
                ctx.lineWidth = 5;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(0, laneY);
                ctx.lineTo(dir * laneLen, laneY);
                ctx.stroke();
                ctx.globalAlpha = alpha * (0.56 + pulse * 0.36);
                ctx.drawImage(this._warnCache.canvas, -this._warnCache.width / 2 - 24, -this.height / 2 - 50);
                ctx.drawImage(this._warnCache.canvas, -this._warnCache.width / 2 + 24, -this.height / 2 - 50);
                ctx.drawImage(this._rollTellCache.canvas, -this._rollTellCache.width / 2, laneY - this._rollTellCache.height / 2);
            }
            ctx.globalAlpha = alpha;
        }

        if (this.bossType === 'boss_juggler' && this.jugglerState === 'ROLL') {
            const dir = this.facingRight ? 1 : -1;
            ctx.strokeStyle = `rgba(255, 225, 140, ${0.42 + Math.sin(this.timeAlive * 28) * 0.16})`;
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-dir * 16, 4);
            ctx.lineTo(-dir * 54, 0);
            ctx.moveTo(-dir * 10, -9);
            ctx.lineTo(-dir * 44, -16);
            ctx.stroke();
        }

        if (this.bossType === 'boss_beetle' && this.beetleTelegraphTimer > 0) {
            const pulse = 0.58 + Math.sin(this.timeAlive * 24) * 0.34;
            if (this.beetleTelegraphType === 'roll') {
                if (!this._warnCache) this._warnCache = getEmojiCanvas(String.fromCodePoint(0x26A0) + '\uFE0F', 26);
                ctx.globalAlpha = alpha * (0.44 + pulse * 0.4);
                ctx.drawImage(this._warnCache.canvas, -this._warnCache.width / 2 - 18, -this.height / 2 - 44);
                ctx.drawImage(this._warnCache.canvas, -this._warnCache.width / 2 + 18, -this.height / 2 - 44);
            } else if (this.beetleTelegraphType === 'scarab_spray') {
                if (!this._scarabTellCache) this._scarabTellCache = getEmojiCanvas(String.fromCodePoint(0x1FAB2), 24);
                for (let i = -1; i <= 1; i++) {
                    ctx.globalAlpha = alpha * (0.4 + pulse * 0.42);
                    ctx.drawImage(this._scarabTellCache.canvas, i * 22 - this._scarabTellCache.width / 2, -this.height / 2 - 44 - Math.abs(i) * 6);
                }
            } else {
                if (!this._dirtTellCache) this._dirtTellCache = getEmojiCanvas(String.fromCodePoint(0x1FAA8), 24);
                ctx.globalAlpha = alpha * (0.42 + pulse * 0.4);
                ctx.drawImage(this._dirtTellCache.canvas, -this._dirtTellCache.width / 2, this.height * 0.22);
                ctx.drawImage(this._dirtTellCache.canvas, -this._dirtTellCache.width / 2 - 22, this.height * 0.24);
                ctx.drawImage(this._dirtTellCache.canvas, -this._dirtTellCache.width / 2 + 22, this.height * 0.24);
            }
            ctx.globalAlpha = alpha;
        }

        if (this.bossType === 'boss_beetle' && this.beetleState === 'ROLL') {
            const dir = this.facingRight ? 1 : -1;
            ctx.strokeStyle = `rgba(221, 191, 141, ${0.4 + Math.sin(this.timeAlive * 28) * 0.16})`;
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-dir * 12, 4);
            ctx.lineTo(-dir * 48, 2);
            ctx.moveTo(-dir * 8, -8);
            ctx.lineTo(-dir * 42, -14);
            ctx.stroke();
        }

        if (this.bossType === 'boss_beetle' && this.beetleState === 'BURROW') {
            ctx.strokeStyle = `rgba(196, 166, 120, ${0.32 + Math.sin(this.timeAlive * 18) * 0.12})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(0, this.height * 0.44, this.width * 0.22, 8, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (this.bossType === 'boss_honeybee' && (this.honeybeeGatherTimer > 0 || this.honeybeeDeployTimer > 0)) {
            if (!this._beeTellCache) this._beeTellCache = getEmojiCanvas(String.fromCodePoint(0x1F41D), 25);
            if (!this._upArrowTellCache) this._upArrowTellCache = getEmojiCanvas(String.fromCodePoint(0x2B06) + '\uFE0F', 24);
            if (!this._downArrowTellCache) this._downArrowTellCache = getEmojiCanvas(String.fromCodePoint(0x2B07) + '\uFE0F', 24);
            if (!this._warnCache) this._warnCache = getEmojiCanvas(String.fromCodePoint(0x26A0) + '\uFE0F', 26);

            const pulse = 0.56 + Math.sin(this.timeAlive * 24) * 0.34;
            const band = this._getHoneybeeSwarmBand(this.honeybeeTelegraphType);
            
            const gatherProgress = this.honeybeeGatherDuration > 0
                ? Math.max(0, Math.min(1, 1 - this.honeybeeGatherTimer / this.honeybeeGatherDuration))
                : 1;
            const deployProgress = this.honeybeeDeployDuration > 0
                ? Math.max(0, Math.min(1, 1 - this.honeybeeDeployTimer / this.honeybeeDeployDuration))
                : 0;
            
            // Sphere center relative to boss
            const sphereCenterX = 0;
            const sphereCenterY = band.y + band.height / 2 - (this.y + this.height / 2);
            
            // Sphere gathering effect
            const telegraphCount = lowVfx ? 12 : 24;
            const totalProgress = (gatherProgress + deployProgress) / 2;

            for (let i = 0; i < telegraphCount; i++) {
                const spawnOffset = i / telegraphCount;
                if (totalProgress < spawnOffset * 0.5) continue;
                
                let flightT = Math.min(1, (totalProgress - spawnOffset * 0.5) * 5);
                const angle = this.timeAlive * (10 + i % 3) + i * 2.1;
                const radius = 28 * (1 - deployProgress);
                
                let beeX = 0;
                let beeY = 0;
                
                if (flightT < 1) {
                    beeX = sphereCenterX * flightT;
                    beeY = sphereCenterY * flightT;
                } else {
                    beeX = sphereCenterX + Math.cos(angle) * radius * Math.random();
                    beeY = sphereCenterY + Math.sin(angle) * radius * Math.random();
                }
                
                const beeAlpha = (0.4 + pulse * 0.4) * (flightT < 1 ? flightT : 1);
                ctx.globalAlpha = alpha * beeAlpha;
                ctx.drawImage(this._beeTellCache.canvas, beeX - this._beeTellCache.width / 2, beeY - this._beeTellCache.height / 2);
            }

            // Growing sphere
            if (gatherProgress > 0.5) {
                const ballPulse = 0.5 + Math.sin(this.timeAlive * 12) * 0.2;
                const ballR = 10 + deployProgress * 15;
                ctx.globalAlpha = alpha * (0.2 + deployProgress * 0.4);
                if (this.honeybeeTelegraphType === 'low') {
                    ctx.fillStyle = `rgba(130, 220, 255, ${0.48 + ballPulse * 0.18})`;
                } else if (this.honeybeeTelegraphType === 'mid') {
                    ctx.fillStyle = `rgba(185, 232, 170, ${0.48 + ballPulse * 0.18})`;
                } else {
                    ctx.fillStyle = `rgba(255, 220, 120, ${0.48 + ballPulse * 0.18})`;
                }
                ctx.beginPath();
                ctx.arc(sphereCenterX, sphereCenterY, ballR, 0, Math.PI * 2);
                ctx.fill();
            }

            // Warning indicators
            const arrow = this.honeybeeTelegraphType === 'low'
                ? this._upArrowTellCache
                : (this.honeybeeTelegraphType === 'mid' ? this._warnCache : this._downArrowTellCache);
            ctx.drawImage(arrow.canvas, -arrow.width / 2, -this.height / 2 - 56);
            
            if (deployProgress > 0) {
                 ctx.globalAlpha = alpha * deployProgress;
                 ctx.drawImage(this._warnCache.canvas, sphereCenterX - this._warnCache.width / 2, sphereCenterY - 40);
            }
            ctx.globalAlpha = alpha;
        }

        if (this.bossType === 'boss_honeybee' && this.honeybeeSwarmActiveTimer > 0) {
            if (!this._beeTellCache) this._beeTellCache = getEmojiCanvas(String.fromCodePoint(0x1F41D), 25);
            const band = this._getHoneybeeSwarmBand(this.honeybeeSwarmType);
            const pulse = 0.6 + Math.sin(this.timeAlive * 26) * 0.3;
            
            const swarmElapsed = (this.honeybeeSwarmDuration || 0) - this.honeybeeSwarmActiveTimer;
            const introWindow = 0.15;
            const introProgress = Math.max(0, Math.min(1, swarmElapsed / introWindow));
            const outroWindow = 0.15;
            const outroProgress = Math.max(0, Math.min(1, this.honeybeeSwarmActiveTimer / outroWindow));
            const activeScale = introProgress * outroProgress;
            
            const sphereCenterX = 0;
            const sphereCenterY = band.y + band.height / 2 - (this.y + this.height / 2);
            
            const dir = -1; // Forward in local space
            const attackDistance = this.platform.width;
            
            const currentDistance = attackDistance * introProgress;
            const frontX = sphereCenterX + dir * currentDistance;
            
            const startX = Math.min(sphereCenterX, frontX);
            const endX = Math.max(sphereCenterX, frontX);
            const beamW = endX - startX;
            
            const laneY = band.y - (this.y + this.height / 2);
            const laneH = band.height;
            
            if (this.honeybeeSwarmType === 'low') {
                ctx.fillStyle = `rgba(155, 225, 255, ${(0.2 + pulse * 0.16) * activeScale})`;
            } else if (this.honeybeeSwarmType === 'mid') {
                ctx.fillStyle = `rgba(188, 236, 176, ${(0.2 + pulse * 0.16) * activeScale})`;
            } else {
                ctx.fillStyle = `rgba(255, 228, 140, ${(0.2 + pulse * 0.16) * activeScale})`;
            }
            if (beamW > 0) {
                ctx.fillRect(startX, laneY, beamW, laneH);
            }

            const beesTotal = lowVfx ? 20 : 45;
            for (let i = 0; i < beesTotal; i++) {
                const speed = 5 + (i % 3);
                const timeOffset = (this.timeAlive * speed + i * 0.3) % 1.0;
                if (timeOffset > introProgress) continue;
                
                const bx = sphereCenterX + dir * attackDistance * timeOffset;
                const by = sphereCenterY + Math.sin(this.timeAlive * 20 + i) * (laneH * 0.4);
                
                const beeAlpha = (0.5 + pulse * 0.5) * activeScale;
                ctx.globalAlpha = alpha * beeAlpha;
                ctx.drawImage(this._beeTellCache.canvas, bx - this._beeTellCache.width / 2, by - this._beeTellCache.height / 2);
            }
            ctx.globalAlpha = alpha;
        }

        ctx.restore();

        if (this.bossType === 'boss_manliftingweights' && this.robotThrowLightTimer > 0) {
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
