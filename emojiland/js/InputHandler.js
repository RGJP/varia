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
            'KeyW',
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
            if (this._mobileControlLayoutMode) return;
            if (!e.target.closest('.ui-btn')) {
                if (!this.keys.has('TouchScreen')) {
                    this.justPressed.add('TouchScreen');
                }
                this.keys.add('TouchScreen');
            }
        }, { passive: false });

        window.addEventListener('touchend', () => {
            if (this._mobileControlLayoutMode) return;
            this.justReleased.add('TouchScreen');
            this.keys.delete('TouchScreen');
            this.justPressed.delete('TouchScreen');
        });

        window.addEventListener('touchcancel', () => {
            if (this._mobileControlLayoutMode) return;
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
        this._lastLayoutToggleTouchTs = 0;
        this._lastLayoutResetTouchTs = 0;
        this._mobileControlLayoutMode = false;
        const layoutStorageKey = 'emojiland_mobile_control_layout_v1';
        const movableControlIds = [
            'joystick-zone',
            'btn-jump',
            'btn-attack',
            'btn-bomb',
            'btn-charge-toggle',
            'btn-portal'
        ];
        const dragStateByTouchId = new Map();
        let movableControls = [];
        let mobileLayout = {};
        let layoutSaveTimerId = null;
        let layoutHintTimerId = null;

        const loadLayout = () => {
            try {
                const raw = localStorage.getItem(layoutStorageKey);
                if (!raw) return {};
                const parsed = JSON.parse(raw);
                return parsed && typeof parsed === 'object' ? parsed : {};
            } catch {
                return {};
            }
        };

        const saveLayout = () => {
            try {
                localStorage.setItem(layoutStorageKey, JSON.stringify(mobileLayout));
            } catch {
                // Ignore storage failures silently.
            }
        };

        const scheduleLayoutSave = (delayMs = 120) => {
            if (layoutSaveTimerId !== null) return;
            layoutSaveTimerId = setTimeout(() => {
                layoutSaveTimerId = null;
                saveLayout();
            }, delayMs);
        };

        const flushScheduledLayoutSave = () => {
            if (layoutSaveTimerId !== null) {
                clearTimeout(layoutSaveTimerId);
                layoutSaveTimerId = null;
            }
            saveLayout();
        };

        const isLayoutEditMode = () => this._mobileControlLayoutMode === true;
        mobileLayout = loadLayout();
        for (const key of Object.keys(mobileLayout)) {
            if (!movableControlIds.includes(key)) delete mobileLayout[key];
        }
        saveLayout();

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

        const getViewportSize = () => ({
            width: Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1),
            height: Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1)
        });

        const clampControlPosition = (left, top, width, height) => {
            const vp = getViewportSize();
            const margin = 8;
            const clampedLeft = Math.min(Math.max(margin, left), Math.max(margin, vp.width - width - margin));
            const clampedTop = Math.min(Math.max(margin, top), Math.max(margin, vp.height - height - margin));
            return { left: clampedLeft, top: clampedTop };
        };

        const setControlPosition = (el, left, top) => {
            if (!el) return;
            const rect = el.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return;
            const clamped = clampControlPosition(left, top, rect.width, rect.height);
            el.style.position = 'fixed';
            el.style.left = `${clamped.left}px`;
            el.style.top = `${clamped.top}px`;
            el.style.right = 'auto';
            el.style.bottom = 'auto';
            el.style.margin = '0';
        };

        const cacheControlPosition = (el) => {
            if (!el) return;
            const rect = el.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return;
            const vp = getViewportSize();
            mobileLayout[el.id] = {
                cx: (rect.left + rect.width / 2) / vp.width,
                cy: (rect.top + rect.height / 2) / vp.height
            };
        };

        const persistControlPosition = (el) => {
            cacheControlPosition(el);
            saveLayout();
        };

        const persistAllControlPositions = () => {
            initializeMovableControls();
            for (let i = 0; i < movableControls.length; i++) {
                cacheControlPosition(movableControls[i]);
            }
            flushScheduledLayoutSave();
        };

        const applySavedControlPosition = (el) => {
            const saved = mobileLayout[el.id];
            if (!saved || typeof saved.cx !== 'number' || typeof saved.cy !== 'number') return false;
            const rect = el.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return false;
            const vp = getViewportSize();
            const left = saved.cx * vp.width - rect.width / 2;
            const top = saved.cy * vp.height - rect.height / 2;
            setControlPosition(el, left, top);
            return true;
        };

        const primeControlForLayout = (el) => {
            if (!el || el.dataset.layoutReady === '1') return;
            const rect = el.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return;
            setControlPosition(el, rect.left, rect.top);
            el.dataset.layoutReady = '1';
            if (!mobileLayout[el.id]) persistControlPosition(el);
        };

        const initializeMovableControls = () => {
            if (movableControls.length > 0) return;
            for (let i = 0; i < movableControlIds.length; i++) {
                const el = document.getElementById(movableControlIds[i]);
                if (!el) continue;
                movableControls.push(el);
                if (el.dataset.layoutTouchBound !== '1') {
                    el.dataset.layoutTouchBound = '1';
                    el.addEventListener('touchstart', (e) => {
                        if (!isLayoutEditMode()) return;
                        e.preventDefault();
                        e.stopPropagation();
                        primeControlForLayout(el);
                        const rect = el.getBoundingClientRect();
                        for (let t = 0; t < e.changedTouches.length; t++) {
                            const touch = e.changedTouches[t];
                            dragStateByTouchId.set(touch.identifier, {
                                id: el.id,
                                offsetX: touch.clientX - rect.left,
                                offsetY: touch.clientY - rect.top
                            });
                        }
                    }, { passive: false, capture: true });
                }
            }
        };

        const refreshControlLayoutFromSaved = () => {
            initializeMovableControls();
            let touched = false;
            for (let i = 0; i < movableControls.length; i++) {
                const el = movableControls[i];
                primeControlForLayout(el);
                if (applySavedControlPosition(el)) touched = true;
            }
            return touched;
        };

        const freezeControlLayoutToCurrent = () => {
            initializeMovableControls();
            // Snapshot all current positions before changing any element to position:fixed.
            // Applying fixed one-by-one would reflow the layout and make subsequent
            // getBoundingClientRect() wrong, piling controls at bottom-left.
            const snapshots = [];
            for (let i = 0; i < movableControls.length; i++) {
                const el = movableControls[i];
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    snapshots.push({ el, left: rect.left, top: rect.top });
                }
            }
            for (let i = 0; i < snapshots.length; i++) {
                const { el, left, top } = snapshots[i];
                setControlPosition(el, left, top);
                el.dataset.layoutReady = '1';
                if (!mobileLayout[el.id]) persistControlPosition(el);
            }
        };

        const getDefaultControlSnapshots = () => {
            initializeMovableControls();
            const previousInlineStyles = new Map();
            for (let i = 0; i < movableControls.length; i++) {
                const el = movableControls[i];
                previousInlineStyles.set(el, el.getAttribute('style'));
                el.removeAttribute('style');
            }

            const snapshots = [];
            for (let i = 0; i < movableControls.length; i++) {
                const el = movableControls[i];
                const rect = el.getBoundingClientRect();
                if (rect.width <= 0 || rect.height <= 0) continue;
                snapshots.push({ el, left: rect.left, top: rect.top });
            }

            for (let i = 0; i < movableControls.length; i++) {
                const el = movableControls[i];
                const style = previousInlineStyles.get(el);
                if (style === null) {
                    el.removeAttribute('style');
                } else {
                    el.setAttribute('style', style);
                }
            }
            return snapshots;
        };

        const resetControlLayoutToDefault = () => {
            const defaultSnapshots = getDefaultControlSnapshots();
            if (defaultSnapshots.length <= 0) return;
            dragStateByTouchId.clear();
            mobileLayout = {};
            flushScheduledLayoutSave();
            for (let i = 0; i < defaultSnapshots.length; i++) {
                const { el, left, top } = defaultSnapshots[i];
                setControlPosition(el, left, top);
                el.dataset.layoutReady = '1';
                persistControlPosition(el);
            }
            resetJoystick();
        };

        const resetJoystick = () => {
            const joyKnob = document.getElementById('joystick-knob');
            if (joyKnob) joyKnob.style.transform = 'translate(-50%, -50%)';
            this.keys.delete('ArrowLeft');
            this.keys.delete('ArrowRight');
            this.keys.delete('ArrowUp');
            this.keys.delete('ArrowDown');
        };

        const hideLayoutEditHint = () => {
            if (layoutHintTimerId !== null) {
                clearTimeout(layoutHintTimerId);
                layoutHintTimerId = null;
            }
            const hint = document.getElementById('layout-edit-hint');
            if (hint) hint.classList.remove('is-visible');
        };

        const showLayoutEditHint = (durationMs = 2600) => {
            const hint = document.getElementById('layout-edit-hint');
            if (!hint) return;
            if (layoutHintTimerId !== null) {
                clearTimeout(layoutHintTimerId);
                layoutHintTimerId = null;
            }
            hint.classList.add('is-visible');
            layoutHintTimerId = setTimeout(() => {
                layoutHintTimerId = null;
                hint.classList.remove('is-visible');
            }, durationMs);
        };

        const setLayoutEditMode = (enabled) => {
            const wasLayoutEditMode = this._mobileControlLayoutMode === true;
            this._mobileControlLayoutMode = !!enabled;
            const mobileUI = document.getElementById('mobile-ui');
            const layoutBtn = document.getElementById('btn-layout');
            if (mobileUI) mobileUI.classList.toggle('layout-edit-mode', this._mobileControlLayoutMode);
            if (layoutBtn) layoutBtn.classList.toggle('is-active', this._mobileControlLayoutMode);
            if (wasLayoutEditMode !== this._mobileControlLayoutMode) {
                window.dispatchEvent(new CustomEvent('emojiland:layout-edit-mode-change', {
                    detail: { enabled: this._mobileControlLayoutMode }
                }));
            }
            if (this._mobileControlLayoutMode) {
                // Enter edit mode from what the player currently sees, then allow drag edits.
                // This avoids stale saved coordinates snapping buttons into a stack.
                freezeControlLayoutToCurrent();
                resetJoystick();
                showLayoutEditHint();
            } else {
                // Always persist full layout when leaving edit mode.
                persistAllControlPositions();
                hideLayoutEditHint();
            }
            this.clearAllInputs();
        };

        window.addEventListener('touchmove', (e) => {
            if (!isLayoutEditMode()) return;
            let handled = false;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                const drag = dragStateByTouchId.get(touch.identifier);
                if (!drag) continue;
                const el = document.getElementById(drag.id);
                if (!el) continue;
                setControlPosition(el, touch.clientX - drag.offsetX, touch.clientY - drag.offsetY);
                cacheControlPosition(el);
                scheduleLayoutSave();
                handled = true;
            }
            if (handled) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, { passive: false });

        const endLayoutDragTouch = (e) => {
            if (!isLayoutEditMode()) return;
            let handled = false;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                const drag = dragStateByTouchId.get(touch.identifier);
                if (!drag) continue;
                const el = document.getElementById(drag.id);
                if (el) persistControlPosition(el);
                dragStateByTouchId.delete(touch.identifier);
                handled = true;
            }
            if (handled) {
                flushScheduledLayoutSave();
                e.preventDefault();
                e.stopPropagation();
            }
        };

        window.addEventListener('touchend', endLayoutDragTouch, { passive: false });
        window.addEventListener('touchcancel', endLayoutDragTouch, { passive: false });
        window.addEventListener('resize', () => {
            refreshControlLayoutFromSaved();
            persistAllControlPositions();
        });
        window.addEventListener('beforeunload', () => {
            flushScheduledLayoutSave();
        });
        window.addEventListener('pagehide', () => {
            flushScheduledLayoutSave();
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                persistAllControlPositions();
            }
        });

        const attachButton = (id, code) => {
            setTimeout(() => {
                const el = document.getElementById(id);
                if (!el) return;

                const press = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isLayoutEditMode()) return;
                    pressVirtualKey(code);
                };

                const release = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isLayoutEditMode()) return;
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
                            if (isLayoutEditMode()) return;
                            if (!this.keys.has('KeyD')) return;
                            tryThumbJumpFromTouches(e.touches);
                        }, { passive: false });

                        el.addEventListener('touchstart', (e) => {
                            e.preventDefault();
                            if (isLayoutEditMode()) return;
                            if (!this.keys.has('KeyD')) return;
                            tryThumbJumpFromTouches(e.touches);
                        }, { passive: false });
                    }
                }

                if (id === 'btn-jump') {
                    el.addEventListener('touchstart', (e) => {
                        if (isLayoutEditMode()) return;
                        triggerVirtualJump();
                    }, { passive: false });
                }
            }, 0);
        };

        attachButton('btn-jump', 'KeyA');
        attachButton('btn-attack', 'KeyD');
        attachButton('btn-bomb', 'KeyS');
        attachButton('btn-portal', 'KeyW');
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
                e.stopPropagation();
                if (isLayoutEditMode()) return;
                this._lastAttackToggleTouchTs = performance.now();
                toggleAttackCharge();
            }, { passive: false });

            chargeToggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (isLayoutEditMode()) return;
                if (performance.now() - this._lastAttackToggleTouchTs < 500) return;
                toggleAttackCharge();
            });
        }, 0);

        setTimeout(() => {
            const layoutBtn = document.getElementById('btn-layout');
            if (!layoutBtn) return;

            layoutBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._lastLayoutToggleTouchTs = performance.now();
                setLayoutEditMode(!isLayoutEditMode());
            }, { passive: false });

            layoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (performance.now() - this._lastLayoutToggleTouchTs < 500) return;
                setLayoutEditMode(!isLayoutEditMode());
            });
        }, 0);

        setTimeout(() => {
            const layoutResetBtn = document.getElementById('btn-layout-reset');
            if (!layoutResetBtn) return;

            const triggerReset = () => {
                if (!isLayoutEditMode()) return;
                if (!window.confirm('Reset controls to default positions?')) return;
                resetControlLayoutToDefault();
            };

            layoutResetBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._lastLayoutResetTouchTs = performance.now();
                triggerReset();
            }, { passive: false });

            layoutResetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (performance.now() - this._lastLayoutResetTouchTs < 500) return;
                triggerReset();
            });
        }, 0);

        setTimeout(() => {
            const joyZone = document.getElementById('joystick-zone');
            const joyKnob = document.getElementById('joystick-knob');
            if (!joyZone || !joyKnob) return;

            let activeTouchId = null;
            const maxDistance = 80;

            const releaseJoystickTouch = () => {
                activeTouchId = null;
                resetJoystick();
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
                if (isLayoutEditMode()) return;
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
                if (isLayoutEditMode()) return;
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
                if (isLayoutEditMode()) return;
                if (activeTouchId === null) return;
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === activeTouchId) {
                        releaseJoystickTouch();
                        break;
                    }
                }
            };

            joyZone.addEventListener('touchend', endDrag, { passive: false });
            joyZone.addEventListener('touchcancel', endDrag, { passive: false });
        }, 0);

        setTimeout(() => {
            const hasSavedLayout = Object.keys(mobileLayout).length > 0;
            const restored = refreshControlLayoutFromSaved();
            if (hasSavedLayout && !restored) {
                const mobileUI = document.getElementById('mobile-ui');
                if (mobileUI && typeof MutationObserver !== 'undefined') {
                    const observer = new MutationObserver(() => {
                        if (!mobileUI.classList.contains('active')) return;
                        if (!refreshControlLayoutFromSaved()) return;
                        observer.disconnect();
                    });
                    observer.observe(mobileUI, { attributes: true, attributeFilter: ['class', 'style'] });
                }
            }
            setLayoutEditMode(false);
        }, 120);
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
