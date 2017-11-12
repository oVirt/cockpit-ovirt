import React, { Component } from 'react'
import { AnswerFileGenerator } from '../../../helpers/HostedEngineSetupUtil'
import { configValues, deploymentStatus } from '../constants';
import RunSetup from '../../../helpers/HostedEngineSetup'
import HeWizardExecution from './HeWizardExecution'

class HeWizardExecutionContainer extends Component {
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
        return (
            <HeWizardExecution
                heSetupStatus={this.state.heSetupStatus}
                setup={this.setup}
                startSetup={this.startSetup}
            />
        )

    }
}

HeWizardExecutionContainer.propTypes = {
    onSuccess: React.PropTypes.func.isRequired,
    reDeployCallback: React.PropTypes.func.isRequired
};

export default HeWizardExecutionContainer;