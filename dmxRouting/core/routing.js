(() => {

    const settings = dmx.routing;

    dmx.routing = {
        router: "hybrid", // hybrid (combined server/client routing), path or hash

        base: "", // todo: use when router is path (when page is in a subfolder)

        routes: [],

        getRoutes() {
            return this.routes.filter(function(route) {
                return !route.app || route.app == dmx.app.name;
            });
        },

        getBase() {
            if (this.base) {
                return this.base;
            } else {
                var base = document.querySelector("base[href]");
                if (base) return base.getAttribute("href");
            }

            return "";
        },

        getUrlInfo() {
            var url =
                this.router == "hash" ?
                new URL(window.location.hash.slice(2), window.location.origin) :
                window.location;

            return {
                path: url.pathname || "/",
                query: url.search.slice(1),
                hash: url.hash.slice(1),
            };
        },

        match(path, routes, parent) {
            path = path || this.getUrlInfo().path;
            routes = routes || this.getRoutes();

            var base = dmx.routing.getBase();
            if (base) {
                path = path.replace(base, "").replace(/^\/?/, "/");
            }

            for (var i = 0; i < routes.length; i++) {
                if (routes[i].routes) {
                    routes[i].end = false;
                }

                var keys = [];
                var re = dmx.pathToRegexp(
                    dmx.routing.join(
                        parent && parent.path ? parent.path : "/",
                        routes[i].path
                    ),
                    keys,
                    routes[i]
                );
                var match = re.exec(decodeURI(path));

                if (match) {
                    return {
                        path: match[0],
                        params: keys.reduce(function(params, key, index) {
                            params[key.name] = match[index + 1];
                            return params;
                        }, {}),
                        url: routes[i].url,
                        routes: routes[i].routes || [],
                    };
                }
            }

            return null;
        },

        join(path1, path2) {
            return path1.replace(/\/$/, "") + "/" + path2.replace(/^\//, "");
        },

        evalScripts(node) {
            try {
                node.querySelectorAll('script[type="text/javascript"],script:not([type])').forEach(script => {
                    try {
                        const newScript = document.createElement("script");
                        newScript.type = "text/javascript";
                        if (script.src) newScript.src = script.src;
                        if (script.innerHTML) newScript.innerHTML = script.innerHTML;
                        script.parentNode.replaceChild(newScript, script);
                    } catch (e) {
                        console.error("Error executing script " + script.src, e);
                    }
                });
            } catch (e) {
                console.error("An error occurred while trying to execute scripts", e);
            }
        },
    };

    if (settings) {
        // merge settings
        Object.assign(dmx.routing, settings);
    }

})();