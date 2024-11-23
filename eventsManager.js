export let eventsManager = {
    bind: {},
    action: {},
    setup: function (canvas) {
        this.bind[27] = "esc";
        this.bind[87] = "up";
        this.bind[65] = "left";
        this.bind[83] = "down";
        this.bind[68] = "right";
        this.bind[82] = "fight";
        this.bind[84] = "stabilize";
        document.body.addEventListener("keydown", this.onKeyDown);
        document.body.addEventListener("keyup", this.onKeyUp);

    },
    onKeyDown: function (event) {
        let action = eventsManager.bind[event.keyCode];
        if (action)
            eventsManager.action[action] = true;
    },
    onKeyUp: function (event) {
        let action = eventsManager.bind[event.keyCode];
        if (action)
            eventsManager.action[action] = false;
    },

}
