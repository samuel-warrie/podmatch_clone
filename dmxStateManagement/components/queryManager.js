dmx.Component('query-manager', {

    initialData: {
        data: {},
    },

    methods: {
        set(key, value) {
            this._setQueryParam(key, value);
        },

        remove(key) {
            this._setQueryParam(key);
        },

        removeAll() {
            this._setQueryParam();
        },
    },

    render: false,

    init() {
        this._updateHandler = this._updateHandler.bind(this);

        // only need to update on these events
        window.addEventListener('popstate', this._updateHandler);
        window.addEventListener('pushstate', this._updateHandler);
        window.addEventListener('replacestate', this._updateHandler);

        dmx.nextTick(() => {
            // need to wait for all components to be initialized/rendered
            this.initContentView();
        });

        this._updateHandler();
    },

    initContentView() {
        this.contentView = dmx.app ? .find('content');
        this.contentView ? .addEventListener('load', this._updateHandler);
    },

    destroy() {
        window.removeEventListener('popstate', this._updateHandler);
        window.removeEventListener('pushstate', this._updateHandler);
        window.removeEventListener('replacestate', this._updateHandler);
        this.contentView ? .removeEventListener('load', this._updateHandler);
    },

    _setQueryParam: function(key, value) {
        let updated = false;
        let params = dmx.clone(this.data.data);

        if (value == null) {
            if (key == null) {
                params = {};
                updated = true;
            } else if (params[key]) {
                delete params[key];
                updated = true;
            }
        } else if (params[key] != value) {
            params[key] = value;
            updated = true;
        }

        if (updated) {
            const url = new URL(window.location);
            url.search = new URLSearchParams(params);
            window.history.pushState(null, null, url);
        }
    },

    _buildQuery: function(data) {
        const keys = Object.keys(data);

        return keys.length ?
            '?' +
            keys.reduce(function(query, key) {
                if (query) query += '&';
                query += encodeURIComponent(key) + '=' + encodeURIComponent(data[key]);
                return query;
            }, '') :
            '';
    },

    _parseQuery: function() {
        const query = this.search.replace(/^\?/, '');

        return query.split('&').reduce(function(data, part) {
            const p = part.replace(/\+/g, ' ').split('=');
            if (p[0]) data[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
            return data;
        }, {});
    },

    _updateHandler() {
        if (this.contentView ? .data ? .loading) return;

        if (this.search !== window.location.search) {
            this.search = window.location.search;
            this.set('data', this._parseQuery());
        }
    },

});