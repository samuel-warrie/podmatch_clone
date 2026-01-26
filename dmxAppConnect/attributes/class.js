dmx.Attribute("class", "mounted", function(node, attr) {
    if (!node.dmxClass) {
        node.dmxClass = {
            component: this,
        };
    }

    this.$watch(attr.value, toggle => {
        node.dmxClass[attr.argument] = toggle;
        node.classList[toggle ? "add" : "remove"](attr.argument);
    }, {
        node,
        attribute: attr.fullName,
        type: 'attribute',
        description: `dmx-class:${attr.argument}`,
    });
});