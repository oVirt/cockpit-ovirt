import {
    ansiblePhases as phases, configValues, configFileTypes as types, answerFilePrefixes, resourceConstants,
    resourceConstants as constants
} from "../components/HostedEngineSetup/constants"
import classNames from 'classnames'
import Validation from '../components/HostedEngineSetup/Validation'

export class HeSetupModel {
    constructor() {
        this.model = this.getBaseHeSetupModel();
        this.assignVmUUID();

        this.getBaseHeSetupModel = this.getBaseHeSetupModel.bind(this);
        this.addGlusterValues = this.addGlusterValues.bind(this);
        this.addValuesToModel = this.addValuesToModel.bind(this);
        this.setDefaultValues = this.setDefaultValues.bind(this);
        this.setBooleanValues = this.setBooleanValues.bind(this);
        this.setBooleanValue = this.setBooleanValue.bind(this);
        this.getAnsFileProperty = this.getAnsFileProperty.bind(this);
        this.assignVmUUID = this.assignVmUUID.bind(this);
    }

    getBaseHeSetupModel() {
        return {
            core: {
                rollbackProceed: {
                    name: "rollbackProceed",
                    description: "Rollback Proceed",
                    value: "None",
                    type: types.NONE,
                    showInReview: false,
                    uiStage: "",
                    useInAnswerFile: true,
                    required: false
                },
                screenProceed: {
                    name: "screenProceed",
                    description: "Screen Proceed",
                    value: "None",
                    type: types.NONE,
                    showInReview: false,
                    uiStage: "",
                    useInAnswerFile: true,
                    required: false
                },
                deployProceed: {
                    name: "deployProceed",
                    description: "Deploy Proceed",
                    value: true,
                    type: types.BOOLEAN,
                    showInReview: false,
                    uiStage: "",
                    useInAnswerFile: true,
                    required: false
                },
                upgradeProceed: {
                    name: "upgradeProceed",
                    description: "Rollback Proceed",
                    value: "None",
                    type: types.NONE,
                    showInReview: false,
                    uiStage: "",
                    useInAnswerFile: true,
                    required: false
                },
                confirmSettings: {
                    name: "confirmSettings",
                    description: "Confirm Settings",
                    value: true,
                    type: types.BOOLEAN,
                    showInReview: false,
                    uiStage: "",
                    useInAnswerFile: true,
                    required: false
                },
                localVmDirPath: {
                    name: "LOCAL_VM_DIR_PATH",
                    ansibleVarName: "LOCAL_VM_DIR_PATH",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM],
                    description: "LOCAL_VM_DIR_PATH",
                    value: "/var/tmp",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "",
                    useInAnswerFile: false,
                    required: false
                },
                localVmDirPrefix: {
                    name: "LOCAL_VM_DIR_PREFIX",
                    ansibleVarName: "LOCAL_VM_DIR_PREFIX",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM],
                    description: "LOCAL_VM_DIR_PREFIX",
                    value: "localvm",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "",
                    useInAnswerFile: false,
                    required: false
                },
                localVmDir: {
                    name: "LOCAL_VM_DIR",
                    ansibleVarName: "LOCAL_VM_DIR",
                    ansiblePhasesUsed: [phases.CREATE_STORAGE, phases.TARGET_VM, phases.FINAL_CLEAN],
                    description: "LOCAL_VM_DIR",
                    value: "localvm",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "",
                    useInAnswerFile: false,
                    required: false
                },
                discard: {
                    name: "discard",
                    ansibleVarName: "DISCARD",
                    ansiblePhasesUsed: [phases.CREATE_STORAGE],
                    description: "Discard",
                    value: false,
                    type: types.BOOLEAN,
                    showInReview: false,
                    uiStage: "",
                    useInAnswerFile: false,
                    required: false
                }
            },
            storage: {
                domainType: {
                    name: "domainType",
                    ansibleVarName: "DOMAIN_TYPE",
                    ansiblePhasesUsed: [phases.CREATE_STORAGE, phases.TARGET_VM],
                    description: "Storage Type",
                    value: "nfs",
                    type: types.STRING,
                    showInReview: true,
                    reviewOrder: 0,
                    uiStage: "Storage",
                    useInAnswerFile: true,
                    required: false
                },
                nfsVersion: {
                    name: "nfsVersion",
                    ansibleVarName: "NFS_VERSION",
                    ansiblePhasesUsed: [phases.CREATE_STORAGE, phases.TARGET_VM],
                    description: "NFS Version",
                    value: "auto",
                    type: types.STRING,
                    showInReview: true,
                    reviewOrder: 5,
                    uiStage: "Storage",
                    useInAnswerFile: false,
                    required: false
                },
                imgSizeGB: {
                    name: "imgSizeGB",
                    ansibleVarName: "DISK_SIZE",
                    ansiblePhasesUsed: [phases.TARGET_VM],
                    description: "Disk Size (GiB)",
                    value: resourceConstants.VM_DISK_MIN_GB,
                    type: types.STRING,
                    showInReview: true,
                    reviewOrder: 100,
                    uiStage: "Storage",
                    useInAnswerFile: true,
                    required: true,
                    range: {min: resourceConstants.VM_DISK_MIN_GB, max: resourceConstants.VM_DISK_MAX_GB}
                },
                storagePath: {
                    name: "storagePath",
                    ansibleVarName: "STORAGE_DOMAIN_PATH",
                    ansiblePhasesUsed: [phases.CREATE_STORAGE, phases.TARGET_VM],
                    description: "Storage Path",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "Storage",
                    useInAnswerFile: false,
                    required: false
                },
                storageDomain: {
                    name: "storageDomain",
                    ansibleVarName: "STORAGE_DOMAIN_NAME",
                    ansiblePhasesUsed: [phases.CREATE_STORAGE, phases.TARGET_VM],
                    description: "Storage Domain Name",
                    value: "hosted_storage",
                    type: types.STRING,
                    showInReview: true,
                    reviewOrder: 110,
                    uiStage: "Storage",
                    useInAnswerFile: true,
                    required: true
                },
                storageAddress: {
                    name: "storageAddress",
                    ansibleVarName: "STORAGE_DOMAIN_ADDR",
                    ansiblePhasesUsed: [phases.CREATE_STORAGE, phases.TARGET_VM],
                    description: "Storage Address",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "Storage",
                    useInAnswerFile: false,
                    required: false
                },
                storageDomainConnection: {
                    name: "storageDomainConnection",
                    description: "Storage Domain Connection",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    reviewOrder: 10,
                    uiStage: "Storage",
                    useInAnswerFile: false,
                    required: true
                },
                mntOptions: {
                    name: "mntOptions",
                    ansibleVarName: "MOUNT_OPTIONS",
                    ansiblePhasesUsed: [phases.CREATE_STORAGE, phases.TARGET_VM],
                    description: "Mount Options",
                    value: "",
                    type: types.STRING,
                    showInReview: true,
                    reviewOrder: 20,
                    uiStage: "Storage",
                    useInAnswerFile: true,
                    required: false
                },
                iSCSIPortalUser: {
                    name: "iSCSIPortalUser",
                    ansibleVarName: "ISCSI_USERNAME",
                    ansiblePhasesUsed: [phases.CREATE_STORAGE, phases.TARGET_VM, phases.ISCSI_GET_DEVICES],
                    description: "Portal User",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "Storage",
                    useInAnswerFile: false,
                    required: false
                },
                iSCSIPortalPassword: {
                    name: "iSCSIPortalPassword",
                    ansibleVarName: "ISCSI_PASSWORD",
                    ansiblePhasesUsed: [phases.CREATE_STORAGE, phases.TARGET_VM, phases.ISCSI_GET_DEVICES],
                    description: "Portal Password",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "Storage",
                    useInAnswerFile: false,
                    required: false
                },
                iSCSIDiscoverUser: {
                    name: "iSCSIDiscoverUser",
                    ansibleVarName: "ISCSI_DISCOVER_USERNAME",
                    ansiblePhasesUsed: [phases.CREATE_STORAGE, phases.TARGET_VM, phases.ISCSI_DISCOVER],
                    description: "Discovery User",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "Storage",
                    useInAnswerFile: false,
                    required: false
                },
                iSCSIDiscoverPassword: {
                    name: "iSCSIDiscoverPassword",
                    ansibleVarName: "ISCSI_DISCOVER_PASSWORD",
                    ansiblePhasesUsed: [phases.CREATE_STORAGE, phases.TARGET_VM, phases.ISCSI_DISCOVER],
                    description: "Discovery Password",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "Storage",
                    useInAnswerFile: false,
                    required: false
                },
                iSCSIPortalIPAddress: {
                    name: "iSCSIPortalIPAddress",
                    ansibleVarName: "ISCSI_PORTAL_ADDR",
                    ansiblePhasesUsed: [phases.TARGET_VM, phases.ISCSI_DISCOVER, phases.ISCSI_GET_DEVICES],
                    description: "Portal IP Address",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "Storage",
                    useInAnswerFile: false,
                    required: false,
                    regex: Validation.ipAddress,
                    errorMsg: "Invalid format for IP address"
                },
                iSCSITPGT: {
                    name: "iSCSITPGT",
                    ansibleVarName: "ISCSI_TPGT",
                    ansiblePhasesUsed: [phases.TARGET_VM],
                    description: "iSCSI Target Portal Group Tag",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "Storage",
                    useInAnswerFile: false,
                    required: false
                },
                iSCSIDiscoveryPortalPort: {
                    name: "iSCSIDiscoveryPortalPort",
                    description: "Portal Port",
                    value: "3260",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "Storage",
                    useInAnswerFile: false,
                    required: false,
                    range: {min: 0, max: 65536},
                    errorMsg: "Port numbers must be between 0 and 65,536"
                },
                iSCSIPortalPort: {
                    name: "iSCSIPortalPort",
                    ansibleVarName: "ISCSI_PORTAL_PORT",
                    ansiblePhasesUsed: [
                        phases.CREATE_STORAGE,
                        phases.TARGET_VM,
                        phases.ISCSI_DISCOVER,
                        phases.ISCSI_GET_DEVICES
                    ],
                    description: "Portal Port",
                    value: [],
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "Storage",
                    useInAnswerFile: false,
                    required: false
                },
                iSCSITargetName: {
                    name: "iSCSITargetName",
                    ansibleVarName: "ISCSI_TARGET",
                    ansiblePhasesUsed: [phases.CREATE_STORAGE, phases.TARGET_VM, phases.ISCSI_GET_DEVICES],
                    description: "Target Name",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "Storage",
                    useInAnswerFile: false,
                    required: false
                },
                LunID: {
                    name: "LunID",
                    ansibleVarName: "LUN_ID",
                    ansiblePhasesUsed: [phases.CREATE_STORAGE, phases.TARGET_VM],
                    description: "Destination LUN",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "Storage",
                    useInAnswerFile: false,
                    required: false
                }
            },
            network: {
                bridgeIf: {
                    name: "bridgeIf",
                    ansibleVarName: "BRIDGE_IF",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM],
                    description: "Bridge Interface",
                    value: "",
                    type: types.STRING,
                    showInReview: true,
                    reviewOrder: 60,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: false
                },
                bridgeName: {
                    name: "bridgeName",
                    ansibleVarName: "BRIDGE",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM, phases.TARGET_VM],
                    description: "Bridge Name",
                    value: "ovirtmgmt",
                    type: types.STRING,
                    showInReview: true,
                    reviewOrder: 130,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: true
                },
                firewallManager: {
                    name: "firewallManager",
                    description: "Configure iptables",
                    value: "iptables",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "Network",
                    useInAnswerFile: true,
                    required: false
                },
                gateway: {
                    name: "gateway",
                    ansibleVarName: "GATEWAY",
                    ansiblePhasesUsed: [phases.TARGET_VM],
                    description: "Gateway Address",
                    value: "",
                    type: types.STRING,
                    showInReview: true,
                    reviewOrder: 40,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: false,
                    regex: Validation.ipAddress,
                    errorMsg: "Invalid format for IP address"
                },
                fqdn: {
                    name: "fqdn",
                    ansibleVarName: "FQDN",
                    ansiblePhasesUsed: [
                        phases.INITIAL_CLEAN,
                        phases.BOOTSTRAP_VM,
                        phases.CREATE_STORAGE,
                        phases.TARGET_VM,
                        phases.ISCSI_DISCOVER,
                        phases.ISCSI_GET_DEVICES,
                        phases.FC_GET_DEVICES
                    ],
                    description: "Engine FQDN",
                    value: "",
                    type: types.STRING,
                    showInReview: true,
                    reviewOrder: 0,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: true
                },
                host_name: {
                    name: "host_name",
                    ansibleVarName: "HOST_ADDRESS",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM, phases.TARGET_VM],
                    description: "Host FQDN",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    reviewOrder: 140,
                    uiStage: "VM",
                    useInAnswerFile: false,
                    required: false
                }
            },
            vm: {
                bootDevice: {
                    name: "bootDevice",
                    description: "Boot Device",
                    value: "disk",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: false
                },
                vmVCpus: {
                    name: "vmVCpus",
                    ansibleVarName: "VCPUS",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM, phases.TARGET_VM],
                    description: "Number of Virtual CPUs",
                    value: "1",
                    type: types.STRING,
                    showInReview: true,
                    reviewOrder: 90,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: true,
                    range: {min: 1, max: 1}
                },
                maxVCpus: {
                    name: "maxVCpus",
                    ansibleVarName: "MAXVCPUS",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM, phases.TARGET_VM],
                    description: "Maximum Number of Virtual CPUs",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: false,
                    required: false
                },
                cpuSockets: {
                    name: "cpuSockets",
                    ansibleVarName: "CPU_SOCKETS",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM, phases.TARGET_VM],
                    description: "Number of CPU Sockets",
                    value: "1",
                    type: types.INTEGER,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: false,
                    required: false
                },
                emulatedMachine: {
                    name: "emulatedMachine",
                    ansibleVarName: "EMULATED_MACHINE",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM, phases.TARGET_VM],
                    description: "Emulated Machine",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: false,
                    required: false
                },
                localVmUUID: {
                    name: "localVmUUID",
                    ansibleVarName: "VM_UUID",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM],
                    description: "Local VM UUID",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: false,
                    required: false
                },
                vmMACAddr: {
                    name: "vmMACAddr",
                    ansibleVarName: "VM_MAC_ADDR",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM, phases.TARGET_VM],
                    description: "MAC Address",
                    value: "00:16:3E:6A:7A:F9",
                    type: types.STRING,
                    showInReview: true,
                    reviewOrder: 10,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: false,
                    regex: Validation.macAddress,
                    errorMsg: "Invalid format for MAC address"
                },
                vmIpPrefix: {
                    name: "vmIpPrefix",
                    ansibleVarName: "VM_IP_PREFIX",
                    ansiblePhasesUsed: [phases.TARGET_VM],
                    description: "VM IP Prefix",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: false,
                    required: false
                },
                vmMemSizeMB: {
                    name: "vmMemSizeMB",
                    ansibleVarName: "MEM_SIZE",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM, phases.TARGET_VM],
                    description: "Memory Size (MiB)",
                    value: resourceConstants.VM_MEM_MIN_RECOMMENDED_MB,
                    unit: "MB",
                    type: types.INTEGER,
                    showInReview: true,
                    reviewOrder: 100,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: true,
                    range: {min: resourceConstants.VM_MEM_MIN_MB, max: resourceConstants.VM_MEM_MIN_RECOMMENDED_MB}
                },
                networkConfigType: {
                    name: "networkConfigType",
                    description: "Network Configuration",
                    value: "dhcp",
                    type: types.STRING,
                    showInReview: true,
                    reviewOrder: 20,
                    uiStage: "VM",
                    useInAnswerFile: false,
                    required: false
                },
                cloudinitVMStaticCIDR: {
                    name: "cloudinitVMStaticCIDR",
                    ansibleVarName: "VM_IP_ADDR",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM, phases.TARGET_VM],
                    description: "VM IP Address",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    reviewOrder: 30,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: false,
                    regex: Validation.ipAddress,
                    errorMsg: "Invalid format for IP address"
                },
                cloudinitVMStaticCIDRPrefix: {
                    name: "cloudinitVMStaticCIDRPrefix",
                    ansibleVarName: "VM_IP_PREFIX",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM, phases.TARGET_VM],
                    description: "IP Address Prefix",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: false,
                    required: false
                },
                cloudinitVMDNS: {
                    name: "cloudinitVMDNS",
                    ansibleVarName: "DNS_ADDR",
                    ansiblePhasesUsed: [phases.TARGET_VM],
                    description: "DNS Servers",
                    value: [""],
                    type: types.STRING,
                    showInReview: false,
                    reviewOrder: 50,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: false
                },
                cloudInitCustomize: {
                    name: "cloudInitCustomize",
                    description: "Use Cloud-Init",
                    value: true,
                    type: types.BOOLEAN,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: false,
                    required: false
                },
                cloudinitVMTZ: {
                    name: "cloudinitVMTZ",
                    ansibleVarName: "TIME_ZONE",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM, phases.TARGET_VM],
                    description: "Host Time Zone",
                    value: "America/New_York",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: false
                },
                cloudInitISO: {
                    name: "cloudInitISO",
                    description: "Cloud-Init Image",
                    value: "generate",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: false
                },
                ovfArchive: {
                    name: "ovfArchive",
                    ansibleVarName: "APPLIANCE_OVA",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM, phases.TARGET_VM],
                    description: "Appliance File Path",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: false,
                    required: false
                },
                cloudinitInstanceHostName: {
                    name: "cloudinitInstanceHostName",
                    ansibleVarName: "CLOUD_INIT_HOST_NAME",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM, phases.TARGET_VM],
                    description: "Engine VM Host Name",
                    value: "ovirt-engine",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: false
                },
                cloudinitInstanceDomainName: {
                    name: "cloudinitInstanceDomainName",
                    ansibleVarName: "CLOUD_INIT_DOMAIN_NAME",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM, phases.TARGET_VM],
                    description: "Engine VM Domain",
                    value: "localdomain",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: false
                },
                cloudinitExecuteEngineSetup: {
                    name: "cloudinitExecuteEngineSetup",
                    description: "Engine Setup",
                    value: true,
                    type: types.BOOLEAN,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: false
                },
                automateVMShutdown: {
                    name: "automateVMShutdown",
                    description: "Engine Restart",
                    value: true,
                    type: types.BOOLEAN,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: false
                },
                cloudinitRootPwd: {
                    name: "cloudinitRootPwd",
                    ansibleVarName: "APPLIANCE_PASSWORD",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM, phases.TARGET_VM],
                    description: "Root password",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    reviewOrder: 70,
                    uiStage: "VM",
                    useInAnswerFile: false,
                    required: false
                },
                confirmRootPassword: {
                    name: "confirmRootPassword",
                    description: "Confirm Root password",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: false,
                    required: false
                },
                rootSshPubkey: {
                    name: "rootSshPubkey",
                    ansibleVarName: "ROOT_SSH_PUBKEY",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM, phases.TARGET_VM],
                    description: "Root User SSH Public Key",
                    value: "",
                    type: types.STRING,
                    showInReview: true,
                    reviewOrder: 110,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: false
                },
                rootSshAccess: {
                    name: "rootSshAccess",
                    ansibleVarName: "ROOT_SSH_ACCESS",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM],
                    description: "Root User SSH Access",
                    value: "yes",
                    type: types.STRING,
                    showInReview: true,
                    reviewOrder: 80,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: false
                },
                cloudinitVMETCHOSTS: {
                    name: "cloudinitVMETCHOSTS",
                    ansibleVarName: "VM_ETC_HOSTS",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM, phases.TARGET_VM],
                    description: "Add Lines to /etc/hosts",
                    value: true,
                    type: types.BOOLEAN,
                    showInReview: true,
                    reviewOrder: 120,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: false
                },
                cloudinitHostIP: {
                    name: "cloudinitHostIP",
                    ansibleVarName: "HOST_IP",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM, phases.TARGET_VM],
                    description: "Host IP Address",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: false,
                    required: false
                },
                cdromUUID: {
                    name: "cdromUUID",
                    ansibleVarName: "CDROM_UUID",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM, phases.TARGET_VM],
                    description: "CDROM UUID",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: false,
                    required: false
                },
                cdrom: {
                    name: "cdrom",
                    ansibleVarName: "CDROM",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM, phases.TARGET_VM],
                    description: "CDROM",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: false,
                    required: false
                },
                nicUUID: {
                    name: "nicUUID",
                    ansibleVarName: "NIC_UUID",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM, phases.TARGET_VM],
                    description: "NIC UUID",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: false,
                    required: false
                },
                consoleUUID: {
                    name: "consoleUUID",
                    ansibleVarName: "CONSOLE_UUID",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM],
                    description: "Console UUID",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: false,
                    required: false
                },
                videoDevice: {
                    name: "videoDevice",
                    ansibleVarName: "VIDEO_DEVICE",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM, phases.TARGET_VM],
                    description: "Video Device",
                    value: "vga",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: false,
                    required: false
                },
                graphicsDevice: {
                    name: "graphicsDevice",
                    ansibleVarName: "GRAPHICS_DEVICE",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM, phases.TARGET_VM],
                    description: "Graphics Device",
                    value: "vnc",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: false,
                    required: false
                },
                vmName: {
                    name: "vmName",
                    ansibleVarName: "VM_NAME",
                    ansiblePhasesUsed: [phases.INITIAL_CLEAN, phases.BOOTSTRAP_VM, phases.TARGET_VM],
                    description: "VM Name",
                    value: "HostedEngine",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: false,
                    required: false
                }
            },
            engine: {
                hostIdentifier: {
                    name: "hostIdentifier",
                    description: "Host Identifier",
                    value: "hosted_engine_1",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "Engine",
                    useInAnswerFile: true,
                    required: true
                },
                adminUsername: {
                    name: "adminUsername",
                    description: "Admin Username",
                    value: "admin@internal",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "Engine",
                    useInAnswerFile: true,
                    required: true
                },
                adminPassword: {
                    name: "adminPassword",
                    ansibleVarName: "ADMIN_PASSWORD",
                    ansiblePhasesUsed: [
                        phases.BOOTSTRAP_VM,
                        phases.CREATE_STORAGE,
                        phases.TARGET_VM,
                        phases.ISCSI_DISCOVER,
                        phases.ISCSI_GET_DEVICES,
                        phases.FC_GET_DEVICES
                    ],
                    description: "Admin Portal Password",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    reviewOrder: 0,
                    uiStage: "Engine",
                    useInAnswerFile: false,
                    required: false
                },
                confirmAdminPortalPassword: {
                    name: "confirmAdminPortalPassword",
                    description: "Confirm Admin Portal Password",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "Engine",
                    useInAnswerFile: false,
                    required: false
                },
                enableLibgfapi: {
                    name: "enableLibgfapi",
                    ansibleVarName: "ENABLE_LIBGFAPI",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM],
                    description: "Enable libgfapi",
                    value: "",
                    type: types.BOOLEAN,
                    showInReview: false,
                    uiStage: "Engine",
                    useInAnswerFile: false,
                    required: false
                },
                appHostName: {
                    name: "appHostName",
                    ansibleVarName: "HOST_NAME",
                    ansiblePhasesUsed: [
                        phases.BOOTSTRAP_VM,
                        phases.CREATE_STORAGE,
                        phases.TARGET_VM,
                        phases.ISCSI_DISCOVER,
                        phases.ISCSI_GET_DEVICES,
                        phases.FC_GET_DEVICES
                    ],
                    description: "Host's name",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: false,
                    required: false
                }
            },
            vdsm: {
                consoleType: {
                    name: "consoleType",
                    ansibleVarName: "CONSOLE_TYPE",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM, phases.TARGET_VM],
                    description: "Console Type",
                    value: "vnc",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: false
                },
                cpu: {
                    name: "cpu",
                    ansibleVarName: "CPU_TYPE",
                    ansiblePhasesUsed: [phases.BOOTSTRAP_VM, phases.TARGET_VM],
                    description: "CPU Type",
                    value: "Conroe",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: false
                },
                spicePkiSubject: {
                    name: "spicePkiSubject",
                    description: "Spice PKI Subject",
                    value: "C=EN, L=Test, O=Test, CN=Test",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "",
                    useInAnswerFile: false,
                    required: false
                },
                pkiSubject: {
                    name: "pkiSubject",
                    description: "PKI Subject",
                    value: "/C=EN/L=Test/O=Test/CN=Test",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "",
                    useInAnswerFile: false,
                    required: false
                },
                caSubject: {
                    name: "caSubject",
                    description: "Certificate Authority Subject",
                    value: "/C=EN/L=Test/O=Test/CN=TestCA",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "",
                    useInAnswerFile: false,
                    required: false
                }
            },
            notifications: {
                smtpServer: {
                    name: "smtpServer",
                    ansibleVarName: "SMTP_SERVER",
                    ansiblePhasesUsed: [phases.TARGET_VM],
                    description: "SMTP Server Name",
                    value: "localhost",
                    type: types.STRING,
                    showInReview: true,
                    reviewOrder: 10,
                    uiStage: "Engine",
                    useInAnswerFile: true,
                    required: false
                },
                smtpPort: {
                    name: "smtpPort",
                    ansibleVarName: "SMTP_PORT",
                    ansiblePhasesUsed: [phases.TARGET_VM],
                    description: "SMTP Server Port Number",
                    value: "25",
                    type: types.STRING,
                    showInReview: true,
                    reviewOrder: 20,
                    uiStage: "Engine",
                    useInAnswerFile: true,
                    required: false,
                    range: {min: 0, max: 65536},
                    errorMsg: "Port numbers must be between 0 and 65,536"
                },
                sourceEmail: {
                    name: "sourceEmail",
                    ansibleVarName: "SOURCE_EMAIL",
                    ansiblePhasesUsed: [phases.TARGET_VM],
                    description: "Sender E-Mail Address",
                    value: "root@localhost",
                    type: types.STRING,
                    showInReview: true,
                    reviewOrder: 30,
                    uiStage: "Engine",
                    useInAnswerFile: true,
                    required: false
                },
                destEmail: {
                    name: "destEmail",
                    ansibleVarName: "DEST_EMAIL",
                    ansiblePhasesUsed: [phases.TARGET_VM],
                    description: "Recipient E-Mail Addresses",
                    value: ["root@localhost"],
                    type: types.STRING,
                    showInReview: true,
                    reviewOrder: 40,
                    uiStage: "Engine",
                    useInAnswerFile: true,
                    required: false
                }
            }
        }
    };

    addValuesToModel(answerFile, model) {
        const storageConfig = model.storage;
        let file = answerFile.replace("[environment:default]\n", "");
        let lines = file.split('\n');

        lines.map(function(line) {
            line = line.replace("OVEHOSTED_STORAGE/", "");
            let idx = -1;

            // Get the property name
            idx = line.indexOf("=");
            let propName = "";
            if (idx !== -1) {
                propName = line.substring(0, idx);
            }

            // Get the value
            idx = line.indexOf(":");
            let value = "";
            if (idx !== -1) {
                value = line.substring(++idx);
            }

            if (propName !== "") {
                storageConfig[propName].value = value;
                storageConfig[propName].useInAnswerFile = true;
            }
        });
    }

    addGlusterValues(gdeployHeAnsFilePath, model) {
        const self = this;

        cockpit.file(gdeployHeAnsFilePath).read()
            .done(function(gDeployAnswerFile) {
                self.addValuesToModel(gDeployAnswerFile, model);
                model.storage.domainType.value = "glusterfs";
                console.log("Gluster values successfully added.");
            })
            .fail(function(error) {
                console.log("Failed to read the gluster answer file. " + error);
            })
    }

    setDefaultValues(dataProvider) {
        this.model.vm.cloudinitVMTZ.value = dataProvider.getTimeZone();
        this.model.network.host_name.value = dataProvider.getFQDN();
        this.model.engine.appHostName.value = dataProvider.getFQDN();
        this.model.vm.cloudinitHostIP.value = dataProvider.getIpAddress();
        this.model.vm.maxVCpus.value = dataProvider.getMaxVCpus();
        if (dataProvider.getMaxMemAvailable() < constants.VM_MEM_MIN_RECOMMENDED_MB) {
            this.model.vm.vmMemSizeMB.value = dataProvider;
        }
    }

    setBooleanValues(ansFileFields, fieldProps, desiredValue) {
        let self = this;
        ansFileFields.forEach(function(ansFileField) {
            self.setBooleanValue(ansFileField, fieldProps, desiredValue);
        })
    }

    setBooleanValue(fieldName, propNames, desiredValue) {
        let ansFileField = this.getAnsFileProperty(fieldName);

        if (ansFileField !== null) {
            propNames.forEach(function(propName) {
                if (ansFileField.hasOwnProperty(propName)) {
                    ansFileField[propName] = desiredValue;
                }
            });
        }
    }

    getAnsFileProperty(propName) {
        let prop = null;
        let model = this.model;

        Object.getOwnPropertyNames(model).some(
            function(sectionName) {
                let section = model[sectionName];
                if(section.hasOwnProperty(propName)) {
                    prop = section[propName];
                    return true;
                }
            }
        );

        return prop;
    }

    assignVmUUID() {
        const uuidv4 = require('uuid/v4');
        this.model.vm.localVmUUID.value = uuidv4();
    }
}

export class AnswerFileGenerator {
    constructor(heSetupModel) {
        this.model = heSetupModel;
        this.additionalLines = "";

        this.checkValue = this.checkValue.bind(this);
    }

    appendLines(additionalLines) {
        this.additionalLines = additionalLines;
    }

    generateConfigFile() {
        let configString = "[environment:default]\n";
        let sectionNames = Object.getOwnPropertyNames(this.model);

        sectionNames.forEach(
            function(sectionName) {
                let section = this.model[sectionName];
                let propNames = Object.getOwnPropertyNames(section);

                propNames.forEach(
                    function(propName) {
                        const prop = section[propName];
                        const value = this.checkValue(prop);

                        if (prop.useInAnswerFile) {
                            configString += this.createLine(sectionName, propName, value, prop.type);
                        }
                    }, this)
            }, this);

        return configString;
    }

    checkValue(prop) {
        let retVal = prop.value;

        if (prop.name === "domainType" && prop.value === "nfs") {
            retVal = prop.value + this.model.storage.nfsVersion.value;
        }

        if (prop.type === types.STRING && prop.value === "") {
            retVal = "None";
        }

        return retVal;
    }

    createLine(sectionName, key, value, type) {
        let line = "";

        line += answerFilePrefixes[sectionName.toUpperCase()];
        line += key + "=";

        if (value === "None") {
            line += types.NONE + ":";
        } else {
            line += type + ":";
        }

        line += value + "\n";

        return line;
    }

    writeConfigToFile() {
        const filePath = configValues.ANSWER_FILE_PATH_PREFIX + "heAnswerFile" + generateRandomString() + ".conf";
        console.log(filePath);
        const file = cockpit.file(filePath);
        let configString = this.generateConfigFile();
        this.additionalLines = this.additionalLines.replace("[environment:default]\n", "");
        configString += this.additionalLines;


        return new Promise((resolve, reject) => {
            file.replace(configString)
                .done(function() {
                    console.log("Answer file successfully written to " + filePath);
                    resolve(filePath);
                })
                .fail(function(error) {
                    console.log("Problem writing answer file. Error: " + error);
                    reject(error);
                })
                .always(function() {
                    file.close()
                })
        })
    }
}

const wait_valid = (proxy, callback) => {
    proxy.wait(function() {
        if (proxy.valid) {
            callback();
        }
    });
};

export class TimeZone {
    constructor() {
        let client = cockpit.dbus('org.freedesktop.timedate1');
        this.proxy = client.proxy('org.freedesktop.timedate1',
            '/org/freedesktop/timedate1');
    }

    getTimeZone(callback) {
        let proxy = this.proxy;
        wait_valid(proxy, function() {
            callback(proxy.Timezone);
        })
    }
}

export function pingGateway(gatewayAddress) {
    return cockpit.spawn(["ping", "-c", "1", gatewayAddress])
        .fail(function(result) {
            console.log("Error: " + result);
        });
}

export function checkDns(fqdn) {
    return cockpit.spawn(["dig", fqdn, "+short"]);
}

export function checkReverseDns(ipAddress) {
    return cockpit.spawn(["dig", "-x", ipAddress, "+short"]);
}

export function getClassNames(propertyName, errorMsgs) {
    let classes = "";

    if (errorMsgs[propertyName]) {
        classes = classNames("form-group", { "has-error": errorMsgs[propertyName] });
    } else {
        classes = classNames("form-group");
    }

    return classes;
}

export function getTaskData(ansibleData, taskName) {
    let tasks = ansibleData["plays"][0]["tasks"];
    let data = null;
    tasks.forEach(function(task) {
        if (task["task"]["name"] === taskName) {
            if (task["hosts"].hasOwnProperty("127.0.0.1")) {
                data = task["hosts"]["127.0.0.1"];
            } else if (task["hosts"].hasOwnProperty("localhost")) {
                data = task["hosts"]["localhost"];
            }
        }
    });

    return data;
}

export function generateRandomString() {
    let str = "";
    const strLength = 6;
    const possChars = "0123456789abcdefghijklmnopqrstuvwxyz";

    for(let i = 0; i < strLength; i++) {
        str += possChars.charAt(Math.floor(Math.random() * possChars.length));
    }

    return str;
}

export function getAnsibleLogPath(playbookPath) {
    const playbookName = playbookPath.substring(playbookPath.lastIndexOf("/") + 1, playbookPath.lastIndexOf("."));
    const d = new Date();
    const dateFormat = [
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        d.getHours(),
        d.getMinutes(),
        d.getSeconds()
    ].join("");
    return `${configValues.ANSIBLE_LOG_DIR}ovirt-hosted-engine-setup-ansible-${playbookName}-${dateFormat}-${generateRandomString()}.log`;
}

export function isEmptyObject(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}
