export const configValues = {
    ANSWER_FILE_PATH: "/tmp/he-setup-answerfile.conf",
    ANSIBLE_PLAYBOOK_PATH: "/usr/share/cockpit/ovirt-dashboard/hostedEngineAnsibleFiles/heSetup.yml",
    APPLIANCE_PATH_PREFIX: "/usr/share/ovirt-engine-appliance/",
    ANSIBLE_PHASE_1_VAR_FILE_PATH: "/tmp/ansiblePhase1.var",
    ANSIBLE_PHASE_2_VAR_FILE_PATH: "/tmp/ansiblePhase2.var",
    ANSIBLE_PHASE_3_VAR_FILE_PATH: "/tmp/ansiblePhase3.var"
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

export const status = {
    EMPTY: "empty",
    POLLING: "polling",
    SUCCESS: "success",
    FAILURE: "failure"
};

export const deploymentOption = {
    REGULAR: "regular",
    HYPERCONVERGED: "hci"
};

export const resourceConstants = {
    VDSM_HOST_OVERHEAD_MB: 256,
    VDSM_VM_OVERHEAD_MB: 64,
    VM_MEM_MIN_MB: 4096
};

export const messages = {
    GENERAL_ERROR_MSG: "Please correct errors before moving to the next step.",
    PASSWORD_MISMATCH: "Passwords do not match",
    IP_NOT_PINGABLE: "Unable to ping address. Please enter a pingable address.",
    // Displayed when detected CPU model isn't recognized
    DETECTED_CPU_NOT_FOUND: "Unable to determine CPU level. Please select the CPU model the host CPU can properly emulate.",
    // Displayed when detected CPU model is known, but not supported by ovirt-hosted-engine-setup
    DETECTED_CPU_NOT_SUPPORTED_BY_SETUP: "The CPU level has been set at the highest level supported for the detected CPU.",
    VIRT_NOT_SUPPORTED: "Hardware virtualization is not supported on this host!",
    SYS_DATA_UNRETRIEVABLE: "System data could not be retrieved!",
    INSUFFICIENT_MEM_AVAIL: "There is insufficient memory available to support engine VM creation at this time!",
    DEPLOYMENT_SUCCESSFUL: "Hosted Engine has been successfully deployed!",
    DEPLOYMENT_FAILED: "Deployment failed",
    DEPLOYMENT_IN_PROGRESS: "Deployment in progress",
    ADD_GDEPLOY_PROPS_TO_ANS_FILE: "Attempting to add gdeploy properties to the answer file.",
    NO_GDEPLOY_ANSWER_FILES_FOUND: "No gdeploy answer files found."
};

export const allowedIntelCpus = [
    "model_Broadwell",
    "model_Broadwell-noTSX",
    "model_Haswell",
    "model_Haswell-noTSX",
    "model_SandyBridge",
    "model_Westmere",
    "model_Nehalem",
    "model_Penryn",
    "model_Conroe"
];

export const allIntelCpus = [
    "model_Skylake-Client",
    "model_Broadwell",
    "model_Broadwell-noTSX",
    "model_Haswell",
    "model_Haswell-noTSX",
    "model_IvyBridge",
    "model_SandyBridge",
    "model_Westmere",
    "model_Nehalem",
    "model_Penryn",
    "model_Conroe"
];

export const intelCpuTypes = [
    { key: "model_Broadwell", title: "Intel Broadwell Family" },
    { key: "model_Broadwell-noTSX", title: "Intel Broadwell-noTSX Family" },
    { key: "model_Haswell", title: "Intel Haswell Family" },
    { key: "model_Haswell-noTSX", title: "Intel Haswell-noTSX Family" },
    { key: "model_SandyBridge", title: "Intel SandyBridge Family" },
    { key: "model_Westmere", title: "Intel Westmere Family" },
    { key: "model_Nehalem", title: "Intel Nehalem Family" },
    { key: "model_Penryn", title: "Intel Penryn Family" },
    { key: "model_Conroe", title: "Intel Conroe Family" }
];

export const amdCpuTypes = [
    { key: "model_Opteron_G5", title: "AMD Opteron G5" },
    { key: "model_Opteron_G4", title: "AMD Opteron G4" },
    { key: "model_Opteron_G3", title: "AMD Opteron G3" },
    { key: "model_Opteron_G2", title: "AMD Opteron G2" },
    { key: "model_Opteron_G1", title: "AMD Opteron G1" }
];

export const defaultInterfaces = [
    { key: "None Found", title: "None Found" }
];
