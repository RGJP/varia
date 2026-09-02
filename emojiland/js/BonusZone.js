import { Platform } from './environment/Platform.js';
import { TrampolinePlatform } from './environment/TrampolinePlatform.js';
import { MovingPlatform } from './environment/MovingPlatform.js';
import { SafeBubble } from './entities/SafeBubble.js';
import { Collectible } from './entities/Collectible.js';
import { Enemy } from './entities/Enemy.js';
import { getEmojiCanvas } from './EmojiCache.js';

export const BONUS_ZONE_REWARD = 1000;
export const BONUS_ZONE_DURATION = 18;

const BONUS_COIN_RUSH_DURATION = 16;
const BONUS_SLAYER_DURATION = 18;
const BONUS_BARREL_BLITZ_DURATION = 32;
const BONUS_SKY_BOUNCE_DURATION = 28;

const ARENA_WIDTH = 1500;
const CEILING_Y = 70;
const CEILING_HEIGHT = 70;
const CEILING_BOTTOM = CEILING_Y + CEILING_HEIGHT;
const FLOOR_Y = 660;
const PLAYER_HEIGHT = 72;
const MIN_UNDERPASS_CLEARANCE = PLAYER_HEIGHT + 34;
const MIN_PLATFORM_HEADROOM = PLAYER_HEIGHT + 70;
const MIN_PLAYABLE_PLATFORM_Y = CEILING_BOTTOM + MIN_PLATFORM_HEADROOM;
const BONUS_ENEMY_SIZE = 54;
const MIN_PLAYABLE_ENEMY_Y = 170;
const SLAYER_START_BUFFER_X = 360;
const SLAYER_START_BUFFER_Y = 180;

export function createRandomBonusZone(theme) {
    const types = ['coin_rush', 'slayer', 'barrel_blitz', 'sky_bounce'];
    const type = types[Math.floor(Math.random() * types.length)];
    return createBonusZone(type, theme);
}

export function createBonusZone(type, theme) {
    if (type === 'barrel_blitz') {
        return createBarrelBlitzZone(theme);
    }
    if (type === 'sky_bounce') {
        return createSkyBounceZone(theme);
    }

    const arena = createBonusArena(theme);
    const platforms = arena.platforms;
    const collectibles = [];
    const enemies = [];

    if (type === 'coin_rush') {
        const coinPoints = buildCoinRushRoute(arena);
        for (let i = 0; i < coinPoints.length; i++) {
            collectibles.push(new Collectible(coinPoints[i].x, coinPoints[i].y, 'bonus_coin'));
        }
    } else {
        const enemySpawns = buildSlayerSpawns(arena);
        for (let i = 0; i < enemySpawns.length; i++) {
            enemies.push(createBonusEnemy(enemySpawns[i].x, enemySpawns[i].platform, i, arena));
        }
    }

    const duration = type === 'coin_rush' ? BONUS_COIN_RUSH_DURATION : BONUS_SLAYER_DURATION;

    return {
        type,
        objectiveType: type === 'coin_rush' ? 'collectibles' : 'enemies',
        title: type === 'coin_rush' ? 'Coin Rush' : 'Slayer',
        objectiveLabel: type === 'coin_rush' ? 'Collect all coins' : 'Neutralize all enemies',
        duration,
        timeRemaining: duration,
        platforms,
        movingPlatforms: [],
        enemies,
        collectibles,
        safeZones: [],
        vines: [],
        swingingVines: [],
        rocks: [],
        lightningOrbs: [],
        enemyProjectiles: [],
        startX: arena.startX,
        startY: arena.startY,
        lowestY: 760,
        totalCoins: collectibles.length,
        totalEnemies: enemies.length,
        collectedCoins: 0,
        completed: false,
        returnSnapshot: null
    };
}

function createBonusArena(theme) {
    const variant = Math.floor(Math.random() * 4);
    const floor = makePlatform(0, FLOOR_Y, ARENA_WIDTH, 100, theme, true);
    const leftWall = makePlatform(-90, 110, 100, 650, theme, false);
    const rightWall = makePlatform(ARENA_WIDTH - 10, 110, 100, 650, theme, false);
    const ceiling = makePlatform(0, CEILING_Y, ARENA_WIDTH, CEILING_HEIGHT, theme, false);
    const platforms = [floor, leftWall, rightWall, ceiling];
    const playablePlatforms = [floor];
    const addPlayable = (x, y, width) => {
        const platform = makePlatform(x, y, width, 42, theme, true);
        platforms.push(platform);
        playablePlatforms.push(platform);
        return platform;
    };

    let ledges;
    if (variant === 0) {
        ledges = [
            addPlayable(190, 500, 285),
            addPlayable(1025, 500, 285),
            addPlayable(610, 345, 280)
        ];
    } else if (variant === 1) {
        ledges = [
            addPlayable(160, 510, 260),
            addPlayable(620, 390, 250),
            addPlayable(1090, MIN_PLAYABLE_PLATFORM_Y, 270)
        ];
    } else if (variant === 2) {
        ledges = [
            addPlayable(145, 395, 240),
            addPlayable(625, 515, 270),
            addPlayable(1115, 395, 240),
            addPlayable(610, MIN_PLAYABLE_PLATFORM_Y, 280)
        ];
    } else {
        ledges = [
            addPlayable(165, 510, 245),
            addPlayable(535, 430, 210),
            addPlayable(755, 430, 210),
            addPlayable(1090, 510, 245),
            addPlayable(640, MIN_PLAYABLE_PLATFORM_Y, 260)
        ];
    }

    enforceBonusPlatformClearance(playablePlatforms);

    return {
        variant,
        platforms,
        playablePlatforms,
        ledges,
        floor,
        startX: 96,
        startY: FLOOR_Y - 88
    };
}

function makePlatform(x, y, width, height, theme, bonusPlayableTop) {
    const platform = new Platform(x, y, width, height, false, theme);
    platform.bonusPlayableTop = !!bonusPlayableTop;
    return platform;
}

function enforceBonusPlatformClearance(playablePlatforms) {
    for (let i = 0; i < playablePlatforms.length; i++) {
        const upper = playablePlatforms[i];
        if (!upper || upper.y >= FLOOR_Y) continue;
        if (upper.y < MIN_PLAYABLE_PLATFORM_Y) {
            upper.y = MIN_PLAYABLE_PLATFORM_Y;
        }

        let nearestBelow = null;
        let nearestGap = Infinity;

        for (let j = 0; j < playablePlatforms.length; j++) {
            const lower = playablePlatforms[j];
            if (!lower || lower === upper || lower.y <= upper.y) continue;
            if (!hasHorizontalOverlap(upper, lower, 18)) continue;
            const gap = lower.y - (upper.y + upper.height);
            if (gap >= 0 && gap < nearestGap) {
                nearestGap = gap;
                nearestBelow = lower;
            }
        }

        if (nearestBelow && nearestGap < MIN_UNDERPASS_CLEARANCE) {
            const raisedY = nearestBelow.y - upper.height - MIN_UNDERPASS_CLEARANCE;
            if (raisedY >= MIN_PLAYABLE_PLATFORM_Y) {
                upper.y = raisedY;
            } else {
                nearestBelow.y = upper.y + upper.height + MIN_UNDERPASS_CLEARANCE;
                if (nearestBelow.y + nearestBelow.height > FLOOR_Y - MIN_UNDERPASS_CLEARANCE) {
                    upper.x = findNonOverlappingPlatformX(upper, playablePlatforms);
                }
            }
        }

        if (typeof upper._buildCache === 'function') upper._buildCache();
        if (nearestBelow && typeof nearestBelow._buildCache === 'function') nearestBelow._buildCache();
    }
}

function findNonOverlappingPlatformX(platform, playablePlatforms) {
    const minX = 40;
    const maxX = ARENA_WIDTH - platform.width - 40;
    const candidates = [minX, maxX, 190, 610, 1025, platform.x];
    for (let i = 0; i < candidates.length; i++) {
        const x = clamp(candidates[i], minX, maxX);
        const candidate = { x, y: platform.y, width: platform.width, height: platform.height };
        let blocked = false;
        for (let j = 0; j < playablePlatforms.length; j++) {
            const other = playablePlatforms[j];
            if (!other || other === platform || other.y <= platform.y) continue;
            if (hasHorizontalOverlap(candidate, other, 18)) {
                const gap = other.y - (candidate.y + candidate.height);
                if (gap < MIN_UNDERPASS_CLEARANCE) {
                    blocked = true;
                    break;
                }
            }
        }
        if (!blocked) return x;
    }
    return clamp(platform.x, minX, maxX);
}

function hasHorizontalOverlap(a, b, inset = 0) {
    return (
        a.x + inset < b.x + b.width - inset &&
        a.x + a.width - inset > b.x + inset
    );
}

function buildCoinRushRoute(arena) {
    const points = [];
    addCoinsOverPlatform(points, arena.floor, spreadOffsets(arena.floor.width, 14, 110), 62);

    for (let i = 0; i < arena.ledges.length; i++) {
        const platform = arena.ledges[i];
        const count = Math.max(4, Math.min(6, Math.floor(platform.width / 48)));
        addCoinsOverPlatform(points, platform, spreadOffsets(platform.width, count, 34), 60);
    }

    if (arena.variant === 0) {
        points.push({ x: 150, y: 395 }, { x: 1350, y: 395 }, { x: 750, y: 240 });
    } else if (arena.variant === 1) {
        points.push({ x: 285, y: 400 }, { x: 745, y: 280 }, { x: 1240, y: 165 });
    } else if (arena.variant === 2) {
        points.push({ x: 265, y: 285 }, { x: 760, y: 405 }, { x: 1235, y: 285 });
    } else {
        points.push({ x: 250, y: 400 }, { x: 640, y: 245 }, { x: 860, y: 245 }, { x: 1250, y: 400 });
    }

    while (points.length < 29) {
        const platform = arena.playablePlatforms[points.length % arena.playablePlatforms.length];
        const slot = Math.floor(points.length / arena.playablePlatforms.length);
        const x = platform.x + 44 + ((slot * 67) % Math.max(1, platform.width - 88));
        points.push({ x, y: platform.y - 62 });
    }

    return points;
}

function addCoinsOverPlatform(points, platform, offsets, lift) {
    for (let i = 0; i < offsets.length; i++) {
        const x = typeof offsets[i] === 'number' && offsets[i] > platform.width
            ? offsets[i]
            : platform.x + offsets[i];
        points.push({ x, y: platform.y - lift });
    }
}

function spreadOffsets(width, count, edgePad) {
    const offsets = [];
    if (count <= 1) return [width / 2];
    const usable = Math.max(1, width - edgePad * 2);
    for (let i = 0; i < count; i++) {
        offsets.push(edgePad + usable * (i / (count - 1)));
    }
    return offsets;
}

function buildSlayerSpawns(arena) {
    const spawns = [];
    const floorXsByVariant = [
        [140, 330, 540, 750, 960, 1170, 1360],
        [145, 335, 560, 790, 1015, 1225, 1375],
        [130, 325, 540, 750, 970, 1185, 1370],
        [135, 330, 565, 750, 935, 1170, 1365]
    ];
    const floorXs = floorXsByVariant[arena.variant] || floorXsByVariant[0];
    for (let i = 0; i < floorXs.length; i++) {
        spawns.push({ x: floorXs[i], platform: arena.floor });
    }

    for (let i = 0; i < arena.ledges.length; i++) {
        const platform = arena.ledges[i];
        const leftX = platform.x + Math.min(68, platform.width * 0.32);
        const rightX = platform.x + platform.width - Math.min(68, platform.width * 0.32);
        spawns.push({ x: leftX, platform });
        if (platform.width >= 200) spawns.push({ x: rightX, platform });
    }

    return enforceSlayerStartBuffer(spawns, arena).slice(0, 12);
}

function enforceSlayerStartBuffer(spawns, arena) {
    const adjusted = [];
    for (let i = 0; i < spawns.length; i++) {
        adjusted.push(resolveSlayerSpawnAwayFromStart(spawns[i], arena, adjusted));
    }
    return adjusted;
}

function resolveSlayerSpawnAwayFromStart(spawn, arena, accepted) {
    if (isSpawnFairFromStart(spawn, arena, accepted)) return spawn;

    const candidates = [];
    for (let i = 0; i < arena.playablePlatforms.length; i++) {
        const platform = arena.playablePlatforms[i];
        if (!isPlayableEnemyPlatform(platform)) continue;
        const offsets = spreadOffsets(platform.width, platform === arena.floor ? 8 : 3, 34);
        for (let j = 0; j < offsets.length; j++) {
            candidates.push({ x: platform.x + offsets[j], platform });
        }
    }

    candidates.sort((a, b) => {
        const da = Math.abs((a.x + BONUS_ENEMY_SIZE / 2) - arena.startX);
        const db = Math.abs((b.x + BONUS_ENEMY_SIZE / 2) - arena.startX);
        return db - da;
    });

    for (let i = 0; i < candidates.length; i++) {
        if (isSpawnFairFromStart(candidates[i], arena, accepted)) return candidates[i];
    }

    return { x: arena.floor.x + arena.floor.width - 120, platform: arena.floor };
}

function isSpawnFairFromStart(spawn, arena, accepted = []) {
    if (!spawn || !isPlayableEnemyPlatform(spawn.platform)) return false;
    const enemyCenterX = spawn.x + BONUS_ENEMY_SIZE / 2;
    const enemyCenterY = spawn.platform.y - BONUS_ENEMY_SIZE / 2;
    const playerCenterX = arena.startX + 36;
    const playerCenterY = arena.startY + 36;
    const sameVerticalBand = Math.abs(enemyCenterY - playerCenterY) < SLAYER_START_BUFFER_Y;
    if (sameVerticalBand && Math.abs(enemyCenterX - playerCenterX) < SLAYER_START_BUFFER_X) return false;

    for (let i = 0; i < accepted.length; i++) {
        const other = accepted[i];
        if (!other || other.platform !== spawn.platform) continue;
        if (Math.abs(other.x - spawn.x) < 72) return false;
    }
    return true;
}

function createBonusEnemy(x, platform, index, arena) {
    const playablePlatforms = arena.playablePlatforms;
    const safePlatform = isPlayableEnemyPlatform(platform) ? platform : playablePlatforms[0];
    const safeX = clamp(x, safePlatform.x + 10, safePlatform.x + safePlatform.width - BONUS_ENEMY_SIZE - 10);
    const safeY = Math.max(MIN_PLAYABLE_ENEMY_Y, safePlatform.y - BONUS_ENEMY_SIZE);
    const enemy = new Enemy(safeX, safeY, safePlatform);
    const emojis = ['🐸', '🐿️', '🦗', '🕷️', '🐢'];
    const emoji = emojis[index % emojis.length];

    enemy.type = emoji === '🐢' ? 'jumper' : 'patrol';
    enemy.emoji = emoji;
    enemy.width = BONUS_ENEMY_SIZE;
    enemy.height = BONUS_ENEMY_SIZE;
    enemy.x = safeX;
    enemy.y = safeY;
    enemy.startX = enemy.x;
    enemy.startY = enemy.y;
    enemy.baseSpeed = 96;
    enemy.speed = enemy.baseSpeed;
    enemy.health = 1;
    enemy.maxHealth = 1;
    enemy.vx = index % 2 === 0 ? enemy.speed : -enemy.speed;
    enemy.vy = 0;
    enemy.facingRight = enemy.vx >= 0;
    enemy.state = 'PATROL';
    enemy.platform = safePlatform;
    enemy.countsForCompletionObjective = false;
    enemy.isBonusEnemy = true;
    enemy.bonusPlayablePlatforms = playablePlatforms;
    enemy.turtleFlipped = false;
    enemy.turtleRecovering = false;
    enemy._cachedEmoji = getEmojiCanvas(emoji, enemy.height);
    return enemy;
}

export function keepBonusEnemyInPlayableArea(enemy) {
    if (!enemy || !enemy.isBonusEnemy || !Array.isArray(enemy.bonusPlayablePlatforms)) return;
    if (enemy.y >= MIN_PLAYABLE_ENEMY_Y && isPlayableEnemyPlatform(enemy.platform)) return;

    const platform = findNearestPlayablePlatform(enemy, enemy.bonusPlayablePlatforms);
    enemy.platform = platform;
    enemy.x = clamp(enemy.x, platform.x + 10, platform.x + platform.width - enemy.width - 10);
    enemy.y = platform.y - enemy.height;
    enemy.startX = enemy.x;
    enemy.startY = enemy.y;
    enemy.vy = 0;
}

function findNearestPlayablePlatform(enemy, playablePlatforms) {
    let best = playablePlatforms[0];
    let bestScore = Infinity;
    const cx = enemy.x + enemy.width / 2;
    for (let i = 0; i < playablePlatforms.length; i++) {
        const platform = playablePlatforms[i];
        if (!isPlayableEnemyPlatform(platform)) continue;
        const px = clamp(cx, platform.x, platform.x + platform.width);
        const score = Math.abs(px - cx) + Math.abs(platform.y - FLOOR_Y) * 0.15;
        if (score < bestScore) {
            best = platform;
            bestScore = score;
        }
    }
    return best;
}

function isPlayableEnemyPlatform(platform) {
    return !!(platform && platform.bonusPlayableTop === true && platform.y >= 220);
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// ── 90s VARIATION 1: BARREL BLITZ (Donkey Kong Country inspired 360° Rotator Blast) ──
function createBarrelBlitzZone(theme) {
    // Pure floating barrel stage: Random 5 to 7 barrels hovering high above the pitfall line!
    const platforms = [];

    // Randomize count between 5 and 7 barrels
    const numBarrels = Math.floor(Math.random() * 3) + 5; // 5, 6, or 7 barrels

    const startX = 220;
    const topY = 130;
    const bottomY = 410;
    const delta = 280; // Exact 45° diagonal (Δx = Δy = 280px)

    const safeZones = [];
    for (let i = 0; i < numBarrels; i++) {
        const isBottom = (i % 2 === 0);
        const bx = startX + i * delta;
        const by = isBottom ? bottomY : topY;
        // Start barrel points 45° Up-Right; receiving barrels start pointed straight UP
        const initialAngle = (i === 0) ? -Math.PI / 4 : -Math.PI / 2;
        const barrel = new SafeBubble(bx, by, 100, true, 0.3, initialAngle, true);
        safeZones.push(barrel);
    }

    const collectibles = [];
    const addStraightCoinLine = (x1, y1, x2, y2, count = 6) => {
        for (let i = 1; i <= count; i++) {
            const t = i / (count + 1);
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;
            collectibles.push(new Collectible(x - 15, y - 15, 'bonus_coin'));
        }
    };

    // Straight 45° coin lines linking each pair of consecutive barrels
    for (let i = 0; i < safeZones.length - 1; i++) {
        addStraightCoinLine(
            safeZones[i].centerX, safeZones[i].centerY,
            safeZones[i + 1].centerX, safeZones[i + 1].centerY,
            6
        );
    }

    const duration = Math.round(16 + numBarrels * 2.5);

    return {
        type: 'barrel_blitz',
        objectiveType: 'collectibles',
        title: 'Barrel Blitz',
        objectiveLabel: 'Blast & grab all stars',
        duration,
        timeRemaining: duration,
        platforms,
        movingPlatforms: [],
        enemies: [],
        collectibles,
        safeZones,
        vines: [],
        swingingVines: [],
        rocks: [],
        lightningOrbs: [],
        enemyProjectiles: [],
        spawnInBarrel: true,
        startX: safeZones[0].centerX,
        startY: safeZones[0].centerY,
        lowestY: 670,
        totalCoins: collectibles.length,
        totalEnemies: 0,
        collectedCoins: 0,
        completed: false,
        returnSnapshot: null
    };
}

// ── 90s VARIATION 2: SKY BOUNCE (Sonic / Mario Spring Yard floating open-air trampolines) ──
function createSkyBounceZone(theme) {
    // Pure open-air floating stage: Zero solid floor/walls! Floating trampolines suspended in the sky.
    const tramp0 = new TrampolinePlatform(180, 480, 150, 30, theme);  // Start Trampoline
    const tramp1 = new TrampolinePlatform(490, 360, 140, 30, theme);  // Ascending 1
    const tramp2 = new TrampolinePlatform(820, 240, 150, 30, theme);  // High Center Peak
    const tramp3 = new TrampolinePlatform(1170, 360, 140, 30, theme); // Mid Right
    const tramp4 = new TrampolinePlatform(1490, 240, 150, 30, theme); // High Right Peak
    const tramp5 = new TrampolinePlatform(1810, 400, 140, 30, theme); // Descending Right
    const tramp6 = new TrampolinePlatform(2130, 480, 150, 30, theme); // Far Right Trampoline
    const trampSafety = new TrampolinePlatform(980, 520, 200, 30, theme); // Low Recovery Trampoline

    const platforms = [tramp0, tramp1, tramp2, tramp3, tramp4, tramp5, tramp6, trampSafety];
    const movingPlatforms = [];

    const collectibles = [];
    const addCoin = (x, y) => collectibles.push(new Collectible(x - 15, y - 15, 'bonus_coin'));

    // High vertical bounce trails above each trampoline apex
    // 1. Tramp 0 Vertical Super-Bounce Trail
    addCoin(255, 380);
    addCoin(255, 280);
    addCoin(255, 180);
    addCoin(255, 90);

    // 2. Parabolic Arc Tramp 0 -> Tramp 1
    addCoin(330, 310);
    addCoin(390, 250);
    addCoin(450, 280);

    // 3. Tramp 1 Vertical Apex Trail
    addCoin(560, 260);
    addCoin(560, 170);
    addCoin(560, 80);

    // 4. Parabolic Arc Tramp 1 -> Tramp 2
    addCoin(640, 190);
    addCoin(720, 140);
    addCoin(800, 170);

    // 5. High Sky Diamond Crown above Tramp 2
    addCoin(895, 150);
    addCoin(895, 70);
    addCoin(850, 110);
    addCoin(940, 110);

    // 6. Parabolic Arc Tramp 2 -> Tramp 3
    addCoin(980, 190);
    addCoin(1050, 240);
    addCoin(1120, 290);

    // 7. Tramp 3 Vertical Apex Trail
    addCoin(1240, 260);
    addCoin(1240, 170);
    addCoin(1240, 80);

    // 8. Parabolic Arc Tramp 3 -> Tramp 4
    addCoin(1320, 230);
    addCoin(1390, 160);
    addCoin(1450, 180);

    // 9. High Sky Diamond Crown above Tramp 4
    addCoin(1565, 150);
    addCoin(1565, 70);
    addCoin(1520, 110);
    addCoin(1610, 110);

    // 10. Parabolic Arc Tramp 4 -> Tramp 5 -> Tramp 6
    addCoin(1680, 260);
    addCoin(1740, 310);
    addCoin(1880, 300);
    addCoin(1960, 220);
    addCoin(2040, 310);
    addCoin(2205, 380);
    addCoin(2205, 280);
    addCoin(2205, 180);

    // 11. Low Recovery Trampoline safety coins
    addCoin(1030, 440);
    addCoin(1130, 440);

    return {
        type: 'sky_bounce',
        objectiveType: 'collectibles',
        title: 'Sky Bounce',
        objectiveLabel: 'Bounce & collect all gems',
        duration: 28,
        timeRemaining: 28,
        platforms,
        movingPlatforms,
        enemies: [],
        collectibles,
        safeZones: [],
        vines: [],
        swingingVines: [],
        rocks: [],
        lightningOrbs: [],
        enemyProjectiles: [],
        spawnInBarrel: false,
        startX: tramp0.x + tramp0.width / 2 - 25,
        startY: tramp0.y - 120, // Drops directly onto Trampoline 0 for instant super-bounce!
        lowestY: 660,
        totalCoins: collectibles.length,
        totalEnemies: 0,
        collectedCoins: 0,
        completed: false,
        returnSnapshot: null
    };
}
