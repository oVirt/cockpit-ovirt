import React from 'react'

const HeSetupMessagePanel = ({messages, type, icon}) => {
    const classes = "he-setup-messages alert alert-" + type;
    const iconClasses = "pficon pficon-" + icon;

    const output = messages.map(function(message, i) {
        return <div key={i}>
            <span className={iconClasses} />
            {message}
        </div>
    }, this);

    return (
        <div className={classes}>{output}</div>
    )
};

export default HeSetupMessagePanel;