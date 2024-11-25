import {eventsManager} from "./eventsManager.js";
import {spriteManager} from "./spriteManager.js";
import {mapManager} from "./mapManager.js";
import {soundManager} from "./soundManager.js";
import {Player, Hound, Bonus, Exit, Devil, Fireball} from "./objectProcessing.js";

let canvas = document.getElementById("canvas");
export let ctx = canvas.getContext("2d");


export let gameManager = {
    factory: {},
    entities: [],
    toKill: [],
    effects: [],
    player: null,
    levels: ["resources/maps/cw.json", "resources/maps/cw2.json"],
    level: 0,
    count_target: 0,
    score: 0,
    smelly_points: {},

    initPlayer(obj) {
        if (this.player) {
            obj.health = this.player.health;
            obj.mana = this.player.mana;
        }
        this.player = obj;
    },

    update() {
        this.effects = this.effects.filter(effect => effect.span > 0);
        for (let e of this.toKill) {
            this.entities = this.entities.filter(ent => ent.name !== e.name);

        }
        this.toKill = [];
        if (this.player === null)
            return;
        this.player.move_x = 0;
        this.player.move_y = 0;
        this.smelly_points[[this.player.pos_x, this.player.pos_y]] = 150;
        if (eventsManager.action["up"]) this.player.move_y = -1;
        if (eventsManager.action["down"]) this.player.move_y = 1;
        if (eventsManager.action["left"]) this.player.move_x = -1;
        if (eventsManager.action["right"]) this.player.move_x = 1;
        if (eventsManager.action["fight"]) this.player.attack();
        if (eventsManager.action["esc"]) this.end_game();
        if (eventsManager.action["reset"]) this.reset_level();


        mapManager.draw(ctx);
        mapManager.centerAt(this.player.pos_x, this.player.pos_y);
        this.entities.forEach(e => {
            e.update();
        });

        for (let i in this.smelly_points) {
            let [a, b] = i.split(',').map(Number);
            ctx.strokeStyle = "rgba(150, 75, 0, " + 1 / 150 * this.smelly_points[i] + ")";
            ctx.strokeRect(a - mapManager.view.x, b - mapManager.view.y, 4, 4);
            if (!--this.smelly_points[i]) {
                delete this.smelly_points[i];
            }
        }
        ctx.strokeStyle = "blue";
        this.draw(ctx);
        for (let i of this.entities) {
            let collider = i.getCollider();
            ctx.strokeRect(collider.x - mapManager.view.x, collider.y - mapManager.view.y, collider.x_e - collider.x,
                collider.y_e - collider.y);
        }
    },

    draw(ctx) {
        for (let e in this.effects) {
            if (this.effects[e].span--) {
                ctx.fillStyle = this.effects[e].color;
                ctx.beginPath();
                ctx.arc(...this.effects[e].params);
                ctx.fill();
            }
        }
        for (let e = 0; e < this.entities.length; e++)
            if (this.entities[e] != this.player)
                this.entities[e].draw(ctx);
        this.player.draw(ctx);
        ctx.fillStyle = '#ff00ff';
        ctx.font = '6px "Press Start 2P"';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'left';
        ctx.fillText( this.score.toString(), 10, 10);
    },

    loadAll() {
        mapManager.loadMap(this.levels[this.level]);
        spriteManager.loadAtlas("resources/sprites.json", "resources/sprites.png");
        gameManager.factory['Player'] = Player;
        gameManager.factory['Hound'] = Hound;
        gameManager.factory['Bonus'] = Bonus;
        gameManager.factory['Exit'] = Exit;
        gameManager.factory['Devil'] = Devil;
        gameManager.factory['Fireball'] = Fireball;
        mapManager.parseEntities();
        mapManager.draw(ctx);
        eventsManager.setup(canvas);
        soundManager.init()
        soundManager.loadArray(["resources/music/explosion.ogg",
            "/resources/music/evil_laugh_02.ogg",
            "/resources/music/big boss 2.ogg",
            "/resources/music/TownTheme.ogg",
            "/resources/music/foom_0.ogg",
            "/resources/music/wolf_monster.ogg"]);
    },

    nextLevel() {
        clearInterval(this.interval);
        if (this.level === 1) {
            this.end_game();
        }
        if (++this.level > this.levels.length) {
            this.end_game();
        }
        this.count_target = 0;
        this.entities = [];
        mapManager.reset();
        console.log(gameManager);
        mapManager.loadMap(this.levels[this.level]);
        mapManager.parseEntities();
        ctx.clearRect(0, 0, mapManager.view.w, mapManager.view.h);
        mapManager.draw(ctx);
        gameManager.start();

    },

    start() {
        if (this.level === 0){
            soundManager.play("/resources/music/TownTheme.ogg", {volume: 0.5, looping: true});
        }
        else if (this.level === 1) {
            soundManager.play("/resources/music/big boss 2.ogg", {volume: 0.2, looping: true})
        }
        this.interval = setInterval(updateWorld, 10);

    },

    end_game() {
        soundManager.stop();
        let name = localStorage.getItem("player_name") || "Unknown Player";
        updateRecords(name, gameManager.score);
        clearInterval(this.interval);
        mapManager.reset();
        gameManager.entities = []
    }

};

function updateWorld() {
    gameManager.update()
}

const font = new FontFace('"Press Start 2P"', 'url("resources/PressStart2P-Regular.ttf")');
font.load().then(() => {
    document.fonts.add(font);

}).catch(err => console.log(err));

document.getElementById("play").addEventListener("click", () => {
    localStorage.setItem("player_name", document.getElementById("player").value);
    mapManager.reset();
    soundManager.stop();
    gameManager.level = 0;
    gameManager.score = 0;
    gameManager.loadAll();
    gameManager.entities = [];
    gameManager.start();
});

document.getElementById("lvl1").addEventListener("click", () => {
    localStorage.setItem("player_name", document.getElementById("player").value);
    mapManager.reset();
    soundManager.stop();
    gameManager.level = 0;
    gameManager.score = 0;
    gameManager.loadAll();
    gameManager.entities = [];
    gameManager.start();
});

document.getElementById("lvl2").addEventListener("click", () => {
    localStorage.setItem("player_name", document.getElementById("player").value);
    mapManager.reset();
    soundManager.stop();
    gameManager.entities = [];
    gameManager.level = 1;
    gameManager.score = 0;
    gameManager.loadAll();
    gameManager.start();
});


function updateRecords(name, score) {
    let records = JSON.parse(localStorage.getItem("records")) || {};
    if (!records[name] || score > records[name]) {
        records[name] = score; // Update only if the new score is higher
        localStorage.setItem("records", JSON.stringify(records));
    }
    displayRecords(records);
}

function displayRecords(records) {
    const recordTableBody = document.querySelector(".result-table tbody");
    recordTableBody.innerHTML = "";

    const sortedRecords = Object.entries(records)
        .sort(([, scoreA], [, scoreB]) => scoreB - scoreA) // Sort by score (descending)
        .slice(0, 10);

    sortedRecords.forEach(([player, maxScore], index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>#${index + 1}</td>
            <td>${player}</td>
            <td>${maxScore} pts</td>
        `;
        recordTableBody.appendChild(row);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const records = JSON.parse(localStorage.getItem("records")) || {};
    displayRecords(records);
});
