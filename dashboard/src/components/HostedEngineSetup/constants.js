import React from 'react'

export const configValues = {
    ANSWER_FILE_PATH_PREFIX: "/var/lib/ovirt-hosted-engine-setup/cockpit/",
    ANSWER_FILE_PATH: "/tmp/he-setup-answerfile.conf",
    ANSIBLE_CALLBACK_WHITELIST: "1_otopi_json,2_ovirt_logger",
    HE_ANSIBLE_PLAYBOOK_DIR: "/usr/share/cockpit/ovirt-dashboard/hostedEngineAnsibleFiles/",
    APPLIANCE_PATH_PREFIX: "/usr/share/ovirt-engine-appliance/",
    ANSIBLE_VAR_FILE_PATH_PREFIX: "/var/lib/ovirt-hosted-engine-setup/cockpit/",
    ANSIBLE_OUTPUT_DIR: "/var/tmp/ovirt-hosted-engine-setup/cockpit/",
    ANSIBLE_LOG_DIR: "/var/log/ovirt-hosted-engine-setup/",
    NETWORK_TEST_TIMEOUT: 2
};

export const ansiblePhases = {
    INITIAL_CLEAN: "INITIAL_CLEAN",
    BOOTSTRAP_VM: "BOOTSTRAP_VM",
    CREATE_STORAGE: "CREATE_STORAGE",
    TARGET_VM: "TARGET_VM",
    FINAL_CLEAN: "FINAL_CLEAN",
    ISCSI_DISCOVER: "ISCSI_DISCOVER",
    ISCSI_GET_DEVICES: "ISCSI_GET_DEVICES",
    FC_GET_DEVICES: "FC_GET_DEVICES",
    GET_NETWORK_INTERFACES: "GET_NETWORK_INTERFACES",
    VALIDATE_HOSTNAMES: "VALIDATE_HOSTNAMES",
    VALIDATE_HOST_FQDN: "VALIDATE_HOST_FQDN"
};

export const ansibleRoleTags = {
    INITIAL_CLEAN: "initial_clean",
    BOOTSTRAP_VM: "bootstrap_local_vm",
    CREATE_STORAGE: "create_storage_domain",
    TARGET_VM: "create_target_vm",
    FINAL_CLEAN: "final_clean",
    ISCSI_DISCOVER: "iscsi_discover",
    ISCSI_GET_DEVICES: "iscsi_getdevices",
    GET_NETWORK_INTERFACES: "get_network_interfaces",
    FC_GET_DEVICES: "fc_getdevices",
    VALIDATE_HOSTNAMES: "validate_hostnames",
    SKIP_FULL_EXECUTION: "always",
};

export const playbookPaths = {
    HE_ROLE: "/usr/share/ovirt-hosted-engine-setup/he_ansible/trigger_role.yml",
    HE_SETUP_WIZARD_INIT: "/usr/share/cockpit/ovirt-dashboard/hostedEngineAnsibleFiles/heSetup.yml"
};

export const playbookOutputPaths = {
    INITIAL_CLEAN: "/tmp/initial_clean_out.json",
    BOOTSTRAP_VM: "/tmp/bootstrap_local_vm_out.json",
    CREATE_STORAGE: "/tmp/create_storage_domain_out.json",
    TARGET_VM: "/tmp/create_target_vm_out.json",
    FINAL_CLEAN: "/tmp/final_clean_out.json",
    ISCSI_DISCOVER: "/tmp/iscsi_discover_out.json",
    ISCSI_GET_DEVICES: "/tmp/iscsi_getdevices_out.json",
    GET_NETWORK_INTERFACES: "/tmp/get_network_interfaces.json",
    FC_GET_DEVICES: "/tmp/fc_getdevices_out.json",
    VALIDATE_HOSTNAMES: "/tmp/validate_hostnames.json"
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
    HOSTED_ENGINE: "he",
    GLUSTER_CONFIG_CHOICE_REQD: "glusterConfigChoiceReqd",
    CLOSE_RQST_RECEIVED: "closeRequestReceived"
};

export const status = {
    EMPTY: "empty",
    POLLING: "polling",
    SUCCESS: "success",
    FAILURE: "failure"
};

export const deploymentOption = {
    REGULAR: "regular",
    HYPERCONVERGED: "hci",
    USE_EXISTING_GLUSTER_CONFIG: "useExistingConfig"
};

export const resourceConstants = {
    VDSM_HOST_OVERHEAD_MB: 512,
    VDSM_VM_OVERHEAD_MB: 64,
    VM_MEM_MIN_MB: 4096,
    VM_MEM_MIN_RECOMMENDED_MB: 16384,
    VM_DISK_MIN_GB: 58,
    VM_DISK_MAX_GB: 4096,
    // 6GB (SD overhead) + 3GB (configuration, metadata, & lockspace vol) + 1GB (x2) (OVFSTORE vol)= 11GB -> 10.24GiB
    // 10.24GiB + 5GiB (critical space action blocker) = 15.24 GiB
    LUN_STORAGE_OVERHEAD_GIB: 15.24
};

export const defaultValueProviderTasks = {
    GET_SYSTEM_DATA: "getSystemData",
    RETRIEVE_NETWORK_INTERFACES: "retrieveNetworkInterfaces",
    VALIDATE_FQDN: "validateHostname"
};

export const messages = {
    GENERAL_ERROR_MSG: "Please correct errors before moving to the next step.",
    PASSWORD_MISMATCH: "Passwords do not match",
    IP_NOT_PINGABLE: "Unable to ping address. Please enter a pingable address.",
    DNS_RESOLVE_FAILED: "Unable to resolve via DNS.",
    TCP_CONNECT_FAILED: "Unable to connect via TCP",
    // Displayed when detected CPU model isn't recognized
    DETECTED_CPU_NOT_FOUND: "Unable to determine CPU level. Please select the CPU model the host CPU can properly emulate.",
    // Displayed when detected CPU model is known, but not supported by ovirt-hosted-engine-setup
    DETECTED_CPU_NOT_SUPPORTED_BY_SETUP: "The CPU level has been set at the highest level supported for the detected CPU.",
    VIRT_NOT_SUPPORTED: "Hardware virtualization is not supported on this host!",
    SYS_DATA_UNRETRIEVABLE: "System data could not be retrieved!",
    LIBVIRT_NOT_RUNNING: "libvirt is not running! Please ensure it is running before starting the wizard, so system capabilities can be queried.",
    INSUFFICIENT_MEM_AVAIL: `There is insufficient memory available to support engine VM creation at this time! The minimum requirement is ${resourceConstants.VM_MEM_MIN_MB.toLocaleString()}MB.`,
    RECOMMENDED_MIN_MEM_AVAIL_WARNING: `The minimum recommended amount of memory is ${resourceConstants.VM_MEM_MIN_RECOMMENDED_MB.toLocaleString()}MB.`,
    DEPLOYMENT_SUCCESSFUL: "Hosted Engine has been successfully deployed!",
    DEPLOYMENT_FAILED: "Deployment Failed",
    DEPLOYMENT_IN_PROGRESS: "Deployment in Progress",
    GLUSTER_CONFIGURATION_FOUND: "An existing gluster configuration has been found.",
    ADD_GDEPLOY_PROPS_TO_ANS_FILE: "Attempting to add gdeploy properties to the answer file.",
    NO_GDEPLOY_ANSWER_FILES_FOUND: "No gdeploy answer files found.",
    ANSIBLE_PHASE_SUCCESSFUL: "Execution completed successfully. Please proceed to the next step.",
    ANSIBLE_LAST_PHASE_SUCCESSFUL: "Hosted engine deployment complete!",
    TARGET_RETRIEVAL_FAILED: "Retrieval of iSCSI targets failed.",
    LUN_RETRIEVAL_FAILED: "Retrieval of iSCSI LUNs failed.",
    FC_LUN_DISCOVERY_FAILED: "Retrieval of fibre channel LUNs failed.",
    NO_LUNS_FOUND: "No LUNS found",
    LUN_IS_TOO_SMALL: "This LUN cannot be selected because it does not have sufficient storage capacity to support the hosted engine VM.",
    LUN_IS_DIRTY: "This LUN cannot be selected because it appears to be already in use. Please clean it and try again.",
    TARGET_RETRIEVAL_REQUIRED: "A LUN must be selected before proceeding to the next step. Please ensure a valid portal IP address and port have been entered and click the \"Retrieve Target List\" button above to see a list of available targets.",
    TARGET_SELECTION_REQUIRED: "A LUN must be selected before proceeding to the next step. Please select a target below to see a list of available LUNs.",
    LUN_SELECTION_REQUIRED: "A LUN must be selected before proceeding to the next step. Please select a LUN below.",
    NUMERIC_VALUES_ONLY: "Only numeric values allowed",
    GLUSTER_REPLICA: "Please note that only replica 1 and replica 3 volumes are supported.",
    UNABLE_TO_VALIDATE_FQDN: "Unable to validate FQDN.",
    LOCALHOST_INVALID_FQDN: `localhost/localhost.localdomain cannot be used as the FQDN`,
    FQDN_VALIDATION_IN_PROGRESS: "FQDN validation is in progress. Please wait for validation to complete and try again.",
    VM_FQDN_VALIDATION_FAILED: "The VM FQDN could not be resolved. Please ensure that the FQDN is resolvable before attempting preparation of the VM.",
    HOST_FQDN_VALIDATION_FAILED: "Validation for this host's FQDN failed."
};

export const headers = {
    PREPARE_VM_STEP: "Please review the configuration. Once you click the 'Prepare VM' button, a local virtual machine will be started and used to prepare the management services and their data. This operation may take some time depending on your hardware.",
    STORAGE_STEP: "Please configure the storage domain that will be used to host the disk for the management VM. Please note that the management VM needs to be responsive and reliable enough to be able to manage all resources of your deployment, so highly available storage is preferred.",
    FINISH_STEP: "Please review the configuration. Once you click the 'Finish Deployment' button, the management VM will be transferred to the configured storage and the configuration of your hosted engine cluster will be finalized. You will be able to use your hosted engine once this step finishes."
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

export const fqdnValidationTypes = {
    HOST: "host",
    VM: "vm"
};

export const InvalidNetworkInterfacesMsg = () => {
    return (
        <div>
            <strong> No valid network interface has been found </strong>
            <br />
            <strong> If you are using Bonds or VLANs Use the following naming conventions: </strong>
            <br />
            - VLAN interfaces: physical_device.VLAN_ID (for example, eth0.23, eth1.128, enp3s0.50)
            <br />
            - Bond interfaces: bond*number* (for example, bond0, bond1)
            <br />
            - VLANs on bond interfaces: bond*number*.VLAN_ID (for example, bond0.50, bond1.128)
            <br />
            * Supported bond modes: active-backup, balance-xor, broadcast, 802.3ad
            <br />
            * Networking teaming is not supported and will cause errors
        </div>
    )
}
