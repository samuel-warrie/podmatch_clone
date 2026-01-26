dmx.Component("array", {

    initialData: {
        items: [],
        count: 0,
    },

    attributes: {
        items: {
            type: Array,
            default: [],
        },
    },

    events: {
        updated: Event,
    },

    methods: {
        add(newItem) {
            this._splice(this._count(), 0, newItem);
        },

        addUniq(newItem) {
            // Only add when not exists
            if (this._indexOf(newItem) == -1) {
                this._splice(this._count(), 0, newItem);
            }
        },

        insert(index, newItem) {
            this._splice(index, 0, newItem);
        },

        insertBefore(item, newItem) {
            const index = this._indexOf(item);
            if (index != -1) {
                this._splice(index, 0, newItem);
            }
        },

        insertAfter(item, newItem) {
            const index = this._indexOf(item);
            if (index != -1) {
                this._splice(index + 1, 0, newItem);
            }
        },

        replace(item, newItem) {
            const index = this._indexOf(item);
            if (index != -1) {
                this._splice(index, 1, newItem);
            }
        },

        replaceAt(index, newItem) {
            this._splice(index, 1, newItem);
        },

        remove(item) {
            const index = this._indexOf(item);
            if (index != -1) {
                this._splice(index, 1);
            }
        },

        removeAt(index) {
            this._splice(index, 1);
        },

        reverse() {
            this._reverse();
        },

        sort(sortBy, direction) {
            this._sort(sortBy, direction);
        },

        randomize() {
            this._randomize();
        },

        empty() {
            this._updateData([]);
        },
    },

    render: false,

    init() {
        const arr = dmx.array(this.props.items);

        this.set({
            items: arr,
            count: arr.length,
        });
    },

    performUpdate(updatedProps) {
        if (updatedProps.has("items")) {
            this._updateData(dmx.array(this.props.items));
        }
    },

    _count() {
        return this.data.items.length;
    },

    _indexOf(item) {
        return this.data.items.indexOf(item);
    },

    _splice(index, remove, item) {
        const arr = dmx.clone(this.data.items);

        if (item !== undefined) {
            arr.splice(index, remove, item);
        } else {
            arr.splice(index, remove);
        }

        this._updateData(arr);
    },

    _reverse() {
        const arr = dmx.clone(this.data.items);
        arr.reverse();
        this._updateData(arr);
    },

    _sort(sortBy, direction) {
        const arr = dmx.clone(this.data.items);
        const hasSortBy = sortBy !== undefined && sortBy !== null;
        const isDescending = typeof direction === 'string' && direction.toLowerCase() === 'desc';

        if (!hasSortBy) {
            arr.sort();
            if (isDescending) {
                arr.reverse();
            }
        } else {
            const comparator = this._createComparator(sortBy, isDescending);
            arr.sort(comparator);
        }

        this._updateData(arr);
    },

    _randomize() {
        const arr = dmx.clone(this.data.items);

        if (arr.length < 2) {
            this._updateData(arr);
            return;
        }

        const rng = dmx.randomizer(Date.now() + Math.random());
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            const temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }

        this._updateData(arr);
    },

    _createComparator(sortBy, isDescending) {
        if (typeof sortBy === 'function') {
            return isDescending ?
                (a, b) => sortBy(b, a) :
                sortBy;
        }

        const getter = this._buildGetter(sortBy);
        return (a, b) => {
            const valueA = getter(a);
            const valueB = getter(b);
            return this._compareValues(valueA, valueB, isDescending);
        };
    },

    _buildGetter(sortBy) {
        if (Array.isArray(sortBy) && sortBy.length) {
            return (item) => this._resolvePath(item, sortBy);
        }

        if (typeof sortBy === 'string' && sortBy.length) {
            const segments = sortBy.split('.');
            return (item) => this._resolvePath(item, segments);
        }

        return (item) => item;
    },

    _resolvePath(item, segments) {
        return segments.reduce((value, segment) => {
            if (value == null) {
                return undefined;
            }
            return value[segment];
        }, item);
    },

    _compareValues(a, b, isDescending) {
        if (a === b) return 0;

        if (a == null) return isDescending ? 1 : -1;
        if (b == null) return isDescending ? -1 : 1;

        if (a > b) return isDescending ? -1 : 1;
        if (a < b) return isDescending ? 1 : -1;

        return 0;
    },

    _updateData(arr) {
        if (!dmx.equal(this.data.items, arr)) {
            this.set({
                items: arr,
                count: arr.length,
            });

            dmx.nextTick(() => this.dispatchEvent("updated"));
        }
    },

});