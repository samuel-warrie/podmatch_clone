dmx.Component('data-detail', {

    initialData: {
        data: [],
    },

    attributes: {
        data: {
            type: Array,
            default: null,
        },

        key: {
            type: String,
            default: null,
        },

        value: {
            type: [String, Number],
            default: null,
        },
    },

    methods: {
        select(value) {
            this.props.value = value;
            this._updateSelection();
        },
    },

    init() {
        this._updateData();
    },

    performUpdate(updatedProps) {
        if (updatedProps.has('data')) {
            this._updateData();
        } else if (updatedProps.has('value')) {
            this._updateSelection(true);
        }
    },

    _updateData() {
        this._data = [];

        if (this.props.data && typeof this.props.data == 'object') {
            if (Array.isArray(this.props.data)) {
                this._data = this.props.data.map(item => typeof item == 'object' ? item : {
                    $value: item
                });
            } else {
                this._data = Object.entries(this.props.data).map(([$key, $value]) => ({
                    $key,
                    $value
                }));
            }
        }

        this._updateSelection();
    },

    _updateSelection(reset) {
        this.set('data', this._data.find(item => item[this.props.key] === this.props.value) || null);

        if (reset) {
            requestAnimationFrame(() => {
                this.$node.querySelectorAll('form').forEach(form => form.reset());
            });
        }
    },

});