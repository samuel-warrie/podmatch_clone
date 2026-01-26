dmx.Component('local-manager', {

    initialData: {
        data: {},
    },

    methods: {
        set(key, value) {
            const val = JSON.stringify(value);
            if (val != null) {
                window.localStorage.setItem('dmxState-' + key, val);
            } else {
                window.localStorage.removeItem('dmxState-' + key);
            }
            this._getData();
        },

        remove(key) {
            window.localStorage.removeItem('dmxState-' + key);
            this._getData();
        },

        removeAll() {
            Object.keys(window.localStorage).forEach(function(key) {
                if (key.startsWith('dmxState-')) {
                    window.localStorage.removeItem(key);
                }
            });
            this._getData();
        },
    },

    render: false,

    init() {
        this._getData();
    },

    _getData() {
        this.set(
            'data',
            Object.keys(window.localStorage).reduce(function(data, key) {
                if (key.startsWith('dmxState-')) {
                    try {
                        data[key.slice(9)] = JSON.parse(window.localStorage.getItem(key));
                    } catch (e) {
                        console.warn('Error parsing JSON: ' + window.localStorage.getItem(key));
                    }
                }

                return data;
            }, {})
        );
    },
});