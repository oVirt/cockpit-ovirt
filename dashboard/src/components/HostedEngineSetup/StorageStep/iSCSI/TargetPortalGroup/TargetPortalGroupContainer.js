import PropTypes from 'prop-types';
import React, { Component } from 'react'
import TargetPortalGroup from './TargetPortalGroup'

class TargetPortalGroupContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            targetPortalGroup: this.props.targetPortalGroup
        };
    }

    render() {
        return <TargetPortalGroup targetPortalGroup={this.state.targetPortalGroup} />
    }
}

TargetPortalGroupContainer.propTypes = {
    targetPortalGroup: PropTypes.object.isRequired
};

export default TargetPortalGroupContainer