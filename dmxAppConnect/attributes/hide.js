dmx.Attribute("hide", "mounted", function(node, attr) {
    if (node.dmxHide) return;

    node.dmxHide = {
        component: this,
        initial: {
            display: node.style.getPropertyValue("display"),
            priority: node.style.getPropertyPriority("display"),
        },
        hide: null,
    };

    this.$watch(attr.value, hide => {
        node.dmxHide.hide = hide;

        const {
            initial
        } = node.dmxHide;
        const display = hide ? 'none' : initial.display;
        const priority = hide ? 'important' : initial.priority;

        node.style.setProperty('display', display, priority);
    }, {
        node,
        attribute: attr.fullName,
        type: 'attribute',
        description: 'dmx-hide',
    });
});