// Polyfills for older browsers
// IE is not supported

// https://caniuse.com/element-closest
if (window.Element && !('closest' in Element.prototype)) {
    Element.prototype.closest = function(s) {
        let matches = (this.document || this.ownerDocument).querySelectorAll(s),
            i,
            el = this;
        do {
            i = matches.length;
            while (--i >= 0 && matches.item(i) !== el) {};
        } while ((i < 0) && (el = el.parentElement));
        return el;
    };
}

// https://caniuse.com/mdn-api_nodelist_foreach
if (window.NodeList && !('forEach' in NodeList.prototype)) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}

// https://caniuse.com/mdn-api_queuemicrotask
if (typeof window.queueMicrotask !== 'function') {
    window.queueMicrotask = function(callback) {
        Promise.resolve().then(callback).catch(e => setTimeout(() => {
            throw e
        }));
    }
}

// https://caniuse.com/mdn-api_node_isconnected
if (window.Node && !('isConnected' in Node.prototype)) {
    Object.defineProperty(Node.prototype, 'isConnected', {
        get: function() {
            return document.contains(this)
        }
    });
}

// https://caniuse.com/mdn-api_element_toggleattribute
if (window.Element && !('toggleAttribute' in Element.prototype)) {
    Element.prototype.toggleAttribute = function(name, force) {
        if (this.hasAttribute(name)) {
            if (force !== true) this.removeAttribute(name);
        } else {
            if (force !== false) this.setAttribute(name, '');
        }
    }
}