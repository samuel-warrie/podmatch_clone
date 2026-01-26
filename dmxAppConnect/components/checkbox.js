dmx.Component('checkbox', {

    extends: 'form-element',

    initialData: {
        checked: false,
    },

    attributes: {
        checked: {
            type: Boolean,
            default: false,
            alwaysUpdate: true,
        },
    },

    methods: {
        select(check, triggerEvent) {
            this._select(check);
            if (triggerEvent) {
                dmx.nextTick(() => {
                    this.dispatchEvent('changed');
                    this.dispatchEvent(this.$node.checked ? 'checked' : 'unchecked');
                });
            }
        },
    },

    events: {
        checked: Event,
        unchecked: Event,
    },

    init(node) {
        dmx.Component('form-element').prototype.init.call(this, node);

        node.type = 'checkbox';
        node.checked = this.props.checked;
        node.defaultChecked = this.props.checked;

        if (this.props.checked) {
            this.set('checked', true);
        }
    },

    performUpdate(updatedProps) {
        dmx.Component('form-element').prototype.performUpdate.call(this, updatedProps);

        if (updatedProps.has('checked')) {
            if (this.$node.checked != this.props.checked) {
                this.$node.defaultChecked = this.props.checked;
                this.$node.checked = this.props.checked;
                this.set('checked', this.props.checked);
                this.$node.dispatchEvent(new Event('checkbox', {
                    bubbles: true
                }));
                dmx.nextTick(() => this.dispatchEvent("updated"));
            }
        }
    },

    _select(check) {
        this.$node.checked = (check !== false);
        this.set('checked', this.$node.checked);
        dmx.nextTick(() => this.dispatchEvent("updated"));
    },

    _changeHandler(event) {
        if (this.$node.dirty) this._validate();

        dmx.nextTick(() => {
            if (!this.$node) return;
            this.set('checked', this.$node.checked);
            this.dispatchEvent('changed');
            if (event.type != 'reset') {
                this.dispatchEvent(this.$node.checked ? 'checked' : 'unchecked');
            }
            dmx.nextTick(() => this.dispatchEvent("updated"));
        });
    },

});