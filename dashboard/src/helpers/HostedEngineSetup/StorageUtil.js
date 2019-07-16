import { ansibleOutputTypes as outputTypes, ansiblePhases as phases, configValues,
    playbookOutputPaths as outputPaths, playbookPaths, ansibleRoleTags } from
    "../../components/HostedEngineSetup/constants";
import AnsibleVarFilesGenerator from "./AnsibleVarFilesGenerator";
import { getAnsibleLogPath } from "../HostedEngineSetupUtil";
import PlaybookUtil from "./PlaybookUtil";

const varFileProps = {
    ISCSI_DISCOVER: ["iSCSIPortalIPAddress", "iSCSIDiscoveryPortalPort", "iSCSIDiscoverUser",
        "iSCSIDiscoverPassword", "adminPassword", "fqdn", "appHostName", "heFilteredTokensVars", "heFilteredTokensRE"],
    ISCSI_GET_DEVICES: ["adminPassword", "fqdn", "appHostName", "iSCSIPortalUser", "iSCSIPortalPassword",
        "iSCSITargetName", "storageAddress", "iSCSIPortalPort", "heFilteredTokensVars", "heFilteredTokensRE"]
};

class StorageUtil {
    constructor(model) {
        this.model = model;
        this.varFileGen = new AnsibleVarFilesGenerator(model);
        this.playbookUtil = new PlaybookUtil();

        this.getTargetList = this.getTargetList.bind(this);
        this.getTargetData = this.getTargetData.bind(this);
        this.getLunList = this.getLunList.bind(this);
        this.getLunData = this.getLunData.bind(this);
        this.readOutputFile = this.readOutputFile.bind(this);
        this.getVarFileString = this.getVarFileString.bind(this);
        this.formatValue = this.formatValue.bind(this);
        this.getProp = this.getProp.bind(this);

    }

    getFcLunsList() {
        const playbookPath = playbookPaths.HE_ROLE;
        const roleTag = ansibleRoleTags.FC_GET_DEVICES;
        const skipTag = ansibleRoleTags.SKIP_FULL_EXECUTION;
        const outputPath = outputPaths.FC_GET_DEVICES;
        const sensitiveData = this.varFileGen.getAnswerFileStringForPhase(phases.FC_GET_DEVICES, true)

        return this.varFileGen.writeVarFileForPhase(phases.FC_GET_DEVICES)
            .then(varsFilePath => this.playbookUtil.runPlaybookWithVarFiles(playbookPath, outputPath, [varsFilePath], roleTag, skipTag, sensitiveData))
            .then(() => this.playbookUtil.readOutputFile(outputPath))
            .then(output => this.playbookUtil.getResultsData(output))
            .then(results => this.parseLunData(results, "otopi_fc_devices"))
    }

    getTargetList() {
        const playbookPath = playbookPaths.HE_ROLE;
        const roleTag = ansibleRoleTags.ISCSI_DISCOVER;
        const skipTag = ansibleRoleTags.SKIP_FULL_EXECUTION;
        const outputPath = outputPaths.ISCSI_DISCOVER;
        const sensitiveData = this.varFileGen.getAnswerFileStringForPhase(phases.ISCSI_DISCOVER, true)

        return this.varFileGen.writeVarFileForPhase(phases.ISCSI_DISCOVER)
            .then(varsFilePath => this.playbookUtil.runPlaybookWithVarFiles(playbookPath, outputPath, [varsFilePath], roleTag, skipTag, sensitiveData))
            .then(() => this.readOutputFile(outputPaths.ISCSI_DISCOVER, phases.ISCSI_DISCOVER));
    }

    getTargetData(file) {
        const resultsObj = this.getResultsData(file);
        return this.parseTargetData(resultsObj);
    }

    parseTargetData(data) {
        const iscsiData = data.otopi_iscsi_targets.json;
        const targetList = Array.from(new Set(iscsiData.iscsi_targets.iscsi_target));
        const targets = {};
        targetList.forEach(function(tgt) {
           targets[tgt] = {name: tgt, tpgts: {}};
        });

        const portalList = iscsiData.discovered_targets.iscsi_details;
        portalList.forEach(function(portal) {
           const target = portal.target;
           const ptl = portal.portal;
           const tpgt = ptl.slice(ptl.indexOf(",") + 1);
           const tpgts = targets[target].tpgts;
           if (!tpgts.hasOwnProperty(tpgt)) {
               tpgts[tpgt] = {name: tpgt, portals: []};
           }
           tpgts[tpgt].portals.push(portal);
        });

        return targets;
    }

    getLunList() {
        const playbookPath = playbookPaths.HE_ROLE;
        const roleTag = ansibleRoleTags.ISCSI_GET_DEVICES;
        const skipTag = ansibleRoleTags.SKIP_FULL_EXECUTION;
        const outputPath = outputPaths.ISCSI_GET_DEVICES;
        const sensitiveData = this.varFileGen.getAnswerFileStringForPhase(phases.ISCSI_GET_DEVICES, true)

        return this.varFileGen.writeVarFileForPhase(phases.ISCSI_GET_DEVICES)
            .then(varsFilePath => this.playbookUtil.runPlaybookWithVarFiles(playbookPath, outputPath, [varsFilePath], roleTag, skipTag, sensitiveData))
            .then(() => this.readOutputFile(outputPaths.ISCSI_GET_DEVICES, phases.ISCSI_GET_DEVICES));
    }

    getLunData(file) {
        const resultsObj = this.getResultsData(file);
        return this.parseLunData(resultsObj, "otopi_iscsi_devices");
    }

    parseLunData(data, devTypeKey) {
        const lunObjList = data[devTypeKey].ansible_facts.ovirt_host_storages;
        const luns = [];
        lunObjList.forEach(function(lun) {
            const units = lun.logical_units;
            units.forEach(function(lunData) {
                luns.push({
                    guid: lunData.id,
                    size: lunData.size,
                    description: lunData.vendor_id + " " + lunData.product_id,
                    status: lunData.status,
                    numPaths: lunData.paths
                });
            });
        });

        return luns;
    }

    readOutputFile(path, phase) {
        const self = this;
        return new Promise((resolve, reject) => {
            cockpit.file(path).read()
                .done(function(output) {
                    try {
                        if (phase === phases.ISCSI_DISCOVER) {
                            const targetData = self.getTargetData(output);
                            console.log("Target results retrieved.");
                            resolve(targetData);
                        } else if (phase === phases.ISCSI_GET_DEVICES) {
                            const lunList = self.getLunData(output);
                            console.log("LUN list retrieved.");
                            resolve(lunList);
                        } else {
                            reject("Invalid phase.");
                        }
                    } catch(e) {
                        reject(e);
                    }
                })
                .fail(function(error) {
                    console.log("Error retrieving output for " + phase + " Error: " + error);
                    reject(error);
                });
        });
    }

    getResultsData(file) {
        const lines = file.split('\n').filter(n => n);
        let results = null;

        lines.forEach(function(line) {
           try {
                const json = JSON.parse(line);
                if (json["OVEHOSTED_AC/type"] === outputTypes.RESULT) {
                    results = json["OVEHOSTED_AC/body"];
                }
           } catch (error) {
               console.log(error);
           }
        });

        return results;
    }

    getVarFileString(phase) {
        const props = varFileProps[phase];
        let varString = "";
        const separator = ": ";
        const self = this;

        props.forEach(function(propName) {
            const prop = self.getProp(propName);

            let ansibleVarName = prop.ansibleVarName ? prop.ansibleVarName : "";
            if (propName === "storageAddress") {
                ansibleVarName = "he_iscsi_portal_addr";
            } else if (propName === "iSCSIDiscoveryPortalPort") {
                ansibleVarName = "he_iscsi_portal_port";
            }

            const val = self.formatValue(propName, prop.value);
            varString += ansibleVarName + separator + val + '\n';
        });

        return varString;
    }

    getProp(propName) {
        let prop = null;
        let self = this;
        Object.getOwnPropertyNames(this.model).forEach(  // sections
            function(sectionName) {
                let section = self.model[sectionName];
                Object.getOwnPropertyNames(section).forEach(  // properties
                    function(propertyName) {
                        if (propertyName === propName) {
                            prop = section[propertyName];
                        }
                    }, this)
            }, this);

        return prop;
    }

    formatValue(propName, value) {
        let retVal = value;
        if (propName === "domainType" && value.includes("nfs")) {
            retVal = "nfs";
        }

        if (propName === "nfsVersion" && !this.model.storage.domainType.value.includes("nfs")) {
            retVal = "";
        }

        switch (value) {
            case "":
                retVal= "null";
                break;
            case "yes":
            case "no":
                retVal = "\"" + value + "\"";
                break;
            default:
                break;
        }

        return retVal;
    }
}

export default StorageUtil
