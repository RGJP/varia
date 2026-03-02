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

        this.verticalFocusRatio = 0.50;
        this.overrideTarget = null;
        this.overrideSpeed = 0;
        this.fastTransitionSpeed = 0;
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
        this.viewportWidth = Math.max(1, Math.floor(viewportWidth || 1));
        this.viewportHeight = Math.max(1, Math.floor(viewportHeight || 1));

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

    fastPan() {
        this.fastTransitionSpeed = 25; // High speed for quick transition
    }

    setOverrideTarget(x, y, speed = 2.2) {
        this.overrideTarget = { x, y };
        this.overrideSpeed = Math.max(0.1, speed || 2.2);
    }

    clearOverrideTarget() {
        this.overrideTarget = null;
        this.overrideSpeed = 0;
    }

    update(player, dt) {
        let targetX;
        let targetY;
        let followSpeed = 5;
        if (this.overrideTarget) {
            targetX = this.overrideTarget.x;
            targetY = this.overrideTarget.y;
            followSpeed = this.overrideSpeed;
        } else {
            // Center camera on player using effective (zoomed) viewport
            targetX = player.x + player.width / 2 - this.effectiveWidth / 2;
            targetY = player.y + player.height / 2 - this.effectiveHeight * this.verticalFocusRatio;

            if (this.fastTransitionSpeed > 5) {
                followSpeed = this.fastTransitionSpeed;
                this.fastTransitionSpeed -= 50 * dt; // Decay speed quickly back to normal
            } else {
                this.fastTransitionSpeed = 0;
            }
        }

        // Smooth follow
        this.x += (targetX - this.x) * followSpeed * dt;
        this.y += (targetY - this.y) * followSpeed * dt;

        // Clamp to left edge of the level
        if (this.x < 0) this.x = 0;

        // Camera Shake (Disabled)
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
        this.shakeTimer = 0;
    }
}
