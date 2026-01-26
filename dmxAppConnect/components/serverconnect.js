dmx.Component('serverconnect', {

    extends: 'fetch',

    attributes: {
        sockets: {
            type: Boolean,
            default: false,
        },
    },

    init(node) {
        this.serverconnect = true;

        if (this.props.sockets && dmx.Socket) {
            this._refresh = this._refresh.bind(this);
            this._event = this.props.url.replace(/^(.*?)api\//, '')
            this._socket = dmx.Socket('/api');
            this._socket.on(this._event, this._refresh);
        }

        dmx.Component('fetch').prototype.init.call(this, node);
    },

    destroy() {
        if (this._socket) {
            this._socket.off(this._event, this._refresh);
        }

        dmx.Component('fetch').prototype.destroy.call(this);
    },

    _fetch(options) {
        if (this._socket && this._socket.connected) {
            this._refresh(options && options.params);
        } else {
            dmx.Component('fetch').prototype._fetch.call(this, options);
        }
    },

    _refresh(params) {
        params = dmx.extend(true, {}, this.props.params, params || {});

        this.dispatchEvent('start');
        this.set('state', {
            executing: true,
            uploading: false,
            processing: true,
            downloading: false,
        });

        this._socket.emit(this._event, params, response => {
            this.set({
                status: response.status,
                data: response.data,
                state: {
                    executing: false,
                    uploading: false,
                    processing: false,
                    downloading: false,
                },
            });

            this.dispatchEvent(this._statusEvents[response.status] || 'error');
            this.dispatchEvent('done');
        });
    },

});