import PropTypes from 'prop-types';
import React, { Component } from 'react'
import ReviewItemContainer from './ReviewItem'

class ReviewItemListContainer extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <ReviewItemList collapsed={this.props.collapsed}
                            reviewItemsList={this.props.reviewItems} />
        )
    }
}

ReviewItemListContainer.propTypes = {
    collapsed: PropTypes.bool.isRequired,
    reviewItems: PropTypes.array.isRequired
};

const ReviewItemList = ({collapsed, reviewItemsList}) => {
    const reviewItems = [];
    let idx = 0;
    reviewItemsList.forEach(
        function(item) {
            reviewItems.push(<ReviewItemContainer key={item.itemLabel + idx++}
                                                  reviewItem={item} />);
        }
    );

    const contentClasses = collapsed ? "wizard-pf-review-content collapse" : "wizard-pf-review-content";

    return (
        <div className={ contentClasses }>
            <form className="form">
                { reviewItems }
            </form>
        </div>
    )
};

export default ReviewItemListContainer;