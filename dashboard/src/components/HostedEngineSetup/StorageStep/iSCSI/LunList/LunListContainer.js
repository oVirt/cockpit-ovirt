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
    lunList: React.PropTypes.array.isRequired,
    handleLunSelection: React.PropTypes.func.isRequired,
    selectedLun: React.PropTypes.string.isRequired
};

export default LunListContainer