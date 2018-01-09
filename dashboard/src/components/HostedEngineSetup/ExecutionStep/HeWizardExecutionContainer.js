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

        this.setup = this.getSetup();

        this.getSetup = this.getSetup.bind(this);
        this.startSetup = this.startSetup.bind(this);
    }

    componentWillMount() {
        this.startSetup();
    }

    getSetup() {
        let answerFiles = [];

        if (typeof this.props.gDeployAnswerFilePaths !== 'undefined') {
            answerFiles = this.props.gDeployAnswerFilePaths.slice();
        }

        answerFiles.push(configValues.ANSWER_FILE_PATH);
        return new RunSetup(this.props.abortCallback, answerFiles);
    }

    startSetup() {
        const fileGenerator = new AnswerFileGenerator(this.props.heSetupModel);
        const self = this;
        const prom = fileGenerator.writeConfigToFile();

        prom.done(function() {
            self.setup = self.getSetup();
        });
    }

    render() {
        return (
            <HeWizardExecution
                heSetupStatus={this.state.heSetupStatus}
                setup={this.setup}
                startSetup={this.startSetup}/>
        )

    }
}

HeWizardExecutionContainer.propTypes = {
    onSuccess: React.PropTypes.func.isRequired,
    reDeployCallback: React.PropTypes.func.isRequired
};

export default HeWizardExecutionContainer;