export const Physics = {
    GRAVITY: 1200, // pixels per second squared
    TERMINAL_VELOCITY: 800,
    FRICTION: 800, // horizontal friction

    checkAABB(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }
};
