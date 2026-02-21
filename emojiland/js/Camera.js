export class Camera {
    constructor(viewportWidth, viewportHeight) {
        this.x = 0;
        this.y = 0;
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
    }

    resize(viewportWidth, viewportHeight) {
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
    }

    shake(duration, intensity) {
        this.shakeTimer = duration;
        this.shakeIntensity = intensity;
    }

    update(player, dt) {
        // Center camera on player horizontally
        let targetX = player.x + player.width / 2 - this.viewportWidth / 2;
        let targetY = player.y + player.height / 2 - this.viewportHeight / 2 - 100;

        // Smooth follow
        this.x += (targetX - this.x) * 5 * dt;
        this.y += (targetY - this.y) * 5 * dt;

        // Clamp to left edge of the level
        if (this.x < 0) this.x = 0;

        // Camera Shake
        if (this.shakeTimer > 0) {
            this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeTimer -= dt;
        } else {
            this.shakeOffsetX = 0;
            this.shakeOffsetY = 0;
        }
    }
}
