import React, { Component } from 'react'
import SubStepTabContainer from '../SubStepTab/SubStepTabContainer'
import SubStepTabList from './SubStepTabList'

const alpha = ["A", "B", "C", "D", "E", "F", "G", "H", "I",
               "J", "K", "L", "M", "N", "O", "P", "Q", "R",
               "S", "T", "U", "V", "W", "X", "Y", "Z"];

class SubStepTabListContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            steps: this.props.steps,
            stepIndex: this.props.stepIndex,
            activeStep: this.props.activeStep,
            activeSubStep: this.props.activeSubStep,
            handleActiveSubStepChange: this.props.handleActiveSubStepChange
        };
    }

    render() {
        const subSteps = [];
        const self = this;

        this.state.steps.forEach(function(step, idx) {
            const subStep = <SubStepTabContainer
                                stepIndex={self.props.stepIndex}
                                subStepIndex={idx}
                                key={idx + 1}
                                stepNumber={(self.props.stepIndex + 1) + alpha[idx]}
                                stepName={step.props.stepName}
                                activeStep={self.props.activeStep}
                                activeSubStep={self.props.activeSubStep}
                                handleActiveSubStepChange={self.state.handleActiveSubStepChange} />;
            subSteps.push(subStep);
        });

        return <SubStepTabList subSteps={subSteps} hidden={this.props.stepIndex !== this.props.activeStep}/>
    }
}

SubStepTabListContainer.propTypes = {
    stepIndex: React.PropTypes.number.isRequired,
    steps: React.PropTypes.array.isRequired,
    activeStep: React.PropTypes.number.isRequired,
    activeSubStep: React.PropTypes.number.isRequired,
    handleActiveSubStepChange: React.PropTypes.func.isRequired
};

export default SubStepTabListContainer