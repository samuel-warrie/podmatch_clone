dmx.Formatters('object', {

    // keys():Array
    keys(object) {
        return Object.keys(object);
    },

    // values():Array
    values(object) {
        return Object.keys(object).map(key => object[key]);
    },

    // hasKey(key:String):Boolean
    hasKey(object, key) {
        return Object.keys(object).includes(key);
    },

    // hasValue(value:Any):Boolean
    hasValue(object, value) {
        return Object.values(object).includes(value);
    },

    //getValueOrKey():any
    getValueOrKey(object, key) {
        return object[key] != null ? object[key] : key;
    },

});