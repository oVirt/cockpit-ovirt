import React from 'react'
import { messages } from '../constants';

const DeploymentSuccessPanel = () => {
    return (
        <div className="wizard-pf-complete blank-slate-pf">
            <div className="wizard-pf-success-icon">
                <span className="glyphicon glyphicon-ok-circle" />
            </div>
            <h5 className="blank-slate-pf-main-action">
                {messages.DEPLOYMENT_SUCCESSFUL}
            </h5>
        </div>
    )
};

export default DeploymentSuccessPanel;