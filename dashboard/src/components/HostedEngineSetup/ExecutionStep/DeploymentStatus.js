import React from 'react'
import { deploymentStatus, messages } from '../constants';

const DeploymentStatus = ({ status, reDeployCallback }) => {
    let msg = messages.DEPLOYMENT_IN_PROGRESS;
    let statusIcon = <div className="spinner spinner-lg blank-slate-pf-icon" />;
    if (status === deploymentStatus.FAILURE) {
        msg = messages.DEPLOYMENT_FAILED;
        statusIcon = <span className="pficon-error-circle-o" />;
    }
    return (
        <div>
            {statusIcon}
            <span>{msg}</span>
            <div className="pull-right">
                {status === deploymentStatus.FAILURE &&
                <button className="btn btn-primary" onClick={reDeployCallback}>
                    <span className="pficon pficon-restart">&nbsp;</span>
                    Redeploy
                </button>
                }
            </div>
        </div>
    )
};

export default DeploymentStatus;