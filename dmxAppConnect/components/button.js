dmx.Component('button', {

    extends: 'form-element',

    attributes: {
        type: {
            type: String,
            default: 'button',
            enum: ['button', 'reset', 'submit'],
        },
    },

    init(node) {
        dmx.Component('form-element').prototype.init.call(this, node);

        node.type = this.props.type;
    },

});