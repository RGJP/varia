import { Entity } from './Entity.js';
import { Physics } from '../Physics.js';
import { getEmojiCanvas } from '../EmojiCache.js';
import { ExplosionParticle } from './ExplosionParticle.js';

export function triggerBombExplosionAt(game, centerX, centerY, ignoredEnemy = null) {
    if (!game) return;
    const explosionRadius = 120;
    const explosionRadiusSq = explosionRadius * explosionRadius;

    // Spawn one central explosion particle
    game.rocks.push(new ExplosionParticle(centerX - 20, centerY - 20));

    // Spawn 3 more around it for variety
    for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 + Math.random();
        const dist = 30 + Math.random() * 30; // 30-60 pixels away
        const spawnX = centerX + Math.cos(angle) * dist - 20;
        const spawnY = centerY + Math.sin(angle) * dist - 20;
        game.rocks.push(new ExplosionParticle(spawnX, spawnY));
    }

    if (game.audio && typeof game.audio.playExplosion === 'function') {
        game.audio.playExplosion();
    }

    // Area of Effect (AOE): Damage enemies within the radius
    const candidates = (typeof game.queryEnemiesInAABB === 'function')
        ? game.queryEnemiesInAABB(
            centerX - explosionRadius,
            centerY - explosionRadius,
            centerX + explosionRadius,
            centerY + explosionRadius,
            game._enemyExplosionQuery || (game._enemyExplosionQuery = [])
        )
        : game.enemies;
    for (let i = 0; i < candidates.length; i++) {
        const enemy = candidates[i];
        if (!enemy || enemy === ignoredEnemy || enemy.markedForDeletion) continue;
        const enemyCenterX = enemy.x + enemy.width / 2;
        const enemyCenterY = enemy.y + enemy.height / 2;
        const dx = enemyCenterX - centerX;
        const dy = enemyCenterY - centerY;
        const distSq = dx * dx + dy * dy;

        if (distSq <= explosionRadiusSq) {
            if (enemy.takeDamage) {
                enemy.takeDamage(enemy.health || 1, game); // Insta-kill or take normal damage
            } else {
                enemy.markedForDeletion = true;
                if (game.player) game.player.score += 50;
                if (game.audio) game.audio.playHit();
                if (game.particles) game.particles.emitHit(enemyCenterX, enemyCenterY);
                if (typeof game.registerEnemyDefeat === 'function') game.registerEnemyDefeat(enemy);
            }
        }
    }
}

export class Bomb extends Entity {
    constructor(x, y) {
        super(x, y, 24, 24);
        this.vy = 1600; // Much faster drop
        this.vx = 0;
        this.rotation = 0;
        this._enemyCandidates = [];
        this._platformCandidates = [];
        this._cachedEmoji = getEmojiCanvas('💣', 28);
    }

    update(dt, game) {
        this.y += this.vy * dt;
        this.rotation += 5 * dt;

        let exploded = false;

        // Check if Bomb hits a nearby enemy
        const enemyCandidates = (game && typeof game.queryEnemiesInAABB === 'function')
            ? game.queryEnemiesInAABB(this.x, this.y, this.x + this.width, this.y + this.height, this._enemyCandidates)
            : game.enemies;
        for (let i = 0; i < enemyCandidates.length; i++) {
            const enemy = enemyCandidates[i];
            if (!enemy.markedForDeletion && !this.markedForDeletion && Physics.checkAABB(this, enemy)) {
                exploded = true;
                break;
            }
        }

        // Check if Bomb hits platforms (mostly ground)
        if (!exploded && !this.markedForDeletion) {
            const platforms = (game && typeof game.queryVisiblePlatformsInAABB === 'function')
                ? game.queryVisiblePlatformsInAABB(this.x, this.y, this.x + this.width, this.y + this.height, this._platformCandidates)
                : game._visiblePlatforms;
            for (let i = 0; i < platforms.length; i++) {
                const platform = platforms[i];
                if (Physics.checkAABB(this, platform)) {
                    exploded = true;
                    break;
                }
            }
        }

        // Delete if it goes way offscreen
        if (this.y - game.player.y > 1000) {
            this.markedForDeletion = true;
        }

        if (exploded && !this.markedForDeletion) {
            this.explode(game);
        }
    }

    explode(game) {
        this.markedForDeletion = true;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        triggerBombExplosionAt(game, centerX, centerY);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        const cached = this._cachedEmoji;
        ctx.drawImage(cached.canvas, -cached.width / 2, -cached.height / 2);

        ctx.restore();
    }
}
