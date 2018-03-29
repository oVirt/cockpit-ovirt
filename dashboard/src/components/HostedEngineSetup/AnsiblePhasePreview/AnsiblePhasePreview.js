import React from 'react'
import AnsiblePhaseExecutionContainer from "../AnsiblePhaseExecution/AnsiblePhaseExecutionContainer";
import ReviewStepPanelContainer from "../ReviewStep/ReviewStepPanel";

const AnsiblePhasePreview = ({abortCallBack, headerText, sections, executionStarted, heSetupModel, isLastStep, phase,
                                 terminationCallBack}) => {

    if (executionStarted) {
        return <AnsiblePhaseExecutionContainer abortCallBack={abortCallBack}
                                               heSetupModel={heSetupModel}
                                               isLastStep={isLastStep}
                                               phase={phase}
                                               terminationCallBack={terminationCallBack}/>
    } else {
        return <ReviewStepPanelContainer headerText={headerText}
                                         reviewSteps={sections} />
    }
};

export default AnsiblePhasePreview;