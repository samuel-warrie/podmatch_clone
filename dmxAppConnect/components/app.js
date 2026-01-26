dmx.Component("app", {

    initialData: {
        query: {},
    },

    events: {
        ready: Event,
        load: Event,
    },

    init() {
        this.dispatchLoad = this.dispatchEvent.bind(this, "load");
        this._parseQuery = this._parseQuery.bind(this);

        // is this remove needed?
        window.addEventListener("load", this.dispatchLoad, {
            once: true
        });
        window.addEventListener("load", this._parseQuery);
        window.addEventListener("popstate", this._parseQuery);
        window.addEventListener("pushstate", this._parseQuery);
        window.addEventListener("replacestate", this._parseQuery);

        this._parseQuery();

        queueMicrotask(() => this.dispatchEvent("ready"));
    },

    destroy() {
        window.removeEventListener("load", this.dispatchLoad);
        window.removeEventListener("load", this._parseQuery);
        window.removeEventListener("popstate", this._parseQuery);
        window.removeEventListener("pushstate", this._parseQuery);
        window.removeEventListener("replacestate", this._parseQuery);
    },

    _parseQuery() {
        let querystring = "";

        if (window.location.search) {
            querystring = window.location.search.slice(1);
        } else if (window.location.hash.indexOf("?")) {
            querystring = window.location.hash.slice(
                window.location.hash.indexOf("?") + 1
            );
            if (querystring.indexOf("#") > 0) {
                querystring = querystring.slice(0, querystring.indexOf("#"));
            }
        }

        let query = querystring.split("&").reduce(function(query, part) {
            var p = part.replace(/\+/g, " ").split("=");
            if (p[0]) {
                query[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || "");
            }
            return query;
        }, {});

        let base = document.querySelector('meta[name="ac:base"]');
        let route = document.querySelector('meta[name="ac:route"]');
        if (route && route.content) {
            let keys = [];
            let path = route.content;

            if (base && base.content) {
                path = base.content.replace(/\/$/, "") + path;
            }

            let re = dmx.pathToRegexp(path, keys, {
                end: false
            });
            let match = re.exec(decodeURI(window.location.pathname));

            if (match) {
                keys.forEach(function(key, index) {
                    query[key.name] = match[index + 1];
                });
            }
        }

        this.set("query", query);
    },

});