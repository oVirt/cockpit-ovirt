import React, { Component } from 'react'
import AnsiblePhasePreview from './AnsiblePhasePreview'
import PreviewGenerator from '../../../helpers/HostedEngineSetup/PreviewGenerator'

class AnsiblePhasePreviewContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            heSetupModel: props.heSetupModel
        };

    }

    render() {
        const previewGen = new PreviewGenerator(this.state.heSetupModel);
        const sections = previewGen.getPreviewSections(this.props.sections);

        return (
            <AnsiblePhasePreview sections={sections}/>
        )
    }
}

AnsiblePhasePreviewContainer.propTypes = {
    stepName: React.PropTypes.string.isRequired,
    heSetupModel: React.PropTypes.object.isRequired,
    sections: React.PropTypes.array.isRequired
};

export default AnsiblePhasePreviewContainer;