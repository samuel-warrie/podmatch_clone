dmx.Component('video', {

    initialData: {
        position: 0,
        duration: 0,
        ended: false,
        muted: false,
        paused: false,
        playbackRate: 1,
        volume: 1,
        inView: false,
    },

    attributes: {
        src: {
            type: String,
            default: '',
        },

        autopause: {
            type: Boolean,
            default: false,
        },

        playinview: {
            type: Boolean,
            default: false,
        },
    },

    methods: {
        position(pos) {
            this.$node.currentTime = pos;
        },

        playbackRate(rate) {
            this.$node.playbackRate = rate;
        },

        volume(volume) {
            this.$node.volume = volume;
        },

        load(src) {
            this.$node.src = src;
            this.$node.load();
        },

        play() {
            this.$node.play();
        },

        pause() {
            this.$node.pause();
        }
    },

    init(node) {
        this._updateState = dmx.throttle(this._updateState.bind(this));

        node.ondurationchange = this._updateState;
        node.onended = this._updateState;
        node.onpause = this._updateState;
        node.onplay = this._updateState;
        node.onplaying = this._updateState;
        node.onratechange = this._updateState;
        node.onseeked = this._updateState;
        node.ontimeupdate = this._updateState;
        node.onvolumechange = this._updateState;

        this._observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                const inView = entry.isIntersecting;

                if (!inView && this.data.inView && this.props.autopause) {
                    node.pause();
                }

                if (inView && !this.data.inView && this.props.playinview) {
                    node.play();
                }

                this.set('inView', inView);
            });
        });

        this._observer.observe(node);

        if (node.hasAttribute('dmx-bind:src')) {
            node.src = this.props.src;
        }
    },

    performUpdate(updatedProps) {
        if (updatedProps.has('src')) {
            this.$node.src = this.props.src;
            this.$node.load();
        }
    },

    destroy() {
        this._observer.disconnect();
        this._observer = null;
    },

    _updateState: function() {
        this.set('position', this.$node.currentTime);
        this.set('duration', this.$node.duration == NaN ? 0 : this.$node.duration);
        this.set('ended', this.$node.ended);
        this.set('muted', this.$node.muted);
        this.set('paused', this.$node.paused);
        this.set('playbackRate', this.$node.playbackRate);
        this.set('volume', this.$node.volume);
    },

});