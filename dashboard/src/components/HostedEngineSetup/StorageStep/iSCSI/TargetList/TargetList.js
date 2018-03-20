import React from 'react'
import TargetContainer from "../Target/TargetContainer";

const TargetList = ({handleTargetSelection, selectedTarget, targetList}) => {
    const targets = [];

    Object.getOwnPropertyNames(targetList).forEach(function(tgt, idx) {
        targets.push(<TargetContainer target={targetList[tgt]}
                                      handleTargetSelection={handleTargetSelection}
                                      selectedTarget={selectedTarget}
                                      key={idx} />);
    });

    return (
        <div className="form-group">
            <div className="col-md-12">The following targets have been found:</div>
            { targets }
        </div>
    )
};

export default TargetList;
