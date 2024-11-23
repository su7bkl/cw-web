import {spriteManager} from "./spriteManager.js";
import {physicsManager} from "./physicsManager.js";
import {mapManager} from "./mapManager.js";

export let Entity = {
    pos_x: 0,
    pos_y: 0,
    size_x: 0,
    size_y: 0,
    getCollider(){
        return {x: this.pos_x, y: this.pos_y, x_e: this.pos_x + this.size_x, y_e: this.pos_y + this.size_y}
    },

    extend(extendProto) {
        let object = Object.create(this);
        for (let property in extendProto){
            if(this.hasOwnProperty(property) || typeof object[property] === 'undefined'){
                object[property] = extendProto[property];
            }
        }
        return object;
    }
}

export let Player = Entity.extend({
    move_x: 1,
    move_y: 0,
    speed: 1,
    health: 100,
    direction: "down",
    getCollider(){
        return {x: this.pos_x, y: this.pos_y + 7, x_e: this.pos_x + 16, y_e: this.pos_y + 23};
    },
    draw(ctx) {
        let sprite_name;
        switch (this.direction) {
            case "left" :sprite_name="sprite4"; break;
            case "right":sprite_name="sprite2"; break;
            case "up" :sprite_name="sprite1"; break;
            case "down":sprite_name="sprite3"; break;
        }
        spriteManager.drawSprite(ctx, sprite_name,this.pos_x,this.pos_y ,0,0);
        ctx.fillStyle = 'red';
        ctx.fillRect(this.pos_x  - mapManager.view.x, this.pos_y - 2  - mapManager.view.y, this.health * (16/100), 1);

    },

    update() {
        if (this.move_x === -1 ){
            this.direction = "left";
        }
        if (this.move_x === 1 ){
            this.direction = "right";
        }
        if (this.move_y === -1 ){
            this.direction = "up";
        }
        if (this.move_y === 1 ){
            this.direction = "down";
        }
        physicsManager.update(this);


    },
    // onTouchEntity: function (obj) {
    //     if(obj.name.match(/box_[\d]/)){
    //         // physicManager.moveBox(obj,this,this.move_x,this.move_y)
    //         // audioManager.playEvent();
    //
    //     }
    // },
    // move(obj){
    //     // physicManager.update(obj)
    // },

});

export let Hound = Entity.extend({
    move_x: 0,
    move_y: 0,
    speed: 1,
    moved: 0,
    health: 50,
    state: "sleep",
    target: null,
    spawn(state){
        this.state = state;
    },
    draw(ctx) {
        let sprite_name;
        switch (this.state) {
            case "sleep": sprite_name = "Idle_1";break;
            case "hunt": sprite_name = "walking_2_1";break;
            case "wandering": sprite_name = "Walking_1"; break;
            case "attack": sprite_name = "Pounce_1";break;
            default: sprite_name = "Idle_1"; this.state = "sleep";
        }
        spriteManager.drawSprite(ctx,sprite_name,this.pos_x,this.pos_y,0,0)
    },
    // update() {
    //     switch (this.state) {
    //         case "sleep": this.monitor(50); break;
    //         case "wandering": this.monitor(100); break;
    //         case "hunt": this.seek(); break;
    //     }
    // },
    // onTouchEntity: function (obj) {

    // },
    // kill: function () {
    // },

});

export let Finish = Entity.extend({
    // move_x: 0,
    // move_y: 0,
    // status: false,
    // draw: function(ctx) {
    //     if (!this.status){
    //         let sprite_name;
    //         switch (this.color) {
    //             case "red": sprite_name = "End_Red";break;
    //             case "yellow": sprite_name = "End_Yellow";break;
    //             case "brown": sprite_name = "End_Brown"; break;
    //             default: sprite_name = "End_Brown";
    //         }
    //
    //         spriteManager.drawSprite(ctx,sprite_name,this.pos_x ,this.pos_y ,0,0);
    //     }
    //
    // },
    // update: function () {
    //     let e = physicManager.entityAtXY(this, this.pos_x, this.pos_y);
    //     if (e!== null && e.name.match(/box_[\d]/) && this.color === e.color){
    //         this.status = true
    //     }else{
    //         this.status = false
    //     }
    //
    // },

});