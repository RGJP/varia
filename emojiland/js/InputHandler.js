export const CONTROL_ACTIONS = [
    { id: 'left', label: 'Left' },
    { id: 'right', label: 'Right' },
    { id: 'up', label: 'Up' },
    { id: 'down', label: 'Down' },
    { id: 'jump', label: 'Jump' },
    { id: 'attack', label: 'Throw / Charge Rock' },
    { id: 'roll', label: 'Roll Attack' },
    { id: 'bomb', label: 'Bomb Drop Attack' },
    { id: 'portal', label: 'Spawn Portal' },
    { id: 'pause', label: 'Pause' }
];

export const DEFAULT_KEY_BINDINGS = Object.freeze({
    left: 'ArrowLeft',
    right: 'ArrowRight',
    up: 'ArrowUp',
    down: 'ArrowDown',
    jump: 'KeyA',
    attack: 'KeyD',
    roll: 'Space',
    bomb: 'KeyS',
    portal: 'KeyW',
    pause: 'KeyP'
});

const KEY_BINDINGS_STORAGE_KEY = 'emojiland_key_bindings_v1';
const ACTION_TOKEN_PREFIX = 'action:';
function getActionToken(actionId) {
    return `${ACTION_TOKEN_PREFIX}${actionId}`;
}

function formatKeyCode(code) {
    if (!code) return 'Unbound';
    if (code.startsWith('Key')) return code.slice(3);
    if (code.startsWith('Digit')) return code.slice(5);
    if (code.startsWith('Numpad')) return `Numpad ${code.slice(6)}`;
    if (code.startsWith('Arrow')) return `${code.slice(5)} Arrow`;
    if (code === 'Space') return 'Space';
    if (code === 'Escape') return 'Esc';
    if (code === 'Backspace') return 'Backspace';
    if (code === 'Delete') return 'Delete';
    if (code === 'Enter') return 'Enter';
    if (code === 'Tab') return 'Tab';
    if (code === 'CapsLock') return 'Caps Lock';
    if (code === 'PageUp') return 'Page Up';
    if (code === 'PageDown') return 'Page Down';
    if (code === 'ScrollLock') return 'Scroll Lock';
    if (code === 'NumLock') return 'Num Lock';
    return code
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/Left$/, ' Left')
        .replace(/Right$/, ' Right');
}

export class InputHandler {
    constructor() {
        this.keys = new Set();
        this.justPressed = new Set();
        this.justReleased = new Set();
        this._bindingCapture = null;
        this.bindings = this._loadBindings();
        this.boundActionsByCode = new Map();
        this.preventDefaultCodes = new Set(['Space']);
        this._rebuildBindingMaps();

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
            if (this._bindingCapture) {
                if (e.cancelable) e.preventDefault();
                if (e.repeat) return;
                if (e.code === 'Escape') {
                    this._finishBindingCapture({ action: this._bindingCapture.action, cancelled: true });
                    return;
                }
                if (e.code === 'Backspace' || e.code === 'Delete') {
                    this.clearBinding(this._bindingCapture.action);
                    this._finishBindingCapture({ action: this._bindingCapture.action, cleared: true, code: null });
                    return;
                }
                this.setBinding(this._bindingCapture.action, e.code);
                this._finishBindingCapture({ action: this._bindingCapture.action, code: e.code });
                return;
            }
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
            if (this._shouldPreventDefaultForCode(e.code) && e.cancelable) {
                e.preventDefault();
            }
            pressCode(e.code);
            const actions = this.boundActionsByCode.get(e.code);
            if (actions) {
                for (let i = 0; i < actions.length; i++) pressCode(actions[i]);
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
            if (this._shouldPreventDefaultForCode(e.code) && e.cancelable) {
                e.preventDefault();
            }
            releaseCode(e.code);
            const actions = this.boundActionsByCode.get(e.code);
            if (actions) {
                for (let i = 0; i < actions.length; i++) releaseCode(actions[i]);
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

    _loadBindings() {
        try {
            const raw = localStorage.getItem(KEY_BINDINGS_STORAGE_KEY);
            if (!raw) return { ...DEFAULT_KEY_BINDINGS };
            const parsed = JSON.parse(raw);
            return this._normalizeBindings(parsed);
        } catch {
            return { ...DEFAULT_KEY_BINDINGS };
        }
    }

    _normalizeBindings(candidate) {
        const normalized = {};
        for (let i = 0; i < CONTROL_ACTIONS.length; i++) {
            const { id } = CONTROL_ACTIONS[i];
            if (candidate && Object.prototype.hasOwnProperty.call(candidate, id) && typeof candidate[id] === 'string') {
                normalized[id] = candidate[id].trim();
            } else {
                normalized[id] = DEFAULT_KEY_BINDINGS[id];
            }
        }
        return normalized;
    }

    _saveBindings() {
        try {
            localStorage.setItem(KEY_BINDINGS_STORAGE_KEY, JSON.stringify(this.bindings));
        } catch {
            // Ignore storage failures.
        }
    }

    _rebuildBindingMaps() {
        this.boundActionsByCode.clear();
        this.preventDefaultCodes.clear();
        this.preventDefaultCodes.add('Space');
        for (let i = 0; i < CONTROL_ACTIONS.length; i++) {
            const action = CONTROL_ACTIONS[i].id;
            const code = this.bindings[action];
            if (!code) continue;
            if (!this.boundActionsByCode.has(code)) this.boundActionsByCode.set(code, []);
            this.boundActionsByCode.get(code).push(getActionToken(action));
            this.preventDefaultCodes.add(code);
        }
    }

    _shouldPreventDefaultForCode(code) {
        return this.preventDefaultCodes.has(code);
    }

    _finishBindingCapture(result) {
        const capture = this._bindingCapture;
        this._bindingCapture = null;
        if (capture && typeof capture.onFinish === 'function') {
            capture.onFinish(result);
        }
    }

    getBindingCode(action) {
        return this.bindings[action] || '';
    }

    getBindingLabel(action) {
        return formatKeyCode(this.getBindingCode(action));
    }

    setBinding(action, code) {
        if (!Object.prototype.hasOwnProperty.call(DEFAULT_KEY_BINDINGS, action)) return;
        const nextCode = typeof code === 'string' ? code.trim() : '';
        for (let i = 0; i < CONTROL_ACTIONS.length; i++) {
            const otherAction = CONTROL_ACTIONS[i].id;
            if (otherAction !== action && this.bindings[otherAction] === nextCode) {
                this.bindings[otherAction] = '';
            }
        }
        this.bindings[action] = nextCode;
        this._rebuildBindingMaps();
        this._saveBindings();
        this.clearAllInputs();
    }

    clearBinding(action) {
        if (!Object.prototype.hasOwnProperty.call(DEFAULT_KEY_BINDINGS, action)) return;
        this.bindings[action] = '';
        this._rebuildBindingMaps();
        this._saveBindings();
        this.clearAllInputs();
    }

    resetBindings() {
        this.bindings = { ...DEFAULT_KEY_BINDINGS };
        this._rebuildBindingMaps();
        this._saveBindings();
        this.clearAllInputs();
    }

    beginBindingCapture(action, onFinish) {
        if (!Object.prototype.hasOwnProperty.call(DEFAULT_KEY_BINDINGS, action)) return false;
        this._bindingCapture = { action, onFinish };
        this.clearAllInputs();
        return true;
    }

    cancelBindingCapture() {
        if (!this._bindingCapture) return false;
        this._finishBindingCapture({ action: this._bindingCapture.action, cancelled: true });
        this.clearAllInputs();
        return true;
    }

    getCapturingAction() {
        return this._bindingCapture ? this._bindingCapture.action : null;
    }

    isActionDown(action) {
        return this.isDown(getActionToken(action));
    }

    isActionJustPressed(action) {
        return this.isJustPressed(getActionToken(action));
    }

    isActionJustReleased(action) {
        return this.isJustReleased(getActionToken(action));
    }

    setupVirtualControls() {
        this._lastVirtualJumpPress = 0;
        this._attackThumbJumpLatched = false;
        this._mobileAttackToggleCharging = false;
        this._lastAttackToggleTouchTs = 0;
        this._lastLayoutToggleTouchTs = 0;
        this._lastLayoutResetTouchTs = 0;
        this._lastLayoutResetConfirmTouchTs = 0;
        this._mobileControlLayoutMode = false;
        const layoutStorageKey = 'emojiland_mobile_control_layout_v1';
        const movableControlIds = [
            'joystick-zone',
            'btn-jump',
            'btn-attack',
            'btn-roll',
            'btn-bomb',
            'btn-charge-toggle',
            'btn-portal'
        ];
        const dragStateByTouchId = new Map();
        let movableControls = [];
        let mobileLayout = {};
        let hasUserPreferredLayout = false;
        let layoutSaveTimerId = null;
        let layoutHintTimerId = null;
        let isResetConfirmOpen = false;
        let resetConfirmResolver = null;

        const isSavedControlPosition = (value) => {
            return value &&
                typeof value === 'object' &&
                typeof value.cx === 'number' &&
                typeof value.cy === 'number' &&
                Number.isFinite(value.cx) &&
                Number.isFinite(value.cy) &&
                value.cx >= 0 &&
                value.cx <= 1 &&
                value.cy >= 0 &&
                value.cy <= 1;
        };

        const normalizeStoredLayout = (candidate) => {
            const normalized = {};
            if (!candidate || typeof candidate !== 'object') return normalized;
            for (let i = 0; i < movableControlIds.length; i++) {
                const id = movableControlIds[i];
                const saved = candidate[id];
                if (!isSavedControlPosition(saved)) continue;
                normalized[id] = { cx: saved.cx, cy: saved.cy };
            }
            return normalized;
        };

        const hasCompleteStoredLayout = (layout) => {
            for (let i = 0; i < movableControlIds.length; i++) {
                if (!isSavedControlPosition(layout[movableControlIds[i]])) return false;
            }
            return true;
        };

        const isProbablyBunchedLegacyLayout = (layout) => {
            const values = Object.values(layout);
            if (values.length <= 1) return true;
            let minX = Infinity;
            let maxX = -Infinity;
            let minY = Infinity;
            let maxY = -Infinity;
            for (let i = 0; i < values.length; i++) {
                minX = Math.min(minX, values[i].cx);
                maxX = Math.max(maxX, values[i].cx);
                minY = Math.min(minY, values[i].cy);
                maxY = Math.max(maxY, values[i].cy);
            }
            return (maxX - minX) < 0.28 && (maxY - minY) < 0.28;
        };

        const loadLayout = () => {
            try {
                const raw = localStorage.getItem(layoutStorageKey);
                if (!raw) return { layout: {}, hasPreference: false };
                const parsed = JSON.parse(raw);
                if (!parsed || typeof parsed !== 'object') {
                    return { layout: {}, hasPreference: false };
                }

                if (parsed.userPreferredLayout === true && parsed.controls && typeof parsed.controls === 'object') {
                    const layout = normalizeStoredLayout(parsed.controls);
                    return {
                        layout: hasCompleteStoredLayout(layout) ? layout : {},
                        hasPreference: hasCompleteStoredLayout(layout)
                    };
                }

                const legacyLayout = normalizeStoredLayout(parsed);
                const canMigrateLegacyLayout = hasCompleteStoredLayout(legacyLayout) && !isProbablyBunchedLegacyLayout(legacyLayout);
                return {
                    layout: canMigrateLegacyLayout ? legacyLayout : {},
                    hasPreference: canMigrateLegacyLayout
                };
            } catch {
                return { layout: {}, hasPreference: false };
            }
        };

        const saveLayout = () => {
            try {
                if (!hasUserPreferredLayout) {
                    localStorage.removeItem(layoutStorageKey);
                    return;
                }
                localStorage.setItem(layoutStorageKey, JSON.stringify({
                    version: 2,
                    userPreferredLayout: true,
                    controls: mobileLayout
                }));
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
        const loadedLayout = loadLayout();
        mobileLayout = loadedLayout.layout;
        hasUserPreferredLayout = loadedLayout.hasPreference;
        saveLayout();

        const triggerVirtualJump = () => {
            const now = performance.now();
            if (now - this._lastVirtualJumpPress < 70) return;
            this._lastVirtualJumpPress = now;
            this.justPressed.add(getActionToken('jump'));
        };

        const setAttackToggleVisual = (isActive) => {
            const toggleBtn = document.getElementById('btn-charge-toggle');
            if (!toggleBtn) return;
            toggleBtn.classList.toggle('is-active', isActive);
        };

        const pressVirtualKey = (action) => {
            const token = getActionToken(action);
            if (!this.keys.has(token)) {
                this.justPressed.add(token);
            }
            this.keys.add(token);
        };

        const releaseVirtualKey = (action) => {
            const token = getActionToken(action);
            this.justReleased.add(token);
            this.keys.delete(token);
            this.justPressed.delete(token);
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
            if (!hasUserPreferredLayout) return;
            initializeMovableControls();
            for (let i = 0; i < movableControls.length; i++) {
                cacheControlPosition(movableControls[i]);
            }
            flushScheduledLayoutSave();
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
                        if (isResetConfirmOpen) return;
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
            if (!hasUserPreferredLayout) return false;
            initializeMovableControls();
            const applications = [];
            for (let i = 0; i < movableControls.length; i++) {
                const el = movableControls[i];
                const saved = mobileLayout[el.id];
                if (!isSavedControlPosition(saved)) continue;
                const rect = el.getBoundingClientRect();
                if (rect.width <= 0 || rect.height <= 0) continue;
                applications.push({ el, saved, width: rect.width, height: rect.height });
            }
            const vp = getViewportSize();
            for (let i = 0; i < applications.length; i++) {
                const { el, saved, width, height } = applications[i];
                setControlPosition(el, saved.cx * vp.width - width / 2, saved.cy * vp.height - height / 2);
                el.dataset.layoutReady = '1';
            }
            return applications.length > 0;
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
            hasUserPreferredLayout = true;
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
            this.keys.delete(getActionToken('left'));
            this.keys.delete(getActionToken('right'));
            this.keys.delete(getActionToken('up'));
            this.keys.delete(getActionToken('down'));
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

        const setLayoutResetConfirmOpen = (isOpen) => {
            const dialog = document.getElementById('layout-reset-confirm');
            isResetConfirmOpen = !!isOpen;
            if (!dialog) return;
            dialog.classList.toggle('is-open', isResetConfirmOpen);
            dialog.setAttribute('aria-hidden', isResetConfirmOpen ? 'false' : 'true');
        };

        const resolveLayoutResetConfirm = (confirmed) => {
            const resolve = resetConfirmResolver;
            resetConfirmResolver = null;
            setLayoutResetConfirmOpen(false);
            if (resolve) resolve(confirmed === true);
        };

        const requestLayoutResetConfirmation = () => {
            const dialog = document.getElementById('layout-reset-confirm');
            if (!dialog) return Promise.resolve(true);
            if (resetConfirmResolver) return Promise.resolve(false);
            dragStateByTouchId.clear();
            this.clearAllInputs();
            resetJoystick();
            setLayoutResetConfirmOpen(true);
            return new Promise((resolve) => {
                resetConfirmResolver = resolve;
            });
        };

        const setLayoutEditMode = (enabled) => {
            const wasLayoutEditMode = this._mobileControlLayoutMode === true;
            this._mobileControlLayoutMode = !!enabled;
            const mobileUI = document.getElementById('mobile-ui');
            const layoutBtn = document.getElementById('btn-layout');
            if (mobileUI) mobileUI.classList.toggle('layout-edit-mode', this._mobileControlLayoutMode);
            if (layoutBtn) layoutBtn.classList.toggle('is-active', this._mobileControlLayoutMode);
            if (!this._mobileControlLayoutMode) {
                dragStateByTouchId.clear();
                resolveLayoutResetConfirm(false);
            }
            if (wasLayoutEditMode !== this._mobileControlLayoutMode) {
                window.dispatchEvent(new CustomEvent('emojiland:layout-edit-mode-change', {
                    detail: { enabled: this._mobileControlLayoutMode }
                }));
            }
            if (this._mobileControlLayoutMode) {
                hasUserPreferredLayout = true;
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
            if (!isLayoutEditMode() || isResetConfirmOpen) return;
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
            if (!isLayoutEditMode() || isResetConfirmOpen) return;
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

        const attachButton = (id, action) => {
            setTimeout(() => {
                const el = document.getElementById(id);
                if (!el) return;

                const press = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isLayoutEditMode()) return;
                    pressVirtualKey(action);
                };

                const release = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isLayoutEditMode()) return;
                    releaseVirtualKey(action);
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
                            if (!this.isActionDown('attack')) return;
                            tryThumbJumpFromTouches(e.touches);
                        }, { passive: false });

                        el.addEventListener('touchstart', (e) => {
                            e.preventDefault();
                            if (isLayoutEditMode()) return;
                            if (!this.isActionDown('attack')) return;
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

        attachButton('btn-jump', 'jump');
        attachButton('btn-attack', 'attack');
        attachButton('btn-bomb', 'bomb');
        attachButton('btn-roll', 'roll');
        attachButton('btn-portal', 'portal');
        attachButton('btn-pause', 'pause');

        setTimeout(() => {
            const chargeToggleBtn = document.getElementById('btn-charge-toggle');
            if (!chargeToggleBtn) return;

            const toggleAttackCharge = () => {
                this._mobileAttackToggleCharging = !this._mobileAttackToggleCharging;
                if (this._mobileAttackToggleCharging) {
                    pressVirtualKey('attack');
                } else {
                    releaseVirtualKey('attack');
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
            const layoutResetDialog = document.getElementById('layout-reset-confirm');
            const layoutResetNoBtn = document.getElementById('btn-layout-reset-no');
            const layoutResetYesBtn = document.getElementById('btn-layout-reset-yes');
            if (!layoutResetBtn) return;

            const triggerReset = async () => {
                if (!isLayoutEditMode()) return;
                if (isResetConfirmOpen) return;
                const confirmed = await requestLayoutResetConfirmation();
                if (!confirmed || !isLayoutEditMode()) return;
                resetControlLayoutToDefault();
            };

            layoutResetBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._lastLayoutResetTouchTs = performance.now();
                void triggerReset();
            }, { passive: false });

            layoutResetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (performance.now() - this._lastLayoutResetTouchTs < 500) return;
                void triggerReset();
            });

            if (layoutResetDialog) {
                layoutResetDialog.addEventListener('touchstart', (e) => {
                    if (!isResetConfirmOpen) return;
                    e.preventDefault();
                    e.stopPropagation();
                }, { passive: false });

                layoutResetDialog.addEventListener('click', (e) => {
                    if (!isResetConfirmOpen) return;
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.target === layoutResetDialog) {
                        resolveLayoutResetConfirm(false);
                    }
                });
            }

            if (layoutResetNoBtn) {
                layoutResetNoBtn.addEventListener('touchstart', (e) => {
                    if (!isResetConfirmOpen) return;
                    e.preventDefault();
                    e.stopPropagation();
                    this._lastLayoutResetConfirmTouchTs = performance.now();
                    resolveLayoutResetConfirm(false);
                }, { passive: false });

                layoutResetNoBtn.addEventListener('click', (e) => {
                    if (!isResetConfirmOpen) return;
                    e.preventDefault();
                    if (performance.now() - this._lastLayoutResetConfirmTouchTs < 500) return;
                    resolveLayoutResetConfirm(false);
                });
            }

            if (layoutResetYesBtn) {
                layoutResetYesBtn.addEventListener('touchstart', (e) => {
                    if (!isResetConfirmOpen) return;
                    e.preventDefault();
                    e.stopPropagation();
                    this._lastLayoutResetConfirmTouchTs = performance.now();
                    resolveLayoutResetConfirm(true);
                }, { passive: false });

                layoutResetYesBtn.addEventListener('click', (e) => {
                    if (!isResetConfirmOpen) return;
                    e.preventDefault();
                    if (performance.now() - this._lastLayoutResetConfirmTouchTs < 500) return;
                    resolveLayoutResetConfirm(true);
                });
            }

            document.addEventListener('keydown', (e) => {
                if (!isResetConfirmOpen) return;
                if (e.key === 'Escape') {
                    e.preventDefault();
                    resolveLayoutResetConfirm(false);
                }
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

                this.keys.delete(getActionToken('left'));
                this.keys.delete(getActionToken('right'));
                this.keys.delete(getActionToken('up'));
                this.keys.delete(getActionToken('down'));

                const thresholdX = 14;
                const thresholdY = 18;

                if (distance > 6) {
                    if (dx < -thresholdX) this.keys.add(getActionToken('left'));
                    else if (dx > thresholdX) this.keys.add(getActionToken('right'));

                    if (dy < -thresholdY) this.keys.add(getActionToken('up'));
                    else if (dy > thresholdY) this.keys.add(getActionToken('down'));
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
