dmx.Component("view", {

    initialData: {
        loading: false,
        params: null,
    },

    events: {
        load: Event,
        error: Event,
        unauthorized: Event,
        forbidden: Event,
        notfound: Event,
    },

    methods: {
        load(url, force) {
            this._load(url, force);
        },

        reload() {
            this._reload();
        },
    },

    init(node) {
        if (window.__WAPPLER__) return;

        this._locationHandler = this._locationHandler.bind(this);

        window.addEventListener("popstate", this._locationHandler);
        window.addEventListener("pushstate", this._locationHandler);
        window.addEventListener("replacestate", this._locationHandler);
        window.addEventListener('hashchange', this._locationHandler);

        if (dmx.routing.router == "hybrid") {
            this._url = location.pathname;
        } else {
            this._locationHandler();
        }
    },

    destroy() {
        window.removeEventListener("popstate", this._locationHandler);
        window.removeEventListener("pushstate", this._locationHandler);
        window.removeEventListener("replacestate", this._locationHandler);
        window.removeEventListener('hashchange', this._locationHandler);
    },

    _reload() {
        this._load(this._url, true);
    },

    _load(url, force) {
        if (this._url == url && this.data.loading) {
            // Url is loading
            return;
        }

        if (this._url != url || force) {
            this.set("loading", true);
            this._url = url;

            if (this._abortController) {
                this._abortController.abort();
            }

            this._abortController = new AbortController();

            fetch(url + (url.includes("?") ? "&" : "?") + "fragment=true", {
                credentials: 'same-origin',
                headers: [
                    ['Accept', 'text/fragment+html']
                ],
                signal: this._abortController.signal,
            }).then(response => {
                this.set("loading", false);

                if (response.status == 200 || response.status == 0) {
                    response.text().then(html => {
                        this._show(html)
                        this.dispatchEvent("load");
                        //window.dispatchEvent(new Event('load'));
                        dmx.app._parseQuery();
                    }).catch(err => {
                        console.error(err);
                        this.dispatchEvent('error')
                    });
                } else {
                    if (response.status == 222) {
                        response.text().then(url => {
                            location.assign(url);
                        }).catch(err => {
                            console.error(err);
                            this.dispatchEvent('error')
                        });
                    } else {
                        const events = {
                            401: 'unauthorized',
                            403: 'forbidden',
                            404: 'notfound'
                        };
                        this.dispatchEvent(events[response.status] || 'error');
                    }
                }
            }).catch(err => {
                console.error(err);
                this.set("loading", false);
                this.dispatchEvent('error');
            });
        }
    },

    _show(html) {
        if (this.effects) {
            this.effects.forEach((effect) => effect());
            this.effects = null;
        }

        this.$destroyChildren();
        this.$node.innerHTML = html;
        this.$parse();

        dmx.routing.evalScripts(this.$node);
    },

    _locationHandler(event) {
        if (dmx.routing.router == "hybrid") {
            this._load(location.pathname);
        } else {
            let path = dmx.routing.getUrlInfo().path;
            let routes = dmx.routing.getRoutes();
            let parent = this.parent;

            while (parent) {
                if (parent.routes) {
                    routes = parent.routes;
                    break;
                }

                parent = parent.parent;
            }

            const route = dmx.routing.match(path, routes, parent);

            if (route) {
                this.path = route.path;
                this.routes = route.routes;
                this.set("params", route.params);
                this._load(route.url);
            } else {
                console.warn("Route for " + path + " not found");
            }
        }
    },

});