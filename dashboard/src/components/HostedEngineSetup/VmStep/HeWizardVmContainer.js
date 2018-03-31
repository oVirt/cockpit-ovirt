import React, { Component } from 'react'
import { checkDns, checkReverseDns } from '../../../helpers/HostedEngineSetupUtil'
import { getErrorMsgForProperty, validatePropsForUiStage } from '../Validation'
import { allIntelCpus, amdCpuTypes, configValues, defaultInterfaces, intelCpuTypes, messages,
    resourceConstants, status as gwState } from '../constants'
import HeWizardVm from './HeWizardVm'
import { pingGateway } from '../../../helpers/HostedEngineSetupUtil'

const defaultAppliances = [
    { key: "Manually Select", title: "Manually Select" }
];

const requiredStaticNetworkFields = ["cloudinitVMStaticCIDR", "cloudinitVMStaticCIDRPrefix", "cloudinitVMDNS"];

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
            gatewayState: gwState.EMPTY,
            interfaces: defaultInterfaces,
            errorMsg: "",
            errorMsgs: {},
            warningMsgs: {},
            collapsibleSections: {
                advanced: true
            }
        };

        this.lastGatewayAddress = "";

        this.handleDnsAddressDelete = this.handleDnsAddressDelete.bind(this);
        this.handleDnsAddressUpdate = this.handleDnsAddressUpdate.bind(this);
        this.handleRootPwdUpdate = this.handleRootPwdUpdate.bind(this);
        this.verifyDns = this.verifyDns.bind(this);
        this.verifyReverseDns = this.verifyReverseDns.bind(this);
        this.setDefaultValues = this.setDefaultValues.bind(this);
        this.setCpuModel = this.setCpuModel.bind(this);
        this.setApplianceFiles = this.setApplianceFiles.bind(this);
        this.setValidationValues = this.setValidationValues.bind(this);
        this.handleVmConfigUpdate = this.handleVmConfigUpdate.bind(this);
        this.handleCollapsibleSectionChange = this.handleCollapsibleSectionChange.bind(this);
        this.handleApplianceFileUpdate = this.handleApplianceFileUpdate.bind(this);
        this.handleImportApplianceUpdate = this.handleImportApplianceUpdate.bind(this);
        this.setNetworkConfigDisplaySettings = this.setNetworkConfigDisplaySettings.bind(this);
        this.checkGatewayPingability = this.checkGatewayPingability.bind(this);
        this.validateConfigUpdate = this.validateConfigUpdate.bind(this);
        this.getCidrErrorMsg = this.getCidrErrorMsg.bind(this);
        this.validateCpuModelSelection = this.validateCpuModelSelection.bind(this);
        this.validateAllInputs = this.validateAllInputs.bind(this);
    }

    handleDnsAddressDelete(index) {
        const addresses = this.state.heSetupModel.vm.cloudinitVMDNS.value;
        addresses.splice(index, 1);
        this.validateConfigUpdate("cloudinitVMDNS", this.state.heSetupModel.vm);
        this.setState({ addresses });
    }

    handleDnsAddressUpdate(index, address) {
        const addresses = this.state.heSetupModel.vm.cloudinitVMDNS.value;
        addresses[index] = address;
        this.validateConfigUpdate("cloudinitVMDNS", this.state.heSetupModel.vm);
        this.setState({ addresses });
    }

    handleRootPwdUpdate(pwd) {
        const config = this.state.heSetupModel.vm;
        config.cloudinitRootPwd.value = pwd;
        this.setState({ config });
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
        const heSetupModel = this.state.heSetupModel;
        const defaultsProvider = this.props.defaultsProvider;

        const networkInterfaces = defaultsProvider.getNetworkInterfaces();
        this.setState({ interfaces: networkInterfaces });
        heSetupModel.network.bridgeIf.showInReview = networkInterfaces > 1;
        this.handleVmConfigUpdate("bridgeIf", defaultsProvider.getDefaultInterface(), "network");
        this.handleVmConfigUpdate("gateway", defaultsProvider.getDefaultGateway(), "network");

        const cpuArch = defaultsProvider.getCpuArchitecture();
        this.setCpuModel(cpuArch, heSetupModel);
        this.setApplianceFiles();

        this.setState({ heSetupModel, cpuArch: cpuArch })
    }

    setCpuModel(cpuArch, heSetupModel) {
        heSetupModel.vdsm.cpu.value = cpuArch.model;
        const detectedCpuInvalid = cpuArch.detectedModel !== cpuArch.model;
        const detectedCpuRecognized = allIntelCpus.includes(cpuArch.detectedModel);

        if (detectedCpuInvalid) {
            const warningMsgs = this.state.warningMsgs;
            warningMsgs.cpu = detectedCpuRecognized ? messages.DETECTED_CPU_NOT_SUPPORTED_BY_SETUP : messages.DETECTED_CPU_NOT_FOUND;
            this.setState({ warningMsgs });
        }
    }

    setApplianceFiles() {
        const appliances = this.props.defaultsProvider.getApplianceFiles();

        if (appliances[0].key === "Manually Select") {
            this.setState({ showApplPath: true });
        }

        this.setState({ appliances: appliances, applPathSelection: appliances[0].key });
    }

    setValidationValues() {
        const defaultsProvider = this.props.defaultsProvider;
        const heSetupModel = this.state.heSetupModel;

        const maxVCpus = defaultsProvider.getMaxVCpus();
        heSetupModel.vm.vmVCpus.value = maxVCpus > 4 ? 4 : maxVCpus;
        heSetupModel.vm.vmVCpus.range.max = maxVCpus;

        const maxMemAvail = defaultsProvider.getMaxMemAvailable();
        const minRecVmMem = resourceConstants.VM_MEM_MIN_RECOMMENDED_MB;
        heSetupModel.vm.vmMemSizeMB.range.max = maxMemAvail;
        heSetupModel.vm.vmMemSizeMB.value = maxMemAvail < minRecVmMem ? maxMemAvail : minRecVmMem;

        this.setState({ heSetupModel });
    }

    handleVmConfigUpdate(propName, value, configType) {
        const heSetupModel = this.state.heSetupModel;

        if (propName === "ovfArchiveSelect") {
            this.handleApplianceFileUpdate(value);
            return;
        }

        heSetupModel[configType][propName].value = value;

        switch (propName) {
            case "networkConfigType":
                this.setNetworkConfigDisplaySettings(value);
                break;
            case "cloudinitRootPwd":
                heSetupModel.vm.cloudinitRootPwd.useInAnswerFile = value !== "";
                break;
            case "fqdn":
                heSetupModel.vm.cloudinitInstanceHostName.value = value.substring(0, value.indexOf("."));
                heSetupModel.vm.cloudinitInstanceDomainName.value = value.substring(value.indexOf(".") + 1);
                break;
            case "host_name":
                heSetupModel.engine.appHostName.value = value;
                break;
            default:
                break;
        }

        this.validateConfigUpdate(propName, heSetupModel[configType]);
        this.setState({ heSetupModel });
    }

    handleCollapsibleSectionChange(sectionName) {
        const sections = this.state.collapsibleSections;
        sections[sectionName] = !sections[sectionName];
        this.setState(sections);
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
            model.setBooleanValues(requiredStaticNetworkFields, ["required"], false);
        } else if (networkConfigType === "static") {
            model.setBooleanValues(ansFileFields, fieldProps, true);
            model.setBooleanValues(requiredStaticNetworkFields, ["required"], true);
        }

        this.setState({ model });
    }

    checkGatewayPingability(address) {
        let errorMsg = this.state.errorMsg;
        errorMsg = "";

        let errorMsgs = this.state.errorMsgs;
        errorMsgs.gateway = "";

        let gatewayState = this.state.gatewayState;
        gatewayState = gwState.POLLING;

        this.setState({ gatewayState, errorMsg, errorMsgs });

        this.lastGatewayAddress = address;

        let self = this;
        pingGateway(address)
            .done(function() {
                if (address === self.lastGatewayAddress) {
                    gatewayState = gwState.SUCCESS;
                    self.setState({errorMsg, gatewayState});
                }
            })
            .fail(function() {
                if (address === self.lastGatewayAddress) {
                    errorMsg = messages.GENERAL_ERROR_MSG;
                    errorMsgs.gateway = messages.IP_NOT_PINGABLE;
                    gatewayState = gwState.FAILURE;
                    self.setState({errorMsg, errorMsgs, gatewayState});
                }
            });
    }

    getCidrErrorMsg() {
        const prefixErrorMsg = this.state.errorMsgs.cloudinitVMStaticCIDRPrefix;
        const ipErrorMsg = this.state.errorMsgs.cloudinitVMStaticCIDR;
        let cidrErrorMsg = "";

        if (typeof ipErrorMsg !== "undefined") {
            cidrErrorMsg = ipErrorMsg;
        } else if (typeof prefixErrorMsg !== "undefined") {
            cidrErrorMsg =  prefixErrorMsg;
        }

        return cidrErrorMsg;
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

        if (propName === "cpu") {
            this.validateCpuModelSelection(errorMsgs);
        }

        if (propName === "gateway" && propErrorMsg === "") {
            this.checkGatewayPingability(prop.value);
        }

        // Display of errors for IP and CIDR are linked - Register errors for both if either is edited
        if (propName === "cloudinitVMStaticCIDR") {
            const prefixErrorMsg = getErrorMsgForProperty(config["cloudinitVMStaticCIDRPrefix"]);
            if (prefixErrorMsg !== "") {
                errorMsgs["cloudinitVMStaticCIDRPrefix"] = prefixErrorMsg;
            }
        } else if (propName === "cloudinitVMStaticCIDRPrefix") {
            const ipErrorMsg = getErrorMsgForProperty(config["cloudinitVMStaticCIDR"]);
            if (ipErrorMsg !== "") {
                errorMsgs["cloudinitVMStaticCIDR"] = ipErrorMsg;
            }
        }

        this.setState({ errorMsg, errorMsgs });
    }

    validateCpuModelSelection(errorMsgs) {
        const cpuArch = this.state.cpuArch;

        // user will select CPU level if detected CPU isn't recognized - don't display error message
        if (!allIntelCpus.includes(cpuArch.detectedModel)) {
            return;
        }

        let hostCpuIdx = -1;
        const hostCpuModel = cpuArch.model;

        let selectedCpuIdx = -1;
        const selectedCpuModel = this.state.heSetupModel.vdsm.cpu.value;

        const cpuModels = cpuArch.vendor === "Intel" ? intelCpuTypes : amdCpuTypes;

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
            errorMsgs.cpu = "VM CPU model cannot be newer than host CPU model ("
                            + hostCpuModel.replace("model_", "") + ").";
        }
    }

    validateAllInputs() {
        let errorMsg = "";
        let errorMsgs = {};
        const propsAreValid = validatePropsForUiStage("VM", this.state.heSetupModel, errorMsgs) ||
            this.state.gatewayState === gwState.FAILURE;

        if (!propsAreValid) {
            errorMsg = messages.GENERAL_ERROR_MSG;
        }

        this.setState({ errorMsg, errorMsgs });
        return propsAreValid;
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
                collapsibleSections={this.state.collapsibleSections}
                cpuArch={this.state.cpuArch}
                deploymentType={this.props.deploymentType}
                errorMsg={this.state.errorMsg}
                errorMsgs={this.state.errorMsgs}
                gatewayState={this.state.gatewayState}
                getCidrErrorMsg={this.getCidrErrorMsg}
                interfaces={this.state.interfaces}
                handleDnsAddressUpdate={this.handleDnsAddressUpdate}
                handleDnsAddressDelete={this.handleDnsAddressDelete}
                handleRootPwdUpdate={this.handleRootPwdUpdate}
                handleImportApplianceUpdate={this.handleImportApplianceUpdate}
                handleVmConfigUpdate={this.handleVmConfigUpdate}
                handleCollapsibleSectionChange={this.handleCollapsibleSectionChange}
                heSetupModel={this.state.heSetupModel}
                importAppliance={this.state.importAppliance}
                showApplPath={this.state.showApplPath}
                verifyDns={this.verifyDns}
                verifyReverseDns={this.verifyReverseDns}
                warningMsgs={this.state.warningMsgs}/>
        )
    }

}

HeWizardVmContainer.propTypes = {
    stepName: React.PropTypes.string.isRequired,
    model: React.PropTypes.object.isRequired,
    deploymentType: React.PropTypes.string.isRequired
};

export default HeWizardVmContainer;
