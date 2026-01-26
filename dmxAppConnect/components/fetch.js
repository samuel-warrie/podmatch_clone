dmx.Component('fetch', {

    initialData: {
        status: 0,
        data: null,
        links: {},
        paging: {},
        headers: {},
        state: {
            executing: false,
            uploading: false,
            processing: false,
            downloading: false,
        },
        uploadProgress: {
            position: 0,
            percent: 0,
            total: 0,
        },
        downloadProgress: {
            position: 0,
            percent: 0,
            total: 0,
        },
        lastError: {
            status: 0,
            message: '',
            response: null,
        },
    },

    attributes: {
        timeout: {
            type: Number,
            default: 0,
        },

        method: {
            type: String,
            default: 'GET',
        },

        prefix: {
            type: String,
            default: '',
        },

        url: {
            type: String,
            default: '',
        },

        params: {
            type: Object,
            default: {},
        },

        headers: {
            type: Object,
            default: {},
        },

        data: {
            type: Object,
            default: {},
        },

        dataType: {
            type: String,
            default: 'auto',
            enum: ['auto', 'json', 'text'],
        },

        noload: {
            type: Boolean,
            default: false,
        },

        cache: {
            type: String,
            default: '',
        },

        ttl: {
            // cache ttl in seconds (default 1 day)
            type: Number,
            default: 86400,
        },

        credentials: {
            type: Boolean,
            default: false,
        },
    },

    methods: {
        abort() {
            this._abort();
        },

        load(params, reload) {
            const options = {};
            if (params) options.params = params;
            if (reload) options.ttl = 0;
            this._fetch(options);
        },

        reset() {
            this._abort();
            this._resetData(true);
        },
    },

    events: {
        start: Event,
        done: Event,
        error: Event,
        invalid: Event,
        unauthorized: Event,
        forbidden: Event,
        ratelimit: Event,
        abort: Event,
        success: Event,
        upload: ProgressEvent,
        download: ProgressEvent,
    },

    _statusEvents: {
        200: 'success',
        400: 'invalid',
        401: 'unauthorized',
        403: 'forbidden',
        429: 'ratelimit',
    },

    render: false,

    init(node) {
        this._fetch = dmx.debounce(this._fetch.bind(this));

        this._loadHandler = this._loadHandler.bind(this);
        this._abortHandler = this._abortHandler.bind(this);
        this._errorHandler = this._errorHandler.bind(this);
        this._timeoutHandler = this._timeoutHandler.bind(this);
        this._downloadProgressHandler = this._progressHandler.bind(this, 'download');
        this._uploadProgressHandler = this._progressHandler.bind(this, 'upload');

        this._xhr = new XMLHttpRequest();
        this._xhr.addEventListener('load', this._loadHandler);
        this._xhr.addEventListener('abort', this._abortHandler);
        this._xhr.addEventListener('error', this._errorHandler);
        this._xhr.addEventListener('timeout', this._timeoutHandler);
        this._xhr.addEventListener('progress', this._downloadProgressHandler);
        this._xhr.upload.addEventListener('progress', this._uploadProgressHandler);

        if (!this.props.noload && this.props.url) {
            this._fetch();
        }
    },

    destroy() {
        if (this._xhr) {
            this._xhr.removeEventListener('load', this._loadHandler);
            this._xhr.removeEventListener('abort', this._abortHandler);
            this._xhr.removeEventListener('error', this._errorHandler);
            this._xhr.removeEventListener('timeout', this._timeoutHandler);
            this._xhr.removeEventListener('progress', this._downloadProgressHandler);
            if (this._xhr.upload) {
                this._xhr.upload.removeEventListener('progress', this._uploadProgressHandler);
            }
            this._xhr.abort();
            this._xhr = null;
        }
    },

    performUpdate(updatedProps) {
        if (!this.props.noload && this.props.url) {
            // if url or params are changed
            if (updatedProps.has('url') || updatedProps.has('params')) {
                this._fetch();
            }
        }
    },

    // TODO: deprecate this, use JSON or expression instead
    $parseAttributes(node) {
        dmx.BaseComponent.prototype.$parseAttributes.call(this, node);

        dmx.dom.getAttributes(node).forEach(({
            name,
            argument,
            value
        }) => {
            if (argument && value && ['param', 'header'].includes(name)) {
                this.$watch(value, value => {
                    this.props[name + 's'] = Object.assign({}, this.props[name + 's'], {
                        [argument]: value
                    });
                }, {
                    node,
                    attribute: `dmx-${name}:${argument}`,
                    type: 'attribute',
                    description: `dmx-fetch ${name} binding`,
                });
            }

            if (argument && value && name == 'data') {
                this.$watch(value, value => {
                    this.props.data = Object.assign({}, this.props.data, {
                        [argument]: value
                    });
                }, {
                    node,
                    attribute: `dmx-data:${argument}`,
                    type: 'attribute',
                    description: 'dmx-fetch data binding',
                });
            }
        });
    },

    _abort() {
        if (this._xhr) {
            this._xhr.abort();
        }
    },

    _resetData(clearData) {
        const data = {
            status: 0,
            headers: {},
            state: {
                executing: false,
                uploading: false,
                processing: false,
                downloading: false,
            },
            uploadProgress: {
                position: 0,
                total: 0,
                percent: 0,
            },
            downloadProgress: {
                position: 0,
                total: 0,
                percent: 0,
            },
            lastError: {
                status: 0,
                message: "",
                response: null,
            },
        };

        if (clearData) {
            data.data = null;
        }

        this.set(data);
    },

    _fetch(options) {
        this._abort();

        options = dmx.extend(true, this.props, options || {});

        let qs = Object.keys(options.params)
            .filter(key => options.params[key] != null)
            .map(key => {
                let value = options.params[key];
                if (typeof value === 'string' && value.startsWith('{{')) {
                    value = this.parse(value);
                }
                return encodeURIComponent(key) + '=' + encodeURIComponent(value);
            })
            .join('&');

        this._resetData();
        this.dispatchEvent('start');

        this._url = options.url;

        if (options.prefix) {
            this._url = options.prefix.replace(/\/$/, '') + '/' + this._url.replace(/^\//, '');
        }

        if (qs) {
            this._url += (this._url.includes('?') ? '&' : '?') + qs;
        }

        if (window.WebviewProxy) {
            // Cordova webview proxy plugin
            this._url = window.WebviewProxy.convertProxyUrl(this._url);
        }

        if (this.props.cache) {
            const cache = this.parse(`${this.props.cache}.data["${this._url}"]`);
            if (cache) {
                if (Date.now() - cache.created >= options.ttl * 1000) {
                    this.parse(`${this.props.cache}.remove("${this._url}")`);
                } else {
                    this.set({
                        headers: cache.headers || {},
                        paging: cache.paging || {},
                        links: cache.links || {},
                        data: cache.data,
                    });

                    this.dispatchEvent('success');
                    this.dispatchEvent('done');

                    this.$node.dispatchEvent(new CustomEvent('xhrsuccess', {
                        bubbles: true,
                        detail: {
                            source: this.name,
                            status: this._xhr.status,
                            response: response
                        }
                    }));

                    return;
                }
            }
        }

        this.set('state', {
            executing: true,
            uploading: false,
            processing: false,
            downloading: false,
        });

        let data = null;
        let method = this.props.method.toUpperCase();

        if (method !== 'GET') {
            if (this.props.dataType === 'text') {
                data = this.props.data.toString();
            } else if (this.props.dataType === 'json') {
                data = JSON.stringify(this.props.data);
            } else {
                if (method === 'POST') {
                    data = new FormData();

                    Object.keys(this.props.data).forEach(key => {
                        let value = this.props.data[key];

                        if (Array.isArray(value)) {
                            if (!/\[\]$/.text(value)) key += '[]';
                            value.forEach(val => data.append(key, val));
                        } else {
                            data.set(key, value);
                        }
                    });
                } else {
                    data = this.props.data.toString();
                }
            }
        }

        this._xhr.open(method, this._url);
        this._xhr.timeout = options.timeout * 1000;
        if (this.props.dataType === 'json' || this.props.dataType === 'text') {
            this._xhr.setRequestHeader('Content-Type', 'application/' + this.props.dataType);
        }
        for (const header in this.props.headers) {
            this._xhr.setRequestHeader(header, this.props.headers[header]);
        }
        this._xhr.setRequestHeader('accept', 'application/json');
        if (this.props.credentials) {
            this._xhr.withCredentials = true;
        }

        if (this.serverconnect && method !== 'GET') {
            const csrf_token = document.querySelector('meta[name="csrf-token"]');
            if (csrf_token) {
                this._xhr.setRequestHeader('X-CSRF-Token', csrf_token.content);
            }
        }

        try {
            this._xhr.send(data);
        } catch (err) {
            this._done(err);
        }
    },

    _done(err) {
        this._resetData();

        if (err) {
            this.set('lastError', {
                status: 0,
                message: err.message,
                response: null,
            });

            this.dispatchEvent('error');
            this.dispatchEvent('done');

            this.$node.dispatchEvent(new CustomEvent('xhrerror', {
                bubbles: true,
                detail: {
                    source: this.name,
                    status: this._xhr.status,
                    response: err.message
                }
            }));

            return;
        }

        let response = this._xhr.responseText;

        try {
            response = JSON.parse(response);
        } catch (err) {
            if (this._xhr.status < 400) {
                this.set('lastError', {
                    status: 0,
                    message: 'Response was not valid JSON',
                    response: response,
                });

                this.dispatchEvent('error');
                this.dispatchEvent('done');

                this.$node.dispatchEvent(new CustomEvent('xhrerror', {
                    bubbles: true,
                    detail: {
                        source: this.name,
                        status: this._xhr.status,
                        response: 'Invalid JSON: ' + response
                    }
                }));

                return;
            }
        }

        this._parseHeaders();

        if (this._xhr.status < 400) {
            this.set({
                status: this._xhr.status,
                data: response,
            });

            this.dispatchEvent('success');
            this.dispatchEvent('done');

            if (this.props.cache) {
                this.parse(`${this.props.cache}.set("${this._url}", { headers: headers, paging: paging, links: links, data: data, created: ${Date.now()} })`)
            }

            this.$node.dispatchEvent(new CustomEvent('xhrsuccess', {
                bubbles: true,
                detail: {
                    source: this.name,
                    status: this._xhr.status,
                    response: response
                }
            }));

            return;
        }

        this.set({
            status: this._xhr.status,
            lastError: {
                status: this._xhr.status,
                message: this._xhr.statusText,
                response: response,
            }
        });

        this.dispatchEvent(this._statusEvents[this._xhr.status] || 'error');
        this.dispatchEvent('done');

        this.$node.dispatchEvent(new CustomEvent('xhr' + (this._statusEvents[this._xhr.status] || 'error'), {
            bubbles: true,
            detail: {
                source: this.name,
                status: this._xhr.status,
                response: response
            }
        }));
    },

    _parseHeaders() {
        try {
            const strHeaders = this._xhr.getAllResponseHeaders();
            const arrHeaders = strHeaders.trim().split(/[\r\n]+/);

            this.set('headers', arrHeaders.reduce((headers, line) => {
                const parts = line.split(': ');
                const name = parts.shift();
                const value = parts.join(': ');

                headers[name] = value;

                return headers;
            }, {}));
        } catch (err) {
            console.warn('Error parsing response headers', err);
            return;
        }

        this._parseLinkHeaders();
    },

    _parseLinkHeaders() {
        try {
            const headers = this.data && this.data.headers ? this.data.headers : {};
            const linkHeader = Object.keys(headers).find(header => header.toLowerCase() === 'link');

            if (linkHeader) {
                const rawLinks = headers[linkHeader];
                if (typeof rawLinks !== 'string' || !rawLinks.trim()) {
                    this.set('links', {});
                } else {
                    let hadParseIssue = false;
                    const parsedLinks = rawLinks.split(/,\s*</).map(link => {
                        try {
                            const match = link.match(/<?([^>]*)>(.*)/);
                            if (!match) {
                                hadParseIssue = true;
                                return null;
                            }

                            const linkUrl = new URL(match[1], window.location && window.location.href ? window.location.href : undefined);
                            const parts = (match[2] || '').split(';').map(part => part.trim()).filter(Boolean);
                            const qs = linkUrl.search.slice(1).split('&').filter(Boolean).reduce((acc, chunk) => {
                                const p = chunk.split('=');
                                const key = decodeURIComponent(p[0] || '');
                                if (!key) return acc;
                                acc[key] = decodeURIComponent(p[1] || '');
                                return acc;
                            }, {});

                            const info = parts.reduce((acc, part) => {
                                const attrMatch = part.match(/^(.*)=(.*)$/);
                                if (!attrMatch) {
                                    hadParseIssue = true;
                                    return acc;
                                }
                                const attrName = attrMatch[1].replace(/^rel$/i, 'rel').trim();
                                const attrValue = attrMatch[2].replace(/^"|"$/g, '').trim();
                                acc[attrName] = attrValue;
                                return acc;
                            }, {});

                            const merged = Object.assign({}, qs, info);
                            merged.url = linkUrl.toString();
                            return merged;
                        } catch (err) {
                            console.warn('Error parsing link header part', err);
                            hadParseIssue = true;
                            return null;
                        }
                    }).filter(link => link && link.rel);

                    const linkMap = parsedLinks.reduce((acc, link) => {
                        link.rel.split(/\s+/).filter(Boolean).forEach(rel => {
                            acc[rel] = Object.assign({}, link, {
                                rel
                            });
                        });
                        return acc;
                    }, {});

                    this.set('links', linkMap);

                    if (hadParseIssue) {
                        console.warn('Error parsing link header', rawLinks);
                    }
                }
            } else {
                this.set('links', {});
            }
        } catch (err) {
            console.warn('Error parsing link header', err);
            return;
        }

        this._parsePaging();
    },

    _parsePaging() {
        try {
            const paging = {
                page: 1,
                pages: 1,
                items: 0,
                has: {
                    first: false,
                    prev: false,
                    next: false,
                    last: false,
                },
            };

            const {
                first,
                prev,
                next,
                last
            } = this.data.links;

            if (prev || next) {
                if (last && last.page) {
                    paging.pages = +last.page;
                } else if (prev && prev.page) {
                    paging.pages = +prev.page + 1;
                }

                const countHeader = Object.keys(this.data.headers).find(header => {
                    header = header.toLowerCase();
                    return header === 'x-total' || header === 'x-count' || header === 'x-total-count';
                });

                if (countHeader) {
                    paging.items = +this.data.headers[countHeader];
                }

                if (prev && prev.page) {
                    paging.page = +prev.page + 1;
                } else if (next && next.page) {
                    paging.page = +next.page - 1;
                }

                paging.has = {
                    first: !!first,
                    prev: !!prev,
                    next: !!next,
                    last: !!last,
                };
            }

            this.set('paging', paging);
        } catch (err) {
            console.warn('Error parsing paging', err);
        }
    },

    _loadHandler(event) {
        this._done();
    },

    _abortHandler(event) {
        this._resetData();
        this.dispatchEvent('abort');
        this.dispatchEvent('done');

        this.$node.dispatchEvent(new CustomEvent('xhrabort', {
            bubbles: true,
            detail: {
                source: this.name,
                status: 0,
                response: null
            }
        }));
    },

    _errorHandler(event) {
        this._done(Error('Failed to execute'));
    },

    _timeoutHandler(event) {
        this._done(Error('Execution timeout'));
    },

    _progressHandler(type, event) {
        const percent = event.lengthComputable ? Math.ceil(event.loaded * 100 / event.total) : 0;

        this.set({
            state: {
                executing: true,
                uploading: type === 'upload' && percent < 100,
                processing: type === 'upload' && percent === 100,
                downloading: type === 'download',
            },
            [type + 'Progress']: {
                position: event.loaded,
                total: event.total,
                percent: percent,
            },
        });

        this.dispatchEvent(type, {
            lengthComputable: event.lengthComputable,
            loaded: event.loaded,
            total: event.total,
        });
    },

});