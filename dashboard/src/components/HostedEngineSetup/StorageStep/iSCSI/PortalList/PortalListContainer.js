import React, { Component } from 'react'
import PortalList from './PortalList'

class PortalListContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            portalList: this.props.portalList
        };
    }

    render() {
        return <PortalList portalList={this.state.portalList} />
    }
}

PortalListContainer.propTypes = {
    portalList: React.PropTypes.array.isRequired
};

export default PortalListContainer