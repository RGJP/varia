import { Platform } from './Platform.js';
import { MovingPlatform } from './MovingPlatform.js';
import { Enemy } from '../entities/Enemy.js';
import { Collectible } from '../entities/Collectible.js';
import { Vine } from '../entities/Vine.js';
import { SwingingVine } from '../entities/SwingingVine.js';
import { getRandomTheme } from './ThemeManager.js';

export function loadLevel() {
    const theme = getRandomTheme();
    const platforms = [];
    const movingPlatforms = [];

    // Minimum distance between moving platform centers to prevent stacking
    const MIN_MP_DISTANCE = 250;
    const MIN_STATIC_DISTANCE = 200; // Keep moving platforms well above static ones
    const tooCloseToExisting = (x, y, w, h) => {
        const cx = x + w / 2;
        const cy = y + h / 2;
        for (let i = 0; i < movingPlatforms.length; i++) {
            const mp = movingPlatforms[i];
            const mx = mp.x + mp.width / 2;
            const my = mp.y + mp.height / 2;
            const dx = cx - mx;
            const dy = cy - my;
            if (Math.sqrt(dx * dx + dy * dy) < MIN_MP_DISTANCE) return true;
        }
        // Also check distance from static platforms so movers aren't redundant
        for (let i = 0; i < platforms.length; i++) {
            const p = platforms[i];
            // Check if the moving platform overlaps or is very close vertically
            const horizOverlap = x + w > p.x - 20 && x < p.x + p.width + 20;
            const vertClose = Math.abs(y - p.y) < MIN_STATIC_DISTANCE && horizOverlap;
            // Check if it's sitting right on top of a platform
            const onTop = y + h > p.y - 10 && y + h < p.y + MIN_STATIC_DISTANCE && horizOverlap;
            if (vertClose || onTop) return true;
        }
        return false;
    };

    const isVineClipping = (anchorX, anchorY, ropeLen, otherRects = []) => {
        // Use max possible swing angle (40 degrees) for safety check
        const maxAngleRad = (40 * Math.PI) / 180;
        const reach = Math.sin(maxAngleRad) * ropeLen;
        const vineWidth = 24;
        const padding = 20;

        const vMinX = anchorX - reach - vineWidth / 2 - padding;
        const vMaxX = anchorX + reach + vineWidth / 2 + padding;
        const vPivotY = anchorY + 30; // pivot point where rope starts
        const vMaxY = vPivotY + ropeLen + padding;

        const checkOverlap = (rect) => {
            const rMinX = rect.x;
            const rMaxX = rect.x + rect.width;
            const rMinY = rect.y;
            const rMaxY = rect.y + (rect.height || 30);
            return vMaxX > rMinX && vMinX < rMaxX && vMaxY > rMinY && vPivotY < rMaxY;
        };

        // Static platforms
        for (const p of platforms) {
            if (checkOverlap(p)) return true;
        }
        // Upcoming platforms in the current segment
        for (const r of otherRects) {
            if (checkOverlap(r)) return true;
        }
        // Moving platforms (check their entire range of motion)
        for (const mp of movingPlatforms) {
            const mRangeX = mp.axis === 'x' ? Math.abs(mp.range) : 0;
            const mRangeY = mp.axis === 'y' ? Math.abs(mp.range) : 0;
            const mRect = {
                x: mp.x + (mp.range < 0 ? mp.range : 0),
                y: mp.y + (mp.range < 0 ? mp.range : 0),
                width: mp.width + mRangeX,
                height: mp.height + mRangeY
            };
            if (checkOverlap(mRect)) return true;
        }
        // Other swinging vines (proximity + potential overlap)
        for (const sv of swingingVines) {
            // Anchor proximity check - keep them spread out
            if (Math.abs(anchorX - sv.anchorX) < 350) return true;

            const svReach = Math.sin(maxAngleRad) * sv.ropeLength;
            const svMinX = sv.anchorX - svReach - vineWidth / 2 - padding;
            const svMaxX = sv.anchorX + svReach + vineWidth / 2 + padding;
            const svPivotY = sv.anchorY + 30;
            const svMaxY = svPivotY + sv.ropeLength + padding;
            if (vMaxX > svMinX && vMinX < svMaxX && vMaxY > svPivotY && vPivotY < svMaxY) return true;
        }
        // Static vines
        for (const v of vines) {
            if (checkOverlap(v)) return true;
        }

        return false;
    };

    const enemies = [];
    const bossSpawns = [];
    const collectibles = [];
    const vines = [];
    const swingingVines = [];
    const potentialCoinLocations = [];

    // Starting platform
    const startWidth = 300 + Math.random() * 700;
    const startY = 400 + Math.random() * 200;
    const startHeight = 50 + Math.random() * 150;
    platforms.push(new Platform(-100, startY, startWidth + 100, startHeight, false, theme));

    // Potential coins on the starting platform
    const numStartPoints = Math.floor(startWidth / 150);
    for (let i = 0; i < numStartPoints; i++) {
        potentialCoinLocations.push({ x: 100 + i * 150, y: startY - (40 + Math.random() * 80) });
    }

    let currentX = startWidth;

    // Generate up to 10000 X
    while (currentX < 10000) {
        // Different generation modes for diverse platforming
        const segmentTypes = ['SKY_ISLANDS', 'SOLID_GROUND', 'STAIRS_UP', 'STAIRS_DOWN', 'TWO_TIER', 'PILLARS'];
        const segmentType = segmentTypes[Math.floor(Math.random() * segmentTypes.length)];
        const segmentLength = 1000 + Math.random() * 2000;
        const segmentEndX = Math.min(10000, currentX + segmentLength);

        let currentY = 500; // Base Y mainly for stair continuity

        while (currentX < segmentEndX) {
            let platWidth, platY, gap, height;
            let floatingPlatforms = [];

            switch (segmentType) {
                case 'SOLID_GROUND':
                    platWidth = 300 + Math.random() * 700;
                    gap = 60 + Math.random() * 100; // max 160
                    platY = 500 + (Math.random() * 40 - 20); // slight variation
                    height = 250; // deep ground
                    break;

                case 'SKY_ISLANDS':
                    platWidth = 150 + Math.random() * 300;
                    gap = 90 + Math.random() * 110; // max 200
                    platY = 250 + Math.random() * 300; // 250 to 550
                    height = 60 + Math.random() * 40;

                    if (Math.random() < 0.6) {
                        floatingPlatforms.push({
                            x: currentX + gap + platWidth / 2 - 50 + (Math.random() * 100 - 50),
                            y: platY - 150 - Math.random() * 60,
                            width: 100 + Math.random() * 80,
                            height: 30
                        });
                    }
                    break;

                case 'STAIRS_UP':
                    platWidth = 120 + Math.random() * 150;
                    gap = 60 + Math.random() * 80;
                    currentY -= 60 + Math.random() * 70;
                    if (currentY < 150) currentY = 150 + Math.random() * 100;
                    platY = currentY;
                    height = 50 + Math.random() * 100;
                    break;

                case 'STAIRS_DOWN':
                    platWidth = 120 + Math.random() * 150;
                    gap = 60 + Math.random() * 80;
                    currentY += 60 + Math.random() * 70;
                    if (currentY > 600) currentY = 500 - Math.random() * 100;
                    platY = currentY;
                    height = 50 + Math.random() * 100;
                    break;

                case 'TWO_TIER':
                    platWidth = 400 + Math.random() * 500;
                    gap = 80 + Math.random() * 120; // max 200
                    platY = 550 + Math.random() * 50;
                    height = 200;

                    let upperX = currentX + gap + 50 + (Math.random() * 100);
                    while (upperX < currentX + gap + platWidth - 150) {
                        const upWidth = 150 + Math.random() * 200;
                        floatingPlatforms.push({
                            x: upperX,
                            y: platY - 200 - Math.random() * 80,
                            width: upWidth,
                            height: 40
                        });
                        upperX += upWidth + 60 + Math.random() * 100;
                    }
                    break;

                case 'PILLARS':
                    platWidth = 60 + Math.random() * 80;
                    gap = 100 + Math.random() * 100; // max 200
                    platY = 300 + Math.random() * 250;
                    height = 600; // extend way down
                    break;
            }

            // Chance to add a vine in the gap before the platform
            let gapVineSpawned = false;
            // Higher gap requirement and reduced probability for peppered distribution
            if (gap > 100 && Math.random() < 0.20) {
                const vineX = currentX + gap / 2 - 12;
                const topY = platY - 150 - Math.random() * 200;
                const vineHeight = 250 + Math.random() * 150;
                vines.push(new Vine(vineX, topY, vineHeight));
                gapVineSpawned = true;
            }

            // Chance to add a swinging vine in the sky
            // Higher priority if we haven't met the minimum requirement of 2
            const svProb = (swingingVines.length < 2) ? 0.65 : 0.30;
            if (gap > 120 && Math.random() < svProb) {
                const svAnchorX = currentX + gap / 2 + (Math.random() * 60 - 30);
                const svAnchorY = -40 + Math.random() * 60;
                const svRopeLen = 350 + Math.random() * 100;

                // Platforms to be added in this cycle
                const upcoming = [
                    { x: currentX + gap, y: platY, width: platWidth, height: height },
                    ...floatingPlatforms
                ];

                if (!isVineClipping(svAnchorX, svAnchorY, svRopeLen, upcoming)) {
                    swingingVines.push(new SwingingVine(svAnchorX, svAnchorY, svRopeLen));
                }
            }

            // Chance to add a horizontal moving platform bridging the gap
            if (gap > 100 && Math.random() < 0.5) {
                const mpWidth = 100 + Math.random() * 60;
                const mpY = platY - 150 - Math.random() * 100;
                const mpX = currentX + 20;
                const mpRange = gap - mpWidth - 10;
                if (mpRange > 40 && !tooCloseToExisting(mpX, mpY, mpWidth, 30)) {
                    const mpSpeed = 60 + Math.random() * 60;
                    movingPlatforms.push(new MovingPlatform(mpX, mpY, mpWidth, 30, 'x', mpRange, mpSpeed, theme));
                }
            }

            currentX += gap;

            const platform = new Platform(currentX, platY, platWidth, height, false, theme);
            platforms.push(platform);

            // Enemies on main platform depending on width
            if (platWidth > 100 && Math.random() < 0.65) {
                const numEnemies = Math.floor(Math.random() * Math.max(2, Math.floor(platWidth / 200))) + 1;
                for (let i = 0; i < numEnemies; i++) {
                    const enemyX = currentX + (platWidth / (numEnemies + 1)) * (i + 1);
                    enemies.push(new Enemy(enemyX, platY - 40, platform));
                }
            }

            // Extra moving platforms above main platforms (~35% chance)
            if (platWidth > 150 && Math.random() < 0.35) {
                const mpWidth = 100 + Math.random() * 80;
                const mpX = currentX + Math.random() * (platWidth - mpWidth);
                const mpY = platY - 200 - Math.random() * 150;
                if (!tooCloseToExisting(mpX, mpY, mpWidth, 30)) {
                    const axis = Math.random() < 0.6 ? 'x' : 'y';
                    const range = axis === 'x' ? (220 + Math.random() * 320) : (150 + Math.random() * 220);
                    const speed = 50 + Math.random() * 80;
                    movingPlatforms.push(new MovingPlatform(mpX, mpY, mpWidth, 30, axis, range, speed, theme));
                }
            }

            // Coin locations for main platform
            const numCoinPoints = Math.floor(platWidth / 100) + 1;
            for (let i = 0; i < numCoinPoints; i++) {
                const coinX = currentX + (platWidth / (numCoinPoints + 1)) * (i + 1);
                potentialCoinLocations.push({ x: coinX, y: platY - (40 + Math.random() * 80) });
            }

            // Generate floating platforms above if any
            for (let fp of floatingPlatforms) {
                // ~50% chance to turn a floating platform into a moving one
                if (Math.random() < 0.5 && !tooCloseToExisting(fp.x, fp.y, fp.width, fp.height)) {
                    // Decide horizontal or vertical
                    const axis = Math.random() < 0.5 ? 'x' : 'y';
                    const range = axis === 'x' ? (240 + Math.random() * 320) : (170 + Math.random() * 230);
                    const speed = 50 + Math.random() * 70;
                    movingPlatforms.push(new MovingPlatform(fp.x, fp.y, fp.width, fp.height, axis, range, speed, theme));
                    potentialCoinLocations.push({ x: fp.x + fp.width / 2, y: fp.y - (40 + Math.random() * 80) });
                    continue; // Skip normal floating platform creation (no enemies on moving ones)
                }

                const floatPlatform = new Platform(fp.x, fp.y, fp.width, fp.height, false, theme);
                platforms.push(floatPlatform);

                if (Math.random() < 0.15) { // Reduced from 0.3 for better balance
                    // Hang a vine from this floating platform
                    const vineX = fp.x + fp.width / 2 - 12;
                    const topY = fp.y + fp.height;
                    const vineHeight = 150 + Math.random() * 200;
                    vines.push(new Vine(vineX, topY, vineHeight));
                }

                if (fp.width > 100 && Math.random() < 0.5) {
                    const numEnemies = Math.floor(Math.random() * 2) + 1;
                    for (let j = 0; j < numEnemies; j++) {
                        enemies.push(new Enemy(fp.x + (fp.width / (numEnemies + 1)) * (j + 1), fp.y - 40, floatPlatform));
                    }
                }

                potentialCoinLocations.push({ x: fp.x + fp.width / 2, y: fp.y - (40 + Math.random() * 80) });
                if (fp.width > 200) {
                    potentialCoinLocations.push({ x: fp.x + fp.width * 0.25, y: fp.y - (40 + Math.random() * 80) });
                    potentialCoinLocations.push({ x: fp.x + fp.width * 0.75, y: fp.y - (40 + Math.random() * 80) });
                }
            }

            currentX += platWidth;
        }
    }

    // ── Boss encounter ──
    // A dedicated, larger arena platform inserted before the victory flag
    // We increase the gap and the arena size to make it feel more focused.
    const arenaW = 1200;
    const arenaY = 550; // Sit slightly lower for more headroom
    const arenaX = currentX + 400; // Large gap from the last regular platform
    const arenaPlatform = new Platform(arenaX, arenaY, arenaW, 100, false, theme);
    platforms.push(arenaPlatform);

    // Queue boss spawn centered on the arena.
    // Boss is instantiated later when the player gets near the arena.
    const bossX = arenaX + arenaW / 2 - 80; // 80 = half boss size
    bossSpawns.push({ x: bossX, y: arenaY, platform: arenaPlatform });

    // Update currentX to the end of the arena so victory platform follows correctly
    currentX = arenaX + arenaW;

    // Victory platform at the end
    const victoryPlatform = new Platform(currentX + 300, 500, 300, 100, true, theme);
    platforms.push(victoryPlatform);

    // Coins hovering over the victory platform to replace the gap trail
    for (let i = 0; i < 4; i++) {
        potentialCoinLocations.push({
            x: victoryPlatform.x + 50 + (i * 60),
            y: victoryPlatform.y - (40 + Math.random() * 80)
        });
    }

    // --- COIN POPULATION LOGIC ---
    // Target count between 20 and 60 as requested
    const targetCoinCount = Math.floor(Math.random() * (60 - 20 + 1)) + 20;

    // Filter out any coin locations that are past the victory platform
    // to ensure they are always reachable before finishing the level.
    const safeCoinLocations = potentialCoinLocations.filter(loc => loc.x <= victoryPlatform.x + victoryPlatform.width - 50);

    if (safeCoinLocations.length > 0) {
        // Sort by X to ensure we can spread them out across the level progress
        safeCoinLocations.sort((a, b) => a.x - b.x);

        const occupiedIndices = new Set();

        const spawnSpecial = (type, count) => {
            if (safeCoinLocations.length > occupiedIndices.size + count) {
                const step = safeCoinLocations.length / count;
                for (let i = 0; i < count; i++) {
                    const minIdx = Math.floor(i * step);
                    const maxIdx = Math.floor((i + 1) * step) - 1;
                    let idx = Math.floor(Math.random() * (maxIdx - minIdx + 1)) + minIdx;
                    let attempts = 0;
                    while (occupiedIndices.has(idx) && attempts < 10) {
                        idx = Math.floor(Math.random() * (maxIdx - minIdx + 1)) + minIdx;
                        attempts++;
                    }
                    if (!occupiedIndices.has(idx)) {
                        const loc = safeCoinLocations[idx];
                        collectibles.push(new Collectible(loc.x, loc.y, type));
                        occupiedIndices.add(idx);
                    }
                }
            }
        };

        const numHealthPickups = Math.floor(Math.random() * 3) + 3; // 3 to 5
        spawnSpecial('health', numHealthPickups);

        // Spawn 1-2 powerups of each type
        spawnSpecial('diamond_powerup', Math.floor(Math.random() * 2) + 1);
        spawnSpecial('fire_powerup', Math.floor(Math.random() * 2) + 1);
        spawnSpecial('wing_powerup', Math.floor(Math.random() * 2) + 1);

        const numBombPickups = Math.floor(Math.random() * 3) + 2; // 2 to 4
        spawnSpecial('bomb', numBombPickups);

        // Spawn fairy full_health powerup between 60% and 90% of the level
        const fairyCandidates = safeCoinLocations.map((loc, index) => ({ loc, index }))
            .filter(item => item.loc.x > victoryPlatform.x * 0.6 && item.loc.x < victoryPlatform.x * 0.9);

        if (fairyCandidates.length > 0) {
            const randomPick = fairyCandidates[Math.floor(Math.random() * fairyCandidates.length)];
            let fairyIdx = randomPick.index;
            let attempts = 0;
            while (occupiedIndices.has(fairyIdx) && attempts < 10) {
                const anotherPick = fairyCandidates[Math.floor(Math.random() * fairyCandidates.length)];
                fairyIdx = anotherPick.index;
                attempts++;
            }
            if (!occupiedIndices.has(fairyIdx)) {
                const loc = safeCoinLocations[fairyIdx];
                collectibles.push(new Collectible(loc.x, loc.y, 'full_health'));
                occupiedIndices.add(fairyIdx);
            }
        }

        const count = Math.min(targetCoinCount, safeCoinLocations.length);
        const step = safeCoinLocations.length / count;

        for (let i = 0; i < count; i++) {
            const minIdx = Math.floor(i * step);
            const maxIdx = Math.floor((i + 1) * step) - 1;
            const idx = Math.floor(Math.random() * (maxIdx - minIdx + 1)) + minIdx;

            if (!occupiedIndices.has(idx)) {
                const loc = safeCoinLocations[idx];
                collectibles.push(new Collectible(loc.x, loc.y, 'coin'));
            }
        }
    }

    // Make sure vines do not intersect platforms
    vines.forEach(vine => {
        platforms.forEach(platform => {
            // Check horizontal overlap
            if (vine.x + vine.width > platform.x && vine.x < platform.x + platform.width) {
                if (vine.y <= platform.y && vine.y + vine.height > platform.y) {
                    vine.height = platform.y - vine.y - 2;
                }
            }
        });
    });

    // Remove any vines that ended up with zero or negative height
    const validVines = vines.filter(v => v.height > 10);

    return { platforms, movingPlatforms, enemies, bossSpawns, collectibles, vines: validVines, swingingVines, theme };
}
