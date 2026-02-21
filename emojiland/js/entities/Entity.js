export class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.markedForDeletion = false;
    }

    update(dt) { }
    draw(ctx) { }
}
