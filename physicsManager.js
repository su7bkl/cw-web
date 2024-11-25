import {gameManager} from "./gameManager.js";
import {mapManager} from "./mapManager.js";
import {ctx} from "./gameManager.js";

export let physicsManager = {
    moveBox: 0,
    collider: {x: 0, y: 0, x_e: 0, y_e: 0},
    update(obj) {
        if (obj.move_x === 0 && obj.move_y === 0)
            return "stop";

        let newX = obj.pos_x + Math.floor(obj.move_x * obj.speed);
        let newY = obj.pos_y + Math.floor(obj.move_y * obj.speed);
        let oldCollider = obj.getCollider();
        let newCollider = {
            x: oldCollider.x + (newX - obj.pos_x),
            y: oldCollider.y + (newY - obj.pos_y),
            x_e: oldCollider.x_e + (newX - obj.pos_x),
            y_e: oldCollider.y_e + (newY - obj.pos_y)
        };


        let ts = mapManager.getTilesetIdx((newCollider.x + newCollider.x_e) / 2,
            (newCollider.y + newCollider.y_e) / 2);
        let e = this.entityAtXY(obj,
            (newCollider.x + newCollider.x_e) / 2,
            (newCollider.y + newCollider.y_e) / 2);

        if (newCollider.x < 0 || newCollider.y < 0 ||
            newCollider.x_e > mapManager.mapSize.x ||
            newCollider.y_e + obj.size_y > mapManager.mapSize.y) {
            obj.on_collision();
            return "break";
        }
        if ((ts !== 0)) {
            obj.on_collision();
            return "break";
        }

        obj.pos_x = newX;
        obj.pos_y = newY;

        // audioManager.playEvent(audioManager.stepsSoung);
        return "move";
    },

    entityAtXY(obj, x, y) {
        for (let i = 0; i < gameManager.entities.length; i++) {
            let e = gameManager.entities[i];
            if (e.name !== obj.name) {
                if (x + obj.size_x < e.pos_x || y + obj.size_y < e.pos_y || x > e.pos_x + e.size_x || y > e.pos_y + e.size_y)
                    continue;
                return e;
            }
        }
        return null;
    }
}

