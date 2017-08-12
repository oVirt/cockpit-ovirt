import { configValues, configFileTypes as types, answerFilePrefixes } from "../components/HostedEngineSetup/constants"

export class HeSetupModel {
    constructor() {
        this.model = this.getBaseHeSetupModel();

        this.getBaseHeSetupModel = this.getBaseHeSetupModel.bind(this);
        this.addGlusterValues = this.addGlusterValues.bind(this);
        this.addValuesToModel = this.addValuesToModel.bind(this);
    }

    getBaseHeSetupModel() {
        return {
            core: {
                rollbackProceed: {
                    name: "Rollback Proceed",
                    value: "None",
                    type: types.NONE,
                    showInReview: false,
                    uiStage: "",
                    useInAnswerFile: true
                },
                screenProceed: {
                    name: "Screen Proceed",
                    value: "None",
                    type: types.NONE,
                    showInReview: false,
                    uiStage: "",
                    useInAnswerFile: true
                },
                deployProceed: {
                    name: "Deploy Proceed",
                    value: true,
                    type: types.BOOLEAN,
                    showInReview: false,
                    uiStage: "",
                    useInAnswerFile: true
                },
                upgradeProceed: {
                    name: "Rollback Proceed",
                    value: "None",
                    type: types.NONE,
                    showInReview: false,
                    uiStage: "",
                    useInAnswerFile: true
                },
                confirmSettings: {
                    name: "Confirm Settings",
                    value: true,
                    type: types.BOOLEAN,
                    showInReview: false,
                    uiStage: "",
                    useInAnswerFile: true
                }
            },
            storage: {
                domainType: {
                    name: "Storage Type",
                    value: "nfs3",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "Storage",
                    useInAnswerFile: true
                },
                imgSizeGB: {
                    name: "Disk Size",
                    value: "50",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: true
                },
                storagePath: {
                    name: "Storage Path",
                    value: "",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "Storage",
                    useInAnswerFile: true
                },
                storageDomain: {
                    name: "Storage Domain",
                    value: "hosted_storage",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "Storage",
                    useInAnswerFile: true
                },
                storageDomainConnection: {
                    name: "Storage Domain Connection",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "Storage",
                    useInAnswerFile: false
                },
                mntOptions: {
                    name: "Mount Options",
                    value: "",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "Storage",
                    useInAnswerFile: true
                },
                iSCSIPortalUser: {
                    name: "Portal User",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "Storage",
                    useInAnswerFile: false
                },
                iSCSIPortalIPAddress: {
                    name: "Portal IP Address",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "Storage",
                    useInAnswerFile: false
                },
                iSCSIPortalPort: {
                    name: "Portal Port",
                    value: "3260",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "Storage",
                    useInAnswerFile: false
                },
                iSCSITargetName: {
                    name: "Target Name",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "Storage",
                    useInAnswerFile: false
                },
                LunID: {
                    name: "Destination LUN",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "Storage",
                    useInAnswerFile: false
                }
            },
            network: {
                bridgeName: {
                    name: "Bridge Interface",
                    value: "",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "Network",
                    useInAnswerFile: true
                },
                firewallManager: {
                    name: "Firewall",
                    value: false,
                    type: types.BOOLEAN,
                    showInReview: true,
                    uiStage: "Network",
                    useInAnswerFile: true
                },
                gateway: {
                    name: "Gateway Address",
                    value: "",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "Network",
                    useInAnswerFile: true
                },
                fqdn: {
                    name: "Engine FQDN",
                    value: "ovirt-engine.localdomain",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: true
                }
            },
            vm: {
                bootDevice: {
                    name: "Boot Device",
                    value: "cdrom",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: false
                },
                installationFile: {
                    name: "Appliance File Path",
                    value: "",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: false
                },
                vmVCpus: {
                    name: "Number of Virtual CPUs",
                    value: "2",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: true
                },
                vmMACAddr: {
                    name: "MAC Address",
                    value: "00:16:3E:6A:7A:F9",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: true
                },
                vmMemSizeMB: {
                    name: "Memory Size",
                    value: "4096",
                    type: types.INTEGER,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: true
                },
                networkConfigType: {
                    name: "Network Configuration",
                    value: "dhcp",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: false
                },
                cloudinitVMStaticCIDR: {
                    name: "IP Address",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: true
                },
                cloudinitVMDNS: {
                    name: "DNS Servers",
                    value: [""],
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: true
                },
                cloudInitCustomize: {
                    name: "Use Cloud-Init",
                    value: true,
                    type: types.BOOLEAN,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: false
                },
                cloudinitVMTZ: {
                    name: "Host Time Zone",
                    value: "America/New_York",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: true
                },
                cloudInitISO: {
                    name: "Cloud-Init Image",
                    value: "generate",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: true
                },
                ovfArchive: {
                    name: "OVF Archive",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: true
                },
                cloudinitInstanceDomainName: {
                    name: "Engine VM Domain",
                    value: "localdomain",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: true
                },
                cloudinitExecuteEngineSetup: {
                    name: "Engine Setup",
                    value: true,
                    type: types.BOOLEAN,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: true
                },
                automateVMShutdown: {
                    name: "Engine Restart",
                    value: true,
                    type: types.BOOLEAN,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: true
                },
                rootPassword: {
                    name: "Root password",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "VM",
                    useInAnswerFile: false
                },
                rootSshPubkey: {
                    name: "Root User SSH Public Key",
                    value: "",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: true
                },
                rootSshAccess: {
                    name: "Root User SSH Access",
                    value: "yes",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: true
                },
                cloudinitVMETCHOSTS: {
                    name: "Add Lines to /etc/hosts",
                    value: true,
                    type: types.BOOLEAN,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: true
                }
            },
            engine: {
                hostIdentifier: {
                    name: "Host Identifier",
                    value: "hosted_engine_1",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "Engine",
                    useInAnswerFile: false
                },
                adminUsername: {
                    name: "Admin Username",
                    value: "admin",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "Engine",
                    useInAnswerFile: false
                },
                adminPortalPassword: {
                    name: "Admin Portal Password",
                    value: "",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "Engine",
                    useInAnswerFile: false
                }
            },
            vdsm: {
                consoleType: {
                    name: "Console Type",
                    value: "vnc",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: true
                },
                cpu: {
                    name: "CPU Type",
                    value: "",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "VM",
                    useInAnswerFile: true
                },
                spicePkiSubject: {
                    name: "Spice PKI Subject",
                    value: "C=EN, L=Test, O=Test, CN=Test",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "",
                    useInAnswerFile: false
                },
                pkiSubject: {
                    name: "PKI Subject",
                    value: "/C=EN/L=Test/O=Test/CN=Test",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "",
                    useInAnswerFile: false
                },
                caSubject: {
                    name: "Certificate Authority Subject",
                    value: "/C=EN/L=Test/O=Test/CN=TestCA",
                    type: types.STRING,
                    showInReview: false,
                    uiStage: "",
                    useInAnswerFile: false
                }
            },
            notifications: {
                smtpServer: {
                    name: "Notifications SMTP Server",
                    value: "localhost",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "Engine",
                    useInAnswerFile: true
                },
                smtpPort: {
                    name: "SMTP Port Number",
                    value: "25",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "Engine",
                    useInAnswerFile: true
                },
                sourceEmail: {
                    name: "SMTP Sender E-Mail Address",
                    value: "root@localhost",
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "Engine",
                    useInAnswerFile: true
                },
                destEmail: {
                    name: "SMTP Recipient E-Mail Addresses",
                    value: [],
                    type: types.STRING,
                    showInReview: true,
                    uiStage: "Engine",
                    useInAnswerFile: true
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
                console.log("Gluster values successfully added.");
            })
            .fail(function(error) {
                console.log("Failed to read the gluster answer file. " + error);
            })
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

export class AnsibleUtil {

    runAnsibleCommand(cmd, options, stdoutCallback, successCallback, failCallback) {
        return cockpit.spawn(cmd.split(" "), options)
            .done(successCallback)
            .fail(failCallback)
            .stream(stdoutCallback);
    };

    runPlaybook(filePath, stdoutCallback, successCallback, failCallback) {
        let cmd = ["ansible-playbook", filePath];
        return this.runAnsibleCommand(cmd, stdoutCallback, successCallback, failCallback);
    };

    runAdHocCommand(cmdStr, stdoutCallback, successCallback, failCallback) {
        let cmd = cmdStr.split(" ");
        return this.runAnsibleCommand(cmd, stdoutCallback, successCallback, failCallback);
    };

    getTaskData(ansibleData, taskName) {
        let tasks = ansibleData["plays"][0]["tasks"];
        let data = null;
        tasks.forEach(function(task) {
            if (task["task"]["name"] === taskName) {
                data = task["hosts"]["127.0.0.1"];
            }
        });

        return data;
    };

    getOutputAsJson(output) {
        return JSON.parse(output);
    };

    logDone() {
        console.log("Ansible command ran successfully.");
    };

    logStdout(data) {
        console.log("Ansible command output: " + data);
    };

    logError(error) {
        console.log("There was an error running the Ansible command: " + error);
    };
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
        .done(function(result) {
            console.log("Success! " + result);
        })
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
