export const configValues = {
    ANSWER_FILE_PATH: "/tmp/he-setup-answerfile.conf",
    ANSIBLE_PLAYBOOK_PATH: "/usr/share/cockpit/ovirt-dashboard/hostedEngineAnsibleFiles/heSetup.yml",
    APPLIANCE_PATH_PREFIX: "/usr/share/ovirt-engine-appliance/"
};

export const configFileTypes = {
    NONE: "none",
    BOOLEAN: "bool",
    STRING: "str",
    INTEGER: "int"
};

export const answerFilePrefixes = {
    CORE: "OVEHOSTED_CORE/",
    NETWORK: "OVEHOSTED_NETWORK/",
    ENGINE: "OVEHOSTED_ENGINE/",
    STORAGE: "OVEHOSTED_STORAGE/",
    VDSM: "OVEHOSTED_VDSM/",
    VM: "OVEHOSTED_VM/",
    NOTIFICATIONS: "OVEHOSTED_NOTIF/"
};

export const deploymentStatus = {
    SUCCESS: 0,
    RUNNING: 1,
    FAILURE: -1
};

export const heSetupState = {
    EMPTY: "empty",
    POLLING: "polling",
    REGISTERED: "registered",
    GDEPLOY: "gdeploy",
    HOSTED_ENGINE: "he"
};

export const gatewayValidationState = {
    EMPTY: "empty",
    POLLING: "polling",
    SUCCESS: "success",
    FAILED: "failed"
};

export const deploymentOption = {
    REGULAR: "regular",
    HYPERCONVERGED: "hci"
};

export const resourceConstants = {
    VDSM_HOST_OVERHEAD_MB: 256,
    VDSM_VM_OVERHEAD_MB: 64
};

export const messages = {
    GENERAL_ERROR_MSG: "Please correct errors before moving to the next step.",
    PASSWORD_MISMATCH: "Passwords do not match",
    IP_NOT_PINGABLE: "Unable to ping address. Please enter a pingable address."
};