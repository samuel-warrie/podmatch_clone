dmx.Component('value', {

    initialData: {
        value: null,
    },

    attributes: {
        value: {
            default: null,
        },
    },

    methods: {
        setValue(value) {
            return this._updateValue(value);
        },

        set(keyOrValue, maybeValue) {
            if (arguments.length > 1) {
                if (keyOrValue === 'value') {
                    return this._updateValue(maybeValue);
                }

                if (keyOrValue && keyOrValue.startsWith('value.')) {
                    const path = keyOrValue.split('.').slice(1);
                    const baseValue = this.data.value;
                    const updated = dmx.clone(baseValue || {});
                    let target = updated;

                    for (let i = 0; i < path.length - 1; i++) {
                        const segment = path[i];
                        if (typeof target[segment] !== 'object' || target[segment] == null) {
                            target[segment] = {};
                        }
                        target = target[segment];
                    }

                    target[path[path.length - 1]] = maybeValue;
                    return this._updateValue(updated);
                }

                return dmx.BaseComponent.prototype.set.call(this, keyOrValue, maybeValue);
            }

            return this._updateValue(keyOrValue);
        },
    },

    events: {
        updated: Event,
    },

    render: false,

    init(node) {
        this._updateValue(this.props.value);
    },

    _updateValue(value) {
        const current = this.data.value;

        if (current !== value) {
            dmx.BaseComponent.prototype.set.call(this, 'value', value);
            dmx.nextTick(() => this.dispatchEvent("updated"));
        }

        return this.data.value;
    },

    performUpdate(updatedProps) {
        if (updatedProps.has('value')) {
            this._updateValue(this.props.value);
            dmx.nextTick(() => this.dispatchEvent("updated"));
        }
    },

});