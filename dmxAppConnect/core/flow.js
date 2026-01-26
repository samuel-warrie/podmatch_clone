dmx.Flow = dmx.createClass({
    constructor: function(parent) {
        if (!(this instanceof dmx.Flow)) {
            return new dmx.Flow(parent);
        }

        if (!window.Promise) {
            console.warn('Promises are not supported, flows can not be used');
        }

        this._execStep = this._execStep.bind(this);

        this.scope = new dmx.DataScope({}, parent);
        this.output = {};
    },

    run: function(flow) {
        this.output = {};

        return this._exec(flow.exec || flow).then(() => {
            if (dmx.debug) {
                console.debug('finished', this.output);
            }
            return this.output;
        });
    },

    _each: function(arr, fn) {
        return Promise.resolve(arr).then((arr) => {
            arr = Array.isArray(arr) ? arr : [arr];

            return arr
                .reduce((prev, curr, i) => {
                    return prev.then(() => {
                        return fn(curr, i, arr.length).then((result) => {
                            if (result) {
                                arr[i] = result;
                            }
                        });
                    });
                }, Promise.resolve())
                .then(() => {
                    return arr;
                });
        });
    },

    _exec: function(flow) {
        if (flow.steps) {
            var promise = this._each(flow.steps, this._execStep);

            if (flow.catch) {
                promise.catch((err) => {
                    return this._each(flow.catch, self._execStep);
                });
            }

            return promise;
        }

        return this._each(flow, this._execStep);
    },

    _execStep: function(step) {
        for (let name in step) {
            if (step.hasOwnProperty(name) && dmx.__actions[name]) {
                const action = dmx.__actions[name].bind(this);
                const options = step[name];
                const timerName = name + Date.now();

                if (dmx.debug) {
                    console.debug('exec action', name, options);
                    console.time(timerName);
                }

                if (options.disabled) {
                    return Promise.resolve();
                }

                return Promise.resolve(action(options)).then((output) => {
                    if (dmx.debug) {
                        console.debug('finished exec action', name, options);
                        console.timeEnd(timerName);
                    }

                    if (options.name) {
                        if (dmx.debug) {
                            console.debug('set data', options.name, output);
                        }

                        this.scope.set(options.name, output);

                        if (options.output) {
                            if (dmx.debug) {
                                console.debug('set output', options.name, output);
                            }
                            this.output[options.name] = output;
                        }
                    }
                });
            } else {
                throw new Error('Action ' + name + ' was not found.');
            }
        }
    },

    parse: function(value) {
        if (value == null) return value;

        value = value.valueOf();

        if (typeof value == 'object') {
            var obj = value.slice ? [] : {};

            for (var key in value) {
                if (value.hasOwnProperty(key)) {
                    obj[key] = this.parse(value[key]);
                }
            }

            return obj;
        }

        if (typeof value == 'string' && value.indexOf('{{') != -1) {
            return dmx.parse(value, this.scope);
        }

        return value;
    },
});

dmx.Flow.run = function(flow, data) {
    var instance = new dmx.Flow(data);
    return instance.run(flow);
};