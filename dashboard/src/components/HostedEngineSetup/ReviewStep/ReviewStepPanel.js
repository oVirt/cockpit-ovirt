import React, { Component } from 'react'
import ReviewStepContainer from "./ReviewStep";

class ReviewStepPanelContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            reviewSteps: this.props.reviewSteps
        }
    }

    render() {
        return (
            <ReviewStepPanel reviewSteps={this.props.reviewSteps.steps} />
        )
    }
}

ReviewStepPanelContainer.propTypes = {
    reviewSteps: React.PropTypes.object.isRequired
};

const ReviewStepPanel = ({reviewSteps}) => {
    const steps = [];
    let idx = 0;
    reviewSteps.forEach(
        function(step) {
            steps.push(<ReviewStepContainer stepName={step.stepName}
                                            key={step.stepName + idx++}
                                            reviewItems={step.reviewItems}
                                            isSubStep={false} />);
        }
    );

    return (
        <div className="wizard-pf-review-steps">
            <ul className="list-group">
                { steps }
            </ul>
        </div>
    )
};

export default ReviewStepPanelContainer;