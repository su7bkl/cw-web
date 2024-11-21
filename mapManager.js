let mapManager = {
    mapData: null,
    tLayer: null,
    xCount: 0,
    yCount: 0,
    tSize: {x: 16, y: 16},
    mapSize: {x: 16, y: 16},
    tilesets: [],
    jsonLoaded: false,

    loadMap(mapManager, path) {
        fetch(path)
            .then(res => res.json())
            .then(data => {
                mapManager.parseMap(data);
            })
            .catch(err => {
            });
    },

    parseMap(tilesJSON) {
        this.mapData = tilesJSON;
        this.xCount = this.mapData.width;
        this.yCount = this.mapData.height;
        this.tSize.x = this.mapData.tilewidth;
        this.tSize.y = this.mapData.tileheight;
        this.mapSize.x = this.xCount * this.tSize.x;
        this.mapSize.y = this.yCount * this.tSize.y;
        for (var i = 0; i < this.mapData.tilesets.length; i++) {
            var img = new Image();
            img.onload = function () {
                mapManager.imgLoadCount++;
                if (mapManager.imgLoadCount ===
                    mapManager.mapData.tilesets.length
            )
                {
                    mapManager.imgLoaded = true;
                }
            };
            img.src = this.mapData.tilesets[i].image;
            var t = this.mapData.tilesets[i];
            var ts = {
                firstgid: t.firstgid,
                image: img,
                name: t.name,
                xCount: Math.floor(t.imagewidth / mapManager.tSize.x),
                yCount: Math.floor(t.imageheight / mapManager.tSize.y)
            };
            this.tilesets.push(ts);
        }
        this.jsonLoaded = true;
    }
};




mapManager.loadMap( mapManager, './cw.json');