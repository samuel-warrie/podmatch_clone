dmx.Component('cookie-manager', {

    initialData() {
        this._cookie = document.cookie;

        return {
            data: this._getCookie(),
        };
    },

    methods: {
        set(name, value, options = {}) {
            this._setCookie(name, value, options);
        },

        remove(name, options = {}) {
            options.expires = '1970-01-01T00:00:00Z';
            this._setCookie(name, '', options);
        },

        removeAll(options = {}) {
            options.expires = '1970-01-01T00:00:00Z';
            Object.keys(this.data.data).forEach(function(name) {
                this._setCookie(name, '', options);
            });
        },
    },

    render: false,

    _getCookie() {
        return this._cookie.split(/;\s*/).reduce(function(data, cookie) {
            var pos = cookie.indexOf('=');
            data[decodeURIComponent(cookie.substr(0, pos))] = decodeURIComponent(cookie.substr(pos + 1));
            return data;
        }, {});
    },

    _setCookie: function(name, value, options) {
        if (!name || /^(?:expires|max\-age|path|domain|secure)$/i.test(name)) {
            return false;
        }

        options = options || {};
        options.path = options.path || '/';

        // escaping taken from:
        // https://github.com/js-cookie/js-cookie/blob/master/src/js.cookie.js
        name = encodeURIComponent(String(name));
        name = name.replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent);
        name = name.replace(/[\(\)]/g, escape);

        value = encodeURIComponent(String(value));
        value = value.replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);

        var cookie = name + '=' + value;

        if (options.expires) {
            if (typeof options.expires == 'number') {
                options.expires = Date.now() + options.expires * 86400000;
            }
            cookie += '; expires=' + new Date(options.expires).toUTCString();
        }

        if (options.domain) {
            cookie += '; domain=' + options.domain;
        }

        if (options.path) {
            cookie += '; path=' + options.path;
        }

        if (options.secure) {
            cookie += '; secure';
        }

        document.cookie = cookie;

        this._cookie = document.cookie;
        this.set('data', this._getCookie());
    },

});