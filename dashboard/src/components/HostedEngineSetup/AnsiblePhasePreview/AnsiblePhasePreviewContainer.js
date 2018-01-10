import React, { Component } from 'react'
import AnsiblePhasePreview from './AnsiblePhasePreview'
import PreviewGenerator from '../../../helpers/HostedEngineSetup/PreviewGenerator'

class AnsiblePhasePreviewContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            heSetupModel: props.heSetupModel,
            executionStarted: false
        };

        this.nextButtonCallBack = this.nextButtonCallBack.bind(this);
    }

    nextButtonCallBack() {
        this.setState({ executionStarted: true });
        this.props.nextButtonStateCallBack({}); // Reset the 'Next' button after 'Execute' is pressed
    }

    componentDidUpdate(prevProps) {
        if (prevProps.nextButtonStateCallBack === null && this.props.nextButtonStateCallBack !== null) {
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
                                 phase={this.props.phase}/>
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