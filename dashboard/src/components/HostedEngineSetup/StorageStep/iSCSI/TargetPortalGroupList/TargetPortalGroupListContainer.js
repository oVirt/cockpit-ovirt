import React, { Component } from 'react'
import TargetPortalGroupList from "./TargetPortalGroupList";

class TargetPortalGroupListContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tpgtList: this.props.tpgtList
        };
    }

    render() {
        return <TargetPortalGroupList targetPortalGroupList={this.state.tpgtList} />
    }
}

TargetPortalGroupListContainer.propTypes = {
    tpgtList: React.PropTypes.object.isRequired
};

export default TargetPortalGroupListContainer