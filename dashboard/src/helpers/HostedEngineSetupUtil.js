import { configValues, configFileTypes as types, answerFilePrefixes } from "../components/HostedEngineSetup/constants"
import classNames from 'classnames'
import Validation from '../components/HostedEngineSetup/Validation'

export class HeSetupModel {
    constructor() {
        this.model = this.getBaseHeSetupModel();

        this.getBaseHeSetupModel = this.getBaseHeSetupModel.bind(this);
        this.addGlusterValues = this.addGlusterValues.bind(this);
        this.addValuesToModel = this.addValuesToModel.bind(this);
        this.setBooleanValues = this.setBooleanValues.bind(this);
        this.setBooleanValue = this.setBooleanValue.bind(this);
        this.getAnsFileProperty = this.getAnsFileProperty.bind(this);
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
                }
            },
            storage: {
                domainType: {
                    name: "domainType",
                    ansibleVarName: "DOMAIN_TYPE",
                    ansiblePhasesUsed: [2, 3],
                    description: "Storage Type",
                    value: "nfs3",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "Storage",
                    useInAnswerFile: true,
                    required: false
                },
                imgSizeGB: {
                    name: "imgSizeGB",
                    description: "Disk Size (GB)",
                    value: "50",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: true
                },
                storagePath: {
                    name: "storagePath",
                    ansibleVarName: "STORAGE_DOMAIN_PATH",
                    ansiblePhasesUsed: [2],
                    description: "Storage Path",
                    value: "",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "Storage",
                    useInAnswerFile: true,
                    required: true
                },
                storageDomain: {
                    name: "storageDomain",
                    ansibleVarName: "STORAGE_DOMAIN_NAME",
                    ansiblePhasesUsed: [2, 3],
                    description: "Storage Domain",
                    value: "hosted_storage",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "Storage",
                    useInAnswerFile: true,
                    required: false
                },
                storageDomainConnection: {
                    name: "storageDomainConnection",
                    ansibleVarName: "STORAGE",
                    ansiblePhasesUsed: [3],
                    description: "Storage Domain Connection",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "Storage",
                    useInAnswerFile: false,
                    required: false
                },
                mntOptions: {
                    name: "mntOptions",
                    ansibleVarName: "MOUNT_OPTIONS",
                    ansiblePhasesUsed: [2],
                    description: "Mount Options",
                    value: "",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "Storage",
                    useInAnswerFile: true,
                    required: false
                },
                iSCSIPortalUser: {
                    name: "iSCSIPortalUser",
                    ansibleVarName: "ISCSI_USERNAME",
                    ansiblePhasesUsed: [2, 3],
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
                    ansiblePhasesUsed: [2, 3],
                    description: "Portal Password",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "Storage",
                    useInAnswerFile: false,
                    required: false
                },
                iSCSIPortalIPAddress: {
                    name: "iSCSIPortalIPAddress",
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
                iSCSIPortalPort: {
                    name: "iSCSIPortalPort",
                    ansibleVarName: "ISCSI_PORT",
                    ansiblePhasesUsed: [2, 3],
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
                iSCSITargetName: {
                    name: "iSCSITargetName",
                    ansibleVarName: "ISCSI_TARGET",
                    ansiblePhasesUsed: [2, 3],
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
                    ansiblePhasesUsed: [2],
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
                bridgeName: {
                    name: "bridgeName",
                    description: "Bridge Interface",
                    value: "",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "Network",
                    useInAnswerFile: true,
                    required: false
                },
                firewallManager: {
                    name: "firewallManager",
                    description: "Firewall",
                    value: false,
                    type: types.BOOLEAN,
                    showInReview: true,
                    uiStage: "Network",
                    useInAnswerFile: true,
                    required: false
                },
                gateway: {
                    name: "gateway",
                    ansibleVarName: "GATEWAY",
                    ansiblePhasesUsed: [3],
                    description: "Gateway Address",
                    value: "",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "Network",
                    useInAnswerFile: true,
                    required: true,
                    regex: Validation.ipAddress,
                    errorMsg: "Invalid format for IP address"
                },
                fqdn: {
                    name: "fqdn",
                    ansibleVarName: "FQDN",
                    ansiblePhasesUsed: [1, 2, 3],
                    description: "Engine FQDN",
                    value: "ovirt-engine.localdomain",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: true
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
                    ansiblePhasesUsed: [1, 3],
                    description: "Number of Virtual CPUs",
                    value: "2",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: true,
                    range: {min: 2, max: 2}
                },
                vmMACAddr: {
                    name: "vmMACAddr",
                    ansibleVarName: "VM_MAC_ADDR",
                    ansiblePhasesUsed: [1, 3],
                    description: "MAC Address",
                    value: "00:16:3E:6A:7A:F9",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: false,
                    regex: Validation.macAddress,
                    errorMsg: "Invalid format for MAC address"
                },
                vmMemSizeMB: {
                    name: "vmMemSizeMB",
                    ansibleVarName: "MEM_SIZE",
                    ansiblePhasesUsed: [1, 3],
                    description: "Memory Size (MB)",
                    value: "4096",
                    type: types.INTEGER,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: true,
                    range: {min: 4096, max: 4096}
                },
                networkConfigType: {
                    name: "networkConfigType",
                    description: "Network Configuration",
                    value: "dhcp",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: false,
                    required: false
                },
                cloudinitVMStaticCIDR: {
                    name: "cloudinitVMStaticCIDR",
                    description: "IP Address",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: false,
                    regex: Validation.ipAddress,
                    errorMsg: "Invalid format for IP address"
                },
                cloudinitVMDNS: {
                    name: "cloudinitVMDNS",
                    description: "DNS Servers",
                    value: [""],
                    type: types.STRING,
                    showInReview: false,
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
                    ansiblePhasesUsed: [1, 3],
                    description: "Host Time Zone",
                    value: "America/New_York",
                    type: types.STRING,
                    showInReview: true,
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
                    ansiblePhasesUsed: [1],
                    description: "Appliance File Path",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: false,
                    required: false
                },
                cloudinitInstanceDomainName: {
                    name: "cloudinitInstanceDomainName",
                    ansibleVarName: "CLOUD_INIT_DOMAIN_NAME",
                    ansiblePhasesUsed: [1],
                    description: "Engine VM Domain",
                    value: "localdomain",
                    type: types.STRING,
                    showInReview: true,
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
                rootPassword: {
                    name: "rootPassword",
                    ansibleVarName: "APPLIANCE_PASSWORD",
                    ansiblePhasesUsed: [1],
                    description: "Root password",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
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
                    ansiblePhasesUsed: [1],
                    description: "Root User SSH Public Key",
                    value: "",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: false
                },
                rootSshAccess: {
                    name: "rootSshAccess",
                    ansibleVarName: "ROOT_SSH_ACCESS",
                    ansiblePhasesUsed: [1],
                    description: "Root User SSH Access",
                    value: "yes",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: false
                },
                cloudinitVMETCHOSTS: {
                    name: "cloudinitVMETCHOSTS",
                    ansibleVarName: "VM_ETC_HOSTS",
                    ansiblePhasesUsed: [1],
                    description: "Add Lines to /etc/hosts",
                    value: true,
                    type: types.BOOLEAN,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: true,
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
                    useInAnswerFile: false,
                    required: true
                },
                adminUsername: {
                    name: "adminUsername",
                    description: "Admin Username",
                    value: "admin@internal",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "Engine",
                    useInAnswerFile: false,
                    required: true
                },
                adminPortalPassword: {
                    name: "adminPortalPassword",
                    ansibleVarName: "ADMIN_PASSWORD",
                    ansiblePhasesUsed: [1, 2, 3],
                    description: "Admin Portal Password",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
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
                }
            },
            vdsm: {
                consoleType: {
                    name: "consoleType",
                    ansibleVarName: "CONSOLE_TYPE",
                    ansiblePhasesUsed: [1, 3],
                    description: "Console Type",
                    value: "vnc",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: true,
                    required: false
                },
                cpu: {
                    name: "cpu",
                    ansibleVarName: "CPU_TYPE",
                    ansiblePhasesUsed: [1, 3],
                    description: "CPU Type",
                    value: "Conroe",
                    type: types.STRING,
                    showInReview: true,
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
                    description: "Notifications SMTP Server",
                    value: "localhost",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "Engine",
                    useInAnswerFile: true,
                    required: false
                },
                smtpPort: {
                    name: "smtpPort",
                    description: "SMTP Port Number",
                    value: "25",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "Engine",
                    useInAnswerFile: true,
                    required: false,
                    range: {min: 0, max: 65536},
                    errorMsg: "Port numbers must be between 0 and 65,536"
                },
                sourceEmail: {
                    name: "sourceEmail",
                    description: "SMTP Sender E-Mail Address",
                    value: "root@localhost",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "Engine",
                    useInAnswerFile: true,
                    required: false
                },
                destEmail: {
                    name: "destEmail",
                    description: "SMTP Recipient E-Mail Addresses",
                    value: ["root@localhost"],
                    type: types.STRING,
                    showInReview: true,
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
}

export class AnswerFileGenerator {
    constructor(heSetupModel) {
        this.model = heSetupModel;
        this.filePath = configValues.ANSWER_FILE_PATH;
        this.additionalLines = "";
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
                        let prop = section[propName];

                        if (prop.useInAnswerFile) {
                            configString += this.createLine(sectionName, propName, prop.value, prop.type);
                        }
                    }, this)
            }, this);

        return configString;
    }

    createLine(sectionName, key, value, type) {
        let line = "";

        line += answerFilePrefixes[sectionName.toUpperCase()];
        line += key + "=";
        line += type + ":";
        line += value + "\n";

        return line;
    }

    writeConfigToFile() {
        const file = cockpit.file(this.filePath);
        let configString = this.generateConfigFile();
        this.additionalLines = this.additionalLines.replace("[environment:default]\n", "");
        configString += this.additionalLines;

        const that = this;
        return file.replace(configString)
            .done(function() {
                console.log("Answer file successfully written to " + that.filePath);
            })
            .fail(function(error) {
                console.log("Problem writing answer file. " + error);
            })
            .always(function() {
                file.close()
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
