(() => {

    class Scope {

        constructor(initialData = {}, parent = null) {
            if (typeof initialData !== 'object') {
                initialData = {
                    $value: initialData
                };
            }

            this.data = dmx.signalProxy();
            Object.assign(this.data, initialData);
            this.parent = parent;
            this.seed = Math.random();
        }

        get(name) {
            if (this.data[name] !== undefined) {
                return this.data[name];
            }

            if (this.parent) {
                if (name == 'parent') {
                    return this.parent.data;
                }

                return this.parent.get(name);
            }

            return undefined;
        }

        set(name, value) {
            if (typeof name === 'object') {
                dmx.batch(() => {
                    for (var prop in name) {
                        if (name.hasOwnProperty(prop)) {
                            this.set(prop, name[prop]);
                        }
                    }
                });
            } else {
                this.data[name] = value;
            }
        }

        del(name) {
            delete this.data[name];
        }

    }

    dmx.global = new Scope();
    dmx.DataScope = function(data, parent) {
        return new Scope(data, parent || dmx.global);
    };

})();