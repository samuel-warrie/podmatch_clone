dmx.Attribute("text", "mounted", function(node, attr) {
    if (node.dmxText) return;

    node.dmxText = {
        component: this,
    };

    this.$watch(attr.value, text => {
        const normalized = text != null ? String(text) : "";
        node.textContent = normalized;
    }, {
        node,
        attribute: attr.fullName,
        type: 'attribute',
        description: 'dmx-text',
    });
});