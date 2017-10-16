import React, { Component } from 'react'
import classNames from 'classnames'

class MultiRowTextBox extends Component {
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
        const that = this;
        const values = this.state.values;
        const valueRows = [];
        let disableDeleteButton = false;

        const rowLimitProvided = typeof this.props.rowLimit !== "undefined";
        let limitRows = rowLimitProvided && (values.length === this.props.rowLimit);

        if (values.length === 0) {
            values.push("");
            disableDeleteButton = true;
        } else if (values.length === 1 && values[0] === "") {
            disableDeleteButton = true;
        }

        for (let i = 0; i < values.length; i++) {
            let isLastValue = i === (values.length - 1);
            let hideAddButton = !isLastValue || (isLastValue && limitRows);
            let disableAddButton = values[i] === "" || disableDeleteButton;

            valueRows.push(
                <InputRow value={values[i]} key={i} index={i}
                          errorMsgs={that.state.errorMsgs[i]}
                          changeCallBack={that.props.handleValueUpdate}
                          deleteCallBack={that.props.handleValueDelete}
                          hideAddButton={hideAddButton}
                          disableDeleteButton={disableDeleteButton}
                          disableAddButton={disableAddButton}
                          handleAdd={that.handleAdd}
                />
            )
        }

        return (
                <div>{valueRows}</div>
        )
    }
}

MultiRowTextBox.propTypes = {
    values: React.PropTypes.array.isRequired,
    itemType: React.PropTypes.string.isRequired,
    rowLimit: React.PropTypes.number,
    handleValueUpdate: React.PropTypes.func.isRequired,
    handleValueDelete: React.PropTypes.func.isRequired
};

class InputRow extends Component {

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
        const input = classNames(
            "form-group",
            "col-md-8",
            "multi-row-text-box-input",
            { "has-error": this.props.errorMsgs && this.props.errorMsgs.value }
        );

        const addButton = classNames(
            "btn", "btn-primary", "wizard-pf-next", "multi-row-text-box-add-button",
            {"hidden": this.props.hideAddButton, "disabled": this.props.disableAddButton}
        );

        return (
            <div className="he-input-row">
                <div className={input}>
                    <input type="text" className="form-control"
                           value={this.props.value}
                           onChange={(e) => this.onValueChange(e.target.value)}
                    />
                    {this.props.errorMsgs && this.props.errorMsgs.name &&
                        <span className="help-block">
                            {this.props.errorMsgs.name}
                        </span>
                    }
                </div>

                <div className="col-sm-3 multi-row-text-box-button-container">
                    <button type="button" className="btn btn-default" disabled={this.props.disableDeleteButton}
                            onClick={(e) => this.onValueDelete()}>
                        <span className="i fa fa-minus" />
                    </button>

                    <button type="button" className={addButton}
                            onClick={this.props.handleAdd}>
                        <span className="i fa fa-plus" />
                    </button>
                </div>

                <br />
            </div>
        )
    }
}

export default MultiRowTextBox