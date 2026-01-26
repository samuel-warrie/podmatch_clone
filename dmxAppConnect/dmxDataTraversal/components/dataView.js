dmx.Component('data-view', {

    initialData: {
        data: [],
        page: 1,
        pages: 1,
        items: 0,
        sort: {
            on: '',
            dir: 'asc'
        },
        has: {
            first: false,
            prev: false,
            next: false,
            last: false
        },
    },

    attributes: {
        data: {
            type: [Array, Object],
            default: null,
        },

        filter: {
            type: String,
            default: '',
        },

        page: {
            type: Number,
            default: 1,
        },

        pagesize: {
            type: Number,
            default: 0,
        },

        sorton: {
            type: String,
            default: '',
        },

        sortdir: {
            type: String,
            default: 'asc',
            enum: ['asc', 'desc'],
        },
    },

    methods: {
        select(page) {
            this._updatePage(+page);
        },

        first() {
            this._updatePage(1);
        },

        prev() {
            this._updatePage(this.data.page - 1);
        },

        next() {
            this._updatePage(this.data.page + 1);
        },

        last() {
            this._updatePage(this.data.pages);
        },

        sort(prop, dir) {
            this.props.sorton = prop;
            this.props.sortdir = (dir && dir.toLowerCase() == 'desc' ? 'desc' : 'asc');
        },
    },

    init() {
        this._data = [];
        this._items = [];

        if (this.props.data) {
            this._updateData();
        }

        if (this.props.filter) {
            this._updateFilter();
        } else {
            this._updateItems();
        }
    },

    destroy() {
        if (this._filterEffect) {
            this._filterEffect();
            delete this._filterEffect;
        }
    },

    performUpdate(updatedProps) {
        if (updatedProps.has('filter')) {
            this._updateFilter();
        } else if (updatedProps.has('data')) {
            this._updateData();
            this._updateFilter();
        } else if (updatedProps.has('sorton') || updatedProps.has('sortdir')) {
            this._updateFilter();
        } else if (updatedProps.has('page')) {
            this._updatePage(this.props.page);
        } else if (updatedProps.has('pagesize')) {
            this._updatePage(this.data.page);
        }
    },

    _updateFilter() {
        this.destroy();

        if (this.props.filter) {
            this._filterEffect = dmx.effect(() => {
                dmx.parse(this.props.filter, this);
                this._updateItems();
            });
        } else {
            this._updateItems();
        }
    },

    _updateData() {
        this._data = dmx.repeatItems(this.props.data).map(item => {
            item = dmx.clone(item);
            delete item.$value;
            delete item.$index;
            delete item.$key;
            return item;
        });
    },

    _updateItems() {
        this._items = this._data.slice(0);

        if (this.props.filter) {
            this._items = this._items.filter(item => dmx.parse(this.props.filter, dmx.DataScope(item, this)));
        }

        if (this.props.sorton) {
            const on = this.props.sorton;
            const dir = this.props.sortdir;
            const rev = dir === 'desc';

            this._items.sort((a, b) => {
                if (rev) {
                    if (typeof a[on] == 'string' && typeof b[on] == 'string') return b[on].localeCompare(a[on]);
                    return a[on] > b[on] ? -1 : a[on] < b[on] ? 1 : 0;
                } else {
                    if (typeof a[on] == 'string' && typeof b[on] == 'string') return a[on].localeCompare(b[on]);
                    return a[on] < b[on] ? -1 : a[on] > b[on] ? 1 : 0;
                }
            });

            this.set('sort', {
                on,
                dir
            });
        }

        const size = this.props.pagesize;
        const items = this._items.length;

        this.set({
            //pages: size ? Math.max(1, Math.ceil(items / size)) : 1,
            items: items,
        });

        this._updatePage(this.data.page);
    },

    _updatePage(page) {
        const size = this.props.pagesize;
        const pages = size ? Math.max(1, Math.ceil(this._items.length / size)) : 1;

        page = page < 1 ? 1 : page > pages ? pages : page;

        const offset = (page - 1) * size;

        this.set({
            page: page,
            pages: pages,
            data: size ? this._items.slice(offset, offset + size) : this._items,
            has: {
                first: page > 1,
                prev: page > 1,
                next: page < pages,
                last: page < pages,
            },
        });
    },

});