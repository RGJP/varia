export class Camera {
    constructor(viewportWidth, viewportHeight) {
        this.x = 0;
        this.y = 0;
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;

        // Adaptive zoom: Desktop (0.90) for detail, Mobile (0.63) for wider visibility
        const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth < 800;
        this.isMobile = isMobile;
        this.zoom = isMobile ? 0.63 : 0.90;

        // Mobile zoom toggle: tight / default / wide
        this.mobileZoomLevels = [
            { zoom: 0.63, label: '🎦' },   // Default
            { zoom: 0.70, label: '🎦' },   // Tight
            { zoom: 0.50, label: '🎦' },   // Wide
        ];
        this.mobileZoomIndex = 0;
        this.mobileZoomOverride = false;

        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
    }

    // Cycle through mobile zoom levels and return the new label
    cycleZoom() {
        this.mobileZoomIndex = (this.mobileZoomIndex + 1) % this.mobileZoomLevels.length;
        const level = this.mobileZoomLevels[this.mobileZoomIndex];
        this.zoom = level.zoom;
        this.mobileZoomOverride = true;
        return level.label;
    }

    // Effective viewport size in world coordinates (accounts for zoom)
    get effectiveWidth() {
        return this.viewportWidth / this.zoom;
    }

    get effectiveHeight() {
        return this.viewportHeight / this.zoom;
    }

    resize(viewportWidth, viewportHeight) {
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;

        // Dynamic zoom adjustment on resize (only if user hasn't chosen a custom zoom)
        if (!this.mobileZoomOverride) {
            const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth < 800;
            this.zoom = isMobile ? 0.63 : 0.90;
        }
    }

    shake(duration, intensity) {
        // Disabled for motion sickness reduction
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
    }

    update(player, dt) {
        // Center camera on player using effective (zoomed) viewport
        let targetX = player.x + player.width / 2 - this.effectiveWidth / 2;
        let targetY = player.y + player.height / 2 - this.effectiveHeight / 2 - 100;

        // Smooth follow
        this.x += (targetX - this.x) * 5 * dt;
        this.y += (targetY - this.y) * 5 * dt;

        // Clamp to left edge of the level
        if (this.x < 0) this.x = 0;

        // Camera Shake (Disabled)
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
        this.shakeTimer = 0;
    }
}
