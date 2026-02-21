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
        const attach = (id, code) => {
            // We use setTimeout to ensure elements are parsed since InputHandler might be instantiated early
            setTimeout(() => {
                const el = document.getElementById(id);
                if (!el) return;

                const press = (e) => {
                    e.preventDefault(); // Prevent scrolling/zooming
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

        attach('btn-left', 'ArrowLeft');
        attach('btn-right', 'ArrowRight');
        attach('btn-up', 'ArrowUp');
        attach('btn-down', 'ArrowDown');
        attach('btn-jump', 'KeyA');
        attach('btn-attack', 'KeyD');
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
