import {
    ansibleOutputTypes as outputTypes, ansiblePhases,
    defaultValueProviderTasks as tasks, fqdnValidationTypes as fqdnType,
    fqdnValidationTypes,
    messages,
    playbookPaths as playbookPaths,
    ansibleRoleTags as ansibleRoleTags
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

export function validateFqdn(fqdn, bridgeIf, fqdnType) {
    const playbookUtil = new PlaybookUtil();
    const playbookPath = playbookPaths.HE_ROLE;
    const roleTag = ansibleRoleTags.VALIDATE_HOSTNAMES;
    const skipTag = ansibleRoleTags.SKIP_FULL_EXECUTION;
    const outputPath = playbookUtil.getAnsibleOutputPath(ansiblePhases.VALIDATE_HOSTNAMES);
    const isLocalhost = fqdn === "localhost" || fqdn === "localhost.localdomain";
    const playbookVars = fqdnType === fqdnValidationTypes.HOST ? {
        he_host_address: fqdn,
        he_bridge_if: bridgeIf
    } : {he_fqdn: fqdn};

    return new Promise((resolve, reject) => {
        // Resolve quickly if localhost is being used to speed up loading time
        if (isLocalhost) {
            console.log(`Validation of FQDN ${fqdn} failed`);
            resolve({task: tasks.VALIDATE_FQDN, error: messages.LOCALHOST_INVALID_FQDN, FQDN: fqdn});
        } else {
            playbookUtil.runPlaybookWithVars(playbookPath, outputPath, playbookVars, roleTag, skipTag)
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

export function getHostFqdn() {
    return new Promise((resolve, reject) => {
        cockpit.spawn(["hostname", "--fqdn"])
            .done(fqdn => {
                console.log(`Host FQDN: ${fqdn}`);
                resolve(fqdn);
            })
            .fail(error => {
                console.log(`Error: ${error}`);
                reject(error);
            })
    })
}

export function validateDiscoveredHostFqdn(setValidationStateCallback) {
    return getHostFqdn()
        .then(result => _validateDiscoveredHostFqdn(result, setValidationStateCallback))
        .catch(error => {
            console.error(error);
            setValidationStateCallback({task: tasks.VALIDATE_FQDN, error: messages.UNABLE_TO_VALIDATE_FQDN});
        });
}

function _validateDiscoveredHostFqdn(fqdn, setValidationStateCallback) {
    const playbookUtil = new PlaybookUtil();
    const playbookPath = playbookPaths.HE_ROLE;
    const roleTag = ansibleRoleTags.VALIDATE_HOSTNAMES;
    const skipTag = ansibleRoleTags.SKIP_FULL_EXECUTION;
    const outputPath = playbookUtil.getAnsibleOutputPath(ansiblePhases.VALIDATE_HOSTNAMES);

    fqdn = fqdn.trim();
    const isLocalhost = fqdn === "localhost" || fqdn === "localhost.localdomain";
    const playbookVars = {he_host_address: fqdn};

    return new Promise((resolve) => {
        // Resolve quickly if localhost is being used to speed up loading time
        if (isLocalhost) {
            console.log(`Validation of host FQDN, ${fqdn}, failed`);
            resolve({task: tasks.VALIDATE_FQDN, error: messages.LOCALHOST_INVALID_FQDN, FQDN: fqdn});
        } else {
            playbookUtil.runPlaybookWithVars(playbookPath, outputPath, playbookVars, roleTag, skipTag)
                .then(() => {
                    console.log(`Validation of host FQDN, ${fqdn}, succeeded`);
                    const returnVal = {task: tasks.VALIDATE_FQDN, error: null};
                    setValidationStateCallback(returnVal);
                    resolve(returnVal);
                })
                .catch(error => {
                    // The playbook will fail and reject if the hostname is invalid.
                    // Failing to catch that error here will prevent the wizard from loading.
                    console.log(error);
                    console.log(`Validation of host FQDN, ${fqdn}, failed`);
                    playbookUtil.readOutputFile(outputPath)
                        .then(output => {
                            const errors = getFqdnValidationErrors(output);
                            const errorsRetVal = errors.length !== 0 ? errors.join(" ") : null;
                            const returnVal = {task: tasks.VALIDATE_FQDN, error: errorsRetVal};
                            setValidationStateCallback(returnVal);
                            resolve(returnVal);
                        })
                        .catch(error => {
                            console.log(`Unable to read output file: ${outputPath}. Error: ${error}`);
                            const returnVal = {task: tasks.VALIDATE_FQDN, error: messages.UNABLE_TO_VALIDATE_FQDN};
                            setValidationStateCallback(returnVal);
                            resolve(returnVal);
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
    if (lines.length === 1 && lines[0] === " ") {
        return errors;
    }

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
