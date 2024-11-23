import {eventsManager} from "./eventsManager.js";
import {spriteManager} from "./spriteManager.js";
import {mapManager} from "./mapManager.js";
import {Player, Hound, Finish} from "./objectProcessing.js";

let canvas = document.getElementById("canvas");
export let ctx = canvas.getContext("2d");


export let gameManager = {
    factory: {},
    entities: [],
    player: null,
    levels_path: ["resources/maps/cw.json"],
    level: 0,
    count_target: 0,
    players_steps: 0,
    smelly_points: {},

    initPlayer(obj) {
        this.player = obj;
    },

    update() {
        if (this.player === null)
            return;
        this.player.move_x = 0;
        this.player.move_y = 0;
        this.smelly_points[[this.player.pos_x, this.player.pos_y]] = 150;
        console.log("sadfa");
        if (eventsManager.action["up"]) this.player.move_y = -1;
        if (eventsManager.action["down"]) this.player.move_y = 1;
        if (eventsManager.action["left"]) this.player.move_x = -1;
        if (eventsManager.action["right"]) this.player.move_x = 1;
        if (eventsManager.action["esc"]) this.end_game();
        if (eventsManager.action["reset"]) this.reset_level();



        this.entities.forEach(e => {
            try {
                e.update()
            } catch (ex) {
                console.log(e.name + " " + ex);
            }
        });

        mapManager.draw(ctx);
        mapManager.centerAt(this.player.pos_x, this.player.pos_y);
        this.draw(ctx);
        if (this.check_game_status()) {
            if (this.level + 1 === this.levels_path.length) {
                this.end_game()
            } else
                this.go_next_level()
        }
        for (let i in this.smelly_points) {
            let [a, b] = i.split(',').map(Number)
            ctx.strokeStyle = "rgba(150, 75, 0, " + 1/150 *this.smelly_points[i] + ")";
            ctx.strokeRect(a - mapManager.view.x ,b - mapManager.view.y,4,4);
            if (!--this.smelly_points[i]) {
                delete this.smelly_points[i];
            }
        }
        let collider = this.player.getCollider();
        ctx.strokeStyle = "blue";
        ctx.strokeRect(collider.x - mapManager.view.x, collider.y - mapManager.view.y, 16, 16);
    },

    draw(ctx) {
        for (let e = 0; e < this.entities.length; e++)
            this.entities[e].draw(ctx)
    },

    loadAll() {
        mapManager.loadMap(this.levels_path[this.level]);
        spriteManager.loadAtlas("resources/sprites.json", "resources/sprites.png");
        gameManager.factory['Player'] = Player;
        // gameManager.factory['Finish'] = Finish;
        // gameManager.factory['Box'] = Box;
        mapManager.parseEntities();
        mapManager.draw(ctx);
        eventsManager.setup(canvas);
        // audioManager.init()
        // audioManager.playLevel()


    },
    go_next_level: function () {

        clearInterval(this.interval);
        this.level++;
        this.count_target = 0;
        this.entities = [];
        mapManager.reset()

        mapManager.loadMap(this.levels_path[this.level]);
        mapManager.parseEntities();
        ctx.clearRect(0, 0, mapManager.view.w, mapManager.view.h);
        mapManager.draw(ctx);
        gameManager.play();

    },
    reset_level() {
        this.level--;
        this.go_next_level();
    },
    play() {
        this.interval = setInterval(updateWorld, 10);
    },
    check_game_status() {
        let t = 0;
        this.entities.forEach(function (e) {
            if (e.name.match(/box_[\d]/) && e.status) t++;
        });

        if (t === this.count_target && this.count_target > 0) return true;
        return false;
    },
    end_game() {
        clearInterval(this.interval);
        mapManager.reset();
        gameManager.entities = []
        ctx.clearRect(0, 0, mapManager.view.w, mapManager.view.h);
        let text = "Вы прошли " + (this.level + 1) + " уровня за " + this.players_steps + " шагов";
        ctx.font = "22px Verdana";
        ctx.fillText(text, mapManager.view.w / 4, mapManager.view.h / 2)
        update_records();
    }

};

function updateWorld() {
    gameManager.update()
}

function update_records() {
    let arr;
    if (localStorage.hasOwnProperty('higthscores')) {
        arr = JSON.parse(localStorage.getItem('higthscores'));
        arr.push({name: name, score: gameManager.players_steps});
        arr.sort(function (a, b) {
            return a.score - b.score;
        });

        while (arr.length > 10) {
            arr.pop();
        }
        localStorage.setItem('higthscores', JSON.stringify(arr));
    } else {
        arr = [];
        arr.push({name: name, score: gameManager.players_steps});
        localStorage.setItem('higthscores', JSON.stringify(arr));
    }
    write_record();
}

function write_record() {
    let arr = JSON.parse(localStorage.getItem('higthscores'));
    let table = '<table class="simple-little-table">';
    for (let i = 0; i < arr.length; i++) {
        table += '<tr>';
        table += '<td>' + (Number(i) + 1) + '</td>';
        table += '<td>' + arr[i].name + '</td>';
        table += '<td>' + arr[i].score + '</td>';
        table += '</tr>';
    }
    table += '</table>';
    document.getElementById('table').innerHTML = table;
}


let name = localStorage.getItem("gamer_name");
gameManager.loadAll();
//write_record();
gameManager.play();
