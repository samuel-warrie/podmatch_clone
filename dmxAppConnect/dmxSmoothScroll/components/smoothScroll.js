dmx.Component('smooth-scroll', {

    attributes: {
        selector: {
            // must be a valid CSS selector
            type: String,
            default: 'a[href*="#"]',
        },

        ignore: {
            // must be a valid CSS selector
            type: String,
            default: '[data-scroll-ignore]',
        },

        header: {
            // must be a valid CSS selector
            type: String,
            default: null,
        },

        speed: {
            type: Number,
            default: 500,
        },

        offset: {
            type: Number,
            default: 0,
        },

        easing: {
            type: String,
            default: 'easeInOutCubic',
            enum: ['Linear', 'easeInQuad', 'easeInCubic', 'easeInQuart', 'easeInQuint', 'easeInOutQuad', 'easeInOutCubic', 'easeInOutQuart', 'easeInOutQuint', 'easeOutQuad', 'easeOutCubic', 'easeOutQuart', 'easeOutQuint'],
        },
    },

    methods: {
        goto(location) {
            // location is selector or number
            if (typeof location == 'string') {
                location = document.querySelector(location);
            }
            this._scroll.animateScroll(location);
        },
    },

    init() {
        this._scroll = new SmoothScroll(this.props.selector, { ...this.props,
            updateURL: false,
            speedAsDuration: true
        });
    },

    performUpdate(updatedProps) {
        this._scroll.destroy();
        this._scroll = new SmoothScroll(this.props.selector, { ...this.props,
            updateURL: false,
            speedAsDuration: true
        });
    },

    destroy: function() {
        this._scroll.destroy();
    },

});