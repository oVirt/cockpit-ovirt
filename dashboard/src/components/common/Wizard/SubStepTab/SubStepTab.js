import React from 'react'

const SubStepTab = ({stepNumber, stepName, subStepIndex, isActiveStep, handleActiveSubStepChange}) => {
    const itemClassNames = isActiveStep ? "list-group-item active" : "list-group-item";

    return (
        <li className={itemClassNames}>
            <a href="javascript:void(0)" onClick={() => handleActiveSubStepChange(subStepIndex)}>
                <span className="wizard-pf-substep-number">{stepNumber}.</span>
                <span className="wizard-pf-substep-title">{stepName}</span>
            </a>
        </li>
    )
};

export default SubStepTab;