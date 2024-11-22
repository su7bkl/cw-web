var Entity = {
    pos_x: 0,
    pos_y: 0,
    size_x: 0,
    size_y: 0,
    extend: function (extendProto) {
        var object = Object.create(this);
        for (var property in extendProto){
            if(this.hasOwnProperty(property) || typeof object[property] === 'undefined'){
                object[property] = extendProto[property];
            }
        }
        return object;
    }
}
var Player = Entity.extend({ lifetime: 100 });