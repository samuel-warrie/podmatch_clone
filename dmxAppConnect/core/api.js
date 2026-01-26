// Create Class
dmx.createClass = (proto, parent) => {
    const Cls = function() {
        if (proto.constructor) {
            proto.constructor.apply(this, arguments);
        }
    };

    if (parent && parent.prototype) {
        Cls.prototype = Object.create(parent.prototype);
    }

    Object.assign(Cls.prototype, proto);

    Cls.prototype.constructor = Cls;

    return Cls;
};

dmx.__ready = false;
dmx.ready = (fn) => {
    if (dmx.__ready) {
        fn();
        return;
    }

    document.addEventListener('DOMContentLoaded', () => {
        dmx.__ready = true;
        fn();
    }, {
        once: true
    });
};

// Config
dmx.Config = (config) => {
    Object.assign(dmx.config, config)
};

// Create/get component
dmx.Component = (name, proto) => {
    if (proto) {
        const parentComponent = proto.extends ? dmx.Component(proto.extends) : dmx.BaseComponent;

        if (typeof proto.initialData != 'function') {
            proto.initialData = Object.assign({}, parentComponent.prototype.initialData, proto.initialData);
        }
        proto.attributes = Object.assign({}, parentComponent.prototype.attributes, proto.attributes);
        proto.methods = Object.assign({}, parentComponent.prototype.methods, proto.methods);
        proto.events = Object.assign({}, parentComponent.prototype.events, proto.events);

        if (!proto.hasOwnProperty('constructor')) {
            proto.constructor = function(node, parent) {
                parentComponent.call(this, node, parent);
            }
        }

        proto.type = name;

        const Component = dmx.createClass(proto, parentComponent);
        Component.extends = proto.extends;

        dmx.__components[name] = Component;
    }

    return dmx.__components[name];
};

// Create attribute
dmx.Attribute = (name, hook, fn) => {
    if (!dmx.__attributes[hook]) {
        dmx.__attributes[hook] = Object.create(null);
    }
    dmx.__attributes[hook][name] = fn;
};

// Create/get formatter(s)
dmx.Formatter = (type, name, fn) => {
    dmx.__formatters[type][name] = fn;
}
dmx.Formatters = (type, formatters) => {
    for (const name in formatters) {
        dmx.Formatter(type, name, formatters[name]);
    }
};

// Create/get adapter
dmx.Adapter = (type, name, fn) => {
    if (!dmx.__adapters[type]) {
        dmx.__adapters[type] = Object.create(null);
    }
    if (fn) dmx.__adapters[type][name] = fn;
    return dmx.__adapters[type][name];
};

// Create action(s)
dmx.Action = (name, action) => {
    dmx.__actions[name] = action;
};
dmx.Actions = (actions) => {
    for (const name in actions) {
        dmx.Action(name, actions[name]);
    }
};

// Startup
dmx.Startup = (promise) => {
    dmx.__startup.add(promise)
};