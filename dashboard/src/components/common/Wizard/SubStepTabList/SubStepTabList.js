import React from 'react'

const SubStepTabList = ({hidden, subSteps}) => {

    const classes = "wizard-pf-sidebar" + (hidden ? " hidden" : "");

    return (
        <div className={classes}>
            <ul className="list-group">
                {subSteps}
            </ul>
        </div>
    )
};

export default SubStepTabList;