dmx.propCheck = /^\w+$/;

dmx.Formatters('array', {

    //toKeyedObject(): object
    toKeyedObject(array, key, value) {
        const staticKey = dmx.propCheck.test(key);
        const staticVal = dmx.propCheck.test(value);

        return array.reduce((obj, item, index) => {
            const scope = { ...item,
                $index: index,
                $key: index,
                $value: item
            };
            const k = staticKey ? item[key] : dmx.parse(key, dmx.DataScope(scope, this));
            obj[k] = staticVal ? item[value] : dmx.parse(value, dmx.DataScope(scope, this));
            return obj;
        }, {});
    },

    // hasItems():Boolean
    hasItems(array) {
        return !!array.length;
    },

    // contains(value:Any):Boolean
    contains(array, value) {
        return array.includes(value);
    },

    // join(separator:String):String
    join(array, separator) {
        return array.join(separator);
    },

    // count():Number
    count(array) {
        return array.length;
    },

    // top(count:Number):Array
    top(array, count = 1) {
        if (!array.length) return [];
        return array.slice(0, count);
    },

    // last(count:Number):Array
    // last():*
    last(array, count) {
        if (!array.length) return count == null ? undefined : [];
        return count == null ? array[array.length - 1] : array.slice(-count);
    },

    // first():*
    first(array) {
        return array[0];
    },

    // get(index:Number):*
    get(array, index) {
        return array[index];
    },

    // slice([begin:Number], [end:Number])
    slice(array, begin, end) {
        if (!array.length) return [];
        return array.slice(begin, end);
    },

    // reverse():Array
    reverse(array) {
        if (!array.length) return [];
        return array.slice(0).reverse();
    },

    // randomize():Array
    randomize(array) {
        if (!array.length) return [];

        const rnd = dmx.randomizer(this.seed * dmx.hashCode(array));
        let i = array.length,
            t, r;

        array = array.slice(0);

        while (0 !== i) {
            r = Math.floor(rnd() * i--);
            t = array[i];
            array[i] = array[r];
            array[r] = t;
        }

        return array;
    },

    // Collection formatters (requires array with objects in them)

    // filter(expression:Expression):Array
    filter(array, expression) {
        if (!array.length) return [];
        if (expression[0] == '$') array = dmx.repeatItems(array);
        return array.filter((item) => dmx.parse(expression, dmx.DataScope(item, this)));
    },

    // map(expression:Expression):Array
    map(array, expression) {
        if (!array.length) return [];
        if (expression[0] == '$') array = dmx.repeatItems(array);
        return array.map((item) => dmx.parse(expression, dmx.DataScope(item, this)));
    },

    // where(prop:String, value:String, [operator:String]):Array
    where(array, prop, value, operator = '==', caseInsensitive = false) {
        if (!array.length) return [];
        if (prop[0] == '$') array = dmx.repeatItems(array);

        return array.filter((item) => {
            var val = dmx.propCheck.test(prop) ? item[prop] : dmx.parse(prop, dmx.DataScope(item, this));

            switch (operator) {
                case 'startsWith':
                    if (caseInsensitive) return String(val).toLowerCase().startsWith(value.toLowerCase());
                    return String(val).startsWith(value);
                case 'endsWith':
                    if (caseInsensitive) return String(val).toLowerCase().endsWith(value.toLowerCase());
                    return String(val).endsWith(value);
                case 'contains':
                    if (caseInsensitive) return String(val).toLowerCase().includes(value.toLowerCase());
                    return String(val).includes(value);
                case 'notContains':
                    if (caseInsensitive) return !String(val).toLowerCase().includes(value.toLowerCase());
                    return !String(val).includes(value);
                case 'inArray':
                    if (caseInsensitive) return Array.isArray(value) && value.includes(val.toLowerCase());
                    return Array.isArray(value) && value.includes(val);
                case 'notInArray':
                    if (caseInsensitive) return !(Array.isArray(value) && value.includes(val.toLowerCase()));
                    return !(Array.isArray(value) && value.includes(val));
                case 'fuzzySearch':
                    return (function(string, search) {
                        if (search == null) return false;

                        const stringLen = string.length;
                        const searchLen = search.length;

                        if (caseInsensitive) {
                            string = string.toLowerCase();
                            search = search.toLowerCase();
                        }

                        if (searchLen > stringLen) return false;
                        if (searchLen === stringLen) return string === search;

                        outer: for (let i = 0, j = 0; i < searchLen; i++) {
                            const char = search.charCodeAt(i);

                            while (j < stringLen) {
                                if (string.charCodeAt(j++) === char) {
                                    continue outer;
                                }
                            }

                            return false;
                        }

                        return true;
                    })(String(val), value);
                case '==':
                    return val == value;
                case '===':
                    return val === value;
                case '!=':
                    return val != value;
                case '!==':
                    return val !== value;
                case '<':
                    return val < value;
                case '<=':
                    return val <= value;
                case '>':
                    return val > value;
                case '>=':
                    return val >= value;
            }

            return true;
        });
    },

    // values(prop:String):Array
    values(array, prop) {
        if (!array.length) return [];

        const static = dmx.propCheck.test(prop);

        return array.map((item) => {
            return static ? item[prop] : dmx.parse(prop, new dmx.DataScope(item, this));
        });
    },

    // groupBy(prop:String):Object
    groupBy(array, prop) {
        if (!array.length) return {};

        const static = dmx.propCheck.test(prop);

        return array.reduce((obj, item) => {
            const key = static ? item[prop] : dmx.parse(prop, new dmx.DataScope(item, this));

            if (obj[key]) {
                obj[key].push(item);
            } else {
                obj[key] = [item];
            }

            return obj;
        }, {});
    },

    // unique([prop:String]):Array
    unique(array, prop) {
        if (!array.length) return [];

        if (prop) {
            const static = dmx.propCheck.test(prop);

            array = array.map((item) => {
                return static ? item[prop] : dmx.parse(prop, dmx.DataScope(item, this));
            });
        }

        return Array.from(new Set(array));
    },

    // sortOn([prop:String]):Array
    sort(array, prop) {
        if (!array.length) return [];

        const static = !prop || dmx.propCheck.test(prop);

        return array.slice(0).sort((a, b) => {
            if (prop) {
                a = static ? a[prop] : dmx.parse(prop, dmx.DataScope(a, this));
                b = static ? b[prop] : dmx.parse(prop, dmx.DataScope(b, this));
            }
            return a < b ? -1 : a > b ? 1 : 0;
        });
    },

    // min([prop:String]):Number
    min(array, prop) {
        if (!array.length) return undefined;

        if (prop) {
            const static = dmx.propCheck.test(prop);

            array = array.map((item) => {
                return static ? item[prop] : dmx.parse(prop, dmx.DataScope(item, this));
            });
        }

        return Math.min.apply(null, array);
    },

    // max([prop:String]):Number
    max(array, prop) {
        if (!array.length) return undefined;

        if (prop) {
            const static = dmx.propCheck.test(prop);

            array = array.map((item) => {
                return static ? item[prop] : dmx.parse(prop, dmx.DataScope(item, this));
            });
        }

        return Math.max.apply(null, array);
    },

    // sum([prop:String]):Number
    sum(array, prop) {
        if (!array.length) return 0;

        const static = !prop || dmx.propCheck.test(prop);

        return array.reduce((sum, value) => {
            if (prop) value = static ? value[prop] : dmx.parse(prop, dmx.DataScope(value, this));
            return sum + Number(value);
        }, 0);
    },

    // avg([prop:String]):Number
    avg(array, prop) {
        if (!array.length) return 0;

        const static = !prop || dmx.propCheck.test(prop);

        return (array.reduce((sum, value) => {
            if (prop) value = static ? value[prop] : dmx.parse(prop, dmx.DataScope(value, this));
            return sum + Number(value);
        }, 0) / array.length);
    },

});