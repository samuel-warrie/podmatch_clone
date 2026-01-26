// Trigger event on pushState and replaceState
// https://stackoverflow.com/questions/5129386/how-to-detect-when-history-pushstate-and-history-replacestate-are-used/25673911#25673911
{
    const _wr = function(type) {
        const orig = history[type];

        return function() {
            const rv = orig.apply(this, arguments);
            const e = new Event(type.toLowerCase());
            e.arguments = arguments;
            window.dispatchEvent(e);
            return rv;
        };
    };

    history.pushState = _wr('pushState');
    history.replaceState = _wr('replaceState');
}

window.onpopstate = function(e) {
    if (e.state && e.state.title) {
        document.title = e.state.title;
    }
};

document.documentElement.style.visibility = 'hidden';

dmx.ready(() => {
    // First execute all startup scripts that are registered
    const startup = Promise.all(dmx.__startup);

    // Now we can start App Connect
    startup.then(() => {
        if (dmx.app) {
            throw Error('App already running!');
        }

        history.replaceState({
            title: document.title
        }, '');

        const root = document.querySelector(':root[dmx-app], [dmx-app], :root[is="dmx-app"], [is="dmx-app"]');

        if (!root) {
            throw Error('App root not found!');
        }

        const App = dmx.Component('app');

        dmx.app = new App(root, dmx.global);

        document.documentElement.style.visibility = '';
    }).catch((err) => {
        // Something went wrong, log error and show page
        console.error(err);
        document.documentElement.style.visibility = '';
    })
});

dmx.extend = function() {
    // Variables
    var extended = {};
    var deep = false;
    var i = 0;
    var length = arguments.length;

    // Check if a deep merge
    if (Object.prototype.toString.call(arguments[0]) === '[object Boolean]') {
        deep = arguments[0];
        i++;
    }

    // Merge the object into the extended object
    var merge = function(obj) {
        for (var prop in obj) {
            // Prototype polution protection
            if (prop == '__proto__') continue;

            if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                // If deep merge and property is an object, merge properties
                if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') {
                    extended[prop] = dmx.extend(true, extended[prop], obj[prop]);
                } else {
                    if (obj[prop] != null) {
                        extended[prop] = obj[prop];
                    }
                }
            }
        }
    };

    // Loop through each object and conduct a merge
    for (; i < length; i++) {
        var obj = arguments[i];
        merge(obj);
    }

    return extended;
};

dmx.parseDate = function(obj) {
    if (typeof obj == 'string') {
        var d, struct, offset = 0,
            n = [1, 4, 5, 6, 7, 10, 11];

        if (obj.toLowerCase() == 'now') {
            return new Date();
        }

        if ((struct = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/.exec(obj))) {
            for (var i = 0, k;
                (k = n[i]); ++i) {
                struct[k] = +struct[k] || 0;
            }

            struct[2] = (+struct[2] || 1) - 1;
            struct[3] = +struct[3] || 1;

            if (struct[8] === undefined) {
                return new Date(struct[1], struct[2], struct[3], struct[4], struct[5], struct[6], struct[7]);
            } else {
                if (struct[8] !== 'Z' && struct[9] !== undefined) {
                    offset = struct[10] * 60 + struct[11];
                    if (struct[9] === '+') offset = 0 - offset;
                }

                return new Date(Date.UTC(struct[1], struct[2], struct[3], struct[4], struct[5] + offset, struct[6], struct[7]));
            }
        } else if ((struct = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?$/.exec(obj))) {
            var d = new Date();
            if (struct[5] === 'Z') {
                d.setUTCHours(+struct[1] || 0);
                d.setUTCMinutes(+struct[2] || 0);
                d.setUTCSeconds(+struct[3] || 0);
                d.setUTCMilliseconds(+struct[4] || 0);
            } else {
                d.setHours(+struct[1] || 0);
                d.setMinutes(+struct[2] || 0);
                d.setSeconds(+struct[3] || 0);
                d.setMilliseconds(+struct[4] || 0);
            }
            return d;
        }

        return new Date(obj);
    } else if (typeof obj == 'number') {
        return new Date(obj * 1000);
    } else {
        return new Date('');
    }
};

dmx.hashCode = function(o) {
    if (o == null) return 0;
    var str = JSON.stringify(o);
    var i, hash = 0;
    for (i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash);
};

dmx.randomizer = function(seed) {
    seed = +seed || 0;
    return function() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
};

dmx.repeatItems = function(repeat) {
    const items = [];

    if (repeat) {
        if (typeof repeat == 'object') {
            if (Array.isArray(repeat)) {
                for (let i = 0, l = repeat.length; i < l; i++) {
                    const value = cloneRepeatValue(repeat[i]);
                    items.push(buildRepeatItem(value, i, i));
                }
            } else {
                let i = 0;
                for (const key in repeat) {
                    if (Object.prototype.hasOwnProperty.call(repeat, key)) {
                        const value = cloneRepeatValue(repeat[key]);
                        items.push(buildRepeatItem(value, key, i));
                        i++;
                    }
                }
            }
        } else if (typeof repeat == 'number') {
            for (let n = 0; n < repeat; n++) {
                items.push({
                    $key: String(n),
                    $index: n,
                    $value: n + 1
                });
            }
        }
    }

    return items;
};

function cloneRepeatValue(value) {
    if (!value || typeof value !== 'object') {
        return value;
    }

    if (Array.isArray(value)) {
        return value.slice();
    }

    const proto = Object.getPrototypeOf(value);
    if (proto === Object.prototype || proto === null) {
        return Object.assign({}, value);
    }

    return dmx.clone(value);
}

function buildRepeatItem(value, key, index) {
    const entry = {};

    if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
            for (let i = 0, l = value.length; i < l; i++) {
                entry[i] = value[i];
            }
        } else {
            Object.assign(entry, value);
        }
    }

    entry.$key = key;
    entry.$index = index;
    entry.$value = value;

    return entry;
}

dmx.escapeRegExp = function(val) {
    // https://github.com/benjamingr/RegExp.escape
    return val.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
};

dmx.validate = function(node) {
    if (node.tagName == 'FORM') {
        Array.from(node.elements).forEach(node => node.dirty = true);
    }

    return node.checkValidity();
};

dmx.validateReset = function(node) {
    // reset validation?
};

(() => {
    const queue = [];

    window.addEventListener('message', event => {
        const sameContext = event.source === window || event.source == null;
        if (sameContext && event.data === 'dmxNextTick' && queue.length) {
            event.stopPropagation();
            while (queue.length) {
                const task = queue.shift();
                task.fn.call(task.context);
            };
        }
    }, true);

    dmx.nextTick = (fn, context) => {
        queue.push({
            fn,
            context
        });
        window.postMessage('dmxNextTick', '*');
    }
})();

dmx.requestUpdate = function() {
    console.warn('dmx.requestUpdate is deprecated.');
};