import React, { Component } from 'react'
import ReviewItemListContainer from "./ReviewItemList";

class ReviewStepContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            collapsed: false
        };

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        const collapsedState = this.state.collapsed;
        this.setState({ collapsed: !collapsedState });
    }

    render() {
        return (
            <ReviewStep stepName={this.props.stepName}
                        isSubStep={this.props.isSubStep}
                        reviewItems={this.props.reviewItems}
                        handleClick={this.handleClick}
                        collapsed={this.state.collapsed} />
        )
    }
}

ReviewStepContainer.propTypes = {
    stepName: React.PropTypes.string.isRequired,
    isSubStep: React.PropTypes.bool.isRequired,
    reviewItems: React.PropTypes.array.isRequired
};

const ReviewStep = ({collapsed, handleClick, isSubStep, stepName, reviewItems}) => {
    const anchorClasses = collapsed ? "collapsed" : "";
    return (
        <li className="list-group-item">
            <a className={anchorClasses} onClick={() => handleClick()}>{ stepName }</a>
            <ReviewItemListContainer collapsed={collapsed}
                                     reviewItems={reviewItems}/>
        </li>
    )
};

export default ReviewStepContainer;