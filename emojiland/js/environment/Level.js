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

    const MOVING_HEIGHT = 30;
    const STATIC_CLEARANCE_X = 36;
    const STATIC_CLEARANCE_Y = 28;
    const MP_TO_MP_CLEARANCE_X = 80;
    const MP_TO_MP_CLEARANCE_Y = 70;
    const MIN_MP_CENTER_DISTANCE = 220;

    const axisOf = (obj) => obj.moveAxis || obj.axis;
    const rangeOf = (obj) => obj.range || 0;
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const rectCenter = (rect) => ({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });

    const getSweptRect = (obj) => {
        const axis = axisOf(obj);
        const range = rangeOf(obj);
        if (axis === 'x') {
            const minX = Math.min(obj.x, obj.x + range);
            return { x: minX, y: obj.y, width: obj.width + Math.abs(range), height: obj.height };
        }
        if (axis === 'y') {
            const minY = Math.min(obj.y, obj.y + range);
            return { x: obj.x, y: minY, width: obj.width, height: obj.height + Math.abs(range) };
        }
        return { x: obj.x, y: obj.y, width: obj.width, height: obj.height };
    };

    const overlapsRect = (a, b, padX = 0, padY = 0) => (
        a.x < b.x + b.width + padX &&
        a.x + a.width > b.x - padX &&
        a.y < b.y + b.height + padY &&
        a.y + a.height > b.y - padY
    );

    const overlapWidth = (a, b) => Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));

    const canPlaceMovingPlatform = (candidate, extraStatic = [], isUseful = null) => {
        const swept = getSweptRect(candidate);
        if (swept.y < 80 || swept.y + swept.height > 880) return false;

        const staticRects = [...platforms, ...extraStatic];
        for (let i = 0; i < staticRects.length; i++) {
            if (overlapsRect(swept, staticRects[i], STATIC_CLEARANCE_X, STATIC_CLEARANCE_Y)) return false;
        }

        const c = rectCenter(swept);
        for (let i = 0; i < movingPlatforms.length; i++) {
            const existing = movingPlatforms[i];
            const existingSwept = getSweptRect(existing);
            if (overlapsRect(swept, existingSwept, MP_TO_MP_CLEARANCE_X, MP_TO_MP_CLEARANCE_Y)) return false;
            const ec = rectCenter(existingSwept);
            const dx = c.x - ec.x;
            const dy = c.y - ec.y;
            if (Math.sqrt(dx * dx + dy * dy) < MIN_MP_CENTER_DISTANCE) return false;
        }

        return isUseful ? isUseful(swept, candidate) : true;
    };

    const trySpawnMovingPlatform = ({ attempts = 8, createCandidate, extraStatic = [], isUseful = null }) => {
        for (let attempt = 0; attempt < attempts; attempt++) {
            const candidate = createCandidate(attempt);
            if (!candidate) continue;
            if (canPlaceMovingPlatform(candidate, extraStatic, isUseful)) {
                movingPlatforms.push(new MovingPlatform(
                    candidate.x,
                    candidate.y,
                    candidate.width,
                    candidate.height,
                    candidate.moveAxis,
                    candidate.range,
                    candidate.speed,
                    theme
                ));
                return true;
            }
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
            const mAxis = axisOf(mp);
            const mRange = rangeOf(mp);
            const mRangeX = mAxis === 'x' ? Math.abs(mRange) : 0;
            const mRangeY = mAxis === 'y' ? Math.abs(mRange) : 0;
            const mRect = {
                x: mp.x + (mAxis === 'x' && mRange < 0 ? mRange : 0),
                y: mp.y + (mAxis === 'y' && mRange < 0 ? mRange : 0),
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

    // Start zone: rotate through distinct opening layouts so the run never opens the same way.
    const addPlatformCoinPoints = (platform, spacing = 140) => {
        const pointCount = Math.max(2, Math.floor(platform.width / spacing));
        for (let i = 0; i < pointCount; i++) {
            const coinX = platform.x + (platform.width / (pointCount + 1)) * (i + 1);
            if (coinX < 60) continue;
            potentialCoinLocations.push({ x: coinX, y: platform.y - (40 + Math.random() * 80) });
        }
    };

    const startStyle = Math.floor(Math.random() * 4);
    const startPlatforms = [];

    if (startStyle === 0) {
        // Wide runway
        const y = 380 + Math.random() * 170;
        const width = 460 + Math.random() * 560;
        const height = 80 + Math.random() * 120;
        startPlatforms.push(new Platform(-120, y, width + 120, height, false, theme));
    } else if (startStyle === 1) {
        // Stepped opener
        const y1 = 450 + Math.random() * 120;
        const w1 = 260 + Math.random() * 300;
        const h1 = 90 + Math.random() * 110;
        startPlatforms.push(new Platform(-120, y1, w1 + 120, h1, false, theme));

        const gap = 35 + Math.random() * 45;
        const y2 = clamp(y1 - (35 + Math.random() * 65), 260, 620);
        const w2 = 280 + Math.random() * 360;
        const h2 = 80 + Math.random() * 120;
        startPlatforms.push(new Platform(w1 + gap, y2, w2, h2, false, theme));
    } else if (startStyle === 2) {
        // Split islands near spawn
        const y1 = 400 + Math.random() * 170;
        const w1 = 280 + Math.random() * 280;
        const h1 = 90 + Math.random() * 120;
        startPlatforms.push(new Platform(-120, y1, w1 + 120, h1, false, theme));

        const gap = 70 + Math.random() * 55;
        const y2 = clamp(y1 + (Math.random() * 80 - 40), 260, 640);
        const w2 = 260 + Math.random() * 360;
        const h2 = 80 + Math.random() * 120;
        startPlatforms.push(new Platform(w1 + gap, y2, w2, h2, false, theme));
    } else {
        // Staggered intro: up then down
        const y1 = 420 + Math.random() * 140;
        const w1 = 300 + Math.random() * 320;
        const h1 = 90 + Math.random() * 120;
        startPlatforms.push(new Platform(-120, y1, w1 + 120, h1, false, theme));

        const gap1 = 35 + Math.random() * 45;
        const y2 = clamp(y1 - (45 + Math.random() * 70), 240, 610);
        const w2 = 200 + Math.random() * 220;
        const h2 = 70 + Math.random() * 110;
        startPlatforms.push(new Platform(w1 + gap1, y2, w2, h2, false, theme));

        const gap2 = 30 + Math.random() * 55;
        const y3 = clamp(y2 + (55 + Math.random() * 80), 260, 670);
        const w3 = 250 + Math.random() * 320;
        const h3 = 80 + Math.random() * 120;
        startPlatforms.push(new Platform(w1 + gap1 + w2 + gap2, y3, w3, h3, false, theme));
    }

    for (let i = 0; i < startPlatforms.length; i++) {
        const p = startPlatforms[i];
        platforms.push(p);
        addPlatformCoinPoints(p, 150);
    }

    // Start micro-variants: lightweight extras so openings feel fresh without breaking readability.
    const startGaps = [];
    for (let i = 0; i < startPlatforms.length - 1; i++) {
        const left = startPlatforms[i];
        const right = startPlatforms[i + 1];
        const gap = right.x - (left.x + left.width);
        if (gap > 0) startGaps.push({ left, right, gap });
    }

    // Occasional bonus floating ledge around the start zone.
    if (Math.random() < 0.48) {
        const base = startPlatforms[Math.floor(Math.random() * startPlatforms.length)];
        const maxWidth = Math.min(260, base.width * 0.65);
        if (maxWidth >= 110) {
            const width = 110 + Math.random() * (maxWidth - 110);
            const x = base.x + Math.max(10, (base.width - width) * (0.15 + Math.random() * 0.7));
            const y = clamp(base.y - (135 + Math.random() * 120), 160, 650);
            const ledgeRect = { x, y, width, height: 34 };
            let blocked = false;
            for (let i = 0; i < platforms.length; i++) {
                if (overlapsRect(ledgeRect, platforms[i], 28, 26)) {
                    blocked = true;
                    break;
                }
            }
            if (!blocked) {
                const ledge = new Platform(ledgeRect.x, ledgeRect.y, ledgeRect.width, ledgeRect.height, false, theme);
                platforms.push(ledge);
                addPlatformCoinPoints(ledge, 120);
                if (Math.random() < 0.22) {
                    const vineX = ledge.x + ledge.width * (0.35 + Math.random() * 0.3) - 12;
                    const vineH = 120 + Math.random() * 170;
                    vines.push(new Vine(vineX, ledge.y + ledge.height, vineH));
                }
            }
        }
    }

    // Occasional decorative/utility gap vine near start.
    if (startGaps.length > 0 && Math.random() < 0.34) {
        let bestGap = startGaps[0];
        for (let i = 1; i < startGaps.length; i++) {
            if (startGaps[i].gap > bestGap.gap) bestGap = startGaps[i];
        }
        if (bestGap.gap > 80) {
            const vineX = bestGap.left.x + bestGap.left.width + bestGap.gap * (0.35 + Math.random() * 0.3) - 12;
            const topY = Math.min(bestGap.left.y, bestGap.right.y) - (190 + Math.random() * 130);
            const vineHeight = 190 + Math.random() * 170;
            vines.push(new Vine(vineX, topY, vineHeight));
        }
    }

    // Rare starter mover (bridge a start gap or shuttle over a start platform).
    if (Math.random() < 0.42) {
        const tryGapMover = startGaps.length > 0 && Math.random() < 0.58;
        if (tryGapMover) {
            const viableGaps = startGaps.filter(g => g.gap > 110);
            if (viableGaps.length > 0) {
                const pick = viableGaps[Math.floor(Math.random() * viableGaps.length)];
                trySpawnMovingPlatform({
                    attempts: 8,
                    extraStatic: [pick.left, pick.right],
                    createCandidate: () => {
                        const width = 95 + Math.random() * 50;
                        const range = pick.gap - width - 18;
                        if (range < 85) return null;
                        const x = pick.left.x + pick.left.width + 8;
                        const y = clamp(Math.min(pick.left.y, pick.right.y) - (95 + Math.random() * 80), 150, 680);
                        return {
                            x,
                            y,
                            width,
                            height: MOVING_HEIGHT,
                            moveAxis: 'x',
                            range,
                            speed: 65 + Math.random() * 45
                        };
                    },
                    isUseful: (swept) => {
                        const gapRect = {
                            x: pick.left.x + pick.left.width + 4,
                            y: swept.y,
                            width: pick.gap - 8,
                            height: swept.height
                        };
                        return overlapWidth(swept, gapRect) >= swept.width * 0.62;
                    }
                });
            }
        } else {
            let widest = startPlatforms[0];
            for (let i = 1; i < startPlatforms.length; i++) {
                if (startPlatforms[i].width > widest.width) widest = startPlatforms[i];
            }
            trySpawnMovingPlatform({
                attempts: 8,
                createCandidate: () => {
                    const maxWidth = Math.min(220, widest.width * 0.6);
                    if (maxWidth < 100) return null;
                    const width = 100 + Math.random() * (maxWidth - 100);
                    const maxRange = Math.min(360, widest.width - width - 16);
                    if (maxRange < 120) return null;
                    const x = widest.x + 8 + Math.random() * Math.max(1, widest.width - width - 16);
                    const y = clamp(widest.y - (120 + Math.random() * 120), 140, 660);
                    return {
                        x,
                        y,
                        width,
                        height: MOVING_HEIGHT,
                        moveAxis: 'x',
                        range: 120 + Math.random() * (maxRange - 120),
                        speed: 55 + Math.random() * 50
                    };
                },
                isUseful: (swept) => {
                    const aligned = overlapWidth(swept, widest) >= swept.width * 0.52;
                    const verticalGap = widest.y - (swept.y + swept.height);
                    return aligned && verticalGap >= 85 && verticalGap <= 280;
                }
            });
        }
    }

    let currentX = Math.max(...startPlatforms.map(p => p.x + p.width));

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

            // Utility mover: bridge larger gaps and travel clearly between both sides.
            if (gap > 120 && Math.random() < 0.65) {
                const previousPlatform = platforms[platforms.length - 1];
                const gapLeft = currentX;
                const nextPlatformRect = { x: currentX + gap, y: platY, width: platWidth, height };
                const maxBridgeWidth = Math.min(180, gap - 70);
                if (maxBridgeWidth >= 100) {
                    trySpawnMovingPlatform({
                        attempts: 10,
                        extraStatic: [nextPlatformRect, ...floatingPlatforms],
                        createCandidate: () => {
                            const width = 100 + Math.random() * (maxBridgeWidth - 100);
                            const range = gap - width - 20;
                            if (range < 90) return null;
                            const x = gapLeft + 20;
                            const yBase = Math.min(previousPlatform.y, platY) - 135;
                            const y = clamp(yBase + (Math.random() * 70 - 35), 130, 670);
                            return {
                                x,
                                y,
                                width,
                                height: MOVING_HEIGHT,
                                moveAxis: 'x',
                                range,
                                speed: 70 + Math.random() * 55
                            };
                        },
                        isUseful: (swept, candidate) => {
                            const gapRect = { x: gapLeft + 12, y: swept.y, width: gap - 24, height: swept.height };
                            const travelCoverage = candidate.range / gap;
                            return overlapWidth(swept, gapRect) >= swept.width * 0.7 && travelCoverage >= 0.45;
                        }
                    });
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

            // Utility mover: overhead shuttle above wide platforms for optional route shortcuts.
            if (platWidth > 170 && Math.random() < 0.42) {
                const supportRect = { x: currentX, y: platY, width: platWidth, height };
                trySpawnMovingPlatform({
                    attempts: 10,
                    createCandidate: () => {
                        const maxWidth = Math.min(230, platWidth * 0.65);
                        if (maxWidth < 100) return null;
                        const width = 100 + Math.random() * (maxWidth - 100);
                        const maxRange = Math.min(480, platWidth - width - 16);
                        if (maxRange < 140) return null;
                        const x = currentX + 15 + Math.random() * Math.max(1, (platWidth - width - 30));
                        const y = platY - (130 + Math.random() * 140);
                        return {
                            x,
                            y,
                            width,
                            height: MOVING_HEIGHT,
                            moveAxis: 'x',
                            range: 140 + Math.random() * (maxRange - 140),
                            speed: 55 + Math.random() * 55
                        };
                    },
                    isUseful: (swept) => {
                        const aligned = overlapWidth(swept, supportRect) >= swept.width * 0.55;
                        const verticalGap = supportRect.y - (swept.y + swept.height);
                        return aligned && verticalGap >= 90 && verticalGap <= 300;
                    }
                });
            }

            // Coin locations for main platform
            const numCoinPoints = Math.floor(platWidth / 100) + 1;
            for (let i = 0; i < numCoinPoints; i++) {
                const coinX = currentX + (platWidth / (numCoinPoints + 1)) * (i + 1);
                potentialCoinLocations.push({ x: coinX, y: platY - (40 + Math.random() * 80) });
            }

            // Generate floating platforms above if any
            for (let fp of floatingPlatforms) {
                // Convert some floating platforms to movers, centered around the original lane.
                if (Math.random() < 0.45) {
                    const anchorCenterX = fp.x + fp.width / 2;
                    const anchorCenterY = fp.y + fp.height / 2;
                    const converted = trySpawnMovingPlatform({
                        attempts: 8,
                        createCandidate: () => {
                            if (Math.random() < 0.7) {
                                const range = 180 + Math.random() * 240;
                                return {
                                    x: fp.x - range / 2,
                                    y: fp.y,
                                    width: fp.width,
                                    height: fp.height,
                                    moveAxis: 'x',
                                    range,
                                    speed: 50 + Math.random() * 60
                                };
                            }
                            const range = 130 + Math.random() * 180;
                            return {
                                x: fp.x,
                                y: fp.y - range / 2,
                                width: fp.width,
                                height: fp.height,
                                moveAxis: 'y',
                                range,
                                speed: 45 + Math.random() * 45
                            };
                        },
                        isUseful: (swept, candidate) => {
                            const center = rectCenter(swept);
                            const centered = Math.abs(center.x - anchorCenterX) < 26 && Math.abs(center.y - anchorCenterY) < 26;
                            const travel = Math.abs(candidate.range);
                            return centered && travel >= 90;
                        }
                    });
                    if (converted) {
                        potentialCoinLocations.push({ x: fp.x + fp.width / 2, y: fp.y - (40 + Math.random() * 80) });
                        continue; // Skip normal floating platform creation (no enemies on moving ones)
                    }
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
