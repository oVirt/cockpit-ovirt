import React from 'react'
import HeWizardExecutionContainer from '../ExecutionStep/HeWizardExecutionContainer'

const HeWizardPreview = ({gDeployAnswerFilePaths, isDeploymentStarted, onSuccess, reDeployCallback, setup, heSetupModel, abortCallback, sectionRows}) => {
    if (isDeploymentStarted) {
        return (
            <HeWizardExecutionContainer onSuccess={onSuccess}
                                        reDeployCallback={reDeployCallback}
                                        setup={setup}
                                        heSetupModel={heSetupModel}
                                        abortCallback={abortCallback}
                                        gDeployAnswerFilePaths={gDeployAnswerFilePaths}
            />
        );
    } else {
        return (
            <div>
                <PreviewSectionHeader title={"Storage"} firstHeader={true}/>
                <div>{ sectionRows.storageRows }</div>

                <PreviewSectionHeader title={"Network"} />
                <div>{ sectionRows.networkRows }</div>

                <PreviewSectionHeader title={"VM"} />
                <div>{ sectionRows.vmRows }</div>

                <PreviewSectionHeader title={"Engine"} />
                <div>{ sectionRows.engineRows }</div>
            </div>
        )
    }
};

export default HeWizardPreview;

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