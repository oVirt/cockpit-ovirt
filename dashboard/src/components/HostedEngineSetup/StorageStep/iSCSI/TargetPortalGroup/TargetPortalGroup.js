import React from 'react'
import PortalListContainer from '../PortalList/PortalListContainer'

const TargetPortalGroup = ({targetPortalGroup}) => {

    return (
        <span>
            <span>
                TPGT: { targetPortalGroup.name }
            </span>
            <div className="row">
                <div className="col-md-6 target-portal-group">
                    <PortalListContainer portalList={targetPortalGroup.portals} />
                </div>
            </div>
        </span>
    )
};

export default TargetPortalGroup;