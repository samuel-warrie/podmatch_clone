if (!window.Hjson) {
    window.Hjson = {};

    window.Hjson.parse = function(source) {
        // only parse, stripped dsf and comment support

        var text;
        var at; // The index of the current character
        var ch; // The current character
        var escapee = {
            '"': '"',
            "'": "'",
            '\\': '\\',
            '/': '/',
            b: '\b',
            f: '\f',
            n: '\n',
            r: '\r',
            t: '\t'
        };

        function stripMultilineIndent(content) {
            if (!content) return content;

            var lines = content.split('\n');
            var minIndent = null;

            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (!line.trim()) continue;

                var match = line.match(/^[ \t]*/);
                var indentLength = match ? match[0].length : 0;

                if (minIndent === null || indentLength < minIndent) {
                    minIndent = indentLength;
                }
            }

            if (!minIndent) return content;

            for (var j = 0; j < lines.length; j++) {
                var current = lines[j];
                if (!current.trim()) {
                    lines[j] = '';
                    continue;
                }
                var sliceIndex = Math.min(minIndent, current.length);
                lines[j] = current.slice(sliceIndex);
            }

            return lines.join('\n');
        }

        function resetAt() {
            at = 0;
            ch = ' ';
        }

        function isPunctuatorChar(c) {
            return c === '{' || c === '}' || c === '[' || c === ']' || c === ',' || c === ':';
        }

        // Call error when something is wrong.
        function error(m) {
            var i, col = 0,
                line = 1;
            for (i = at - 1; i > 0 && text[i] !== '\n'; i--, col++) {}
            for (; i > 0; i--)
                if (text[i] === '\n') line++;
            throw new Error(m + " at line " + line + "," + col + " >>>" + text.substr(at - col, 20) + " ...");
        }

        function next() {
            // get the next character.
            ch = text.charAt(at);
            at++;
            return ch;
        }

        function peek(offs) {
            // range check is not required
            return text.charAt(at + offs);
        }

        function peekNonWhitespace(offs) {
            var idx = offs || 0;
            var c = text.charAt(at + idx);

            while (c && c <= ' ' && c !== '\n' && c !== '\r') {
                idx++;
                c = text.charAt(at + idx);
            }

            return c;
        }

        function string(allowML) {
            // Parse a string value.
            // callers make sure that (ch === '"' || ch === "'")
            var string = '';

            // When parsing for string values, we must look for "/' and \ characters.
            var exitCh = ch;
            while (next()) {
                if (ch === exitCh) {
                    next();
                    if (allowML && exitCh === "'" && ch === "'" && string.length === 0) {
                        // ''' indicates a multiline string
                        next();
                        return mlString();
                    } else return string;
                }
                if (ch === '\\') {
                    next();
                    if (ch === 'u') {
                        var uffff = 0;
                        for (var i = 0; i < 4; i++) {
                            next();
                            var c = ch.charCodeAt(0),
                                hex;
                            if (ch >= '0' && ch <= '9') hex = c - 48;
                            else if (ch >= 'a' && ch <= 'f') hex = c - 97 + 0xa;
                            else if (ch >= 'A' && ch <= 'F') hex = c - 65 + 0xa;
                            else error("Bad \\u char " + ch);
                            uffff = uffff * 16 + hex;
                        }
                        string += String.fromCharCode(uffff);
                    } else if (typeof escapee[ch] === 'string') {
                        string += escapee[ch];
                    } else break;
                } else if (ch === '\n' || ch === '\r') {
                    error("Bad string containing newline");
                } else {
                    string += ch;
                }
            }
            error("Bad string");
        }

        function mlString() {
            // Parse a multiline string value.
            var string = '',
                triple = 0;

            // we are at ''' +1 - get indent
            var indent = 0;
            for (;;) {
                var c = peek(-indent - 5);
                if (!c || c === '\n') break;
                indent++;
            }

            function skipIndent() {
                var skip = indent;
                while (ch && ch <= ' ' && ch !== '\n' && skip-- > 0) next();
            }

            // skip white/to (newline)
            while (ch && ch <= ' ' && ch !== '\n') next();
            if (ch === '\n') {
                next();
                skipIndent();
            }

            // When parsing multiline string values, we must look for ' characters.
            for (;;) {
                if (!ch) {
                    error("Bad multiline string");
                } else if (ch === '\'') {
                    triple++;
                    next();
                    if (triple === 3) {
                        string = stripMultilineIndent(string);
                        if (string.slice(-1) === '\n') string = string.slice(0, -1); // remove last EOL
                        return string;
                    } else continue;
                } else {
                    while (triple > 0) {
                        string += '\'';
                        triple--;
                    }
                }
                if (ch === '\n') {
                    string += '\n';
                    next();
                    skipIndent();
                } else {
                    if (ch !== '\r') string += ch;
                    next();
                }
            }
        }

        function keyname() {
            // quotes for keys are optional in Hjson
            // unless they include {}[],: or whitespace.

            if (ch === '"' || ch === "'") return string(false);

            var name = "",
                start = at,
                space = -1;
            for (;;) {
                if (ch === ':') {
                    if (!name) error("Found ':' but no key name (for an empty key name use quotes)");
                    else if (space >= 0 && space !== name.length) {
                        at = start + space;
                        error("Found whitespace in your key name (use quotes to include)");
                    }
                    return name;
                } else if (ch <= ' ') {
                    if (!ch) error("Found EOF while looking for a key name (check your syntax)");
                    else {
                        if (space < 0) space = name.length;
                        var idx = 0;
                        var foundColon = false;
                        var firstNonWhitespace = null;
                        var nextChar;
                        while ((nextChar = text.charAt(at + idx))) {
                            if (nextChar > ' ' || nextChar === '\n' || nextChar === '\r') {
                                if (firstNonWhitespace === null && nextChar > ' ') {
                                    firstNonWhitespace = nextChar;
                                }
                                if (nextChar === ':') {
                                    foundColon = true;
                                    break;
                                }
                                if (nextChar === '\n' || nextChar === '\r' || isPunctuatorChar(nextChar)) {
                                    break;
                                }
                            }
                            idx++;
                        }
                        if (!foundColon) {
                            var errChar = firstNonWhitespace || nextChar || '';
                            error("Expected ':' instead of '" + errChar + "'");
                        }
                    }
                } else if (isPunctuatorChar(ch)) {
                    error("Found '" + ch + "' where a key name was expected (check your syntax or use quotes if the key name includes {}[],: or whitespace)");
                } else {
                    name += ch;
                }
                next();
            }
        }

        function white() {
            while (ch) {
                // Skip whitespace.
                while (ch && ch <= ' ') next();
                // Hjson allows comments
                if (ch === '#' || ch === '/' && peek(0) === '/') {
                    while (ch && ch !== '\n' && ch !== ']' && ch !== '}') next();
                } else if (ch === '/' && peek(0) === '*') {
                    next();
                    next();
                    while (ch && !(ch === '*' && peek(0) === '/')) next();
                    if (ch) {
                        next();
                        next();
                    }
                } else break;
            }
        }

        function tfnns() {
            // Hjson strings can be quoteless
            // returns string, true, false, or null.
            var value = ch;
            if (isPunctuatorChar(ch))
                error("Found a punctuator character '" + ch + "' when expecting a quoteless string (check your syntax)");

            for (;;) {
                next();
                var isWhitespace = ch && ch <= ' ' && ch !== '\n' && ch !== '\r';
                // (detection of ml strings was moved to string())
                var isEol = ch === '\r' || ch === '\n' || ch === '';
                var commentStart = ch === '/' && (peek(0) === '/' || peek(0) === '*');
                if (commentStart && peek(0) === '/' && value.length) {
                    var prevChar = value.charAt(value.length - 1);
                    if (prevChar === ':') commentStart = false;
                }

                var isTerminator =
                    isEol ||
                    ch === ',' || ch === '}' || ch === ']' ||
                    ch === '#' ||
                    commentStart;
                if (isWhitespace) {
                    var trimmedWs = value.trim();
                    if (!trimmedWs) {
                        value = trimmedWs;
                        continue;
                    }

                    var nextSig = peekNonWhitespace(0);
                    if (trimmedWs === "true" || trimmedWs === "false" || trimmedWs === "null") {
                        if (!nextSig || nextSig === ',' || nextSig === '}' || nextSig === ']' || nextSig === '#' || nextSig === '/' || nextSig === '\n' || nextSig === '\r') {
                            if (trimmedWs === "true") return true;
                            if (trimmedWs === "false") return false;
                            return null;
                        }
                    }

                    var chfWs = trimmedWs[0];
                    var isNumberCandidate = chfWs === '-' || chfWs >= '0' && chfWs <= '9';
                    if (isNumberCandidate) {
                        var num = tryParseNumber(trimmedWs, true);
                        if (num !== undefined) return num;
                        if (!nextSig || nextSig === ',' || nextSig === '}' || nextSig === ']' || nextSig === '#' || nextSig === '/' || nextSig === '\n' || nextSig === '\r') {
                            return trimmedWs;
                        }
                    }

                    value += ch;
                    continue;
                }

                if (isTerminator) {
                    // this tests for the case of {true|false|null|num}
                    // followed by { ',' | '}' | ']' | '#' | '//' | '/*' }
                    // which needs to be parsed as the specified value
                    var trimmed = value.trim();
                    var chf = trimmed[0];
                    switch (chf) {
                        case 'f':
                            if (trimmed === "false") return false;
                            break;
                        case 'n':
                            if (trimmed === "null") return null;
                            break;
                        case 't':
                            if (trimmed === "true") return true;
                            break;
                        default:
                            if (chf === '-' || chf >= '0' && chf <= '9') {
                                var n = tryParseNumber(trimmed, true);
                                if (n !== undefined) return n;
                            }
                    }
                    return trimmed;
                }
                value += ch;
            }
        }

        function tryParseNumber(text, stopAtNext) {
            // try to parse a number

            var number, string = '',
                leadingZeros = 0,
                testLeading = true;
            var at = 0;
            var ch;

            function next() {
                ch = text.charAt(at);
                at++;
                return ch;
            }

            next();
            if (ch === '-') {
                string = '-';
                next();
            }
            while (ch >= '0' && ch <= '9') {
                if (testLeading) {
                    if (ch == '0') leadingZeros++;
                    else testLeading = false;
                }
                string += ch;
                next();
            }
            if (testLeading) leadingZeros--; // single 0 is allowed
            if (ch === '.') {
                string += '.';
                while (next() && ch >= '0' && ch <= '9')
                    string += ch;
            }
            if (ch === 'e' || ch === 'E') {
                string += ch;
                next();
                if (ch === '-' || ch === '+') {
                    string += ch;
                    next();
                }
                while (ch >= '0' && ch <= '9') {
                    string += ch;
                    next();
                }
            }

            // skip white/to (newline)
            while (ch && ch <= ' ') next();

            if (stopAtNext) {
                // end scan if we find a punctuator character like ,}] or a comment
                if (ch === ',' || ch === '}' || ch === ']' ||
                    ch === '#' || ch === '/' && (text[at] === '/' || text[at] === '*')) ch = 0;
            }

            number = +string;
            if (ch || leadingZeros || !isFinite(number)) return undefined;
            else return number;
        }

        function errorClosingHint(value) {
            function search(value, ch) {
                var i, k, length, res;
                switch (typeof value) {
                    case 'string':
                        if (value.indexOf(ch) >= 0) res = value;
                        break;
                    case 'object':
                        if (Object.prototype.toString.apply(value) === '[object Array]') {
                            for (i = 0, length = value.length; i < length; i++) {
                                res = search(value[i], ch) || res;
                            }
                        } else {
                            for (k in value) {
                                if (!Object.prototype.hasOwnProperty.call(value, k)) continue;
                                res = search(value[k], ch) || res;
                            }
                        }
                }
                return res;
            }

            function report(ch) {
                var possibleErr = search(value, ch);
                if (possibleErr) {
                    return "found '" + ch + "' in a string value, your mistake could be with:\n" +
                        "  > " + possibleErr + "\n" +
                        "  (unquoted strings contain everything up to the next line!)";
                } else return "";
            }

            return report('}') || report(']');
        }

        function array() {
            // Parse an array value.
            // assuming ch === '['

            var array = [];
            try {
                next();
                white();
                if (ch === ']') {
                    next();
                    return array; // empty array
                }

                while (ch) {
                    array.push(value());
                    white();
                    // in Hjson the comma is optional and trailing commas are allowed
                    // note that we do not keep comments before the , if there are any
                    if (ch === ',') {
                        next();
                        white();
                    }
                    if (ch === ']') {
                        next();
                        return array;
                    }
                    white();
                }

                error("End of input while parsing an array (missing ']')");
            } catch (e) {
                e.hint = e.hint || errorClosingHint(array);
                throw e;
            }
        }

        function object(withoutBraces) {
            // Parse an object value.

            var key = "",
                object = {};

            try {
                if (!withoutBraces) {
                    // assuming ch === '{'
                    next();
                }

                white();
                if (ch === '}' && !withoutBraces) {
                    next();
                    return object; // empty object
                }
                while (ch) {
                    key = keyname();
                    white();
                    if (ch !== ':') error("Expected ':' instead of '" + ch + "'");
                    next();
                    // duplicate keys overwrite the previous value
                    object[key] = value();
                    white();
                    // in Hjson the comma is optional and trailing commas are allowed
                    // note that we do not keep comments before the , if there are any
                    if (ch === ',') {
                        next();
                        white();
                    }
                    if (ch === '}' && !withoutBraces) {
                        next();
                        return object;
                    }
                    white();
                }

                if (withoutBraces) return object;
                else error("End of input while parsing an object (missing '}')");
            } catch (e) {
                e.hint = e.hint || errorClosingHint(object);
                throw e;
            }
        }

        function value() {
            // Parse a Hjson value. It could be an object, an array, a string, a number or a word.

            white();
            switch (ch) {
                case '{':
                    return object();
                case '[':
                    return array();
                case "'":
                case '"':
                    return string(true);
                default:
                    return tfnns();
            }
        }

        function checkTrailing(v) {
            white();
            if (ch) error("Syntax error, found trailing characters");
            return v;
        }

        function rootValue() {
            white();
            switch (ch) {
                case '{':
                    return checkTrailing(object());
                case '[':
                    return checkTrailing(array());
                default:
                    return checkTrailing(value());
            }
        }

        if (typeof source !== "string") throw new Error("source is not a string");
        text = source;
        resetAt();
        return rootValue();
    };
}