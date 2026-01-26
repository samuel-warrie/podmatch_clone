dmx.Attribute("on", "mounted", function(node, attr) {
    if (!node.dmxOn) {
        node.dmxOn = {
            component: this,
        };
    }

    node.dmxOn[attr.argument] = true;

    return dmx.eventListener(node, attr.argument, function(event) {
        // jQuery event
        if (event.originalEvent) event = event.originalEvent;

        const scope = dmx.DataScope({
            $event: event.$data,
            event,
            $originalEvent: event,
        }, node.dmxOn.component);

        scope.$this = this;

        const retValue = dmx.parse(attr.value, scope, {
            component: node.dmxOn.component,
            node,
            attribute: attr.fullName,
            type: 'event',
            description: `dmx-on:${attr.argument}`,
        });

        return retValue;
    }, attr.modifiers);
});