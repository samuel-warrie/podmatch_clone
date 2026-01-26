const EXPRESSION_CACHE = Symbol('dmxExpressionCache');

dmx._CACHE = new Map();

dmx._OPERATORS = new Map([
    ['{', 'L_CURLY'],
    ['}', 'R_CURLY'],
    ['[', 'L_BRACKET'],
    [']', 'R_BRACKET'],
    ['(', 'L_PAREN'],
    [')', 'R_PAREN'],
    ['.', 'PERIOD'],
    [',', 'COMMA'],
    [';', 'SEMI'], // not used
    [':', 'COLON'],
    ['?', 'QUESTION'],
    //  Arithmetic operators
    ['-', 'ADDICTIVE'],
    ['+', 'ADDICTIVE'],
    ['*', 'MULTIPLICATIVE'],
    ['/', 'MULTIPLICATIVE'],
    ['%', 'MULTIPLICATIVE'],
    // Comparison operators
    ['===', 'EQUALITY'],
    ['!==', 'EQUALITY'],
    ['==', 'EQUALITY'],
    ['!=', 'EQUALITY'],
    ['<', 'RELATIONAL'],
    ['>', 'RELATIONAL'],
    ['<=', 'RELATIONAL'],
    ['>=', 'RELATIONAL'],
    ['in', 'RELATIONAL'],
    // Logical operators
    ['&&', 'LOGICAL_AND'],
    ['||', 'LOGICAL_OR'],
    ['!', 'LOGICAL_NOT'],
    // Bitwise operators
    ['&', 'BITWISE_AND'],
    ['|', 'BITWISE_OR'],
    ['^', 'BITWISE_XOR'],
    ['~', 'BITWISE_NOT'],
    ['<<', 'BITWISE_SHIFT'],
    ['>>', 'BITWISE_SHIFT'],
    ['>>>', 'BITWISE_SHIFT'],
]);

dmx._ESCAPE_CHARS = new Map([
    ['n', '\n'],
    ['r', '\r'],
    ['t', '\t'],
    ['b', '\b'],
    ['f', '\f'],
    ['v', '\v'],
    ['0', '\0'],
    ["'", "'"],
    ['`', '`'],
    ['"', '"'],
]);

dmx._EXPRESSIONS = new Map([
    ['**', (a, b) => Math.pow(a(), b())],
    ['??', (a, b) => (a = a(), a == null ? b() : a)],
    ['in', (a, b) => a() in b()],
    ['?', (a, b, c) => (a() ? b() : c())],
    ['+', (a, b) => (a = a(), b = b(), a == null ? b : b == null ? a : a + b)],
    ['-', (a, b) => a() - b()],
    ['*', (a, b) => a() * b()],
    ['/', (a, b) => a() / b()],
    ['%', (a, b) => a() % b()],
    ['===', (a, b) => a() === b()],
    ['!==', (a, b) => a() !== b()],
    ['==', (a, b) => a() == b()],
    ['!=', (a, b) => a() != b()],
    ['<', (a, b) => a() < b()],
    ['>', (a, b) => a() > b()],
    ['<=', (a, b) => a() <= b()],
    ['>=', (a, b) => a() >= b()],
    ['&&', (a, b) => a() && b()],
    ['||', (a, b) => a() || b()],
    ['&', (a, b) => a() & b()],
    ['|', (a, b) => a() | b()],
    ['^', (a, b) => a() ^ b()],
    ['<<', (a, b) => a() << b()],
    ['>>', (a, b) => a() >> b()],
    ['>>>', (a, b) => a() >>> b()],
    ['~', (a) => ~a()],
    ['!', (a) => !a()],
]);

dmx._RESERVED = new Map([
    ['this', (scope) => () => scope && scope.$this != null ? scope.$this : scope.data],
    ['true', () => () => true],
    ['false', () => () => false],
    ['null', () => () => null],
    ['undefined', () => () => undefined],
    ['_', () => () => ({
        __dmxScope__: true
    })],
]);

dmx._SUPPORTED_TYPES = new Map([
    ['Boolean', 'boolean'],
    ['Null', 'null'],
    ['Undefined', 'undefined'],
    ['Number', 'number'],
    ['BigInt', 'number'],
    ['Decimal', 'number'], // requires Decimal.js
    ['String', 'string'],
    ['Date', 'date'],
    ['RegExp', 'regexp'],
    ['Blob', 'blob'],
    ['File', 'file'],
    ['FileList', 'filelist'],
    ['ArrayBuffer', 'arraybuffer'],
    ['ImageBitmap', 'imagebitmap'],
    ['ImageData', 'imagedata'],
    ['Array', 'array'],
    ['Object', 'object'],
    ['Map', 'map'],
    ['Set', 'set'],
    ['DataView', 'array'],
    ['Int8Array', 'array'],
    ['Uint8Array', 'array'],
    ['Uint8ClampedArray', 'array'],
    ['Int16Array', 'array'],
    ['Uint16Array', 'array'],
    ['Int32Array', 'array'],
    ['Uint32Array', 'array'],
    ['Float32Array', 'array'],
    ['Float64Array', 'array'],
    ['BigInt64Array', 'array'],
    ['BigUint64Array', 'array'],
]);

dmx.getType = function(obj) {
    return dmx._SUPPORTED_TYPES.get(Object.prototype.toString.call(obj).slice(8, -1));
};

dmx.lexer = function(expression) {
    if (dmx._CACHE.has(expression)) {
        return dmx._CACHE.get(expression);
    }

    let tokens = [],
        token, name, start, index = 0,
        op = true,
        ch, ch2, ch3;

    while (index < expression.length) {
        start = index;

        ch = read();

        if (isQuote(ch)) {
            name = 'STRING';
            token = readString(ch);
            op = false;
        } else if ((isDigid(ch) || (is('.') && peek() && isDigid(peek()))) && op) {
            name = 'NUMBER';
            token = readNumber();
            op = false;
        } else if (isAlpha(ch) && op) {
            name = 'IDENT';
            token = readIdent();
            if (is('(')) {
                name = 'METHOD';
            }
            op = false;
        } else if (is('/') && op && (token == '(' || token == ',' || token == '?' || token == ':') && testRegexp()) {
            name = 'REGEXP';
            token = readRegexp();
            op = false;
        } else if (isWhitespace(ch)) {
            index++;
            continue;
        } else if ((ch3 = read(3)) && dmx._OPERATORS.has(ch3)) {
            name = dmx._OPERATORS.get(ch3);
            token = ch3;
            op = true;
            index += 3;
        } else if ((ch2 = read(2)) && dmx._OPERATORS.has(ch2)) {
            name = dmx._OPERATORS.get(ch2);
            token = ch2;
            op = true;
            index += 2;
        } else if (dmx._OPERATORS.has(ch)) {
            name = dmx._OPERATORS.get(ch);
            token = ch;
            op = true;
            index++;
        } else {
            throw new Error(`Unexpected token "${ch}" at index ${index} in expression: ${expression}`);
        }

        tokens.push({
            name,
            index: start,
            value: token
        });
    }

    dmx._CACHE.set(expression, tokens);

    return tokens;

    function read(n) {
        return n > 1 ? expression.slice(index, index + n) : expression[index];
    }

    function peek(n = 1) {
        return index + n < expression.length ? expression[index + n] : false;
    }

    function is(chars) {
        return chars.includes(ch);
    }

    function isQuote(ch) {
        return ch == '"' || ch == "'" || ch == '`';
    }

    function isDigid(ch) {
        return ch >= '0' && ch <= '9';
    }

    function isAlpha(ch) {
        return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_' || ch === '$';
    }

    function isAlphaNum(ch) {
        return isAlpha(ch) || isDigid(ch);
    }

    function isWhitespace(ch) {
        return ch == ' ' || ch == '\r' || ch == '\t' || ch == '\n' || ch == '\v' || ch == '\u00A0';
    }

    function isExpOperator(ch) {
        return ch == '-' || ch == '+' || isDigid(ch);
    }

    function readString(quote) {
        let escape = false,
            result = '';

        index++;

        while (index < expression.length) {
            ch = read();

            if (escape) {
                if (ch == 'u') {
                    index++;
                    const hex = read(4);
                    if (!hex.match(/[\da-f]{4}/i)) {
                        throw new Error(`Invalid unicode escape [\\u${hex}] at index ${index} in expression: ${expression}`);
                    }
                    result += String.fromCharCode(parseInt(hex, 16));
                    index += 4;
                } else {
                    result += dmx._ESCAPE_CHARS.has(ch) ? dmx._ESCAPE_CHARS.get(ch) : ch;
                }

                escape = false;
            } else if (ch == '\\') {
                escape = true;
            } else if (ch == quote) {
                index++;
                if (quote == '`') {
                    result = '{{' + result + '}}';
                }
                return result;
            } else {
                result += ch;
            }

            index++;
        }

        throw new Error(`Unterminated string in expression: ${expression}`);
    }

    function readNumber() {
        let result = '',
            exponent = false;

        while (index < expression.length) {
            ch = read();

            if (is('_') && peek() && isDigid(peek())) {
                index++;
                continue;
            }

            if ((is('.') && peek() && isDigid(peek())) || isDigid(ch)) {
                result += ch;
            } else {
                const next = peek();

                if (is('eE') && isExpOperator(next)) {
                    result += 'e';
                    exponent = true;
                } else if (isExpOperator(ch) && next && isDigid(next) && exponent) {
                    result += ch;
                    exponent = false;
                } else if (isExpOperator(ch) && (!next || !isDigid(next)) && exponent) {
                    throw new Error(`Invalid exponent in expression: ${expression}`);
                } else {
                    break;
                }
            }

            index++;
        }

        if (read() == 'n') {
            index++;
            return BigInt(result);
        }

        if (read() == 'm') {
            index++;
            if (window.Decimal) {
                return new Decimal(result);
            } else {
                console.warn('Decimal number in expression but library not found');
            }
        }

        return +result;
    }

    function readIdent() {
        let result = '';

        while (index < expression.length) {
            ch = read();

            if (isAlphaNum(ch)) {
                result += ch;
            } else {
                break;
            }

            index++;
        }

        return result;
    }

    function readRegexp() {
        let result = '',
            modifiers = '',
            escape = false;

        index++;

        while (index < expression.length) {
            ch = read();

            if (escape) {
                escape = false;
            } else if (ch == '\\') {
                escape = true;
            } else if (ch == '/') {
                index++;

                while ('ign'.includes(ch = read())) {
                    modifiers += ch;
                    index++;
                }

                return new RegExp(result, modifiers);
            }

            result += ch;
            index++;
        }

        throw new Error(`Unterminated regexp in expression: ${expression}`);
    }

    function testRegexp() {
        let i = index,
            ok = true;

        try {
            readRegexp();
        } catch (e) {
            ok = false;
        }

        index = i;
        ch = '/';

        return ok;
    }
};

dmx.parse = function(expression, scope = dmx.app, context) {
    if (typeof expression !== 'string') {
        return expression;
    }

    expression = expression.trim();

    const ctx = Object.assign({}, context || {});
    ctx.expression = ctx.expression || expression;
    if (!ctx.component && scope && scope.$node) {
        ctx.component = scope;
    }

    if (expression.includes('{{')) {
        if (expression.startsWith('{{') && expression.endsWith('}}') && !expression.slice(2).includes('{{')) {
            expression = expression.slice(2, -2);
        } else {
            return expression.replace(/{{(.+?)}}/g, (_, innerExpression) => {
                const result = dmx.parse(innerExpression, scope, ctx);
                return result == null ? '' : result;
            });
        }
    }

    if (!expression) return undefined;

    let tokens, callContext, evaluator;
    const cacheTarget = scope && typeof scope === 'object' ? scope : null;
    const cacheKey = expression;
    let cache = cacheTarget && cacheTarget[EXPRESSION_CACHE];

    if (cache && cache.has(cacheKey)) {
        evaluator = cache.get(cacheKey);
    }

    try {
        if (!evaluator) {
            tokens = Array.from(dmx.lexer(expression));
            evaluator = doParse();

            if (cacheTarget) {
                if (!cache) {
                    cache = new Map();
                    cacheTarget[EXPRESSION_CACHE] = cache;
                }
                cache.set(cacheKey, evaluator);
            }
        }

        return evaluator();
    } catch (e) {
        if (dmx.errors && dmx.errors.FormatterError && e instanceof dmx.errors.FormatterError) {
            throw e;
        }

        const error = dmx.errors && dmx.errors.createExpressionError ?
            dmx.errors.createExpressionError({
                expression,
                scope,
                context: ctx,
                originalError: e,
            }) :
            e;

        if (dmx.errors && dmx.errors.handleExpressionError && error instanceof Error && error !== e) {
            return dmx.errors.handleExpressionError(error);
        }

        if (dmx.errors && dmx.errors.handleExpressionError) {
            return dmx.errors.handleExpressionError(
                dmx.errors.createExpressionError({
                    expression,
                    scope,
                    context: ctx,
                    originalError: e,
                })
            );
        }

        console.error('Error parsing expression:', expression, e);
    }

    return undefined;

    function read() {
        if (tokens.length === 0) {
            throw new Error(`Unexpected end of expression: ${expression}`);
        }

        return tokens[0];
    }

    function peek(e) {
        if (tokens.length > 0) {
            const token = tokens[0];

            if (!e || token.name == e) {
                return token;
            }
        }

        return false;
    }

    function expect(e) {
        const token = peek(e);

        if (token) {
            tokens.shift();
            return token;
        }

        return false;
    }

    function consume(e) {
        if (!expect(e)) {
            throw new Error(`Expected ${e} at index ${tokens[0].index} in expression: ${expression}`);
        }
    }

    function fn(exp) {
        const args = Array.prototype.slice.call(arguments, 1);

        return () => {
            if (dmx._EXPRESSIONS.has(exp)) {
                return dmx._EXPRESSIONS.get(exp).apply(scope, args);
            }

            return exp;
        };
    }

    function doParse() {
        const parts = [];

        while (true) {
            if (tokens.length > 0 && !(peek('R_PAREN') || peek('R_BRACKET') || peek('R_CURLY') || peek('COMMA') || peek('SEMI'))) {
                parts.push(parseExpression());
            }

            if (!(expect('COMMA') || expect('SEMI'))) {
                const runner = parts.length === 1 ? parts[0] : sequence;
                return () => runner();
            }
        }

        function sequence() {
            let result;

            for (let i = 0; i < parts.length; i++) {
                const expr = parts[i];
                if (expr) {
                    result = expr();
                }
            }

            return result;
        }
    }

    function parseExpression() {
        return parseConditional();
    }

    function parseConditional() {
        const a = parseLogicalOr();

        if (expect('QUESTION')) {
            const b = parseExpression();
            consume('COLON');
            const c = parseExpression();

            return fn('?', a, b, c);
        }

        return a;
    }

    function parseLogicalOr() {
        let a = parseLogicalAnd();

        while (expect('LOGICAL_OR')) {
            const b = parseLogicalAnd();
            a = fn('||', a, b);
        }

        return a;
    }

    function parseLogicalAnd() {
        let a = parseBitwiseOr();

        while (expect('LOGICAL_AND')) {
            const b = parseBitwiseOr();
            a = fn('&&', a, b);
        }

        return a;
    }

    function parseBitwiseOr() {
        let a = parseBitwiseXor();

        while (expect('BITWISE_OR')) {
            const b = parseBitwiseXor();
            a = fn('|', a, b);
        }

        return a;
    }

    function parseBitwiseXor() {
        let a = parseBitwiseAnd();

        while (expect('BITWISE_XOR')) {
            const b = parseBitwiseAnd();
            a = fn('^', a, b);
        }

        return a;
    }

    function parseBitwiseAnd() {
        let a = parseEquality();

        while (expect('BITWISE_AND')) {
            const b = parseEquality();
            a = fn('&', a, b);
        }

        return a;
    }

    function parseEquality() {
        let a = parseRelational(),
            b;

        if ((b = expect('EQUALITY'))) {
            const c = parseEquality();
            a = fn(b.value, a, c);
        }

        return a;
    }

    function parseRelational() {
        let a = parseBitwiseShift(),
            b;

        if ((b = expect('RELATIONAL'))) {
            const c = parseRelational();
            a = fn(b.value, a, c);
        }

        return a;
    }

    function parseBitwiseShift() {
        let a = parseAddictive(),
            b;

        if ((b = expect('BITWISE_SHIFT'))) {
            const c = parseBitwiseShift();
            a = fn(b.value, a, c);
        }

        return a;
    }

    function parseAddictive() {
        let a = parseMultiplicative(),
            b;

        while ((b = expect('ADDICTIVE'))) {
            const c = parseMultiplicative();
            a = fn(b.value, a, c);
        }

        return a;
    }

    function parseMultiplicative() {
        let a = parseUnary(),
            b;

        while ((b = expect('MULTIPLICATIVE'))) {
            const c = parseUnary();
            a = fn(b.value, a, c);
        }

        return a;
    }

    function parseUnary() {
        let a;

        if ((a = expect('ADDICTIVE'))) {
            if (a.value == '+') {
                return parsePrimary();
            } else {
                return fn(a.value, () => 0, parsePrimary());
            }
        } else if ((a = expect('LOGICAL_NOT'))) {
            return fn(a.value, parseUnary());
        } else if ((a = expect('BITWISE_NOT'))) {
            return fn(a.value, parseUnary());
        } else {
            return parsePrimary();
        }
    }

    function parsePrimary() {
        let result, next;

        if (expect('L_PAREN')) {
            result = parseExpression();
            consume('R_PAREN');
        } else if (expect('L_CURLY')) {
            const obj = {};

            if (read().name != 'R_CURLY') {
                do {
                    const key = expect().value;
                    consume('COLON');
                    obj[key] = parseExpression()();
                } while (expect('COMMA'));
            }

            result = fn(obj);

            consume('R_CURLY');
        } else if (expect('L_BRACKET')) {
            const arr = [];

            if (read().name != 'R_BRACKET') {
                do {
                    arr.push(parseExpression()());
                } while (expect('COMMA'));
            }

            result = fn(arr);

            consume('R_BRACKET');
        } else if (expect('PERIOD')) {
            result = peek() ? parseMember(fn(scope.data)) : fn(scope.data);
        } else {
            const token = expect();

            if (token === false) {
                throw new Error(`Unexpected end of expression: ${expression}`);
            }

            if (token.name == 'IDENT') {
                result = dmx._RESERVED.has(token.value) ? dmx._RESERVED.get(token.value)(scope) : () => scope.get(token.value);
            } else if (token.name == 'METHOD') {
                result = fn(dmx.__formatters.global[token.value] || (() => {
                    console.warn(`Method "${token.value}" not found in expression: ${expression}`);
                    return undefined;
                }));
            } else {
                result = () => token.value;
            }
        }

        while ((next = expect('L_PAREN') || expect('L_BRACKET') || expect('PERIOD'))) {
            if (next.value == '(') {
                result = parseCall(result, callContext);
            } else if (next.value == '[') {
                callContext = result;
                result = parseIndex(result, callContext);
            } else if (next.value == '.') {
                callContext = result;
                result = parseMember(result, callContext);
            } else {
                throw new Error(`Unexpected token "${next.value}" at index ${next.index} in expression: ${expression}`);
            }
        }

        callContext = null;

        return result;
    }

    function parseCall(func, context) {
        const argsFn = [];

        if (read().name != 'R_PAREN') {
            do {
                argsFn.push(parseExpression());
            } while (expect('COMMA'));
        }

        consume('R_PAREN');

        const hasContext = typeof context === 'function';
        const argCount = argsFn.length;
        const bufferSize = argCount + (hasContext ? 1 : 0);
        const argsBuffer = bufferSize > 0 ? new Array(bufferSize) : null;

        return () => {
            const target = func() || dmx.noop;
            const name = target && target.name ? target.name : '<anonymous>';

            if (!argsBuffer) {
                try {
                    return target.call(scope);
                } catch (error) {
                    if (dmx && dmx.config && dmx.config.throwErrors) {
                        throw error;
                    }

                    if (console && console.warn) {
                        console.warn(`Error calling method ${name} in expression: ${expression}`, error);
                    }

                    return undefined;
                }
            }

            let offset = 0;

            if (hasContext) {
                argsBuffer[offset++] = context();
            }

            for (let i = 0; i < argCount; i++) {
                argsBuffer[offset++] = argsFn[i]();
            }

            const baseLength = argsBuffer.length;
            argsBuffer.length = offset;

            try {
                return target.apply(scope, argsBuffer);
            } catch (error) {
                if (dmx && dmx.config && dmx.config.throwErrors) {
                    throw error;
                }

                if (console && console.warn) {
                    console.warn(`Error calling method ${name} in expression: ${expression}`, error);
                }

                return undefined;
            } finally {
                argsBuffer.length = baseLength;
            }
        };
    }

    function parseIndex(object) {
        const indexFn = parseExpression();

        consume('R_BRACKET');

        return () => {
            const obj = object();
            const index = indexFn();

            if (typeof obj != 'object' || obj == null) {
                return undefined;
            }

            if (obj.__dmxScope__) {
                return scope.get(index);
            }

            if (dmx.getType(obj) == 'map') {
                return obj.get(index);
            }

            return obj[index];
        };
    }

    function parseMember(object) {
        const token = expect();

        return () => {
            const obj = object();
            const type = dmx.getType(obj);

            if (token.name == 'METHOD') {
                const method = '__' + token.value;

                if (type == 'map' && typeof obj.get(method) == 'function') {
                    return obj.get(method).bind(obj);
                }

                if (type == 'object' && typeof obj[method] == 'function') {
                    return obj[method];
                }

                if (dmx.__formatters[type] && dmx.__formatters[type][token.value]) {
                    return dmx.__formatters[type][token.value];
                }

                if (dmx.__formatters['any'] && dmx.__formatters['any'][token.value]) {
                    return dmx.__formatters['any'][token.value];
                }

                return () => {
                    if (obj != null) {
                        console.warn(`Method "${token.value}" not found in expression: ${expression}`);
                    }
                    return undefined;
                };
            }

            if (obj && obj.__dmxScope__) {
                return scope.get(token.value);
            }

            if (type == 'map') {
                return obj.get(token.value);
            }

            return obj && typeof obj == 'object' && token.value in obj ? obj[token.value] : undefined;
        };
    }
};