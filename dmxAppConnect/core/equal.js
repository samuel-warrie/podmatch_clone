(function() {

    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var toString = Object.prototype.toString;

    var arrayBufferTag = '[object ArrayBuffer]';
    var booleanTag = '[object Boolean]';
    var dateTag = '[object Date]';
    var dataViewTag = '[object DataView]';
    var mapTag = '[object Map]';
    var numberTag = '[object Number]';
    var regexpTag = '[object RegExp]';
    var setTag = '[object Set]';
    var stringTag = '[object String]';

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

    function isObject(value) {
        return value !== null && typeof value === 'object';
    }

    function isTypedArray(value) {
        return typedArrayTags[toString.call(value)] === true;
    }

    function equalArrayBuffer(a, b) {
        if (a.byteLength !== b.byteLength) {
            return false;
        }
        var viewA = new Uint8Array(a);
        var viewB = new Uint8Array(b);
        for (var i = 0; i < viewA.length; i++) {
            if (viewA[i] !== viewB[i]) {
                return false;
            }
        }
        return true;
    }

    function equalTypedArrays(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        for (var i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }

    function equalArrays(a, b, stack) {
        if (a.length !== b.length) {
            return false;
        }
        for (var i = 0; i < a.length; i++) {
            if (!equal(a[i], b[i], stack)) {
                return false;
            }
        }
        return true;
    }

    function equalObjects(a, b, stack) {
        var keysA = Object.keys(a);
        var keysB = Object.keys(b);
        if (keysA.length !== keysB.length) {
            return false;
        }

        for (var i = 0; i < keysA.length; i++) {
            var key = keysA[i];
            if (!hasOwnProperty.call(b, key)) {
                return false;
            }
        }

        for (var j = 0; j < keysA.length; j++) {
            var prop = keysA[j];
            if (!equal(a[prop], b[prop], stack)) {
                return false;
            }
        }

        var ctorA = a.constructor;
        var ctorB = b.constructor;
        if (ctorA !== ctorB && 'constructor' in a && 'constructor' in b) {
            if (!(typeof ctorA === 'function' && ctorA instanceof ctorA && typeof ctorB === 'function' && ctorB instanceof ctorB)) {
                return false;
            }
        }

        return true;
    }

    function equalMaps(a, b, stack) {
        if (a.size !== b.size) {
            return false;
        }

        var iteratorA = a.entries();
        var iteratorB = b.entries();
        while (true) {
            var nextA = iteratorA.next();
            var nextB = iteratorB.next();
            if (nextA.done && nextB.done) {
                return true;
            }
            if (nextA.done !== nextB.done) {
                return false;
            }
            var entryA = nextA.value;
            var entryB = nextB.value;
            if (!equal(entryA[0], entryB[0], stack) || !equal(entryA[1], entryB[1], stack)) {
                return false;
            }
        }
    }

    function equalSets(a, b, stack) {
        if (a.size !== b.size) {
            return false;
        }

        var iteratorA = a.values();
        var iteratorB = b.values();
        while (true) {
            var nextA = iteratorA.next();
            var nextB = iteratorB.next();
            if (nextA.done && nextB.done) {
                return true;
            }
            if (nextA.done !== nextB.done) {
                return false;
            }
            if (!equal(nextA.value, nextB.value, stack)) {
                return false;
            }
        }
    }

    function equalByTag(a, b, tag, stack) {
        switch (tag) {
            case dataViewTag:
                if (a.byteLength !== b.byteLength || a.byteOffset !== b.byteOffset) {
                    return false;
                }
                return equalArrayBuffer(a.buffer, b.buffer);

            case arrayBufferTag:
                return equalArrayBuffer(a, b);

            case booleanTag:
            case dateTag:
            case numberTag:
                return +a === +b || (a != a && b != b);

            case regexpTag:
            case stringTag:
                return String(a) === String(b);

            case mapTag:
                return equalMaps(a, b, stack);

            case setTag:
                return equalSets(a, b, stack);
        }

        if (typedArrayTags[tag]) {
            return equalTypedArrays(a, b);
        }

        return false;
    }

    function equal(a, b, stack) {
        if (a === b) {
            return true;
        }

        if (a == null || b == null) {
            return a != a && b != b;
        }

        if (!isObject(a) || !isObject(b)) {
            return a != a && b != b;
        }

        stack = stack || new Map();

        var stacked = stack.get(a);
        if (stacked && stacked === b) {
            return true;
        }
        stack.set(a, b);
        stack.set(b, a);

        var tagA = toString.call(a);
        var tagB = toString.call(b);

        if (tagA !== tagB) {
            return false;
        }

        if (tagA === '[object Array]') {
            return equalArrays(a, b, stack);
        }

        if (tagA === '[object Object]') {
            return equalObjects(a, b, stack);
        }

        return equalByTag(a, b, tagA, stack);
    }

    dmx.equal = equal;

})();