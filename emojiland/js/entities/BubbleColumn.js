import { Entity } from './Entity.js';
import { Physics } from '../Physics.js';
import { Bomb } from './Bomb.js';
import { getEmojiCanvas } from '../EmojiCache.js';

export class BubbleColumn extends Entity {
    constructor(x, y, width = 88, height = 340, options = {}) {
        super(x, y, width, height);
        this.updraftSpeed = options.updraftSpeed || 340; // Target upward float velocity
        this.updraftForce = options.updraftForce || 2400; // Acceleration countering gravity
        this.time = Math.random() * 10;
        this.bubbles = [];
        this.poppingBubbles = [];
        this._cachedEmojiBubble = getEmojiCanvas('🫧', 26);
        this._cachedEmojiWisp = getEmojiCanvas('💨', 22);

        // Pre-populate rising bubbles across the column height
        const count = 14;
        for (let i = 0; i < count; i++) {
            this.bubbles.push(this._createBubble(Math.random()));
        }
    }

    _createBubble(progress = 0) {
        return {
            relX: 0.15 + Math.random() * 0.7, // Percentage across column width
            y: this.y + this.height - progress * (this.height - 20),
            radius: 5 + Math.random() * 7,
            speed: 110 + Math.random() * 90,
            wobbleSpeed: 3 + Math.random() * 3,
            wobbleAmp: 5 + Math.random() * 8,
            phase: Math.random() * Math.PI * 2,
            alpha: 0.4 + Math.random() * 0.45,
            isEmoji: Math.random() < 0.28
        };
    }

    update(dt, game) {
        this.time += dt;

        // Update rising bubbles
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const b = this.bubbles[i];
            b.y -= b.speed * dt;
            if (b.y <= this.y + 16) {
                // Spawn pop ring
                if (this.poppingBubbles.length < 8) {
                    const popX = this.x + b.relX * this.width;
                    this.poppingBubbles.push({
                        x: popX,
                        y: b.y,
                        radius: b.radius,
                        maxRadius: b.radius * 2.2,
                        alpha: b.alpha
                    });
                }
                // Recycle to bottom
                this.bubbles[i] = this._createBubble(0);
            }
        }

        // Update popping bubbles
        for (let i = this.poppingBubbles.length - 1; i >= 0; i--) {
            const p = this.poppingBubbles[i];
            p.radius += 36 * dt;
            p.alpha -= 3.5 * dt;
            if (p.alpha <= 0 || p.radius >= p.maxRadius) {
                this.poppingBubbles.splice(i, 1);
            }
        }

        if (!game) return;

        // 1. Player interaction: gentle buoyant float
        const player = game.player;
        if (player && !player.inSafeBubble && !player.isClimbing && (player.flightTimer || 0) <= 0) {
            const playerBox = typeof player.getHitbox === 'function' ? player.getHitbox() : player;
            if (Physics.checkAABB(this, playerBox)) {
                player.grounded = false;

                // Buoyancy: smoothly brake falling, then carry upward
                if (player.vy > 0) {
                    player.vy = Math.max(-this.updraftSpeed, player.vy - this.updraftForce * dt);
                } else if (player.vy > -this.updraftSpeed) {
                    player.vy = Math.max(-this.updraftSpeed, player.vy - 1600 * dt);
                }

                // Smooth cresting near top of column so player doesn't over-launch
                if (player.y < this.y + 35 && player.vy < -70) {
                    player.vy = -70;
                }

                // Restore jump ability while inside the air stream
                player.airJumps = 1;
                player.coyoteTimer = 0.22;

                // Emit rising bubble particles from feet
                if (Math.random() < 0.22 && game.particles) {
                    const pX = player.x + player.width / 2 + (Math.random() * 24 - 12);
                    const pY = player.y + player.height - 6;
                    game.particles.emit(pX, pY, 1, '#a5f3fc', [20, 60], [0.18, 0.35], [2, 4]);
                }
            }
        }

        // 2. Projectiles interaction: carry rocks and bombs across gaps
        if (Array.isArray(game.rocks)) {
            for (let i = 0; i < game.rocks.length; i++) {
                const rock = game.rocks[i];
                if (!rock || rock.markedForDeletion) continue;
                if (Physics.checkAABB(this, rock)) {
                    if (rock instanceof Bomb) {
                        // Gently float bombs upward
                        rock.vy = Math.max(-140, rock.vy - 3600 * dt);
                    } else {
                        // Carry rocks across gaps with buoyant lift
                        rock.vy = Math.max(-220, (rock.vy || 0) - 2200 * dt);
                    }
                    if (Math.random() < 0.28 && game.particles) {
                        game.particles.emit(rock.x + rock.width / 2, rock.y + rock.height / 2, 1, '#67e8f9', [20, 50], [0.1, 0.2], [1.5, 3]);
                    }
                }
            }
        }

        // 3. Enemy projectiles in the stream
        if (Array.isArray(game.enemyProjectiles)) {
            for (let i = 0; i < game.enemyProjectiles.length; i++) {
                const ep = game.enemyProjectiles[i];
                if (!ep || ep.markedForDeletion) continue;
                if (Physics.checkAABB(this, ep)) {
                    if (ep.vy !== undefined) {
                        ep.vy = Math.max(-200, ep.vy - 1600 * dt);
                    }
                }
            }
        }
    }

    draw(ctx) {
        ctx.save();

        const x = this.x;
        const y = this.y;
        const w = this.width;
        const h = this.height;

        // 1. Column background airflow gradient
        const grad = ctx.createLinearGradient(0, y + h, 0, y);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
        grad.addColorStop(0.3, 'rgba(125, 211, 252, 0.14)');
        grad.addColorStop(0.7, 'rgba(186, 230, 253, 0.08)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.01)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, w, h, 14);
        } else {
            ctx.rect(x, y, w, h);
        }
        ctx.fill();

        // 2. Animated upward-streaming dashed border rails
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.38)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -this.time * 30; // Upward moving dashes

        // Left rail
        ctx.beginPath();
        ctx.moveTo(x + 2, y + h);
        ctx.lineTo(x + 2, y);
        ctx.stroke();

        // Right rail
        ctx.beginPath();
        ctx.moveTo(x + w - 2, y + h);
        ctx.lineTo(x + w - 2, y);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash

        // 3. Upward flowing air current wisps
        ctx.strokeStyle = 'rgba(224, 242, 254, 0.25)';
        ctx.lineWidth = 1.4;
        const wispCount = 3;
        for (let i = 0; i < wispCount; i++) {
            const wispRelX = 0.25 + i * 0.25;
            const wispSpeed = 160 + i * 30;
            const wispY = y + h - ((this.time * wispSpeed + i * (h / wispCount)) % h);
            const wave = Math.sin(this.time * 4 + i) * 6;
            ctx.beginPath();
            ctx.moveTo(x + wispRelX * w + wave, wispY + 18);
            ctx.quadraticCurveTo(x + wispRelX * w - wave, wispY + 9, x + wispRelX * w + wave * 0.5, wispY);
            ctx.stroke();
        }

        // 4. Rising bubbles
        for (let i = 0; i < this.bubbles.length; i++) {
            const b = this.bubbles[i];
            const wobble = Math.sin(this.time * b.wobbleSpeed + b.phase) * b.wobbleAmp;
            const bx = x + b.relX * w + wobble;
            const by = b.y;

            if (b.isEmoji && this._cachedEmojiBubble) {
                ctx.globalAlpha = b.alpha * 0.9;
                ctx.drawImage(
                    this._cachedEmojiBubble.canvas,
                    bx - this._cachedEmojiBubble.width / 2,
                    by - this._cachedEmojiBubble.height / 2
                );
            } else {
                ctx.globalAlpha = b.alpha;
                // Outer bubble ring
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
                ctx.lineWidth = 1.5;
                ctx.fillStyle = 'rgba(186, 230, 253, 0.35)';
                ctx.beginPath();
                ctx.arc(bx, by, b.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Specular glint
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.beginPath();
                ctx.arc(bx - b.radius * 0.35, by - b.radius * 0.35, b.radius * 0.25, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 5. Popping rings
        for (let i = 0; i < this.poppingBubbles.length; i++) {
            const p = this.poppingBubbles[i];
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.strokeStyle = 'rgba(224, 242, 254, 0.8)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.globalAlpha = 1.0;

        // 6. Base Vent Emitter
        const ventW = w + 16;
        const ventH = 14;
        const ventX = x - 8;
        const ventY = y + h - 8;

        // Metallic / aquatic vent body
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(ventX, ventY, ventW, ventH, 6);
        } else {
            ctx.rect(ventX, ventY, ventW, ventH);
        }
        ctx.fill();
        ctx.stroke();

        // Glowing vent slits
        const slitCount = 4;
        const slitGap = ventW / (slitCount + 1);
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = 'rgba(56, 189, 248, 0.8)';
        ctx.shadowBlur = 6;
        for (let s = 1; s <= slitCount; s++) {
            const slitX = ventX + s * slitGap - 4;
            ctx.fillRect(slitX, ventY + 3, 8, ventH - 6);
        }
        ctx.shadowBlur = 0;

        // 7. Top Crest Indicator: subtle pulsing upward chevrons
        const pulse = 0.5 + Math.sin(this.time * 5) * 0.3;
        ctx.strokeStyle = `rgba(186, 230, 253, ${pulse})`;
        ctx.lineWidth = 2;
        const crestY = y + 14;
        const chevronW = 10;
        ctx.beginPath();
        ctx.moveTo(x + w / 2 - chevronW, crestY + 5);
        ctx.lineTo(x + w / 2, crestY);
        ctx.lineTo(x + w / 2 + chevronW, crestY + 5);
        ctx.stroke();

        ctx.restore();
    }
}
