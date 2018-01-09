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
        const that = this;
        const steps = [];

        this.props.children.forEach(function(step, index) {
            const subStep = React.cloneElement(step, {
                activeStep: that.props.activeStep,
                activeSubStep: that.props.activeSubStep,
                validationCallBack: that.props.subStepValidationCallBack,
                validating: that.props.validating && index === that.props.activeSubStep
            });

            const comp = classNames(
                { "hidden": index !== that.props.activeSubStep }
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