dmx.BaseComponent = dmx.createClass({
    constructor: function(node, parent) {
        this.$node = node;
        this.parent = parent;
        this.children = [];
        this.listeners = {};

        this.__disposables = [];
        this.__childDisposables = [];

        this.updatedProps = new Map();
        this.updateRequested = false;

        this.isInitialized = false;
        this.isDestroyed = false;

        this.props = new Proxy({}, {
            set: (target, prop, value, receiver) => {
                const oldValue = Reflect.get(target, prop, receiver);
                const ok = Reflect.set(target, prop, value, receiver);

                if (ok && this.isInitialized) {
                    if ((this.attributes[prop] && this.attributes[prop].alwaysUpdate) || !dmx.equal(oldValue, value)) {
                        this.requestUpdate(prop, oldValue);
                    }
                }

                return ok;
            },
        });

        this.data = dmx.signalProxy();
        this.seed = Math.random();

        this.name =
            node.getAttribute('id') ||
            node.getAttribute('name') ||
            (this.type && this.type.toLowerCase().replace(/^dmx-/, '')) ||
            '';
        this.name = this.name.replace(/[^\w]/g, '');

        try {
            this.$initialData();
            this.$parseAttributes(node);

            // Bind methods from prototype to instance
            /* DO NOT BIND METHODS TO INSTANCE!!!
            if (this.methods && typeof this.methods === 'object') {
              Object.keys(this.methods).forEach((methodName) => {
                if (typeof this.methods[methodName] === 'function') {
                  this[methodName] = this.methods[methodName].bind(this);
                }
              });
            }
            */

            this.init(node);
            if (this.render !== false) {
                this.render(node);
            }
            if (this.$node) {
                this.$customAttributes('mounted', this.$node);
                this.$node.dmxComponent = this;
                this.$node.dmxRendered = true;
            }
            this.isInitialized = true;
        } catch (e) {
            console.error(e);
        }
    },

    tag: null,
    initialData: {},
    attributes: {},
    methods: {},
    events: {
        destroy: Event,
    },

    render: function(node) {
        if (this.$node) {
            this.$parse();
        }
    },

    parse: function(expression, context) {
        const ctx = Object.assign({}, context || {});
        ctx.component = ctx.component || this;
        if (ctx.expression == null) {
            ctx.expression = expression;
        }

        return dmx.parse(expression, this, ctx);
    },

    // find component based on name inside children
    find: function(name) {
        if (this.name == name) return this;

        for (var i = 0; i < this.children.length; i++) {
            var found = this.children[i].find(name);
            if (found) return found;
        }

        return null;
    },

    init: dmx.noop,

    beforeUpdate: dmx.noop,
    update: dmx.noop,
    updated: dmx.noop,

    beforeDestroy: dmx.noop,
    destroy: dmx.noop,
    destroyed: dmx.noop,

    addEventListener: function(type, callback) {
        if (!(type in this.listeners)) {
            this.listeners[type] = new Set();
        }
        this.listeners[type].add(callback);
    },

    removeEventListener: function(type, callback) {
        if (!(type in this.listeners)) return;
        this.listeners[type].delete(callback);
    },

    dispatchEvent: function(event, props, data, nsp) {
        if (this.isDestroyed) return;

        if (typeof event == 'string') {
            var ComponentEvent = this.events[event] || CustomEvent;
            event = new ComponentEvent(event, props);
        }

        if (!(event.type in this.listeners)) return true;

        event.nsp = nsp;
        event.$data = data || {};
        for (let listener of this.listeners[event.type]) {
            if (listener.call(this, event) === false) {
                event.preventDefault();
            }
        }

        return !event.defaultPrevented;
    },

    $createChild: function(name, node) {
        var Component = dmx.__components[name];
        var component = new Component(node, this);
        this.$addChild(component, component.name);
    },

    $addChild: function(child, name) {
        this.children.push(child);
        if (name) {
            if (this.data[name] && dmx.debug) {
                console.warn('Duplicate name "' + name + '" found, component not added to scope.');
                //return;
            }
            this.set(name, child.data);
        }
    },

    $removeChild: function(child) {
        // remove from children collection
        if (this.children.includes(child)) {
            this.children.splice(this.children.indexOf(child), 1);
        }
        // remove from data
        if (child.name && this.data[child.name]) {
            this.del(child.name);
        }
    },

    $customAttributes: function(hook, node, attributes) {
        const toCamelCase = (s) => s.replace(/-./g, (x) => x[1].toUpperCase());
        if (!attributes) attributes = dmx.dom.getAttributes(node);

        attributes.forEach((attr) => {
            if (node == this.$node) {
                if (attr.name == 'bind' && this.attributes[toCamelCase(attr.argument)]) {
                    return;
                }

                if (attr.name == 'on' && this.events[attr.argument]) {
                    return;
                }
            }

            if (dmx.__attributes[hook][attr.name]) {
                this.__inChild = node != this.$node;
                const dispose = dmx.__attributes[hook][attr.name].call(this, node, attr);
                if (dispose) {
                    this[this.__inChild ? '__childDisposables' : '__disposables'].push(dispose);
                }
            }
        });

        this.__inChild = null;
    },

    $parseTextNode(node) {
        if (node.nodeType !== 3) return;

        if (dmx.reExpression.test(node.nodeValue)) {
            const host = node.parentElement || node;
            const parts = node.nodeValue
                .replace(dmx.reExpressionReplace, (_, expression) => {
                    return `##split##${expression}##split##`;
                })
                .split('##split##');

            const fragment = document.createDocumentFragment();
            parts.forEach((part, i) => {
                const textNode = document.createTextNode(part);
                fragment.appendChild(textNode);

                if (i % 2) {
                    const expression = part;
                    this.$watch(expression, (value) => {
                        textNode.nodeValue = value;
                    }, {
                        node: host,
                        type: 'text',
                        description: 'text content binding',
                    });
                }
            });

            node.parentNode.replaceChild(fragment, node);
        }
    },

    $parse: function(node) {
        node = node || this.$node;

        if (!node) return;

        if (node.nodeType === 3) {
            return this.$parseTextNode(node);
        }

        if (node.nodeType !== 1) return;

        if (dmx.config.mapping) {
            Object.keys(dmx.config.mapping).forEach((map) => {
                dmx.array(node.querySelectorAll(map)).forEach((node) => {
                    if (!node.hasAttribute('is')) {
                        node.setAttribute('is', 'dmx-' + dmx.config.mapping[map]);
                    }
                });
            });
        }

        dmx.dom.walk(
            node,
            function(node) {
                if (node == this.$node) {
                    // skip current node
                    return;
                }

                // Element Node
                if (node.nodeType === 1) {
                    var tagName = node.tagName.toLowerCase();
                    var attributes = dmx.dom.getAttributes(node);

                    if (node.hasAttribute('is')) {
                        tagName = node.getAttribute('is');
                    }

                    if (dmx.reIgnoreElement.test(tagName)) {
                        // ignore element
                        return false;
                    }

                    // Google reCAPTCHA support
                    if (window.grecaptcha && node.classList.contains("g-recaptcha")) {
                        const renderRecaptcha = () => {
                            if (node.querySelector('[name="g-recaptcha-response"]')) return;
                            if (typeof grecaptcha.render === 'function') {
                                grecaptcha.render(node);
                            } else if (console && typeof console.warn === 'function') {
                                console.warn('grecaptcha.render is not available; skipping reCAPTCHA initialization');
                            }
                        };

                        if (typeof grecaptcha.ready === 'function') {
                            grecaptcha.ready(renderRecaptcha);
                        } else {
                            renderRecaptcha();
                        }
                    }

                    this.$customAttributes('before', node, attributes);
                    var idx = attributes.findIndex((attr) => attr.name === 'repeat');
                    if (idx !== -1) return false;

                    if (dmx.rePrefixed.test(tagName)) {
                        tagName = tagName.replace(/^dmx-/i, '');

                        if (tagName in dmx.__components) {
                            node.isComponent = true;
                            if (!node.dmxRendered) {
                                this.$createChild(tagName, node);
                            } else if (window.__WAPPLER__) {
                                // This breaks some components in design view
                                // causes flows to trigger constantly
                                // components ofter have there own parsing and this breaks it
                                if (node.dmxComponent && node.dmxComponent.$parse) {
                                    // for now ignode specific for flows with script tag
                                    if (!dmx.reIgnoreElement.test(node.tagName)) {
                                        node.dmxComponent.$parse();
                                    }
                                }
                            }
                            return false;
                        } else {
                            console.warn('Unknown component found! ' + tagName);
                            return;
                        }
                    }

                    this.$customAttributes('mounted', node, attributes);
                }

                // Text Node
                if (node.nodeType === 3) {
                    this.$parseTextNode(node);
                }
            },
            this
        );
    },

    $update: function(idents) {
        console.warn('Component.$update is deprecated.');
    },

    $parseAttributes: function(node) {
        const toKebabCase = (s) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

        if (!this.attributes) {
            return;
        }

        for (const name in this.attributes) {
            const opts = this.attributes[name];
            if (!opts) {
                continue;
            }
            const attrName = toKebabCase(name);

            const hasDefault = Object.prototype.hasOwnProperty.call(opts, 'default');
            let value = hasDefault ? dmx.clone(opts.default) : undefined;

            // static
            if (node.hasAttribute(attrName)) {
                if (opts.type === Boolean) {
                    value = node.getAttribute(attrName) !== 'false';
                } else {
                    value = node.getAttribute(attrName);

                    if (opts.type === Number) {
                        // Only set number is a valid number is given
                        if (value && isFinite(Number(value))) {
                            value = Number(value);
                        }
                    }

                    if (opts.type === Object || opts.type === Array) {
                        try {
                            value = JSON.parse(value);
                        } catch (err) {
                            console.warn('Invalid attribute value, expected a JSON string got ' + value);
                        }
                    }

                    if (opts.enum && !opts.enum.includes(value)) {
                        value = hasDefault ? dmx.clone(opts.default) : value;
                    }

                    if (opts.validate && !opts.validate(value)) {
                        value = hasDefault ? dmx.clone(opts.default) : value;
                    }
                }

                this.props[name] = value;
                //opts.default = value;
            }

            // dynamic
            if (node.hasAttribute('dmx-bind:' + attrName)) {
                const expression = node.getAttribute('dmx-bind:' + attrName);

                this.$watch(expression, (value) => {
                    if (value === undefined) {
                        value = hasDefault ? dmx.clone(opts.default) : value;
                    } else if (opts.type === Boolean) {
                        value = !!value;
                    } else {
                        if (value != null) {
                            if (opts.type === Number) {
                                if (typeof value === 'string') {
                                    if (value && isFinite(Number(value))) {
                                        value = Number(value);
                                    } else {
                                        value = hasDefault ? dmx.clone(opts.default) : value;
                                    }
                                } else if (typeof value !== 'number' || !isFinite(Number(value))) {
                                    value = hasDefault ? dmx.clone(opts.default) : value;
                                }
                            }

                            if (opts.type === String) {
                                value = String(value);
                            }

                            if (opts.type === Object && typeof value !== 'object') {
                                value = hasDefault ? dmx.clone(opts.default) : value;
                            }

                            if (opts.type === Array) {
                                value = Array.from(value);
                            }
                        }

                        if (opts.enum && !opts.enum.includes(value)) {
                            value = hasDefault ? dmx.clone(opts.default) : value;
                        }

                        if (opts.validate && !opts.validate(value)) {
                            value = hasDefault ? dmx.clone(opts.default) : value;
                        }
                    }

                    this.props[name] = value;
                }, {
                    node,
                    attribute: 'dmx-bind:' + attrName,
                    type: 'attribute',
                });
            } else if (hasDefault || value !== undefined) {
                this.props[name] = value;
            }
        }

        for (const event in this.events) {
            if (node.hasAttribute('on' + event)) {
                this.__disposables.push(dmx.eventListener(this, event, Function('event', node.getAttribute('on' + event)), {}));
            }
        }

        dmx.dom.getAttributes(node).forEach((attr) => {
            if (attr.name == 'on' && this.events[attr.argument]) {
                this.__disposables.push(dmx.eventListener(
                    this,
                    attr.argument,
                    (event) => {
                        if (event.originalEvent) {
                            event = event.originalEvent;
                        }

                        var returnValue = dmx.parse(
                            attr.value,
                            dmx.DataScope({
                                    $event: event.$data,
                                    $originalEvent: event,
                                },
                                this
                            ), {
                                component: this,
                                node,
                                attribute: attr.fullName,
                                type: 'event',
                                description: `dmx-on:${attr.argument}`,
                            }
                        );

                        return returnValue;
                    },
                    attr.modifiers
                ));
            }
        });
    },

    requestUpdate: function(prop, oldValue) {
        //console.log(`request Update ${this.name} (${prop}: ${oldValue} => ${this.prop})`);
        if (!this.performUpdate) return;

        if (!this.updatedProps.has(prop)) {
            this.updatedProps.set(prop, oldValue);
        }

        if (!this.updateRequested) {
            //console.log('queue Microtask', this.name, this.updateRequested);
            //queueMicrotask(() => {
            dmx.nextTick(() => {
                //console.log('exec Microtask', this.name, this.updateRequested);
                if (this.isDestroyed) return;
                this.updateRequested = false;
                this.performUpdate(this.updatedProps);
                this.updatedProps.clear();
            });
        }

        this.updateRequested = true;
    },

    $initialData: function() {
        Object.assign(
            this.data, {
                $type: this.type
            },
            typeof this.initialData == 'function' ? this.initialData() : this.initialData
        );

        Object.keys(this.methods).forEach(function(method) {
            var self = this;
            this.data['__' + method] = function() {
                return self.methods[method].apply(self, Array.prototype.slice.call(arguments, 1));
            };
        }, this);
    },

    // alias for $watch
    $addBinding: function(expression, cb) {
        this.$watch(expression, cb);
    },

    $watch: function(expression, cb, options) {
        const prop = this.__inChild ? '__childDisposables' : '__disposables';
        if (!this[prop]) this[prop] = [];
        let init = true;
        const context = Object.assign({
            component: this,
            expression
        }, options || {});

        const evaluate = (phase) => {
            try {
                const value = this.parse(expression, context);
                return value;
            } catch (error) {
                const hasErrorsApi = dmx.errors && typeof dmx.errors === 'object';
                const ExpressionErrorCtor = hasErrorsApi && dmx.errors.ExpressionError;
                const FormatterErrorCtor = hasErrorsApi && dmx.errors.FormatterError;
                const isFormatterError = FormatterErrorCtor && error instanceof FormatterErrorCtor;

                if (isFormatterError) {
                    throw error;
                }

                const isExpressionError = error && (error.name === 'ExpressionError' || (ExpressionErrorCtor && error instanceof ExpressionErrorCtor));

                if (!isExpressionError) {
                    throw error;
                }

                const strict = options && options.strict;
                const throwErrorsEnabled = !!(dmx && dmx.config && dmx.config.throwErrors);

                if (strict || throwErrorsEnabled) {
                    throw error;
                }

                if (typeof this._captureExpressionError === 'function') {
                    try {
                        this._captureExpressionError(error);
                    } catch (captureErr) {
                        if (console && console.warn) {
                            console.warn('Failed to capture expression error', captureErr);
                        }
                    }
                }

                const shouldLogExpressionError = !(
                    dmx &&
                    dmx.config &&
                    dmx.config.logExpressionErrors === false
                );

                if (shouldLogExpressionError && console && console.error && (!options || options.log !== false)) {
                    console.error(error.message || error, error.details || error.originalError || undefined);
                }

                return undefined;
            }
        };

        this[prop].push(
            dmx.effect(() => {
                if (init) {
                    cb.call(this, evaluate('init'));
                    init = false;
                } else {
                    const value = evaluate('update');
                    queueMicrotask(() => {
                        cb.call(this, value);
                    });
                }
            })
        );
    },

    _captureExpressionError: function(error) {
        this.lastExpressionError = error;
        this.lastExpressionErrorAt = Date.now();
    },

    $destroy: function() {
        this.dispatchEvent('destroy');
        this.beforeDestroy();
        this.destroy();
        this.isDestroyed = true;
        if (this.parent && this.parent.$removeChild) {
            this.parent.$removeChild(this);
        }
        this.$destroyChildren();
        this.__disposables.forEach((dispose) => dispose());
        this.__disposables = [];
        if (this.$node) {
            this.$node.dmxComponent = null;
            this.$node = null;
        }
        this.parent = null;
        this.data = {};
        this.destroyed();
    },

    $destroyChildren: function() {
        Array.from(this.children).forEach((child) => {
            child.$destroy();
        });
        this.children = [];

        this.__childDisposables.forEach((dispose) => dispose());
        this.__childDisposables = [];
    },

    get: function(name, ignoreParents) {
        if (this.data[name] !== undefined) {
            return this.data[name];
        }

        if (this.parent && ignoreParents !== true) {
            if (name == 'parent') {
                return this.parent.data;
            }

            return this.parent.get(name);
        }

        return undefined;
    },

    add: function(name, value) {
        if (this.data[name]) {
            if (Array.isArray(this.data[name])) {
                this.data[name].push(value);
            } else {
                this.data[name] = [this.data[name], value];
            }
        } else {
            this.set(name, value);
        }
    },

    set: function(name, value) {
        if (typeof name == 'object') {
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
    },

    del: function(name) {
        delete this.data[name];
    },
});