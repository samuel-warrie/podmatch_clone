dmx.Component("repeat-item", {

    constructor: function(fragment, parent, data, name) {
        this.parent = parent;
        this.children = [];
        this.listeners = {};
        this.props = {};

        this.__disposables = [];
        this.__childDisposables = [];

        this.updatedProps = new Map();
        this.updateRequested = false;

        this.isInitialized = true;
        this.isDestroyed = false;

        this.data = dmx.signalProxy(data);
        this.seed = parent.seed;

        this.name = name || "repeatItem";
        this.$nodes = [];
        for (var i = 0; i < fragment.childNodes.length; i++) {
            this.$nodes.push(fragment.childNodes[i]);
        }
    },

    destroy() {
        for (const node of this.$nodes) {
            if (this.parent && this.parent.props && this.parent.props.key) {
                const event = new Event('remove', {
                    cancelable: true
                });

                if (node.dispatchEvent(event)) {
                    dmx.dom.remove(node);
                }
            } else {
                node.remove();
            }
        }
    },
});