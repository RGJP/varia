import { Platform } from './environment/Platform.js';
import { Collectible } from './entities/Collectible.js';
import { Enemy } from './entities/Enemy.js';
import { getEmojiCanvas } from './EmojiCache.js';

export const BONUS_ZONE_REWARD = 1000;
export const BONUS_ZONE_DURATION = 18;

const BONUS_COIN_RUSH_DURATION = 16;
const BONUS_SLAYER_DURATION = 18;
const ARENA_WIDTH = 1500;
const FLOOR_Y = 660;
const PLAYER_HEIGHT = 72;
const MIN_UNDERPASS_CLEARANCE = PLAYER_HEIGHT + 34;
const BONUS_ENEMY_SIZE = 54;
const MIN_PLAYABLE_ENEMY_Y = 170;
const SLAYER_START_BUFFER_X = 360;
const SLAYER_START_BUFFER_Y = 180;

export function createRandomBonusZone(theme) {
    const type = Math.random() < 0.5 ? 'coin_rush' : 'slayer';
    return createBonusZone(type, theme);
}

export function createBonusZone(type, theme) {
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
    const ceiling = makePlatform(0, 70, ARENA_WIDTH, 70, theme, false);
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
            addPlayable(1090, 270, 270)
        ];
    } else if (variant === 2) {
        ledges = [
            addPlayable(145, 395, 240),
            addPlayable(625, 515, 270),
            addPlayable(1115, 395, 240),
            addPlayable(610, 255, 280)
        ];
    } else {
        ledges = [
            addPlayable(165, 510, 245),
            addPlayable(535, 355, 210),
            addPlayable(755, 355, 210),
            addPlayable(1090, 510, 245),
            addPlayable(640, 225, 260)
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
            upper.y = nearestBelow.y - upper.height - MIN_UNDERPASS_CLEARANCE;
            if (upper.y < 190) {
                upper.y = 190;
                upper.x = clamp(upper.x, 40, ARENA_WIDTH - upper.width - 40);
            }
            if (typeof upper._buildCache === 'function') upper._buildCache();
        }
    }
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
