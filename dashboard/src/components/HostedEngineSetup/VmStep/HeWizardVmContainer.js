import React, { Component } from 'react'
import { getTaskData, TimeZone, checkDns, checkReverseDns } from '../../../helpers/HostedEngineSetupUtil'
import { getErrorMsgForProperty, validatePropsForUiStage } from "../Validation";
import { amdCpuTypes, configValues, intelCpuTypes, resourceConstants, messages } from "../constants"
import HeWizardVm from './HeWizardVm'

const defaultAppliances = [
    { key: "Manually Select", title: "Manually Select" }
];

class HeWizardVmContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            model: props.model,
            heSetupModel: props.model.model,
            importAppliance: true,
            showApplPath: false,
            applPathSelection: "",
            appliances: defaultAppliances,
            cpuArch: {},
            errorMsg: "",
            errorMsgs: {}
        };

        this.handleDnsAddressDelete = this.handleDnsAddressDelete.bind(this);
        this.handleDnsAddressUpdate = this.handleDnsAddressUpdate.bind(this);
        this.verifyDns = this.verifyDns.bind(this);
        this.verifyReverseDns = this.verifyReverseDns.bind(this);
        this.setDefaultValues = this.setDefaultValues.bind(this);
        this.setApplianceFiles = this.setApplianceFiles.bind(this);
        this.setCpuArchitecture = this.setCpuArchitecture.bind(this);
        this.setValidationValues = this.setValidationValues.bind(this);
        this.getMaxMemAvailable = this.getMaxMemAvailable.bind(this);
        this.setTimeZone = this.setTimeZone.bind(this);
        this.handleVmConfigUpdate = this.handleVmConfigUpdate.bind(this);
        this.handleApplianceFileUpdate = this.handleApplianceFileUpdate.bind(this);
        this.handleImportApplianceUpdate = this.handleImportApplianceUpdate.bind(this);
        this.setNetworkConfigDisplaySettings = this.setNetworkConfigDisplaySettings.bind(this);
        this.validateConfigUpdate = this.validateConfigUpdate.bind(this);
        this.validateRootPasswordMatch = this.validateRootPasswordMatch.bind(this);
        this.validateCpuModelSelection = this.validateCpuModelSelection.bind(this);
        this.validateAllInputs = this.validateAllInputs.bind(this);
    }

    handleDnsAddressDelete(index) {
        const addresses = this.state.heSetupModel.vm.cloudinitVMDNS.value;
        addresses.splice(index, 1);
        this.setState({ addresses, errorMsgs: {} });
    }

    handleDnsAddressUpdate(index, address) {
        const addresses = this.state.heSetupModel.vm.cloudinitVMDNS.value;
        addresses[index] = address;
        const errorMsgs= this.state.errorMsgs;
        this.setState({ addresses, errorMsgs });
    }

    verifyDns(fqdn) {
        checkDns(fqdn)
            .done(function() {
                console.log("DNS resolution of Engine VM IP completed successfully.");
            })
            .fail(function(error) {
                console.log("Error with DNS resolution: " + error);
            })
    }

    verifyReverseDns(ipAddress) {
        checkReverseDns(ipAddress)
            .done(function() {
                console.log("DNS resolution of Engine VM IP completed successfully.");
            })
            .fail(function(error) {
                console.log("Error with rDNS resolution: " + error);
            })
    }

    setDefaultValues() {
        this.setTimeZone();

        if (this.props.systemData !== null) {
            this.setApplianceFiles();
            this.setCpuArchitecture();
        }
    }

    setApplianceFiles() {
        let appliances = defaultAppliances;

        let applData = getTaskData(this.props.systemData, "Get appliance files");
        const applList = applData["stdout_lines"];

        if (typeof applList !== 'undefined' && applList.length > 0) {
            applList.forEach(function (appliance) {
                appliances.push({key: appliance, title: appliance});
            });
        }

        if (appliances[0].key === "Manually Select") {
            this.setState({ showApplPath: true });
        }

        this.setState({ appliances, applPathSelection: appliances[0].key });
    }

    setCpuArchitecture() {
        let modelData = getTaskData(this.props.systemData, "Get CPU model")["stdout"];
        let cpuModel = modelData.replace("\<model\>", "").replace("\</model\>", "").trim();

        let vendorData = getTaskData(this.props.systemData, "Get CPU vendor")["stdout"];
        let cpuVendor = vendorData.replace("\<vendor\>", "").replace("\</vendor\>", "").trim();

        let cpuArch = {
            model: cpuModel,
            vendor: cpuVendor
        };

        const heSetupModel = this.state.heSetupModel;
        heSetupModel.vdsm.cpu.value = cpuModel;
        this.setState({ heSetupModel, cpuArch: cpuArch });
    }

    setValidationValues() {
        const heSetupModel = this.state.heSetupModel;
        let systemData = getTaskData(this.props.systemData, "Gathering Facts");

        heSetupModel.vm.vmVCpus.range.max = systemData["ansible_facts"]["ansible_processor_vcpus"];
        heSetupModel.vm.vmMemSizeMB.range.max = this.getMaxMemAvailable(systemData);

        this.setState({ heSetupModel });
    }

    getMaxMemAvailable(systemData) {
        let totalMemMb = systemData["ansible_facts"]["ansible_memtotal_mb"];
        let availMemMb = systemData["ansible_facts"]["ansible_memfree_mb"];

        let calc1 = totalMemMb - resourceConstants.VDSM_HOST_OVERHEAD_MB - resourceConstants.VDSM_VM_OVERHEAD_MB;
        let calc2 = availMemMb - resourceConstants.VDSM_VM_OVERHEAD_MB;

        return Math.min(calc1, calc2);
    }

    setTimeZone() {
        const vmConfig = this.state.heSetupModel.vm;
        let that = this;
        const timeZone = new TimeZone();
        timeZone.getTimeZone(function(result) {
            vmConfig["cloudinitVMTZ"].value = result;
            that.setState({ vmConfig });
        });
    }

    handleVmConfigUpdate(propName, value, configType) {
        const heSetupModel = this.state.heSetupModel;

        if (propName === "ovfArchiveSelect") {
            this.handleApplianceFileUpdate(value);
            return;
        }

        heSetupModel[configType][propName].value = value;

        if (propName === "networkConfigType") {
            this.setNetworkConfigDisplaySettings(value);
        }

        if (propName === "rootPassword") {
            heSetupModel.vm.rootPassword.useInAnswerFile = true;
        }

        this.validateConfigUpdate(propName, heSetupModel[configType]);
        this.setState({ heSetupModel });
    }

    handleApplianceFileUpdate(value) {
        const heSetupModel = this.state.heSetupModel;
        let showApplPath = this.state.showApplPath;
        let applPathSelection = value;

        if (value === "Manually Select") {
            showApplPath = true;
            heSetupModel.vm.ovfArchive.value = "";
        } else if (value !== "Manually Select") {
            showApplPath = false;
            heSetupModel.vm.ovfArchive.value = configValues.APPLIANCE_PATH_PREFIX + value;
        }

        this.setState({ showApplPath, applPathSelection, heSetupModel });
    }

    handleImportApplianceUpdate(importAppliance) {
        const heSetupModel = this.state.heSetupModel;

        heSetupModel.vm.ovfArchive.useInAnswerFile = !importAppliance;
        heSetupModel.vm.ovfArchive.showInReview = !importAppliance;

        this.setState({ importAppliance, heSetupModel });
    }

    setNetworkConfigDisplaySettings(networkConfigType) {
        const model = this.state.model;
        const ansFileFields = ["cloudinitVMDNS", "cloudinitVMStaticCIDR"];
        const fieldProps = ["showInReview", "useInAnswerFile"];

        if (networkConfigType === "dhcp") {
            model.setBooleanValues(ansFileFields, fieldProps, false);
            model.setBooleanValue("cloudinitVMStaticCIDR", ["required"], false);
        } else if (networkConfigType === "static") {
            model.setBooleanValues(ansFileFields, fieldProps, true);
            model.setBooleanValue("cloudinitVMStaticCIDR", ["required"], true);
        }

        this.setState({ model });
    }

    validateConfigUpdate(propName, config) {
        let errorMsg = this.state.errorMsg;
        const errorMsgs = {};
        const prop = config[propName];
        const propErrorMsg = getErrorMsgForProperty(prop);

        if (propErrorMsg !== "") {
            errorMsgs[propName] = propErrorMsg;
        } else {
            errorMsg = "";
        }

        if (propName === "confirmRootPassword") {
            this.validateRootPasswordMatch(errorMsgs);
        }

        if (propName === "cpu") {
            this.validateCpuModelSelection(errorMsgs);
        }

        this.setState({ errorMsg, errorMsgs });
    }

    validateRootPasswordMatch(errorMsgs) {
        const vmConfig = this.state.heSetupModel.vm;
        let passwordsMatch = vmConfig.rootPassword.value === vmConfig.confirmRootPassword.value;

        if (!passwordsMatch) {
            errorMsgs.confirmRootPassword = messages.PASSWORD_MISMATCH;
        }

        return passwordsMatch;
    }

    validateCpuModelSelection(errorMsgs) {
        let hostCpuIdx = -1;
        const hostCpuModel = this.state.cpuArch.model;

        let selectedCpuIdx = -1;
        const selectedCpuModel = this.state.heSetupModel.vdsm.cpu.value;

        const cpuModels = this.state.cpuArch.vendor === "Intel" ? intelCpuTypes : amdCpuTypes;

        for (let i = 0; i < cpuModels.length; i++) {
            let cpuModel = cpuModels[i].key;

            if (cpuModel === hostCpuModel) {
                hostCpuIdx = i;
            }

            if (cpuModel === selectedCpuModel) {
                selectedCpuIdx = i;
            }
        }

        if (selectedCpuIdx < hostCpuIdx) {
            errorMsgs.cpu = "VM CPU model cannot be newer than host CPU model (" + hostCpuModel + ").";
        }
    }

    validateAllInputs() {
        let errorMsg = "";
        let errorMsgs = {};
        let propsAreValid = validatePropsForUiStage("VM", this.state.heSetupModel, errorMsgs);
        let passwordsMatch = this.validateRootPasswordMatch(errorMsgs);

        if (!propsAreValid || !passwordsMatch) {
            errorMsg = messages.GENERAL_ERROR_MSG;
        }

        this.setState({ errorMsg, errorMsgs });
        return propsAreValid && passwordsMatch;
    }

    shouldComponentUpdate(nextProps, nextState){
        if(!this.props.validating && nextProps.validating){
            this.props.validationCallBack(this.validateAllInputs())
        }
        return true;
    }

    componentWillMount() {
        this.setDefaultValues();
        this.setValidationValues();
    }

    render() {
        return (
            <HeWizardVm
                appliances={this.state.appliances}
                applPathSelection={this.state.applPathSelection}
                cpuArch={this.state.cpuArch}
                errorMsg={this.state.errorMsg}
                errorMsgs={this.state.errorMsgs}
                handleDnsAddressUpdate={this.handleDnsAddressUpdate}
                handleDnsAddressDelete={this.handleDnsAddressDelete}
                handleImportApplianceUpdate={this.handleImportApplianceUpdate}
                handleVmConfigUpdate={this.handleVmConfigUpdate}
                heSetupModel={this.state.heSetupModel}
                importAppliance={this.state.importAppliance}
                showApplPath={this.state.showApplPath}
                verifyDns={this.verifyDns}
                verifyReverseDns={this.verifyReverseDns}
            />
        )
    }

}

HeWizardVmContainer.propTypes = {
    stepName: React.PropTypes.string.isRequired,
    model: React.PropTypes.object.isRequired
};

export default HeWizardVmContainer;
