import React, { Component } from 'react'
import Selectbox from '../common/Selectbox'
import MultiRowTextBox from './MultiRowTextBox'
import classNames from 'classnames'
import { AnsibleUtil, TimeZone, checkDns, checkReverseDns } from '../../helpers/HostedEngineSetupUtil'

const bootDevices = [
    { key: "cdrom", title: "cdrom" },
    { key: "disk", title: "disk" },
    { key: "network", title: "network" }
];

const intelCpuTypes = [
    { key: "Broadwell", title: "Intel Broadwell Family" },
    { key: "Broadwell-noTSX", title: "Intel Broadwell-noTSX Family" },
    { key: "Haswell", title: "Intel Haswell Family" },
    { key: "Haswell-noTSX", title: "Intel Haswell-noTSX Family" },
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
            heSetupModel: props.heSetupModel,
            showCloudInitSettings: true,
            showNetworkConfigDialog: false,
            showApplPath: false,
            applPathSelection: "",
            appliances: [],
            cpuArch: {},
            errorMsg: "",
            errorMsgs: {}
        };

        this.ansible = new AnsibleUtil();
        this.handleVmConfigUpdate = this.handleVmConfigUpdate.bind(this);
        this.setTimeZone = this.setTimeZone.bind(this);
        this.handleDnsAddressDelete = this.handleDnsAddressDelete.bind(this);
        this.handleDnsAddressUpdate = this.handleDnsAddressUpdate.bind(this);
        this.setApplianceFiles = this.setApplianceFiles.bind(this);
        this.verifyDns = this.verifyDns.bind(this);
        this.verifyReverseDns = this.verifyReverseDns.bind(this);
        this.getCpuArchitecture = this.getCpuArchitecture.bind(this);
    }

    setApplianceFiles() {
        let appliances = [];

        let applData = this.ansible.getTaskData(this.props.systemData, "Get appliance files");
        const applList = applData["stdout_lines"];

        if (typeof applList !== 'undefined' && applList.length > 0) {
            applList.forEach(function (appliance) {
                appliances.push({key: appliance, title: appliance});
            });
        }

        appliances.push({key: "Manually Select", title: "Manually Select" });

        if (appliances[0].key === "Manually Select") {
            this.setState({ showApplPath: true });
        }

        this.setState({ appliances, applPathSelection: appliances[0].key });
    }

    handleVmConfigUpdate(property, value, configType) {
        const heSetupModel = this.state.heSetupModel;
        const errorMsgs = this.state.errorMsgs;

        if (property === "installationFileSelect" && value === "Manually Select") {
            heSetupModel.vm.installationFile.value = "";
            this.setState({ showApplPath: true, applPathSelection: value, heSetupModel });
            return;
        } else if (property === "installationFileSelect" && value !== "Manually Select") {
            this.setState({ showApplPath: false, applPathSelection: value });
            property = "installationFile";
        }

        heSetupModel[configType][property].value = value;

        if (property === "networkConfigType") {
            let showDialog = value === "static";
            this.setState({ showNetworkConfigDialog: showDialog });
            this.setNetworkConfigDisplaySettings(value);
        }

        if (property === "cloudInitCustomize") {
            this.setState({ showCloudInitSettings: value });
        }

        this.setState({ heSetupModel, errorMsgs });
    }

    setNetworkConfigDisplaySettings(networkConfigType) {
        const vmConfig = this.state.heSetupModel.vm;

        if (networkConfigType === "dhcp") {
            vmConfig.cloudinitVMDNS.showInReview = false;
            vmConfig.cloudinitVMStaticCIDR.showInReview = false;

            vmConfig.cloudinitVMDNS.useInAnswerFile = false;
            vmConfig.cloudinitVMStaticCIDR.useInAnswerFile = false;
        } else if (networkConfigType === "static") {
            vmConfig.cloudinitVMDNS.showInReview = true;
            vmConfig.cloudinitVMStaticCIDR.showInReview = true;

            vmConfig.cloudinitVMDNS.useInAnswerFile = true;
            vmConfig.cloudinitVMStaticCIDR.useInAnswerFile = true;
        }

        this.setState({ vmConfig });
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
            .done(function(result) {
                console.log("DNS result: " + result);
            })
            .fail(function(error) {
                console.log("Error with DNS resolution: " + error);
            })
    }

    verifyReverseDns(ipAddress) {
        checkReverseDns(ipAddress)
            .done(function(result) {
                console.log("rDNS result: " + result);
            })
            .fail(function(error) {
                console.log("Error with rDNS resolution: " + error);
            })
    }

    getCpuArchitecture() {
        if (this.props.systemData === null) {
            return;
        }

        let modelData = this.ansible.getTaskData(this.props.systemData, "Get CPU model")["stdout"];
        let cpuModel = modelData.replace("\<model\>", "").replace("\</model\>", "").trim();

        let vendorData = this.ansible.getTaskData(this.props.systemData, "Get CPU vendor")["stdout"];
        let cpuVendor = vendorData.replace("\<vendor\>", "").replace("\</vendor\>", "").trim();

        let cpuArch = {
            model: cpuModel,
            vendor: cpuVendor
        };

        this.setState({ cpuArch: cpuArch });
    }

    setTimeZone() {
        const vmConfig = this.state.heSetupModel.vm;
        let that = this;
        const timeZone = new TimeZone();
        timeZone.getTimeZone(function(result) {
            console.log("Time Zone: " + result);
            vmConfig["cloudinitVMTZ"].value = result;
            that.setState({ vmConfig });
        });
    }

    validate() {
        return true
    }

    shouldComponentUpdate(nextProps, nextState){
        if(!this.props.validating && nextProps.validating){
            this.props.validationCallBack(this.validate())
        }
        return true;
    }

    componentWillMount() {
        this.setTimeZone();
        this.setApplianceFiles();
        this.getCpuArchitecture();
    }

    render() {
        const hostClass = classNames(
            "form-group",
            { "has-error": this.errorMsg && this.errorMsg.length > 0 }
        );

        const vmConfig = this.state.heSetupModel.vm;
        const vdsmConfig = this.state.heSetupModel.vdsm;
        const storageConfig = this.state.heSetupModel.storage;
        const networkConfig = this.state.heSetupModel.network;

        return (
            <div>
                {this.state.errorMsg && <div className="alert alert-danger">
                    <span className="pficon pficon-error-circle-o"></span>
                    <strong>{this.state.errorMsg}</strong>
                </div>
                }
                <form className="form-horizontal he-form-container">
                    <div className="form-group">
                        <label className="col-md-3 control-label">Boot Device</label>
                        <div className="col-md-2">
                            <Selectbox optionList={bootDevices}
                                       selectedOption={vmConfig.bootDevice.value}
                                       callBack={(e) => this.handleVmConfigUpdate("bootDevice", e, "vm")}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="col-md-3 control-label">Appliance File</label>
                        <div className="col-md-4">
                            <Selectbox optionList={this.state.appliances}
                                       selectedOption={this.state.applPathSelection}
                                       callBack={(e) => this.handleVmConfigUpdate("installationFileSelect", e, "vm")}
                            />
                        </div>
                    </div>

                    <div className={hostClass} style={this.state.showApplPath ? {} : { display: 'none' }}>
                        <label className="col-md-3 control-label">Appliance File Path</label>
                        <div className="col-md-6">
                            <input type="text" placeholder="Installation File Path"
                                   title="Enter the path for the installation file to install."
                                   className="form-control"
                                   value={vmConfig.installationFile.value}
                                   onChange={(e) => this.handleVmConfigUpdate("installationFile", e.target.value, "vm")}
                            />
                            {this.errorMsg && this.errorMsg.length > 0 &&
                            <span className="help-block">{this.errorMsg}</span>}
                        </div>
                    </div>

                    <br />

                    <div className="form-group">
                        <label className="col-md-3 control-label">CPU Type</label>
                        <div className="col-md-4">
                            <Selectbox optionList={this.state.cpuArch.vendor === "Intel" ? intelCpuTypes : amdCpuTypes}
                                       selectedOption={this.state.cpuArch.model}
                                       callBack={(e) => this.handleVmConfigUpdate("cpu", e, "vdsm")}
                            />
                        </div>
                    </div>

                    <div className={hostClass}>
                        <label className="col-md-3 control-label">Number of Virtual CPUs</label>
                        <div className="col-md-2">
                            <input type="number" placeholder="Number of CPUs"
                                   title="Enter the path for the installation file to install."
                                   className="form-control"
                                   value={vmConfig.vmVCpus.value}
                                   onChange={(e) => this.handleVmConfigUpdate("vmVCpus", e.target.value, "vm")}
                            />
                            {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                        </div>
                    </div>

                    <div className={hostClass}>
                        <label className="col-md-3 control-label">Disk Size</label>
                        <div className="col-md-2 he-text-with-units">
                            <input type="number" placeholder="Disk Size"
                                   title="Enter the disk size for the VM."
                                   className="form-control"
                                   value={storageConfig.imgSizeGB.value}
                                   onChange={(e) => this.handleVmConfigUpdate("imgSizeGB", e.target.value, "storage")}
                            />
                            {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                        </div>
                        <label className="control-label col-md-1 he-input-label">GB</label>
                    </div>

                    <div className={hostClass}>
                        <label className="col-md-3 control-label">Memory Size</label>
                        <div className="col-md-2 he-text-with-units">
                            <input type="number" placeholder="Disk Size"
                                   title="Enter the disk size for the VM."
                                   className="form-control"
                                   value={vmConfig.vmMemSizeMB.value}
                                   onChange={(e) => this.handleVmConfigUpdate("vmMemSizeMB", e.target.value, "vm")}
                            />
                            {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                        </div>
                        <label className="control-label col-md-1 he-input-label">MB</label>
                    </div>

                    <div className={hostClass}>
                        <label className="col-md-3 control-label">MAC Address</label>
                        <div className="col-md-3">
                            <input type="text" placeholder="MAC address"
                                   title="Enter the MAC address for the VM."
                                   className="form-control"
                                   value={vmConfig.vmMACAddr.value}
                                   onChange={(e) => this.handleVmConfigUpdate("vmMACAddr", e.target.value, "vm")}
                            />
                            {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
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

                    <div className={hostClass}>
                        <label className="col-md-3 control-label">Host Time Zone</label>
                        <div className="col-md-3">
                            <input type="text" placeholder="Host Time Zone"
                                   className="form-control"
                                   value={vmConfig.cloudinitVMTZ.value}
                                   onChange={(e) => this.handleVmConfigUpdate("cloudinitVMTZ", e.target.value, "vm")}
                            />
                            {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                        </div>
                    </div>

                    <br />

                    <div className="form-group">
                        <label className="col-md-3 control-label">Use Cloud-Init &nbsp;
                            <i className="pficon pficon-info" rel="tooltip" title="Use cloud-init to customize the appliance on the first boot" />
                        </label>
                        <div className="col-md-3">
                            <input type="checkbox"
                                   checked={vmConfig.cloudInitCustomize.value}
                                   onChange={(e) => this.handleVmConfigUpdate("cloudInitCustomize", e.target.checked, "vm")}
                            />
                        </div>
                    </div>

                    <div style={this.state.showCloudInitSettings ? {} : { display: 'none' }}>
                        <div className="form-group">
                            <label className="col-md-3 control-label">Cloud-Init Image</label>
                            <div className="col-md-3">
                                <Selectbox optionList={cloudInitOptions}
                                           selectedOption={vmConfig.cloudInitISO.value}
                                           callBack={(e) => this.handleVmConfigUpdate("cloudInitISO", e, "vm")}
                                />
                            </div>
                        </div>

                        <div className={hostClass}>
                            <label className="col-md-3 control-label">Engine VM FQDN</label>
                            <div className="col-md-4">
                                <input type="text"
                                       title="Enter the engine FQDN."
                                       className="form-control"
                                       value={networkConfig.fqdn.value}
                                       onChange={(e) => this.handleVmConfigUpdate("fqdn", e.target.value, "network")}
                                       onBlur={(e) => this.verifyDns(e.target.value)}
                                />
                                {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                            </div>
                        </div>

                        <div className={hostClass}>
                            <label className="col-md-3 control-label">Engine VM Domain</label>
                            <div className="col-md-3">
                                <input type="text" placeholder="Engine VM Domain"
                                       className="form-control"
                                       value={vmConfig.cloudinitInstanceDomainName.value}
                                       onChange={(e) => this.handleVmConfigUpdate("cloudinitInstanceDomainName", e.target.value, "vm")}
                                />
                                {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                            </div>
                        </div>

                        <div className={hostClass}>
                            <label className="col-md-3 control-label">Root Password</label>
                            <div className="col-md-3">
                                <input type="password"
                                       className="form-control"
                                       value={vmConfig.rootPassword.value}
                                       onChange={(e) => this.handleVmConfigUpdate("rootPassword", e.target.value, "vm")}
                                />
                                {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                            </div>
                        </div>

                        <div className={hostClass}>
                            <label className="col-md-3 control-label">Confirm Root Password</label>
                            <div className="col-md-3">
                                <input type="password" className="form-control"/>
                                {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
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

                        <div className={hostClass}>
                            <label className="col-md-3 control-label">Root SSH Public Key</label>
                            <div className="col-md-6">
                                <input type="text"
                                       className="form-control"
                                       value={vmConfig.rootSshPubkey.value}
                                       onChange={(e) => this.handleVmConfigUpdate("rootSshPubkey", e.target.value, "vm")}
                                />
                                {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="col-md-3 control-label">Edit Hosts File &nbsp;
                                <i className="pficon pficon-info" rel="tooltip" title="Add lines for the appliance itself and for this host to /etc/hosts on the engine VM" id="blah" />
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
                                <i className="pficon pficon-info" rel="tooltip" title="Automatically execute engine-setup on the first boot" id="blah" />
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
                                <i className="pficon pficon-info" rel="tooltip" title="Automatically restart the engine VM as a monitored service after engine-setup" id="blah" />
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

                        <div style={this.state.showNetworkConfigDialog ? {} : { display: 'none' }}>
                            <div className={hostClass}>
                                <label className="col-md-3 control-label">VM IP Address</label>
                                <div className="col-md-4">
                                    <input type="text" placeholder="host:/path"
                                           title="Enter the desired IP address for the VM."
                                           className="form-control"
                                           value={vmConfig.cloudinitVMStaticCIDR.value}
                                           onChange={(e) => this.handleVmConfigUpdate("cloudinitVMStaticCIDR", e.target.value, "vm")}
                                           onBlur={(e) => this.verifyReverseDns(e.target.value)}
                                    />
                                    {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                                </div>
                            </div>

                            <div className={hostClass}>
                                <label className="col-md-3 control-label">DNS Servers</label>
                                <div className="col-md-4">
                                    <MultiRowTextBox values={vmConfig.cloudinitVMDNS.value}
                                                     itemType={"Address"}
                                                     rowLimit={3}
                                                     handleValueUpdate={this.handleDnsAddressUpdate}
                                                     handleValueDelete={this.handleDnsAddressDelete}/>
                                    {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
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
    heSetupModel: React.PropTypes.object.isRequired
};

export default WizardVmConfigStep
