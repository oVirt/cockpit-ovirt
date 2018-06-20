import {
    ansibleOutputTypes as outputTypes,
    defaultValueProviderTasks as tasks,
    fqdnValidationTypes,
    messages,
    playbookOutputPaths as outputPaths,
    playbookPaths as playbookPaths
} from "./constants";
import PlaybookUtil from "../../helpers/HostedEngineSetup/PlaybookUtil";

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
    return prop.value !== "" && prop.hasOwnProperty("range");
}

export function validateHostFqdn(fqdn) {
    const playbookVars = {HOST_ADDRESS: fqdn};
    return validateFqdn(fqdn, playbookVars);
}

export function validateVmFqdn(fqdn) {
    const playbookVars = {FQDN: fqdn};
    return validateFqdn(fqdn, playbookVars);
}

export function validateFqdn(fqdn, fqdnType) {
    const playbookUtil = new PlaybookUtil();
    const playbookPath = playbookPaths.VALIDATE_HOSTNAMES;
    const outputPath = outputPaths.VALIDATE_HOSTNAMES.replace(".json", "") + "_" + fqdnType + ".json";
    const isLocalhost = fqdn === "localhost" || fqdn === "localhost.localdomain";
    const playbookVars = fqdnType === fqdnValidationTypes.HOST ? {HOST_ADDRESS: fqdn} : {FQDN: fqdn};

    return new Promise((resolve, reject) => {
        // Resolve quickly if localhost is being used to speed up loading time
        if (isLocalhost) {
            console.log(`Validation of FQDN ${fqdn} failed`);
            resolve({task: tasks.VALIDATE_FQDN, error: messages.LOCALHOST_INVALID_FQDN, FQDN: fqdn});
        } else {
            playbookUtil.runPlaybookWithVars(playbookPath, "Validate FQDN", outputPath, playbookVars)
                .then(() => {
                    console.log(`Validation of FQDN ${fqdn} succeeded`);
                    resolve({task: tasks.VALIDATE_FQDN, error: null, FQDN: fqdn});
                })
                .catch(error => {
                    // The playbook will fail and reject if the hostname is invalid.
                    // Failing to catch that error here would prevent the wizard from loading.
                    console.log(error);
                    console.log(`Validation of FQDN ${fqdn} failed`);
                    playbookUtil.readOutputFile(outputPath)
                        .then(output => {
                            const errors = getFqdnValidationErrors(output);
                            resolve({task: tasks.VALIDATE_FQDN, error: errors.join(" "), FQDN: fqdn});
                        })
                        .catch(error => {
                            console.log(`Unable to read file: ${path}. Error: ${error}`);
                            resolve({task: tasks.VALIDATE_FQDN, error: messages.UNABLE_TO_VALIDATE_FQDN, FQDN: fqdn});
                        });
                });
        }
    });
}

function getFqdnValidationErrors(fileContents) {
    let lines = fileContents.split('\n');
    // Filter blank lines
    lines = lines.filter(n => n);
    const errors = [];

    lines.forEach(function(line) {
        try {
            const json = JSON.parse(line);
            if (json["OVEHOSTED_AC/type"] === outputTypes.ERROR) {
                const errorBody = json["OVEHOSTED_AC/body"];
                const msg = errorBody.slice(errorBody.indexOf("\"msg\":") + 8, -2);
                errors.push(msg.replace("\\n", ""));
            }
        } catch (error) {
            console.log(error);
        }
    });
    return errors;
}

export default Validation;