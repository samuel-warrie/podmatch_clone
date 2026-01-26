dmx.Component('route', {

    initialData: {
        isExact: false,
        isMatch: false,
        loading: false,
        params: {}, // Key/value pairs parsed from the URL corresponding to the dynamic segments of the path
        path: '', // The path pattern used to match. Useful for building nested Routes
        url: '', // The matched portion of the URL. Useful for building nested Links
    },

    attributes: {
        path: {
            type: String,
            default: '*',
        },

        exact: {
            type: Boolean,
            default: false,
        },

        url: {
            type: String,
            default: '',
        },
    },

    events: {
        show: Event,
        hide: Event,
        error: Event,
        unauthorized: Event,
        forbidden: Event,
        notfound: Event,
    },

    render: false,

    init(node) {
        this._locationHandler = this._locationHandler.bind(this);
        this._error = this._error.bind(this);

        this._cache = new Map();
        this._content = node.innerHTML;
        this._keys = [];
        this._re = dmx.pathToRegexp(this.props.path, this._keys, {
            end: this.props.exact
        });
        this._shown = false;

        node.innerHTML = '';

        window.addEventListener("popstate", this._locationHandler);
        window.addEventListener("pushstate", this._locationHandler);
        window.addEventListener("replacestate", this._locationHandler);
        window.addEventListener('hashchange', this._locationHandler);

        this._locationHandler();
    },

    destroy() {
        window.removeEventListener("popstate", this._locationHandler);
        window.removeEventListener("pushstate", this._locationHandler);
        window.removeEventListener("replacestate", this._locationHandler);
        window.removeEventListener('hashchange', this._locationHandler);
    },

    performUpdate(updatedProps) {
        this.set({
            path: this.props.path,
            isExact: this.props.exact,
        });
    },

    _load() {
        this._hide();

        const url = this.props.url;

        if (this._cache.has(url)) {
            this._loaded = url;
            this._content = this._cache.get(url);
            this._show();
            return;
        }

        this.set('loading', true);

        this._abortController = new AbortController();

        fetch(url, {
            credentials: 'same-origin',
            signal: this._abortController.signal,
        }).then(reponse => reponse.text()).then(content => {
            this.set('loading', false);
            this._loaded = url;
            this._content = content;
            this._cache.set(url, content);
            this._show();
        }).catch(this._error);
    },

    _show() {
        if (this._shown) return;

        if (this._abortController) {
            this._abortController.abort();
        }

        this.$node.innerHTML = this._content;
        this.$parse();

        dmx.routing.evalScripts(this.$node);

        this._shown = true;
        this.dispatchEvent('show');
    },

    _hide() {
        if (!this._shown) return;

        if (this._abortController) {
            this._abortController.abort();
        }

        if (this.effects) {
            this.effects.forEach((effect) => effect());
            this.effects = null;
        }
        this.$destroyChildren();
        this.$node.innerHTML = '';

        this._shown = false;
        this.dispatchEvent('hide');
    },

    _error(err) {
        this.set('loading', false);
        this.dispatchEvent('error');
        if (dmx.debug) console.error(err);
    },

    _locationHandler(event) {
        let path = dmx.routing.getUrlInfo().path;

        if (dmx.routing.router == 'hybrid') {
            let base = document.querySelector('meta[name="ac:base"]');
            let route = document.querySelector('meta[name="ac:route"]');

            if (base && base.content) {
                path = path.replace(base.content.replace(/\/$/, ''), '');
            }

            if (route && route.content) {
                path = path.replace(dmx.pathToRegexp(route.content, [], {
                    end: false
                }), '').replace(/^(\/+)?/, '/');
            }
        }

        const match = this._re.exec(path);

        if (match) {
            this.set({
                isMatch: true,
                url: match[0],
                params: this._keys.reduce((params, key, index) => {
                    params[key.name] = match[index + 1];
                    return params;
                }, {})
            });

            if (this.data.loading && this.props.url === this._loaded) {
                // Url is loading
                return;
            }

            if (this.props.url && this.props.url !== this._loaded) {
                this._load();
            } else {
                this._show();
            }
        } else {
            this.set({
                isMatch: false,
                url: '',
                params: {},
            });

            this._hide();
        }
    },

});