dmx.Formatters('boolean', {

    // then(trueValue:Any, falseValue:Any):Any
    then(bool, trueValue, falseValue) {
        return bool ? trueValue : falseValue;
    },

});