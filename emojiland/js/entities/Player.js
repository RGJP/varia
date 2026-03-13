import { Entity } from './Entity.js';
import { Physics } from '../Physics.js';
import { Rock } from './Rock.js';
import { Bomb } from './Bomb.js';
import { LightningOrb } from './LightningOrb.js';
import { getEmojiCanvas } from '../EmojiCache.js';

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 72, 72);
        this.speed = 300;
        this.jumpForce = -600;
        this.facingRight = true;
        this.grounded = false;

        this.maxHealth = 5;
        this.health = this.maxHealth;
        this.hasCatProtector = false;
        this.catProtectorBob = 0;
        this.bombs = 3;
        this.invulnerableTimer = 0;
        this.damageGlowTimer = 0;
        this.damageGlowDuration = 0.35;
        this.knockbackTimer = 0;
        this.stunTimer = 0;
        this.slowTimer = 0;
        this.tornadoTrapTimer = 0; // RHINO tornado capture state
        this.tornadoTrapDuration = 0;
        this.tornadoTrapAnchorX = 0;
        this.tornadoTrapAnchorY = 0;
        this.tornadoTrapWidth = 0;
        this.tornadoTrapHeight = 0;
        this.tornadoTrapPhase = 0;

        this.attackTimer = 0;
        this.isAttacking = false;
        this.attackDuration = 0.05; // 50ms
        this.rollTimer = 0;
        this.rollDuration = 0.34;
        this.rollCooldownTimer = 0;
        this.rollCooldown = 0.3;
        this.rollRecoveryTimer = 0;
        this.rollRecoveryDuration = 0.14;
        this.rollSpeed = 380;
        this.rollSpinSpeed = Math.PI * 8.5;
        this.rollDirection = 1;
        this.rollDistance = 150;
        this.rollDistanceTraveled = 0;
        this.rollDamage = 2;
        this.rollTrailTimer = 0;
        this.isRolling = false;

        this.coyoteTime = 0.13;
        this.coyoteTimer = 0;
        this.jumpBufferTime = 0.13;
        this.jumpBufferTimer = 0;
        this.isJumping = false;
        this.forceFullJump = false;

        this.isClimbing = false;
        this.currentVine = null;
        this.ignoreVineTimer = 0;
        this.vineClimbDist = 0; // distance along swinging vine rope from pivot

        this.airJumps = 1;
        this.walkOffAirJumpBonusAvailable = false;
        this.touchingWall = false;
        this.wasTouchingWall = false;

        this.score = 0;
        this.collectedLetters = { E: false, M: false, O: false, J: false, I: false };
        this.letterCelebrationTimer = 0;
        this.letterCelebrationDuration = 2.2;
        this.letterCelebrationSpawnTimer = 0;
        this.letterCelebrationSpawnInterval = 0.16;
        this.letterCelebrationVisibleCount = 0;
        this.letterCelebrationMax = 6;
        this.letterPickupPopupTimer = 0;
        this.letterPickupPopupDuration = 0.62;
        this.letterPickupPopupLetter = '';
        this.completionPopupTimer = 0;
        this.completionPopupDuration = 3.1;
        this.completionPopupTriggered = false;
        this.rotation = 0;
        this.isSpinning = false;
        this.spinDirection = 1;
        this.spinBaseRotation = 0;
        this.portalEntry = null;
        this.portalExit = null;
        this.portalSpawnCooldown = 0;
        this.portalTeleportCooldown = 0;
        this.portalHoldTimer = 0;

        this.diamondPowerUpTimer = 0;
        this.diamondPowerUpDuration = 5.0;
        this.diamondShootTimer = 0;

        this.firePowerUpTimer = 0;
        this.firePowerUpDuration = 8.0;
        this.firePowerUpRotation = 0;
        this.frostPowerUpTimer = 0;
        this.frostPowerUpDuration = this.firePowerUpDuration;
        this.lightningPowerUpTimer = 0;
        this.lightningPowerUpDuration = 7.0;
        this.lightningOrbShootInterval = 0.7;
        this.lightningOrbShootTimer = 0;
        this.frostBlastRadius = this.width * 3.6; // 7.2x player sprite size diameter.
        this.frostBlastDamage = 3;
        this.frostBlastTimer = 0;
        this.frostBlastDuration = 0.48;
        this.frostBlastX = 0;
        this.frostBlastY = 0;
        this.flightTimer = 0;
        this.flightPowerUpDuration = 7.0;
        this.flightSpeed = 480;
        this.powerVisualTimer = 0;
        this.pulseTimer = 0;
        this.attackChargeTimer = 0;
        this.minTapAttackChargeTime = 0.045;
        this.maxAttackChargeTime = 1.0;
        this.chargeIndicatorDelay = 0.14;
        this.shellThrowLockoutTimer = 0;
        this.shellGrabLockoutTimer = 0;
        this.isChargingAttack = false;
        this.inSafeBubble = false;
        this.activeSafeBubble = null;
        this.safeZoneReentryLockedZone = null;
        this.safeZoneReentryLockTimer = 0;

        const icons = [
            "🚶‍➡️",
            "🏃‍➡️",
            "🚶‍♀️‍➡️",
            "💃",
            "🕺",
            "🧑‍🦼‍➡️",
            "🧑‍🦯‍➡️",
            "🤸‍♂️",
            "🧑‍🦽‍➡️",
            "🐧",
            "🏇",
            "🏌️‍♂️",
            "🤾‍♀️",
            "⛹️‍♀️"
        ];
        this.emoji = icons[Math.floor(Math.random() * icons.length)];
        this._emojiFacesLeft = this.emoji === "🏇" || this.emoji === "🤾‍♀️" || this.emoji === "⛹️‍♀️";
        // Pre-cache the emoji
        this._cachedEmoji = getEmojiCanvas(this.emoji, 72);

        this._hitbox = { x: 0, y: 0, width: 0, height: 0 };
        this._updateHitbox();
        this._fireboxes = [];
        for (let i = 0; i < 3; i++) {
            this._fireboxes.push({ x: 0, y: 0, width: 30, height: 30 });
        }
        this._frostBlastEnemyCandidates = [];
        this._rollEnemyHitCooldowns = new Map();
        this._blockedOnXAxisThisFrame = false;
        this.carriedShell = null;
    }

    update(dt, input, platforms, game, collisionContext = null) {
        this.wasTouchingWall = this.touchingWall;
        this.touchingWall = false;
        // Timers
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= dt;
        }
        if (this.damageGlowTimer > 0) {
            this.damageGlowTimer -= dt;
        }
        if (this.rollCooldownTimer > 0) {
            this.rollCooldownTimer = Math.max(0, this.rollCooldownTimer - dt);
        }
        if (this.rollRecoveryTimer > 0) {
            this.rollRecoveryTimer = Math.max(0, this.rollRecoveryTimer - dt);
        }
        if (this.isRolling) {
            this.rollTimer = Math.max(0, this.rollTimer - dt);
            this.rollTrailTimer -= dt;
            if (this.rollTimer <= 0) {
                this._endRoll();
            }
        } else {
            this.rollTrailTimer = 0;
        }
        if (this._rollEnemyHitCooldowns.size > 0) {
            for (const [enemy, timer] of this._rollEnemyHitCooldowns.entries()) {
                if (!enemy || enemy.markedForDeletion) {
                    this._rollEnemyHitCooldowns.delete(enemy);
                    continue;
                }
                const nextTimer = timer - dt;
                if (nextTimer <= 0) this._rollEnemyHitCooldowns.delete(enemy);
                else this._rollEnemyHitCooldowns.set(enemy, nextTimer);
            }
        }
        this._updateHitbox();
        if (this.knockbackTimer > 0) {
            this.knockbackTimer -= dt;
        }
        if (this.stunTimer > 0) {
            this.stunTimer -= dt;
        }
        if (this.tornadoTrapTimer > 0) {
            this.tornadoTrapTimer = Math.max(0, this.tornadoTrapTimer - dt);
            const duration = Math.max(0.001, this.tornadoTrapDuration || 0.2);
            const progress = Math.max(0, Math.min(1, 1 - this.tornadoTrapTimer / duration));
            this.tornadoTrapPhase += dt * (34 + progress * 28);

            const centerX = this.tornadoTrapAnchorX || (this.x + this.width / 2);
            const centerY = this.tornadoTrapAnchorY || (this.y + this.height / 2);
            const trapW = this.tornadoTrapWidth || 116;
            const trapH = this.tornadoTrapHeight || 116;
            const radiusX = Math.max(16, Math.min(trapW * 0.36, 54));
            const radiusY = Math.max(8, Math.min(trapH * 0.18, 24));
            const shakeX = (Math.random() - 0.5) * (6 + progress * 8);
            const shakeY = (Math.random() - 0.5) * (5 + progress * 7);

            this.x = centerX - this.width / 2 + Math.sin(this.tornadoTrapPhase * 2.2) * radiusX + shakeX;
            this.y = centerY - this.height / 2 + Math.cos(this.tornadoTrapPhase * 1.7) * radiusY + shakeY;
            this._updateHitbox();

            const spinDir = Math.sin(this.tornadoTrapPhase * 1.35) >= 0 ? 1 : -1;
            this.rotation += spinDir * dt * (15 + progress * 18);
            this.vx = 0;
            this.vy = 0;
            this.grounded = false;
            this.isClimbing = false;
            this.currentVine = null;
            this.isSpinning = false;

            if (this.tornadoTrapTimer <= 0) {
                this.vy = -900; // High launch after the trap shake (reduced a bit)
                this.vx = (Math.random() < 0.5 ? -1 : 1) * (90 + Math.random() * 70);
                this.rotation = 0;
                this.isJumping = true;
                this.forceFullJump = true;
                this.isSpinning = true;
                this.spinDirection = this.vx >= 0 ? 1 : -1;
                this.spinBaseRotation = this.rotation;
                this.jumpBufferTimer = 0;
                this.coyoteTimer = 0;
                this.airJumps = 1;
                this.walkOffAirJumpBonusAvailable = false;
            }
        }
        if (this.portalSpawnCooldown > 0) {
            this.portalSpawnCooldown = Math.max(0, this.portalSpawnCooldown - dt);
        }
        if (this.portalTeleportCooldown > 0) {
            this.portalTeleportCooldown = Math.max(0, this.portalTeleportCooldown - dt);
        }
        if (this.portalHoldTimer > 0) {
            this.portalHoldTimer -= dt;
            if (this.portalHoldTimer <= 0) {
                this.portalHoldTimer = 0;
                this.portalEntry = null;
                this.portalExit = null;
                // Grant two jumps after portal exit to prevent falling deaths.
                this.airJumps = 2;
                this.coyoteTimer = this.coyoteTime;
            }
        }
        if (this.slowTimer > 0) {
            this.slowTimer -= dt;
        }
        if (this.ignoreVineTimer > 0) {
            this.ignoreVineTimer -= dt;
        }
        if (this.safeZoneReentryLockTimer > 0) {
            this.safeZoneReentryLockTimer = Math.max(0, this.safeZoneReentryLockTimer - dt);
        }
        if (this.shellThrowLockoutTimer > 0) {
            this.shellThrowLockoutTimer = Math.max(0, this.shellThrowLockoutTimer - dt);
        }
        if (this.shellGrabLockoutTimer > 0) {
            this.shellGrabLockoutTimer = Math.max(0, this.shellGrabLockoutTimer - dt);
        }
        if (
            this.safeZoneReentryLockedZone &&
            this.safeZoneReentryLockTimer <= 0 &&
            !this.safeZoneReentryLockedZone.containsEntity(this, 2)
        ) {
            this.safeZoneReentryLockedZone = null;
        }
        const nearbySafeZones = (collisionContext && collisionContext.safeZones) ? collisionContext.safeZones : game.safeZones;

        if (this.inSafeBubble) {
            // Keep barrel occupancy stable; only drop state after clearly leaving the zone.
            if (!this.activeSafeBubble || !this.activeSafeBubble.containsEntity(this, 20)) {
                this.inSafeBubble = false;
                this.activeSafeBubble = null;
            }
        } else if (nearbySafeZones && nearbySafeZones.length > 0) {
            for (let i = 0; i < nearbySafeZones.length; i++) {
                const zone = nearbySafeZones[i];
                if (zone === this.safeZoneReentryLockedZone) continue;
                const inEntryCatch = zone && zone.containsEntity(this);
                const pulledFromBelow = zone && typeof zone.shouldPullInFromBelow === 'function' && zone.shouldPullInFromBelow(this);
                if (inEntryCatch || pulledFromBelow) {
                    this.inSafeBubble = true;
                    this.activeSafeBubble = zone;
                    this.isClimbing = false;
                    this.currentVine = null;
                    this.vx = 0;
                    this.vy = 0;
                    this._endRoll();
                    this.isChargingAttack = false;
                    this.attackChargeTimer = 0;
                    // Snap immediately so the player is fully "inside" this frame.
                    this.x = zone.centerX - this.width / 2;
                    this.y = zone.centerY - this.height / 2;
                    break;
                }
            }
        }

        // Pause active power-up durations while inside a safe barrel.
        if (this.flightTimer > 0 && !this.inSafeBubble) {
            this.flightTimer -= dt;
            if (this.flightTimer <= 0) {
                this.flightTimer = 0;
            }
        }
        const isFlying = this.flightTimer > 0;

        if (this.grounded || (this.wasTouchingWall && this.vy >= 0)) {
            this.coyoteTimer = this.coyoteTime;
            this.airJumps = 1;
            this.walkOffAirJumpBonusAvailable = true;
        } else {
            this.coyoteTimer -= dt;
        }

        if (input.isActionJustPressed('jump')) {
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

        if (!this.inSafeBubble && this.diamondPowerUpTimer > 0) {
            this.diamondPowerUpTimer -= dt;
            this.diamondShootTimer -= dt;
            this.powerVisualTimer -= dt;
            if (this.diamondShootTimer <= 0) {
                this.diamondShootTimer = 0.08; // Fast auto fire
                const throwX = this.facingRight ? this.x + this.width : this.x - 20;
                const rock = new Rock(throwX, this.y + this.height / 2 - 10, this.facingRight);
                game.rocks.push(rock);
                if (game.audio) game.audio.playThrow();
            }
            if (this.powerVisualTimer <= 0 && game && game.particles) {
                this.powerVisualTimer = 0.09;
                game.particles.emit(
                    this.x + this.width / 2 + (Math.random() - 0.5) * 18,
                    this.y + this.height / 2 + (Math.random() - 0.5) * 18,
                    6,
                    '#8be9ff',
                    [40, 120],
                    [0.12, 0.25],
                    [1.5, 3.2]
                );
            }
        }

        if (!this.inSafeBubble && this.firePowerUpTimer > 0) {
            this.firePowerUpTimer -= dt;
            this.firePowerUpRotation += (Math.PI * 2.2) * dt; // Slower spin to reduce motion sickness
            this.powerVisualTimer -= dt;
            if (this.powerVisualTimer <= 0 && game && game.particles) {
                this.powerVisualTimer = 0.08;
                game.particles.emit(
                    this.x + this.width / 2 + (Math.random() - 0.5) * 16,
                    this.y + this.height / 2 + (Math.random() - 0.5) * 16,
                    6,
                    '#ffb347',
                    [35, 110],
                    [0.12, 0.24],
                    [1.5, 3.2]
                );
            }
        }
        if (!this.inSafeBubble && this.frostPowerUpTimer > 0) {
            this.frostPowerUpTimer -= dt;
            this.powerVisualTimer -= dt;
            if (this.powerVisualTimer <= 0 && game && game.particles) {
                this.powerVisualTimer = 0.09;
                game.particles.emit(
                    this.x + this.width / 2 + (Math.random() - 0.5) * 18,
                    this.y + this.height / 2 + (Math.random() - 0.5) * 18,
                    8,
                    '#9edcff',
                    [40, 120],
                    [0.16, 0.34],
                    [1.8, 3.6]
                );
            }
        }
        if (!this.inSafeBubble && this.lightningPowerUpTimer > 0) {
            this.lightningPowerUpTimer = Math.max(0, this.lightningPowerUpTimer - dt);
            this.lightningOrbShootTimer -= dt;
            while (this.lightningOrbShootTimer <= 0 && this.lightningPowerUpTimer > 0) {
                this.lightningOrbShootTimer += this.lightningOrbShootInterval;
                this._spawnLightningOrb(game);
            }
        }
        if (game && game.audio) {
            const activeOrbs = Array.isArray(game.lightningOrbs)
                ? game.lightningOrbs.some(orb => orb && !orb.markedForDeletion)
                : false;
            if (activeOrbs && typeof game.audio.startLightningBuzz === 'function') {
                game.audio.startLightningBuzz();
            } else if (!activeOrbs && typeof game.audio.stopLightningBuzz === 'function') {
                game.audio.stopLightningBuzz();
            }
        }
        if (!this.inSafeBubble && this.frostBlastTimer > 0) {
            this.frostBlastTimer -= dt;
            if (this.frostBlastTimer <= 0) this.frostBlastTimer = 0;
            // Keep blast VFX anchored to the player while active.
            this.frostBlastX = this.x + this.width / 2;
            this.frostBlastY = this.y + this.height / 2;
        }

        this.pulseTimer += dt;
        if (this.isRolling && game?.particles && this.rollTrailTimer <= 0) {
            this.rollTrailTimer = 0.03;
            const trailX = this.x + this.width / 2 - this.rollDirection * (this.width * 0.26);
            const trailY = this.y + this.height * 0.72;
            game.particles.emit(trailX, trailY, 4, 'rgba(255, 220, 140, 0.65)', [22, 72], [0.08, 0.18], [2, 5]);
            game.particles.emit(trailX, trailY, 3, 'rgba(255, 255, 255, 0.35)', [16, 48], [0.05, 0.12], [1.5, 3]);
        }
        this.catProtectorBob += dt;
        if (this.letterCelebrationTimer > 0) {
            this.letterCelebrationTimer -= dt;
            this.letterCelebrationSpawnTimer -= dt;
            while (
                this.letterCelebrationVisibleCount < this.letterCelebrationMax &&
                this.letterCelebrationSpawnTimer <= 0
            ) {
                this.letterCelebrationVisibleCount++;
                if (game && game.audio && typeof game.audio.playLetterVictoryStep === 'function') {
                    game.audio.playLetterVictoryStep(this.letterCelebrationVisibleCount - 1);
                }
                this.letterCelebrationSpawnTimer += this.letterCelebrationSpawnInterval;
            }
            if (this.letterCelebrationTimer <= 0) {
                this.letterCelebrationTimer = 0;
                this.letterCelebrationVisibleCount = 0;
            }
        }
        if (this.letterPickupPopupTimer > 0) {
            this.letterPickupPopupTimer -= dt;
            if (this.letterPickupPopupTimer <= 0) {
                this.letterPickupPopupTimer = 0;
                this.letterPickupPopupLetter = '';
            }
        }
        if (this.completionPopupTimer > 0) {
            this.completionPopupTimer -= dt;
            if (this.completionPopupTimer <= 0) {
                this.completionPopupTimer = 0;
            }
        }
        if (!this.completionPopupTriggered && game && typeof game.getLevelCompletionPercent === 'function') {
            const completion = game.getLevelCompletionPercent();
            if (completion >= 100) {
                this.completionPopupTriggered = true;
                this.completionPopupTimer = this.completionPopupDuration;
                if (game.audio && typeof game.audio.playCompletion100Cue === 'function') {
                    game.audio.playCompletion100Cue();
                }
            }
        }

        // Input
        // Drop Bomb
        if (!this.inSafeBubble && !game.gameOverTriggered && this.stunTimer <= 0 && this.tornadoTrapTimer <= 0 && input.isActionJustPressed('bomb')) {
            if (this.bombs > 0) {
                this.bombs--;
                const bombX = this.x + this.width / 2 - 12; // Center bomb
                const bombY = this.y + this.height - 12;
                const bomb = new Bomb(bombX, bombY);
                game.rocks.push(bomb);
                if (game.audio) game.audio.playThrow();
            }
        }
        if (!this.inSafeBubble && !game.gameOverTriggered && this.stunTimer <= 0 && this.tornadoTrapTimer <= 0 && input.isActionJustPressed('portal')) {
            this._spawnPortals(game);
        }
        if (this._canStartRoll(game) && input.isActionJustPressed('roll')) {
            this._startRoll(game);
        }

        // Attack charge and release
        const canChargeAttack = !this.inSafeBubble && !game.gameOverTriggered && this.stunTimer <= 0 && this.tornadoTrapTimer <= 0 && !this.isRolling;
        if (!canChargeAttack) {
            this.attackChargeTimer = 0;
            this.isChargingAttack = false;
        } else {
            const attackPressed = input.isActionJustPressed('attack');
            const attackReleased = input.isActionJustReleased('attack');
            const attackHeld = input.isActionDown('attack');

            let shellWasKickedThisFrame = false;
            if (attackPressed && this.carriedShell) {
                this._kickCarriedShell(game);
                this.attackChargeTimer = 0;
                this.isChargingAttack = false;
                shellWasKickedThisFrame = true;
            }

            if (!shellWasKickedThisFrame && this.shellThrowLockoutTimer <= 0 && this.frostPowerUpTimer > 0 && attackPressed) {
                this.isAttacking = true;
                this.attackTimer = this.attackDuration;
                this._triggerFrostBlast(game);
            }

            // Seed charge on press so quick taps between frames still fire.
            // Only seed if we didn't just kick a shell and aren't carrying one.
            if (!shellWasKickedThisFrame && this.shellThrowLockoutTimer <= 0 && attackPressed && this.attackChargeTimer <= 0 && !this.carriedShell) {
                this.attackChargeTimer = this.minTapAttackChargeTime;
            }

            if (!shellWasKickedThisFrame && this.shellThrowLockoutTimer <= 0 && attackHeld && !this.carriedShell) {
                this.isChargingAttack = true;
                this.attackChargeTimer = Math.min(this.maxAttackChargeTime, this.attackChargeTimer + dt);
            }

            if (!this.carriedShell && !game.gameOverTriggered && this.shellThrowLockoutTimer <= 0 && attackReleased && this.attackChargeTimer > 0) {
                this.isAttacking = true;
                this.attackTimer = this.attackDuration;

                const fullyCharged = this.attackChargeTimer >= this.maxAttackChargeTime;
                const sizeMultiplier = fullyCharged ? 3 : 1;
                const rockSize = 20 * sizeMultiplier;
                const throwX = this.facingRight ? this.x + this.width : this.x - rockSize;
                const throwY = this.y + this.height / 2 - rockSize / 2;

                const rock = new Rock(throwX, throwY, this.facingRight, {
                    sizeMultiplier,
                    damage: fullyCharged ? 8 : 1,
                    phaseThroughSurfaces: fullyCharged
                });
                game.rocks.push(rock);
                if (game.audio) game.audio.playThrow();

                this.attackChargeTimer = 0;
                this.isChargingAttack = false;
            } else if (!attackHeld && !attackPressed && !this.carriedShell) {
                // Defensive reset for cases where focus loss cancels a hold mid-charge.
                this.attackChargeTimer = 0;
                this.isChargingAttack = false;
            }
        }

        // Vine Collision Logic
        if (!isFlying && !this.isRolling && !this.isClimbing && this.ignoreVineTimer <= 0 && this.knockbackTimer <= 0) {
            // Check static vines
            const nearbyVines = (collisionContext && collisionContext.vines) ? collisionContext.vines : game.vines;
            if (nearbyVines) {
                for (let i = 0; i < nearbyVines.length; i++) {
                    const vine = nearbyVines[i];
                    if (Physics.checkAABB(this, vine)) {
                        this.isClimbing = true;
                        this.currentVine = vine;
                        this.vx = 0;
                        this.vy = 0;
                        this.x = vine.x + vine.width / 2 - this.width / 2;
                        this.jumpBufferTimer = 0;
                        this.coyoteTimer = 0;
                        this.airJumps = 1;
                        this.walkOffAirJumpBonusAvailable = false;
                        break;
                    }
                }
            }
            // Check swinging vines
            const nearbySwingingVines = (collisionContext && collisionContext.swingingVines) ? collisionContext.swingingVines : game.swingingVines;
            if (!this.isClimbing && nearbySwingingVines) {
                for (let i = 0; i < nearbySwingingVines.length; i++) {
                    const sv = nearbySwingingVines[i];
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
                        this.walkOffAirJumpBonusAvailable = false;
                        break;
                    }
                }
            }
        }

        const isPortalTraveling = this.portalHoldTimer > 0;

        // Movement
        if (isPortalTraveling) {
            this.grounded = false;
            this.isClimbing = false;
            this.currentVine = null;
            this.vx = 0;
            this.vy = 0;
        } else if (this.inSafeBubble && this.activeSafeBubble) {
            this.grounded = false;
            this.isClimbing = false;
            this.currentVine = null;
            this.vx = 0;
            this.vy = 0;
            this.isSpinning = false;
            this.rotation = 0;

            const targetX = this.activeSafeBubble.centerX - this.width / 2;
            const targetY = this.activeSafeBubble.centerY - this.height / 2;
            // Hard lock to center while inside so render/collision state never flickers.
            this.x = targetX;
            this.y = targetY;

            // Use buffered jump intent because `isJustPressed` is consumed earlier.
            if (this.jumpBufferTimer > 0) {
                const launchedFromZone = this.activeSafeBubble;
                this.inSafeBubble = false;
                this.activeSafeBubble = null;
                this.safeZoneReentryLockedZone = launchedFromZone;
                this.safeZoneReentryLockTimer = 0.42;
                this.invulnerableTimer = Math.max(this.invulnerableTimer, 0.22);
                this.x = targetX;
                this.y = (targetY - this.height * 0.55) - 2;
                this.vx = 0;
                this.vy = this.jumpForce * Math.SQRT2;
                this.isJumping = true;
                this.forceFullJump = true;
                this.isSpinning = true;
                this.spinDirection = this.facingRight ? 1 : -1;
                this.rotation = 0;
                this.airJumps = 1;
                this.walkOffAirJumpBonusAvailable = false;
                this.spinBaseRotation = this.rotation;
                this.jumpBufferTimer = 0;
                this.coyoteTimer = 0;
                if (game.audio && typeof game.audio.playBlastOff === 'function') game.audio.playBlastOff();
                else if (game.audio) game.audio.playJump();
                if (game.particles) {
                    const smokeX = launchedFromZone.centerX;
                    const smokeY = launchedFromZone.centerY - launchedFromZone.height * 0.46;
                    game.particles.emitStomp(smokeX, smokeY);
                    game.particles.emit(smokeX, smokeY, 8, 'rgba(180,180,180,0.75)', [40, 120], [0.2, 0.45], [6, 14]);
                }
            }
        } else if (isFlying && !game.gameOverTriggered) {
            this.vx = 0;
            this.vy = 0;
            if (input.isActionDown('left')) {
                this.vx = -this.flightSpeed;
                this.facingRight = false;
            } else if (input.isActionDown('right')) {
                this.vx = this.flightSpeed;
                this.facingRight = true;
            }
            if (input.isActionDown('up')) {
                this.vy = -this.flightSpeed;
            } else if (input.isActionDown('down')) {
                this.vy = this.flightSpeed;
            }
        } else if (this.isRolling) {
            this.vx = this.rollDirection * this.rollSpeed;
            this.facingRight = this.rollDirection >= 0;
        } else if (this.knockbackTimer > 0) {
            // Apply standard friction during knockback so player slides a bit from the hit
            if (this.vx > 0) {
                this.vx -= Physics.FRICTION * dt;
                if (this.vx < 0) this.vx = 0;
            } else if (this.vx < 0) {
                this.vx += Physics.FRICTION * dt;
                if (this.vx > 0) this.vx = 0;
            }
        } else if (this.tornadoTrapTimer > 0) {
            // Tornado capture hard-locks movement while spinning.
            this.grounded = false;
            this.isClimbing = false;
            this.currentVine = null;
            this.vx = 0;
            this.vy = 0;
        } else if (this.stunTimer > 0) {
            if (this.grounded) {
                this.vx = 0;
            }
        } else if (!this.isClimbing && !game.gameOverTriggered) {
            const effectiveSpeed = this.slowTimer > 0 ? this.speed * 0.4 : this.speed;
            if (input.isActionDown('left')) {
                this.vx = -effectiveSpeed;
                this.facingRight = false;
            } else if (input.isActionDown('right')) {
                this.vx = effectiveSpeed;
                this.facingRight = true;
            } else {
                // Instant stop when no input is pressed, preventing sliding and feeling snappy
                this.vx = 0;
            }
        }

        // Jump
        if (!isPortalTraveling && !this.inSafeBubble && !isFlying && !this.isRolling && !game.gameOverTriggered && this.stunTimer <= 0 && this.tornadoTrapTimer <= 0 && this.jumpBufferTimer > 0 && !this.isClimbing) {
            if (this.coyoteTimer > 0) {
                this.vy = this.jumpForce;
                this.grounded = false;
                this.isJumping = true;
                this.forceFullJump = false;
                this.isSpinning = true;
                this.spinDirection = this.facingRight ? 1 : -1;
                this.spinBaseRotation = this.rotation;
                this.jumpBufferTimer = 0;
                this.coyoteTimer = 0;
                this.walkOffAirJumpBonusAvailable = false;
                game.audio.playJump();
                game.particles.emitJump(this.x + this.width / 2, this.y + this.height, game.currentTheme.particleColor);
            } else if (this.airJumps > 0) {
                this.vy = this.jumpForce;
                this.grounded = false;
                this.isJumping = true;
                this.forceFullJump = false;
                this.isSpinning = true;
                this.spinDirection = this.facingRight ? 1 : -1;
                this.spinBaseRotation = this.rotation;
                this.jumpBufferTimer = 0;
                if (this.walkOffAirJumpBonusAvailable) {
                    // Walking off a ledge grants one extra in-air jump before consuming the normal air jump.
                    this.walkOffAirJumpBonusAvailable = false;
                } else {
                    this.airJumps--;
                }
                game.audio.playJump();
                game.particles.emitJump(this.x + this.width / 2, this.y + this.height, game.currentTheme.particleColor);
            }
        }

        // Variable Jump Height
        if (!this.inSafeBubble && !isFlying && !input.isActionDown('jump') && this.isJumping && this.vy < 0 && !this.isClimbing && !this.forceFullJump) {
            this.vy *= 0.5; // Cut jump short
            this.isJumping = false;
        }
        if (this.forceFullJump && this.vy >= 0) {
            this.forceFullJump = false;
            this.isJumping = false;
        }

        if (this.tornadoTrapTimer > 0) {
            // Keep custom tornado spin pose set above.
        } else if (this.isRolling) {
            this.rotation += this.rollDirection * this.rollSpinSpeed * dt;
        } else if (!isFlying && !this.grounded && !this.isClimbing && this.isSpinning) {
            const spinSpeed = Math.PI * 4;
            const increment = spinSpeed * dt;
            const currentDir = this.spinDirection || (this.facingRight ? 1 : -1);
            this.rotation += currentDir * increment;
        } else {
            this.rotation = 0;
            if (this.grounded || this.isClimbing) {
                this.isSpinning = false;
            }
        }

        if (isFlying) {
            this.isClimbing = false;
            this.currentVine = null;
            this.grounded = false;
            this.x += this.vx * dt;
            this.y += this.vy * dt;
        } else if (this.tornadoTrapTimer > 0) {
            this.grounded = false;
            this.isClimbing = false;
            this.currentVine = null;
            this.vx = 0;
            this.vy = 0;
        } else if (this.isClimbing) {
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
                if (input.isActionDown('up')) {
                    this.vineClimbDist -= 200 * dt;
                } else if (input.isActionDown('down')) {
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
                if (input.isActionDown('left')) {
                    this.facingRight = false;
                } else if (input.isActionDown('right')) {
                    this.facingRight = true;
                }
            } else {
                // Static vine: original logic
                if (input.isActionDown('up')) {
                    this.vy = -200;
                } else if (input.isActionDown('down')) {
                    this.vy = 200;
                }

                this.y += this.vy * dt;

                // Allow changing facing direction while on vine
                if (input.isActionDown('left')) {
                    this.facingRight = false;
                } else if (input.isActionDown('right')) {
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
                this.walkOffAirJumpBonusAvailable = false;
                this.isSpinning = true;
                this.spinDirection = this.facingRight ? 1 : -1;
                this.spinBaseRotation = this.rotation;
                this.jumpBufferTimer = 0;
                game.audio.playJump();
                game.particles.emitJump(this.x + this.width / 2, this.y + this.height, game.currentTheme.particleColor);
            }
        } else if (!isPortalTraveling) {
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
            this._blockedOnXAxisThisFrame = false;
            const prevX = this.x;
            this.x += this.vx * dt;

            // Invisible wall at the start of the level to prevent walking off-screen
            if (this.x < 0) {
                this.x = 0;
                this.vx = 0;
                if (this.isRolling) this._blockedOnXAxisThisFrame = true;
            }

            this.resolveCollision(platforms, 'x', game);
            if (this.isRolling) {
                this.rollDistanceTraveled += Math.abs(this.x - prevX);
                if (this._blockedOnXAxisThisFrame || this.rollDistanceTraveled >= this.rollDistance) {
                    this._endRoll();
                }
            }

            // Y Collision
            this.y += this.vy * dt;
            this.grounded = false;
            this.resolveCollision(platforms, 'y', game);
        }
        this._handlePortalTeleport(game);

        // Enemy collision + fire aura logic.
        // Fire must keep damaging enemies even while flight is active.
        if (!isPortalTraveling && !this.inSafeBubble && ((this.invulnerableTimer <= 0 && !isFlying) || this.firePowerUpTimer > 0)) {
            const hitbox = this._hitbox;
            const nearbyEnemies = (collisionContext && collisionContext.enemies) ? collisionContext.enemies : game.enemies;

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

            for (let ei = 0; ei < nearbyEnemies.length; ei++) {
                const enemy = nearbyEnemies[ei];
                if (enemy.markedForDeletion) continue;
                if (enemy === this.carriedShell) continue;

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
                        if (game && typeof game.registerEnemyDefeat === 'function') game.registerEnemyDefeat(enemy);
                    }
                } else if (this.isRolling && Physics.checkAABB(hitbox, enemy)) {
                    this._damageEnemyWithRoll(enemy, game);
                } else if (!isFlying && Physics.checkAABB(hitbox, enemy)) {
                    const isTurtleEnemy = enemy.type === 'patrol' && enemy.emoji === '🐢';
                    const isTurtleShell = enemy.type === 'patrol' &&
                        enemy.emoji === '🐢' &&
                        enemy.turtleFlipped &&
                        (Math.abs(enemy.vx) <= 1 || enemy.state === 'SHELL_SLIDE');
                    const prevBottom = hitbox.y + hitbox.height - (this.vy * dt);
                    const playerCenterY = hitbox.y + hitbox.height * 0.5;
                    const enemyCenterY = enemy.y + enemy.height * 0.5;
                    const fromAbove = prevBottom <= enemy.y + enemy.height * 0.72 && playerCenterY <= enemyCenterY;
                    const isTopStomp = this.vy >= -20 && fromAbove;
                    const prevHitboxX = hitbox.x - (this.vx * dt);
                    const prevHitboxRight = prevHitboxX + hitbox.width;
                    const prevEnemyX = enemy.x - (enemy.vx * dt);
                    const prevEnemyRight = prevEnemyX + enemy.width;
                    // Relaxed 'moving' requirement: shells can be caught if they slide into a stationary player 'from the side'.
                    const fromLeftSide = prevHitboxRight <= prevEnemyX + 10;
                    const fromRightSide = prevHitboxX >= prevEnemyRight - 10;
                    const playerMidY = playerCenterY;
                    const sideKickVerticalBandTop = enemy.y + enemy.height * 0.2;
                    const sideKickVerticalBandBottom = enemy.y + enemy.height * 0.9;
                    const isSideKickContact = (fromLeftSide || fromRightSide) &&
                        playerMidY >= sideKickVerticalBandTop &&
                        playerMidY <= sideKickVerticalBandBottom;
                    if (isTurtleShell && isSideKickContact && this.shellGrabLockoutTimer <= 0) {
                        if (!this.carriedShell) {
                            this.carriedShell = enemy;
                            enemy.state = 'SHELL_CARRIED';
                            enemy.vx = 0;
                            enemy.vy = 0;
                            enemy.turtleRecovering = false;
                            enemy.turtleRecoverTimer = 0;
                        }
                        continue;
                    }
                    const stompableEmojis = ['🐢', '🐸', '🐦', '🦅', '🦉', '🐦‍⬛', '🧟‍♂️', '🦑', '🦗', '🐿️', '🕷️', '🪼', '😡', '🛸'];
                    const canStompEnemy = enemy.bossType !== 'boss_spider' && stompableEmojis.includes(enemy.emoji);
                    if (canStompEnemy && isTopStomp) {
                        const isEnragedEnemy = enemy.type === 'enraged' || enemy.emoji === '😡';
                        const isAlienEnemy = enemy.type === 'alien' || enemy.emoji === '🛸';
                        if (typeof enemy.stomp === 'function') enemy.stomp(game);
                        else enemy.takeDamage(enemy.health, game);
                        this.vy = this.jumpForce;
                        this.grounded = false;
                        this.isJumping = true;
                        this.forceFullJump = true;
                        // Treat stomps like a fresh jump launch so a follow-up air jump is available.
                        this.airJumps = 1;
                        this.walkOffAirJumpBonusAvailable = false;
                        this.coyoteTimer = 0;
                        this.jumpBufferTimer = 0;
                        this.isSpinning = true;
                        this.spinDirection = this.facingRight ? 1 : -1;
                        this.spinBaseRotation = this.rotation;
                        if (isAlienEnemy) {
                            // Prevent immediate re-contact damage while chaining saucer stomps.
                            this.invulnerableTimer = Math.max(this.invulnerableTimer, 0.42);
                        }
                        if (isEnragedEnemy) {
                            // Enraged stays alive after stomp; brief grace avoids unfair contact damage.
                            this.invulnerableTimer = Math.max(this.invulnerableTimer, 0.3);
                        }
                        if (game.audio) game.audio.playJump();
                    } else {
                        if (isTurtleEnemy) {
                            continue;
                        }
                        // Special case: man lifting weights boss grab/rush shouldn't damage the player directly
                        if (enemy.bossType === 'boss_manliftingweights' && (enemy.robotState === 'RUSH' || enemy.robotState === 'GRAB')) {
                            continue;
                        }
                        if (this.invulnerableTimer > 0) {
                            continue;
                        }
                        this.takeDamage(game);
                    }
                }
            }
        }
        if (this.isRolling) {
            this._breakRollObstacles(game);
        }

        // Collectibles
        const nearbyCollectibles = (collisionContext && collisionContext.collectibles) ? collisionContext.collectibles : game.collectibles;
        const playPowerUpPickup = (powerUpType) => {
            if (!game.audio) return;
            if (typeof game.audio.playPowerUpCollect === 'function') {
                game.audio.playPowerUpCollect(powerUpType);
            } else {
                game.audio.playCollect('powerup');
            }
        };
        for (let ci = 0; ci < nearbyCollectibles.length; ci++) {
            const collectible = nearbyCollectibles[ci];
            if (!collectible.markedForDeletion && Physics.checkAABB(this, collectible)) {
                collectible.markedForDeletion = true;
                const centerX = collectible.x + collectible.width / 2;
                const centerY = collectible.y + collectible.height / 2;
                if (collectible.type === 'health') {
                    this.health = Math.min(this.health + 1, this.maxHealth);
                    this.hasCatProtector = true;
                    playPowerUpPickup('health');
                    game.particles.emit(centerX, centerY, 15, '#FF0000', [50, 150], [0.2, 0.5], [2, 4]);
                } else if (collectible.type === 'bomb') {
                    this.bombs += 1;
                    playPowerUpPickup('bomb');
                    game.particles.emit(centerX, centerY, 15, '#444444', [50, 150], [0.2, 0.5], [2, 4]);
                } else if (collectible.type === 'diamond_powerup') {
                    this.diamondPowerUpTimer = this.diamondPowerUpDuration;
                    playPowerUpPickup('diamond_powerup');
                    game.particles.emit(centerX, centerY, 20, '#888888', [50, 200], [0.2, 0.5], [3, 5]);
                } else if (collectible.type === 'full_health') {
                    this.health = this.maxHealth;
                    this.hasCatProtector = true;
                    playPowerUpPickup('full_health');
                    game.particles.emit(centerX, centerY, 30, '#FF69B4', [50, 250], [0.2, 0.6], [3, 6]);
                } else if (collectible.type === 'fire_powerup') {
                    this.firePowerUpTimer = this.firePowerUpDuration;
                    playPowerUpPickup('fire_powerup');
                    game.particles.emit(centerX, centerY, 20, '#FF4500', [50, 200], [0.2, 0.5], [3, 5]);
                } else if (collectible.type === 'frost_powerup') {
                    this.frostPowerUpTimer = this.frostPowerUpDuration;
                    playPowerUpPickup('frost_powerup');
                    game.particles.emit(centerX, centerY, 22, '#9edcff', [50, 210], [0.2, 0.55], [2, 5]);
                } else if (collectible.type === 'lightning_powerup') {
                    this.lightningPowerUpTimer = this.lightningPowerUpDuration;
                    this.lightningOrbShootTimer = 0;
                    playPowerUpPickup('lightning_powerup');
                    game.particles.emit(centerX, centerY, 24, '#ffe066', [70, 220], [0.2, 0.55], [2, 5]);
                } else if (collectible.type === 'wing_powerup') {
                    this.flightTimer = this.flightPowerUpDuration;
                    this._endRoll();
                    this.isClimbing = false;
                    this.currentVine = null;
                    this.vx = 0;
                    this.vy = 0;
                    playPowerUpPickup('wing_powerup');
                    game.particles.emit(centerX, centerY, 24, '#9ad9ff', [70, 220], [0.2, 0.6], [2, 5]);
                } else if (collectible.type === 'letter') {
                    const letter = collectible.letter;
                    const hadAllLettersBeforePickup = Object.values(this.collectedLetters).every(Boolean);
                    let addedNewLetter = false;
                    if (letter && Object.prototype.hasOwnProperty.call(this.collectedLetters, letter)) {
                        addedNewLetter = !this.collectedLetters[letter];
                        this.collectedLetters[letter] = true;
                    }
                    if (addedNewLetter && letter) {
                        this.letterPickupPopupLetter = letter;
                        this.letterPickupPopupTimer = this.letterPickupPopupDuration;
                        if (game.audio && typeof game.audio.playLetterCollectChime === 'function') {
                            const letterOrder = ['E', 'M', 'O', 'J', 'I'];
                            const letterIndex = letterOrder.indexOf(letter);
                            game.audio.playLetterCollectChime(letterIndex >= 0 ? letterIndex : 0);
                        } else if (game.audio) {
                            game.audio.playCollect('powerup');
                        }
                    } else if (game.audio) {
                        game.audio.playCollect('powerup');
                    }
                    const hasAllLettersAfterPickup = Object.values(this.collectedLetters).every(Boolean);
                    if (!hadAllLettersBeforePickup && hasAllLettersAfterPickup) {
                        this._startLetterCelebration(game);
                    }
                    this.score += 75;
                    game.particles.emit(centerX, centerY, 16, '#ffd54f', [80, 180], [0.2, 0.45], [2, 5]);
                } else if (collectible.type === 'boss_star') {
                    this.score += 300;
                    game.hasBossKey = true;
                    playPowerUpPickup('boss_star');
                    game.particles.emit(centerX, centerY, 24, '#ffe066', [90, 240], [0.22, 0.6], [2, 6]);
                } else {
                    this.score += 10;
                    game.coinsCollected++;
                    game.audio.playCollect('coin');
                    game.particles.emit(centerX, centerY, 10, '#FFFF00', [50, 150], [0.2, 0.5], [2, 4]);
                }
            }
        }

        if (!isPortalTraveling && game && typeof game.tryRescuePrisoner === 'function') {
            game.tryRescuePrisoner(this);
        }

        // Victory state
        const victoryPlatforms = (collisionContext && collisionContext.victoryPlatforms)
            ? collisionContext.victoryPlatforms
            : game.platforms;
        for (let i = 0; i < victoryPlatforms.length; i++) {
            const platform = victoryPlatforms[i];
            if (platform.isVictory) {
                const flagBox = platform.getFlagBox();
                if (!isPortalTraveling && (Physics.checkAABB(this, platform) || (flagBox && Physics.checkAABB(this, flagBox)))) {
                    if (game.canTriggerVictory()) {
                        game.triggerVictory();
                    }
                }
            }
        }
    }

    resolveCollision(platforms, axis, game) {
        for (let platform of platforms) {
            if (Physics.checkAABB(this, platform)) {
                const overlapX = Math.min(this.x + this.width, platform.x + platform.width) - Math.max(this.x, platform.x);
                const overlapY = Math.min(this.y + this.height, platform.y + platform.height) - Math.max(this.y, platform.y);

                if (axis === 'x') {
                    // If overlap is only a thin slice near the platform top, treat it as top contact
                    // (not a wall). This prevents upward movers from side-launching the player
                    // when walking/jumping from the platform surface.
                    const playerBottom = this.y + this.height;
                    if (overlapY < 14 && playerBottom <= platform.y + 16) continue;

                    if (this.vx > 0) {
                        this.x = platform.x - this.width;
                        this.vx = 0;
                        this.touchingWall = true;
                        if (this.isRolling) this._blockedOnXAxisThisFrame = true;
                    } else if (this.vx < 0) {
                        this.x = platform.x + platform.width;
                        this.vx = 0;
                        this.touchingWall = true;
                        if (this.isRolling) this._blockedOnXAxisThisFrame = true;
                    } else {
                        // If vx is 0 (e.g. key released mid-collision), push out based on centers
                        if (this.x + this.width / 2 < platform.x + platform.width / 2) {
                            this.x = platform.x - this.width;
                        } else {
                            this.x = platform.x + platform.width;
                        }
                        this.touchingWall = true;
                        if (this.isRolling) this._blockedOnXAxisThisFrame = true;
                    }
                } else if (axis === 'y') {
                    // If we are more "beside" the platform than "above/below" it, skip Y resolution.
                    // This prevents the "violent downward push" when clipping corners from the side.
                    if (overlapX < 16 && overlapY > overlapX) continue;

                    if (this.vy > 0) {
                        this.y = platform.y - this.height;
                        if (platform.isTrampoline) {
                            // Match enemy-stomp bounce 1:1 so trampoline response feels identical.
                            this.y -= 0.01;
                            // Height is proportional to v^2, so sqrt(2)x speed gives ~2x apex height.
                            this.vy = this.jumpForce * Math.SQRT2;
                            this.grounded = false;
                            this.isJumping = true;
                            this.forceFullJump = true;
                            this.airJumps = 1;
                            this.walkOffAirJumpBonusAvailable = false;
                            this.coyoteTimer = 0;
                            this.jumpBufferTimer = 0;
                            this.isSpinning = true;
                            this.spinDirection = this.facingRight ? 1 : -1;
                            this.spinBaseRotation = this.rotation;
                            if (game && game.audio) game.audio.playJump();
                            return;
                        }
                        this.grounded = true;
                    } else if (this.vy < 0) {
                        // Improved head-bonk logic: if we are already mostly above the top edge,
                        // snap to top (land) instead of bonking (teleporting down).
                        if (this.y + this.height * 0.5 < platform.y) {
                            this.y = platform.y - this.height;
                            this.grounded = true;
                        } else if (platform.isMovingPlatform) {
                            this.y = platform.y - this.height;
                            this.grounded = true;
                        } else {
                            this.y = platform.y + platform.height;
                        }
                    } else if (platform.isMovingPlatform) {
                        // vy is 0, but we collided. A moving platform hit us.
                        if (platform.dy > 0) {
                            this.y = platform.y - this.height;
                            this.grounded = true;
                        } else if (platform.dy < 0) {
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

    clearActivePowerUps() {
        this.diamondPowerUpTimer = 0;
        this.firePowerUpTimer = 0;
        this.frostPowerUpTimer = 0;
        this.lightningPowerUpTimer = 0;
        this.lightningOrbShootTimer = 0;
        this.frostBlastTimer = 0;
        this.flightTimer = 0;
        this.isChargingAttack = false;
        this.attackChargeTimer = 0;
    }

    _spawnLightningOrb(game) {
        if (!game || !Array.isArray(game.lightningOrbs) || this.inSafeBubble) return;
        const hasTarget = Array.isArray(game.enemies) && game.enemies.some(enemy => enemy && !enemy.markedForDeletion);
        if (!hasTarget) return;
        const ox = this.x + this.width / 2;
        const oy = this.y + this.height / 2 + 4;
        game.lightningOrbs.push(new LightningOrb(ox, oy));
        if (game.particles) {
            game.particles.emit(ox, oy, 8, '#fff176', [70, 230], [0.12, 0.26], [1.8, 4.6]);
        }
    }

    _triggerFrostBlast(game) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        this.frostBlastX = cx;
        this.frostBlastY = cy;
        this.frostBlastTimer = this.frostBlastDuration;

        if (game && game.audio && typeof game.audio.playFrostBlast === 'function') {
            game.audio.playFrostBlast();
        } else if (game && game.audio) {
            game.audio.playThrow();
        }
        if (game && game.particles) {
            game.particles.emit(cx, cy, 34, '#8fd8ff', [55, 240], [0.22, 0.46], [4, 9]);
            game.particles.emit(cx, cy, 24, '#d9f3ff', [45, 180], [0.18, 0.38], [2, 5]);
            game.particles.emit(cx, cy, 20, 'rgba(180, 225, 255, 0.55)', [30, 150], [0.26, 0.5], [8, 16]);
        }

        const blastSearchRadius = this.frostBlastRadius + 140;
        const enemies = (game && typeof game.queryEnemiesInAABB === 'function')
            ? game.queryEnemiesInAABB(
                cx - blastSearchRadius,
                cy - blastSearchRadius,
                cx + blastSearchRadius,
                cy + blastSearchRadius,
                this._frostBlastEnemyCandidates
            )
            : (game && game.enemies ? game.enemies : []);
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if (!enemy || enemy.markedForDeletion) continue;
            const ex = enemy.x + enemy.width / 2;
            const ey = enemy.y + enemy.height / 2;
            const dist = Math.hypot(ex - cx, ey - cy);
            const hitRadius = this.frostBlastRadius + Math.max(enemy.width, enemy.height) * 0.3;
            if (dist > hitRadius) continue;

            if (enemy.type === 'jellyfish' && typeof enemy.stomp === 'function') {
                enemy.stomp(game);
            } else if (enemy.takeDamage) {
                enemy.takeDamage(this.frostBlastDamage, game);
            } else {
                enemy.markedForDeletion = true;
                this.score += 50;
                if (game && typeof game.registerEnemyDefeat === 'function') game.registerEnemyDefeat(enemy);
            }

            if (game && game.particles) {
                game.particles.emit(ex, ey, 12, '#c8ecff', [40, 170], [0.16, 0.34], [2, 5]);
            }
        }
    }

    _startLetterCelebration(game) {
        this.letterCelebrationTimer = this.letterCelebrationDuration;
        this.letterCelebrationVisibleCount = 0;
        this.letterCelebrationSpawnTimer = 0.02;
    }

    _spawnPortals(game) {
        if (this.portalSpawnCooldown > 0) return;
        const portalWidth = Math.round(this.width * 1.22);
        const portalHeight = Math.max(28, Math.round(this.height * 0.4));
        const centerX = this.x + this.width / 2;

        const entryX = centerX - portalWidth / 2;
        const entryY = this.y - 66;

        const camX = game?.camera ? game.camera.x : 0;
        const camY = game?.camera ? game.camera.y : 0;
        const viewW = game?.camera ? game.camera.effectiveWidth : (game?.viewportWidth || 1280);
        const viewH = game?.camera ? game.camera.effectiveHeight : (game?.viewportHeight || 720);
        const marginRight = 26;
        const topOffset = 74;
        const exitX = camX + viewW - portalWidth - marginRight;
        const minExitY = camY + topOffset;
        const maxExitY = camY + Math.max(topOffset, viewH - 170);
        let exitY = minExitY;

        // Keep the destination portal clear of terrain/rope hazards to avoid clipping on emerge.
        const step = 22;
        let foundClearSpot = false;
        for (let y = minExitY; y <= maxExitY; y += step) {
            const candidate = { x: exitX, y, width: portalWidth, height: portalHeight };
            if (this._isPortalAreaClear(game, candidate)) {
                exitY = y;
                foundClearSpot = true;
                break;
            }
        }
        if (!foundClearSpot) {
            for (let y = minExitY - step; y >= camY + 10; y -= step) {
                const candidate = { x: exitX, y, width: portalWidth, height: portalHeight };
                if (this._isPortalAreaClear(game, candidate)) {
                    exitY = y;
                    foundClearSpot = true;
                    break;
                }
            }
        }

        this.portalEntry = { x: entryX, y: entryY, width: portalWidth, height: portalHeight };
        this.portalExit = { x: exitX, y: exitY, width: portalWidth, height: portalHeight };
        this.portalSpawnCooldown = 0.16;
        this.portalTeleportCooldown = 0.12;

        if (game?.particles) {
            game.particles.emit(centerX, entryY + portalHeight * 0.5, 10, '#d7d2ff', [30, 120], [0.15, 0.32], [2, 5]);
            game.particles.emit(exitX + portalWidth * 0.5, exitY + portalHeight * 0.5, 12, '#b1fff3', [40, 140], [0.15, 0.36], [2, 5]);
        }
    }

    _rectsOverlap(a, b) {
        return !!(
            a && b &&
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    _isPortalAreaClear(game, portalRect) {
        if (!game || !portalRect) return true;
        const checkRect = {
            x: portalRect.x - 8,
            y: portalRect.y - 8,
            width: portalRect.width + 16,
            height: portalRect.height + 16
        };
        const groups = [game.platforms, game.movingPlatforms, game.vines, game.swingingVines, game.safeZones];
        for (let gi = 0; gi < groups.length; gi++) {
            const list = groups[gi];
            if (!Array.isArray(list)) continue;
            for (let i = 0; i < list.length; i++) {
                const obj = list[i];
                if (!obj || typeof obj.x !== 'number' || typeof obj.y !== 'number' || typeof obj.width !== 'number' || typeof obj.height !== 'number') continue;
                if (this._rectsOverlap(checkRect, obj)) return false;
            }
        }
        return true;
    }

    _isPlayerInsidePortal(portal) {
        if (!portal) return false;
        const px = this.x + this.width / 2;
        const py = this.y + this.height / 2;
        const cx = portal.x + portal.width / 2;
        const cy = portal.y + portal.height / 2;
        const rx = portal.width / 2;
        const ry = portal.height / 2;
        if (rx <= 0 || ry <= 0) return false;
        const dx = (px - cx) / rx;
        const dy = (py - cy) / ry;
        return (dx * dx + dy * dy) <= 1;
    }

    _handlePortalTeleport(game) {
        if (!this.portalEntry || !this.portalExit || this.portalTeleportCooldown > 0) return;
        const inEntry = this._isPlayerInsidePortal(this.portalEntry);
        if (!inEntry) return;

        const source = this.portalEntry;
        const target = this.portalExit;
        const sourceCenterX = source.x + source.width / 2;
        const sourceCenterY = source.y + source.height / 2;
        const targetCenterX = target.x + target.width / 2;
        const targetCenterY = target.y + target.height / 2;

        const offsetX = this.x + this.width / 2 - sourceCenterX;
        const offsetY = this.y + this.height / 2 - sourceCenterY;

        this.x = targetCenterX + offsetX - this.width / 2;
        this.y = targetCenterY + offsetY - this.height / 2;

        this.portalTeleportCooldown = 0.2;
        this._updateHitbox();

        const cam = game?.camera;
        if (cam && typeof cam.fastPan === 'function') {
            cam.fastPan();
        }
        if (game?.particles) {
            game.particles.emit(sourceCenterX, sourceCenterY, 10, '#d2ceff', [30, 130], [0.14, 0.3], [2, 4.4]);
            game.particles.emit(targetCenterX, targetCenterY, 16, '#9cf9ff', [45, 180], [0.15, 0.34], [2.2, 5.2]);
        }

        // Hold player for 0.5 seconds before despawning portals
        this.portalHoldTimer = 0.5;
    }

    _drawPortal(ctx, portal, pulseTimer, isExit) {
        if (!portal) return;
        const cx = portal.x + portal.width / 2;
        const cy = portal.y + portal.height / 2;
        const rx = portal.width / 2;
        const ry = portal.height / 2;
        const pulse = 0.5 + Math.sin(pulseTimer * 7.5 + (isExit ? 1.6 : 0)) * 0.5;
        const edgeColor = isExit
            ? `rgba(130, 245, 235, ${0.62 + pulse * 0.22})`
            : `rgba(178, 164, 245, ${0.58 + pulse * 0.2})`;

        ctx.save();
        ctx.fillStyle = 'rgba(5, 5, 8, 0.98)';
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx * 0.84, ry * 0.64, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = isExit ? 'rgba(190, 255, 248, 0.42)' : 'rgba(220, 210, 255, 0.35)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx * 0.72, ry * 0.56, 0, 0, Math.PI * 2);
        ctx.stroke();

        if (isExit) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '24px "Outfit", sans-serif';
            // Subtle bobbing animation below the portal
            const arrowY = cy + ry + 20 + Math.sin(pulseTimer * 10) * 4;
            ctx.fillText('⬇️', cx, arrowY);
        }

        ctx.restore();
    }

    _canStartRoll(game) {
        return (
            !this.isRolling &&
            this.rollCooldownTimer <= 0 &&
            this.rollRecoveryTimer <= 0 &&
            this.grounded &&
            !this.inSafeBubble &&
            !game?.gameOverTriggered &&
            this.stunTimer <= 0 &&
            this.tornadoTrapTimer <= 0 &&
            !this.isClimbing &&
            this.flightTimer <= 0 &&
            !this.carriedShell
        );
    }

    _startRoll(game) {
        const moveDir = this.vx !== 0 ? Math.sign(this.vx) : (this.facingRight ? 1 : -1);
        this.isRolling = true;
        this.rollTimer = this.rollDuration;
        this.rollCooldownTimer = this.rollCooldown;
        this.rollRecoveryTimer = this.rollRecoveryDuration;
        this.rollDirection = moveDir || 1;
        this.rollDistanceTraveled = 0;
        this.rollTrailTimer = 0;
        this.isChargingAttack = false;
        this.attackChargeTimer = 0;
        this.isAttacking = false;
        this.attackTimer = 0;
        this.isJumping = false;
        this.forceFullJump = false;
        this.spinDirection = this.rollDirection;
        if (game?.audio) game.audio.playJump();
        if (game?.particles) {
            game.particles.emitJump(this.x + this.width / 2, this.y + this.height, game.currentTheme?.particleColor || '#ffffff');
        }
    }

    _endRoll() {
        if (!this.isRolling) return;
        this.isRolling = false;
        this.rollTimer = 0;
        this.rollDistanceTraveled = 0;
        this.vx = 0;
    }

    _damageEnemyWithRoll(enemy, game) {
        if (!enemy || enemy.markedForDeletion || this._rollEnemyHitCooldowns.has(enemy)) return;

        const damage = enemy.bossType ? 1 : this.rollDamage;
        if (enemy.takeDamage) {
            const isTurtle = enemy.type === 'patrol' && enemy.emoji === '🐢';
            if (isTurtle && typeof enemy.stomp === 'function') enemy.stomp(game);
            else enemy.takeDamage(damage, game);
        } else {
            enemy.markedForDeletion = true;
            this.score += 50;
            if (game && typeof game.registerEnemyDefeat === 'function') game.registerEnemyDefeat(enemy);
        }

        this._rollEnemyHitCooldowns.set(enemy, enemy.bossType ? 0.28 : 0.18);
        if (game?.particles) {
            game.particles.emitHit(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ffd27a');
        }
        if (game?.audio) {
            game.audio.playHit();
        }
    }

    _breakRollObstacles(game) {
        if (!game || !Array.isArray(game.enemyProjectiles)) return;
        const hitbox = this.getHitbox();
        const projectiles = game.enemyProjectiles;
        for (let i = 0; i < projectiles.length; i++) {
            const projectile = projectiles[i];
            if (!projectile || projectile.markedForDeletion) continue;
            if (!Physics.checkAABB(hitbox, projectile)) continue;

            const typeName = projectile.constructor ? projectile.constructor.name : '';
            const isBreakable = typeName === 'Barrel' ||
                typeName === 'Worm' ||
                typeName === 'Fireball' ||
                typeName === 'Laser' ||
                typeName === 'UfoProjectile' ||
                typeName === 'HedgehogSpike';
            if (!isBreakable) continue;

            projectile.markedForDeletion = true;
            if (game.particles) {
                game.particles.emitHit(projectile.x + projectile.width / 2, projectile.y + projectile.height / 2, '#ffe3a3');
            }
            if (game.audio) {
                game.audio.playHit();
            }
        }
    }

    takeDamage(game) {
        if (this.inSafeBubble) return;
        if (this.flightTimer > 0) return;
        if (this.firePowerUpTimer > 0) return;
        if (this.isRolling) return;
        if (this.hasCatProtector) {
            this.hasCatProtector = false;
            this.invulnerableTimer = 0.6;
            if (game) {
                game.audio.playHit();
                game.particles.emitHit(this.x + this.width / 2, this.y + this.height / 2, '#FFD700');
            }
            return;
        }
        this.health -= 1;
        if (this.health <= 0) {
            this.health = 0;
            this.invulnerableTimer = 0;
            this.damageGlowTimer = 0;
            this.knockbackTimer = 0;
            return;
        }

        this.invulnerableTimer = 1.0;
        this.damageGlowTimer = this.damageGlowDuration;
        this.knockbackTimer = 0.2; // brief loss of control for noticeable knockback

        this.vy = -300;
        this.vx = this.facingRight ? -200 : 200;

        if (game) {
            game.audio.playHurt();
            game.particles.emitExplosion(this.x + this.width / 2, this.y + this.height / 2, 'red');
        }
    }

    beginTornadoTrap(centerX, centerY, trapWidth = 116, trapHeight = 116) {
        this.tornadoTrapDuration = 0.2;
        this.tornadoTrapTimer = this.tornadoTrapDuration;
        this.tornadoTrapAnchorX = centerX;
        this.tornadoTrapAnchorY = centerY;
        this.tornadoTrapWidth = trapWidth;
        this.tornadoTrapHeight = trapHeight;
        this.tornadoTrapPhase = Math.random() * Math.PI * 2;
        this.grounded = false;
        this.isClimbing = false;
        this.currentVine = null;
        this._endRoll();
        this.vx = 0;
        this.vy = 0;
        this.isJumping = false;
        this.forceFullJump = false;
        this.isSpinning = false;
        this.invulnerableTimer = Math.max(this.invulnerableTimer, this.tornadoTrapDuration + 0.18);
    }

    draw(ctx, game) {
        this._drawPortal(ctx, this.portalEntry, this.pulseTimer, false);
        this._drawPortal(ctx, this.portalExit, this.pulseTimer, true);
        if (this.inSafeBubble) return;
        if (this.portalHoldTimer > 0) return;

        ctx.save();
        if (!game?.gameOverTriggered && this.invulnerableTimer > 0) {
            // Non-flashing invulnerability readability.
            ctx.globalAlpha *= 0.62;
        }

        if (!game?.gameOverTriggered && this.damageGlowTimer > 0) {
            const t = Math.max(0, this.damageGlowTimer / this.damageGlowDuration);
            const pulse = 0.75 + Math.sin(this.pulseTimer * 28) * 0.25;
            const strength = (0.9 + pulse * 0.45) * t;
            ctx.shadowBlur = 95 * strength;
            ctx.shadowColor = `rgba(255, 10, 10, ${Math.min(1, 1.2 * strength)})`;
        }

        if (this.health === 1 && (!game || !game.gameOverTriggered)) {
            const pulse = (Math.sin(this.pulseTimer * 12) + 1) / 2;
            const lowHealthBlur = 25 * pulse;
            if (ctx.shadowBlur < lowHealthBlur) {
                ctx.shadowBlur = lowHealthBlur;
                ctx.shadowColor = `rgba(255, 0, 0, ${pulse})`;
            }
        }

        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        if (this.rotation !== 0 && (!game || !game.gameOverTriggered)) {
            ctx.rotate(this.rotation);
        }

        const isMobileViewport = typeof window !== 'undefined' &&
            (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth < 800);
        const isGameRunning = !game || (game.state === 1 && !game.gameOverTriggered);
        const golferNeedsMobileFlip = isMobileViewport && isGameRunning && this.emoji === '🏌️‍♂️';
        const emojiFacesLeft = this._emojiFacesLeft || (isMobileViewport && this.emoji === '🐧') || golferNeedsMobileFlip;
        const shouldMirrorForFacing = (!game || !game.gameOverTriggered) && (emojiFacesLeft ? this.facingRight : !this.facingRight);
        if (shouldMirrorForFacing) {
            ctx.scale(-1, 1);
        }

        if (!game?.gameOverTriggered && this.flightTimer > 0) {
            const speed = Math.hypot(this.vx, this.vy);
            if (speed > 2) {
                const speedRatio = Math.min(1, speed / this.flightSpeed);
                const phase = this.pulseTimer * 10;

                // Convert world movement direction into local draw space (after rotation/flip).
                let dirX = this.vx / speed;
                let dirY = this.vy / speed;
                if (this.rotation !== 0) {
                    const cos = Math.cos(-this.rotation);
                    const sin = Math.sin(-this.rotation);
                    const lx = dirX * cos - dirY * sin;
                    const ly = dirX * sin + dirY * cos;
                    dirX = lx;
                    dirY = ly;
                }
                if (shouldMirrorForFacing) {
                    dirX *= -1;
                }

                const backX = -dirX;
                const backY = -dirY;
                const perpX = -backY;
                const perpY = backX;
                const streakCount = 4;
                const spreadStep = 12;
                const emitterX = backX * this.width * 0.14;
                const emitterY = backY * this.height * 0.14;
                const minLen = 30 + speedRatio * 28;
                const extraLen = 8 + speedRatio * 18;

                ctx.save();
                ctx.lineCap = 'round';

                ctx.strokeStyle = 'rgba(165, 220, 255, 0.42)';
                ctx.lineWidth = 2.6;
                ctx.globalAlpha = 0.24 + speedRatio * 0.26;
                ctx.beginPath();
                for (let i = 0; i < streakCount; i++) {
                    const spread = (i - (streakCount - 1) / 2) * spreadStep;
                    const wobble = Math.sin(phase + i * 1.7) * 1.8;
                    const sideOffset = spread + wobble;
                    const startX = emitterX + perpX * sideOffset;
                    const startY = emitterY + perpY * sideOffset;
                    const len = minLen + (Math.sin(phase * 1.15 + i * 1.25) + 1) * 0.5 * extraLen;
                    const tailX = startX + backX * len + perpX * (Math.sin(phase * 1.35 + i) * 2.5);
                    const tailY = startY + backY * len + perpY * (Math.cos(phase * 1.35 + i) * 2.5);
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(tailX, tailY);
                }
                ctx.stroke();

                ctx.strokeStyle = 'rgba(235, 247, 255, 0.6)';
                ctx.lineWidth = 1.2;
                ctx.globalAlpha = 0.18 + speedRatio * 0.2;
                ctx.beginPath();
                for (let i = 0; i < streakCount; i++) {
                    const spread = (i - (streakCount - 1) / 2) * spreadStep;
                    const sideOffset = spread + Math.sin(phase + i * 1.7) * 1.8;
                    const startX = emitterX + perpX * sideOffset;
                    const startY = emitterY + perpY * sideOffset;
                    const len = (minLen - 8) + (Math.sin(phase * 1.15 + i * 1.25) + 1) * 0.5 * (extraLen - 4);
                    const tailX = startX + backX * len;
                    const tailY = startY + backY * len;
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(tailX, tailY);
                }
                ctx.stroke();
                ctx.restore();
            }
        }
        let cached = this._cachedEmoji;
        let yOffset = 5;
        let locomotionOffsetX = 0;
        let locomotionOffsetY = 0;
        let locomotionTilt = 0;
        let locomotionScaleX = 1;
        let locomotionScaleY = 1;
        let flightRumbleX = 0;
        let flightRumbleY = 0;
        let flightRumbleTilt = 0;

        if (game && game.gameOverTriggered) {
            if (!this._deathTombstoneCache) {
                this._deathTombstoneCache = getEmojiCanvas('🪦', 64);
            }
            cached = this._deathTombstoneCache;
            yOffset = 0;
            ctx.shadowBlur = 0; // Explicitly disable any lingering damage/low-health glows
        } else {
            // Procedural "South Park-like" locomotion for static emoji sprites.
            const absVx = Math.abs(this.vx);
            const speedRatio = Math.max(0, Math.min(1, absVx / Math.max(1, this.speed)));
            const isGroundMotion = this.grounded && !this.isClimbing && this.rotation === 0 && this.flightTimer <= 0;
            if (isGroundMotion && speedRatio > 0.05) {
                const stepRate = 8.8 + speedRatio * 6.2;
                const stepPhase = this.pulseTimer * stepRate;
                const facingDir = this.facingRight ? 1 : -1;

                locomotionOffsetY = Math.abs(Math.sin(stepPhase)) * (2.8 + speedRatio * 4.4);
                locomotionOffsetX = Math.sin(stepPhase * 0.5) * (1.2 + speedRatio * 2.3) * facingDir;
                locomotionTilt = Math.sin(stepPhase) * (0.03 + speedRatio * 0.055);
                const squash = Math.sin(stepPhase + Math.PI / 2) * (0.022 + speedRatio * 0.048);
                locomotionScaleX = 1 + squash;
                locomotionScaleY = 1 - squash * 0.85;
            }
            if (this.isRolling) {
                const rollPhase = this.pulseTimer * 20;
                locomotionOffsetY += Math.abs(Math.sin(rollPhase)) * 4.8;
                locomotionTilt += Math.sin(rollPhase * 0.5) * 0.05;
                locomotionScaleX = 1.18 + Math.sin(rollPhase + Math.PI * 0.15) * 0.1;
                locomotionScaleY = 0.82 - Math.sin(rollPhase + Math.PI * 0.15) * 0.07;
            }

            // Wind rumble while flying to avoid the "perfectly stable hover" look.
            if (this.flightTimer > 0) {
                const flightSpeed = Math.hypot(this.vx, this.vy);
                const flightRatio = Math.max(0.22, Math.min(1, flightSpeed / Math.max(1, this.flightSpeed)));
                const shakePhaseA = this.pulseTimer * 44;
                const shakePhaseB = this.pulseTimer * 61 + 1.4;
                const shakePhaseC = this.pulseTimer * 52 + 0.7;
                flightRumbleX = Math.sin(shakePhaseA) * (0.7 + flightRatio * 1.2) + Math.sin(shakePhaseB) * 0.45;
                flightRumbleY = Math.cos(shakePhaseC) * (0.6 + flightRatio * 0.95);
                flightRumbleTilt = Math.sin(this.pulseTimer * 38 + 0.2) * (0.008 + flightRatio * 0.018);
            }
        }

        ctx.save();
        if (locomotionOffsetX !== 0 || locomotionOffsetY !== 0 || flightRumbleX !== 0 || flightRumbleY !== 0) {
            ctx.translate(locomotionOffsetX + flightRumbleX, locomotionOffsetY + flightRumbleY);
        }
        if (locomotionTilt !== 0 || flightRumbleTilt !== 0) {
            ctx.rotate(locomotionTilt + flightRumbleTilt);
        }
        if (locomotionScaleX !== 1 || locomotionScaleY !== 1) {
            ctx.scale(locomotionScaleX, locomotionScaleY);
        }
        ctx.drawImage(cached.canvas, -cached.width / 2, -cached.height / 2 + yOffset);

        if (game?.gameOverTriggered) {
            const wobble = Math.sin(this.pulseTimer * 9) * 1.6;
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 28px "Outfit", sans-serif';
            ctx.fillStyle = '#f7f7f7';
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.lineWidth = 4;
            ctx.strokeText('×_×', 0, -cached.height / 2 - 20 + wobble);
            ctx.fillText('×_×', 0, -cached.height / 2 - 20 + wobble);
            ctx.restore();
        }

        if (!game?.gameOverTriggered && this.letterPickupPopupTimer > 0 && this.letterPickupPopupLetter) {
            const t = this.letterPickupPopupTimer / this.letterPickupPopupDuration;
            const rise = (1 - t) * 22;
            const alpha = t < 0.25 ? (t / 0.25) : (t > 0.8 ? (1 - t) / 0.2 : 1);
            const pulse = 0.8 + Math.sin(this.pulseTimer * 12) * 0.2;
            const tileSize = 42 + pulse * 2;
            const radius = 8;
            const tileX = -tileSize / 2;
            const tileY = -this.height / 2 - 62 - rise;

            ctx.save();
            if (shouldMirrorForFacing) ctx.scale(-1, 1);
            if (this.rotation !== 0) ctx.rotate(-this.rotation);
            ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

            const glow = ctx.createRadialGradient(0, tileY + tileSize / 2, 6, 0, tileY + tileSize / 2, tileSize * 0.95);
            glow.addColorStop(0, 'rgba(255, 240, 130, 0.45)');
            glow.addColorStop(1, 'rgba(255, 220, 90, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(0, tileY + tileSize / 2, tileSize * 0.95, 0, Math.PI * 2);
            ctx.fill();

            const tileGrad = ctx.createLinearGradient(tileX, tileY, tileX, tileY + tileSize);
            tileGrad.addColorStop(0, '#ffe082');
            tileGrad.addColorStop(1, '#ffb300');
            ctx.fillStyle = tileGrad;
            if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(tileX, tileY, tileSize, tileSize, radius);
                ctx.fill();
            } else {
                ctx.fillRect(tileX, tileY, tileSize, tileSize);
            }
            ctx.strokeStyle = '#8a5200';
            ctx.lineWidth = 3;
            if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(tileX, tileY, tileSize, tileSize, radius);
                ctx.stroke();
            } else {
                ctx.strokeRect(tileX, tileY, tileSize, tileSize);
            }

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 28px "Outfit", sans-serif';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 5;
            ctx.strokeStyle = '#3a2300';
            ctx.strokeText(this.letterPickupPopupLetter, 0, tileY + tileSize / 2 + 1);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(this.letterPickupPopupLetter, 0, tileY + tileSize / 2 + 1);
            ctx.restore();
        }
        ctx.restore();

        if (!game?.gameOverTriggered && this.health === 1) {
            if (!this._lowHealthWarningEmoji) {
                this._lowHealthWarningEmoji = getEmojiCanvas('⚠️', 34);
            }
            const warning = this._lowHealthWarningEmoji;
            const bob = Math.sin(this.pulseTimer * 7.5) * 3;
            const pulse = 0.9 + (Math.sin(this.pulseTimer * 12) + 1) * 0.09;

            ctx.save();
            if (shouldMirrorForFacing) ctx.scale(-1, 1);
            if (this.rotation !== 0) ctx.rotate(-this.rotation);
            ctx.globalAlpha = 0.86 + (Math.sin(this.pulseTimer * 15) + 1) * 0.07;
            ctx.translate(0, -this.height / 2 - 72 + bob);
            ctx.scale(pulse, pulse);
            ctx.drawImage(warning.canvas, -warning.width / 2, -warning.height / 2);
            ctx.restore();
        }

        if (this.stunTimer > 0 && (!game || !game.gameOverTriggered)) {
            if (!this._stunEmoji) {
                this._stunEmoji = getEmojiCanvas('😵‍💫', 40);
            }
            ctx.save();
            if (shouldMirrorForFacing) ctx.scale(-1, 1);
            if (this.rotation !== 0) ctx.rotate(-this.rotation);
            const shakeX = (Math.random() - 0.5) * 8;
            const shakeY = (Math.random() - 0.5) * 8;
            ctx.drawImage(this._stunEmoji.canvas, -this._stunEmoji.width / 2 + shakeX, -this.height / 2 - 65 + shakeY);
            ctx.restore();
        }

        if (this.firePowerUpTimer > 0) {
            if (!this._fireEmoji) {
                this._fireEmoji = getEmojiCanvas(String.fromCodePoint(0x1F525), 30);
            }
            let numFireballs = 3;
            if (this.firePowerUpTimer <= 1.0) {
                numFireballs = 1;
            } else if (this.firePowerUpTimer <= 2.0) {
                numFireballs = 2;
            }
            const radius = 50;
            // Un-flip if we flipped for player facing direction so fireballs spin normally
            if (shouldMirrorForFacing) {
                ctx.scale(-1, 1);
            }
            if (this.rotation !== 0) {
                ctx.rotate(-this.rotation); // un-rotate player rotation
            }
            // Fiery aura (visual only)
            const pulse = 0.72 + Math.sin(this.pulseTimer * 10) * 0.28;
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 140, 40, 0.42)';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(0, 5, radius + 8 + pulse * 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255, 220, 120, 0.28)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 5, radius - 4 + pulse * 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            for (let i = 0; i < numFireballs; i++) {
                const angle = this.firePowerUpRotation + (i * Math.PI * 2 / numFireballs);
                const ox = Math.cos(angle) * radius - this._fireEmoji.width / 2;
                const oy = Math.sin(angle) * radius - this._fireEmoji.height / 2 + 5;
                ctx.drawImage(this._fireEmoji.canvas, ox, oy);
            }
        }
        ctx.restore();

        if (!game?.gameOverTriggered && this.frostBlastTimer > 0) {
            const t = Math.max(0, Math.min(1, this.frostBlastTimer / this.frostBlastDuration));
            const growth = 1 - t;
            const radius = this.frostBlastRadius * (0.65 + growth * 0.35);
            const alpha = 0.45 * t;
            const cx = this.frostBlastX;
            const cy = this.frostBlastY;

            ctx.save();
            const grad = ctx.createRadialGradient(cx, cy, radius * 0.15, cx, cy, radius);
            grad.addColorStop(0, `rgba(230, 248, 255, ${alpha})`);
            grad.addColorStop(0.55, `rgba(150, 215, 255, ${alpha * 0.68})`);
            grad.addColorStop(1, 'rgba(120, 190, 255, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = `rgba(190, 236, 255, ${alpha * 0.82})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(cx, cy, radius * 0.88, 0, Math.PI * 2);
            ctx.stroke();

            if (!this._frostBlastEmoji) this._frostBlastEmoji = getEmojiCanvas('\u2744\uFE0F', 22);
            const flakes = 10;
            for (let i = 0; i < flakes; i++) {
                const a = this.pulseTimer * 7 + (i / flakes) * Math.PI * 2;
                const fr = radius * (0.2 + (i % 4) * 0.16);
                const fx = cx + Math.cos(a) * fr - this._frostBlastEmoji.width / 2;
                const fy = cy + Math.sin(a * 1.1) * fr - this._frostBlastEmoji.height / 2;
                ctx.globalAlpha = alpha * (0.6 + (i % 3) * 0.12);
                ctx.drawImage(this._frostBlastEmoji.canvas, fx, fy);
            }
            ctx.restore();
        }

        if (!game?.gameOverTriggered) {
            const activeBars = [];
            if (this.diamondPowerUpTimer > 0) {
                activeBars.push({
                    ratio: Math.max(0, Math.min(1, this.diamondPowerUpTimer / this.diamondPowerUpDuration)),
                    color: '#ffffff'
                });
            }
            if (this.firePowerUpTimer > 0) {
                activeBars.push({
                    ratio: Math.max(0, Math.min(1, this.firePowerUpTimer / this.firePowerUpDuration)),
                    color: '#ff9800'
                });
            }
            if (this.frostPowerUpTimer > 0) {
                activeBars.push({
                    ratio: Math.max(0, Math.min(1, this.frostPowerUpTimer / this.frostPowerUpDuration)),
                    color: '#7dd3fc'
                });
            }
            if (this.lightningPowerUpTimer > 0) {
                activeBars.push({
                    ratio: Math.max(0, Math.min(1, this.lightningPowerUpTimer / this.lightningPowerUpDuration)),
                    color: '#fde047'
                });
            }
            if (this.flightTimer > 0) {
                activeBars.push({
                    ratio: Math.max(0, Math.min(1, this.flightTimer / this.flightPowerUpDuration)),
                    color: '#22c55e'
                });
            }

            const barW = 92;
            const barH = 10;
            const barX = this.x + this.width / 2 - barW / 2;
            for (let i = 0; i < activeBars.length; i++) {
                const barY = this.y - 44 - i * 16;
                const ratio = activeBars[i].ratio;
                const fillW = Math.max(0, Math.round(barW * ratio));
                const isDanger = ratio <= 0.25;
                const dangerPulse = isDanger ? 0.65 + (Math.sin(this.pulseTimer * 16) + 1) * 0.175 : 1;

                ctx.save();
                ctx.globalAlpha = 0.92;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
                ctx.fillRect(barX - 3, barY - 3, barW + 6, barH + 6);
                ctx.strokeStyle = isDanger ? `rgba(255, 120, 120, ${dangerPulse})` : 'rgba(255, 255, 255, 0.7)';
                ctx.lineWidth = 2;
                ctx.strokeRect(barX - 1, barY - 1, barW + 2, barH + 2);

                ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
                ctx.fillRect(barX, barY, barW, barH);
                ctx.fillStyle = isDanger ? `rgba(255, 120, 120, ${dangerPulse})` : activeBars[i].color;
                ctx.fillRect(barX, barY, fillW, barH);
                ctx.restore();
            }
        }

        if (this.hasCatProtector && (!game || !game.gameOverTriggered)) {
            if (!this._catProtectorEmoji) {
                this._catProtectorEmoji = getEmojiCanvas('🐱', 34);
            }
            const offsetX = this.facingRight ? -62 : 62;
            const bobY = Math.sin(this.catProtectorBob * 6) * 5;
            const catX = this.x + this.width / 2 + offsetX - this._catProtectorEmoji.width / 2;
            const catY = this.y + this.height / 2 - 8 + bobY - this._catProtectorEmoji.height / 2;
            ctx.drawImage(this._catProtectorEmoji.canvas, catX, catY);
        }

        if (!game?.gameOverTriggered && this.isChargingAttack && this.attackChargeTimer > this.chargeIndicatorDelay) {
            const chargeRatio = Math.max(0, Math.min(1, this.attackChargeTimer / this.maxAttackChargeTime));
            const dir = this.facingRight ? 1 : -1;
            const scale = 1 + chargeRatio * 2; // matches throw sizeMultiplier: 1 -> 3

            ctx.save();
            if (!this._chargeRockEmoji) {
                this._chargeRockEmoji = getEmojiCanvas('\u{1FAA8}', 24);
            }
            const preview = this._chargeRockEmoji;
            // Anchor to gameplay rock size (not emoji canvas size, which includes padding).
            const rockRadius = 10 * scale; // projectile radius for sizeMultiplier 1..3
            const handForward = this.width / 2 + rockRadius * 0.72 + 10;
            const handX = this.x + this.width / 2 + dir * handForward;
            const handY = this.y + this.height * 0.56;

            // Small rock that grows to the exact full-charge projectile size.
            ctx.translate(handX, handY);
            ctx.rotate((this.pulseTimer * (0.45 + chargeRatio * 0.35)) * dir);
            ctx.scale(scale, scale);
            ctx.globalAlpha = 0.8 + chargeRatio * 0.2;
            ctx.drawImage(preview.canvas, -preview.width / 2, -preview.height / 2);
            ctx.restore();

            const barW = 70;
            const barH = 8;
            const barX = this.x + this.width / 2 - barW / 2;
            const barY = this.y - 16;
            ctx.save();
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

        if (!game?.gameOverTriggered && this.letterCelebrationTimer > 0 && this.letterCelebrationVisibleCount > 0) {
            const letters = ['E', 'M', 'O', 'J', 'I'];
            const visible = Math.min(this.letterCelebrationVisibleCount, letters.length);
            const showCheck = this.letterCelebrationVisibleCount > letters.length;
            const fadeOut = this.letterCelebrationTimer < 0.4 ? (this.letterCelebrationTimer / 0.4) : 1;
            const centerX = this.x + this.width / 2;
            const baseY = this.y - 136;
            const spacing = 48;
            const tileSize = 42;
            const radius = 10;

            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, fadeOut));
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            for (let i = 0; i < visible; i++) {
                const x = centerX + (i - (letters.length - 1) / 2) * spacing;
                const y = baseY - Math.sin(this.pulseTimer * 8 + i * 0.6) * 2;
                const tileX = x - tileSize / 2;
                const tileY = y - tileSize / 2;
                const mark = letters[i];

                const tileGrad = ctx.createLinearGradient(tileX, tileY, tileX, tileY + tileSize);
                tileGrad.addColorStop(0, '#ffe082');
                tileGrad.addColorStop(1, '#ffb300');
                ctx.fillStyle = tileGrad;
                if (ctx.roundRect) {
                    ctx.beginPath();
                    ctx.roundRect(tileX, tileY, tileSize, tileSize, radius);
                    ctx.fill();
                } else {
                    ctx.fillRect(tileX, tileY, tileSize, tileSize);
                }

                ctx.strokeStyle = '#8a5200';
                ctx.lineWidth = 2;
                if (ctx.roundRect) {
                    ctx.beginPath();
                    ctx.roundRect(tileX, tileY, tileSize, tileSize, radius);
                    ctx.stroke();
                } else {
                    ctx.strokeRect(tileX, tileY, tileSize, tileSize);
                }

                ctx.font = 'bold 32px "Outfit", sans-serif';
                ctx.lineJoin = 'round';
                ctx.lineWidth = 5;
                ctx.strokeStyle = '#3a2300';
                ctx.strokeText(mark, x, y + 0.5);
                ctx.fillStyle = '#ffffff';
                ctx.fillText(mark, x, y + 0.5);
            }

            if (showCheck) {
                if (!this._letterCheckEmoji) this._letterCheckEmoji = getEmojiCanvas('✅', 36);
                const cached = this._letterCheckEmoji;
                const checkY = baseY - tileSize - 20 - Math.sin(this.pulseTimer * 8 + 4.2) * 2;
                ctx.drawImage(cached.canvas, centerX - cached.width / 2, checkY - cached.height / 2);
            }
            ctx.restore();
        }

        if (!game?.gameOverTriggered && this.completionPopupTimer > 0) {
            const t = this.completionPopupTimer / this.completionPopupDuration;
            const fade = t < 0.25 ? (t / 0.25) : (t > 0.82 ? (1 - t) / 0.18 : 1);
            const pulse = 1 + Math.sin(this.pulseTimer * 10) * 0.025;
            const text = 'Level 100% ✅';
            const centerX = this.x + this.width / 2;
            const celebrationActive = this.letterCelebrationTimer > 0 && this.letterCelebrationVisibleCount > 0;
            const popupBaseY = celebrationActive ? (this.y - 258) : (this.y - 184);
            const y = popupBaseY - (1 - t) * 10;

            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, fade));
            ctx.translate(centerX, y);
            ctx.scale(pulse, pulse);

            ctx.font = 'bold 28px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const textW = ctx.measureText(text).width;
            const padX = 18;
            const padY = 12;
            const boxW = textW + padX * 2;
            const boxH = 44 + padY * 2;
            const boxX = -boxW / 2;
            const boxY = -boxH / 2;
            const radius = 14;

            const tileGrad = ctx.createLinearGradient(0, boxY, 0, boxY + boxH);
            tileGrad.addColorStop(0, '#ffe082');
            tileGrad.addColorStop(1, '#ffb300');
            ctx.fillStyle = tileGrad;
            if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(boxX, boxY, boxW, boxH, radius);
                ctx.fill();
            } else {
                ctx.fillRect(boxX, boxY, boxW, boxH);
            }
            ctx.strokeStyle = '#8a5200';
            ctx.lineWidth = 3;
            if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(boxX, boxY, boxW, boxH, radius);
                ctx.stroke();
            } else {
                ctx.strokeRect(boxX, boxY, boxW, boxH);
            }

            ctx.lineJoin = 'round';
            ctx.lineWidth = 5;
            ctx.strokeStyle = '#3a2300';
            ctx.strokeText(text, 0, 1);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(text, 0, 1);
            ctx.restore();
        }

        ctx.globalAlpha = 1.0;
    }

    _kickCarriedShell(game) {
        const shell = this.carriedShell;
        if (!shell) return;
        this.carriedShell = null;
        this.shellThrowLockoutTimer = 1.0; // 1-second total lockout of rock attacks after throw.
        this.shellGrabLockoutTimer = 0.4; // brief grace period before shell can be grabbed again

        let dir = this.facingRight ? 1 : -1;
        if (game && game.player === this) {
            const playerCenterX = this.x + this.width / 2;
            const shellCenterX = shell.x + shell.width / 2;
            dir = playerCenterX <= shellCenterX ? 1 : -1;
        }

        if (typeof shell.kickShell === 'function') {
            shell.kickShell(dir, game);
        } else {
            shell.vx = dir * 620;
            shell.vy = 0;
            shell.platform = null;
            shell.state = 'SHELL_SLIDE';
        }
    }
}







