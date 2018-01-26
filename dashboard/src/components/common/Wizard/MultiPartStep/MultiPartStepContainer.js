import React, { Component } from 'react'
import MultiPartStep from './MultiPartStep'
import classNames from 'classnames'

class MultiPartStepContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            stepName: this.props.stepName,
            activeStep: this.props.activeStep,
            activeSubStep: this.props.activeSubStep,
            stepIndex: this.props.stepIndex,
            steps: [],
            validatingSubsteps: false
        };

        this.subStepValidationCallBack = this.subStepValidationCallBack.bind(this);
    }

    subStepValidationCallBack(isValid) {
        const newState = {
            validatingSubsteps: false
        };

        if (isValid) {
            newState.validatingSubsteps = this.state.nextStep;
        }

        this.setState(newState);
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (!this.props.validating && nextProps.validating) {
            this.props.validationCallBack(true);
        }

        return true;
    }

    render() {
        const self = this;
        const steps = [];

        this.props.children.forEach(function(step, index) {
            const isActiveSubStep = index === self.props.activeSubStep;

            const subStep = React.cloneElement(step, {
                stepIndex: self.props.stepIndex,
                subStepIndex: index,
                activeStep: self.props.activeStep,
                activeSubStep: self.props.activeSubStep,
                stepCount: self.props.stepCount,
                validationCallBack: self.props.subStepValidationCallBack,
                validating: self.props.validating && index === self.props.activeSubStep,
                registerCustomActionBtnStateCallback: self.props.registerCustomActionBtnStateCallback
            });

            const comp = classNames(
                { "hidden": !isActiveSubStep }
            );

            steps.push(
                <div key={index} className={comp}>
                    {subStep}
                </div>);
        });


        return <MultiPartStep steps={steps}/>
    }
}

MultiPartStepContainer.propTypes = {
    stepName: React.PropTypes.string.isRequired
};

export default MultiPartStepContainer