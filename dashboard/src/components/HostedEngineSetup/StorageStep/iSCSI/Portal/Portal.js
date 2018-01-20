import React from 'react'

const Portal = ({portal}) => {
    return (
        <div>
            {portal.portal.slice(0, portal.portal.indexOf(","))}
        </div>
    )
};

export default Portal;