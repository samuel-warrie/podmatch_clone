dmx.Component('if', {

    attributes: {
        condition: {
            type: Boolean,
            default: false
        },
    },

    events: {
        show: Event,
        hide: Event,
    },

    init(node) {
        this._shown = false;
        this._template = document.createDocumentFragment();

        while (node.firstChild) {
            this._template.appendChild(node.firstChild);
        }
    },

    render(node) {
        if (this.props.condition) {
            this._show();
        }
    },

    performUpdate(updatedProps) {
        this.props.condition ? this._show() : this._hide();
    },

    destroy() {
        this._template = null;
    },

    _show() {
        if (this._shown) return;

        const template = this._template.cloneNode(true);
        this.$node.appendChild(template);
        this.$parse();
        this.dispatchEvent('show');
        this._shown = true;
    },

    _hide() {
        if (!this._shown) return;

        if (this.effects) {
            this.effects.forEach((effect) => effect());
            this.effects = null;
        }

        Array.from(this.$node.childNodes).forEach(node => {
            const event = new Event('remove', {
                cancelable: true
            });
            if (node.dispatchEvent(event)) node.remove();
        });

        this.$destroyChildren();
        this.dispatchEvent('hide');
        this._shown = false;
    }
});