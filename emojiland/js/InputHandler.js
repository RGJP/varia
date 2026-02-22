export class InputHandler {
    constructor() {
        this.keys = new Set();
        this.justPressed = new Set();

        window.addEventListener('keydown', (e) => {
            if (!this.keys.has(e.code)) {
                this.justPressed.add(e.code);
            }
            this.keys.add(e.code);
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
            this.justPressed.delete(e.code);
        });

        // Add generic touch for basic interactions
        window.addEventListener('touchstart', (e) => {
            if (!e.target.closest('.ui-btn')) {
                if (!this.keys.has('TouchScreen')) {
                    this.justPressed.add('TouchScreen');
                }
                this.keys.add('TouchScreen');
            }
        }, { passive: false });

        window.addEventListener('touchend', () => {
            this.keys.delete('TouchScreen');
            this.justPressed.delete('TouchScreen');
        });

        window.addEventListener('touchcancel', () => {
            this.keys.delete('TouchScreen');
            this.justPressed.delete('TouchScreen');
        });

        this.setupVirtualControls();
    }

    setupVirtualControls() {
        const attachButton = (id, code) => {
            setTimeout(() => {
                const el = document.getElementById(id);
                if (!el) return;

                const press = (e) => {
                    e.preventDefault();
                    if (!this.keys.has(code)) {
                        this.justPressed.add(code);
                    }
                    this.keys.add(code);
                };

                const release = (e) => {
                    e.preventDefault();
                    this.keys.delete(code);
                    this.justPressed.delete(code);
                };

                el.addEventListener('touchstart', press, { passive: false });
                el.addEventListener('touchend', release, { passive: false });
                el.addEventListener('touchcancel', release, { passive: false });
            }, 0);
        };

        attachButton('btn-jump', 'KeyA');
        attachButton('btn-attack', 'KeyD');
        attachButton('btn-bomb', 'KeyS');
        attachButton('btn-pause', 'KeyP');

        setTimeout(() => {
            const joyZone = document.getElementById('joystick-zone');
            const joyKnob = document.getElementById('joystick-knob');
            if (!joyZone || !joyKnob) return;

            let activeTouchId = null;
            const maxDistance = 40;

            const resetJoystick = () => {
                activeTouchId = null;
                joyKnob.style.transform = `translate(-50%, -50%)`;
                this.keys.delete('ArrowLeft');
                this.keys.delete('ArrowRight');
                this.keys.delete('ArrowUp');
                this.keys.delete('ArrowDown');
            };

            const handleDrag = (touch) => {
                const rect = joyZone.getBoundingClientRect();
                const joyCenterX = rect.left + rect.width / 2;
                const joyCenterY = rect.top + rect.height / 2;

                let dx = touch.clientX - joyCenterX;
                let dy = touch.clientY - joyCenterY;

                const distance = Math.sqrt(dx * dx + dy * dy);
                const clampedDistance = Math.min(distance, maxDistance);
                const angle = Math.atan2(dy, dx);

                const knobX = Math.cos(angle) * clampedDistance;
                const knobY = Math.sin(angle) * clampedDistance;

                joyKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

                this.keys.delete('ArrowLeft');
                this.keys.delete('ArrowRight');
                this.keys.delete('ArrowUp');
                this.keys.delete('ArrowDown');

                const thresholdX = 15;
                const thresholdY = 20;

                if (distance > 10) {
                    if (dx < -thresholdX) this.keys.add('ArrowLeft');
                    else if (dx > thresholdX) this.keys.add('ArrowRight');

                    if (dy < -thresholdY) this.keys.add('ArrowUp');
                    else if (dy > thresholdY) this.keys.add('ArrowDown');
                }
            };

            joyZone.addEventListener('touchstart', (e) => {
                e.preventDefault();
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (activeTouchId === null) {
                        activeTouchId = e.changedTouches[i].identifier;
                        handleDrag(e.changedTouches[i]);
                        break;
                    }
                }
            }, { passive: false });

            joyZone.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (activeTouchId === null) return;
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === activeTouchId) {
                        handleDrag(e.changedTouches[i]);
                        break;
                    }
                }
            }, { passive: false });

            const endDrag = (e) => {
                e.preventDefault();
                if (activeTouchId === null) return;
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === activeTouchId) {
                        resetJoystick();
                        break;
                    }
                }
            };

            joyZone.addEventListener('touchend', endDrag, { passive: false });
            joyZone.addEventListener('touchcancel', endDrag, { passive: false });
        }, 0);
    }

    isDown(code) {
        return this.keys.has(code);
    }

    isJustPressed(code) {
        if (this.justPressed.has(code)) {
            this.justPressed.delete(code);
            return true;
        }
        return false;
    }

    update() {
        this.justPressed.clear();
    }
}
