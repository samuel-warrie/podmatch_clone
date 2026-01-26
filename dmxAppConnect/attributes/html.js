dmx.Attribute("html", "mounted", function(node, attr) {
    if (node.dmxHtml) return;

    node.dmxHtml = {
        component: this,
    };

    this.$watch(attr.value, html => {
        node.innerHTML = html != null ? String(html) : "";
    }, {
        node,
        attribute: attr.fullName,
        type: 'attribute',
        description: 'dmx-html',
    });
});