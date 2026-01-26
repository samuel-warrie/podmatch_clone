dmx.Component('bs5-modal', {

    initialData: {
        visible: false,
    },

    attributes: {
        nobackdrop: {
            type: Boolean,
            default: false
        },

        nocloseonclick: {
            type: Boolean,
            default: false
        },

        nokeyboard: {
            type: Boolean,
            default: false
        },

        nofocus: {
            type: Boolean,
            default: false
        },

        show: {
            type: Boolean,
            default: false
        }
    },

    methods: {
        toggle() {
            this._instance.toggle();
        },

        show() {
            this._instance.show();
        },

        hide() {
            this._instance.hide();
        },

        update() {
            this._instance.handleUpdate();
        }
    },

    events: {
        show: Event,
        shown: Event,
        hide: Event,
        hidden: Event
    },

    init(node) {
        node.addEventListener('show.bs.modal', this.dispatchEvent.bind(this, 'show'));
        node.addEventListener('shown.bs.modal', this.dispatchEvent.bind(this, 'shown'));
        node.addEventListener('hide.bs.modal', this.dispatchEvent.bind(this, 'hide'));
        node.addEventListener('hidden.bs.modal', this.dispatchEvent.bind(this, 'hidden'));

        node.addEventListener('show.bs.modal', () => {
            this.set('visible', true);
        });
        node.addEventListener('hidden.bs.modal', () => {
            this.set('visible', false);
        });

        this._instance = new bootstrap.Modal(node, {
            backdrop: !this.props.nobackdrop && this.props.nocloseonclick ? 'static' : !this.props.nobackdrop,
            keyboard: !this.props.nokeyboard,
            focus: !this.props.nofocus,
        });

        if (this.props.show) {
            requestAnimationFrame(() => {
                this._instance.show();
                this.set('visible', true);
            });
        }
    },

    destroy() {
        this._instance.dispose();
    },

    performUpdate(updatedProps) {
        if (updatedProps.has('nobackdrop') || updatedProps.has('nocloseonclick') || updatedProps.has('nokeyboard') || updatedProps.has('nofocus')) {
            this._instance.dispose();
            this._instance = new bootstrap.Modal(this.$node, {
                backdrop: !this.props.nobackdrop && this.props.nocloseonclick ? 'static' : !this.props.nobackdrop,
                keyboard: !this.props.nokeyboard,
                focus: !this.props.nofocus,
            });
        }

        if (updatedProps.has('show')) {
            this._instance[this.props.show ? 'show' : 'hide']();
        }
    },

});