dmx.Attribute('repeat', 'before', function(node, attr) {
    const startNode = document.createComment('start ' + attr.fullName + '=' + attr.value);
    const endNode = document.createComment('end ' + attr.fullName + '=' + attr.value);
    const template = document.createDocumentFragment();
    const RepeatItem = dmx.Component('repeat-item');

    node.parentNode.replaceChild(endNode, node);
    endNode.parentNode.insertBefore(startNode, endNode);
    node.removeAttribute(attr.fullName);

    template.append(node);

    let children = [];

    this.$watch(attr.value, repeat => {
        const items = dmx.repeatItems(repeat);

        if (items.length > 10000) {
            console.warn('More than 10000 repeat items, we limit the result!');
            //items.splice(10000, items.length);
            items.length = 10000;
        }

        if (attr.modifiers.fast) {
            if (children.length > items.length) {
                // destroy children
                children.splice(items.length).forEach(child => child.$destroy());
            }

            if (children.length) {
                // update existing children
                children.forEach((child, i) => child.set(items[i]));
            }

            if (items.length > children.length) {
                // add new children
                const fragment = document.createDocumentFragment();
                const toParse = new Set();

                items.slice(children.length).forEach(item => {
                    const child = new RepeatItem(template.cloneNode(true), this, item);

                    fragment.appendChild(child.$nodes[0]);
                    //comment.parentNode.insertBefore(child.$nodes[0], comment);
                    //child.$parse(child.$nodes[0]);
                    toParse.add(child);

                    children.push(child);
                    this.$addChild(child);
                });

                if (endNode.parentNode) {
                    endNode.parentNode.insertBefore(fragment, endNode);
                }

                for (const child of toParse) {
                    child.$parse(child.$nodes[0]);
                }

                if (attr.argument) {
                    this.set(attr.argument, items);
                }
            }
        } else {
            const fragment = document.createDocumentFragment();
            const toParse = new Set();

            children.splice(0).forEach(child => child.$destroy());

            for (const item of items) {
                const child = new RepeatItem(template.cloneNode(true), this, item);

                fragment.append(child.$nodes[0]);
                //endNode.parentNode.insertBefore(child.$nodes[0], endNode);
                //child.$parse(child.$nodes[0]);
                toParse.add(child);

                children.push(child);
                this.$addChild(child);
            }

            if (endNode.parentNode) {
                endNode.parentNode.insertBefore(fragment, endNode);
            }

            for (const child of toParse) {
                child.$parse(child.$nodes[0]);
            }

            if (attr.argument) {
                this.set(attr.argument, items);
            }
        }
    }, {
        node: endNode.parentNode || node.parentNode || node,
        attribute: attr.fullName,
        type: 'attribute',
        description: 'dmx-repeat',
    });
});