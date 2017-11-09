import React, { Component } from 'react'
import Selectbox from '../common/Selectbox'
import MultiRowTextBox from './MultiRowTextBox'
import { getTaskData, TimeZone, checkDns, checkReverseDns, getClassNames } from '../../helpers/HostedEngineSetupUtil'
import { getErrorMsgForProperty, validatePropsForUiStage } from "./Validation";
import { configValues, resourceConstants, messages } from "./constants"

const intelCpuTypes = [
    { key: "Skylake-Client", title: "Intel Skylake Family" },
    { key: "Skylake", title: "Intel Skylake Family" },
    { key: "Broadwell", title: "Intel Broadwell Family" },
    { key: "Broadwell-noTSX", title: "Intel Broadwell-noTSX Family" },
    { key: "Haswell", title: "Intel Haswell Family" },
    { key: "Haswell-noTSX", title: "Intel Haswell-noTSX Family" },
    { key: "IvyBridge", title: "Intel SandyBridge Family" },
    { key: "SandyBridge", title: "Intel SandyBridge Family" },
    { key: "Westmere", title: "Intel Westmere Family" },
    { key: "Nehalem", title: "Intel Nehalem Family" },
    { key: "Penryn", title: "Intel Penryn Family" },
    { key: "Conroe", title: "Intel Conroe Family" }
];

const amdCpuTypes = [
    { key: "Opteron_G5", title: "AMD Opteron G5" },
    { key: "Opteron_G4", title: "AMD Opteron G4" },
    { key: "Opteron_G3", title: "AMD Opteron G3" },
    { key: "Opteron_G2", title: "AMD Opteron G2" },
    { key: "Opteron_G1", title: "AMD Opteron G1" }
];

const consoleTypes = [
    { key: "vnc", title: "VNC" },
    { key: "spice", title: "Spice" }
];

const defaultAppliances = [
    { key: "Manually Select", title: "Manually Select" }
];

const networkConfigTypes = [
    { key: "dhcp", title: "DHCP" },
    { key: "static", title: "Static" }
];

const cloudInitOptions = [
    { key: "generate", "title": "Generate" },
    { key: "existing", "title": "Use Existing" }
];

const rootSshAccessOptions = [
    { key: "yes", title: "Yes" },
    { key: "no", title: "No" },
    { key: "without-password", title: "Without Password" }
];

class WizardVmConfigStep extends Component {
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
        this.setApplianceFiles = this.setApplianceFiles.bind(this);
        this.setCpuArchitecture = this.setCpuArchitecture.bind(this);
        this.setValidationValues = this.setValidationValues.bind(this);
        this.getMaxMemAvailable = this.getMaxMemAvailable.bind(this);
        this.setTimeZone = this.setTimeZone.bind(this);
        this.handleVmConfigUpdate = this.handleVmConfigUpdate.bind(this);
        this.setNetworkConfigDisplaySettings = this.setNetworkConfigDisplaySettings.bind(this);
        this.validateConfigUpdate = this.validateConfigUpdate.bind(this);
        this.validateRootPasswordMatch = this.validateRootPasswordMatch.bind(this);
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
        const vmConfig = this.state.heSetupModel.vm;
        const vdsmConfig = this.state.heSetupModel.vdsm;
        const storageConfig = this.state.heSetupModel.storage;
        const networkConfig = this.state.heSetupModel.network;
        const errorMsgs = this.state.errorMsgs;

        return (
            <div>
                <form className="form-horizontal he-form-container">
                    {this.state.errorMsg &&
                        <div className="row" style={{marginLeft: "40px"}}>
                            <div className="alert alert-danger col-sm-8">
                                <span className="pficon pficon-error-circle-o" />
                                <strong>{this.state.errorMsg}</strong>
                            </div>
                        </div>
                    }

                    <div className="form-group">
                        <label className="col-md-3 control-label">Auto-import Appliance</label>
                        <div className="col-md-3">
                            <input type="checkbox"
                                   checked={this.state.importAppliance}
                                   onChange={(e) => this.handleImportApplianceUpdate(e.target.checked)}
                            />
                        </div>
                    </div>

                    <div style={this.state.importAppliance ? {display: 'none'} : {}}>
                        <div className="form-group">
                            <label className="col-md-3 control-label">Appliance File</label>
                            <div className="col-md-6">
                                <Selectbox optionList={this.state.appliances}
                                           selectedOption={this.state.applPathSelection}
                                           callBack={(e) => this.handleVmConfigUpdate("ovfArchiveSelect", e, "vm")}
                                />
                            </div>
                        </div>

                        <div className={getClassNames("ovfArchive", errorMsgs)}
                             style={this.state.showApplPath ? {} : { display: 'none' }}>
                            <label className="col-md-3 control-label">Appliance File Path</label>
                            <div className="col-md-6">
                                <input type="text" placeholder="Installation File Path"
                                       title="Enter the path for the installation file to install."
                                       className="form-control"
                                       value={vmConfig.ovfArchive.value}
                                       onChange={(e) => this.handleVmConfigUpdate("ovfArchive", e.target.value, "vm")}
                                />
                                {errorMsgs.ovfArchive && <span className="help-block">{errorMsgs.ovfArchive}</span>}
                            </div>
                        </div>
                    </div>

                    <div className={getClassNames("cpu", errorMsgs)}>
                        <label className="col-md-3 control-label">CPU Type</label>
                        <div className="col-md-6">
                            <div style={{width: "250px"}}>
                                <Selectbox optionList={this.state.cpuArch.vendor === "Intel" ? intelCpuTypes : amdCpuTypes}
                                           selectedOption={this.state.heSetupModel.vdsm.cpu.value}
                                           callBack={(e) => this.handleVmConfigUpdate("cpu", e, "vdsm")}
                                />
                            </div>
                            {errorMsgs.cpu && <span className="help-block">{errorMsgs.cpu}</span>}
                        </div>
                    </div>

                    <div className={getClassNames("vmVCpus", errorMsgs)}>
                        <label className="col-md-3 control-label">Number of Virtual CPUs</label>
                        <div className="col-md-6">
                            <input type="number" style={{width: "60px"}}
                                   min={vmConfig.vmVCpus.range.min}
                                   max={vmConfig.vmVCpus.range.max}
                                   placeholder="Number of CPUs"
                                   title="Enter the path for the installation file to install."
                                   className="form-control"
                                   value={vmConfig.vmVCpus.value}
                                   onChange={(e) => this.handleVmConfigUpdate("vmVCpus", e.target.value, "vm")}
                            />
                            {errorMsgs.vmVCpus && <span className="he">{errorMsgs.vmVCpus}</span>}
                        </div>
                    </div>

                    <div className={getClassNames("imgSizeGB", errorMsgs)}>
                        <label className="col-md-3 control-label">Disk Size (GB)</label>
                        <div className="col-md-6 he-text-with-units">
                            <input type="number" style={{width: "60px"}}
                                   placeholder="Disk Size"
                                   title="Enter the disk size for the VM."
                                   className="form-control"
                                   value={storageConfig.imgSizeGB.value}
                                   onChange={(e) => this.handleVmConfigUpdate("imgSizeGB", e.target.value, "storage")}
                            />
                            {errorMsgs.imgSizeGB && <span className="help-block">{errorMsgs.imgSizeGB}</span>}
                        </div>
                    </div>

                    <div className={getClassNames("vmMemSizeMB", errorMsgs)}>
                        <label className="col-md-3 control-label">Memory Size (MB)</label>
                        <div className="col-md-6 he-text-with-units">
                            <input type="number" style={{width: "60px"}}
                                   min={vmConfig.vmMemSizeMB.range.min}
                                   max={vmConfig.vmMemSizeMB.range.max}
                                   placeholder="Disk Size"
                                   title="Enter the disk size for the VM."
                                   className="form-control"
                                   value={vmConfig.vmMemSizeMB.value}
                                   onChange={(e) => this.handleVmConfigUpdate("vmMemSizeMB", e.target.value, "vm")}
                            />
                            {errorMsgs.vmMemSizeMB && <span className="help-block">{errorMsgs.vmMemSizeMB}</span>}
                        </div>
                    </div>

                    <div className={getClassNames("vmMACAddr", errorMsgs)}>
                        <label className="col-md-3 control-label">MAC Address</label>
                        <div className="col-md-6">
                            <input type="text" style={{width:"120px"}}
                                   placeholder="00:11:22:33:44:55"
                                   title="Enter the MAC address for the VM."
                                   className="form-control"
                                   value={vmConfig.vmMACAddr.value}
                                   onChange={(e) => this.handleVmConfigUpdate("vmMACAddr", e.target.value, "vm")}
                            />
                            {errorMsgs.vmMACAddr && <span className="help-block">{errorMsgs.vmMACAddr}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="col-md-3 control-label">Console Type</label>
                        <div className="col-md-2">
                            <Selectbox optionList={consoleTypes}
                                       selectedOption={vdsmConfig.consoleType.value}
                                       callBack={(e) => this.handleVmConfigUpdate("consoleType", e, "vdsm")}
                            />
                        </div>
                    </div>

                    <div className={getClassNames("cloudinitVMTZ", errorMsgs)}>
                        <label className="col-md-3 control-label">Host Time Zone</label>
                        <div className="col-md-3">
                            <input type="text" placeholder="Host Time Zone"
                                   className="form-control"
                                   value={vmConfig.cloudinitVMTZ.value}
                                   onChange={(e) => this.handleVmConfigUpdate("cloudinitVMTZ", e.target.value, "vm")}
                            />
                            {errorMsgs.cloudinitVMTZ && <span className="help-block">{errorMsgs.cloudinitVMTZ}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="col-md-9 he-stage-header">
                            <h3>Cloud Init Settings</h3>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="col-md-3 control-label">Use Cloud-Init &nbsp;
                            <i className="pficon pficon-info" rel="tooltip"
                               title="Use cloud-init to customize the appliance on the first boot" />
                        </label>
                        <div className="col-md-3">
                            <input type="checkbox"
                                   checked={vmConfig.cloudInitCustomize.value}
                                   onChange={(e) => this.handleVmConfigUpdate("cloudInitCustomize", e.target.checked, "vm")}
                            />
                        </div>
                    </div>

                    <div style={this.state.heSetupModel.vm.cloudInitCustomize.value ? {} : {display: 'none'}}>
                        <div className="form-group">
                            <label className="col-md-3 control-label">Cloud-Init Image</label>
                            <div className="col-md-3">
                                <Selectbox optionList={cloudInitOptions}
                                           selectedOption={vmConfig.cloudInitISO.value}
                                           callBack={(e) => this.handleVmConfigUpdate("cloudInitISO", e, "vm")}
                                />
                            </div>
                        </div>

                        <div className={getClassNames("fqdn", errorMsgs)}>
                            <label className="col-md-3 control-label">Engine VM FQDN</label>
                            <div className="col-md-4">
                                <input type="text"
                                       title="Enter the engine FQDN."
                                       className="form-control"
                                       value={networkConfig.fqdn.value}
                                       onChange={(e) => this.handleVmConfigUpdate("fqdn", e.target.value, "network")}
                                       onBlur={(e) => this.verifyDns(e.target.value)}
                                />
                                {errorMsgs.fqdn && <span className="help-block">{errorMsgs.fqdn}</span>}
                            </div>
                        </div>

                        <div className={getClassNames("cloudinitInstanceDomainName", errorMsgs)}>
                            <label className="col-md-3 control-label">Engine VM Domain</label>
                            <div className="col-md-3">
                                <input type="text" placeholder="Engine VM Domain"
                                       className="form-control"
                                       value={vmConfig.cloudinitInstanceDomainName.value}
                                       onChange={(e) => this.handleVmConfigUpdate("cloudinitInstanceDomainName", e.target.value, "vm")}
                                />
                                {errorMsgs.cloudinitInstanceDomainName && <span className="help-block">{errorMsgs.cloudinitInstanceDomainName}</span>}
                            </div>
                        </div>

                        <div className={getClassNames("rootPassword", errorMsgs)}>
                            <label className="col-md-3 control-label">Root Password</label>
                            <div className="col-md-3">
                                <input type="password"
                                       className="form-control"
                                       value={vmConfig.rootPassword.value}
                                       onChange={(e) => this.handleVmConfigUpdate("rootPassword", e.target.value, "vm")}
                                />
                                {errorMsgs.rootPassword && <span className="help-block">{errorMsgs.rootPassword}</span>}
                            </div>
                        </div>

                        <div className={getClassNames("confirmRootPassword", errorMsgs)}
                             style={vmConfig.rootPassword.value !== "" ? {} : {display: 'none'}}>
                            <label className="col-md-3 control-label">Confirm Root Password</label>
                            <div className="col-md-3">
                                <input type="password"
                                       className="form-control"
                                       onChange={(e) => this.handleVmConfigUpdate("confirmRootPassword", e.target.value, "vm")}
                                />
                                {errorMsgs.confirmRootPassword && <span className="help-block">{errorMsgs.confirmRootPassword}</span>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="col-md-3 control-label">Root SSH Access</label>
                            <div className="col-md-3">
                                <Selectbox optionList={rootSshAccessOptions}
                                           selectedOption={vmConfig.rootSshAccess.value}
                                           callBack={(e) => this.handleVmConfigUpdate("rootSshAccess", e, "vm")}
                                />
                            </div>
                        </div>

                        <div className={getClassNames("rootSshPubkey", errorMsgs)}>
                            <label className="col-md-3 control-label">Root SSH Public Key</label>
                            <div className="col-md-6">
                                <textarea className="form-control" style={{width: "250px"}}
                                          rows={"2"}
                                          value={vmConfig.rootSshPubkey.value}
                                          onChange={(e) => this.handleVmConfigUpdate("rootSshPubkey", e.target.value, "vm")}
                                />
                                {errorMsgs.rootSshPubkey && <span className="help-block">{errorMsgs.rootSshPubkey}</span>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="col-md-3 control-label">Edit Hosts File &nbsp;
                                <i className="pficon pficon-info" rel="tooltip" id="hosts_file"
                                   title="Add lines for the appliance itself and for this host to /etc/hosts on the engine VM?
                                          Note: ensuring that this host could resolve the engine VM hostname is still up to you."
                                />
                            </label>
                            <div className="col-md-5">
                                <input type="checkbox"
                                       checked={vmConfig.cloudinitVMETCHOSTS.value}
                                       onChange={(e) => this.handleVmConfigUpdate("cloudinitVMETCHOSTS", e.target.checked, "vm")}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="col-md-3 control-label">Engine Setup &nbsp;
                                <i className="pficon pficon-info" rel="tooltip" id="engine_setup"
                                   title="Automatically execute engine-setup on the first boot" />
                            </label>
                            <div className="col-md-1">
                                <input type="checkbox"
                                       checked={vmConfig.cloudinitExecuteEngineSetup.value}
                                       onChange={(e) => this.handleVmConfigUpdate("cloudinitExecuteEngineSetup", e.target.checked, "vm")}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="col-md-3 control-label">Engine Restart &nbsp;
                                <i className="pficon pficon-info" rel="tooltip" id="engine_restart"
                                   title="Automatically restart the engine VM as a monitored service after engine-setup" />
                            </label>
                            <div className="col-md-1">
                                <input type="checkbox"
                                       checked={vmConfig.automateVMShutdown.value}
                                       onChange={(e) => this.handleVmConfigUpdate("automateVMShutdown", e.target.checked, "vm")}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="col-md-3 control-label">Network Configuration</label>
                            <div className="col-md-3">
                                <Selectbox optionList={networkConfigTypes}
                                           selectedOption={vmConfig.networkConfigType.value}
                                           callBack={(e) => this.handleVmConfigUpdate("networkConfigType", e, "vm")}
                                />
                            </div>
                        </div>

                        <div style={this.state.heSetupModel.vm.networkConfigType.value === "static" ? {} : {display: 'none'}}>
                            <div className={getClassNames("cloudinitVMStaticCIDR", errorMsgs)}>
                                <label className="col-md-3 control-label">VM IP Address</label>
                                <div className="col-md-6">
                                    <input type="text" style={{width: "110px"}}
                                           placeholder="192.168.1.2"
                                           title="Enter the desired IP address for the VM."
                                           className="form-control"
                                           value={vmConfig.cloudinitVMStaticCIDR.value}
                                           onChange={(e) => this.handleVmConfigUpdate("cloudinitVMStaticCIDR", e.target.value, "vm")}
                                           onBlur={(e) => this.verifyReverseDns(e.target.value)}
                                    />
                                    {errorMsgs.cloudinitVMStaticCIDR && <span className="help-block">{errorMsgs.cloudinitVMStaticCIDR}</span>}
                                </div>
                            </div>

                            <div className={getClassNames("cloudinitVMDNS", errorMsgs)}>
                                <label className="col-md-3 control-label">DNS Servers</label>
                                <div className="col-md-6">
                                    <div style={{width: "220px"}}>
                                        <MultiRowTextBox values={vmConfig.cloudinitVMDNS.value}
                                                         itemType={"Address"}
                                                         rowLimit={3}
                                                         handleValueUpdate={this.handleDnsAddressUpdate}
                                                         handleValueDelete={this.handleDnsAddressDelete}/>
                                        {errorMsgs.cloudinitVMDNS && <span className="help-block">{errorMsgs.cloudinitVMDNS}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        )
    }

}

WizardVmConfigStep.propTypes = {
    stepName: React.PropTypes.string.isRequired,
    model: React.PropTypes.object.isRequired
};

export default WizardVmConfigStep
