import React from 'react'
import classNames from 'classnames'

const HeSetupInputPanel = ({errorText, handleInput, handleKeyPress, handleSubmit, hasErrors,
                           input, prompt, type}) => {
    const inputClass = classNames({
        'col-xs-7': true,
        'form-group': true,
        'has-error': hasErrors
    });

    return (
        <div>
            <div className={inputClass} style={{paddingLeft: '0px'}}>
                <label
                    className="control-label he-input"
                    htmlFor="input">
                    {prompt}
                </label>
                <div className="form-inline">
                    <input
                        autoFocus
                        autoComplete="new-password"
                        type={type}
                        onChange={handleInput}
                        onKeyPress={handleKeyPress}
                        value={input}
                    />
                    <button
                        onClick={handleSubmit}
                        className="btn btn-default"
                        style={{marginLeft: '5px'}}>
                        Next
                    </button>
                </div>
                {errorText}
            </div>
        </div>
    )
};

export default HeSetupInputPanel;