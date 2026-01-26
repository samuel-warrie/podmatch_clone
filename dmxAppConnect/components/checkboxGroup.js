dmx.Component('checkbox-group', {

    initialData: {
        value: [],
    },

    attributes: {
        value: {
            type: Array,
            default: [],
            alwaysUpdate: true,
        },
    },

    methods: {
        setValue(value) {
            this._setValue(value);
        },
    },

    events: {
        updated: Event,
    },

    init(node) {
        this._changeHandler = this._changeHandler.bind(this);

        node.addEventListener('change', this._changeHandler);
        node.addEventListener('checkbox', this._changeHandler);
    },

    render(node) {
        this.$parse();

        this._setValue(this.props.value, true);

        this._mutationObserver = new MutationObserver((mutationList) => {
            let value = this.props.value;
            if (value == null) value = [];
            if (!Array.isArray(value)) value = [value];
            value = value.map(v => v.toString());

            for (let mutation of mutationList) {
                for (let node of mutation.addedNodes) {
                    if (node.nodeType !== Node.ELEMENT_NODE) continue;

                    requestAnimationFrame(() => {
                        if (node.tagName === 'INPUT' && node.type === 'checkbox') {
                            node.checked = value.includes(node.value);
                            node.defaultChecked = node.checked;
                        } else {
                            node.querySelectorAll('input[type=checkbox]').forEach(checkbox => {
                                checkbox.checked = value.includes(checkbox.value);
                                checkbox.defaultChecked = checkbox.checked;
                            });
                        }

                        requestAnimationFrame(() => {
                            this._updateValue();
                        });
                    });
                }
            }
        });

        this._mutationObserver.observe(node, {
            subtree: true,
            childList: true
        });
    },

    destroy() {
        if (this._mutationObserver) {
            this._mutationObserver.disconnect();
            this._mutationObserver = null;
        }
        this.$node.removeEventListener('change', this._changeHandler);
        this.$node.removeEventListener('checkbox', this._changeHandler);
    },

    performUpdate(updatedProps) {
        if (updatedProps.has('value')) {
            this._setValue(this.props.value, true);
        }
    },

    _setValue(value, defaultValue) {
        if (value == null) value = [];
        if (!Array.isArray(value)) value = [value];
        value = value.map(v => v.toString());

        this._checkboxes().forEach(checkbox => {
            checkbox.checked = value.includes(checkbox.value);
            if (defaultValue) checkbox.defaultChecked = checkbox.checked;
        });

        this._updateValue();
    },

    _updateValue() {
        const value = this._checkboxes().filter(checkbox => !checkbox.disabled && checkbox.checked).map(checkbox => checkbox.value);

        if (!dmx.equal(this.data.value, value)) {
            this.set('value', value);
            dmx.nextTick(() => this.dispatchEvent("updated"));
        }
    },

    _checkboxes() {
        return Array.from(this.$node.querySelectorAll('input[type=checkbox]'));
    },

    _changeHandler(event) {
        this._updateValue();
    },

});