dmx.isValidDate = function(date) {
    return date && date.toString() != 'Invalid Date';
};

dmx.resetTime = function(date) {
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
};

dmx.formatDate = function(date) {
    const pad = (s, n) => ('0000' + n).slice(-s);
    return (
        pad(4, date.getFullYear()) +
        '-' +
        pad(2, date.getMonth() + 1) +
        '-' +
        pad(2, date.getDate()) +
        ' ' +
        pad(2, date.getHours()) +
        ':' +
        pad(2, date.getMinutes()) +
        ':' +
        pad(2, date.getSeconds()) +
        '.' +
        pad(3, date.getMilliseconds())
    );
}


dmx.Formatters('global', {

    // default(value:Any, defaultValue:Any):Any
    default (value, defaultValue) {
        return value == null ? defaultValue : value;
    },

    // bool(value:Any):Boolean
    bool(value) {
        return Boolean(value);
    },

    // string(value:Any):String
    string(value) {
        if (value == null) return '';
        return String(value);
    },

    // number(value:Any):String
    number(value) {
        return Number(value);
    },

    // date(value:Any):String
    date(value) {
        const date = dmx.parseDate(value);
        if (!dmx.isValidDate(date)) return undefined;
        return dmx.formatDate(date);
    },

});