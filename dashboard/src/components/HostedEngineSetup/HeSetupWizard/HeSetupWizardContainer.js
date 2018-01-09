import React, { Component } from 'react'
import HeSetupWizard from './HeSetupWizard'
import { HeSetupModel } from '../../../helpers/HostedEngineSetupUtil'
import { messages, status } from '../constants'
import DefaultValueProvider from '../../../helpers/HostedEngineSetup/DefaultValueProvider'

class HeSetupWizardContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loadingState: status.POLLING,
            isDeploymentStarted: false,
            heSetupModel: null,
            gDeployAnswerFilePaths: this.props.gDeployAnswerFilePaths,
            systemData: null
        };

        this.state.heSetupModel = new HeSetupModel();
        this.virtSupported = false;
        this.systemDataRetrieved = false;
        this.sufficientMemAvail = false;
        this.defaultsProvider = null;

        this.handleFinish = this.handleFinish.bind(this);
        this.onStepChange = this.onStepChange.bind(this);
        this.handleReDeploy = this.handleReDeploy.bind(this);
        this.abortCallback = this.abortCallback.bind(this);
        this.init = this.init.bind(this);
    }

    onStepChange(activeStep) {

    }

    init(initSuccessful) {
        this.systemDataRetrieved = initSuccessful;
        this.virtSupported = this.defaultsProvider.virtSupported();
        this.sufficientMemAvail = this.defaultsProvider.sufficientMemAvail();

        const loadingSuccessful = this.systemDataRetrieved && this.virtSupported && this.sufficientMemAvail;
        const loadingStatus = loadingSuccessful ? status.SUCCESS : status.FAILURE;

        let systemData = null;
        if (initSuccessful) {
            systemData = this.defaultsProvider.systemData;
        }

        this.setState({ loadingState: loadingStatus, systemData: systemData });
    }

    handleFinish() {
        this.setState({ isDeploymentStarted: true });
    }

    handleReDeploy(){
        this.setState({ isDeploymentStarted: false });
    }

    abortCallback() {
        this.setState({ isDeploymentStarted: false });
        this.props.onClose();
    }

    componentWillMount() {
        this.defaultsProvider = new DefaultValueProvider(this.init);
    }

    componentDidMount() {
        if (this.state.gDeployAnswerFilePaths) {
            console.log(messages.ADD_GDEPLOY_PROPS_TO_ANS_FILE);
            const gdeployAnsFiles = this.state.gDeployAnswerFilePaths;
            const glusterAnsFile = gdeployAnsFiles[0];
            const setupModel = this.state.heSetupModel.model;
            this.state.heSetupModel.addGlusterValues(glusterAnsFile, setupModel);
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
                handleRedeploy={this.handleReDeploy}
                heSetupModel={this.state.heSetupModel}
                isDeploymentStarted={this.state.isDeploymentStarted}
                onSuccess={this.props.onSuccess}
                onStepChange={this.onStepChange}
                setup={this.props.setup}
                systemData={this.state.systemData}
                virtSupported={this.virtSupported}
                systemDataRetrieved={this.systemDataRetrieved}
                sufficientMemAvail={this.sufficientMemAvail}
                gDeployAnswerFilePaths={this.state.gDeployAnswerFilePaths}
                deploymentType={this.props.deploymentType}/>
        )
    }
}

HeSetupWizardContainer.propTypes = {
    deploymentType: React.PropTypes.string,
    gDeployAnswerFilePaths: React.PropTypes.array,
    onClose: React.PropTypes.func.isRequired,
    onSuccess: React.PropTypes.func.isRequired
};

export default HeSetupWizardContainer;