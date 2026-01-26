dmx.Formatters('global', {

    // json(obj:Any):String
    json: function(obj) {
        return JSON.stringify(obj);
    },

    // log(obj:Any):Any
    log: function(obj) {
        console.log(obj);
        return obj;
    },

    // run(flow:Any, param:Any):Undefined
    run: function(flow, param) {
        var scope = dmx.DataScope({
            $param: param
        }, this);

        dmx.Flow.run(flow, scope);
    }

});