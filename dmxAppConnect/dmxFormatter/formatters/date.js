dmx.l10n = dmx.l10n || {};
dmx.l10n.en = dmx.l10n.en || {};

dmx.l10n.en.months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
dmx.l10n.en.monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
dmx.l10n.en.days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
dmx.l10n.en.daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

dmx.Formatters('string', {
    // getYear():Number
    getYear(str) {
        const date = dmx.parseDate(str);
        if (!dmx.isValidDate(date)) return undefined;
        return date.getFullYear();
    },

    // getMonth():Number
    getMonth(str) {
        const date = dmx.parseDate(str);
        if (!dmx.isValidDate(date)) return undefined;
        return date.getMonth() + 1;
    },

    // getDate():Number
    getDate(str) {
        const date = dmx.parseDate(str);
        if (!dmx.isValidDate(date)) return undefined;
        return date.getDate();
    },

    // getDay():Number
    getDay(str) {
        const date = dmx.parseDate(str);
        if (!dmx.isValidDate(date)) return undefined;
        return date.getDay();
    },

    // getHours():Number
    getHours(str) {
        const date = dmx.parseDate(str);
        if (!dmx.isValidDate(date)) return undefined;
        return date.getHours();
    },

    // getMinutes():Number
    getMinutes(str) {
        const date = dmx.parseDate(str);
        if (!dmx.isValidDate(date)) return undefined;
        return date.getMinutes();
    },

    // getSeconds():Number
    getSeconds(str) {
        const date = dmx.parseDate(str);
        if (!dmx.isValidDate(date)) return undefined;
        return date.getSeconds();
    },

    // getMilliseconds():Number
    getMilliseconds(str) {
        const date = dmx.parseDate(str);
        if (!dmx.isValidDate(date)) return undefined;
        return date.getMilliseconds();
    },

    // addYears(n:Number):String
    addYears(str, n) {
        const date = dmx.parseDate(str);
        if (!dmx.isValidDate(date)) return undefined;
        date.setFullYear(date.getFullYear() + Number(n));
        return dmx.formatDate(date);
    },

    // addMonths(n:Number):String
    addMonths(str, n) {
        const date = dmx.parseDate(str);
        if (!dmx.isValidDate(date)) return undefined;
        date.setMonth(date.getMonth() + Number(n));
        return dmx.formatDate(date);
    },

    // addWeeks(n:Number):String
    addWeeks(str, n) {
        const date = dmx.parseDate(str);
        if (!dmx.isValidDate(date)) return undefined;
        date.setDate(date.getDate() + (Number(n) * 7));
        return dmx.formatDate(date);
    },

    // addDays(n:Number):String
    addDays(str, n) {
        const date = dmx.parseDate(str);
        if (!dmx.isValidDate(date)) return undefined;
        date.setDate(date.getDate() + Number(n));
        return dmx.formatDate(date);
    },

    // addHours(n:Number):String
    addHours(str, n) {
        const date = dmx.parseDate(str);
        if (!dmx.isValidDate(date)) return undefined;
        date.setHours(date.getHours() + Number(n));
        return dmx.formatDate(date);
    },

    // addMinutes(n:Number):String
    addMinutes(str, n) {
        const date = dmx.parseDate(str);
        if (!dmx.isValidDate(date)) return undefined;
        date.setMinutes(date.getMinutes() + Number(n));
        return dmx.formatDate(date);
    },

    // addSeconds(n:Number):String
    addSeconds(str, n) {
        const date = dmx.parseDate(str);
        if (!dmx.isValidDate(date)) return undefined;
        date.setSeconds(date.getSeconds() + Number(n));
        return dmx.formatDate(date);
    },

    // addMilliseconds(n:Number):String
    addMilliseconds(str, n) {
        const date = dmx.parseDate(str);
        if (!dmx.isValidDate(date)) return undefined;
        date.setMilliseconds(date.getMilliseconds() + Number(n));
        return dmx.formatDate(date);
    },

    // yearsUntil(date:String):Number
    yearsUntil(str1, str2) {
        const date1 = dmx.parseDate(str1);
        const date2 = dmx.parseDate(str2);
        if (!dmx.isValidDate(date1) || !dmx.isValidDate(date2)) return undefined;
        return date2.getFullYear() - date1.getFullYear();
    },

    // monthsUntil(date:String):Number
    monthsUntil(str1, str2) {
        const date1 = dmx.parseDate(str1);
        const date2 = dmx.parseDate(str2);
        if (!dmx.isValidDate(date1) || !dmx.isValidDate(date2)) return undefined;
        return date2.getFullYear() * 12 + date2.getMonth() - (date1.getFullYear() * 12 + date1.getMonth());
    },

    // weeksUntil(date:String):String
    weeksUntil(str1, str2) {
        const date1 = dmx.parseDate(str1);
        const date2 = dmx.parseDate(str2);
        if (!dmx.isValidDate(date1) || !dmx.isValidDate(date2)) return undefined;
        return Math.floor((date2 - date1) / 604800000); // 7 * 24 * 60 * 60 * 1000
    },

    // daysUntil(date:String):Number
    daysUntil(str1, str2) {
        const date1 = dmx.parseDate(str1);
        const date2 = dmx.parseDate(str2);
        if (!dmx.isValidDate(date1) || !dmx.isValidDate(date2)) return undefined;
        const resetTime = (date) => {
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
            date.setMilliseconds(0);
            return date;
        };
        return Math.round((resetTime(date2) - resetTime(date1)) / 86400000); // 24 * 60 * 60 * 1000
    },

    // hoursUntil(date:String):Number
    hoursUntil(str1, str2) {
        const date1 = dmx.parseDate(str1);
        const date2 = dmx.parseDate(str2);
        if (!dmx.isValidDate(date1) || !dmx.isValidDate(date2)) return undefined;
        return Math.floor((date2 - date1) / 3600000); // 60 * 60 * 1000
    },

    // minutesUntil(date:String):Number
    minutesUntil(str1, str2) {
        const date1 = dmx.parseDate(str1);
        const date2 = dmx.parseDate(str2);
        if (!dmx.isValidDate(date1) || !dmx.isValidDate(date2)) return undefined;
        return Math.floor((date2 - date1) / 60000); // 60 * 1000
    },

    // secondsUntil(date:String):Number
    secondsUntil(str1, str2) {
        const date1 = dmx.parseDate(str1);
        const date2 = dmx.parseDate(str2);
        if (!dmx.isValidDate(date1) || !dmx.isValidDate(date2)) return undefined;
        return Math.floor((date2 - date1) / 1000);
    },

    // millisecondsUntil(date:String):Number
    millisecondsUntil(str1, str2) {
        const date1 = dmx.parseDate(str1);
        const date2 = dmx.parseDate(str2);
        if (!dmx.isValidDate(date1) || !dmx.isValidDate(date2)) return undefined;
        return date2 - date1;
    },

    // timeUntil(date:String, incHours:Boolean):String
    timeUntil(str1, str2, incHours) {
        const pad = (s, n) => ('0000' + n).slice(-s);
        const date1 = dmx.parseDate(str1);
        const date2 = dmx.parseDate(str2);
        if (!dmx.isValidDate(date1) || !dmx.isValidDate(date2)) return undefined;
        let seconds = Math.floor((date2 - date1) / 1000);
        let minutes = Math.floor(seconds / 60);
        let hours = Math.floor(minutes / 60);
        seconds -= minutes * 60;
        if (incHours) {
            minutes -= hours * 60;
            return hours + ':' + pad(2, minutes) + ':' + pad(2, seconds);
        }
        return minutes + ':' + pad(2, seconds);
    },

    // formatDate(format:String):String
    formatDate(str, format) {
        const pad = (s, n) => ('0000' + n).slice(-s);
        const date = dmx.parseDate(str);
        if (!dmx.isValidDate(date)) return undefined;
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        const weekday = date.getDay();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        const milliseconds = date.getMilliseconds();
        return format.replace(/([yMdHhmsSaAvw])(\1+)?/g, (part) => {
            switch (part) {
                case 'yyyy':
                    return pad(4, year);
                case 'yy':
                    return pad(2, year);
                case 'y':
                    return year;
                case 'MMMM':
                    return dmx.l10n.en.months[month];
                case 'MMM':
                    return dmx.l10n.en.monthsShort[month];
                case 'MM':
                    return pad(2, month + 1);
                case 'M':
                    return month + 1;
                case 'dddd':
                    return dmx.l10n.en.days[weekday];
                case 'ddd':
                    return dmx.l10n.en.daysShort[weekday];
                case 'dd':
                    return pad(2, day);
                case 'd':
                    return day;
                case 'HH':
                    return pad(2, hours);
                case 'H':
                    return hours;
                case 'hh':
                    return pad(2, hours % 12 || 12);
                case 'h':
                    return hours % 12 || 12;
                case 'mm':
                    return pad(2, minutes);
                case 'm':
                    return minutes;
                case 'ss':
                    return pad(2, seconds);
                case 's':
                    return seconds;
                case 'a':
                    return hours < 12 ? 'am' : 'pm';
                case 'A':
                    return hours < 12 ? 'AM' : 'PM';
                case 'v':
                case 'SSS':
                    return pad(3, milliseconds);
                case 'w':
                    return weekday;
            }
            return part;
        });
    },
});