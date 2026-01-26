dmx.Component('textarea', {

    extends: 'form-element',

    init(node) {
        if (!this.props.value) {
            const value = this.$node.value;
            this.props.value = value.includes('{{') ? this.parse(value) : value;
        }

        dmx.Component('form-element').prototype.init.call(this, node);
    },

});