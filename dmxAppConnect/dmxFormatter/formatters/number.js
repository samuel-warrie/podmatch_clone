dmx.Formatters('number', {

    // inRange(min:Number, max:Number):Boolean
    inRange(number, min, max) {
        return number >= min && number <= max;
    },

    // abs():Number
    abs(number) {
        return Math.abs(number);
    },

    // ceil():Number
    ceil(number) {
        return Math.ceil(number);
    },

    // floor():Number
    floor(number) {
        return Math.floor(number);
    },

    // max(max:Number):Number
    max(number, max) {
        return Math.max(number, max);
    },

    // min(min:Number):Number
    min(number, min) {
        return Math.min(number, min);
    },

    // pow(exponent:Number):Number
    pow(number, exponent) {
        return Math.pow(number, exponent);
    },

    // per(amount:Number):Number
    per(number, amount) {
        return (number * amount) / 100;
    },

    // perOf(total:Number):Number
    perOf(number, total) {
        return number / total;
    },

    // round([precision:Number]):Number
    round(number, precision = 0) {
        let factor = Math.pow(10, precision);
        let temp = number * factor;
        let rounded = Math.round(temp);
        return rounded / factor;
    },

    // pad(length:Number):String
    pad(number, length) {
        let neg = number < 0 ? '-' : '';
        let str = String(Math.abs(number));
        while (str.length < length) {
            str = '0' + str;
        }
        return neg + str;
    },

    // toFixed([decimals:Number]):String
    toFixed(number, decimals) {
        return number.toFixed(decimals);
    },

    // formatNumber([decimals:Number], [separator:String], [delimiter:String]):String
    formatNumber(number, decimals, separator = '.', delimiter = '') {
        if (isNaN(number)) return 'Invalid Number';
        if (!isFinite(number)) return (number < 0 ? '-' : '') + '\u221E';

        separator = separator || '.';
        delimiter = delimiter || '';

        let neg = number < 0;
        number = Math.abs(number);
        let x = (decimals != null && decimals >= 0 ? number.toFixed(decimals) : number.toString()).split('.');
        let x1 = x[0];
        let x2 = x.length > 1 ? separator + x[1] : '';

        if (delimiter) {
            let re = /(\d+)(\d{3})/;
            while (re.test(x1)) {
                x1 = x1.replace(re, '$1' + delimiter + '$2');
            }
        }

        return (neg ? '-' : '') + x1 + x2;
    },

    // formatPercentage([decimals:Number]):String
    formatPercentage(number, decimals) {
        if (isNaN(number) || !isFinite(number)) return 'Invalid Percentage';

        let num = number * 100;
        if (decimals != null && decimals >= 0) {
            num = num.toFixed(decimals);
        }
        return num + '%';
    },

    // formatCurrency([unit:String], [separator:String], [delimiter:String], [precision:Number]):String
    formatCurrency(number, unit = '$', separator = '.', delimiter = ',', precision = 2) {
        if (isNaN(number) || !isFinite(number)) return 'Invalid Amount';

        let neg = number < 0;
        let x = Math.abs(number).toFixed(precision).split('.');
        let x1 = x[0];
        let x2 = x.length > 1 ? separator + x[1] : '';

        if (delimiter) {
            let re = /(\d+)(\d{3})/;
            while (re.test(x1)) {
                x1 = x1.replace(re, '$1' + delimiter + '$2');
            }
        }

        return (neg ? '-' : '') + unit + x1 + x2;
    },

    // formatSize([decimals:Number], [binary:Boolean]):String
    formatSize(number, decimals = 2, binary = false) {
        if (isNaN(number) || !isFinite(number)) return 'Invalid Size';

        let base = binary ? 1024 : 1000;
        let suffix = binary ? ['KiB', 'MiB', 'GiB', 'TiB'] : ['KB', 'MB', 'GB', 'TB'];

        for (let i = 3; i >= 0; i--) {
            let n = Math.pow(base, i + 1);
            if (number >= n) {
                number /= n;
                if (decimals >= 0) {
                    number = number.toFixed(decimals);
                }
                return number + ' ' + suffix[i];
            }
        }

        return number + ' B';
    },

});