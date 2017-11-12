import React from 'react'

const HeSetupOutputPanel = ({output}) => {
    const outputDiv = output.lines.map(function(line, i) {
        return (
            <span key={i}>
                {line}<br />
            </span>
        )
    });

    return (
        <div className="panel panel-default viewport">
            <div className="he-input">
                {outputDiv}
            </div>
        </div>
    )
};

export default HeSetupOutputPanel;