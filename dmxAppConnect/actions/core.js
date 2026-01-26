dmx.Actions({

    subflow(options) {
        const subflow = this.parse(options.flow);
        const param = this.parse(options.param);

        return this.parse(subflow + ".runSub(" + JSON.stringify(param) + ")");
    },

    comment(options) {
        if (dmx.debug) {
            console.debug(options.message);
        }
    },

    wait(options) {
        let delay = this.parse(options.delay);

        if (typeof delay === "string" && delay.trim() !== "") {
            const numeric = Number(delay.trim());
            delay = Number.isFinite(numeric) ? numeric : delay;
        }

        if (typeof delay !== "number" || !Number.isFinite(delay)) {
            throw new Error("wait: Invalid delay");
        }

        return new Promise((resolve) => {
            setTimeout(resolve, delay);
        });
    },

    now(options) {
        return new Date().toISOString();
    },

    random(options) {
        let lower = this.parse(options.lower);
        let upper = this.parse(options.upper);
        let floating = !!this.parse(options.floating);

        if (typeof lower != "number" || !isFinite(lower)) {
            lower = 0;
        }

        if (typeof upper != "number" || !isFinite(upper)) {
            upper = 1;
        }

        let rnd = lower + Math.random() * (upper - lower);

        if (!floating && Math.floor(lower) == lower && Math.floor(upper) == upper) {
            rnd = Math.round(rnd);
        }

        return rnd;
    },

    triggerDownload(options) {
        const url = this.parse(options.url);
        const filename = this.parse(options.filename) || "";

        if (typeof url != "string") {
            throw new Error("download: Invalid url");
        }

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();

        return true;
    },

    confirm(options) {
        const message = this.parse(options.message);

        if (typeof message != "string") {
            throw new Error("confirm: Invalid message");
        }

        const result = confirm(message);

        if (result) {
            if (options.then) {
                return this._exec(options.then).then(() => result);
            }
        } else if (options.else) {
            return this._exec(options.else).then(() => result);
        }

        return result;
    },

    prompt(options) {
        const message = this.parse(options.message);

        if (typeof message != "string") {
            throw new Error("prompt: Invalid message");
        }

        return prompt(message);
    },

    alert(options) {
        const message = this.parse(options.message);

        if (typeof message != "string") {
            throw new Error("alert: Invalid message");
        }

        return alert(message);
    },

    repeat(options) {
        let items = dmx.clone(this.parse(options.repeat));

        if (!items) return;

        if (typeof items == "boolean") {
            items = items ? [0] : [];
        } else if (typeof items == "string") {
            items = items.split(/\s*,\s*/);
        } else if (typeof items == "number") {
            var arr = [];
            for (var i = 0; i < items; i++) {
                arr.push(i + 1);
            }
            items = arr;
        }

        if (typeof items != "object") {
            throw new Error("repeat: data is not repeatable");
        }

        const parentScope = this.scope;
        const parentOutput = this.output;
        return this._each(items, (value, index) => {
            this.scope = new dmx.DataScope(
                Object.assign({
                        $value: value,
                        $index: index,
                        $name: index,
                        $key: index,
                        $number: index + 1,
                        $oddeven: index % 2,
                    },
                    value
                ),
                parentScope
            );

            this.output = {};

            if (Array.isArray(options.outputFields) && value instanceof Object) {
                options.outputFields.forEach((field) => {
                    this.output[field] = value[field];
                });
            }

            return this._exec(options.exec).then(() => {
                var output = this.output;
                this.scope = parentScope;
                this.output = parentOutput;
                return output;
            });
        });
    },

    condition(options) {
        const result = !!this.parse(options.if);

        if (result) {
            if (options.then) {
                return this._exec(options.then).then(() => result);
            }
        } else if (options.else) {
            return this._exec(options.else).then(() => result);
        }

        return result;
    },

    conditions(options) {
        if (Array.isArray(options.conditions)) {
            for (let i = 0; i < options.conditions.length; i++) {
                const condition = options.conditions[i];

                if (this.parse(condition.when)) {
                    return this._exec(condition.then);
                }
            }
        }
    },

    select(options) {
        const expression = this.parse(options.expression);

        if (Array.isArray(options.cases)) {
            for (let i = 0; i < options.cases.length; i++) {
                const item = options.cases[i];

                if (this.parse(item.value) == expression) {
                    return this._exec(item.exec);
                }
            }
        }
    },

    group(options) {
        if (options.name) {
            const parentOutput = this.output;
            this.output = {};

            return this._exec(options.exec).then(() => {
                var output = this.output;
                this.output = parentOutput;
                return output;
            });
        }

        return this._exec(options.exec);
    },

    while (options) {
        const loop = () => {
            return new Promise((resolve) => {
                if (!this.parse(options.condition)) return resolve();
                this._exec(options.exec).then(loop).then(resolve);
            });
        };

        return loop();
    },

    switch (options) {
        /*
        {
          switch: {
            expression: "{{myVar}}",
            cases: [
              { case: 1, exec: { console.log: { message: "Case 1" }}}
              { case: 2, exec: { console.log: { message: "Case 2" }}}
              { case: 3, exec: { console.log: { message: "Case 3" }}}
            ],
            default: { console.log: { message: "Default Case" }}
          }
        }
        */
        const expression = this.parse(options.expression);
        for (let i = 0; i < options.cases.length; i++) {
            if (this.parse(options.cases[i].case) === expression) {
                return this._exec(options.cases[i].exec);
            }
        }
        if (options.default) {
            return this._exec(options.default);
        }
    },

    tryCatch(options) {
        return Promise.resolve(this._exec(options.try)).catch(() => {
            return this._exec(options.catch);
        });
    },

    run(options) {
        if (!options.action) {
            throw new Error("run: missing action");
        }

        return this.parse(options.action);
    },

    runJS(options) {
        if (!options.function) {
            throw new Error("runJS: missing function");
        }

        const func = this.parse(options.function);
        const args = this.parse(options.args);

        return window[func].apply(null, args);
    },

    assign(options) {
        return this.parse(options.value);
    },

    setGlobal(options) {
        const key = this.parse(options.key);
        const value = this.parse(options.value);

        if (typeof key != "string") {
            throw new Error("setGlobal: key must be a string");
        }

        dmx.global.set(key, value);

        return value;
    },

    setSession(options) {
        const key = this.parse(options.key);
        const value = this.parse(options.value);

        if (typeof key != "string") {
            throw new Error("setSession: key must be a string");
        }

        sessionStorage.setItem(key, JSON.stringify(value));

        return value;
    },

    getSession(options) {
        const key = this.parse(options.key);

        if (typeof key != "string") {
            throw new Error("getSession: key must be a string");
        }

        return JSON.parse(sessionStorage.getItem(key));
    },

    removeSession(options) {
        const key = this.parse(options.key);

        if (typeof key != "string") {
            throw new Error("removeSession: key must be a string");
        }

        sessionStorage.removeItem(key);

        return true;
    },

    setStorage(options) {
        const key = this.parse(options.key);
        const value = this.parse(options.value);

        if (typeof key != "string") {
            throw new Error("setStorage: key must be a string");
        }

        localStorage.setItem(key, JSON.stringify(value));

        return value;
    },

    getStorage(options) {
        const key = this.parse(options.key);

        if (typeof key != "string") {
            throw new Error("getStorage: key must be a string");
        }

        const value = localStorage.getItem(key);

        if (value == null) {
            return null;
        }

        return JSON.parse(value);
    },

    removeStorage(options) {
        const key = this.parse(options.key);

        if (typeof key != "string") {
            throw new Error("removeStorage: key must be a string");
        }

        localStorage.removeItem(key);

        return true;
    },

    fetch(options) {
        let url = this.parse(options.url);
        let method = this.parse(options.method);
        let timeout = this.parse(options.timeout);
        let dataType = this.parse(options.dataType);
        let data = this.parse(options.data);
        let params = this.parse(options.params);
        let headers = this.parse(options.headers);
        let credentials = this.parse(options.credentials);
        let body = null;

        if (typeof url != "string") {
            throw new Error("fetch: invalid url " + url);
        }

        if (!["GET", "POST", "PUT", "DELETE"].includes(method)) {
            //throw new Error('fetch: invalid method ' + method);
            method = "GET";
        }

        if (!["auto", "json", "text"].includes(dataType)) {
            dataType = "auto";
        }

        if (typeof timeout != "number") {
            timeout = 0;
        }

        if (!headers) {
            headers = {};
        }

        if (typeof params == "object") {
            for (var param in params) {
                if (params.hasOwnProperty(param) && params[param] != null) {
                    url +=
                        (url.indexOf("?") != -1 ? "&" : "?") +
                        encodeURIComponent(param) +
                        "=" +
                        encodeURIComponent(params[param]);
                }
            }
        }

        if (method != "GET") {
            if (dataType == "text") {
                if (!headers["Content-Type"]) {
                    headers["Content-Type"] = "application/text";
                }
                body = data.toString();
            } else if (dataType == "json") {
                if (!headers["Content-Type"]) {
                    headers["Content-Type"] = "application/json";
                }
                body = JSON.stringify(data);
            } else {
                if (method == "POST") {
                    body = new FormData();

                    if (typeof data == "object" && !Array.isArray(data)) {
                        for (var key in data) {
                            if (data.hasOwnProperty(key)) {
                                var value = data[key];

                                if (Array.isArray(value)) {
                                    if (!/\[\]$/.test(key)) {
                                        key += "[]";
                                    }
                                    for (var i in value) {
                                        if (value.hasOwnProperty(i)) {
                                            body.append(key, value[i]);
                                        }
                                    }
                                } else {
                                    body.set(key, value);
                                }
                            }
                        }
                    }
                } else if (data) {
                    if (!headers["Content-Type"]) {
                        headers["Content-Type"] = "application/text";
                    }
                    body = data.toString();
                }
            }
        }

        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();

            xhr.onerror = reject;
            xhr.onabort = reject;
            xhr.ontimeout = reject;
            xhr.onload = function() {
                var response = xhr.responseText;
                var headers = (function(raw) {
                    var arr = raw.trim().split(/[\r\n]+/);

                    return arr.reduce(function(headers, line) {
                        var parts = line.split(": ");
                        var header = parts.shift();
                        var value = parts.join(": ");

                        headers[header.toLowerCase()] = value;

                        return headers;
                    }, {});
                })(xhr.getAllResponseHeaders());

                if (/^application\/json/.test(headers["content-type"])) {
                    response = JSON.parse(response);
                }

                resolve({
                    status: xhr.status,
                    headers: headers,
                    data: response,
                });
            };

            xhr.open(method, url);

            xhr.timeout = timeout * 1000;

            for (var header in headers) {
                if (headers.hasOwnProperty(header)) {
                    xhr.setRequestHeader(header, headers[header]);
                }
            }

            if (credentials) {
                xhr.withCredentials = true;
            }

            xhr.send(body);
        });
    },
});

// aliasses
dmx.__actions["setValue"] = dmx.__actions["assign"];
dmx.__actions["api"] = dmx.__actions["fetch"];
dmx.__actions["api.send"] = dmx.__actions["fetch"];
dmx.__actions["serverConnect"] = dmx.__actions["fetch"];