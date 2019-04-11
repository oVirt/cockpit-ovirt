import React from 'react'
import Selectbox from '../../common/Selectbox'
import MultiRowTextBoxContainer from '../MultiRowTextBox/MultiRoxTextBoxContainer'
import { getClassNames } from '../../../helpers/HostedEngineSetupUtil'
import {
    amdCpuTypes,
    deploymentOption,
    deploymentTypes,
    fqdnValidationTypes as fqdnTypes,
    intelCpuTypes,
    messages,
    status
} from "../constants"
import UnmaskablePasswordContainer from "../UnmaskablePassword";

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

const HeWizardVm = ({appliances, applPathSelection, collapsibleSections, cpuArch, deploymentType, errorMsg, errorMsgs,
                        fqdnValidationData, getCidrErrorMsg, gatewayState, interfaces, handleDnsAddressUpdate,
                        handleDnsAddressDelete, handleRootPwdUpdate, handleImportApplianceUpdate, handleVmConfigUpdate,
                        handleCollapsibleSectionChange, heSetupModel, importAppliance, showApplPath, verifyDns,
                        verifyReverseDns, warningMsgs, validateFqdn}) => {
    const vmConfig = heSetupModel.vm;
    const vdsmConfig = heSetupModel.vdsm;
    const networkConfig = heSetupModel.network;

    const maxAvailMem = vmConfig.vmMemSizeMB.range.max.toLocaleString();
    const memWarningMessage = messages.RECOMMENDED_MIN_MEM_AVAIL_WARNING + ` Currently, only ${maxAvailMem}MB is available.`;

    const isOtopiDeployment = deploymentType === deploymentTypes.OTOPI_DEPLOYMENT;
    const isAnsibleDeployment = deploymentType === deploymentTypes.ANSIBLE_DEPLOYMENT;
    const showCloudInitFields = isAnsibleDeployment || (isOtopiDeployment && vmConfig.cloudInitCustomize.value);
    const gatewayPingPending = gatewayState === status.POLLING;

    let advancedSectionIconClasses = "pficon fa he-wizard-collapsible-section-icon ";
    advancedSectionIconClasses += collapsibleSections["advanced"] ? "fa-angle-right" : "fa-angle-down";
    const advancedSectionClasses = collapsibleSections["advanced"] ? "collapse" : "";

    const cidrPrefixClasses = errorMsgs["cloudinitVMStaticCIDRPrefix"] ? "form-group has-error" : "form-group nested-input";

    const vmFqdnClassNames = (fqdnValidationData.vm.state !== status.EMPTY) ||
        (heSetupModel.network.fqdn.value === "") ?
        "fqdn-validation-btn btn btn-default disabled" :
        "fqdn-validation-btn btn btn-default";
    const hostFqdnClassNames = (fqdnValidationData.host.state !== status.EMPTY) ||
        (heSetupModel.network.host_name.value === "") ?
        "fqdn-validation-btn btn btn-default disabled" :
        "fqdn-validation-btn btn btn-default";

    const validatingFQDN = "Validating FQDN..."

    return (
        <div>
            <form className="form-horizontal he-form-container">
                {errorMsg &&
                <div className="row" id="he-errors-on-page-err">
                    <div className="alert alert-danger col-sm-11">
                        <span className="pficon pficon-error-circle-o" />
                        <strong>{errorMsg}</strong>
                    </div>
                </div>
                }

                {vmConfig.vmMemSizeMB.range.max < 4096 &&
                <div className="row" id="he-not-enough-memory-warn">
                    <div className="alert alert-warning col-sm-11">
                        <span className="pficon pficon-warning-triangle-o" />
                        <strong>{memWarningMessage}</strong>
                    </div>
                </div>
                }

                {warningMsgs.fqdnValidationInProgress &&
                <div className="row" id="he-validating-fqdn-warn">
                    <div className="alert alert-warning col-sm-11">
                        <span className="pficon pficon-warning-triangle-o" />
                        <strong>{warningMsgs.fqdnValidationInProgress}</strong>
                    </div>
                </div>
                }

                {warningMsgs.host_name &&
                <div className="row" id="he-invalid-host-fqdn-warn">
                    <div className="alert alert-warning col-sm-11">
                        <span className="pficon pficon-warning-triangle-o" />
                        <strong>{warningMsgs.host_name}</strong>
                    </div>
                </div>
                }

                {warningMsgs.fqdn &&
                <div className="row" id="he-invalid-engine-fqdn-warn">
                    <div className="alert alert-warning col-sm-11">
                        <span className="pficon pficon-warning-triangle-o" />
                        <strong>{warningMsgs.fqdn}</strong>
                    </div>
                </div>
                }

                {isOtopiDeployment &&
                    <span>
                        <div className="form-group">
                            <div className="col-md-9">
                                <h3>Host Settings</h3>
                            </div>
                        </div>

                        <div className={getClassNames("cloudinitVMTZ", errorMsgs)}>
                            <label className="col-md-3 control-label">Host Time Zone</label>
                            <div className="col-md-3">
                                <input type="text" placeholder="Host Time Zone"
                                       className="form-control"
                                       value={vmConfig.cloudinitVMTZ.value}
                                       onChange={(e) => handleVmConfigUpdate("cloudinitVMTZ", e.target.value, "vm")}
                                />
                                {errorMsgs.cloudinitVMTZ && <span className="help-block">{errorMsgs.cloudinitVMTZ}</span>}
                            </div>
                        </div>
                    </span>
                }

                <div className="form-group">
                    <div className="col-md-9">
                        <h3>VM Settings</h3>
                    </div>
                </div>

                <div className={getClassNames("fqdn", errorMsgs)}>
                    <label className="col-md-3 control-label">Engine VM FQDN</label>
                    <div className="col-md-7">
                        <input type="text"
                               disabled={fqdnValidationData.vm.state === status.POLLING ? true : false}
                               placeholder="ovirt-engine.example.com"
                               title="Enter the engine FQDN."
                               className="form-control fqdn-textbox"
                               value={networkConfig.fqdn.value}
                               onChange={(e) => handleVmConfigUpdate("fqdn", e.target.value, "network")}
                               onBlur={() => validateFqdn(fqdnTypes.VM)}
                               id="he-engine-fqdn-input"
                        />
                        <div className="fqdn-status-container">
                            {fqdnValidationData.vm.state === status.SUCCESS && <span className="fqdn-status-icon pficon pficon-ok"/>}
                            {fqdnValidationData.vm.state === status.FAILURE && <span className="fqdn-status-icon pficon pficon-error-circle-o"/>}
                        </div>
                        <span className={fqdnValidationData.vm.state === status.POLLING ? "" : "hidden"}>
                            <span className="field-validation-spinner-container">
                                <div className="spinner spinner-sm blank-slate-pf-icon field-validation-spinner" />
                            </span>
                            <span className="help-block" id="he-validating-engine-fqdn-msg"> {validatingFQDN} </span>
                        </span>
                        {errorMsgs.fqdn && <span className="help-block" id="he-invalid-engine-fqdn-err">{errorMsgs.fqdn}</span>}
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
                               onChange={(e) => handleVmConfigUpdate("vmMACAddr", e.target.value, "vm")}
                               id="he-engine-mac-address-input"
                        />
                        {errorMsgs.vmMACAddr && <span className="help-block">{errorMsgs.vmMACAddr}</span>}
                    </div>
                </div>

                {isOtopiDeployment &&
                    <span>
                        <div className={getClassNames("cpu", errorMsgs) + " he-cpu-select-row"} >
                            <label className="col-md-3 control-label">CPU Type</label>
                            <div className="col-md-4 he-cpu-select-col">
                                <div className="he-cpu-select-container">
                                    <Selectbox optionList={cpuArch.vendor === "Intel" ? intelCpuTypes : amdCpuTypes}
                                               selectedOption={heSetupModel.vdsm.cpu.value}
                                               callBack={(e) => handleVmConfigUpdate("cpu", e, "vdsm")}
                                    />
                                </div>
                            </div>
                            <div className="col-md-1 he-cpu-select-warn-col">
                                {warningMsgs.cpu &&
                                    <i className="pficon pficon-warning-triangle-o he-warning-icon vertical-center"
                                       rel="tooltip" title={warningMsgs.cpu}/>
                                }
                            </div>
                        </div>
                        <div className={getClassNames("cpu", errorMsgs)}>
                            <div className="col-md-3" />
                            <div className="col-md-6">
                                {errorMsgs.cpu && <span className="help-block">{errorMsgs.cpu}</span>}
                            </div>
                        </div>
                    </span>
                }

                <div className="form-group">
                    <label className="col-md-3 control-label">Network Configuration</label>
                    <div className="col-md-3">
                        <Selectbox optionList={networkConfigTypes}
                                   selectedOption={vmConfig.networkConfigType.value}
                                   callBack={(e) => handleVmConfigUpdate("networkConfigType", e, "vm")}
                        />
                    </div>
                </div>

                <div style={heSetupModel.vm.networkConfigType.value === "static" ? {} : {display: 'none'}}>
                    <div className={getClassNames("cloudinitVMStaticCIDR", errorMsgs)}>
                        <label className="col-md-3 control-label">VM IP Address</label>
                        <div className="col-md-6">
                            <input type="text" style={{width: "110px", display: "inline-block"}}
                                   placeholder="192.168.1.2"
                                   title="Enter the desired IP address for the VM."
                                   className="form-control"
                                   value={vmConfig.cloudinitVMStaticCIDR.value}
                                   onChange={(e) => handleVmConfigUpdate("cloudinitVMStaticCIDR", e.target.value, "vm")}
                                   onBlur={(e) => verifyReverseDns(e.target.value)}
                                   id="he-static-ip-address-input" />

                            &nbsp;/&nbsp;
                            <span className={cidrPrefixClasses} id="he-wizard-cidr-container">
                                <input id="he-wizard-cidr"
                                       type="text"
                                       placeholder="24"
                                       className="form-control"
                                       value={vmConfig.cloudinitVMStaticCIDRPrefix.value}
                                       onChange={(e) => handleVmConfigUpdate("cloudinitVMStaticCIDRPrefix", e.target.value, "vm")}
                                />
                            </span>
                            {(errorMsgs.cloudinitVMStaticCIDRPrefix || errorMsgs.cloudinitVMStaticCIDR) &&
                                <span className="has-error">
                                    <span className="help-block">{getCidrErrorMsg()}</span>
                                </span>
                            }
                        </div>
                    </div>

                    <div className={getClassNames("gateway", errorMsgs)}>
                        <label className="col-md-3 control-label">Gateway Address</label>
                        <div className="col-md-6">
                            <input type="text" style={{width: "110px"}}
                                   title="Enter a pingable gateway address."
                                   className="form-control"
                                   value={networkConfig.gateway.value}
                                // onBlur={(e) => this.checkGatewayPingability(e.target.value)}
                                   onChange={(e) => handleVmConfigUpdate("gateway", e.target.value, "network")}
                                   id="he-static-ip-gateway-input" />
                            {errorMsgs.gateway && <span className="help-block" id="he-static-ip-invalid-gateway">{errorMsgs.gateway}</span>}
                            {gatewayPingPending &&
                            <div className="gateway-message-container">
                                <span><div className="spinner" /></span>
                                <span className="gateway-message" id="he-static-ip-verifying-gateway">Verifying IP address...</span>
                            </div>
                            }
                        </div>
                    </div>

                    <div className={getClassNames("cloudinitVMDNS", errorMsgs)}>
                        <label className="col-md-3 control-label">DNS Servers</label>
                        <div className="col-md-6">
                            <div style={{width: "220px"}}>
                                <MultiRowTextBoxContainer values={vmConfig.cloudinitVMDNS.value}
                                                          itemType={"Address"}
                                                          rowLimit={3}
                                                          handleValueUpdate={handleDnsAddressUpdate}
                                                          handleValueDelete={handleDnsAddressDelete}/>
                                {errorMsgs.cloudinitVMDNS &&
                                    <span className="help-block" id="he-wizard-dns-error-container">
                                        {errorMsgs.cloudinitVMDNS}
                                    </span>
                                }
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label className="col-md-3 control-label">Bridge Interface</label>
                    <div className="col-md-6">
                        <div style={{width: "120px"}}>
                            <Selectbox optionList={interfaces}
                                       selectedOption={networkConfig.bridgeIf.value}
                                       callBack={(e) => handleVmConfigUpdate("bridgeIf", e, "network")}
                            />
                        </div>
                    </div>
                </div>

                <div className={getClassNames("cloudinitRootPwd", errorMsgs)}>
                    <label className="col-md-3 control-label">Root Password</label>
                    <div className="col-md-3">
                        <UnmaskablePasswordContainer value={vmConfig.cloudinitRootPwd.value}
                                                     onChangeHandler={handleRootPwdUpdate}
                                                     id="he-cloudinit-root-pwd-input"/>
                        {errorMsgs.cloudinitRootPwd && <span className="help-block">{errorMsgs.cloudinitRootPwd}</span>}
                    </div>
                </div>

                <div className="form-group">
                    <label className="col-md-3 control-label">Root SSH Access</label>
                    <div className="col-md-3">
                        <Selectbox optionList={rootSshAccessOptions}
                                   selectedOption={vmConfig.rootSshAccess.value}
                                   callBack={(e) => handleVmConfigUpdate("rootSshAccess", e, "vm")}
                        />
                    </div>
                </div>

                <div className={getClassNames("vmVCpus", errorMsgs)}>
                    <label className="col-md-3 control-label">Number of Virtual CPUs</label>
                    <div className="col-md-6">
                        <input type="number" style={{width: "60px"}}
                               min={vmConfig.vmVCpus.range.min}
                               max={vmConfig.vmVCpus.range.max}
                               placeholder="Number of CPUs"
                               title="Select number of virtual CPUs."
                               className="form-control"
                               value={vmConfig.vmVCpus.value}
                               onChange={(e) => handleVmConfigUpdate("vmVCpus", e.target.value, "vm")}
                               id="he-vcpus-number-input"
                        />
                        {errorMsgs.vmVCpus && <span className="help-block">{errorMsgs.vmVCpus}</span>}
                    </div>
                </div>

                <div className={getClassNames("vmMemSizeMB", errorMsgs)}>
                    <label className="col-md-3 control-label">Memory Size (MiB)</label>
                    <div className="col-md-6 he-text-with-units">
                        <input type="number"
                               min={vmConfig.vmMemSizeMB.range.min}
                               max={vmConfig.vmMemSizeMB.range.max}
                               placeholder="Allocated memory"
                               title="Enter the allocated memory for the VM."
                               className="form-control he-mem-input"
                               value={vmConfig.vmMemSizeMB.value}
                               onChange={(e) => handleVmConfigUpdate("vmMemSizeMB", e.target.value, "vm")}
                               id="he-memory-size-input"
                        />
                        <span className="info-block">{vmConfig.vmMemSizeMB.range.max.toLocaleString()}MB available</span>
                        {errorMsgs.vmMemSizeMB && <span className="help-block">{errorMsgs.vmMemSizeMB}</span>}
                    </div>
                </div>

                {isOtopiDeployment &&
                    <div className="form-group">
                        <label className="col-md-3 control-label">Console Type</label>
                        <div className="col-md-2">
                            <Selectbox optionList={consoleTypes}
                                       selectedOption={vdsmConfig.consoleType.value}
                                       callBack={(e) => handleVmConfigUpdate("consoleType", e, "vdsm")}
                            />
                        </div>
                    </div>
                }

                {isOtopiDeployment &&
                    <div className="form-group">
                        <label className="col-md-3 control-label">Use Cloud-Init &nbsp;
                            <i className="pficon pficon-info he-wizard-info-icon" rel="tooltip"
                               title="Use cloud-init to customize the appliance on the first boot" />
                        </label>
                        <div className="col-md-3">
                            <input type="checkbox"
                                   checked={vmConfig.cloudInitCustomize.value}
                                   onChange={(e) => handleVmConfigUpdate("cloudInitCustomize", e.target.checked, "vm")}
                            />
                        </div>
                    </div>
                }

                <div style={showCloudInitFields ? {} : {display: 'none'}}>
                    {isOtopiDeployment &&
                        <div className="form-group">
                            <label className="col-md-3 control-label">Cloud-Init Image</label>
                            <div className="col-md-3">
                                <Selectbox optionList={cloudInitOptions}
                                           selectedOption={vmConfig.cloudInitISO.value}
                                           callBack={(e) => handleVmConfigUpdate("cloudInitISO", e, "vm")}
                                />
                            </div>
                        </div>
                    }

                    <div className="form-group">
                        <div className="col-md-9">
                            <span className={advancedSectionIconClasses} />
                            <h3 className="he-wizard-collapsible-section-header">
                                <a className="he-wizard-collapse-section-link"
                                   onClick={(e) => handleCollapsibleSectionChange("advanced")}
                                   id="he-advanced-menu">
                                    Advanced
                                </a>
                            </h3>
                        </div>
                    </div>

                    <span className={advancedSectionClasses}>
                        <div className={getClassNames("rootSshPubkey", errorMsgs)}>
                            <label className="col-md-3 control-label">Root SSH Public Key</label>
                            <div className="col-md-6">
                                    <textarea className="form-control" style={{width: "250px"}}
                                              rows={"2"}
                                              value={vmConfig.rootSshPubkey.value}
                                              onChange={(e) => handleVmConfigUpdate("rootSshPubkey", e.target.value, "vm")}
                                              id="he-ssh-pubkey-input"
                                    />
                                {errorMsgs.rootSshPubkey && <span className="help-block">{errorMsgs.rootSshPubkey}</span>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="col-md-3 control-label">Edit Hosts File
                                <i className="pficon pficon-info he-wizard-info-icon" rel="tooltip" id="hosts_file"
                                   title="Add lines for the appliance itself and for this host to /etc/hosts on the engine VM?
                                              Note: ensuring that this host could resolve the engine VM hostname is still up to you."
                                />
                            </label>
                            <div className="col-md-5">
                                <input type="checkbox"
                                       checked={vmConfig.cloudinitVMETCHOSTS.value}
                                       onChange={(e) => handleVmConfigUpdate("cloudinitVMETCHOSTS", e.target.checked, "vm")}
                                       id="he-edit-etc-hosts-chkbox"
                                />
                            </div>
                        </div>

                        <div className={getClassNames("bridgeName", errorMsgs)}>
                            <label className="col-md-3 control-label">Bridge Name</label>
                            <div className="col-md-6">
                                <input type="text" style={{width: "110px"}}
                                   title="Enter the bridge name."
                                   className="form-control"
                                   value={networkConfig.bridgeName.value}
                                   onChange={(e) => handleVmConfigUpdate("bridgeName", e.target.value, "network")}
                                   id="he-bridge-name-input"/>
                                {errorMsgs.bridgeName && <span className="help-block">{errorMsgs.bridgeName}</span>}
                            </div>
                        </div>

                        <div className={getClassNames("gateway", errorMsgs)}>
                            <label className="col-md-3 control-label">Gateway Address</label>
                            <div className="col-md-6">
                                <input type="text" style={{width: "110px"}}
                                       title="Enter a pingable gateway address."
                                       className="form-control"
                                       value={networkConfig.gateway.value}
                                    // onBlur={(e) => this.checkGatewayPingability(e.target.value)}
                                       onChange={(e) => handleVmConfigUpdate("gateway", e.target.value, "network")}
                                       id="he-default-gateway-input" />
                                {errorMsgs.gateway && <span className="help-block" id="he-invalid-default-gateway-err">{errorMsgs.gateway}</span>}
                                {gatewayPingPending &&
                                   <div className="gateway-message-container">
                                       <span><div className="spinner" /></span>
                                       <span className="gateway-message" id="he-verifying-default-gateway-msg">Verifying IP address...</span>
                                   </div>
                                }
                            </div>
                        </div>

                        {isOtopiDeployment &&
                            <span>
                                <div className="form-group">
                                    <label className="col-md-3 control-label">Engine Setup
                                        <i className="pficon pficon-info he-wizard-info-icon" rel="tooltip" id="engine_setup"
                                           title="Automatically execute engine-setup on the first boot" />
                                    </label>
                                    <div className="col-md-1">
                                        <input type="checkbox"
                                               checked={vmConfig.cloudinitExecuteEngineSetup.value}
                                               onChange={(e) => handleVmConfigUpdate("cloudinitExecuteEngineSetup", e.target.checked, "vm")}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="col-md-3 control-label">Engine Restart
                                        <i className="pficon pficon-info he-wizard-info-icon" rel="tooltip" id="engine_restart"
                                           title="Automatically restart the engine VM as a monitored service after engine-setup" />
                                    </label>
                                    <div className="col-md-1">
                                        <input type="checkbox"
                                               checked={vmConfig.automateVMShutdown.value}
                                               onChange={(e) => handleVmConfigUpdate("automateVMShutdown", e.target.checked, "vm")}
                                        />
                                    </div>
                                </div>
                            </span>
                        }

                        <div className={getClassNames("host_name", errorMsgs)}>
                            <label className="col-md-3 control-label">Host FQDN</label>
                            <div className="col-md-7">
                                <input type="text"
                                       disabled={fqdnValidationData.host.state === status.POLLING ? true : false}
                                       placeholder="engine-host.example.com"
                                       title="Enter the host's FQDN."
                                       className="form-control fqdn-textbox"
                                       value={networkConfig.host_name.value}
                                       onChange={(e) => handleVmConfigUpdate("host_name", e.target.value, "network")}
                                       onBlur={() => validateFqdn(fqdnTypes.HOST)}
                                       id="he-host-fqdn-input"
                                />
                                <div className="fqdn-status-container">
                                    {fqdnValidationData.host.state === status.SUCCESS && <span className="fqdn-status-icon pficon pficon-ok"/>}
                                    {fqdnValidationData.host.state === status.FAILURE && <span className="fqdn-status-icon pficon pficon-error-circle-o"/>}
                                </div>
                                <span className={fqdnValidationData.host.state === status.POLLING ? "" : "hidden"} id="he-validating-host-fqdn-msg">
                                    <span className="field-validation-spinner-container">
                                        <div className="spinner spinner-sm blank-slate-pf-icon field-validation-spinner" />
                                    </span>
                                    <span className="help-block"> {validatingFQDN} </span>
                                </span>
                                {errorMsgs.host_name && <span className="help-block" id="he-invalid-host-fqdn-err">{errorMsgs.host_name}</span>}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="col-md-3 control-label">Apply OpenSCAP profile
                                <i className="pficon pficon-info he-wizard-info-icon" rel="tooltip" id="hosts_file"
                                   title="Apply a default OpenSCAP security profile on the engine VM"
                                />
                            </label>
                            <div className="col-md-5">
                                <input type="checkbox"
                                       checked={vmConfig.applyOpenSCAP.value}
                                       onChange={(e) => handleVmConfigUpdate("applyOpenSCAP", e.target.checked, "vm")}
                                       id="he-apply-openscap-chkbox"
                                />
                            </div>
                        </div>
                    </span>
                </div>
            </form>
        </div>
    )
};

export default HeWizardVm;
