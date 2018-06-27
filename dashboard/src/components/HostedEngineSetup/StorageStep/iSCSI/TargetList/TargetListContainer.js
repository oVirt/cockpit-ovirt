import PropTypes from 'prop-types';
import React, { Component } from 'react'
import TargetList from './TargetList'

class TargetListContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            targetList: this.props.targetList,
            selectedTarget: Object.getOwnPropertyNames(this.props.targetList)[0],
            storageConfig: this.props.storageConfig
        };
    }


    render() {
        return (
                <TargetList targetList={this.state.targetList}
                            handleTargetSelection={this.props.handleTargetSelection}
                            selectedTarget={this.props.selectedTarget} />
        )
    }
}

TargetListContainer.propTypes = {
    targetList: PropTypes.object.isRequired
};

export default TargetListContainer