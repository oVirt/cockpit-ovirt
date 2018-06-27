import PropTypes from 'prop-types';
import React, { Component } from 'react'
import Portal from './Portal'

class PortalContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            portal: this.props.portal
        };
    }

    render() {
        return <Portal portal={this.state.portal}/>
    }
}

PortalContainer.propTypes = {
    portal: PropTypes.object.isRequired
};

export default PortalContainer