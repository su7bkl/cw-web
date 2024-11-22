let mapManager = {
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
    view: {x: 0, y: 0, w: 300, h: 250},
    imgLoadCount: 0,


    hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255,
        };
    },

    applyTransparentColor(image, transparentColor) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const {r: tr, g: tg, b: tb} = this.hexToRgb(transparentColor);
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            if (r === tr && g === tg && b === tb) {
                data[i + 3] = 0;
            }
        }

        ctx.putImageData(imageData, 0, 0);
        const newImg = new Image();
        newImg.src = canvas.toDataURL();
        return newImg;
    },

    parseMap(tilesJSON) {
        mapManager.mapData = tilesJSON;
        mapManager.xCount = mapManager.mapData.width;
        mapManager.yCount = mapManager.mapData.height;
        mapManager.tSize.x = mapManager.mapData.tilewidth;
        mapManager.tSize.y = mapManager.mapData.tileheight;
        mapManager.mapSize.x = mapManager.xCount * mapManager.tSize.x;
        mapManager.mapSize.y = mapManager.yCount * mapManager.tSize.y;

        for (var i = 0; i < mapManager.mapData.tilesets.length; i++) {
            const t = mapManager.mapData.tilesets[i];
            const img = new Image();

            img.onload = () => {
                const transparentColor = t.transparentcolor || null;
                if (transparentColor) {
                    const processedImage = this.applyTransparentColor(img, transparentColor);
                    const ts = {
                        firstgid: t.firstgid,
                        image: processedImage,
                        name: t.name,
                        xCount: Math.floor(t.imagewidth / mapManager.tSize.x),
                        yCount: Math.floor(t.imageheight / mapManager.tSize.y),
                    };
                    mapManager.tilesets.push(ts);
                }
                mapManager.imgLoadCount++;
                if (mapManager.imgLoadCount === mapManager.mapData.tilesets.length) {
                    mapManager.imgLoaded = true;
                }
            };

            img.src = t.image;
        }
        mapManager.jsonLoaded = true;
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
                    if (!this.isVisible(pX, pY, this.tSize.x, this.tSize.y))
                        continue;
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

    // parseEntities() {
    //     if (!(mapManager.imgLoaded && mapManager.jsonLoaded)) {
    //         setTimeout(() => {
    //             this.parseEntities();
    //         }, 100);
    //     } else
    //         for (var j = 0; j < this.mapData.layers.length; j++)
    //             if (this.mapData.layers[j].type === 'objectgroup') {
    //                 let entities = this.mapData.layers[j];
    //                 for (var i = 0; i < entities.objects.length; i++) {
    //                     let e = entities.objects[i];
    //                     console.log(e);
    //                     try {
    //                         var obj = Object.create(gameManager.factory[e.type]);
    //                         obj.name = e.name;
    //                         obj.pos_x = e.x;
    //                         obj.pos_y = e.y;
    //                         obj.size_x = e.width;
    //                         obj.size_y = e.height;
    //                         gameManager.entities.push(obj);
    //                         if (obj.name === "player")
    //                             gameManager.initPlayer(obj);
    //                     } catch (ex) {
    //                         console.log("Error while creating: " + e.gid + "] " + e.type +
    //                             ", " + ex);
    //                     }
    //                 }
    //             }
    // },

    getTilesetIdx(x, y) {
        var wX = x;
        var wY = y;
        var idx = Math.floor(wY / this.tSize.y) * this.xCount + Math.floor(wX / this.tSize.x);
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
            this.view.y = y - (this.view.h / 2)
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

mapManager.loadMap('./cw.json');
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
mapManager.draw(ctx);
// mapManager.parseEntities();