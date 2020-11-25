import PropTypes from "prop-types";
import React, { Component } from "react";
import HeSetupWizard from "./HeSetupWizard";
import {
	HeSetupModel,
	isEmptyObject,
} from "../../../helpers/HostedEngineSetupUtil";
import {
	messages,
	status,
	defaultValueProviderTasks as tasks,
} from "../constants";
import DefaultValueProvider from "../../../helpers/HostedEngineSetup/DefaultValueProvider";

class HeSetupWizardContainer extends Component {
	constructor(props) {
		super(props);
		this.state = {
			loadingState: status.POLLING,
			isDeploymentStarted: false,
			heSetupModel: null,
			gDeployAnswerFilePaths: this.props.gDeployAnswerFilePaths,
			systemData: null,
			networkIfacesRetrieved: null,
		};

		this.state.heSetupModel = new HeSetupModel();
		this.defaultsProvider = null;
		this.allSystemDataRetrieved = false;

		this.virtSupported = true;
		this.sufficientMemAvail = true;
		this.libvirtRunning = true;

		this.finishDeploy = this.finishDeploy.bind(this);
		this.handleFinish = this.handleFinish.bind(this);
		this.onStepChange = this.onStepChange.bind(this);
		this.handleReDeploy = this.handleReDeploy.bind(this);
		this.abortCallback = this.abortCallback.bind(this);
		this.init = this.init.bind(this);
	}

	onStepChange(activeStep) {}

	init(initResults) {
		let loadingStatus = status.POLLING;
		let systemData = null;
		let sysDataRetrieved = false;
		let networkIfacesRetrieved = false;
		let hostFqdnValidated = false;

		if (!isEmptyObject(initResults)) {
			sysDataRetrieved = initResults[tasks.GET_SYSTEM_DATA] === true;
			networkIfacesRetrieved =
				initResults[tasks.RETRIEVE_NETWORK_INTERFACES] === true;
			hostFqdnValidated = initResults[tasks.VALIDATE_FQDN] === true;
		}

		if (sysDataRetrieved) {
			this.libvirtRunning = this.defaultsProvider.libvirtRunning();
			this.virtSupported = this.defaultsProvider.virtSupported();
			this.sufficientMemAvail = this.defaultsProvider.sufficientMemAvail();
			this.allSystemDataRetrieved =
				sysDataRetrieved && networkIfacesRetrieved && hostFqdnValidated;

			const loadingSuccessful =
				this.allSystemDataRetrieved &&
				this.libvirtRunning &&
				this.virtSupported &&
				this.sufficientMemAvail;
			loadingStatus = loadingSuccessful ? status.SUCCESS : status.FAILURE;
			systemData = this.defaultsProvider.systemData;
			this.state.heSetupModel.setDefaultValues(this.defaultsProvider);
		} else {
			loadingStatus = status.FAILURE;
		}

		this.setState({
			loadingState: loadingStatus,
			systemData: systemData,
			networkIfacesRetrieved,
			networkIfacesRetrieved,
		});
	}

	finishDeploy() {
		this.props.onFinishDeploy();
	}

	handleFinish() {
		this.setState({ isDeploymentStarted: true });
	}

	handleReDeploy() {
		this.setState({ isDeploymentStarted: false });
	}

	abortCallback() {
		this.setState({ isDeploymentStarted: false });
		this.props.onClose();
	}

	UNSAFE_componentWillMount() {
		this.defaultsProvider = new DefaultValueProvider(this.init);
	}

	componentDidMount() {
		if (this.state.gDeployAnswerFilePaths) {
			console.log(messages.ADD_GDEPLOY_PROPS_TO_ANS_FILE);
			const gdeployAnsFiles = this.state.gDeployAnswerFilePaths;
			const glusterAnsFile = gdeployAnsFiles[0];
			const setupModel = this.state.heSetupModel.model;
			this.state.heSetupModel.addGlusterValues(glusterAnsFile, setupModel);
			setupModel.storage.domainType.value = "glusterfs";
			this.setState({ setupModel });
		} else {
			console.log(messages.NO_GDEPLOY_ANSWER_FILES_FOUND);
		}
	}

	render() {
		return (
			<HeSetupWizard
				loadingState={this.state.loadingState}
				abortCallback={this.abortCallback}
				defaultsProvider={this.defaultsProvider}
				handleFinish={this.handleFinish}
				finishDeploy={this.finishDeploy}
				handleRedeploy={this.handleReDeploy}
				heSetupModel={this.state.heSetupModel}
				isDeploymentStarted={this.state.isDeploymentStarted}
				onSuccess={this.props.onSuccess}
				onStepChange={this.onStepChange}
				setup={this.props.setup}
				systemData={this.state.systemData}
				libvirtRunning={this.libvirtRunning}
				virtSupported={this.virtSupported}
				systemDataRetrieved={this.allSystemDataRetrieved}
				sufficientMemAvail={this.sufficientMemAvail}
				gDeployAnswerFilePaths={this.state.gDeployAnswerFilePaths}
				deploymentType={this.props.deploymentType}
				showWizard={this.props.showWizard}
				networkIfacesRetrieved={this.state.networkIfacesRetrieved}
			/>
		);
	}
}

HeSetupWizardContainer.propTypes = {
	deploymentType: PropTypes.string,
	gDeployAnswerFilePaths: PropTypes.array,
	onClose: PropTypes.func.isRequired,
	onSuccess: PropTypes.func.isRequired,
	onFinishDeploy: PropTypes.func.isRequired,
};

export default HeSetupWizardContainer;
