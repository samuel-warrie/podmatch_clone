dmx.Component("repeat", {

    initialData: {
        items: [],
    },

    attributes: {
        repeat: {
            type: [Array, Object, Number],
            default: null,
        },

        key: {
            type: String,
            default: "",
        },

        rerender: {
            type: Boolean,
            default: false,
        },
    },

    events: {
        update: Event,
        updated: Event,
    },

    render: false,

    init(node) {
        this.prevItems = [];
        this.childKeys = new Map();
        this.$template = document.createDocumentFragment();
        while (this.$node.hasChildNodes()) {
            this.$template.appendChild(this.$node.firstChild);
        }
        if (this.props.repeat) {
            this.performUpdate(new Map([
                ['repeat', undefined]
            ]));
        }
    },

    performUpdate(updatedProps) {
        if (updatedProps.has("key")) this._rerender = true;
        if (!updatedProps.has("repeat")) return;

        this.dispatchEvent("update");

        if (this.props.rerender || this._rerender) {
            this._rerender = false;
            this._clear();
        }

        var RepeatItem = dmx.Component("repeat-item");
        var repeat = dmx.clone(this.props.repeat);
        var items = dmx.repeatItems(repeat);

        if (items.length) {
            if (!this.props.rerender &&
                this.props.key &&
                items[0].hasOwnProperty(this.props.key) &&
                this.prevItems.length
            ) {
                // keyed repeater (https://github.com/localvoid/kivi/blob/master/lib/vnode.ts#L1320-L1513)
                var key = this.props.key;
                var a = this.prevItems;
                var b = this._clone(items);
                var aStart = 0;
                var bStart = 0;
                var aEnd = a.length - 1;
                var bEnd = b.length - 1;
                var i, j, nextPos;

                outer: while (true) {
                    // remove same keys from start
                    while (a[aStart][key] === b[bStart][key]) {
                        this.childKeys.get(b[bStart][key]).set(b[bStart]);
                        aStart++;
                        bStart++;
                        if (aStart > aEnd || bStart > bEnd) {
                            break outer;
                        }
                    }

                    // remove same keys at end
                    while (a[aEnd][key] === b[bEnd][key]) {
                        this.childKeys.get(b[bEnd][key]).set(b[bEnd]);
                        aEnd--;
                        bEnd--;
                        if (aStart > aEnd || bStart > bEnd) {
                            break outer;
                        }
                    }

                    // move from right to left
                    if (a[aEnd][key] === b[bStart][key]) {
                        this.childKeys.get(b[bStart][key]).set(b[bStart]);
                        this._moveChild(b[bStart][key], a[aStart][key]);
                        aEnd--;
                        bStart++;
                        if (aStart > aEnd || bStart > bEnd) {
                            break;
                        }
                        continue;
                    }

                    // move from left to right
                    if (a[aStart][key] === b[bEnd][key]) {
                        nextPos = bEnd + 1;
                        this.childKeys.get(b[bEnd][key]).set(b[bEnd]);
                        this._moveChild(b[bEnd][key], b[nextPos] && b[nextPos][key]);
                        aStart++;
                        bEnd--;
                        if (aStart > aEnd || bStart > bEnd) {
                            break;
                        }
                        continue;
                    }

                    break;
                }

                if (aStart > aEnd) {
                    // insert rest from b
                    nextPos = bEnd + 1;
                    while (bStart <= bEnd) {
                        this._insertChild(b[bStart++], b[nextPos] && b[nextPos][key]);
                    }
                } else if (bStart > bEnd) {
                    // remove rest from a
                    while (aStart <= aEnd) {
                        this._removeChild(a[aStart++][key]);
                    }
                } else {
                    var aLength = aEnd - aStart + 1;
                    var bLength = bEnd - bStart + 1;
                    var aNullable = a;
                    var sources = new Array(bLength).fill(-1);

                    var moved = false;
                    var pos = 0;
                    var synced = 0;

                    if (bLength <= 4 || aLength * bLength <= 16) {
                        for (i = aStart; i <= aEnd; i++) {
                            if (synced < bLength) {
                                for (j = bStart; j <= bEnd; j++) {
                                    if (a[i][key] === b[j][key]) {
                                        sources[j - bStart] = i;

                                        if (pos > j) {
                                            moved = true;
                                        } else {
                                            pos = j;
                                        }

                                        this.childKeys.get(b[j][key]).set(b[j]);

                                        synced++;
                                        aNullable[i] = null;
                                        break;
                                    }
                                }
                            }
                        }
                    } else {
                        var keyIndex = {};

                        for (i = bStart; i <= bEnd; i++) {
                            keyIndex[b[i][key]] = i;
                        }

                        for (i = aStart; i <= aEnd; i++) {
                            if (synced < bLength) {
                                j = keyIndex[a[i][key]];

                                if (j !== undefined) {
                                    sources[j - bStart] = i;

                                    if (pos > j) {
                                        moved = true;
                                    } else {
                                        pos = j;
                                    }

                                    this.childKeys.get(b[j][key]).set(b[j]);

                                    synced++;
                                    aNullable[i] = null;
                                }
                            }
                        }
                    }

                    if (aLength === a.length && synced === 0) {
                        this._clear();
                        while (bStart < bLength) {
                            this._insertChild(b[bStart++], null);
                        }
                    } else {
                        i = aLength - synced;
                        while (i > 0) {
                            if (aNullable[aStart] !== null) {
                                this._removeChild(a[aStart][key]);
                                i--;
                            }
                            aStart++;
                        }

                        if (moved) {
                            var seq = this._lis(sources);
                            j = seq.length - 1;
                            for (i = bLength - 1; i >= 0; i--) {
                                if (sources[i] === -1) {
                                    pos = i + bStart;
                                    nextPos = pos + 1;
                                    this._insertChild(b[pos], b[nextPos] && b[nextPos][key]);
                                } else {
                                    if (j < 0 || i !== seq[j]) {
                                        pos = i + bStart;
                                        nextPos = pos + 1;
                                        this._moveChild(b[pos][key], b[nextPos] && b[nextPos][key]);
                                    } else {
                                        j--;
                                    }
                                }
                            }
                        } else if (synced !== bLength) {
                            for (i = bLength - 1; i >= 0; i--) {
                                if (sources[i] === -1) {
                                    pos = i + bStart;
                                    nextPos = pos + 1;
                                    this._insertChild(b[pos], b[nextPos] && b[nextPos][key]);
                                }
                            }
                        }
                    }
                }
            } else {
                if (this.children.length > items.length) {
                    // remove some children
                    const toRemove = this.children.splice(items.length);
                    for (const child of toRemove) {
                        child.$destroy();
                    }
                }

                if (this.children.length) {
                    // update existing children
                    dmx.batch(() => {
                        this.children.forEach((child, i) => {
                            for (const key in child.data) {
                                // remove old data that is not in new data
                                if (!items[i][key] && child.data[key]) {
                                    // Do not remove registered child components
                                    if (!child.data[key].$type) {
                                        delete child.data[key];
                                    }
                                }
                            }
                            child.set(items[i]);
                        });
                    });
                }

                if (items.length > this.children.length) {
                    // add new children
                    const fragment = document.createDocumentFragment();
                    const toParse = new Set();

                    for (var i = this.children.length; i < items.length; i++) {
                        var child = new RepeatItem(
                            this.$template.cloneNode(true),
                            this,
                            items[i]
                        );
                        for (const node of child.$nodes) {
                            fragment.appendChild(node);
                        }
                        toParse.add(child);
                        this.children.push(child);
                    }

                    this.$node.appendChild(fragment);

                    for (const child of toParse) {
                        for (const node of child.$nodes) {
                            child.$parse(node);
                        }
                    }
                }
            }
        } else {
            this._clear();
        }

        if (this.props.key) {
            // store prevItems for keyed diffing
            this.prevItems = [];
            for (const item of items) {
                this.prevItems.push({
                    [this.props.key]: item[this.props.key]
                });
            }
            dmx.batch(() => {
                for (let child of this.children) {
                    this.childKeys.set(child.data[this.props.key], child);
                }
            });
        }

        //this.set('items', items);
        this.set(
            "items",
            this.children.map((child) => child.data)
        );

        dmx.nextTick(() => this.dispatchEvent("updated"));
    },

    _lis(a) {
        var p = a.slice(0);
        var result = [];
        result.push(0);
        var u, v;

        for (var i = 0, il = a.length; i < il; i++) {
            if (a[i] === -1) {
                continue;
            }

            var j = result[result.length - 1];
            if (a[j] < a[i]) {
                p[i] = j;
                result.push(i);
                continue;
            }

            u = 0;
            v = result.length - 1;

            while (u < v) {
                var c = ((u + v) / 2) | 0;
                if (a[result[c]] < a[i]) {
                    u = c + 1;
                } else {
                    v = c;
                }
            }

            if (a[i] < a[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }

        u = result.length;
        v = result[u - 1];

        while (u-- > 0) {
            result[u] = v;
            v = p[v];
        }

        return result;
    },

    _clear() {
        this.prevItems = [];
        this.childKeys.clear();
        this.$node.innerHTML = '';
        const toDestroy = this.children.splice(0);
        for (const child of toDestroy) {
            child.$destroy();
        }
    },

    _insertChild(data, before) {
        var RepeatItem = dmx.Component("repeat-item");
        var child = new RepeatItem(this.$template.cloneNode(true), this, data);

        for (const node of child.$nodes) {
            if (!before) {
                this.$node.appendChild(node);
            } else {
                if (this.childKeys.has(before)) {
                    this.$node.insertBefore(node, this.childKeys.get(before).$nodes[0]);
                } else {
                    console.warn(
                        "(insert) can not insert node before key " + before + "!"
                    );
                }
            }

            child.$parse(node);
        }

        this.childKeys.set(data[this.props.key], child);
        this.children.push(child);
    },

    _moveChild(key, before) {
        var child = this.childKeys.get(key);

        if (child) {
            if (this.childKeys.has(before)) {
                for (const node of child.$nodes) {
                    this.$node.insertBefore(node, this.childKeys.get(before).$nodes[0]);
                }
            } else {
                for (const node of child.$nodes) {
                    this.$node.appendChild(node);
                }
            }
        } else {
            console.warn("(move) child with key " + key + " not found!");
        }
    },

    _removeChild(key) {
        var child = this.childKeys.get(key);
        if (child) {
            child.$destroy();
            this.children.splice(this.children.indexOf(child), 1);
            this.childKeys.delete(key);
        } else {
            console.warn("(remove) child with key " + key + " not found!");
        }
    },

    _clone(o) {
        return dmx.clone(o);
    },
});