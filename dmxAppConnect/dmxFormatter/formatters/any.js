dmx.Formatters('any', {

    // default(defaultValue:Any):Any
    default (obj, defaultValue) {
        return obj == null ? defaultValue : obj;
    },

    isDefined(obj) {
        return obj != null;
    },

    isEmpty(obj) {
        const type = typeof obj;
        if (type == 'undefined') return true;
        if (type == 'string') return obj.length == 0;
        if (type == 'number') return obj == 0;
        if (type == 'boolean') return obj == false;
        if (type == 'object') {
            if (Array.isArray(obj)) return obj.length == 0;
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) return false;
            }
            return true;
        }
        return false;
    },

    // toBool():Boolean
    toBool(obj) {
        return Boolean(obj);
    },

    // toJSON():String
    toJSON(obj) {
        return JSON.stringify(obj);
    },

    // toNumber():Number
    toNumber(obj) {
        return Number(obj);
    },

    toBigInt(obj) {
        return BigInt(obj);
    },

    // toString():String
    toString(obj) {
        if (obj == null) return '';
        return String(obj);
    },

    // toTimestamp():Number
    toTimestamp(obj) { // UNIX timestamp
        const date = dmx.parseDate(obj);
        if (!dmx.isValidDate(date)) return undefined;
        return Math.floor(date.getTime() / 1000);
    },

    // toDate():String
    toDate(obj) {
        const date = dmx.parseDate(obj);
        if (!dmx.isValidDate(date)) return undefined;
        return dmx.formatDate(date);
    },

    // toUTCDate():String
    toUTCDate(obj) {
        const date = dmx.parseDate(obj);
        if (!dmx.isValidDate(date)) return undefined;
        return date.toISOString();
    },

    // toISODate():String
    toISODate(obj) {
        const pad = (s, n) => ('0000' + n).slice(-s);
        const date = dmx.parseDate(obj);
        if (!dmx.isValidDate(date)) return undefined;
        return `${pad(4, date.getFullYear())}-${pad(2, date.getMonth() + 1)}-${pad(2, date.getDate())}`;
    },

    // toISOTime(incMilliseconds:Boolean):String
    toISOTime(obj, incMilliseconds) {
        const pad = (s, n) => ('0000' + n).slice(-s);
        const date = dmx.parseDate(obj);
        if (!dmx.isValidDate(date)) return undefined;
        return `${pad(2, date.getHours())}:${pad(2, date.getMinutes())}:${pad(2, date.getSeconds())}${incMilliseconds ? '.' + pad(3, date.getMilliseconds()) : ''}`;
    },
});