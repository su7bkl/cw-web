import {mapManager} from "./mapManager.js";
import {applyTransparentColor} from "./converter.js"

export let spriteManager = {
    image: new Image(),
    sprites: [],
    imgLoaded: false,
    jsonLoaded: false,

    loadAtlas(atlasJSON, atlasImg) {

        fetch(atlasJSON)
            .then(response => response.json())
            .then(data => {
                this.sprites = data;
                this.jsonLoaded = true;
                this.loadImg(atlasImg);
            });
    },

    loadImg(imgName) {
        this.image.onload = () => {
            const transparentColor = "#FFFFFF";
            this.image = applyTransparentColor(this.image, transparentColor)
            this.imgLoaded = true;
        }
        this.image.src = imgName;
    },

    drawSprite(ctx, name, x, y, dx, dy) {
        if (!this.imgLoaded || !this.jsonLoaded) {
            setTimeout(() => {
                this.drawSprite(ctx, name, x, y, dx, dy);
            }, 10);
        } else {
            let sprite = this.getSprite(name);
            if (!mapManager.isVisible(x + dx, y + dy, sprite.width, sprite.height))
                return;
            x -= mapManager.view.x;
            y -= mapManager.view.y;
            ctx.drawImage(this.image, sprite.x, sprite.y, sprite.width, sprite.height, x + dx, y + dy, sprite.width, sprite.height);
        }
    },

    getSprite(name) {
        for (let i = 0; i < this.sprites.length; i++) {
            let s = this.sprites[i];
            if (s.name === name)
                return s;
        }
        return null;
    }

}
