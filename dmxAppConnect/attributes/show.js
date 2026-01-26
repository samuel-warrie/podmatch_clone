dmx.Attribute('show', 'mounted', function(node, attr) {
    if (node.dmxShow) return;

    node.dmxShow = {
        component: this,
        initial: {
            display: node.style.getPropertyValue('display'),
            priority: node.style.getPropertyPriority('display'),
        },
        show: null,
    };

    this.$watch(attr.value, show => {
        node.dmxShow.show = show;

        const {
            initial
        } = node.dmxShow;
        const display = show ? initial.display : 'none';
        const priority = show ? initial.priority : 'important';

        node.style.setProperty('display', display, priority);
    }, {
        node,
        attribute: attr.fullName,
        type: 'attribute',
        description: 'dmx-show',
    });
});