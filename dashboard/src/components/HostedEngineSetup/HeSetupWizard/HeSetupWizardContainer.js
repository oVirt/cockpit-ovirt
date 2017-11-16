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
        this.virtSupported = status.EMPTY;
        this.systemDataRetrieved = status.EMPTY;
        this.defaultsProvider = null;

        this.handleFinish = this.handleFinish.bind(this);
        this.onStepChange = this.onStepChange.bind(this);
        this.handleReDeploy = this.handleReDeploy.bind(this);
        this.abortCallback = this.abortCallback.bind(this);
        this.init = this.init.bind(this);
    }

    onStepChange(activeStep) {

    }

    init(initStatus) {
        let loadingStatus = status.EMPTY;
        let systemData = null;

        if (initStatus === status.FAILURE) {
            this.systemDataRetrieved = status.FAILURE;
            loadingStatus = status.FAILURE;
        } else if (!this.defaultsProvider.virtSupported()) {
            this.virtSupported = status.FAILURE;
            loadingStatus = status.FAILURE;
        } else {
            this.virtSupported = status.SUCCESS;
            this.systemDataRetrieved = status.SUCCESS;
            systemData = this.defaultsProvider.systemData;
            loadingStatus = status.SUCCESS;
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
            const glusterAnsFile = gdeployAnsFiles.shift();
            const setupModel = this.state.heSetupModel.model;
            this.state.heSetupModel.addGlusterValues(glusterAnsFile, setupModel);

            this.setState({ gDeployAnswerFilePaths: gdeployAnsFiles })
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
                gDeployAnswerFilePaths={this.state.gDeployAnswerFilePaths}
            />
        )
    }
}

HeSetupWizardContainer.propTypes = {
    gDeployAnswerFilePaths: React.PropTypes.array,
    onClose: React.PropTypes.func.isRequired,
    onSuccess: React.PropTypes.func.isRequired
};

export default HeSetupWizardContainer;