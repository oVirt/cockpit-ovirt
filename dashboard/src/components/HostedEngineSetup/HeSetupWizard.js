import React, { Component } from 'react'
import WizardStorageStep from './HE-Wizard-Storage'
import WizardHostNetworkStep from './HE-Wizard-Network'
import WizardVmConfigStep from './HE-Wizard-VM'
import WizardEngineStep from './HE-Wizard-Engine'
import WizardPreviewStep from './HE-Wizard-Preview'
import Wizard from '../common/Wizard'
import { AnsibleUtil, HeSetupModel, checkVirtSupport } from '../../helpers/HostedEngineSetupUtil'
import { configValues } from './constants'

class HeSetupWizard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            state: 'polling',
            isDeploymentStarted: false,
            heSetupModel: null,
            gDeployAnswerFilePaths: this.props.gDeployAnswerFilePaths,
            systemData: null
        };

        this.state.heSetupModel = new HeSetupModel();
        this.ansible = new AnsibleUtil();

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
        this.ansible.runAnsibleCommand(cmd, options)
            .done(function() {
                self.systemDataRetrieved = 1;
                self.completeChecks();
            })
            .fail(function() {
                self.systemDataRetrieved = -1;
                self.completeChecks();
            })
            .stream(this.setSystemData);
    }

    setSystemData(output) {
        this.setState({ systemData: this.ansible.getOutputAsJson(output) });
        this.setState({ state: 'ready' });
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
                this.setState({ state: 'error' });
            } else {
                this.setState({ state: 'ready'})
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
            console.log("Attempting to add gdeploy properties to the answer file.");
            const filePath = this.state.gDeployAnswerFilePaths[0];
            const setupModel = this.state.heSetupModel.model;
            this.state.heSetupModel.addGlusterValues(filePath, setupModel);
        } else {
            console.log("No gdeploy answer files provided.");
        }
    }

    render() {
        return (
            <div>
                {this.state.state === 'polling' &&
                    <div className="curtains curtains-ct blank-slate-pf he-data-loading-container">
                        <div className="container-center">
                            <div className="spinner" />
                            <br />
                            <h1>Loading Wizard</h1>
                        </div>
                    </div>
                }

                {this.state.state === 'ready' &&
                    <Wizard title="Hosted Engine Deployment"
                            onClose={this.abortCallback}
                            onFinish={this.handleFinish}
                            onStepChange={this.onStepChange}
                            isDeploymentStarted={this.state.isDeploymentStarted}>
                        <WizardStorageStep stepName="Storage" model={this.state.heSetupModel}/>
                        <WizardHostNetworkStep stepName="Network" heSetupModel={this.state.heSetupModel.model}
                                               systemData={this.state.systemData}
                        />
                        <WizardVmConfigStep stepName="VM"
                                            model={this.state.heSetupModel}
                                            systemData={this.state.systemData}
                        />
                        <WizardEngineStep stepName="Engine" heSetupModel={this.state.heSetupModel.model}/>
                        <WizardPreviewStep stepName="Review" heSetupModel={this.state.heSetupModel.model}
                                           isDeploymentStarted={this.state.isDeploymentStarted}
                                           onSuccess={this.props.onSuccess}
                                           reDeployCallback={this.handleReDeploy}
                                           setup={this.props.setup}
                                           abortCallback={this.abortCallback}
                        />
                    </Wizard>
                }

                {this.state.state === 'error' && this.virtSupported === -1 &&
                    <div>Error! Hardware virtualization not supported on this host!</div>
                }

                {this.state.state === 'error' && this.systemDataRetrieved === -1 &&
                    <div>Error! System data could not be retrieved!</div>
                }
            </div>
        )
    }
}

HeSetupWizard.propTypes = {
    gDeployAnswerFilePaths: React.PropTypes.array,
    onClose: React.PropTypes.func.isRequired,
    onSuccess: React.PropTypes.func.isRequired
};

export default HeSetupWizard