import React from "react";
import Selectbox from "../../common/Selectbox";
import MultiRowTextBoxContainer from "../MultiRowTextBox/MultiRoxTextBoxContainer";
import { getClassNames } from "../../../helpers/HostedEngineSetupUtil";
import {
	amdCpuTypes,
	deploymentOption,
	deploymentTypes,
	fqdnValidationTypes as fqdnTypes,
	intelCpuTypes,
	messages,
	status,
} from "../constants";
import UnmaskablePasswordContainer from "../UnmaskablePassword";
import CheckboxWithInfo from "./HeWizardVmComponents/CheckboxWithInfo";

const consoleTypes = [
	{ key: "vnc", title: "VNC" },
	{ key: "spice", title: "Spice" },
];

const networkConfigTypes = [
	{ key: "dhcp", title: "DHCP" },
	{ key: "static", title: "Static" },
];

const networkTestTypes = [
	{ key: "dns", title: "DNS" },
	{ key: "ping", title: "Ping" },
	{ key: "tcp", title: "TCP" },
	{ key: "none", title: "None" },
];

const cloudInitOptions = [
	{ key: "generate", title: "Generate" },
	{ key: "existing", title: "Use Existing" },
];

const rootSshAccessOptions = [
	{ key: "yes", title: "Yes" },
	{ key: "no", title: "No" },
	{ key: "without-password", title: "Without Password" },
];

const HeWizardVm = ({
	appliances,
	applPathSelection,
	collapsibleSections,
	cpuArch,
	deploymentType,
	errorMsg,
	errorMsgs,
	fqdnValidationData,
	getCidrErrorMsg,
	gatewayState,
	networkTestState,
	interfaces,
	handleDnsAddressUpdate,
	handleDnsAddressDelete,
	handleRootPwdUpdate,
	handleImportApplianceUpdate,
	handleVmConfigUpdate,
	handleCollapsibleSectionChange,
	heSetupModel,
	importAppliance,
	showApplPath,
	verifyDns,
	verifyReverseDns,
	warningMsgs,
	validateFqdn,
}) => {
	const vmConfig = heSetupModel.vm;
	const vdsmConfig = heSetupModel.vdsm;
	const networkConfig = heSetupModel.network;
	const coreConfig = heSetupModel.core;

	const maxAvailMem = vmConfig.vmMemSizeMB.range.max.toLocaleString();
	const memWarningMessage =
		messages.RECOMMENDED_MIN_MEM_AVAIL_WARNING +
		` Currently, only ${maxAvailMem}MB is available.`;

	const isOtopiDeployment = deploymentType === deploymentTypes.OTOPI_DEPLOYMENT;
	const isAnsibleDeployment =
		deploymentType === deploymentTypes.ANSIBLE_DEPLOYMENT;
	const showCloudInitFields =
		isAnsibleDeployment ||
		(isOtopiDeployment && vmConfig.cloudInitCustomize.value);
	const gatewayPingPending = gatewayState === status.POLLING;
	const networkTestPending = networkTestState === status.POLLING;

	let advancedSectionIconClasses =
		"pficon fa he-wizard-collapsible-section-icon ";
	advancedSectionIconClasses += collapsibleSections["advanced"]
		? "fa-angle-right"
		: "fa-angle-down";
	const advancedSectionClasses = collapsibleSections["advanced"]
		? "collapse"
		: "";

	const cidrPrefixClasses = errorMsgs["cloudinitVMStaticCIDRPrefix"]
		? "form-group has-error"
		: "form-group nested-input";

	const validatingFQDN = "Validating FQDN...";

	const infoNetworkNamingConventionsMessage =
		"If you are using Bonds or VLANs Use the following naming conventions:\n" +
		"- VLAN interfaces: physical_device.VLAN_ID (for example, eth0.23, eth1.128, enp3s0.50).\n" +
		"- Bond interfaces: bond*number* (for example, bond0, bond1).\n" +
		"- VLANs on bond interfaces: bond*number*.VLAN_ID (for example, bond0.50, bond1.128).\n" +
		"* Supported bond modes: active-backup, balance-xor, broadcast, 802.3ad.\n" +
		"* Networking teaming is not supported and will cause errors.\n\n" +
		"NOTE: devices which is not following these conventions, will not appear during installaion at all.";

	const infoEditHostsFileMessage =
		"Add lines for the appliance itself and for this host to /etc/hosts on the engine VM?\n" +
		"Note: ensuring that this host could resolve the engine VM hostname is still up to you.";
	const infoPauseHostMessage =
		"Check this option, if you want to pause installation to make manual adjustments.\n" +
		"This will pause the deployment after engine setup and create a lock-file in\n" +
		"'/tmp' directory which ends with '_he_setup_lock' on machine role was executed.\n" +
		"The Hosted Engine deployment will continue after deleting the lock-file OR\n" +
		"after 24 hours if lock-file has not been deleted.";

	const infoOpenscapProfileMessage =
		"Apply a default OpenSCAP security profile on the engine VM";

	const infoAppliancePathMessage =
		"Enter the full path to local appliance file, OR leave it empty for default";

	const checkboxWithInfoProps = [
		{
			label: "Edit Hosts File",
			idInfo: "hosts_file",
			iconTitle: infoEditHostsFileMessage,
			checked: vmConfig.cloudinitVMETCHOSTS.value,
			propName: "cloudinitVMETCHOSTS",
			configType: "vm",
			idInput: "he-edit-etc-hosts-chkbox",
		},
		{
			label: "Pause Host",
			idInfo: "pause_host",
			iconTitle: infoPauseHostMessage,
			checked: coreConfig.pauseHost.value,
			propName: "pauseHost",
			configType: "core",
			idInput: "he-pause-host-chkbox",
		},
		{
			label: "Apply OpenSCAP profile",
			idInfo: "openscap_profile",
			iconTitle: infoOpenscapProfileMessage,
			checked: vmConfig.applyOpenSCAP.value,
			propName: "applyOpenSCAP",
			configType: "vm",
			idInput: "he-apply-openscap-chkbox",
		},
	];

	return (
		<div>
			<form className="form-horizontal he-form-container">
				{errorMsg && (
					<div className="row" id="he-errors-on-page-err">
						<div className="alert alert-danger col-sm-11">
							<span className="pficon pficon-error-circle-o" />
							<strong>{errorMsg}</strong>
						</div>
					</div>
				)}

				{vmConfig.vmMemSizeMB.range.max < 4096 && (
					<div className="row" id="he-not-enough-memory-warn">
						<div className="alert alert-warning col-sm-11">
							<span className="pficon pficon-warning-triangle-o" />
							<strong>{memWarningMessage}</strong>
						</div>
					</div>
				)}

				{warningMsgs.fqdnValidationInProgress && (
					<div className="row" id="he-validating-fqdn-warn">
						<div className="alert alert-warning col-sm-11">
							<span className="pficon pficon-warning-triangle-o" />
							<strong>{warningMsgs.fqdnValidationInProgress}</strong>
						</div>
					</div>
				)}

				{warningMsgs.host_name && (
					<div className="row" id="he-invalid-host-fqdn-warn">
						<div className="alert alert-warning col-sm-11">
							<span className="pficon pficon-warning-triangle-o" />
							<strong>{warningMsgs.host_name}</strong>
						</div>
					</div>
				)}

				{warningMsgs.fqdn && (
					<div className="row" id="he-invalid-engine-fqdn-warn">
						<div className="alert alert-warning col-sm-11">
							<span className="pficon pficon-warning-triangle-o" />
							<strong>{warningMsgs.fqdn}</strong>
						</div>
					</div>
				)}
				{isOtopiDeployment && (
					<span>
						<div className="form-group">
							<div className="col-md-9">
								<h3>Host Settings</h3>
							</div>
						</div>

						<div className={getClassNames("cloudinitVMTZ", errorMsgs)}>
							<label className="col-md-3 control-label">Host Time Zone</label>
							<div className="col-md-3">
								<input
									type="text"
									placeholder="Host Time Zone"
									className="form-control"
									value={vmConfig.cloudinitVMTZ.value}
									onChange={(e) =>
										handleVmConfigUpdate("cloudinitVMTZ", e.target.value, "vm")
									}
								/>
								{errorMsgs.cloudinitVMTZ && (
									<span className="help-block">{errorMsgs.cloudinitVMTZ}</span>
								)}
							</div>
						</div>
					</span>
				)}

				<div className="form-group">
					<div className="col-md-9">
						<h3>VM Settings</h3>
					</div>
				</div>
				<div className={getClassNames("fqdn", errorMsgs)}>
					<label className="col-md-3 control-label">Engine VM FQDN</label>
					<div className="col-md-7">
						<input
							type="text"
							disabled={
								fqdnValidationData.vm.state === status.POLLING ? true : false
							}
							placeholder="ovirt-engine.example.com"
							title="Enter the engine FQDN."
							className="form-control fqdn-textbox"
							value={networkConfig.fqdn.value}
							onChange={(e) =>
								handleVmConfigUpdate("fqdn", e.target.value, "network")
							}
							onBlur={() => validateFqdn(fqdnTypes.VM)}
							id="he-engine-fqdn-input"
						/>
						<div className="fqdn-status-container">
							{fqdnValidationData.vm.state === status.SUCCESS && (
								<span className="fqdn-status-icon pficon pficon-ok" />
							)}
							{fqdnValidationData.vm.state === status.FAILURE && (
								<span className="fqdn-status-icon pficon pficon-error-circle-o" />
							)}
						</div>
						<span
							className={
								fqdnValidationData.vm.state === status.POLLING ? "" : "hidden"
							}
						>
							<span className="field-validation-spinner-container">
								<div className="spinner spinner-sm blank-slate-pf-icon field-validation-spinner" />
							</span>
							<span className="help-block" id="he-validating-engine-fqdn-msg">
								{" "}
								{validatingFQDN}{" "}
							</span>
						</span>
						{errorMsgs.fqdn && (
							<span className="help-block" id="he-invalid-engine-fqdn-err">
								{errorMsgs.fqdn}
							</span>
						)}
					</div>
				</div>

				<div className={getClassNames("vmMACAddr", errorMsgs)}>
					<label className="col-md-3 control-label">MAC Address</label>
					<div className="col-md-6">
						<input
							type="text"
							style={{ width: "120px" }}
							placeholder="00:11:22:33:44:55"
							title="Enter the MAC address for the VM."
							className="form-control"
							value={vmConfig.vmMACAddr.value}
							onChange={(e) =>
								handleVmConfigUpdate("vmMACAddr", e.target.value, "vm")
							}
							id="he-engine-mac-address-input"
						/>
						{errorMsgs.vmMACAddr && (
							<span className="help-block">{errorMsgs.vmMACAddr}</span>
						)}
					</div>
				</div>
				{isOtopiDeployment && (
					<span>
						<div
							className={getClassNames("cpu", errorMsgs) + " he-cpu-select-row"}
						>
							<label className="col-md-3 control-label">CPU Type</label>
							<div className="col-md-4 he-cpu-select-col">
								<div className="he-cpu-select-container">
									<Selectbox
										optionList={
											cpuArch.vendor === "Intel" ? intelCpuTypes : amdCpuTypes
										}
										selectedOption={heSetupModel.vdsm.cpu.value}
										callBack={(e) => handleVmConfigUpdate("cpu", e, "vdsm")}
									/>
								</div>
							</div>
							<div className="col-md-1 he-cpu-select-warn-col">
								{warningMsgs.cpu && (
									<i
										className="pficon pficon-warning-triangle-o he-warning-icon vertical-center"
										rel="tooltip"
										title={warningMsgs.cpu}
									/>
								)}
							</div>
						</div>
						<div className={getClassNames("cpu", errorMsgs)}>
							<div className="col-md-3" />
							<div className="col-md-6">
								{errorMsgs.cpu && (
									<span className="help-block">{errorMsgs.cpu}</span>
								)}
							</div>
						</div>
					</span>
				)}
				<div className="form-group">
					<label className="col-md-3 control-label">
						Network Configuration
					</label>
					<div className="col-md-3">
						<Selectbox
							optionList={networkConfigTypes}
							selectedOption={vmConfig.networkConfigType.value}
							callBack={(e) =>
								handleVmConfigUpdate("networkConfigType", e, "vm")
							}
						/>
					</div>
				</div>

				<div
					style={
						heSetupModel.vm.networkConfigType.value === "static"
							? {}
							: { display: "none" }
					}
				>
					<div className={getClassNames("cloudinitVMStaticCIDR", errorMsgs)}>
						<label className="col-md-3 control-label">VM IP Address</label>
						<div className="col-md-6">
							<input
								type="text"
								style={{ width: "110px", display: "inline-block" }}
								placeholder="192.168.1.2"
								title="Enter the desired IP address for the VM."
								className="form-control"
								value={vmConfig.cloudinitVMStaticCIDR.value}
								onChange={(e) =>
									handleVmConfigUpdate(
										"cloudinitVMStaticCIDR",
										e.target.value,
										"vm"
									)
								}
								onBlur={(e) => verifyReverseDns(e.target.value)}
								id="he-static-ip-address-input"
							/>
							&nbsp;/&nbsp;
							<span className={cidrPrefixClasses} id="he-wizard-cidr-container">
								<input
									id="he-wizard-cidr"
									type="text"
									placeholder="24"
									className="form-control"
									value={vmConfig.cloudinitVMStaticCIDRPrefix.value}
									onChange={(e) =>
										handleVmConfigUpdate(
											"cloudinitVMStaticCIDRPrefix",
											e.target.value,
											"vm"
										)
									}
								/>
							</span>
							{(errorMsgs.cloudinitVMStaticCIDRPrefix ||
								errorMsgs.cloudinitVMStaticCIDR) && (
								<span className="has-error">
									<span className="help-block">{getCidrErrorMsg()}</span>
								</span>
							)}
						</div>
					</div>

					<div className={getClassNames("gateway", errorMsgs)}>
						<label className="col-md-3 control-label">Gateway Address</label>
						<div className="col-md-6">
							<input
								type="text"
								style={{ width: "110px" }}
								title="Enter a pingable gateway address."
								className="form-control"
								value={networkConfig.gateway.value}
								// onBlur={(e) => this.checkGatewayPingability(e.target.value)}
								onChange={(e) =>
									handleVmConfigUpdate("gateway", e.target.value, "network")
								}
								id="he-static-ip-gateway-input"
							/>
							{errorMsgs.gateway && (
								<span className="help-block" id="he-static-ip-invalid-gateway">
									{errorMsgs.gateway}
								</span>
							)}
							{gatewayPingPending && (
								<div className="validation-message-container">
									<span>
										<div className="spinner" />
									</span>
									<span
										className="validation-message"
										id="he-static-ip-verifying-gateway"
									>
										Verifying IP address...
									</span>
								</div>
							)}
						</div>
					</div>

					<div className={getClassNames("cloudinitVMDNS", errorMsgs)}>
						<label className="col-md-3 control-label">DNS Servers</label>
						<div className="col-md-6">
							<div style={{ width: "220px" }}>
								<MultiRowTextBoxContainer
									values={vmConfig.cloudinitVMDNS.value}
									itemType={"Address"}
									rowLimit={3}
									handleValueUpdate={handleDnsAddressUpdate}
									handleValueDelete={handleDnsAddressDelete}
								/>
								{errorMsgs.cloudinitVMDNS && (
									<span
										className="help-block"
										id="he-wizard-dns-error-container"
									>
										{errorMsgs.cloudinitVMDNS}
									</span>
								)}
							</div>
						</div>
					</div>
				</div>
				<div className="form-group">
					<label className="col-md-3 control-label">
						Bridge Interface{" "}
						<i
							className="pficon pficon-info he-wizard-info-icon"
							rel="tooltip"
							id="network_naming_conventions"
							title={infoNetworkNamingConventionsMessage}
						/>
					</label>
					<div className="col-md-3">
						<div>
							<Selectbox
								optionList={interfaces}
								selectedOption={networkConfig.bridgeIf.value}
								callBack={(e) => handleVmConfigUpdate("bridgeIf", e, "network")}
							/>
						</div>
					</div>
				</div>
				<div className={getClassNames("cloudinitRootPwd", errorMsgs)}>
					<label className="col-md-3 control-label">Root Password</label>
					<div className="col-md-3">
						<UnmaskablePasswordContainer
							value={vmConfig.cloudinitRootPwd.value}
							onChangeHandler={handleRootPwdUpdate}
							id="he-cloudinit-root-pwd-input"
						/>
						{errorMsgs.cloudinitRootPwd && (
							<span className="help-block">{errorMsgs.cloudinitRootPwd}</span>
						)}
					</div>
				</div>
				<div className="form-group">
					<label className="col-md-3 control-label">Root SSH Access</label>
					<div className="col-md-3">
						<Selectbox
							optionList={rootSshAccessOptions}
							selectedOption={vmConfig.rootSshAccess.value}
							callBack={(e) => handleVmConfigUpdate("rootSshAccess", e, "vm")}
						/>
					</div>
				</div>
				<div className={getClassNames("vmVCpus", errorMsgs)}>
					<label className="col-md-3 control-label">
						Number of Virtual CPUs
					</label>
					<div className="col-md-6">
						<input
							type="number"
							style={{ width: "60px" }}
							min={vmConfig.vmVCpus.range.min}
							max={vmConfig.vmVCpus.range.max}
							placeholder="Number of CPUs"
							title="Select number of virtual CPUs."
							className="form-control"
							value={vmConfig.vmVCpus.value}
							onChange={(e) =>
								handleVmConfigUpdate("vmVCpus", e.target.value, "vm")
							}
							id="he-vcpus-number-input"
						/>
						{errorMsgs.vmVCpus && (
							<span className="help-block">{errorMsgs.vmVCpus}</span>
						)}
					</div>
				</div>
				<div className={getClassNames("vmMemSizeMB", errorMsgs)}>
					<label className="col-md-3 control-label">Memory Size (MiB)</label>
					<div className="col-md-6 he-text-with-units">
						<input
							type="number"
							min={vmConfig.vmMemSizeMB.range.min}
							max={vmConfig.vmMemSizeMB.range.max}
							placeholder="Allocated memory"
							title="Enter the allocated memory for the VM."
							className="form-control he-mem-input"
							value={vmConfig.vmMemSizeMB.value}
							onChange={(e) =>
								handleVmConfigUpdate("vmMemSizeMB", e.target.value, "vm")
							}
							id="he-memory-size-input"
						/>
						<span className="info-block">
							{vmConfig.vmMemSizeMB.range.max.toLocaleString()}MiB available
						</span>
						{errorMsgs.vmMemSizeMB && (
							<span className="help-block">{errorMsgs.vmMemSizeMB}</span>
						)}
					</div>
				</div>
				{isOtopiDeployment && (
					<div className="form-group">
						<label className="col-md-3 control-label">Console Type</label>
						<div className="col-md-2">
							<Selectbox
								optionList={consoleTypes}
								selectedOption={vdsmConfig.consoleType.value}
								callBack={(e) => handleVmConfigUpdate("consoleType", e, "vdsm")}
							/>
						</div>
					</div>
				)}
				{isOtopiDeployment && (
					<div className="form-group">
						<label className="col-md-3 control-label">
							Use Cloud-Init &nbsp;
							<i
								className="pficon pficon-info he-wizard-info-icon"
								rel="tooltip"
								title="Use cloud-init to customize the appliance on the first boot"
							/>
						</label>
						<div className="col-md-3">
							<input
								type="checkbox"
								checked={vmConfig.cloudInitCustomize.value}
								onChange={(e) =>
									handleVmConfigUpdate(
										"cloudInitCustomize",
										e.target.checked,
										"vm"
									)
								}
							/>
						</div>
					</div>
				)}
				<div style={showCloudInitFields ? {} : { display: "none" }}>
					{isOtopiDeployment && (
						<div className="form-group">
							<label className="col-md-3 control-label">Cloud-Init Image</label>
							<div className="col-md-3">
								<Selectbox
									optionList={cloudInitOptions}
									selectedOption={vmConfig.cloudInitISO.value}
									callBack={(e) =>
										handleVmConfigUpdate("cloudInitISO", e, "vm")
									}
								/>
							</div>
						</div>
					)}

					<div className="form-group">
						<div className="col-md-9">
							<span className={advancedSectionIconClasses} />
							<h3 className="he-wizard-collapsible-section-header">
								<a
									className="he-wizard-collapse-section-link"
									onClick={(e) => handleCollapsibleSectionChange("advanced")}
									id="he-advanced-menu"
								>
									Advanced
								</a>
							</h3>
						</div>
					</div>

					<span className={advancedSectionClasses}>
						<div className={getClassNames("rootSshPubkey", errorMsgs)}>
							<label className="col-md-3 control-label">
								Root SSH Public Key
							</label>
							<div className="col-md-6">
								<textarea
									className="form-control"
									style={{ width: "250px" }}
									rows={"2"}
									value={vmConfig.rootSshPubkey.value}
									onChange={(e) =>
										handleVmConfigUpdate("rootSshPubkey", e.target.value, "vm")
									}
									id="he-ssh-pubkey-input"
								/>
								{errorMsgs.rootSshPubkey && (
									<span className="help-block">{errorMsgs.rootSshPubkey}</span>
								)}
							</div>
						</div>

						<div className={getClassNames("bridgeName", errorMsgs)}>
							<label className="col-md-3 control-label">Bridge Name</label>
							<div className="col-md-6">
								<input
									type="text"
									style={{ width: "110px" }}
									title="Enter the bridge name."
									className="form-control"
									value={networkConfig.bridgeName.value}
									onChange={(e) =>
										handleVmConfigUpdate(
											"bridgeName",
											e.target.value,
											"network"
										)
									}
									id="he-bridge-name-input"
								/>
								{errorMsgs.bridgeName && (
									<span className="help-block">{errorMsgs.bridgeName}</span>
								)}
							</div>
						</div>

						<div className={getClassNames("gateway", errorMsgs)}>
							<label className="col-md-3 control-label">Gateway Address</label>
							<div className="col-md-6">
								<input
									type="text"
									style={{ width: "110px" }}
									title="Enter a pingable gateway address."
									className="form-control"
									value={networkConfig.gateway.value}
									// onBlur={(e) => this.checkGatewayPingability(e.target.value)}
									onChange={(e) =>
										handleVmConfigUpdate("gateway", e.target.value, "network")
									}
									id="he-default-gateway-input"
								/>
								{errorMsgs.gateway && (
									<span
										className="help-block"
										id="he-invalid-default-gateway-err"
									>
										{errorMsgs.gateway}
									</span>
								)}
								{gatewayPingPending && (
									<div className="validation-message-container">
										<span>
											<div className="spinner" />
										</span>
										<span
											className="validation-message"
											id="he-verifying-default-gateway-msg"
										>
											Verifying IP address...
										</span>
									</div>
								)}
							</div>
						</div>

						{isOtopiDeployment && (
							<span>
								<div className="form-group">
									<label className="col-md-3 control-label">
										Engine Setup
										<i
											className="pficon pficon-info he-wizard-info-icon"
											rel="tooltip"
											id="engine_setup"
											title="Automatically execute engine-setup on the first boot"
										/>
									</label>
									<div className="col-md-1">
										<input
											type="checkbox"
											checked={vmConfig.cloudinitExecuteEngineSetup.value}
											onChange={(e) =>
												handleVmConfigUpdate(
													"cloudinitExecuteEngineSetup",
													e.target.checked,
													"vm"
												)
											}
										/>
									</div>
								</div>

								<div className="form-group">
									<label className="col-md-3 control-label">
										Engine Restart
										<i
											className="pficon pficon-info he-wizard-info-icon"
											rel="tooltip"
											id="engine_restart"
											title="Automatically restart the engine VM as a monitored service after engine-setup"
										/>
									</label>
									<div className="col-md-1">
										<input
											type="checkbox"
											checked={vmConfig.automateVMShutdown.value}
											onChange={(e) =>
												handleVmConfigUpdate(
													"automateVMShutdown",
													e.target.checked,
													"vm"
												)
											}
										/>
									</div>
								</div>
							</span>
						)}

						<div className={getClassNames("host_name", errorMsgs)}>
							<label className="col-md-3 control-label">Host FQDN</label>
							<div className="col-md-7">
								<input
									type="text"
									disabled={
										fqdnValidationData.host.state === status.POLLING
											? true
											: false
									}
									placeholder="engine-host.example.com"
									title="Enter the host's FQDN."
									className="form-control fqdn-textbox"
									value={networkConfig.host_name.value}
									onChange={(e) =>
										handleVmConfigUpdate("host_name", e.target.value, "network")
									}
									onBlur={() => validateFqdn(fqdnTypes.HOST)}
									id="he-host-fqdn-input"
								/>
								<div className="fqdn-status-container">
									{fqdnValidationData.host.state === status.SUCCESS && (
										<span className="fqdn-status-icon pficon pficon-ok" />
									)}
									{fqdnValidationData.host.state === status.FAILURE && (
										<span className="fqdn-status-icon pficon pficon-error-circle-o" />
									)}
								</div>
								<span
									className={
										fqdnValidationData.host.state === status.POLLING
											? ""
											: "hidden"
									}
									id="he-validating-host-fqdn-msg"
								>
									<span className="field-validation-spinner-container">
										<div className="spinner spinner-sm blank-slate-pf-icon field-validation-spinner" />
									</span>
									<span className="help-block"> {validatingFQDN} </span>
								</span>
								{errorMsgs.host_name && (
									<span className="help-block" id="he-invalid-host-fqdn-err">
										{errorMsgs.host_name}
									</span>
								)}
							</div>
						</div>

						{checkboxWithInfoProps.map((prop) => {
							return (
								<CheckboxWithInfo
									key={prop.idInput}
									label={prop.label}
									idInfo={prop.idInfo}
									iconTitle={prop.iconTitle}
									checked={prop.checked}
									handleVmConfigUpdate={handleVmConfigUpdate}
									propName={prop.propName}
									configType={prop.configType}
									idInput={prop.idInput}
								/>
							);
						})}

						<div className={getClassNames("network_test", errorMsgs)}>
							<label className="col-md-3 control-label">Network Test</label>
							<div className="col-md-3">
								<Selectbox
									optionList={networkTestTypes}
									selectedOption={networkConfig.network_test.value}
									callBack={(e) =>
										handleVmConfigUpdate("network_test", e, "network")
									}
								/>
								{errorMsgs.network_test && (
									<span className="help-block" id="he-invalid-network-test-err">
										{errorMsgs.network_test}
									</span>
								)}
								{networkTestPending && (
									<div className="validation-message-container">
										<span className="validation-message">
											Verifying Network Test...
										</span>
									</div>
								)}
							</div>
						</div>
						<div
							style={
								networkConfig.network_test.value === "tcp"
									? {}
									: { display: "none" }
							}
						>
							<div className="form-group">
								<label className="col-md-3 control-label">
									Address to connect
								</label>
								<div className="col-md-3">
									<input
										type="text"
										placeholder="1.2.3.4 or example.com"
										title="Enter the desired destination address of the TCP connection test."
										className="form-control"
										value={networkConfig.tcp_t_address.value}
										onChange={(e) =>
											handleVmConfigUpdate(
												"tcp_t_address",
												e.target.value,
												"network"
											)
										}
										id="he-tcp-t-address-input"
									/>
								</div>
							</div>
							<div className="form-group">
								<label className="col-md-3 control-label">
									Port to connect
								</label>
								<div className="col-md-2">
									<input
										type="number"
										placeholder="443"
										min="1"
										max="65535"
										title="Enter the desired destination TCP port of the TCP connection test."
										className="form-control"
										value={networkConfig.tcp_t_port.value}
										onChange={(e) =>
											handleVmConfigUpdate(
												"tcp_t_port",
												e.target.value,
												"network"
											)
										}
										id="he-tcp-t-port-input"
									/>
								</div>
							</div>
						</div>
						<div className={getClassNames("ovfArchive", errorMsgs)}>
							<label className="col-md-3 control-label">OVA Archive Path</label>
							<div className="col-md-5">
								<input
									type="text"
									placeholder="/path/to/*.ova"
									title={infoAppliancePathMessage}
									className="form-control"
									value={vmConfig.ovfArchive.value}
									onChange={(e) =>
										handleVmConfigUpdate("ovfArchive", e.target.value, "vm")
									}
									id="he-ova_archive-path-input"
								/>
							</div>
						</div>
					</span>
				</div>
			</form>
		</div>
	);
};

export default HeWizardVm;
