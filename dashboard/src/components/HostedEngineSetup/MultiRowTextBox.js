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

        const addRowLabel = " Add " + this.props.itemType;

        const rowLimitProvided = typeof this.props.rowLimit !== "undefined";
        let limitRows = rowLimitProvided && (values.length < this.props.rowLimit);

        values.forEach(function (value, index) {
            valueRows.push(
                <InputRow value={value} key={index} index={index}
                          errorMsgs={that.state.errorMsgs[index]}
                          changeCallBack={that.props.handleValueUpdate}
                          deleteCallBack={that.props.handleValueDelete}
                />
            );
        }, this);

        return (
            <div>
                <div>{valueRows}</div>

                {limitRows &&
                    <div>
                        <a onClick={this.handleAdd}>
                            <span className="pficon pficon-add-circle-o">
                                <strong>{addRowLabel}</strong>
                            </span>
                        </a>
                    </div>
                }
            </div>
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
            { "has-error": this.props.errorMsgs && this.props.errorMsgs.value }
        );

        return (
            <div className="he-input-row">
                <div className="col-md-8">
                    <div className={input}>
                        <input type="text" className="form-control"
                               value={this.props.value}
                               onChange={(e) => this.onValueChange(e.target.value)}
                        />
                        {this.props.errorMsgs && this.props.errorMsgs.name &&
                            <span className="help-block">
                                {this.props.errorMsgs.name}
                            </span>}
                    </div>
                </div>

                <div className="col-sm-1">
                    <a onClick={(e) => this.onValueDelete()}>
                        <span className="pficon pficon-delete gdeploy-wizard-delete-icon">
                        </span>
                    </a>
                </div>
                <br />
            </div>
        )
    }
}

export default MultiRowTextBox