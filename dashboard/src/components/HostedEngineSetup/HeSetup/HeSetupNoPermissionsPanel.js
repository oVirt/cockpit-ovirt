import React from 'react'

const HeSetupNoPermissionsPanel = () => {
    return (
        <div className="curtains curtains-ct blank-slate-pf">
            <div className="container-center">
                <div className="blank-slate-pf-icon">
                    <i className="pficon-error-circle-o" />
                </div>
                <h1>
                    Hosted Engine Setup exited with "Access Denied". Does this user have
                    permissions to run it?
                </h1>
            </div>
        </div>
    )
};

export default HeSetupNoPermissionsPanel;