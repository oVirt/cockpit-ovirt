import React, { Component } from 'react'
import HeSetupWizard from './HeSetupWizard'
import { HeSetupModel, checkVirtSupport } from '../../../helpers/HostedEngineSetupUtil'
import { configValues, loadingState as state, messages } from '../constants'

class HeSetupWizardContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loadingState: state.POLLING,
            isDeploymentStarted: false,
            heSetupModel: null,
            gDeployAnswerFilePaths: this.props.gDeployAnswerFilePaths,
            systemData: null
        };

        this.state.heSetupModel = new HeSetupModel();
        this.virtSupported = 0;
        this.systemDataRetrieved = 0;

        this.handleFinish = this.handleFinish.bind(this);
        this.onStepChange = this.onStepChange.bind(this);
        this.handleReDeploy = this.handleReDeploy.bind(this);
        this.abortCallback = this.abortCallback.bind(this);
        this.getSystemData = this.getSystemData.bind(this);
        this.setSystemData = this.setSystemData.bind(this);
    }

    onStepChange(activeStep) {

    }

    getSystemData() {
        let cmd = "ansible-playbook " + configValues.ANSIBLE_PLAYBOOK_PATH;
        let options = { "environ": ["ANSIBLE_STDOUT_CALLBACK=json"] };
        let self = this;

        cockpit.spawn(cmd.split(" "), options)
            .done(function(json) {
                self.setSystemData(json);
                self.systemDataRetrieved = 1;
                self.completeChecks();
            })
            .fail(function(error) {
                console.log(error);
                self.systemDataRetrieved = -1;
                self.completeChecks();
            });
    }

    setSystemData(output) {
        this.setState({ systemData: JSON.parse(output) });
        this.setState({ loadingState: state.READY });
    }

    checkVirtSupport() {
        let self = this;
        checkVirtSupport()
            .done(function() {
                self.virtSupported = 1;
                self.completeChecks();
            })
            .fail(function() {
                self.virtSupported = -1;
                self.completeChecks();
            });
    }

    completeChecks() {
        if (this.virtSupported !== 0 && this.systemDataRetrieved !== 0) {
            if (this.virtSupported === -1 || this.systemDataRetrieved === -1) {
                this.setState({ loadingState: state.ERROR });
            } else {
                this.setState({ loadingState: state.READY })
            }
        }
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
        this.getSystemData();
        this.checkVirtSupport();
    }

    componentDidMount() {
        if (this.state.gDeployAnswerFilePaths) {
            console.log(messages.ADD_GDEPLOY_PROPS_TO_ANS_FILE);
            const filePath = this.state.gDeployAnswerFilePaths[0];
            const setupModel = this.state.heSetupModel.model;
            this.state.heSetupModel.addGlusterValues(filePath, setupModel);
        } else {
            console.log(messages.NO_GDEPLOY_ANSWER_FILES_FOUND);
        }
    }

    render() {
        return (
            <HeSetupWizard
                loadingState={this.state.loadingState}
                abortCallback={this.abortCallback}
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