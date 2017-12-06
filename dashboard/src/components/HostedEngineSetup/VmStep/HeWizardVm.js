import React from 'react'
import Selectbox from '../../common/Selectbox'
import MultiRowTextBoxContainer from '../MultiRowTextBox/MultiRoxTextBoxContainer'
import { getClassNames } from '../../../helpers/HostedEngineSetupUtil'
import { amdCpuTypes, intelCpuTypes } from "../constants"

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

const HeWizardVm = ({appliances, applPathSelection, cpuArch, errorMsg, errorMsgs, handleDnsAddressUpdate,
                    handleDnsAddressDelete, handleImportApplianceUpdate, handleVmConfigUpdate, heSetupModel,
                    importAppliance, showApplPath, verifyDns, verifyReverseDns, warningMsgs }) => {
    const vmConfig = heSetupModel.vm;
    const vdsmConfig = heSetupModel.vdsm;
    const storageConfig = heSetupModel.storage;
    const networkConfig = heSetupModel.network;

    return (
        <div>
            <form className="form-horizontal he-form-container">
                {errorMsg &&
                <div className="row" style={{marginLeft: "40px"}}>
                    <div className="alert alert-danger col-sm-8">
                        <span className="pficon pficon-error-circle-o" />
                        <strong>{errorMsg}</strong>
                    </div>
                </div>
                }

                <div className="form-group">
                    <label className="col-md-3 control-label">Auto-import Appliance</label>
                    <div className="col-md-3">
                        <input type="checkbox"
                               checked={importAppliance}
                               onChange={(e) => handleImportApplianceUpdate(e.target.checked)}
                        />
                    </div>
                </div>

                <div style={importAppliance ? {display: 'none'} : {}}>
                    <div className="form-group">
                        <label className="col-md-3 control-label">Appliance File</label>
                        <div className="col-md-6">
                            <Selectbox optionList={appliances}
                                       selectedOption={applPathSelection}
                                       callBack={(e) => handleVmConfigUpdate("ovfArchiveSelect", e, "vm")}
                            />
                        </div>
                    </div>

                    <div className={getClassNames("ovfArchive", errorMsgs)}
                         style={showApplPath ? {} : { display: 'none' }}>
                        <label className="col-md-3 control-label">Appliance File Path</label>
                        <div className="col-md-6">
                            <input type="text" placeholder="Installation File Path"
                                   title="Enter the path for the installation file to install."
                                   className="form-control"
                                   value={vmConfig.ovfArchive.value}
                                   onChange={(e) => handleVmConfigUpdate("ovfArchive", e.target.value, "vm")}
                            />
                            {errorMsgs.ovfArchive && <span className="help-block">{errorMsgs.ovfArchive}</span>}
                        </div>
                    </div>
                </div>

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
                               onChange={(e) => handleVmConfigUpdate("vmVCpus", e.target.value, "vm")}
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
                               onChange={(e) => handleVmConfigUpdate("imgSizeGB", e.target.value, "storage")}
                        />
                        {errorMsgs.imgSizeGB && <span className="help-block">{errorMsgs.imgSizeGB}</span>}
                    </div>
                </div>

                <div className={getClassNames("vmMemSizeMB", errorMsgs)}>
                    <label className="col-md-3 control-label">Memory Size (MB)</label>
                    <div className="col-md-6 he-text-with-units">
                        <input type="number"
                               min={vmConfig.vmMemSizeMB.range.min}
                               max={vmConfig.vmMemSizeMB.range.max}
                               placeholder="Disk Size"
                               title="Enter the disk size for the VM."
                               className="form-control he-mem-input"
                               value={vmConfig.vmMemSizeMB.value}
                               onChange={(e) => handleVmConfigUpdate("vmMemSizeMB", e.target.value, "vm")}
                        />
                        <span className="info-block">{vmConfig.vmMemSizeMB.range.max.toLocaleString() + " "} MB available</span>
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
                               onChange={(e) => handleVmConfigUpdate("vmMACAddr", e.target.value, "vm")}
                        />
                        {errorMsgs.vmMACAddr && <span className="help-block">{errorMsgs.vmMACAddr}</span>}
                    </div>
                </div>

                <div className="form-group">
                    <label className="col-md-3 control-label">Console Type</label>
                    <div className="col-md-2">
                        <Selectbox optionList={consoleTypes}
                                   selectedOption={vdsmConfig.consoleType.value}
                                   callBack={(e) => handleVmConfigUpdate("consoleType", e, "vdsm")}
                        />
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

                <div className="form-group">
                    <div className="col-md-9 he-stage-header">
                        <h3>Cloud Init Settings</h3>
                    </div>
                </div>

                <div className="form-group">
                    <label className="col-md-3 control-label">Use Cloud-Init &nbsp;
                        <i className="pficon pficon-info info-icon" rel="tooltip"
                           title="Use cloud-init to customize the appliance on the first boot" />
                    </label>
                    <div className="col-md-3">
                        <input type="checkbox"
                               checked={vmConfig.cloudInitCustomize.value}
                               onChange={(e) => handleVmConfigUpdate("cloudInitCustomize", e.target.checked, "vm")}
                        />
                    </div>
                </div>

                <div style={heSetupModel.vm.cloudInitCustomize.value ? {} : {display: 'none'}}>
                    <div className="form-group">
                        <label className="col-md-3 control-label">Cloud-Init Image</label>
                        <div className="col-md-3">
                            <Selectbox optionList={cloudInitOptions}
                                       selectedOption={vmConfig.cloudInitISO.value}
                                       callBack={(e) => handleVmConfigUpdate("cloudInitISO", e, "vm")}
                            />
                        </div>
                    </div>

                    <div className={getClassNames("cloudinitInstanceHostName", errorMsgs)}>
                        <label className="col-md-3 control-label">Engine VM Host Name</label>
                        <div className="col-md-3">
                            <input type="text" placeholder="Engine VM Host Name"
                                   className="form-control"
                                   value={vmConfig.cloudinitInstanceHostName.value}
                                   onChange={(e) => handleVmConfigUpdate("cloudinitInstanceHostName", e.target.value, "vm")}
                            />
                            {errorMsgs.cloudinitInstanceHostName && <span className="help-block">{errorMsgs.cloudinitInstanceHostName}</span>}
                        </div>
                    </div>

                    <div className={getClassNames("cloudinitInstanceDomainName", errorMsgs)}>
                        <label className="col-md-3 control-label he-long-label-name">Engine VM Domain Name</label>
                        <div className="col-md-3">
                            <input type="text" placeholder="Engine VM Domain"
                                   className="form-control"
                                   value={vmConfig.cloudinitInstanceDomainName.value}
                                   onChange={(e) => handleVmConfigUpdate("cloudinitInstanceDomainName", e.target.value, "vm")}
                            />
                            {errorMsgs.cloudinitInstanceDomainName && <span className="help-block">{errorMsgs.cloudinitInstanceDomainName}</span>}
                        </div>
                    </div>

                    <div className={getClassNames("fqdn", errorMsgs)}>
                        <label className="col-md-3 control-label">Engine VM FQDN</label>
                        <div className="col-md-4">
                            <label className="value-label" type="text">{networkConfig.fqdn.value}</label>
                            {errorMsgs.fqdn && <span className="help-block">{errorMsgs.fqdn}</span>}
                        </div>
                    </div>

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
                                <input type="text" style={{width: "110px"}}
                                       placeholder="192.168.1.2"
                                       title="Enter the desired IP address for the VM."
                                       className="form-control"
                                       value={vmConfig.cloudinitVMStaticCIDR.value}
                                       onChange={(e) => handleVmConfigUpdate("cloudinitVMStaticCIDR", e.target.value, "vm")}
                                       onBlur={(e) => verifyReverseDns(e.target.value)}
                                />
                                {errorMsgs.cloudinitVMStaticCIDR && <span className="help-block">{errorMsgs.cloudinitVMStaticCIDR}</span>}
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
                                    {errorMsgs.cloudinitVMDNS && <span className="help-block">{errorMsgs.cloudinitVMDNS}</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={getClassNames("cloudinitRootPassword", errorMsgs)}>
                        <label className="col-md-3 control-label">Root Password</label>
                        <div className="col-md-3">
                            <input type="password"
                                   className="form-control"
                                   value={vmConfig.cloudinitRootPassword.value}
                                   onChange={(e) => handleVmConfigUpdate("cloudinitRootPassword", e.target.value, "vm")}
                            />
                            {errorMsgs.cloudinitRootPassword && <span className="help-block">{errorMsgs.cloudinitRootPassword}</span>}
                        </div>
                    </div>

                    <div className={getClassNames("confirmRootPassword", errorMsgs)}
                         style={vmConfig.cloudinitRootPassword.value !== "" ? {} : {display: 'none'}}>
                        <label className="col-md-3 control-label">Confirm Root Password</label>
                        <div className="col-md-3">
                            <input type="password"
                                   className="form-control"
                                   value={vmConfig.confirmRootPassword.value}
                                   onChange={(e) => handleVmConfigUpdate("confirmRootPassword", e.target.value, "vm")}
                            />
                            {errorMsgs.confirmRootPassword && <span className="help-block">{errorMsgs.confirmRootPassword}</span>}
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

                    <div className={getClassNames("rootSshPubkey", errorMsgs)}>
                        <label className="col-md-3 control-label">Root SSH Public Key</label>
                        <div className="col-md-6">
                                <textarea className="form-control" style={{width: "250px"}}
                                          rows={"2"}
                                          value={vmConfig.rootSshPubkey.value}
                                          onChange={(e) => handleVmConfigUpdate("rootSshPubkey", e.target.value, "vm")}
                                />
                            {errorMsgs.rootSshPubkey && <span className="help-block">{errorMsgs.rootSshPubkey}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="col-md-3 control-label">Edit Hosts File &nbsp;
                            <i className="pficon pficon-info info-icon" rel="tooltip" id="hosts_file"
                               title="Add lines for the appliance itself and for this host to /etc/hosts on the engine VM?
                                          Note: ensuring that this host could resolve the engine VM hostname is still up to you."
                            />
                        </label>
                        <div className="col-md-5">
                            <input type="checkbox"
                                   checked={vmConfig.cloudinitVMETCHOSTS.value}
                                   onChange={(e) => handleVmConfigUpdate("cloudinitVMETCHOSTS", e.target.checked, "vm")}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="col-md-3 control-label">Engine Setup &nbsp;
                            <i className="pficon pficon-info info-icon" rel="tooltip" id="engine_setup"
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
                        <label className="col-md-3 control-label">Engine Restart &nbsp;
                            <i className="pficon pficon-info info-icon" rel="tooltip" id="engine_restart"
                               title="Automatically restart the engine VM as a monitored service after engine-setup" />
                        </label>
                        <div className="col-md-1">
                            <input type="checkbox"
                                   checked={vmConfig.automateVMShutdown.value}
                                   onChange={(e) => handleVmConfigUpdate("automateVMShutdown", e.target.checked, "vm")}
                            />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
};

export default HeWizardVm;