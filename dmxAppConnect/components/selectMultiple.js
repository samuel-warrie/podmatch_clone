dmx.Component('select-multiple', {

    extends: 'select',

    initialData: {
        value: [],
    },

    attributes: {
        value: {
            type: Array,
            default: null,
            alwaysUpdate: true,
        },
    },

    performUpdate(updatedProps) {
        dmx.Component('select').prototype.performUpdate.call(this, updatedProps);

        if (updatedProps.has('value')) {
            this._setValue(this.props.value, true);
        }
    },

    _setValue(value, defaultValue) {
        if (value == null) value = '';
        if (!Array.isArray(value)) value = [value];
        value = value.map(v => v.toString());

        Array.from(this.$node.options).forEach(option => {
            const selected = value.includes(option.value);
            if (defaultValue) {
                option.toggleAttribute('selected', selected);
                option.defaultSelected = option.selected;
            } else {
                option.selected = selected;
            }
        });

        this._updateValue();
        dmx.nextTick(() => this.dispatchEvent("updated"));
    },

    _getValue() {
        return Array.from(this.$node.selectedOptions).map(option => option.value);
    },

    _updateValue() {
        const value = this._getValue(); //Array.from(this.$node.options).filter(option => option.selected).map(option => option.value);

        dmx.batch(() => {
            dmx.Component('select').prototype._updateValue.call(this);
            this.set('value', value);
        });
    },

    _changeHandler(event) {
        if (this.$node.dirty) this._validate();

        dmx.nextTick(() => {
            if (this.data.selectedIndex !== this.$node.selectedIndex || !dmx.equal(this.data.value, this._getValue())) {
                this._updateValue();
                this.dispatchEvent('changed');
                dmx.nextTick(() => this.dispatchEvent("updated"));
            }
        });
    },

});