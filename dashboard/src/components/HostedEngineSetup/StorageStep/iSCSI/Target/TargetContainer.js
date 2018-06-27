import PropTypes from 'prop-types';
import React, { Component } from 'react'
import Target from './Target'

class TargetContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            target: this.props.target,
            handleTargetSelection: this.props.handleTargetSelection,
            selectedTarget: this.props.selectedTarget
        };
    }

    render() {
        return <Target target={this.state.target}
                       handleTargetSelection={this.state.handleTargetSelection}
                       selectedTarget={this.props.selectedTarget} />
    }
}

TargetContainer.propTypes = {
    target: PropTypes.object.isRequired,
    handleTargetSelection: PropTypes.func.isRequired,
    selectedTarget: PropTypes.string.isRequired
};

export default TargetContainer