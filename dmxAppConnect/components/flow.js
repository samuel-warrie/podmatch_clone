dmx.Component('flow', {

    initialData: {
        data: null,
        running: false,
        lastError: null,
    },

    attributes: {
        src: {
            type: String,
            default: null,
        },

        flow: {
            type: [Array, Object],
            default: null,
        },

        preload: {
            type: Boolean,
            default: false,
        },

        autorun: {
            type: Boolean,
            default: false,
        },

        params: {
            type: Object,
            default: {},
        },
    },

    methods: {
        run(param, throwError) {
            const propagate = throwError === undefined ? true : throwError;
            return this._run(param, propagate);
        },

        runSub(param) {
            return this._runSub(param);
        },
    },

    events: {
        start: Event,
        done: Event,
        error: Event,
    },

    render: false,

    init(node) {
        if (this.props.flow) {
            // Flow definition provided via attribute (for testing/dynamic flows)
            this._flow = this.props.flow;
            if (this.props.autorun) this._run();
        } else if (this.props.src) {
            if (this.props.preload || this.props.autorun) {
                this._load(this.props.src, this.props.autorun).catch(console.error);
            }
        } else {
            try {
                this._flow = this._parse(node.textContent);
                if (this.props.autorun) this._run();
            } catch (err) {
                console.error(err);
            }
        }
    },

    destroy() {
        this._destroyed = true;
    },

    // TODO: deprecate this, use JSON or expression instead
    $parseAttributes(node) {
        dmx.BaseComponent.prototype.$parseAttributes.call(this, node);

        dmx.dom.getAttributes(node).forEach(({
            name,
            argument,
            value
        }) => {
            if (argument && value && name == 'param') {
                this.$watch(value, value => {
                    this.props.params = Object.assign({}, this.props.params, {
                        [argument]: value
                    });
                }, {
                    node,
                    attribute: `dmx-param:${argument}`,
                    type: 'attribute',
                    description: 'dmx-flow param binding',
                });
            }
        });
    },

    _load(url, run) {
        return fetch(url).then(response => {
            if (!response.ok || response.status >= 400) {
                throw Error(`Could not load flow ${this.name}, status ${response.status} ${response.statusText}`);
            }

            return response.text()
        }).then(text => {
            this._flow = this._parse(text);
            if (run) this._run();
        });
    },

    _parse(str) {
        return (window.Hjson ? Hjson : JSON).parse(str);
    },

    _runSub(param) {
        if (!this._flow) {
            if (this.props.src) {
                return this._load(this.props.src).then(() => {
                    this._runFlow(param);
                });
            }

            throw Error('No flow');
        }

        return this._runFlow(param);
    },

    _run(param, throwError = true) {
        if (!this._flow) {
            if (this.props.src) {
                return this._load(this.props.src).then(() => {
                    this._run(param, throwError);
                }).catch(console.error);
            }

            console.warn(`Flow ${this.name} is missing.`);
            return;
        }

        if (this.data.running) {
            console.info(`Can't run flow ${this.name} when a previous run didn't finish.`);
            return;
        }

        this.set({
            running: true,
            lastError: null,
        });

        this.dispatchEvent('start');

        if (dmx.debug) {
            console.debug(`Running flow ${this.name} with params`, param);
            console.time(`Flow ${this.name}`);
        }
        return this._runFlow(param).then(data => {
            if (dmx.debug) {
                console.debug(`Flow ${this.name} finished`, data);
                console.timeEnd(`Flow ${this.name}`);
            }
            this.set({
                running: false,
                data: data
            });

            this.dispatchEvent('done');

            return data;
        }).catch(err => {
            this.set({
                running: false,
                lastError: err && err.message,
            });

            this.dispatchEvent('error');

            if (throwError) {
                throw err;
            }
        })
    },

    _runFlow(param) {
        return dmx.Flow.run(this._flow, dmx.DataScope({
            $param: Object.assign({}, this.props.params, param),
        }, this));
    },

});