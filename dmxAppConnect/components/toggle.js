dmx.Component('toggle', {

    initialData: {
        checked: false,
    },

    attributes: {
        checked: {
            type: Boolean,
            default: false,
        },
    },

    methods: {
        check() {
            this.props.checked = true;
        },

        uncheck() {
            this.props.checked = false;
        },

        toggle() {
            this.props.checked = !this.data.checked;
        }
    },

    events: {
        updated: Event,
    },

    render: false,

    init(node) {
        this.set('checked', this.props.checked);
    },

    performUpdate(updatedProps) {
        if (updatedProps.has('checked')) {
            this.set('checked', this.props.checked);
            dmx.nextTick(() => this.dispatchEvent("updated"));
        }
    },

});