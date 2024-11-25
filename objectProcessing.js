import {spriteManager} from "./spriteManager.js";
import {eventsManager} from "./eventsManager.js";
import {physicsManager} from "./physicsManager.js";
import {mapManager} from "./mapManager.js";
import {ctx, gameManager} from "./gameManager.js";
import {soundManager} from "./soundManager.js";

export let Entity = {
    pos_x: 0,
    pos_y: 0,
    size_x: 0,
    size_y: 0,
    on_collision(){},

    getCollider() {
        return {x: this.pos_x, y: this.pos_y, x_e: this.pos_x + this.size_x, y_e: this.pos_y + this.size_y}
    },

    extend(extendProto) {
        let object = Object.create(this);
        for (let property in extendProto) {
            if (this.hasOwnProperty(property) || typeof object[property] === 'undefined') {
                object[property] = extendProto[property];
            }
        }
        return object;
    },
    getDamage() {
    }
}

export let Player = Entity.extend({
    move_x: 1,
    move_y: 0,
    speed: 1,
    health: 100,
    mana: 100,
    direction: "down",


    getCollider() {
        return {x: this.pos_x, y: this.pos_y + 7, x_e: this.pos_x + 16, y_e: this.pos_y + 23};
    },

    draw(ctx) {
        let sprite_name;
        switch (this.direction) {
            case "left" :
                sprite_name = "sprite4";
                break;
            case "right":
                sprite_name = "sprite2";
                break;
            case "up" :
                sprite_name = "sprite1";
                break;
            case "down":
                sprite_name = "sprite3";
                break;
        }
        spriteManager.drawSprite(ctx, sprite_name, this.pos_x, this.pos_y, 0, 0);
        ctx.fillStyle = 'red';
        ctx.fillRect(this.pos_x - mapManager.view.x, this.pos_y - 2 - mapManager.view.y, this.health * (16 / 100), 1);
        ctx.fillStyle = 'cyan';
        ctx.fillRect(this.pos_x - mapManager.view.x, this.pos_y - 1 - mapManager.view.y, this.mana * (16 / 100), 1);

    },

    update() {
        if (this.mana < 100 && Math.random() > 0.8)
            this.mana++;
        if (this.move_x === -1) {
            this.direction = "left";
        }
        if (this.move_x === 1) {
            this.direction = "right";
        }
        if (this.move_y === -1) {
            this.direction = "up";
        }
        if (this.move_y === 1) {
            this.direction = "down";
        }
        physicsManager.update(this);


    },

    getDamage(dmg) {
        gameManager.score += dmg;
        this.health -= dmg;
        if (this.health <= 0) {
            this.health = 0;
            this.kill();
        }
    },

    kill() {
        gameManager.end_game();
    },

    attack() {
        const max = 20;
        const min = 15;
        const manacost = 15;

        if (this.mana >= manacost) {
            soundManager.play("/resources/music/foom_0.ogg");
            this.mana -= manacost;
            let collider = this.getCollider();

            gameManager.effects.push({
                params: [Math.floor((collider.x + collider.x_e) / 2) - mapManager.view.x, Math.floor((collider.y + collider.y_e) / 2) - mapManager.view.y, 35, 0, 2 * Math.PI],
                span: 10,
                color: "orange"
            })
            for (let e of gameManager.entities) {
                let eCollider = e.getCollider();
                if (e.name !== "player" && (Math.floor((collider.x + collider.x_e) / 2) - Math.floor((eCollider.x + eCollider.x_e) / 2)) ** 2 + (Math.floor((collider.y + collider.y_e) / 2) - Math.floor((eCollider.y + eCollider.y_e) / 2)) ** 2 <= 35 ** 2) {
                    e.getDamage(Math.floor(Math.random() * (max - min + 1)) + min);
                }
            }
            eventsManager.action["fight"] = false;
        }
    }
});

export let Hound = Entity.extend({
    move_x: 0,
    move_y: 0,
    speed: 1,
    moved: 0,
    health: 50,
    state: "sleep",
    target: null,
    wanderTarget: null,

    setState(state) {
        if (state === "sleep" || state === "hunt" || state === "wander") {
            this.state = state;

        }
    },

    getCollider() {
        return {x: this.pos_x + 17, y: this.pos_y + 2, x_e: this.pos_x + 38, y_e: this.pos_y + 18};
    },

    draw(ctx) {
        let sprite_name;
        switch (this.state) {
            case "sleep":
                sprite_name = "Idle_1";
                break;
            case "hunt":
                sprite_name = "walking_2_1";
                break;
            case "wander":
                sprite_name = "Walking_1";
                break;
            case "attack":
                sprite_name = "Pounce_1";
                break;
            default:
                sprite_name = "Idle_1";
        }
        spriteManager.drawSprite(ctx, sprite_name, this.pos_x, this.pos_y, 0, 0);
        ctx.fillStyle = 'red';
        ctx.fillRect(this.pos_x + 17 - mapManager.view.x, this.pos_y - 2 - mapManager.view.y, this.health * (16 / 50), 1);
    },

    update() {
        let collider = this.getCollider();
        let pCollider = gameManager.player.getCollider();
        if ((Math.floor((collider.x + collider.x_e) / 2) - Math.floor((pCollider.x + pCollider.x_e) / 2)) ** 2 + (Math.floor((collider.y + collider.y_e) / 2) - Math.floor((pCollider.y + pCollider.y_e) / 2)) ** 2 <= 22 ** 2) this.state = "attack";
        switch (this.state) {
            case "sleep":
                this.monitor(20);
                break;
            case "wander":
                this.monitor(40);
                this.wander();
                break;
            case "hunt":
                this.monitor(40);
                this.follow();
                break;
            case "attack":
                this.attack();
                break;
        }
    },

    monitor(radius) {
        let check = false;
        for (let i in gameManager.smelly_points) {
            let [x, y] = i.split(',').map(Number);
            let collider = this.getCollider();
            let col_x = Math.floor((collider.x + collider.x_e) / 2);
            let col_y = Math.floor((collider.y + collider.y_e) / 2);
            ctx.beginPath();
            ctx.arc(col_x - mapManager.view.x, col_y - mapManager.view.y, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = "yellow";
            ctx.moveTo(col_x - mapManager.view.x, col_y - mapManager.view.y);
            if (this.target) {
                let [a, b] = this.target.split(',').map(Number);
                ctx.lineTo(a - mapManager.view.x, b - mapManager.view.y);
            }
            ctx.stroke();
            if ((col_x - x) ** 2 + (col_y - y) ** 2 <= radius ** 2) {
                this.state = "hunt"
                check = true;
                if (this.target === null || gameManager.smelly_points[i] > gameManager.smelly_points[this.target]) {
                    this.target = i;
                }
            }
        }
        if (!check && this.state !== "sleep") {
            this.state = "wander";
            this.target = null;
        }
        physicsManager.update(this);
    },

    follow() {
        if (this.target === null) {
            this.state = "wander";
            return;
        }
        let [a, b] = this.target.split(',').map(Number);
        if (Math.abs(this.pos_x - a) > Math.abs(this.pos_y - b)) {
            this.move_x = -(this.pos_x - a) / Math.abs(this.pos_x - a);
            this.move_y = 0;
        } else {
            this.move_x = 0;
            this.move_y = -(this.pos_y - b) / Math.abs(this.pos_y - b);
        }
    },

    wander() {
        if (this.wanderTarget === null || Math.random() < 0.01) {
            const max = 100;
            const min = -100;
            this.wanderTarget = [this.pos_x + Math.floor(Math.random() * (max - min + 1)) + min, this.pos_y + Math.floor(Math.random() * (max - min + 1)) + min];
        }
        let [a, b] = this.wanderTarget;
        if (Math.abs(this.pos_x - a) > Math.abs(this.pos_y - b)) {
            this.move_x = -(this.pos_x - a) / Math.abs(this.pos_x - a);
            this.move_y = 0;
        } else {
            this.move_x = 0;
            this.move_y = -(this.pos_y - b) / Math.abs(this.pos_y - b);
        }
    },

    attack() {
        soundManager.play("/resources/music/wolf_monster.ogg");
        let collider = this.getCollider();
        let pCollider = gameManager.player.getCollider();
        if ((Math.floor((collider.x + collider.x_e) / 2) - Math.floor((pCollider.x + pCollider.x_e) / 2)) ** 2 + (Math.floor((collider.y + collider.y_e) / 2) - Math.floor((pCollider.y + pCollider.y_e) / 2)) ** 2 >= 22 ** 2) {
            this.state = "wander";
            return;
        }
        const max = 10;
        const min = 3;
        if (Math.random() < 0.07) {
            gameManager.player.getDamage(Math.floor(Math.random() * (max - min + 1)) + min);
        }
    },

    getDamage(dmg) {
        if (this.state === "sleep") this.state = "wander";
        this.health -= dmg;
        if (this.health <= 0) {
            this.health = 0;
            this.kill();
        }
        soundManager.play("/resources/music/wolf_monster.ogg");
    },

    kill() {
        let collider = this.getCollider();
        gameManager.toKill.push(this);
        gameManager.score += 100;
        let obj = Object.create(gameManager.factory["Bonus"]);
        obj.type = (Math.random() > 0.5) ? "mana" : "health";
        obj.pos_x = Math.floor((collider.x + collider.x_e) / 2);
        obj.pos_y = Math.floor((collider.y + collider.y_e) / 2);
        obj.size_x = 1;
        obj.size_y = 1;
        obj.name = "bonus" + obj.type + Math.random().toString(16).substr(2, 8);
        gameManager.entities.push(obj);
    },

});

export let Devil = Entity.extend({
    avoidDist: 50,
    move_x: 0,
    move_y: 0,
    speed: 2,
    moved: 0,
    health: 450,
    mana: 200,
    target: null,
    moveTarget: null,
    counter: 0,
    state: "attack",
    cooldown: false,

    resetCooldown() {
        this.cooldown = true;
    },

    getCollider() {
        return {x: this.pos_x + 16, y: this.pos_y + 16, x_e: this.pos_x + 48, y_e: this.pos_y + 48};
    },

    draw(ctx) {
        let sprite_name = "devil1";
        this.counter++;
        if (this.counter < 10) {
            sprite_name = "devil1"
        }
        if (this.counter === 20) {
            sprite_name = "devil2"
        }
        spriteManager.drawSprite(ctx, sprite_name, this.pos_x, this.pos_y, 0, 0);
        ctx.fillStyle = 'red';
        ctx.fillRect(this.pos_x + 14 - mapManager.view.x, this.pos_y - 2 - mapManager.view.y, this.health * (20 / 450), 1);
        ctx.fillStyle = 'cyan';
        ctx.fillRect(this.pos_x + 14 - mapManager.view.x, this.pos_y - 1 - mapManager.view.y, this.mana * (20 / 200), 1);
    },

    update() {
        if (Math.random() < 0.05)
        soundManager.play("/resources/music/evil_laugh_02.ogg");
        if (this.mana < 200)
            this.mana++;
        this.attack();

        this.move();

    },

    move() {
        const minX = 32, maxX = mapManager.mapSize.x - 32, minY = 32, maxY = mapManager.mapSize.y - 32;
        let col = this.getCollider(), pCol = gameManager.player.getCollider();
        const max = 300, min = -300;

        let cX = Math.floor((col.x + col.x_e) / 2), cY = Math.floor((col.y + col.y_e) / 2);
        let pX = Math.floor((pCol.x + pCol.x_e) / 2), pY = Math.floor((pCol.y + pCol.y_e) / 2);

        if (!this.retries) this.retries = 0;
        if (!this.timer) this.timer = 0;

        if (this.target && this.timer < 70) {
            let [tX, tY] = this.target;
            if (Math.abs(cX - tX) < 10 && Math.abs(cY - tY) < 10) {
                this.target = null;
                this.timer = 0;
            } else {
                this.timer++;
                if (Math.abs(this.pos_x - tX) > Math.abs(this.pos_y - tY)) {
                    this.move_x = -(this.pos_x - tX) / Math.abs(this.pos_x - tX);
                    this.move_y = 0;
                } else {
                    this.move_x = 0;
                    this.move_y = -(this.pos_y - tY) / Math.abs(this.pos_y - tY);
                }
                physicsManager.update(this);
                return;
            }
        }

        let found = false;
        while (this.retries < 100) {
            this.retries++;
            let nX = Math.max(minX, Math.min(maxX, this.pos_x + Math.floor(Math.random() * (max - min + 1)) + min));
            let nY = Math.max(minY, Math.min(maxY, this.pos_y + Math.floor(Math.random() * (max - min + 1)) + min));

            if ((nX - pX) ** 2 + (nY - pY) ** 2 > this.avoidDist ** 2) {
                this.target = [nX, nY];
                this.retries = 0;
                this.timer = 0;
                found = true;
                break;
            }
        }

        if (!found) {
            if (this.mana > 60) {
                this.mana -= 50;
                this.pos_x = Math.random() * (maxX - minX) + minX;
                this.pos_y = Math.random() * (maxY - minY) + minY;
            }
            this.retries = 0;
            this.timer = 0;
            this.target = null;
            return;
        }

        if (this.target) {
            let [tX, tY] = this.target;
            let distToPlayer = (tX - pX) ** 2 + (tY - pY) ** 2;
            if (distToPlayer > this.avoidDist ** 2) {
                if (Math.abs(this.pos_x - tX) > Math.abs(this.pos_y - tY)) {
                    this.move_x = -(this.pos_x - tX) / Math.abs(this.pos_x - tX);
                    this.move_y = 0;
                } else {
                    this.move_x = 0;
                    this.move_y = -(this.pos_y - tY) / Math.abs(this.pos_y - tY);
                }
                physicsManager.update(this);
            } else {
                let wX = Math.max(minX, Math.min(maxX, this.pos_x + Math.floor(Math.random() * (max - min + 1)) + min));
                let wY = Math.max(minY, Math.min(maxY, this.pos_y + Math.floor(Math.random() * (max - min + 1)) + min));
                this.target = [wX, wY];
                this.timer = 0;
                if (Math.abs(this.pos_x - wX) > Math.abs(this.pos_y - wY)) {
                    this.move_x = -(this.pos_x - wX) / Math.abs(this.pos_x - wX);
                    this.move_y = 0;
                } else {
                    this.move_x = 0;
                    this.move_y = -(this.pos_y - wY) / Math.abs(this.pos_y - wY);
                }
                physicsManager.update(this);
            }
        }
    },

    attack() {
        console.log(this.cooldown);
        if (!this.cooldown && this.mana > 20) {
            soundManager.play("/resources/music/foom_0.ogg");
            this.mana -= 20;
            console.log("this.pos_x, this.pos_y");
            let collider = this.getCollider();
            let pCollider = gameManager.player.getCollider();
            let obj = Object.create(gameManager.factory["Fireball"]);
            obj.type = "Fireball";
            let a = Math.floor((pCollider.x_e + pCollider.x) / 2);
            let b = Math.floor((pCollider.y_e + pCollider.y) / 2);
            obj.pos_x = Math.floor((collider.x + collider.x_e) / 2);
            obj.pos_y = Math.floor((collider.y + collider.y_e) / 2);
            obj.size_x = 1;
            obj.size_y = 1;
            obj.move_x = -(this.pos_x - a) / (Math.abs(this.pos_x - a) ** 2 + Math.abs(this.pos_y - b) ** 2) ** 0.5;
            obj.move_y = -(this.pos_y - b) / (Math.abs(this.pos_x - a) ** 2 + Math.abs(this.pos_y - b) ** 2) ** 0.5;
            obj.radius = 10;
            obj.speed = 4;
            obj.name = "fireball" + obj.type + Math.random().toString(16).substr(2, 8);
            this.cooldown = true;
            setTimeout(() => {
                this.cooldown = false
            }, Math.floor(Math.random() * (10000 - 800 + 1)) + 800);
            gameManager.entities.push(obj);
        }
    },

    getDamage(dmg) {
        this.health -= dmg;
        if (this.health <= 0) {
            this.health = 0;
            this.kill();
        }
    }
    ,

    kill() {
        let collider = this.getCollider();
        gameManager.toKill.push(this);
        gameManager.score += 1000;
        let obj = Object.create(gameManager.factory["Bonus"]);
        obj.type = (Math.random() > 0.5) ? "mana" : "health";
        obj.pos_x = Math.floor((collider.x + collider.x_e) / 2);
        obj.size_x = 1;
        obj.size_y = 1;
        obj.pos_y = Math.floor((collider.y + collider.y_e) / 2);
        obj.name = "bonus" + obj.type + Math.random().toString(8).substr(2, 8);
        gameManager.entities.push(obj);
        gameManager.end_game();
    },

});

export let Bonus = Entity.extend({
    move_x: 0,
    move_y: 0,
    speed: 0,


    update() {
        let pCollider = gameManager.player.getCollider();
        if ((this.pos_x - Math.floor((pCollider.x + pCollider.x_e) / 2)) ** 2 +
            (this.pos_y - Math.floor((pCollider.y + pCollider.y_e) / 2)) ** 2 <= 7 ** 2) {
            gameManager.toKill.push(this);
            gameManager.score += 25;
            if (this.type === "health") {
                gameManager.player.health += 25;
            }

            if (this.type === "mana") {
                gameManager.player.mana += 25;
            }
        }
    },

    draw(ctx) {
        if (this.type === "health")
            ctx.fillStyle = "red";
        if (this.type === "mana")
            ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.arc(this.pos_x - mapManager.view.x, this.pos_y - mapManager.view.y, 2, 0, 2 * Math.PI);
        ctx.fill();
    },

})

export let Fireball = Entity.extend({
    move_x: 0,
    move_y: 0,
    target: null,
    speed: 0,


    update() {
        physicsManager.update(this);
        let collider = gameManager.player.getCollider();
        if (this.pos_x <= collider.x_e && this.pos_x >= collider.x &&
            this.pos_y <= collider.y_e && this.pos_y >= collider.y)
            this.kill();
    },

    on_collision(){
        this.kill();
    },

    draw(ctx) {
        ctx.beginPath();
        ctx.fillStyle = "orange";
        ctx.arc(this.pos_x - mapManager.view.x, this.pos_y - mapManager.view.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
    },

    kill() {
        soundManager.play("resources/music/explosion.ogg");
        gameManager.toKill.push(this);
        const max = 20;
        const min = 15;


        let collider = this.getCollider();

        gameManager.effects.push({
            params: [Math.floor((collider.x + collider.x_e) / 2) - mapManager.view.x, Math.floor((collider.y + collider.y_e) / 2) - mapManager.view.y, 35, 0, 2 * Math.PI],
            span: 10,
            color: "orange"
        })
        for (let e of gameManager.entities) {
            let eCollider = e.getCollider();
            if ((Math.floor((collider.x + collider.x_e) / 2) - Math.floor((eCollider.x + eCollider.x_e) / 2)) ** 2 + (Math.floor((collider.y + collider.y_e) / 2) - Math.floor((eCollider.y + eCollider.y_e) / 2)) ** 2 <= 15 ** 2) {
                e.getDamage(Math.floor(Math.random() * (max - min + 1)) + min);
            }

        }
    }

})

export let Exit = Entity.extend({
    move_x: 0,
    move_y: 0,
    status: false,

    draw(ctx) {
        if (this.status) {
            ctx.fillStyle = '#00ffff';
            ctx.font = '6px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Press E to go' , 60, 41);
            ctx.fillText("to next level", 60, 49);

        }
    },
    update() {
        let pCollider = gameManager.player.getCollider();
        this.status = (this.pos_x - Math.floor((pCollider.x + pCollider.x_e) / 2)) ** 2 +
            (this.pos_y - Math.floor((pCollider.y + pCollider.y_e) / 2)) ** 2 <= 14 ** 2;
        if (this.status && eventsManager.action["use"]) {
            soundManager.stop();
            gameManager.nextLevel()
        }
    },

});