dmx.Component('browser', {

    initialData: {
        online: navigator.onLine,
        userAgent: navigator.userAgent,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        referrer: document.referrer,

        location: {
            hash: location.hash,
            host: location.host,
            hostname: location.hostname,
            href: location.href,
            origin: location.origin,
            pathname: location.pathname,
            port: location.port,
            protocol: location.protocol,
            search: location.search,
            pathparts: location.pathname.slice(1).split('/'),
        },

        scrollX: {
            offset: 0,
            direction: 0,
            position: 0,
        },

        scrollY: {
            offset: 0,
            direction: 0,
            position: 0,
        },

        viewport: {
            width: 0,
            height: 0,
        },

        device: {
            width: 0,
            height: 0,
            pixelRatio: 1,
            orientation: 'landscape',
        },

        document: {
            width: 0,
            height: 0,
            hidden: document.hidden,
            visibility: document.visibilityState,
        },
    },

    methods: {
        goto(url, internal, title) {
            if (internal) {
                if (dmx.routing && dmx.routing.router == 'hash') {
                    url = '#!' + url;
                }

                if (url.startsWith('./')) {
                    let parent = this.parent;

                    while (parent) {
                        if (parent.routes && parent.path) {
                            url = dmx.routing.join('./', url.replace('./', parent.path));
                            break;
                        }

                        parent = parent.parent;
                    }

                    let route = document.querySelector('meta[name="ac:route"]');
                    if (route && route.content) {
                        let path = route.content;
                        let base = document.querySelector('meta[name="ac:base"]');
                        if (base && base.content) {
                            path = base.content.replace(/\/$/, '') + path;
                        }
                        let match = dmx.pathToRegexp(path, [], {
                            end: false
                        }).exec(location.pathname);
                        if (match) {
                            url = url.replace('./', match[0].replace(/(\/+)?$/, '/'));
                        }
                    } else {
                        url = dmx.routing.join(dmx.routing.getBase(), url);
                    }
                }

                history.pushState({
                    title: title || document.title
                }, '', url);
                if (title) document.title = title;
                window.dispatchEvent(new Event('pushstate'));
            } else {
                location.assign(url);
            }
        },

        reload() {
            location.reload();
        },

        back() {
            history.back();
        },

        forward() {
            history.forward();
        },

        scrollTo(x, y) {
            window.scrollTo(x, y);
        },

        scrollXTo(left, behavior) {
            window.scrollTo({
                left,
                behavior
            });
        },

        scrollYTo(top, behavior) {
            window.scrollTo({
                top,
                behavior
            });
        },

        scrollBy(x, y) {
            window.scrollBy(x, y);
        },

        scrollXBy(left, behavior) {
            window.scrollBy({
                left,
                behavior
            });
        },

        scrollYBy(top, behavior) {
            window.scrollBy({
                top,
                behavior
            });
        },

        alert(message) {
            window.alert(message);
        },

        print() {
            window.print();
        },

        open(url, target = '_blank') {
            window.open(url, target);
        },

        writeTextToClipboard(text) {
            return navigator.clipboard.writeText(text);
        },
    },

    events: {
        scroll: Event,
        resize: Event,
        online: Event,
        offline: Event,
        popstate: Event,
        pushstate: Event,
        replacestate: Event,
        visibilitychange: Event,
        orientationchange: Event,
    },

    init(node) {
        this._loadHandler = this._loadHandler.bind(this);
        this._sizeHandler = dmx.throttle(this._sizeHandler.bind(this));
        this._onlineHandler = this._onlineHandler.bind(this);
        this._locationHandler = this._locationHandler.bind(this);
        this._visibilityHandler = this._visibilityHandler.bind(this);
        this._languageHandler = this._languageHandler.bind(this);
        this._orientationHandler = this._orientationHandler.bind(this);

        window.addEventListener('load', this._loadHandler);
        window.addEventListener('scroll', this._sizeHandler);
        window.addEventListener('resize', this._sizeHandler);
        window.addEventListener('online', this._onlineHandler);
        window.addEventListener('offline', this._onlineHandler);
        window.addEventListener('popstate', this._locationHandler);
        window.addEventListener('pushstate', this._locationHandler);
        window.addEventListener('replacestate', this._locationHandler);
        window.addEventListener('hashchange', this._locationHandler);
        window.addEventListener('languagechange', this._languageHandler);
        window.addEventListener('deviceorientation', this._orientationHandler);
        document.addEventListener('visibilitychange', this._visibilityHandler);

        dmx.nextTick(() => this._updateSize());
    },

    destroy() {
        window.removeEventListener('load', this._loadHandler);
        window.removeEventListener('scroll', this._sizeHandler);
        window.removeEventListener('resize', this._sizeHandler);
        window.removeEventListener('online', this._onlineHandler);
        window.removeEventListener('offline', this._onlineHandler);
        window.removeEventListener('popstate', this._locationHandler);
        window.removeEventListener('pushstate', this._locationHandler);
        window.removeEventListener('replacestate', this._locationHandler);
        window.removeEventListener('hashchange', this._locationHandler);
        window.removeEventListener('languagechange', this._languageHandler);
        window.removeEventListener('deviceorientation', this._orientationHandler);
        document.removeEventListener('visibilitychange', this._visibilityHandler);
    },

    _updateSize() {
        const doc = this._documentSize();
        const width = doc.width - window.innerWidth;
        const height = doc.height - window.innerHeight;

        let direction = {
            x: this.data.scrollX.direction,
            y: this.data.scrollY.direction
        };

        if (this.data.scrollX.offset < window.scrollX) {
            direction.x = 1;
        } else if (this.data.scrollX.offset > window.scrollX) {
            direction.x = -1;
        }

        if (this.data.scrollY.offset < window.scrollY) {
            direction.x = 1;
        } else if (this.data.scrollY.offset > window.scrollY) {
            direction.x = -1;
        }

        this.set({
            scrollX: {
                offset: window.scrollX,
                length: Math.max(0, width),
                direction: direction.x,
                position: window.scrollX > 0 ? window.scrollX / width : 0,
            },
            scrollY: {
                offset: window.scrollY,
                length: Math.max(0, height),
                direction: direction.x,
                position: window.scrollY > 0 ? window.scrollY / height : 0,
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                scrollX: window.scrollX,
                scrollY: window.screenY,
            },
            device: {
                width: window.screen.width,
                height: window.screen.height,
                pixelRatio: window.devicePixelRatio,
                orientation: this._orientation(),
            },
            document: {
                width: doc.width,
                height: doc.height,
                hidden: document.hidden,
                visibility: document.visibilityState,
            }
        });
    },

    _updateLocation() {
        this.set('location', {
            hash: location.hash,
            host: location.host,
            hostname: location.hostname,
            href: location.href,
            origin: location.origin,
            pathname: location.pathname,
            port: location.port,
            protocol: location.protocol,
            search: location.search,
            pathparts: location.pathname.slice(1).split('/')
        });
    },

    _documentSize() {
        return {
            width: Math.max(
                document.body.scrollWidth, document.documentElement.scrollWidth,
                document.body.offsetWidth, document.documentElement.offsetWidth,
                document.body.clientWidth, document.documentElement.clientWidth
            ),
            height: Math.max(
                document.body.scrollHeight, document.documentElement.scrollHeight,
                document.body.offsetHeight, document.documentElement.offsetHeight,
                document.body.clientHeight, document.documentElement.clientHeight
            ),
        };
    },

    _orientation() {
        return window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape';
    },

    _loadHandler(event) {
        this._updateSize();
    },

    _sizeHandler(event) {
        this._updateSize();
        this.dispatchEvent(event.type);
    },

    _onlineHandler(event) {
        this.set('online', event.type === 'online');
        this.dispatchEvent(event.type);
    },

    _locationHandler(event) {
        this._updateLocation();
        this.dispatchEvent(event.type);
    },

    _languageHandler(event) {
        this.set('language', navigator.language);
    },

    _orientationHandler(event) {
        this._updateSize();
        this.dispatchEvent('orientationchange');
    },

    _visibilityHandler(event) {
        const doc = this._documentSize();

        this.set('document', {
            width: doc.width,
            height: doc.height,
            hidden: document.hidden,
            visibility: document.visibilityState,
        });

        this.dispatchEvent(event.type);
    },

});