import React from 'react'
import classNames from 'classnames'

const InputRow = ({disableAddButton, disableDeleteButton, errorMsgs, handleAdd, hideAddButton,
                             onValueChange, onValueDelete, value }) => {
    const input = classNames(
        "form-group",
        "col-md-8",
        "multi-row-text-box-input",
        { "has-error": errorMsgs && errorMsgs.value }
    );

    const addButton = classNames(
        "btn", "btn-primary", "wizard-pf-next", "multi-row-text-box-add-button",
        {"hidden": hideAddButton, "disabled": disableAddButton}
    );

    return (
        <div className="he-input-row">
            <div className={input}>
                <input type="text" className="form-control"
                       value={value}
                       onChange={(e) => onValueChange(e.target.value)}
                />
                {errorMsgs && errorMsgs.name &&
                <span className="help-block">
                            {errorMsgs.name}
                        </span>
                }
            </div>

            <div className="col-sm-3 multi-row-text-box-button-container">
                <button type="button" className="btn btn-default" disabled={disableDeleteButton}
                        onClick={(e) => onValueDelete()}>
                    <span className="i fa fa-minus" />
                </button>

                <button type="button" className={addButton}
                        onClick={handleAdd}>
                    <span className="i fa fa-plus" />
                </button>
            </div>

            <br />
        </div>
    )
};

export default InputRow;