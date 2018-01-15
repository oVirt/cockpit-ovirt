import React from 'react'
import {deploymentStatus, messages} from '../constants';

const AnsiblePhaseExecution = ({output, phaseExecutionStatus, restartCallBack}) => {
    if (phaseExecutionStatus === deploymentStatus.SUCCESS) {
        return <DeploymentSuccessPanel restartCallBack={restartCallBack}/>
    } else {
        return <OutputPanel output={output}
                            phaseExecutionStatus={phaseExecutionStatus}
                            reDeployCallback={restartCallBack}/>
    }
};

export default AnsiblePhaseExecution;

const OutputPanel = ({output, phaseExecutionStatus, reDeployCallback}) => {
    const outputDiv = output.lines.map(function(line, i) {
        return (
            <span className="ansible-output-line" key={i}>
                {line}<br />
            </span>
        )
    });

    return (
        <div className="panel panel-default ansible-output-container">
            <div className="panel-heading">
                <Status status={phaseExecutionStatus} reDeployCallback={reDeployCallback}/>
            </div>
            <div className="he-input viewport ansible-output-panel">
                {outputDiv}
            </div>
        </div>
    )
};

const Status = ({ status, reDeployCallback }) => {
    let msg = "Deployment in progress";
    let statusIcon = <div className="spinner blank-slate-pf-icon deployment-status-spinner vertical-center"/>;
    if (status === -1) {
        msg = "Deployment failed";
        statusIcon = <span className="pficon-error-circle-o deployment-failure-icon"/>;
    }
    return (
        <div className="vertical-center">
            {statusIcon}
            <div className="vertical-center deployment-status-msg">{msg}</div>
            <div className="pull-right">
                {status === -1 &&
                <button className="btn btn-primary" onClick={reDeployCallback}>
                    <span className="pficon pficon-restart">&nbsp;</span>
                    Redeploy
                </button>
                }
            </div>
        </div>
    )
};

const DeploymentSuccessPanel = ({ restartCallBack }) => {
    return (
        <div className="wizard-pf-complete blank-slate-pf">
            <div className="wizard-pf-success-icon">
                <span className="glyphicon glyphicon-ok-circle" />
            </div>
            <h3 className="blank-slate-pf-main-action">
                {messages.ANSIBLE_PHASE_SUCCESSFUL}
            </h3>
            <br />
            <button className="btn btn-primary" onClick={restartCallBack}>
                <span className="pficon pficon-restart">&nbsp;</span>
                Rerun Setup
            </button>
        </div>
    )
};