(() => {
    const MAX_EXPRESSION_PREVIEW = 160;
    const ELEMENT_NODE = 1;
    const TEXT_NODE = 3;

    function truncate(value, limit = MAX_EXPRESSION_PREVIEW) {
        if (typeof value !== 'string') {
            return value;
        }

        const trimmed = value.trim();
        return trimmed.length > limit ? trimmed.slice(0, limit - 3) + '...' : trimmed;
    }

    function describeNode(node) {
        if (!node || !node.ownerDocument) {
            return null;
        }

        const segments = [];
        const visited = new Set();
        const depthLimit = 10;
        let current = node.nodeType === ELEMENT_NODE ? node : node.parentElement;
        let depth = 0;

        while (current && current.nodeType === ELEMENT_NODE && depth < depthLimit) {
            if (visited.has(current)) {
                break;
            }

            visited.add(current);

            let segment = current.tagName ? current.tagName.toLowerCase() : 'unknown';

            if (current.id) {
                segment += `#${current.id}`;
                segments.unshift(segment);
                break;
            }

            if (current.classList && current.classList.length) {
                const classNames = Array.from(current.classList)
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('.');
                if (classNames) {
                    segment += `.${classNames}`;
                }
            }

            const parent = current.parentElement;
            if (parent) {
                const siblings = Array.from(parent.children).filter(child => child.tagName === current.tagName);
                if (siblings.length > 1) {
                    const index = siblings.indexOf(current);
                    if (index >= 0) {
                        segment += `:nth-of-type(${index + 1})`;
                    }
                }
            }

            segments.unshift(segment);
            current = parent;
            depth++;
        }

        if (segments.length === 0) {
            return null;
        }

        if (node.nodeType === TEXT_NODE && segments.length) {
            segments[segments.length - 1] += '::text';
        }

        return segments.join(' > ');
    }

    function buildComponentPath(component) {
        if (!component) return null;

        const path = [];
        let current = component;
        let depth = 0;
        const limit = 10;

        while (current && depth < limit) {
            const label = current.name || current.type || (current.constructor && current.constructor.name) || 'component';
            path.unshift(label);
            current = current.parent;
            depth++;
        }

        return path.length ? path : null;
    }

    class AppConnectError extends Error {
        constructor(message, options = {}) {
            super(message);
            this.name = options.name || 'AppConnectError';
            this.details = options.details || {};
            this.originalError = options.originalError || null;
            this.component = options.component || null;
            this.context = options.context || null;

            if (Error.captureStackTrace) {
                Error.captureStackTrace(this, options.captureFn || this.constructor);
            }
        }
    }

    class ExpressionError extends AppConnectError {
        constructor(options) {
            super(options.message, {
                name: 'ExpressionError',
                details: {
                    expression: options.expression,
                    attribute: options.attribute,
                    nodePath: options.nodePath,
                    componentName: options.componentName,
                    componentType: options.componentType,
                    componentPath: options.componentPath,
                    description: options.description,
                },
                originalError: options.originalError,
                component: options.component,
                context: options.context,
                captureFn: ExpressionError,
            });

            this.expression = options.expression;
            this.attribute = options.attribute;
            this.nodePath = options.nodePath;
            this.componentName = options.componentName;
            this.componentType = options.componentType;
            this.componentPath = options.componentPath;
        }
    }

    class FormatterError extends AppConnectError {
        constructor(options) {
            super(options.message, {
                name: 'FormatterError',
                details: {
                    formatter: options.formatter,
                    value: options.value,
                    hint: options.hint,
                },
                originalError: options.originalError,
                context: options.context,
                captureFn: FormatterError,
            });

            this.formatter = options.formatter;
            this.value = options.value;
            this.hint = options.hint;
        }
    }

    function normalizeContext(scope, context = {}) {
        const normalized = Object.assign({}, context);

        if (!normalized.component && scope && scope.$node) {
            normalized.component = scope;
        }

        if (normalized.expression == null && typeof context.expression === 'string') {
            normalized.expression = context.expression;
        }

        return normalized;
    }

    function createExpressionError({
        expression,
        scope,
        context = {},
        originalError
    }) {
        const normalizedContext = normalizeContext(scope, context);
        const component = normalizedContext.component || null;
        const node = normalizedContext.node || (component && component.$node) || null;

        const messageParts = ['Expression error'];
        const componentName = component && component.name ? component.name : null;
        const componentType = component && component.type ? component.type : (component && component.constructor && component.constructor.name) || null;

        if (componentName) {
            messageParts.push(`in component "${componentName}"`);
        } else if (componentType) {
            messageParts.push(`in component <${componentType}>`);
        }

        if (normalizedContext.attribute) {
            messageParts.push(`for ${normalizedContext.attribute}`);
        }

        const nodePath = describeNode(node);
        if (nodePath) {
            messageParts.push(`at ${nodePath}`);
        }

        const originalMessage = originalError && originalError.message ? originalError.message : null;
        const message = originalMessage ? `${messageParts.join(' ')}: ${originalMessage}` : messageParts.join(' ');

        return new ExpressionError({
            message,
            expression: truncate(expression),
            attribute: normalizedContext.attribute || null,
            nodePath,
            componentName,
            componentType,
            componentPath: buildComponentPath(component),
            description: normalizedContext.description,
            originalError,
            component,
            context: normalizedContext,
        });
    }

    function createFormatterError({
        formatter,
        message,
        value,
        hint,
        originalError,
        context = {}
    }) {
        const normalizedContext = normalizeContext(null, context);

        return new FormatterError({
            message,
            formatter,
            value,
            hint,
            originalError,
            context: normalizedContext,
        });
    }

    function throwFormatterError({
        formatter,
        message,
        value,
        hint,
        fallback,
        originalError,
        context,
        onFallback
    }) {
        if (!(dmx && dmx.config)) {
            // No config available, behave like throw disabled and return fallback
            if (typeof onFallback === 'function') {
                try {
                    onFallback();
                } catch (callbackError) {
                    if (console && console.warn) {
                        console.warn('Formatter fallback handler failed', callbackError);
                    }
                }
            }
            return fallback;
        }

        const error = createFormatterError({
            formatter,
            message,
            value,
            hint,
            originalError,
            context,
        });

        if (dmx.config && dmx.config.throwErrors) {
            throw error;
        }

        if (typeof onFallback === 'function') {
            try {
                onFallback(error);
            } catch (callbackError) {
                if (console && console.warn) {
                    console.warn('Formatter fallback handler failed', callbackError);
                }
            }
        }

        return fallback;
    }

    function recordOnComponent(error) {
        const component = error.component;

        if (!component) return;

        component.lastExpressionError = error;

        if (typeof component._captureExpressionError === 'function') {
            try {
                component._captureExpressionError(error);
            } catch (captureErr) {
                if (dmx.config && dmx.config.throwErrors) {
                    throw captureErr;
                }
                if (console && console.warn) {
                    console.warn('Error capturing expression error on component', captureErr);
                }
            }
        }
    }

    function handleExpressionError(error) {
        recordOnComponent(error);

        if (dmx.config && dmx.config.throwErrors) {
            throw error;
        }

        const shouldLogExpressionError = !(
            dmx &&
            dmx.config &&
            dmx.config.logExpressionErrors === false
        );

        if (shouldLogExpressionError && console && console.error) {
            if (error.details) {
                console.error(error.message, error.details, error.originalError || error);
            } else {
                console.error(error);
            }
        }

        return undefined;
    }

    dmx.errors = {
        AppConnectError,
        ExpressionError,
        describeNode,
        createExpressionError,
        handleExpressionError,
        FormatterError,
        createFormatterError,
        throwFormatterError,
    };
})();