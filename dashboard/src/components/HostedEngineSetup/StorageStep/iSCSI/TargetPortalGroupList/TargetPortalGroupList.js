import React from 'react'
import TargetPortalGroupContainer from "../TargetPortalGroup/TargetPortalGroupContainer";

const TargetPortalGroupList = ({targetPortalGroupList}) => {
    const tpgts = [];

    Object.getOwnPropertyNames(targetPortalGroupList).forEach(function(tpgt, idx) {
        tpgts.push(<TargetPortalGroupContainer targetPortalGroup={targetPortalGroupList[tpgt]}
                                               key={idx} />);
    });

    return (
        <span>
            { tpgts }
        </span>
    )
};

export default TargetPortalGroupList;