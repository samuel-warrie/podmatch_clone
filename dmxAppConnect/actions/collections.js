dmx.Actions({
    /**
     * Add new columns to the collection
     * @param {Object} options
     * @param {Object[]} options.collection - The collection
     * @param {Object.<string,*>} options.add - Object with column name as key and the value
     * @param {boolean} [options.overwrite=false] - Overwrite existing columns
     * @returns {Object[]} - New collection
     */
    'collections.addColumns': function(options) {
        var collection = this.parse(options.collection);
        var add = options.add;
        var overwrite = !!this.parse(options.overwrite);

        if (!collection.length) return [];

        var output = [];

        for (var i = 0, l = collection.length; i < l; i++) {
            var row = dmx.clone(collection[i]);

            for (var column in add) {
                if (add.hasOwnProperty(column)) {
                    var scope = new dmx.DataScope(row, this.scope);

                    if (overwrite || row[column] == null) {
                        row[column] = dmx.parse(add[column], scope);
                    }
                }
            }

            output.push(row);
        }

        return output;
    },

    /**
     * Remove entire specified columns from the collection
     * @param {Object} options
     * @param {Object[]} options.collection - The collection
     * @param {string[]} options.columns - The columns
     * @param {boolean} [options.keep=false] - Keep or remove the columns
     * @returns {Object[]} - New collection
     */
    'collections.filterColumns': function(options) {
        var collection = this.parse(options.collection);
        var columns = this.parse(options.columns);
        var keep = !!this.parse(options.keep);

        if (!collection.length) return [];

        var output = [];

        for (var i = 0, l = collection.length; i < l; i++) {
            var row = collection[i];
            var newRow = {};

            for (var column in row) {
                if (row.hasOwnProperty(column)) {
                    if (columns.includes(column)) {
                        if (keep) {
                            newRow[column] = dmx.clone(row[column]);
                        }
                    } else if (!keep) {
                        newRow[column] = dmx.clone(row[column]);
                    }
                }
            }

            output.push(newRow);
        }

        return output;
    },

    /**
     * Rename columns in the collection
     * @param {Object} options
     * @param {Object[]} options.collection - The collection
     * @param {Object.<string,string>} options.rename - Object with old name as key and new name as value
     * @returns {Object[]} - New collection
     */
    'collections.renameColumns': function(options) {
        var collection = this.parse(options.collection);
        var rename = this.parse(options.rename);

        if (!collection.length) return [];

        var output = [];

        for (var i = 0, l = collection.length; i < l; i++) {
            var row = collection[i];
            var newRow = {};

            for (var column in row) {
                if (row.hasOwnProperty(column)) {
                    newRow[rename[column] || column] = dmx.clone(row[column]);
                }
            }

            output.push(newRow);
        }

        return output;
    },

    /**
     * Fills empty rows with the row above's value
     * @param {Object} options
     * @param {Object[]} options.collection - The collection
     * @param {string[]} options.columns - The columns to fill
     * @returns {Object[]} - New collection
     */
    'collections.fillDown': function(options) {
        var collection = this.parse(options.collection);
        var columns = this.parse(options.columns);

        if (!collection.length) return [];

        var output = [];
        var toFill = {};

        for (var i = 0, l = columns.length; i < l; i++) {
            toFill[columns[i]] = null;
        }

        for (var i = 0, l = collection.length; i < l; i++) {
            var row = dmx.clone(collection[i]);

            for (var column in toFill) {
                if (toFill.hasOwnProperty(column)) {
                    if (row[column] == null) {
                        row[column] = toFill[column];
                    } else {
                        toFill[column] = row[column];
                    }
                }
            }

            output.push(row);
        }

        return output;
    },

    /**
     * Add new rows to the collection
     * @param {Object} options
     * @param {Object[]} options.collection - The collection
     * @param {Object[]} options.rows - The rows to add
     * @returns {Object[]} - New collection
     */
    'collections.addRows': function(options) {
        var collection = this.parse(options.collection);
        var rows = this.parse(options.rows);

        return dmx.clone(collection).concat(dmx.clone(rows));
    },

    /**
     * Add row numbers to the collection
     * @param {Object} options
     * @param {Object[]} options.collection - The collection
     * @param {string} options.column - The name for the column
     * @param {number} options.startAt - The row number to start with
     * @param {boolean} [options.desc=false] - Order descending
     * @returns {Object[]} - New collection
     */
    'collections.addRowNumbers': function(options) {
        var collection = this.parse(options.collection);
        var column = this.parse(options.column);
        var startAt = this.parse(options.startAt);
        var desc = !!this.parse(options.desc);

        var output = [];

        for (var i = 0, l = collection.length; i < l; i++) {
            var row = dmx.clone(collection[i]);
            row[column] = desc ? l + startAt - i : startAt + i;
            output.push(row);
        }

        return output;
    },

    /**
     * Join two collections (Left join)
     * @param {Object} options
     * @param {Object[]} options.collection1 - Left collection
     * @param {Object[]} options.collection2 - Right collection
     * @param {Object.<string,string>} options.matches - Columns to match
     * @param {boolean} [options.matchAll=false] - Match columns using AND instead of OR
     * @returns {Object[]} - New collection
     */
    'colections.join': function(options) {
        var collection1 = this.parse(options.collection1);
        var collection2 = this.parse(options.collection2);
        var matches = this.parse(options.matches);
        var matchAll = !!this.parse(options.matchAll);

        var output = [];

        for (var i = 0, l = collection1.length; i < l; i++) {
            var row = dmx.clone(collection1[i]);

            for (var j = 0, l2 = collection2.length; j < l2; j++) {
                var row2 = collection2[j];
                var hasMatch = false;

                for (var match in matches) {
                    if (matches.hasOwnProperty(match)) {
                        if (row[match] == row2[matches[match]]) {
                            hasMatch = true;
                            if (!matchAll) break;
                        } else if (matchAll) {
                            hasMatch = false;
                            break;
                        }
                    }
                }

                if (hasMatch) {
                    for (var column in row2) {
                        if (row2.hasOwnProperty(column)) {
                            // TODO duplicate row from collection1 when multiple matches exist in collection2
                            // TODO check for duplicate column names
                            row[column] = dmx.clone(row2[column]);
                        }
                    }
                    break;
                }
            }

            output.push(row);
        }

        return output;
    },

    /**
     * Normalize all rows, add missing columns with NULL value
     * @param {Object} options
     * @param {Object[]} options.collection - The collection
     * @returns {Object[]} - New collection
     */
    'collections.mormalize': function(options) {
        var collection = this.parse(options.collection);

        var columns = [];
        var output = [];

        // first collect all columns from collection
        for (var i = 0, l = collection.length; i < l; i++) {
            for (var column in collection[i]) {
                if (collection[i].hasOwnProperty(column)) {
                    if (columns.indexOf(column) == -1) {
                        columns.push(column);
                    }
                }
            }
        }

        for (var i = 0, l = collection.length; i < l; i++) {
            var row = {};

            for (var j = 0, l2 = columns.length; j < l2; j++) {
                var column = columns[j];
                var hasValue = collection[i].hasOwnProperty(column);
                var value = hasValue ? dmx.clone(collection[i][column]) : null;
                row[column] = value != null ? value : null;
            }

            output.push(row);
        }

        return output;
    }

});