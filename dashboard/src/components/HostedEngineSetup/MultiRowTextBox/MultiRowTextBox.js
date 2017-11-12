import React from 'react'
import InputRowContainer from './InputRowContainer'

const MultiRowTextBox = ({disableDeleteButton, errorMsgs, handleAdd, handleValueDelete, handleValueUpdate,
                         limitRows, values}) => {
    const valueRows = [];

    for (let i = 0; i < values.length; i++) {
        let isLastValue = i === (values.length - 1);
        let hideAddButton = !isLastValue || (isLastValue && limitRows);
        let disableAddButton = values[i] === "" || disableDeleteButton;

        valueRows.push(
            <InputRowContainer
                value={values[i]}
                key={i}
                index={i}
                errorMsgs={errorMsgs[i]}
                changeCallBack={handleValueUpdate}
                deleteCallBack={handleValueDelete}
                hideAddButton={hideAddButton}
                disableDeleteButton={disableDeleteButton}
                disableAddButton={disableAddButton}
                handleAdd={handleAdd}
            />
        )
    }

    return (
        <div>{valueRows}</div>
    )
};

export default MultiRowTextBox;