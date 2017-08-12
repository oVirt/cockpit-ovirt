import React, { Component } from 'react'
import { AnswerFileGenerator } from '../../helpers/HostedEngineSetupUtil'
import { configValues, deploymentStatus } from './constants';
import Setup from './HeSetup'
import RunSetup from '../../helpers/HostedEngineSetup'

class WizardExecutionStep extends Component {
    constructor(props) {
        super(props);
        this.state = {
            heSetupLog: "",
            heSetupStatus: deploymentStatus.RUNNING
        };

        this.setup = new RunSetup(this.props.abortCallback, [configValues.ANSWER_FILE_PATH]);
        this.startSetup = this.startSetup.bind(this);
    }

    componentWillMount() {
        this.startSetup();
    }

    startSetup() {
        const fileGenerator = new AnswerFileGenerator(this.props.heSetupModel);
        let self = this;
        let prom = fileGenerator.writeConfigToFile();
        prom.done(function() {
            self.setup = new RunSetup(self.props.abortCallback, [configValues.ANSWER_FILE_PATH]);
        });
    }

    render() {
        if (this.state.heSetupStatus === deploymentStatus.SUCCESS) {
            return <SuccessPanel />
        } else {
            return <Setup setupCallback={this.startSetup} setup={this.setup}/>
        }
    }
}

WizardExecutionStep.propTypes = {
    onSuccess: React.PropTypes.func.isRequired,
    reDeployCallback: React.PropTypes.func.isRequired
};

const Status = ({ status, reDeployCallback }) => {
    let msg = "Deployment in progress";
    let statusIcon = <div className="spinner spinner-lg blank-slate-pf-icon" />;
    if (status === deploymentStatus.FAILURE) {
        msg = "Deployment failed";
        statusIcon = <span className="pficon-error-circle-o" />;
    }
    return (
        <div>
            {statusIcon}
            <span>{msg}</span>
            <div className="pull-right">
                {status === deploymentStatus.FAILURE &&
                    <button className="btn btn-primary" onClick={reDeployCallback}>
                        <span className="pficon pficon-restart">&nbsp;</span>
                        Redeploy
                     </button>
                }
            </div>
        </div>
    )
};

const SuccessPanel = () => {
    return (
        <div className="wizard-pf-complete blank-slate-pf">
            <div className="wizard-pf-success-icon">
                <span className="glyphicon glyphicon-ok-circle" />
            </div>
            <h5 className="blank-slate-pf-main-action">
                Hosted Engine has been successfully deployed!
            </h5>
        </div>
    )
};

export default WizardExecutionStep