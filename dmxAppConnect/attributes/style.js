dmx.Attribute("style", "mounted", function(node, attr) {
    if (!node.dmxStyle) {
        node.dmxStyle = {
            component: this,
        };
    }

    const important = attr.modifiers.important ? "important" : "";

    this.$watch(attr.value, value => {
        node.dmxStyle[attr.argument] = value;
        if (value != null) {
            node.style.setProperty(attr.argument, value, important);
        }
    }, {
        node,
        attribute: attr.fullName,
        type: 'attribute',
        description: `dmx-style:${attr.argument}`,
    });
});