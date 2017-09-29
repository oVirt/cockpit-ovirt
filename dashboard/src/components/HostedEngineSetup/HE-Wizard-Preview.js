import React, { Component } from 'react'
import WizardExecutionStep from './HE-Wizard-Execution'

class WizardPreviewStep extends Component {
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

        let idx = 0;
        const storageRows = [];
        const networkRows = [];
        const vmRows = [];
        const engineRows = [];

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
                                storageRows.push(previewRow);
                                break;
                            case "Network":
                                networkRows.push(previewRow);
                                break;
                            case "VM":
                                vmRows.push(previewRow);
                                break;
                            case "Engine":
                                engineRows.push(previewRow);
                                break;
                            default:
                                break;
                        }
                }, this)
            }, this);

        if (this.props.isDeploymentStarted) {
            return (
                <WizardExecutionStep onSuccess={this.props.onSuccess}
                                     reDeployCallback={this.props.reDeployCallback}
                                     setup={this.props.setup}
                                     heSetupModel={this.state.heSetupModel}
                                     abortCallback={this.props.abortCallback}
                />
            );
        } else {
            return (
                <div>
                    <PreviewSectionHeader title={"Storage"} firstHeader={true}/>
                    <div>{ storageRows }</div>

                    <PreviewSectionHeader title={"Network"} />
                    <div>{ networkRows }</div>

                    <PreviewSectionHeader title={"VM"} />
                    <div>{ vmRows }</div>

                    <PreviewSectionHeader title={"Engine"} />
                    <div>{ engineRows }</div>
                </div>
            )
        }
    }
}

WizardPreviewStep.propTypes = {
    stepName: React.PropTypes.string.isRequired,
    heSetupModel: React.PropTypes.object.isRequired,
    isDeploymentStarted: React.PropTypes.bool.isRequired
};

const PreviewRow = ({property, value}) => {
    return (
        <div className="row">
            <label className="he-preview-field col-md-6">{property}</label>
            <label className="he-preview-value col-md-6">{value === "" ? <em>(None)</em> : value}</label>
        </div>
    )
};

const PreviewSectionHeader = ({title, firstHeader}) => {
    const firstHeaderClassNames = "he-first-preview-header col-sm-4";
    const headerClassNames = "he-preview-header col-sm-4";

    return (
        <div className={"row"}>
            <span className={"col-sm-4"} />
            <h3 className={firstHeader ? firstHeaderClassNames : headerClassNames}>{title}</h3>
            <span className={"col-sm-4"} />
        </div>
    )
};

export default WizardPreviewStep