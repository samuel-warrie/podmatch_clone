dmx.debounce = (fn, delay) => {
    let handle;

    return function() {
        const cb = () => {
            fn.apply(this, arguments);
        };

        if (delay) {
            clearTimeout(handle);
            handle = setTimeout(cb, delay);
        } else {
            cancelAnimationFrame(handle);
            handle = requestAnimationFrame(cb);
        }
    };
};

dmx.throttle = (fn, delay) => {
    let throttle = false,
        args;

    return function() {
        args = Array.from(arguments);

        if (!throttle) {
            const cb = () => {
                throttle = false;
                if (args) fn.apply(this, args);
            };

            fn.apply(this, args);

            args = undefined;
            throttle = true;

            if (delay) {
                setTimeout(cb, delay);
            } else {
                requestAnimationFrame(cb);
            }
        }
    };
};

dmx.keyCodes = {
    bs: 8,
    tab: 9,
    enter: 13,
    esc: 27,
    space: 32,
    left: 37,
    up: 38,
    right: 39,
    down: 40,
    delete: 46,

    backspace: 8,
    pause: 19,
    capslock: 20,
    escape: 27,
    pageup: 33,
    pagedown: 34,
    end: 35,
    home: 36,
    arrowleft: 37,
    arrowup: 38,
    arrowright: 39,
    arrowdown: 40,
    insert: 45,
    numlock: 144,
    scrolllock: 145,
    semicolon: 186,
    equal: 187,
    comma: 188,
    minus: 189,
    period: 190,
    slash: 191,
    backquote: 192,
    bracketleft: 219,
    backslash: 220,
    bracketright: 221,
    quote: 222,

    numpad0: 96,
    numpad1: 97,
    numpad2: 98,
    numpad3: 99,
    numpad4: 100,
    numpad5: 101,
    numpad6: 102,
    numpad7: 103,
    numpad8: 104,
    numpad9: 105,
    numpadmultiply: 106,
    numpadadd: 107,
    numpadsubstract: 109,
    numpaddivide: 111,

    f1: 112,
    f2: 113,
    f3: 114,
    f4: 115,
    f5: 116,
    f6: 117,
    f7: 118,
    f8: 119,
    f9: 120,
    f10: 121,
    f11: 122,
    f12: 123,

    digit0: 48,
    digit1: 49,
    digit2: 50,
    digit3: 51,
    digit4: 52,
    digit5: 53,
    digit6: 54,
    digit7: 55,
    digit8: 56,
    digit9: 57,

    keya: [65, 97],
    keyb: [66, 98],
    keyc: [67, 99],
    keyd: [68, 100],
    keye: [69, 101],
    keyf: [70, 102],
    keyg: [71, 103],
    keyh: [72, 104],
    keyi: [73, 105],
    keyj: [74, 106],
    keyk: [75, 107],
    keyl: [76, 108],
    keym: [77, 109],
    keyn: [78, 110],
    keyo: [79, 111],
    keyp: [80, 112],
    keyq: [81, 113],
    keyr: [82, 114],
    keys: [83, 115],
    keyt: [84, 116],
    keyu: [85, 117],
    keyv: [86, 118],
    keyw: [87, 119],
    keyx: [88, 120],
    keyy: [89, 121],
    keyz: [90, 122],
};

dmx.eventListener = function(target, eventType, handler, modifiers) {
    let timeout, throttle;

    const listener = function(event) {
        if (modifiers.self && event.target !== event.currentTarget) return;
        if (modifiers.ctrl && !event.ctrlKey) return;
        if (modifiers.alt && !event.altKey) return;
        if (modifiers.shift && !event.shiftKey) return;
        if (modifiers.meta && !event.metaKey) return;

        if ((event.originalEvent || event).nsp && !Object.keys(modifiers).includes((event.originalEvent || event).nsp)) {
            return;
        }

        if ((event.originalEvent || event) instanceof MouseEvent) {
            if (modifiers.button != null && event.button != (parseInt(modifiers.button, 10) || 0)) return;
            if (modifiers.button0 && event.button != 0) return;
            if (modifiers.button1 && event.button != 1) return;
            if (modifiers.button2 && event.button != 2) return;
            if (modifiers.button3 && event.button != 3) return;
            if (modifiers.button4 && event.button != 4) return;
        }

        if ((event.originalEvent || event) instanceof KeyboardEvent) {
            var keys = [];

            Object.keys(modifiers).forEach(function(key) {
                var keyVal = parseInt(key, 10);

                if (keyVal) {
                    keys.push(keyVal);
                } else if (dmx.keyCodes[key]) {
                    keys.push(dmx.keyCodes[key]);
                }
            });

            for (var i = 0; i < keys.length; i++) {
                if (Array.isArray(keys[i])) {
                    if (!keys[i].includes(event.which)) return;
                } else if (event.which !== keys[i]) return;
            }
        }

        if (modifiers.stop) event.stopPropagation();
        if (modifiers.prevent) event.preventDefault();

        if (event.originalEvent) event = event.originalEvent;

        if (!event.$data) event.$data = {};
        if (event.type && event.$data.type == null) {
            event.$data.type = event.type;
        }

        if (event instanceof MouseEvent) {
            event.$data.altKey = event.altKey;
            event.$data.ctrlKey = event.ctrlKey;
            event.$data.metaKey = event.metaKey;
            event.$data.shiftKey = event.shiftKey;
            event.$data.pageX = event.pageX;
            event.$data.pageY = event.pageY;
            event.$data.x = event.x || event.clientX;
            event.$data.y = event.y || event.clientY;
            event.$data.button = event.button;
        }

        if (event instanceof WheelEvent) {
            event.$data.deltaX = event.deltaX;
            event.$data.deltaY = event.deltaY;
            event.$data.deltaZ = event.deltaZ;
            event.$data.deltaMode = event.deltaMode;
        }

        if (window.PointerEvent && event instanceof PointerEvent) {
            event.$data.pointerId = event.pointerId;
            event.$data.width = event.width;
            event.$data.height = event.height;
            event.$data.pressure = event.pressure;
            event.$data.tangentialPressure = event.tangentialPressure;
            event.$data.tiltX = event.tiltX;
            event.$data.tiltY = event.tiltY;
            event.$data.twist = event.twist;
            event.$data.pointerType = event.pointerType;
            event.$data.isPrimary = event.isPrimary;
        }

        if (window.TouchEvent && event instanceof TouchEvent) {
            const touchMap = (touch) => ({
                identifier: touch.identifier,
                screenX: touch.screenX,
                screenY: touch.screenY,
                clientX: touch.clientX,
                clientY: touch.clientY,
                pageX: touch.pageX,
                pageY: touch.pageY,
            });

            event.$data.altKey = event.altKey;
            event.$data.ctrlKey = event.ctrlKey;
            event.$data.metaKey = event.metaKey;
            event.$data.shiftKey = event.shiftKey;
            event.$data.touches = Array.from(event.touches).map(touchMap);
            event.$data.changedTouches = Array.from(event.changedTouches).map(touchMap);
            event.$data.targetTouches = Array.from(event.targetTouches).map(touchMap);
            event.$data.rotation = event.rotation;
            event.$data.scale = event.scale;
        }

        if (event instanceof KeyboardEvent) {
            event.$data.altKey = event.altKey;
            event.$data.ctrlKey = event.ctrlKey;
            event.$data.metaKey = event.metaKey;
            event.$data.shiftKey = event.shiftKey;
            event.$data.location = event.location;
            event.$data.repeat = event.repeat;
            event.$data.code = event.code;
            event.$data.key = event.key;
        }

        if (event instanceof CustomEvent) {
            event.$data.detail = event.detail;
        }

        if (modifiers.debounce) {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                handler.apply(this, arguments);
            }, parseInt(modifiers.debounce, 10) || 0);
        } else if (modifiers.throttle) {
            if (!throttle) {
                throttle = true;
                handler.apply(this, arguments);
                setTimeout(() => {
                    throttle = false;
                }, parseInt(modifiers.throttle, 10) || 0);
            }
        } else {
            return handler.apply(this, arguments);
        }
    };

    modifiers = modifiers || {};

    // support multiple event systems
    const events = new Set();
    events.add(eventType);
    events.add(eventType.replace(/-/g, '.'));
    events.add(eventType.replace(/-/g, ':'));

    // attach event listener(s)
    for (const eventType of events) {
        if (window.Dom7 && target.nodeType === 1) {
            Dom7(target)[modifiers.once ? 'once' : 'on'](eventType.replace(/-/g, '.'), listener, !!modifiers.capture);
        } else if (window.jQuery && !modifiers.capture) {
            jQuery(target)[modifiers.once ? 'one' : 'on'](eventType.replace(/-/g, '.'), listener);
        } else {
            target.addEventListener(eventType, listener, {
                capture: !!modifiers.capture,
                once: !!modifiers.once,
                passive: !!modifiers.passive,
            });
        }
    }

    // return unsubscribe function
    return () => {
        for (const eventType of events) {
            if (window.Dom7 && target.nodeType === 1) {
                Dom7(target).off(eventType, listener, !!modifiers.capture);
            } else if (window.jQuery && !modifiers.capture) {
                jQuery(target).off(eventType, listener);
            } else {
                target.removeEventListener(eventType, listener, !!modifiers.capture);
            }
        }
    };
};