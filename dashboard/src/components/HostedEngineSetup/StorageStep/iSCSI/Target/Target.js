import React from 'react'
import TargetPortalGroupListContainer from "../TargetPortalGroupList/TargetPortalGroupListContainer";

const Target = ({handleTargetSelection, selectedTarget, target}) => {

    return (
        <div className="form-group">
            <div className="col-md-12 iscsi-target">
                <input type="radio"
                       className="iscsi-target-radio-button "
                       name="target"
                       value={target.name}
                       checked={selectedTarget === target.name}
                       onChange={(e) => handleTargetSelection(e.target.value)} />
                &nbsp;<span className="iscsi-target-name">{ target.name }</span>,&nbsp;
                <TargetPortalGroupListContainer tpgtList={target.tpgts} />
            </div>
        </div>
    )
};

export default Target;
