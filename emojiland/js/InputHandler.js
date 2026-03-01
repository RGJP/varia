export class InputHandler {
    constructor() {
        this.keys = new Set();
        this.justPressed = new Set();
        this.justReleased = new Set();
        this.aliasByCode = {
            Space: ['KeyA']
        };
        this.preventDefaultCodes = new Set([
            'ArrowLeft',
            'ArrowRight',
            'ArrowUp',
            'ArrowDown',
            'KeyA',
            'KeyD',
            'KeyS',
            'KeyP',
            'Space'
        ]);

        const pressCode = (code) => {
            if (!this.keys.has(code)) {
                this.justPressed.add(code);
            }
            this.keys.add(code);
        };

        const releaseCode = (code) => {
            if (this.keys.has(code)) {
                this.justReleased.add(code);
            }
            this.keys.delete(code);
            this.justPressed.delete(code);
        };

        window.addEventListener('keydown', (e) => {
            const target = e.target;
            const isEditableTarget = !!(
                target &&
                (
                    target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable
                )
            );
            if (isEditableTarget) return;
            if (this.preventDefaultCodes.has(e.code) && e.cancelable) {
                e.preventDefault();
            }
            pressCode(e.code);
            const aliases = this.aliasByCode[e.code];
            if (aliases) {
                for (let i = 0; i < aliases.length; i++) pressCode(aliases[i]);
            }
        });

        window.addEventListener('keyup', (e) => {
            const target = e.target;
            const isEditableTarget = !!(
                target &&
                (
                    target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable
                )
            );
            if (isEditableTarget) return;
            if (this.preventDefaultCodes.has(e.code) && e.cancelable) {
                e.preventDefault();
            }
            releaseCode(e.code);
            const aliases = this.aliasByCode[e.code];
            if (aliases) {
                for (let i = 0; i < aliases.length; i++) releaseCode(aliases[i]);
            }
        });

        window.addEventListener('blur', () => {
            this.clearAllInputs();
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.clearAllInputs();
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
            this.justReleased.add('TouchScreen');
            this.keys.delete('TouchScreen');
            this.justPressed.delete('TouchScreen');
        });

        window.addEventListener('touchcancel', () => {
            this.justReleased.add('TouchScreen');
            this.keys.delete('TouchScreen');
            this.justPressed.delete('TouchScreen');
        });

        this.setupVirtualControls();
    }

    setupVirtualControls() {
        this._lastVirtualJumpPress = 0;
        this._attackThumbJumpLatched = false;
        this._mobileAttackToggleCharging = false;
        this._lastAttackToggleTouchTs = 0;
        const triggerVirtualJump = () => {
            const now = performance.now();
            if (now - this._lastVirtualJumpPress < 70) return;
            this._lastVirtualJumpPress = now;
            this.justPressed.add('KeyA');
        };

        const setAttackToggleVisual = (isActive) => {
            const toggleBtn = document.getElementById('btn-charge-toggle');
            if (!toggleBtn) return;
            toggleBtn.classList.toggle('is-active', isActive);
        };

        const pressVirtualKey = (code) => {
            if (!this.keys.has(code)) {
                this.justPressed.add(code);
            }
            this.keys.add(code);
        };

        const releaseVirtualKey = (code) => {
            this.justReleased.add(code);
            this.keys.delete(code);
            this.justPressed.delete(code);
        };

        const attachButton = (id, code) => {
            setTimeout(() => {
                const el = document.getElementById(id);
                if (!el) return;

                const press = (e) => {
                    e.preventDefault();
                    pressVirtualKey(code);
                };

                const release = (e) => {
                    e.preventDefault();
                    releaseVirtualKey(code);
                    if (id === 'btn-attack') {
                        this._attackThumbJumpLatched = false;
                        if (this._mobileAttackToggleCharging) {
                            this._mobileAttackToggleCharging = false;
                            setAttackToggleVisual(false);
                        }
                    }
                };

                el.addEventListener('touchstart', press, { passive: false });
                el.addEventListener('touchend', release, { passive: false });
                el.addEventListener('touchcancel', release, { passive: false });

                // Mobile quality-of-life: while charging attack, allow a rolling thumb
                // movement to still trigger jump if that same touch reaches jump's area.
                if (id === 'btn-attack') {
                    const jumpBtn = document.getElementById('btn-jump');
                    if (jumpBtn) {
                        const tryThumbJumpFromTouches = (touchList) => {
                            const rect = jumpBtn.getBoundingClientRect();
                            let inJumpRect = false;
                            for (let i = 0; i < touchList.length; i++) {
                                const t = touchList[i];
                                if (t.clientX >= rect.left && t.clientX <= rect.right &&
                                    t.clientY >= rect.top && t.clientY <= rect.bottom) {
                                    inJumpRect = true;
                                    break;
                                }
                            }

                            // Trigger on enter only. User can leave/re-enter for another jump
                            // while still holding attack, enabling normal double-jump flow.
                            if (inJumpRect && !this._attackThumbJumpLatched) {
                                triggerVirtualJump();
                                this._attackThumbJumpLatched = true;
                            } else if (!inJumpRect) {
                                this._attackThumbJumpLatched = false;
                            }
                        };

                        el.addEventListener('touchmove', (e) => {
                            e.preventDefault();
                            if (!this.keys.has('KeyD')) return;
                            tryThumbJumpFromTouches(e.touches);
                        }, { passive: false });

                        el.addEventListener('touchstart', (e) => {
                            e.preventDefault();
                            if (!this.keys.has('KeyD')) return;
                            tryThumbJumpFromTouches(e.touches);
                        }, { passive: false });
                    }
                }

                if (id === 'btn-jump') {
                    el.addEventListener('touchstart', () => {
                        triggerVirtualJump();
                    }, { passive: false });
                }
            }, 0);
        };

        attachButton('btn-jump', 'KeyA');
        attachButton('btn-attack', 'KeyD');
        attachButton('btn-bomb', 'KeyS');
        attachButton('btn-pause', 'KeyP');

        setTimeout(() => {
            const chargeToggleBtn = document.getElementById('btn-charge-toggle');
            if (!chargeToggleBtn) return;

            const toggleAttackCharge = () => {
                this._mobileAttackToggleCharging = !this._mobileAttackToggleCharging;
                if (this._mobileAttackToggleCharging) {
                    pressVirtualKey('KeyD');
                } else {
                    releaseVirtualKey('KeyD');
                }
                setAttackToggleVisual(this._mobileAttackToggleCharging);
            };

            chargeToggleBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this._lastAttackToggleTouchTs = performance.now();
                toggleAttackCharge();
            }, { passive: false });

            chargeToggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (performance.now() - this._lastAttackToggleTouchTs < 500) return;
                toggleAttackCharge();
            });
        }, 0);

        setTimeout(() => {
            const joyZone = document.getElementById('joystick-zone');
            const joyKnob = document.getElementById('joystick-knob');
            if (!joyZone || !joyKnob) return;

            let activeTouchId = null;
            const maxDistance = 80;

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

                const thresholdX = 14;
                const thresholdY = 18;

                if (distance > 6) {
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

    isJustReleased(code) {
        if (this.justReleased.has(code)) {
            this.justReleased.delete(code);
            return true;
        }
        return false;
    }

    clearAllInputs() {
        this.keys.clear();
        this.justPressed.clear();
        this.justReleased.clear();
    }

    update() {
        this.justPressed.clear();
        this.justReleased.clear();
    }
}
