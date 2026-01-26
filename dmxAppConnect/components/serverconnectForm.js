dmx.Component('serverconnect-form', {

    extends: 'form',

    initialData: {
        status: 0,
        data: null,
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
            message: '',
            response: null,
        },
    },

    attributes: {
        timeout: {
            type: Number,
            default: 0,
        },

        autosubmit: {
            type: Boolean,
            default: false,
        },

        params: {
            type: Object,
            default: {},
        },

        headers: {
            type: Object,
            default: {},
        },

        postData: {
            type: String,
            default: 'form',
        },

        credentials: {
            type: Boolean,
            default: false,
        },

        prefix: {
            type: String,
            default: '',
        },
    },

    methods: {
        abort() {
            this._abort();
        },

        reset(clearData) {
            this._reset();

            if (clearData) {
                this._abort();
                this._resetData(true);
            }
        }
    },

    events: {
        start: Event, // when starting an ajax call
        done: Event, // when ajax call completed (success and error)
        error: Event, // server error or javascript error (json parse or network transport) or timeout error
        unauthorized: Event, // 401 status from server
        forbidden: Event, // 403 status from server
        ratelimit: Event, // 429 status from server
        abort: Event, // ajax call was aborted
        success: Event, // successful ajax call,
        upload: ProgressEvent, // on upload progress
        download: ProgressEvent, // on download progress
    },

    init(node) {
        dmx.Component('form').prototype.init.call(this, node);

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

        this._extendNode(node);

        if (this.props.autosubmit) {
            dmx.nextTick(() => this._submit());
        }
    },

    destroy() {
        dmx.Component('form').prototype.destroy.call(this);

        if (this._xhr) {
            this._xhr.removeEventListener('load', this._loadHandler);
            this._xhr.removeEventListener('abort', this._abortHandler);
            this._xhr.removeEventListener('error', this._errorHandler);
            this._xhr.removeEventListener('timeout', this._timeoutHandler);
            this._xhr.removeEventListener('progress', this._downloadProgressHandler);
            if (this._xhr.upload) {
                this._xhr.upload.removeEventListener('progress', this._uploadProgressHandler);
            }
            this._xhr = null;
        }
    },

    // TODO: deprecate this, use JSON or expression instead
    $parseAttributes(node) {
        dmx.BaseComponent.prototype.$parseAttributes.call(this, node);

        dmx.dom.getAttributes(node).forEach((attr) => {
            const {
                name,
                argument,
                value
            } = attr;
            if (argument && value && ['param', 'header'].includes(name)) {
                this.$watch(value, (watchValue) => {
                    this.props[name + 's'] = Object.assign({}, this.props[name + 's'], {
                        [argument]: watchValue
                    });
                }, {
                    node,
                    attribute: attr.fullName,
                    type: 'attribute',
                    description: `dmx-${name}:${argument}`,
                });
            }
        });
    },

    _statusEvents: {
        200: 'success',
        400: 'invalid',
        401: 'unauthorized',
        403: 'forbidden',
        429: 'ratelimit',
    },

    _extendNode(node) {
        node.dmxExtraData = {};
        node.dmxExtraElements = [];
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

    _formSubmit() {
        this._send();
    },

    _send() {
        // abort any previous request
        this._abort();

        const method = this.$node.method.toUpperCase();
        let action = this.$node.action;

        if (this.props.prefix) {
            action = this.props.prefix.replace(/\/$/, '') + '/' + action.replace(/^\//, '');
        }

        let data = null;

        let qs = Object.keys(this.props.params)
            .filter(key => this.props.params[key] != null)
            .map(key => {
                let value = this.props.params[key];
                if (typeof value === 'string' && value.startsWith('{{')) {
                    value = this.parse(value);
                }
                return encodeURIComponent(key) + '=' + encodeURIComponent(value);
            })
            .join('&');

        if (method === 'GET') {
            if (qs.length) qs += '&';

            qs += Array.from(this.$node.elements)
                .filter(element => !element.disabled && ((element.type !== 'radio' && element.type !== 'checkbox') || element.checked))
                .map(element => encodeURIComponent(element.name) + '=' + encodeURIComponent(element.value))
                .join('&');
        } else if (this.props.postData === 'json') {
            data = this._parseJsonForm();

            if (this.$node.dmxExtraData) {
                Object.assign(data, this.$node.dmxExtraData);
            }

            data = JSON.stringify(data);
        } else {
            data = new FormData(this.$node);

            if (this.$node.dmxExtraData) {
                for (let key in this.$node.dmxExtraData) {
                    let value = this.$node.dmxExtraData[key];

                    if (Array.isArray(value)) {
                        if (!/\[\]$/.test(key)) key += '[]';
                        value.forEach(value => data.append(key, value));
                    } else {
                        data.set(key, value);
                    }
                }
            }
        }

        this._resetData();
        this.dispatchEvent('start');

        this.set('state', {
            executing: true,
            uploading: false,
            processing: false,
            downloading: false,
        });

        let url = action;

        if (qs) {
            url += (url.includes('?') ? '&' : '?') + qs;
        }

        if (window.WebviewProxy) {
            // Cordova webview proxy plugin
            url = window.WebviewProxy.convertProxyUrl(url);
        }

        this._xhr.open(method, url);
        this._xhr.timeout = this.props.timeout * 1000;
        if (this.props.postData === 'json') {
            this._xhr.setRequestHeader('Content-Type', 'application/json');
        }
        for (const header in this.props.headers) {
            this._xhr.setRequestHeader(header, this.props.headers[header]);
        }
        this._xhr.setRequestHeader('accept', 'application/json');
        if (this.props.credentials) {
            this._xhr.withCredentials = true;
        }

        const csrf_token = document.querySelector('meta[name="csrf-token"]');
        if (csrf_token) {
            this._xhr.setRequestHeader('X-CSRF-Token', csrf_token.content);
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
        }

        // reset form validation
        if (dmx.validateReset) dmx.validateReset(this.$node);
        if (window.grecaptcha && this.$node.querySelector('.g-recaptcha')) {
            grecaptcha.reset();
        }

        if (this._xhr.status < 400) {
            this.set({
                status: this._xhr.status,
                data: response,
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

        this.set({
            status: this._xhr.status,
            lastError: {
                status: this._xhr.status,
                message: this._xhr.statusText,
                response: response,
            }
        });

        if (this._xhr.status === 400) {
            this.dispatchEvent('invalid');

            // server-side validation error
            if (response.form && dmx.validate.setMessage) {
                for (const name in response.form) {
                    const element = this.$node.querySelector(`[name="${name}"]`);
                    if (element) {
                        const message = response.form[name];
                        dmx.validate.setMessage(element, message);
                    }
                }
            } else if (dmx.debug) {
                // console warning for debug purpose
                console.warn('400 error, no form errors in response.', response);
            }
        } else if (this._xhr.status === 401) {
            this.dispatchEvent('unauthorized');
        } else if (this._xhr.status === 403) {
            this.dispatchEvent('forbidden');
        } else if (this._xhr.status === 429) {
            this.dispatchEvent('ratelimit');
        } else {
            this.dispatchEvent('error');
        }

        this.dispatchEvent('done');

        const errorDetail = err ? err.message : response;

        this.$node.dispatchEvent(new CustomEvent('xhr' + (this._statusEvents[this._xhr.status] || 'error'), {
            bubbles: true,
            detail: {
                source: this.name,
                status: this._xhr.status,
                response: errorDetail
            }
        }));
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