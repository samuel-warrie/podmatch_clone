dmx.Component('session-manager', {

    initialData: {
        data: {},
    },

    methods: {
        set(key, value) {
            const val = JSON.stringify(value);
            if (val != null) {
                window.sessionStorage.setItem('dmxState-' + key, val);
            } else {
                window.sessionStorage.removeItem('dmxState-' + key);
            }
            this._getData();
        },

        remove(key) {
            window.sessionStorage.removeItem('dmxState-' + key);
            this._getData();
        },

        removeAll() {
            Object.keys(window.sessionStorage).forEach(function(key) {
                if (key.startsWith('dmxState-')) {
                    window.sessionStorage.removeItem(key);
                }
            });
            this._getData();
        },
    },

    render: false,

    init(node) {
        this._getData();
    },

    _getData() {
        this.set(
            'data',
            Object.keys(window.sessionStorage).reduce(function(data, key) {
                if (key.startsWith('dmxState-')) {
                    try {
                        data[key.slice(9)] = JSON.parse(window.sessionStorage.getItem(key));
                    } catch (e) {
                        console.warn('Error parsing JSON: ' + window.sessionStorage.getItem(key));
                    }
                }

                return data;
            }, {})
        );
    },
});