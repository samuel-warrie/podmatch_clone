(function() {

    var toString = Object.prototype.toString;
    var hasOwnProperty = Object.prototype.hasOwnProperty;

    var arrayBufferTag = '[object ArrayBuffer]';
    var booleanTag = '[object Boolean]';
    var dateTag = '[object Date]';
    var dataViewTag = '[object DataView]';
    var mapTag = '[object Map]';
    var numberTag = '[object Number]';
    var objectTag = '[object Object]';
    var regexpTag = '[object RegExp]';
    var setTag = '[object Set]';
    var stringTag = '[object String]';
    var imageDataTag = '[object ImageData]';

    var typedArrayTags = Object.create(null);
    [
        '[object Float32Array]',
        '[object Float64Array]',
        '[object Int8Array]',
        '[object Int16Array]',
        '[object Int32Array]',
        '[object Uint8Array]',
        '[object Uint8ClampedArray]',
        '[object Uint16Array]',
        '[object Uint32Array]',
        '[object BigInt64Array]',
        '[object BigUint64Array]'
    ].forEach(function(tag) {
        typedArrayTags[tag] = true;
    });

    var reFlags = /\w*$/;

    function isObject(value) {
        return value !== null && typeof value === 'object';
    }

    function isPlainObject(value) {
        if (!isObject(value)) return false;
        var proto = Object.getPrototypeOf(value);
        return proto === Object.prototype || proto === null;
    }

    function cloneArrayBuffer(buffer) {
        if (typeof buffer.slice === 'function') {
            return buffer.slice(0);
        }
        var result = new buffer.constructor(buffer.byteLength);
        new Uint8Array(result).set(new Uint8Array(buffer));
        return result;
    }

    function cloneTypedArray(array) {
        var buffer = cloneArrayBuffer(array.buffer);
        return new array.constructor(buffer, array.byteOffset, array.length);
    }

    function cloneDataView(view) {
        return new view.constructor(cloneArrayBuffer(view.buffer), view.byteOffset, view.byteLength);
    }

    function cloneRegExp(regexp) {
        var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
        result.lastIndex = regexp.lastIndex;
        return result;
    }

    function cloneImageData(imageData) {
        var Ctor = imageData.constructor;
        return typeof Ctor === 'function' ? new Ctor(cloneTypedArray(imageData.data), imageData.width, imageData.height) : imageData;
    }

    function assign(result, key, value) {
        if (key === '__proto__') return;
        result[key] = value;
    }

    function copyObject(source, stack) {
        var target = {};
        stack.set(source, target);

        var keys = Object.keys(source);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            assign(target, key, clone(source[key], stack));
        }

        if (Object.getOwnPropertySymbols) {
            var symbols = Object.getOwnPropertySymbols(source);
            for (var j = 0; j < symbols.length; j++) {
                var symbolKey = symbols[j];
                if (hasOwnProperty.call(source, symbolKey)) {
                    target[symbolKey] = clone(source[symbolKey], stack);
                }
            }
        }

        return target;
    }

    function copyArray(source, stack) {
        var length = source.length;
        var target = new Array(length);
        stack.set(source, target);

        for (var i = 0; i < length; i++) {
            target[i] = clone(source[i], stack);
        }

        return target;
    }

    function copyMap(source, stack) {
        var target = new Map();
        stack.set(source, target);
        source.forEach(function(value, key) {
            target.set(key, clone(value, stack));
        });
        return target;
    }

    function copySet(source, stack) {
        var target = new Set();
        stack.set(source, target);
        source.forEach(function(value) {
            target.add(clone(value, stack));
        });
        return target;
    }

    function clone(value, stack) {
        if (!isObject(value)) {
            return value;
        }

        if (!stack) {
            stack = new Map();
        } else {
            var existing = stack.get(value);
            if (existing) {
                return existing;
            }
        }

        var tag = toString.call(value);

        if (tag === dataViewTag) {
            return cloneDataView(value);
        }

        if (tag === arrayBufferTag) {
            return cloneArrayBuffer(value);
        }

        if (tag === dateTag || tag === booleanTag) {
            return new value.constructor(+value);
        }

        if (tag === numberTag || tag === stringTag) {
            return new value.constructor(value);
        }

        if (tag === regexpTag) {
            return cloneRegExp(value);
        }

        if (tag === mapTag) {
            return copyMap(value, stack);
        }

        if (tag === setTag) {
            return copySet(value, stack);
        }

        if (tag === imageDataTag) {
            return cloneImageData(value);
        }

        if (typedArrayTags[tag]) {
            return cloneTypedArray(value);
        }

        if (Array.isArray(value)) {
            return copyArray(value, stack);
        }

        if (isPlainObject(value)) {
            return copyObject(value, stack);
        }

        stack.set(value, value);
        return value;
    }

    dmx.clone = clone;

})();