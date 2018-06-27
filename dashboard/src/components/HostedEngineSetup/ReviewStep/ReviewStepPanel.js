import PropTypes from 'prop-types';
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
            <ReviewStepPanel headerText={this.props.headerText}
                             reviewSteps={this.props.reviewSteps.steps} />
        )
    }
}

ReviewStepPanelContainer.propTypes = {
    headerText: PropTypes.string,
    reviewSteps: PropTypes.object.isRequired
};

const ReviewStepPanel = ({headerText, reviewSteps}) => {
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
        <div className="form-horizontal he-form-container">
            <div className="row">
                <div className="col-md-11 he-wizard-step-header he-wizard-preview-step-header">
                    { headerText }
                </div>
            </div>
            <div className="wizard-pf-review-steps">
                <ul className="list-group">
                    { steps }
                </ul>
            </div>
        </div>
    )
};

export default ReviewStepPanelContainer;