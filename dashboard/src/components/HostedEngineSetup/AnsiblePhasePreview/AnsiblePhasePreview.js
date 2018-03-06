import React from 'react'
import AnsiblePhaseExecutionContainer from "../AnsiblePhaseExecution/AnsiblePhaseExecutionContainer";
import ReviewStepPanelContainer from "../ReviewStep/ReviewStepPanel";

const AnsiblePhasePreview = ({abortCallBack, sections, executionStarted, heSetupModel, isLastStep, phase,
                                 restartCallBack, terminationCallBack}) => {

    if (executionStarted) {
        return <AnsiblePhaseExecutionContainer abortCallBack={abortCallBack}
                                               heSetupModel={heSetupModel}
                                               isLastStep={isLastStep}
                                               phase={phase}
                                               restartCallBack={restartCallBack}
                                               terminationCallBack={terminationCallBack}/>
    } else {
        return <ReviewStepPanelContainer reviewSteps={sections} />
    }
};

export default AnsiblePhasePreview;