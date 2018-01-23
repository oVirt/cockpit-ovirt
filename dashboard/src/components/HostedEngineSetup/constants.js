export const configValues = {
    ANSWER_FILE_PATH: "/tmp/he-setup-answerfile.conf",
    ANSIBLE_PLAYBOOK_PATH: "/usr/share/cockpit/ovirt-dashboard/hostedEngineAnsibleFiles/heSetup.yml",
    APPLIANCE_PATH_PREFIX: "/usr/share/ovirt-engine-appliance/"
};

export const ansiblePhases = {
    INITIAL_CLEAN: "INITIAL_CLEAN",
    BOOTSTRAP_VM: "BOOTSTRAP_VM",
    CREATE_STORAGE: "CREATE_STORAGE",
    TARGET_VM: "TARGET_VM",
    FINAL_CLEAN: "FINAL_CLEAN",
    ISCSI_DISCOVER: "ISCSI_DISCOVER",
    ISCSI_GET_DEVICES: "ISCSI_GET_DEVICES"
};

export const ansibleVarFilePaths = {
    BOOTSTRAP_VM: "/tmp/ansibleBootstrapVm.var",
    CREATE_STORAGE: "/tmp/ansibleCreateStorage.var",
    TARGET_VM: "/tmp/ansibleTargetVm.var",
    ISCSI_DISCOVER: "/tmp/ansibleIscsiDiscover.var",
    ISCSI_GET_DEVICES: "/tmp/ansibleIscsIGetDevices.var"
};

export const playbookPaths = {
    INITIAL_CLEAN: "/usr/share/ovirt-hosted-engine-setup/ansible/initial_clean.yml",
    BOOTSTRAP_VM: "/usr/share/ovirt-hosted-engine-setup/ansible/bootstrap_local_vm.yml",
    CREATE_STORAGE: "/usr/share/ovirt-hosted-engine-setup/ansible/create_storage_domain.yml",
    TARGET_VM: "/usr/share/ovirt-hosted-engine-setup/ansible/create_target_vm.yml",
    FINAL_CLEAN: "/usr/share/ovirt-hosted-engine-setup/ansible/final_clean.yml",
    ISCSI_DISCOVER: "/usr/share/ovirt-hosted-engine-setup/ansible/iscsi_discover.yml",
    ISCSI_GET_DEVICES: "/usr/share/ovirt-hosted-engine-setup/ansible/iscsi_getdevices.yml"
};

export const playbookOutputPaths = {
    INITIAL_CLEAN: "/tmp/initial_clean_out.json",
    BOOTSTRAP_VM: "/tmp/bootstrap_local_vm_out.json",
    CREATE_STORAGE: "/tmp/create_storage_domain_out.json",
    TARGET_VM: "/tmp/create_target_vm_out.json",
    FINAL_CLEAN: "/tmp/final_clean_out.json",
    ISCSI_DISCOVER: "/tmp/iscsi_discover_out.json",
    ISCSI_GET_DEVICES: "/tmp/iscsi_getdevices_out.json"
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

export const wizardSections = {
    VM: "VM",
    ENGINE: "Engine",
    STORAGE: "Storage",
    NETWORK: "Network"
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
    VM_MEM_MIN_MB: 2048,
    VM_MEM_MIN_RECOMMENDED_MB: 4096
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
    INSUFFICIENT_MEM_AVAIL: `There is insufficient memory available to support engine VM creation at this time! The minimum requirement is ${resourceConstants.VM_MEM_MIN_MB.toLocaleString()}MB.`,
    RECOMMENDED_MIN_MEM_AVAIL_WARNING: `The minimum recommended amount of memory is ${resourceConstants.VM_MEM_MIN_RECOMMENDED_MB.toLocaleString()}MB.`,
    DEPLOYMENT_SUCCESSFUL: "Hosted Engine has been successfully deployed!",
    DEPLOYMENT_FAILED: "Deployment Failed",
    DEPLOYMENT_IN_PROGRESS: "Deployment in Progress",
    ADD_GDEPLOY_PROPS_TO_ANS_FILE: "Attempting to add gdeploy properties to the answer file.",
    NO_GDEPLOY_ANSWER_FILES_FOUND: "No gdeploy answer files found.",
    ANSIBLE_PHASE_SUCCESSFUL: "Execution completed successfully. Please proceed to the next step.",
    TARGET_RETRIEVAL_FAILED: "Retrieval of iSCSI targets failed.",
    LUN_RETRIEVAL_FAILED: "Retrieval of iSCSI LUNs failed."
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

export const deploymentTypes = {
    ANSIBLE_DEPLOYMENT: "Ansible Deployment",
    OTOPI_DEPLOYMENT: "OTOPI Deployment"
};

export const filteredNetworkInterfaces = ["lo"];

export const ansibleOutputTypes = {
    INFO: "OVEHOSTED_AC/info",
    DEBUG: "OVEHOSTED_AC/debug",
    WARNING: "OVEHOSTED_AC/warning",
    ERROR: "OVEHOSTED_AC/error",
    RESULT: "OVEHOSTED_AC/result"
};
