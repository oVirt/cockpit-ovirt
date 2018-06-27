import PropTypes from 'prop-types';
import React, { Component } from 'react'
import MultiRowTextBox from './MultiRowTextBox'

class MultiRowTextBoxContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            values: props.values,
            errorMsg: "",
            errorMsgs: {}
        };

        this.handleAdd = this.handleAdd.bind(this);
    }

    handleAdd() {
        const values = this.state.values;
        values.push("");
        this.setState({ values })
    }

    render() {
        const values = this.state.values;
        let disableDeleteButton = false;

        const rowLimitProvided = typeof this.props.rowLimit !== "undefined";
        let limitRows = rowLimitProvided && (values.length === this.props.rowLimit);

        if (values.length === 0) {
            values.push("");
            disableDeleteButton = true;
        } else if (values.length === 1 && values[0] === "") {
            disableDeleteButton = true;
        }

        return (
            <MultiRowTextBox
                errorMsgs={this.state.errorMsgs}
                handleAdd={this.handleAdd}
                handleValueDelete={this.props.handleValueDelete}
                handleValueUpdate={this.props.handleValueUpdate}
                limitRows={limitRows}
                disableDeleteButton={disableDeleteButton}
                values={values}/>
        )
    }
}

MultiRowTextBoxContainer.propTypes = {
    values: PropTypes.array.isRequired,
    itemType: PropTypes.string.isRequired,
    rowLimit: PropTypes.number,
    handleValueUpdate: PropTypes.func.isRequired,
    handleValueDelete: PropTypes.func.isRequired
};

export default MultiRowTextBoxContainer;