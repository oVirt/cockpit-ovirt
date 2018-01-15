import React, { Component } from 'react'
import AnsiblePhasePreview from './AnsiblePhasePreview'
import PreviewGenerator from '../../../helpers/HostedEngineSetup/PreviewGenerator'
import {deploymentStatus as status} from "../constants";

class AnsiblePhasePreviewContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            heSetupModel: props.heSetupModel,
            executionStarted: false,
            executionTerminated: false,
            executionStatus: status.RUNNING
        };

        this.nextButtonCallBack = this.nextButtonCallBack.bind(this);
        this.restartCallBack = this.restartCallBack.bind(this);
        this.terminationCallBack = this.terminationCallBack.bind(this);
    }

    nextButtonCallBack() {
        this.setState({ executionStarted: true });
        this.props.nextButtonStateCallBack({ disabled: true }); // Reset the 'Next' button after 'Execute' is pressed
    }

    terminationCallBack(executionStatus, buttonCallBack) {
        this.setState({ executionTerminated: true, executionStatus: executionStatus });
        const self = this;
        let nextButtonState = {};
        if (executionStatus === status.FAILURE) {
            nextButtonState = {
                nextButtonText: "Execute",
                showArrow: false,
                nextButtonCallBack: function() {
                    buttonCallBack();
                    self.props.nextButtonStateCallBack({ disabled: true });
                },
                moveNext: false
            };
        }
        this.props.nextButtonStateCallBack(nextButtonState);
    }

    restartCallBack(buttonCallBack) {
        const self = this;
        buttonCallBack();
        self.props.nextButtonStateCallBack({ disabled: true });
    }

    componentDidUpdate(prevProps) {
        if (prevProps.nextButtonStateCallBack === null &&
            this.props.nextButtonStateCallBack !== null &&
            this.state.executionStatus !== status.SUCCESS) {
            const self = this;
            const nextButtonState = {
                nextButtonText: "Execute",
                showArrow: false,
                nextButtonCallBack: self.nextButtonCallBack,
                moveNext: false
            };
            this.props.nextButtonStateCallBack(nextButtonState);
        }
    }

    render() {
        const previewGen = new PreviewGenerator(this.state.heSetupModel);
        const sections = previewGen.getPreviewSections(this.props.sections);

        return (
            <AnsiblePhasePreview abortCallBack={this.props.abortCallBack}
                                 sections={sections}
                                 executionStarted={this.state.executionStarted}
                                 heSetupModel={this.state.heSetupModel}
                                 phase={this.props.phase}
                                 restartCallBack={this.restartCallBack}
                                 terminationCallBack={this.terminationCallBack}/>
        )
    }
}

AnsiblePhasePreviewContainer.propTypes = {
    stepName: React.PropTypes.string.isRequired,
    heSetupModel: React.PropTypes.object.isRequired,
    sections: React.PropTypes.array.isRequired,
    phase: React.PropTypes.string.isRequired
};

export default AnsiblePhasePreviewContainer;