dmx.Component('bs5-alert', {

    initialData: {
        visible: false,
    },

    attributes: {
        show: {
            type: Boolean,
            default: false,
        },

        type: {
            type: String,
            default: 'primary',
            enum: ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark']
        },

        closable: {
            type: Boolean,
            default: false,
        }
    },

    methods: {
        toggle() {
            this._toggle();
        },

        show() {
            this._show();
        },

        hide() {
            this._hide();
        },

        setType(style) {
            this._setType(style);
        },

        setTextContent(text) {
            this._setTextContent(text)
        }
    },

    init(node) {
        this._transitionendHandler = this._transitionendHandler.bind(this);

        this._closeButton = document.createElement('button');
        this._closeButton.setAttribute('type', 'button');
        this._closeButton.setAttribute('aria-label', 'Close');
        this._closeButton.className = 'btn-close';
        this._closeButton.addEventListener('click', this._hide.bind(this));

        node.setAttribute('role', 'alert');
        node.classList.add('alert');

        if (this.props.closable) {
            node.appendChild(this._closeButton);
            node.classList.add('alert-dismissible');
        }

        if (this.props.show) {
            node.classList.add('show');
            this.set('visible', true);
        } else {
            node.style.setProperty('display', 'none');
        }

        this._setType(this.props.type);
    },

    performUpdate(updatedProps) {
        if (updatedProps.has('type')) {
            this._setType(this.props.type);
        }

        if (updatedProps.has('show')) {
            this[this.props.show ? '_show' : '_hide']();
        }

        if (updatedProps.has('closable')) {
            if (this.props.closable) {
                this.$node.appendChild(this._closeButton);
                this.$node.classList.add('alert-dismissible');
            } else {
                this.$closeButton.remove();
                this.$node.classList.remove('alert-dismissible');
            }
        }
    },

    _show: function() {
        this.$node.removeEventListener('transitionend', this._transitionendHandler);
        this.$node.style.removeProperty('display');
        this.$node.offsetWidth;
        this.$node.classList.add('show');
        this.set('visible', true);
    },

    _hide: function() {
        this.$node.removeEventListener('transitionend', this._transitionendHandler);
        if (this.$node.classList.contains('fade')) {
            this.$node.addEventListener('transitionend', this._transitionendHandler, {
                once: true
            });
        } else {
            this.$node.style.setProperty('display', 'none');
        }
        this.$node.classList.remove('show');
        this.set('visible', false);
    },

    _transitionendHandler: function() {
        this.$node.style.setProperty('display', 'none');
    },

    _setType: function(type) {
        var types = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'].map(function(type) {
            return 'alert-' + type
        });
        this.$node.classList.remove.apply(this.$node.classList, types);
        this.$node.classList.add('alert-' + type);
    },

    _setTextContent: function(text) {
        this._closeButton.remove();
        this.$node.textContent = text;
        if (this.props.closable) {
            this.$node.appendChild(this._closeButton);
        }
    }

});