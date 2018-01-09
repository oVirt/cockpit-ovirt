import React, { Component } from 'react'
import SubStepTab from './SubStepTab'

class SubStepTabContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            stepIndex: this.props.stepIndex,
            activeStep: this.props.activeStep,
            subStepIndex: this.props.subStepIndex,
            activeSubStep: this.props.activeSubStep,
            stepNumber: this.props.stepNumber,
            stepName: this.props.stepName,
            handleActiveSubStepChange: this.props.handleActiveSubStepChange
        };
    }

    render() {
        const isActiveStep = (this.props.activeStep === this.props.stepIndex) &&
                            (this.props.activeSubStep === this.props.subStepIndex);
        return <SubStepTab
                    stepIndex={this.state.stepIndex}
                    subStepIndex={this.state.subStepIndex}
                    stepNumber={this.state.stepNumber}
                    stepName={this.state.stepName}
                    isActiveStep={isActiveStep}
                    handleActiveSubStepChange={this.state.handleActiveSubStepChange} />
    }
}

SubStepTabContainer.propTypes = {
    stepIndex: React.PropTypes.number.isRequired,
    subStepIndex: React.PropTypes.number.isRequired,
    stepNumber: React.PropTypes.string.isRequired,
    stepName: React.PropTypes.string.isRequired,
    activeStep: React.PropTypes.number.isRequired,
    activeSubStep: React.PropTypes.number.isRequired,
    handleActiveSubStepChange: React.PropTypes.func.isRequired
};

export default SubStepTabContainer