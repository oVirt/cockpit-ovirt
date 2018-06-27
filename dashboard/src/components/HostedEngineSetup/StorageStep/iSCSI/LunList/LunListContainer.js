import PropTypes from 'prop-types';
import React, { Component } from 'react'
import LunList from './LunList'

class LunListContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            lunList: this.props.lunList,
            selectedLun: this.props.selectedLun,
            storageConfig: this.props.storageConfig
        };
    }

    render() {
        return <LunList lunList={this.state.lunList}
                        handleLunSelection={this.props.handleLunSelection}
                        selectedLun={this.props.selectedLun}
                        storageConfig={this.props.storageConfig} />
    }
}

LunListContainer.propTypes = {
    lunList: PropTypes.array.isRequired,
    handleLunSelection: PropTypes.func.isRequired,
    selectedLun: PropTypes.string.isRequired
};

export default LunListContainer