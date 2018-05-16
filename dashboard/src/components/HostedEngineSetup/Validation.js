import { messages } from "./constants";

const Validation = {
    ipAddress: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    macAddress: /^[0-9a-fA-F]{1,2}([\.:-])(?:[0-9a-fA-F]{1,2}\1){4}[0-9a-fA-F]{1,2}$/
};

export function validatePropsForUiStage(stage, model, errorMsgs) {
    let isValid = true;

    Object.getOwnPropertyNames(model).forEach(
        function(sectionName) {
            let section = model[sectionName];
            Object.getOwnPropertyNames(section).forEach(
                function(propName) {
                    let prop = section[propName];

                    if (prop.uiStage !== stage) {
                        return;
                    }

                    const errorMsg = getErrorMsgForProperty(prop);
                    if (errorMsg !== "") {
                        errorMsgs[propName] = errorMsg;
                        isValid = false;
                    }
                }, this)
        }, this);

    return isValid;
}

export function getErrorMsgForProperty(prop) {
    let errorMsg = "";

    if (isRequiredAndEmpty(prop)) {
        errorMsg = "Required field";
    } else if (requiresRegexValidation(prop)) {
        const isInvalidFormat = !prop.regex.test(prop.value);
        if (isInvalidFormat) {
            errorMsg = prop.hasOwnProperty("errorMsg") ? prop.errorMsg : "Invalid format";
        }
    } else if (requiresRangeValidation(prop)) {
        const value = parseInt(prop.value);
        const outOfRange = value < prop.range.min || value > prop.range.max;

        if (isNaN(value)) {
            errorMsg = messages.NUMERIC_VALUES_ONLY;
        } else if (outOfRange) {
            const minValue = prop.range.min.toLocaleString();
            const maxValue = prop.range.max.toLocaleString();
            const unit = prop.hasOwnProperty("unit") ? prop.unit : "";
            const message = `Value must be between ${minValue}${unit} and ${maxValue}${unit}`;
            errorMsg = prop.hasOwnProperty("errorMsg") ? prop.errorMsg : message;
        }
    }

    return errorMsg;
}

function isRequiredAndEmpty(prop) {
    if (prop.name === "cloudinitVMDNS") {
        const dnsList = prop.value;
        const isEmptyArr = dnsList.length < 1 || (dnsList.length === 1 && dnsList[0] === "");
        return prop.required && isEmptyArr;
    }

    const propType = typeof prop.value;
    const isValidType = propType === 'string' || propType === 'number';
    const isEmpty = prop.value === "";
    const isRequired = prop.required;

    return isValidType && isEmpty && isRequired;
}

function requiresRegexValidation(prop) {
    return prop.value !== "" && prop.hasOwnProperty("regex");
}

function requiresRangeValidation(prop) {
    return prop.hasOwnProperty("range");
}

export default Validation;