import { Platform } from './Platform.js';
import { Enemy } from '../entities/Enemy.js';
import { Collectible } from '../entities/Collectible.js';
import { Vine } from '../entities/Vine.js';
import { getRandomTheme } from './ThemeManager.js';

export function loadLevel() {
    const theme = getRandomTheme();
    const platforms = [];
    const enemies = [];
    const collectibles = [];
    const vines = [];
    const potentialCoinLocations = [];

    // Starting platform
    const startWidth = 300 + Math.random() * 700;
    const startY = 400 + Math.random() * 200;
    const startHeight = 50 + Math.random() * 150;
    platforms.push(new Platform(-100, startY, startWidth + 100, startHeight, false, theme));

    // Potential coins on the starting platform
    const numStartPoints = Math.floor(startWidth / 150);
    for (let i = 0; i < numStartPoints; i++) {
        potentialCoinLocations.push({ x: 100 + i * 150, y: startY - 80 });
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
            if (gap > 60 && Math.random() < 0.35) {
                const vineX = currentX + gap / 2 - 12;
                const topY = platY - 150 - Math.random() * 200;
                const vineHeight = 250 + Math.random() * 150;
                vines.push(new Vine(vineX, topY, vineHeight));
            }

            currentX += gap;

            const platform = new Platform(currentX, platY, platWidth, height, false, theme);
            platforms.push(platform);

            // Enemies on main platform depending on width
            if (platWidth > 100 && Math.random() < 0.85) {
                const numEnemies = Math.floor(Math.random() * Math.max(2, Math.floor(platWidth / 150))) + 1;
                for (let i = 0; i < numEnemies; i++) {
                    const enemyX = currentX + (platWidth / (numEnemies + 1)) * (i + 1);
                    enemies.push(new Enemy(enemyX, platY - 40, platform));
                }
            }

            // Coin locations for main platform
            const numCoinPoints = Math.floor(platWidth / 100) + 1;
            for (let i = 0; i < numCoinPoints; i++) {
                const coinX = currentX + (platWidth / (numCoinPoints + 1)) * (i + 1);
                potentialCoinLocations.push({ x: coinX, y: platY - 80 });
                if (Math.random() < 0.4) {
                    potentialCoinLocations.push({ x: coinX, y: platY - 140 }); // occasional higher arc
                }
            }

            // Generate floating platforms above if any
            for (let fp of floatingPlatforms) {
                const floatPlatform = new Platform(fp.x, fp.y, fp.width, fp.height, false, theme);
                platforms.push(floatPlatform);

                if (Math.random() < 0.3) {
                    // Hang a vine from this floating platform
                    const vineX = fp.x + fp.width / 2 - 12;
                    const topY = fp.y + fp.height;
                    const vineHeight = 150 + Math.random() * 200;
                    vines.push(new Vine(vineX, topY, vineHeight));
                }

                if (fp.width > 100 && Math.random() < 0.75) {
                    const numEnemies = Math.floor(Math.random() * 2) + 1;
                    for (let j = 0; j < numEnemies; j++) {
                        enemies.push(new Enemy(fp.x + (fp.width / (numEnemies + 1)) * (j + 1), fp.y - 40, floatPlatform));
                    }
                }

                potentialCoinLocations.push({ x: fp.x + fp.width / 2, y: fp.y - 80 });
                if (fp.width > 200) {
                    potentialCoinLocations.push({ x: fp.x + fp.width * 0.25, y: fp.y - 80 });
                    potentialCoinLocations.push({ x: fp.x + fp.width * 0.75, y: fp.y - 80 });
                }
            }

            currentX += platWidth;
        }
    }

    // Victory platform at the end
    const victoryPlatform = new Platform(currentX + 200, 500, 300, 100, true, theme);
    platforms.push(victoryPlatform);

    // Potential victory trail of coins leading up to the final platform
    for (let i = 0; i < 8; i++) {
        potentialCoinLocations.push({
            x: currentX + 30 + (i * 20),
            y: 420 - (Math.sin(i / 1.5) * 60)
        });
    }

    // --- COIN POPULATION LOGIC ---
    // Target count between 20 and 60 as requested
    const targetCoinCount = Math.floor(Math.random() * (60 - 20 + 1)) + 20;

    // Filter out any coin locations that are past the victory platform
    // to ensure they are always reachable before finishing the level.
    const safeCoinLocations = potentialCoinLocations.filter(loc => loc.x <= victoryPlatform.x);

    if (safeCoinLocations.length > 0) {
        // Sort by X to ensure we can spread them out across the level progress
        safeCoinLocations.sort((a, b) => a.x - b.x);

        const count = Math.min(targetCoinCount, safeCoinLocations.length);
        const step = safeCoinLocations.length / count;

        for (let i = 0; i < count; i++) {
            // Pick a point within each "segment" of the available locations
            // to ensure they are spread out but still have some local randomness
            const minIdx = Math.floor(i * step);
            const maxIdx = Math.floor((i + 1) * step) - 1;
            const idx = Math.floor(Math.random() * (maxIdx - minIdx + 1)) + minIdx;

            const loc = safeCoinLocations[idx];
            collectibles.push(new Collectible(loc.x, loc.y));
        }
    }

    return { platforms, enemies, collectibles, vines, theme };
}
