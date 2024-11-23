import {gameManager} from './gameManager.js';
import {physicsManager} from './physicsManager.js'
import {applyTransparentColor} from "./converter.js"

export let mapManager = {
    mapData: null,
    tLayer: null,
    bLayer: null,
    xCount: 0,
    yCount: 0,
    tSize: {x: 16, y: 16},
    mapSize: {x: 16, y: 16},
    tilesets: [],
    jsonLoaded: false,
    imgLoaded: false,
    view: {x: 0, y: 0, w: 200, h: 100},
    imgLoadCount: 0,


    parseMap(tilesJSON) {
        this.mapData = tilesJSON;
        this.xCount = this.mapData.width;
        this.yCount = this.mapData.height;
        this.tSize.x = this.mapData.tilewidth;
        this.tSize.y = this.mapData.tileheight;
        this.mapSize.x = this.xCount * this.tSize.x;
        this.mapSize.y = this.yCount * this.tSize.y;

        for (var i = 0; i < this.mapData.tilesets.length; i++) {
            const t = this.mapData.tilesets[i];
            const img = new Image();

            img.onload = () => {
                const transparentColor = t.transparentcolor;
                const processedImage = applyTransparentColor(img, transparentColor);
                const ts = {
                    firstgid: t.firstgid,
                    image: processedImage,
                    name: t.name,
                    xCount: Math.floor(t.imagewidth / this.tSize.x),
                    yCount: Math.floor(t.imageheight / this.tSize.y),
                };
                this.tilesets.push(ts);

                this.imgLoadCount++;
                if (this.imgLoadCount === this.mapData.tilesets.length) {
                    this.imgLoaded = true;
                }
            };

            img.src = "resources/maps/" + t.image;
        }
        this.jsonLoaded = true;
    },


    loadMap(path) {
        fetch(path)
            .then(res => res.json())
            .then(data => {
                this.parseMap(data);
            })

            .catch(err => {
            });
    },

    draw(ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!(mapManager.imgLoaded && mapManager.jsonLoaded)) {
            setTimeout(() => {
                this.draw(ctx);
            }, 10);
        } else {
            if (mapManager.tLayer === null || mapManager.bLayer === null)
                for (let id = 0; id < mapManager.mapData.layers.length; id++) {
                    var layer = mapManager.mapData.layers[id];
                    if (layer.type === "tilelayer") {
                        if (layer.name === "static_objects") {
                            mapManager.tLayer = layer;
                            continue;
                        }
                        if (layer.name === "background") {
                            mapManager.bLayer = layer;
                        }
                    }

                }

            for (let i = 0; i < mapManager.tLayer.data.length; i++) {
                if (mapManager.bLayer.data[i] !== 0) {
                    let tile = this.getTile(mapManager.bLayer.data[i]);
                    let pX = (i % mapManager.xCount) * mapManager.tSize.x;
                    let pY = Math.floor(i / mapManager.xCount) * mapManager.tSize.y;
                    if (!this.isVisible(pX, pY, this.tSize.x, this.tSize.y)) {
                        continue;
                    }
                    pX -= mapManager.view.x;
                    pY -= mapManager.view.y;
                    ctx.drawImage(tile.img, tile.px, tile.py, mapManager.tSize.x, mapManager.tSize.y, pX, pY, mapManager.tSize.x, mapManager.tSize.y);
                }

                if (mapManager.tLayer.data[i] !== 0) {
                    let tile = this.getTile(mapManager.tLayer.data[i]);
                    let pX = (i % mapManager.xCount) * mapManager.tSize.x;
                    let pY = Math.floor(i / mapManager.xCount) * mapManager.tSize.y;
                    if (!this.isVisible(pX, pY, this.tSize.x, this.tSize.y))
                        continue;
                    pX -= mapManager.view.x;
                    pY -= mapManager.view.y;
                    ctx.strokeStyle = 'red';
                    ctx.strokeRect(pX, pY, mapManager.tSize.x, mapManager.tSize.y);
                    ctx.drawImage(tile.img, tile.px, tile.py, mapManager.tSize.x, mapManager.tSize.y, pX, pY, mapManager.tSize.x, mapManager.tSize.y);
                }
            }
        }
    },

    getTile(tilelndex) {
        var tile = {
            img: null,
            px: 0, py: 0
        };
        var tileset = this.getTileset(tilelndex);
        tile.img = tileset.image;
        var id = tilelndex - tileset.firstgid;
        var x = id % tileset.xCount;
        var y = Math.floor(id / tileset.xCount);
        tile.px = x * mapManager.tSize.x;
        tile.py = y * mapManager.tSize.y;
        return tile;
    },


    getTileset(tileIndex) {
        for (var i = mapManager.tilesets.length - 1; i >= 0; i--)
            if (mapManager.tilesets[i].firstgid <= tileIndex) {
                return mapManager.tilesets[i];
            }
        return null;
    },

    isVisible(x, y, width, height) {
        if (x + width < this.view.x || y + height < this.view.y || x > this.view.x + this.view.w || y > this.view.y + this.view.h)
            return false;
        return true;
    },

    parseEntities() {
        if (!(mapManager.imgLoaded && mapManager.jsonLoaded)) {
            setTimeout(() => {
                this.parseEntities();
            }, 100);
        } else
            for (let j = 0; j < this.mapData.layers.length; j++)
                if (this.mapData.layers[j].type === 'objectgroup') {
                    let entities = this.mapData.layers[j];
                    for (let i = 0; i < entities.objects.length; i++) {
                        let e = entities.objects[i];
                        console.log(e);
                        try {
                            let obj = Object.create(gameManager.factory[e.type]);
                            obj.name = e.name;
                            obj.pos_x = e.x;
                            obj.pos_y = e.y;
                            obj.size_x = e.width;
                            obj.size_y = e.height;
                            gameManager.entities.push(obj);
                            if (obj.name === "player")
                                gameManager.initPlayer(obj);
                        } catch (ex) {
                            console.log("Error while creating: " + e.gid + "] " + e.type +
                                ", " + ex);
                        }
                    }
                }
    },

    getTilesetIdx(x, y) {
        let idx = Math.floor(y / this.tSize.y) * this.xCount + Math.floor(x / this.tSize.x);
        return this.tLayer.data[idx]
    },

    centerAt(x, y) {
        if (x < this.view.w / 2)
            this.view.x = 0;
        else if (x > this.mapSize.x - this.view.w / 2)
            this.view.x = this.mapSize.x - this.view.w;
        else
            this.view.x = x - (this.view.w / 2)
        if (y < this.view.h / 2)
            this.view.y = 0;
        else if (y > this.mapSize.y - this.view.h / 2)
            this.view.y = this.mapSize.y - this.view.h;
        else
            this.view.y = y - Math.floor(this.view.h / 2)
    },

    reset() {
        this.mapData = null;
        this.tLayer = null;
        this.bLayer = null;
        this.xCount = 0;
        this.yCount = 0;
        this.tSize = {x: 64, y: 64};
        this.mapSize = {x: 64, y: 64};
        this.tilesets = [];
        this.imgLoadCount = 0;
        this.imgLoaded = false;
        this.jsonLoaded = false;
        this.view = {x: 0, y: 0, w: 800, h: 576};
    }
}

// mapManager.loadMap('./cw.json');
// const canvas = document.getElementById("canvas");
// const ctx = canvas.getContext("2d");
// mapManager.draw(ctx);
// // mapManager.parseEntities();