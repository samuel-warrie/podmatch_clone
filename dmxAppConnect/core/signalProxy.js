dmx.signalProxy = function(o = {}) {
    const signals = new Map();
    const equals = (a, b) => {
        return dmx.equal(a, b);
    };

    return new Proxy(o, {
        has(target, prop) {
            // when checking for a prop, always return true
            return true;
        },

        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);

            if (typeof value == 'function' || typeof prop != 'string' || prop.startsWith('_')) {
                // ignore private props
                return value;
            }

            if (!signals.has(prop)) {
                signals.set(prop, dmx.signal(value, {
                    equals
                }));
            }

            return signals.get(prop).value;
        },

        set(target, prop, value, receiver) {
            const ok = Reflect.set(target, prop, value, receiver);

            if (ok) {
                if (signals.has(prop)) {
                    signals.get(prop).value = value;
                }
            }

            return ok;
        },

        deleteProperty(target, prop) {
            const ok = Reflect.deleteProperty(target, prop);

            if (ok && signals.has(prop)) {
                signals.get(prop).value = undefined;
            }

            return ok;
        }
    });
};