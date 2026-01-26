dmx.Component('datetime', {

    initialData: {
        datetime: null,
    },

    attributes: {
        interval: {
            type: String,
            default: 'seconds',
            enum: ['seconds', 'minutes', 'hours', 'days']
        },

        utc: {
            type: Boolean,
            default: false
        },
    },

    init() {
        this._tick = this._tick.bind(this);
        this._tick();
    },

    destroy() {
        if (this._timeout) clearTimeout(this._timeout);
        if (this._animationFrame) cancelAnimationFrame(this._animationFrame);
    },

    _tick() {
        this.set('datetime', this._datetime());

        switch (this.props.interval) {
            case 'seconds':
                return this._timeout = setTimeout(this._tick, 1000);
            case 'minutes':
                return this._timeout = setTimeout(this._tick, 60000);
            case 'hours':
                return this._timeout = setTimeout(this._tick, 3600000);
            case 'days':
                return this._timeout = setTimeout(this._tick, 86400000);
            default:
                return this._animationFrame = requestAnimationFrame(this._tick);
        }
    },

    _datetime() {
        const now = new Date();
        const pad = (n, d) => ('0000' + n).slice(-d);
        const utc = this.props.utc;

        const year = utc ? now.getUTCFullYear() : now.getFullYear();
        const month = (utc ? now.getUTCMonth() : now.getMonth()) + 1;
        const day = utc ? now.getUTCDate() : now.getDate();
        const hours = utc ? now.getUTCHours() : now.getHours();
        const minutes = utc ? now.getUTCMinutes() : now.getMinutes();
        const seconds = utc ? now.getUTCSeconds() : now.getSeconds();

        const dateString = pad(year, 4) + '-' + pad(month, 2) + '-' + pad(day, 2);
        const tz = utc ? 'Z' : '';

        switch (this.props.interval) {
            case 'days':
                return dateString + 'T00:00:00' + tz;
            case 'hours':
                return dateString + 'T' + pad(hours, 2) + ':00:00' + tz;
            case 'minutes':
                return dateString + 'T' + pad(hours, 2) + ':' + pad(minutes, 2) + ':00' + tz;
        }

        return dateString + 'T' + pad(hours, 2) + ':' + pad(minutes, 2) + ':' + pad(seconds, 2) + tz;
    },

});