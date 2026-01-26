dmx.Component('select', {

    extends: 'form-element',

    initialData: {
        selectedIndex: -1,
        selectedValue: '',
        selectedText: '',
    },

    attributes: {
        options: {
            type: [Array, Object, Number],
            default: null,
        },

        optiontext: {
            type: String,
            default: '$value',
        },

        optionvalue: {
            type: String,
            default: '$value',
        },
    },

    methods: {
        setSelectedIndex(index) {
            this.$node.selectedIndex = index;
            this._updateValue();
        },
    },

    init(node) {
        this._options = [];

        if (!this.props.value) {
            this.props.value = this.$node.value;
            this._updateValue();
        }

        this._mutationObserver = new MutationObserver((a) => {
            if (!this._updatingOptions) {
                this._updateValue();
            }
        });
        this._mutationObserver.observe(this.$node, {
            subtree: true,
            childList: true
        });

        dmx.Component('form-element').prototype.init.call(this, node);
    },

    render(node) {
        this.$parse();
        this._renderOptions();
        let value = this.props.value;
        if (value == null) value = '';
        Array.from(this.$node.options).forEach(option => {
            option.toggleAttribute('selected', (option.value == value));
            option.selected = (option.value == value);
            option.defaultSelected = option.selected;
        });
        this._updateValue();
    },

    destroy() {
        if (this._mutationObserver) {
            this._mutationObserver.disconnect();
            this._mutationObserver = null;
        }
        dmx.Component('form-element').prototype.destroy.call(this);
    },

    performUpdate(updatedProps) {
        dmx.Component('form-element').prototype.performUpdate.call(this, updatedProps);

        if (updatedProps.has('options') || updatedProps.has('optiontext') || updatedProps.has('optionvalue')) {
            this._renderOptions();
        }
    },

    _setValue(value, defaultValue) {
        if (value == null) value = '';
        value = value.toString();


        if (defaultValue) {
            Array.from(this.$node.options).forEach(option => {
                option.toggleAttribute('selected', option.value == value);
                option.defaultSelected = option.selected;
            });
        } else {
            const selectedIndex = Array.from(this.$node.options).findIndex(option => option.value == value);
            this.$node.selectedIndex = selectedIndex;
        }

        this._updateValue();
        dmx.nextTick(() => this.dispatchEvent("updated"));
    },

    _updateValue() {
        const selectedIndex = this.$node.selectedIndex;
        const selected = this.$node.options[selectedIndex] || {
            value: '',
            text: ''
        };

        this.set({
            selectedIndex: selectedIndex,
            selectedValue: selected.value,
            selectedText: selected.text,
            value: selected.value,
        });
    },

    _renderOptions() {
        this._options.forEach(option => option.remove());
        this._options = [];

        if (this.props.options) {
            this._updatingOptions = true;
            dmx.repeatItems(this.props.options).forEach(option => {
                const node = document.createElement('option');
                node.value = dmx.parse(this.props.optionvalue, dmx.DataScope(option, this));
                node.textContent = dmx.parse(this.props.optiontext, dmx.DataScope(option, this));
                if (node.value == this.props.value) node.selected = true;
                node.defaultSelected = node.selected;
                this.$node.append(node);
                this._options.push(node);
            });
            this._updatingOptions = false;
        }

        this._updateValue();
    },

    _inputHandler(event) {
        // do nothing
    },

    _changeHandler(event) {
        if (this.$node.dirty) {
            this._validate();
        }

        dmx.nextTick(() => {
            if (this.data.selectedIndex !== this.$node.selectedIndex) {
                this._updateValue();
                this.dispatchEvent('changed');
                dmx.nextTick(() => this.dispatchEvent("updated"));
            }
        });
    },

});