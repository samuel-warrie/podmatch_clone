dmx.Attribute("bind", "mounted", function(node, attr) {
    const name = attr.argument;
    const isToggle = dmx.reToggleAttribute.test(name);

    this.$watch(attr.value, value => {
        if (isToggle) {
            if (value) {
                node.setAttribute(name, "");
            } else if (node.hasAttribute(name)) {
                node.removeAttribute(name);
            }
        } else {
            if (name === "style" && typeof value === "object") {
                return Object.assign(node.style, value);
            }

            if (value == null) {
                return node.removeAttribute(name);
            }

            node.setAttribute(name, value);

            if (name === "src") {
                if (node.nodeName === "VIDEO" || node.nodeName === "AUDIO") {
                    node.load();
                } else if (node.nodeName === "SOURCE" && node.parentNode) {
                    node.parentNode.load();
                }
            }
        }
    }, {
        node,
        attribute: attr.fullName,
        type: 'attribute',
        description: `dmx-bind:${name}`,
    });
});