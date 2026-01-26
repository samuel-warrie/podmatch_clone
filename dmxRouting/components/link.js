dmx.Component('link', {

    attributes: {
        internal: {
            type: Boolean,
            default: false,
        },

        href: {
            type: String,
            default: null,
        },
    },

    init(node) {
        this._clickHandler = this._clickHandler.bind(this);
        this._stateHandler = this._stateHandler.bind(this);

        node.addEventListener('click', this._clickHandler);

        if (this.props.href) {
            this.$node.setAttribute('href', this.props.href);
            this._fixUrl(node.getAttribute('href'));
        }

        if (node.classList.contains('nav-link')) {
            window.addEventListener("popstate", this._stateHandler);
            window.addEventListener("pushstate", this._stateHandler);
            window.addEventListener("replacestate", this._stateHandler);
            window.addEventListener('hashchange', this._stateHandler);
            this._stateHandler();
        }
    },

    performUpdate(updatedProps) {
        if (updatedProps.has('href')) {
            if (this.props.href) {
                this.$node.setAttribute('href', this.props.href);
                this._fixUrl(this.props.href);
            } else {
                this.$node.removeAttribute('href');
            }
        }
    },

    destroy() {
        this.$node.removeEventListener('click', this._clickHandler);
        window.removeEventListener("popstate", this._stateHandler);
        window.removeEventListener("pushstate", this._stateHandler);
        window.removeEventListener("replacestate", this._stateHandler);
        window.removeEventListener('hashchange', this._stateHandler);
    },

    _fixUrl(url) {
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
                    this.$node.setAttribute('href', url.replace('./', match[0].replace(/(\/+)?$/, '/')));
                }
            } else {
                this.$node.setAttribute('href', dmx.routing.join(dmx.routing.getBase(), url));
            }

            this.props.internal = true;
        }
    },

    _navigate(url) {
        if (url.startsWith('#')) {
            location.hash = url;
            return;
        }

        if (dmx.routing.router === 'hash') {
            url = '#!' + url;
        }

        const title = this.$node.title;
        history.pushState({
            title: title || document.title
        }, '', url);
        if (title) document.title = title;
        window.dispatchEvent(new Event('pushstate'));
    },

    _clickHandler(event) {
        const url = this.$node.getAttribute('href');

        if (url && (this.props.internal || url.startsWith('#')) && !event.ctrlKey && event.button === 0) {
            event.preventDefault();
            this._navigate(url);
        }
    },

    _stateHandler() {
        if (!this.$node.hasAttribute('dmx-class:active')) return;

        const node = this.$node;
        const url = node.getAttribute('href');
        if (url && url.startsWith('#')) return;
        const active = node.href == window.location.href || node.href == window.location.href.split("?")[0].split("#")[0];

        node.classList.toggle('active', active);

        if (node.classList.contains('dropdown-item')) {
            const items = node.parentNode.querySelectorAll('.dropdown-item');
            node.classList.remove('active');

            for (let i = 0; i < items.length; i++) {
                const match = items[i].href == window.location.href || items[i].href == window.location.href.split("?")[0].split("#")[0];
                if (match) {
                    items[i].classList.add('active');
                    node.classList.add('active');
                } else {
                    items[i].classList.remove('active');
                }
            }
        }
    },

});