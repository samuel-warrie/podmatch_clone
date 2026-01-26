dmx.Component('form-data', {

    attributes: {
        name: {
            type: String,
            default: 'data',
        },

        data: {
            type: [Array, Object], // can be anything
            default: null,
        },
    },

    init(node) {
        this._formdataHandler = this._formdataHandler.bind(this);
        this._form = node.closest('form');

        if (this._form) {
            this._form.addEventListener('formdata', this._formdataHandler);
        }
    },

    destroy() {
        if (this._form) {
            this._form.removeEventListener('formdata', this._formdataHandler);
        }
    },

    _formdataHandler(event) {
        const formData = event.formData;
        const data = this.props.data;

        this._appendData(formData, data, this.props.name);
    },

    _appendData(formData, data, prefix = '') {
        if (data === null) {
            return;
        }

        if (Array.isArray(data)) {
            data.forEach((value, index) => {
                this._appendData(formData, value, `${prefix}[${index}]`);
            });
            return;
        }

        if (typeof data === 'object') {
            Object.keys(data).forEach(key => {
                this._appendData(formData, data[key], `${prefix}[${key}]`);
            });
            return;
        }

        formData.append(prefix, data);
    },

});