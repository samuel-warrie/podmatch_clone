dmx.Component('radio-group', {

    initialData: {
        value: null,
    },

    attributes: {
        value: {
            type: String,
            default: null,
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
        node.addEventListener('radio', this._changeHandler);
    },

    render(node) {
        this.$parse();

        requestAnimationFrame(() => {
            this._setValue(this.props.value, true);
        });

        this._mutationObserver = new MutationObserver((mutationList) => {
            let value = this.props.value;
            if (value == null) value = '';
            value = value.toString();

            for (let mutation of mutationList) {
                if (mutation.type == 'attributes' && mutation.attributeName == 'value') {
                    if (mutation.target.tagName === 'INPUT' && mutation.target.type === 'radio') {
                        mutation.target.checked = mutation.target.value == value;
                        mutation.target.defaultChecked = mutation.target.checked;
                        mutation.target.dispatchEvent(new Event('change', {
                            bubbles: true
                        }));
                        requestAnimationFrame(() => {
                            this._updateValue();
                        });
                    }
                }

                for (let node of mutation.addedNodes) {
                    if (node.nodeType !== Node.ELEMENT_NODE) continue;

                    requestAnimationFrame(() => {
                        if (node.tagName === 'INPUT' && node.type === 'radio') {
                            node.checked = node.value == value;
                            node.defaultChecked = node.checked;
                        } else {
                            node.querySelectorAll('input[type=radio]').forEach(checkbox => {
                                checkbox.checked = node.value == value;
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
            childList: true,
            attributes: true,
            attributeFilter: ['value']
        });
    },

    destroy() {
        if (this._mutationObserver) {
            this._mutationObserver.disconnect();
            this._mutationObserver = null;
        }
        this.$node.removeEventListener('change', this._changeHandler);
        this.$node.removeEventListener('radio', this._changeHandler);
    },

    performUpdate(updatedProps) {
        if (updatedProps.has('value')) {
            this._setValue(this.props.value, true);
        }
    },

    _setValue(value, defaultValue) {
        if (value != null) {
            value = value.toString();

            this._radios().forEach(radio => {
                radio.checked = radio.value == value;
                if (defaultValue) radio.defaultChecked = radio.checked;
                radio.dispatchEvent(new Event('change', {
                    bubbles: true
                }));
            });

            this._updateValue();
        }
    },

    _updateValue() {
        const value = this._radios().filter(radio => !radio.disabled && radio.checked).map(radio => radio.value);

        if (!dmx.equal(this.data.value, value[0])) {
            this.set('value', value[0] || null);
            dmx.nextTick(() => this.dispatchEvent("updated"));
        }
    },

    _radios() {
        return Array.from(this.$node.querySelectorAll('input[type=radio]'));
    },

    _changeHandler(event) {
        this._updateValue();
    },

});