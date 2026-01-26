dmx.Actions({

    'console.log': function(options) {
        console.log(this.parse(options.message));
    },

    'console.info': function(options) {
        console.info(this.parse(options.message));
    },

    'console.warn': function(options) {
        console.warn(this.parse(options.message));
    },

    'console.error': function(options) {
        console.error(this.parse(options.message));
    },

    'console.count': function(options) {
        console.count(this.parse(options.label));
    },

    'console.time': function(options) {
        console.time(this.parse(options.label));
    },

    'console.timeEnd': function(options) {
        console.timeEnd(this.parse(options.label));
    },

    'console.group': function(options) {
        console.group();
    },

    'console.groupEnd': function(options) {
        console.groupEnd();
    },

    'console.clear': function(options) {
        console.clear();
    }

});