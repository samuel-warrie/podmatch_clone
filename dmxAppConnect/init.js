window.dmx = {
    // Versions
    version: '2.2.2',
    versions: {},

    // Configuration Options
    config: {
        throwErrors: false,
        mapping: {
            'form': 'form',
            'button, input[type=button], input[type=submit], input[type=reset]': 'button',
            'input[type=radio]': 'radio',
            'input[type=checkbox]': 'checkbox',
            'input[type=file][multiple]': 'input-file-multiple',
            'input[type=file]': 'input-file',
            'input': 'input',
            'textarea': 'textarea',
            'select[multiple]': 'select-multiple',
            'select': 'select',
            '.checkbox-group': 'checkbox-group',
            '.radio-group': 'radio-group'
        },
    },

    noop: () => {},
    isset: (v) => v !== undefined,
    array: (a) => a != null ? Array.from(a) : [],

    // Global Regexp
    reIgnoreElement: /^(script|style)$/i,
    rePrefixed: /^dmx-/i,
    reExpression: /\{\{(.+?)\}\}/,
    reExpressionReplace: /\{\{(.+?)\}\}/g,
    reToggleAttribute: /^(checked|selected|disabled|required|hidden|async|autofocus|autoplay|default|defer|multiple|muted|novalidate|open|readonly|reversed|scoped)$/i,
    reDashAlpha: /-([a-z])/g,
    reUppercase: /[A-Z]/g,

    // Internal collections for registering components etc.
    __components: Object.create(null),
    __attributes: {
        before: Object.create(null),
        mounted: Object.create(null),
    },
    __formatters: {
        boolean: Object.create(null),
        global: Object.create(null),
        string: Object.create(null),
        number: Object.create(null),
        object: Object.create(null),
        array: Object.create(null),
        any: Object.create(null),
    },
    __adapters: Object.create(null),
    __actions: Object.create(null),
    __startup: new Set(),
};