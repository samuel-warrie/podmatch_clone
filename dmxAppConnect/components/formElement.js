dmx.Component('form-element', {

    initialData: {
        disabled: false,
        focused: false,
        invalid: false,
        validationMessage: '',
        value: '',
    },

    attributes: {
        value: {
            type: String,
            default: '',
            alwaysUpdate: true,
        },

        disabled: {
            type: Boolean,
            default: false,
        },
    },

    methods: {
        setValue(value) {
            this._setValue(value);
        },

        focus() {
            this._focus();
        },

        disable(disable) {
            this._disable(disable);
        },

        validate() {
            this._validate();
        },
    },

    events: {
        updated: Event,
        changed: Event,
    },

    init(node) {
        this._inputHandler = this._inputHandler.bind(this);
        this._changeHandler = this._changeHandler.bind(this);
        this._invalidHandler = this._invalidHandler.bind(this);
        this._resetHandler = this._resetHandler.bind(this);
        this._focusHandler = this._focusHandler.bind(this);
        this._blurHandler = this._blurHandler.bind(this);

        node.value = this.props.value || '';
        node.defaultValue = node.value;

        node.addEventListener('input', this._inputHandler);
        node.addEventListener('change', this._changeHandler);
        node.addEventListener('invalid', this._invalidHandler);
        node.addEventListener('focus', this._focusHandler);
        node.addEventListener('blur', this._blurHandler);

        if (node.form) {
            this._form = node.form;
            this._form.addEventListener('reset', this._resetHandler);
        }

        if (this.props.disabled) {
            this._disable(this.props.disabled);
        }

        this.set('value', this.props.value);
        if (this.$node === document.activeElement) {
            this.set('focused', true);
        }
    },

    destroy() {
        this.$node.removeEventListener('input', this._inputHandler);
        this.$node.removeEventListener('change', this._changeHandler);
        this.$node.removeEventListener('invalid', this._invalidHandler);
        this.$node.removeEventListener('focus', this._focusHandler);
        this.$node.removeEventListener('blur', this._blurHandler);
        if (this._form) {
            this._form.removeEventListener('reset', this._resetHandler);
            this._form = null;
        }
    },

    performUpdate(updatedProps) {
        if (updatedProps.has('value')) {
            this._setValue(this.props.value, true);
        }

        if (updatedProps.has('disabled')) {
            this._disable(this.props.disabled);
        }
    },

    _setValue(value, defaultValue) {
        this.$node.value = value || '';
        if (defaultValue) this.$node.defaultValue = value || '';
        if (this.data.value !== this.$node.value) {
            this.set('value', this.$node.value);
            dmx.nextTick(() => this.dispatchEvent("updated"));
        }
    },

    _focus() {
        this.$node.focus();
    },

    _disable(disable) {
        this.$node.disabled = disable;
        this.set('disabled', this.$node.disabled);
    },

    _validate() {
        dmx.validate(this.$node);

        if (this.$node.dirty) {
            this.set({
                invalid: !this.$node.validity.valid,
                validationMessage: this.$node.validationMessage,
            });
        }
    },

    _inputHandler(event) {
        if (this.$node.dirty) this._validate();

        dmx.nextTick(() => {
            if (!this.$node) return;
            if (this.data.value !== this.$node.value) {
                this.set('value', this.$node.value);
                if (event) this.dispatchEvent('changed');
                dmx.nextTick(() => this.dispatchEvent("updated"));
            }
        });
    },

    _changeHandler(event) {
        if (this.$node.dirty) this._validate();

        dmx.nextTick(() => {
            if (!this.$node) return;
            if (this.data.value !== this.$node.value) {
                this.set('value', this.$node.value);
                if (event) this.dispatchEvent('changed');
                dmx.nextTick(() => this.dispatchEvent("updated"));
            }
        });
    },

    _invalidHandler(event) {
        this.set({
            invalid: !this.$node.validity.valid,
            validationMessage: this.$node.validationMessage,
        });
    },

    _resetHandler(event) {
        if (!this.$node) return;
        this.$node.dirty = false;
        this.set({
            invalid: false,
            validationMessage: '',
        });
        this._changeHandler(event);
    },

    _focusHandler(event) {
        this.set('focused', true);
    },

    _blurHandler(event) {
        this.set('focused', false);
    },

});