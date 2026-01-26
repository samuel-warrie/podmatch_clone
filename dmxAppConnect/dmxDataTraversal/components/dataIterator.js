dmx.Component('data-iterator', {

    initialData: {
        index: -1,
        value: null,
        has: {
            first: false,
            prev: false,
            next: false,
            last: false
        },
    },

    attributes: {
        data: {
            type: Array,
            default: null,
        },

        index: {
            type: Number,
            default: 0
        },

        loop: {
            type: Boolean,
            default: false,
        },
    },

    methods: {
        first() {
            if (this._data.length) {
                this._select(0);
            }
        },

        prev() {
            if (this._data.length) {
                this._select(this.data.index - 1);
            }
        },

        next() {
            if (this._data.length) {
                this._select(this.data.index + 1);
            }
        },

        last() {
            if (this._data.length) {
                this._select(this._data.length - 1);
            }
        },

        random() {
            if (this._data.length) {
                this._select(Math.floor(this._data.length * Math.random()));
            }
        },

        select(index) {
            if (this._data.length) {
                this._select(index);
            }
        },
    },

    init() {
        this._updateData();
    },

    performUpdate(updatedProps) {
        if (updatedProps.has('data')) {
            this._updateData();
        } else if (updatedProps.has('index')) {
            this._select(this.props.index);
        }
    },

    _updateData() {
        this._data = [];

        if (this.props.data) {
            if (Array.isArray(this.props.data)) {
                this._data = this.props.data;
            } else {
                console.warn(`Iterator ${this.name} expects an array as data but got ${typeof this.props.data}`);
            }

            this._select(this.props.index);
        }
    },

    _select(index) {
        index = parseInt(index, 10);

        if (this._data.length) {
            const last = this._data.length - 1;

            if (index < 0) index = this.props.loop ? last : 0;
            if (index > last) index = this.props.loop ? 0 : last;

            this.set({
                index: index,
                value: this._data[index],
                has: {
                    first: index > 0,
                    prev: index > 0,
                    next: index < last,
                    last: index < last,
                },
            });
        } else {
            this.set({
                index: -1,
                value: null,
                has: {
                    first: false,
                    prev: false,
                    next: false,
                    last: false
                },
            });
        }
    },

});