import React, { Component } from 'react'
import InputRow from './InputRow'

class InputRowContainer extends Component {

    constructor(props) {
        super(props);

        this.onValueChange = this.onValueChange.bind(this);
        this.onValueDelete = this.onValueDelete.bind(this);
    }

    onValueChange(value) {
        this.props.changeCallBack(this.props.index, value);
    }

    onValueDelete() {
        this.props.deleteCallBack(this.props.index);
    }

    render () {
        return (
            <InputRow
                disableAddButton={this.props.disableAddButton}
                disableDeleteButton={this.props.disableDeleteButton}
                errorMsgs={this.props.errorMsgs}
                handleAdd={this.props.handleAdd}
                hideAddButton={this.props.hideAddButton}
                onValueChange={this.onValueChange}
                onValueDelete={this.onValueDelete}
                value={this.props.value}
            />
        )
    }
}

export default InputRowContainer;