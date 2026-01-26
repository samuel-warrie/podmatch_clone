dmx.Component('form', {

    attributes: {
        novalidate: {
            type: Boolean,
            default: false
        },
    },

    methods: {
        submit(direct) {
            this._submit(direct);
        },

        reset() {
            this._reset();
        },

        validate() {
            this._validate();
        },
    },

    events: {
        invalid: Event,
        submit: Event,
    },

    init(node) {
        this._submitHandler = this._submitHandler.bind(this);
        this._resetHandler = this._resetHandler.bind(this);

        node.noValidate = true;
        node.addEventListener('submit', this._submitHandler);
        node.addEventListener('reset', this._resetHandler);

        if (window.grecaptcha && this.$node.querySelector('.g-recaptcha[data-size="invisible"]')) {
            node.querySelectorAll('.g-recaptcha').forEach((elm) => {
                elm.setAttribute('data-callback', '___cb' + String(this.seed).slice(2));
            });
        }
    },

    destroy() {
        this.$node.removeEventListener('submit', this._submitHandler);
        this.$node.removeEventListener('reset', this._resetHandler);
    },

    _submitHandler(event) {
        event.preventDefault();
        this._submit();
    },

    _resetHandler(event) {
        // remove this when validation is rewritten
        if (dmx.validateReset) dmx.validateReset(this.$node);
        if (window.grecaptcha && this.$node.querySelector('.g-recaptcha')) {
            if (typeof grecaptcha.reset === 'function') {
                grecaptcha.reset();
            }
        }
    },

    _submit(direct) {
        if (direct) {
            return this._formSubmit();
        }

        if (this.props.novalidate || this._validate()) {
            if (window.grecaptcha && this.$node.querySelector('.g-recaptcha[data-size="invisible"]') && typeof grecaptcha.execute === 'function') {
                window['___cb' + String(this.seed).slice(2)] = () => {
                    if (this.dispatchEvent('submit', {
                            cancelable: true
                        })) {
                        this._formSubmit();
                    }
                };
                grecaptcha.execute();
            } else {
                if (this.dispatchEvent('submit', {
                        cancelable: true
                    })) {
                    this._formSubmit();
                }
            }
        } else {
            this.dispatchEvent('invalid');
            this._focusFirstInvalid();
        }
    },

    _reset() {
        this._formReset();
    },

    _validate() {
        if (dmx.validate) return dmx.validate(this.$node);
        Array.from(this.$node.elements).forEach(node => node.dirty = true);
        return this.$node.checkValidity();
    },

    _formSubmit() {
        HTMLFormElement.prototype.submit.call(this.$node);
    },

    _formReset() {
        HTMLFormElement.prototype.reset.call(this.$node);
    },

    _focusFirstInvalid() {
        const elm = Array.from(this.$node.elements).find(elm => !elm.validity.valid);
        if (elm) elm.focus();
    },

    _parseJsonForm() {
        const result = {};

        for (const element of this.$node.elements) {
            if (element.name && !element.disabled) {
                const steps = parseSteps(element.name.replace(/\[\]$/, ""));
                let context = result;

                for (const step of steps) {
                    const type = element.type;

                    if (type == "number") {
                        if (element.value) {
                            context = setValue(
                                context,
                                step,
                                context[step.key], +element.value
                            );
                        }
                    } else if (type == "radio" || type == "checkbox") {
                        if (element.getAttribute("value")) {
                            if (element.checked) {
                                context = setValue(
                                    context,
                                    step,
                                    context[step.key],
                                    element.value
                                );
                            }
                        } else {
                            context = setValue(
                                context,
                                step,
                                context[step.key],
                                element.checked
                            );
                        }
                    } else if (type == "select-multiple") {
                        context = setValue(
                            context,
                            step,
                            context[step.key],
                            Array.from(element.selectedOptions).map((opt) => opt.value)
                        );
                    } else {
                        context = setValue(context, step, context[step.key], element.value);
                    }
                }
            }
        }

        return result;

        function parseSteps(name) {
            const steps = [],
                org = name;
            const re = /^\[([^\]]*)\]/;
            const reNumeric = /^\d+$/;

            name = name.replace(/^([^\[]+)/, (m, p1) => {
                steps.push({
                    type: "object",
                    key: p1
                });
                return "";
            });

            if (!name) {
                steps[0].last = true;
                return steps;
            }

            while (name) {
                if (re.test(name)) {
                    name = name.replace(re, (m, p1) => {
                        if (!p1) {
                            steps[steps.length - 1].append = true;
                        } else if (reNumeric.test(p1)) {
                            steps.push({
                                type: "array",
                                key: +p1
                            });
                        } else {
                            steps.push({
                                type: "object",
                                key: p1
                            });
                        }

                        return "";
                    });

                    continue;
                }

                return {
                    type: "object",
                    key: org,
                    last: true
                };
            }

            for (let i = 0, n = steps.length; i < n; i++) {
                const step = steps[i];

                if (i + 1 < n) step.nextType = steps[i + 1].type;
                else step.last = true;
            }

            return steps;
        }

        function setValue(context, step, current, value) {
            if (step.last) {
                if (current === undefined) {
                    context[step.key] = step.append ? [value] : value;
                } else if (Array.isArray(current)) {
                    context[step.key].push(value);
                } else if (typeof current == "object") {
                    return setValue(
                        current, {
                            type: "object",
                            key: "",
                            last: true
                        },
                        current[""],
                        value
                    );
                } else {
                    context[step.key] = [current, value];
                }

                return context;
            }

            if (current === undefined) {
                return (context[step.key] = step.nextType == "array" ? [] : {});
            } else if (Array.isArray(current)) {
                if (step.nextType == "array") return current;
                const obj = {};
                for (let i = 0, n = current.length; i < n; i++) {
                    if (current[i] !== undefined) obj[i] = current[i];
                }
                return (context[step.key] = obj);
            } else if (typeof current == "object") {
                return context[step.key];
            }

            return (context[step.key] = {
                "": current
            });
        }
    },

});