import React from 'react'
import PortalContainer from '../Portal/PortalContainer'

const PortalList = ({portalList}) => {
    const portals = [];

    portalList.forEach(function(portal, idx) {
        portals.push(<PortalContainer portal={portal} key={idx} />);
    });

    return (
        <span>
            { portals }
        </span>
    )
};

export default PortalList;