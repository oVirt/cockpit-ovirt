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
            validatingSubsteps: false,
            nextButtonState: {}
        };

        this.subStepValidationCallBack = this.subStepValidationCallBack.bind(this);
        this.setNextButtonState = this.setNextButtonState.bind(this);
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

    setNextButtonState(buttonState) {
        this.setState({nextButtonState: buttonState});
        if (this.props.nextButtonStateCallBack !== null) {
            this.props.nextButtonStateCallBack(buttonState);
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (!this.props.validating && nextProps.validating) {
            this.props.validationCallBack(true);
        }

        return true;
    }

    render() {
        const that = this;
        const steps = [];

        this.props.children.forEach(function(step, index) {
            const isActiveSubStep = index === that.props.activeSubStep;

            const subStep = React.cloneElement(step, {
                activeStep: that.props.activeStep,
                activeSubStep: that.props.activeSubStep,
                validationCallBack: that.props.subStepValidationCallBack,
                validating: that.props.validating && index === that.props.activeSubStep,
                nextButtonStateCallBack: isActiveSubStep ? that.setNextButtonState : null
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