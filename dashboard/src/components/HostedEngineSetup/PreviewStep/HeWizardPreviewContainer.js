import React, { Component } from 'react'
import HeWizardPreview from './HeWizardPreview'

class HeWizardPreviewContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            heSetupModel: props.heSetupModel,
            isEditing: false,
            isChanged: false
        }
    }

    render() {
        let model = this.state.heSetupModel;

        const sectionRows = {
          storageRows: [],
          networkRows: [],
          vmRows: [],
          engineRows: []
        };

        let idx = 0;

        Object.getOwnPropertyNames(model).forEach(
            function(sectionName) {
                let section = model[sectionName];
                Object.getOwnPropertyNames(section).forEach(
                    function(propName) {
                        let prop = section[propName];

                        if (!prop.showInReview) {
                            return;
                        }

                        let previewRow = <PreviewRow property={prop.description} value={prop.value.toString()} key={idx++} />;

                        switch (prop.uiStage) {
                            case "Storage":
                                sectionRows.storageRows.push(previewRow);
                                break;
                            case "Network":
                                sectionRows.networkRows.push(previewRow);
                                break;
                            case "VM":
                                sectionRows.vmRows.push(previewRow);
                                break;
                            case "Engine":
                                sectionRows.engineRows.push(previewRow);
                                break;
                            default:
                                break;
                        }
                    }, this)
            }, this);

        return (
            <HeWizardPreview
                isDeploymentStarted={this.props.isDeploymentStarted}
                onSuccess={this.props.onSuccess}
                reDeployCallback={this.props.reDeployCallback}
                setup={this.props.setup}
                heSetupModel={this.state.heSetupModel}
                abortCallback={this.props.abortCallback}
                sectionRows={sectionRows}
                gDeployAnswerFilePaths={this.props.gDeployAnswerFilePaths}
            />
        )
    }
}

HeWizardPreviewContainer.propTypes = {
    stepName: React.PropTypes.string.isRequired,
    heSetupModel: React.PropTypes.object.isRequired,
    isDeploymentStarted: React.PropTypes.bool.isRequired,
};

const PreviewRow = ({property, value}) => {
    return (
        <div className="row">
            <label className="he-preview-field col-md-6">{property}</label>
            <label className="he-preview-value col-md-6">{value === "" ? <em>(None)</em> : value}</label>
        </div>
    )
};

export default HeWizardPreviewContainer;