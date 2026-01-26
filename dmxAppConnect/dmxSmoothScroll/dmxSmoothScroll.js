/*!
 App Connect Smooth Scroll
 Version: 2.0.0
 (c) 2024 Wappler.io
 @build 2024-04-15 17:48:46
 */
/*!
 * smooth-scroll v16.1.2
 * Animate scrolling to anchor links
 * (c) 2020 Chris Ferdinandi
 * MIT License
 * http://github.com/cferdinandi/smooth-scroll
 */
! function(e, t) {
    "function" == typeof define && define.amd ? define([], (function() {
        return t(e)
    })) : "object" == typeof exports ? module.exports = t(e) : e.SmoothScroll = t(e)
}("undefined" != typeof global ? global : "undefined" != typeof window ? window : this, (function(e) {
    "use strict";
    var t = {
            ignore: "[data-scroll-ignore]",
            header: null,
            topOnEmptyHash: !0,
            speed: 500,
            speedAsDuration: !1,
            durationMax: null,
            durationMin: null,
            clip: !0,
            offset: 0,
            easing: "easeInOutCubic",
            customEasing: null,
            updateURL: !0,
            popstate: !0,
            emitEvents: !0
        },
        n = function() {
            var e = {};
            return Array.prototype.forEach.call(arguments, (function(t) {
                for (var n in t) {
                    if (!t.hasOwnProperty(n)) return;
                    e[n] = t[n]
                }
            })), e
        },
        o = function(e) {
            "#" === e.charAt(0) && (e = e.substr(1));
            for (var t, n = String(e), o = n.length, a = -1, r = "", i = n.charCodeAt(0); ++a < o;) {
                if (0 === (t = n.charCodeAt(a))) throw new InvalidCharacterError("Invalid character: the input contains U+0000.");
                t >= 1 && t <= 31 || 127 == t || 0 === a && t >= 48 && t <= 57 || 1 === a && t >= 48 && t <= 57 && 45 === i ? r += "\\" + t.toString(16) + " " : r += t >= 128 || 45 === t || 95 === t || t >= 48 && t <= 57 || t >= 65 && t <= 90 || t >= 97 && t <= 122 ? n.charAt(a) : "\\" + n.charAt(a)
            }
            return "#" + r
        },
        a = function() {
            return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight)
        },
        r = function(t) {
            return t ? (n = t, parseInt(e.getComputedStyle(n).height, 10) + t.offsetTop) : 0;
            var n
        },
        i = function(t, n, o, a) {
            if (n.emitEvents && "function" == typeof e.CustomEvent) {
                var r = new CustomEvent(t, {
                    bubbles: !0,
                    detail: {
                        anchor: o,
                        toggle: a
                    }
                });
                document.dispatchEvent(r)
            }
        };
    return function(s, u) {
        var l, c, d, f, h = {};
        h.cancelScroll = function(e) {
            cancelAnimationFrame(f), f = null, e || i("scrollCancel", l)
        }, h.animateScroll = function(o, s, u) {
            h.cancelScroll();
            var c = n(l || t, u || {}),
                m = "[object Number]" === Object.prototype.toString.call(o),
                p = m || !o.tagName ? null : o;
            if (m || p) {
                var g = e.pageYOffset;
                c.header && !d && (d = document.querySelector(c.header));
                var y, S, v, b = r(d),
                    O = m ? o : function(t, n, o, r) {
                        var i = 0;
                        if (t.offsetParent)
                            do {
                                i += t.offsetTop, t = t.offsetParent
                            } while (t);
                        return i = Math.max(i - n - o, 0), r && (i = Math.min(i, a() - e.innerHeight)), i
                    }(p, b, parseInt("function" == typeof c.offset ? c.offset(o, s) : c.offset, 10), c.clip),
                    E = O - g,
                    I = a(),
                    C = 0,
                    Q = function(e, t) {
                        var n = t.speedAsDuration ? t.speed : Math.abs(e / 1e3 * t.speed);
                        return t.durationMax && n > t.durationMax ? t.durationMax : t.durationMin && n < t.durationMin ? t.durationMin : parseInt(n, 10)
                    }(E, c),
                    A = function(t, n) {
                        var a = e.pageYOffset;
                        if (t == n || a == n || (g < n && e.innerHeight + a) >= I) return h.cancelScroll(!0),
                            function(t, n, o) {
                                0 === t && document.body.focus(), o || (t.focus(), document.activeElement !== t && (t.setAttribute("tabindex", "-1"), t.focus(), t.style.outline = "none"), e.scrollTo(0, n))
                            }(o, n, m), i("scrollStop", c, o, s), y = null, f = null, !0
                    },
                    M = function(t) {
                        y || (y = t), C += t - y, v = g + E * function(e, t) {
                            var n;
                            return "easeInQuad" === e.easing && (n = t * t), "easeOutQuad" === e.easing && (n = t * (2 - t)), "easeInOutQuad" === e.easing && (n = t < .5 ? 2 * t * t : (4 - 2 * t) * t - 1), "easeInCubic" === e.easing && (n = t * t * t), "easeOutCubic" === e.easing && (n = --t * t * t + 1), "easeInOutCubic" === e.easing && (n = t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1), "easeInQuart" === e.easing && (n = t * t * t * t), "easeOutQuart" === e.easing && (n = 1 - --t * t * t * t), "easeInOutQuart" === e.easing && (n = t < .5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t), "easeInQuint" === e.easing && (n = t * t * t * t * t), "easeOutQuint" === e.easing && (n = 1 + --t * t * t * t * t), "easeInOutQuint" === e.easing && (n = t < .5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t), e.customEasing && (n = e.customEasing(t)), n || t
                        }(c, S = (S = 0 === Q ? 0 : C / Q) > 1 ? 1 : S), e.scrollTo(0, Math.floor(v)), A(v, O) || (f = e.requestAnimationFrame(M), y = t)
                    };
                0 === e.pageYOffset && e.scrollTo(0, 0),
                    function(e, t, n) {
                        t || history.pushState && n.updateURL && history.pushState({
                            smoothScroll: JSON.stringify(n),
                            anchor: e.id
                        }, document.title, e === document.documentElement ? "#top" : "#" + e.id)
                    }(o, m, c), "matchMedia" in e && e.matchMedia("(prefers-reduced-motion)").matches ? e.scrollTo(0, Math.floor(O)) : (i("scrollStart", c, o, s), h.cancelScroll(!0), e.requestAnimationFrame(M))
            }
        };
        var m = function(t) {
                if (!t.defaultPrevented && !(0 !== t.button || t.metaKey || t.ctrlKey || t.shiftKey) && "closest" in t.target && (c = t.target.closest(s)) && "a" === c.tagName.toLowerCase() && !t.target.closest(l.ignore) && c.hostname === e.location.hostname && c.pathname === e.location.pathname && /#/.test(c.href)) {
                    var n, a;
                    try {
                        n = o(decodeURIComponent(c.hash))
                    } catch (e) {
                        n = o(c.hash)
                    }
                    if ("#" === n) {
                        if (!l.topOnEmptyHash) return;
                        a = document.documentElement
                    } else a = document.querySelector(n);
                    (a = a || "#top" !== n ? a : document.documentElement) && (t.preventDefault(), function(t) {
                        if (history.replaceState && t.updateURL && !history.state) {
                            var n = e.location.hash;
                            n = n || "", history.replaceState({
                                smoothScroll: JSON.stringify(t),
                                anchor: n || e.pageYOffset
                            }, document.title, n || e.location.href)
                        }
                    }(l), h.animateScroll(a, c))
                }
            },
            p = function(e) {
                if (null !== history.state && history.state.smoothScroll && history.state.smoothScroll === JSON.stringify(l)) {
                    var t = history.state.anchor;
                    "string" == typeof t && t && !(t = document.querySelector(o(history.state.anchor))) || h.animateScroll(t, null, {
                        updateURL: !1
                    })
                }
            };
        h.destroy = function() {
            l && (document.removeEventListener("click", m, !1), e.removeEventListener("popstate", p, !1), h.cancelScroll(), l = null, null, c = null, d = null, null, f = null)
        };
        return function() {
            if (!("querySelector" in document && "addEventListener" in e && "requestAnimationFrame" in e && "closest" in e.Element.prototype)) throw "Smooth Scroll: This browser does not support the required JavaScript methods and browser APIs.";
            h.destroy(), l = n(t, u || {}), d = l.header ? document.querySelector(l.header) : null, document.addEventListener("click", m, !1), l.updateURL && l.popstate && e.addEventListener("popstate", p, !1)
        }(), h
    }
})), dmx.Component("smooth-scroll", {
    attributes: {
        selector: {
            type: String,
            default: 'a[href*="#"]'
        },
        ignore: {
            type: String,
            default: "[data-scroll-ignore]"
        },
        header: {
            type: String,
            default: null
        },
        speed: {
            type: Number,
            default: 500
        },
        offset: {
            type: Number,
            default: 0
        },
        easing: {
            type: String,
            default: "easeInOutCubic",
            enum: ["Linear", "easeInQuad", "easeInCubic", "easeInQuart", "easeInQuint", "easeInOutQuad", "easeInOutCubic", "easeInOutQuart", "easeInOutQuint", "easeOutQuad", "easeOutCubic", "easeOutQuart", "easeOutQuint"]
        }
    },
    methods: {
        goto(e) {
            "string" == typeof e && (e = document.querySelector(e)), this._scroll.animateScroll(e)
        }
    },
    init() {
        this._scroll = new SmoothScroll(this.props.selector, { ...this.props,
            updateURL: !1,
            speedAsDuration: !0
        })
    },
    performUpdate(e) {
        this._scroll.destroy(), this._scroll = new SmoothScroll(this.props.selector, { ...this.props,
            updateURL: !1,
            speedAsDuration: !0
        })
    },
    destroy: function() {
        this._scroll.destroy()
    }
});
//# sourceMappingURL=dmxSmoothScroll.js.map