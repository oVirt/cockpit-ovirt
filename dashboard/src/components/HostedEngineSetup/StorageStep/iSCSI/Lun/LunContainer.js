import React, { Component } from 'react'
import Lun from './Lun'

class LunContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            lun: this.props.lun,
            handleLunSelection: this.props.handleLunSelection,
            selectedLun: this.props.selectedLun
        };
    }

    render() {
        return <Lun lun={this.state.lun}
                    handleLunSelection={this.state.handleLunSelection}
                    selectedLun={this.props.selectedLun} />
    }
}

LunContainer.propTypes = {
    lun: React.PropTypes.object.isRequired,
    handleLunSelection: React.PropTypes.func.isRequired,
    selectedLun: React.PropTypes.string.isRequired
};

export default LunContainer