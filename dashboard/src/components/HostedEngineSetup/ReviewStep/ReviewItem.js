import React, { Component } from 'react'

class ReviewItemContainer extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <ReviewItem itemLabel={this.props.reviewItem.itemLabel}
                        itemValue={this.props.reviewItem.itemValue} />
        )
    }
}

ReviewItemContainer.propTypes = {
    reviewItem: React.PropTypes.object.isRequired
};

const ReviewItem = ({itemLabel, itemValue}) => {
    return (
        <div className="wizard-pf-review-item">
            <span className="wizard-pf-review-item-label">{ itemLabel }:</span>
            <span className="wizard-pf-review-item-value">{ itemValue === "" ? <em>(None)</em> : itemValue }</span>
        </div>
    )
};

export default ReviewItemContainer;