import React from 'react'
import {deploymentStatus as status, messages} from '../constants';

const AnsiblePhaseExecution = ({isLastStep, output, phaseExecutionStatus, restartCallBack}) => {
    if (phaseExecutionStatus === status.SUCCESS) {
        return <DeploymentSuccessPanel isLastStep={isLastStep}
                                       restartCallBack={restartCallBack}/>
    } else {
        return <OutputPanel output={output}
                            phaseExecutionStatus={phaseExecutionStatus}
                            reDeployCallback={restartCallBack}/>
    }
};

export default AnsiblePhaseExecution;

const OutputPanel = ({output, phaseExecutionStatus, reDeployCallback}) => {
    const outputDiv = output.lines.map(function(line, i) {
        try {
            const ln = JSON.parse(line);
            const type = ln["OVEHOSTED_AC/type"].replace("OVEHOSTED_AC/", "").toUpperCase();
            const data = ln["OVEHOSTED_AC/body"];

            return (
                <span className="ansible-output-line" key={i}>
                    [ { type } ] { data }<br />
                </span>
            )
        } catch (e) {
            console.log("Error in Ansible JSON output. Error: " + e);
        }
    });

    return (
        <div className="panel panel-default ansible-output-container">
            <div className="panel-heading">
                <Status phaseExecutionStatus={phaseExecutionStatus} reDeployCallback={reDeployCallback}/>
            </div>
            <div className="he-input viewport ansible-output-panel">
                {outputDiv}
            </div>
        </div>
    )
};

const Status = ({phaseExecutionStatus, reDeployCallback}) => {
    let msg = "Deployment in progress";
    let statusIcon = <div className="spinner blank-slate-pf-icon deployment-status-spinner vertical-center"/>;
    if (phaseExecutionStatus === status.FAILURE) {
        msg = "Deployment failed";
        statusIcon = <span className="pficon-error-circle-o deployment-failure-icon"/>;
    }
    return (
        <div className="vertical-center">
            {statusIcon}
            <div className="vertical-center deployment-status-msg">{msg}</div>
            <div className="pull-right">
                {phaseExecutionStatus === status.FAILURE &&
                <button className="btn btn-primary" onClick={reDeployCallback}>
                    <span className="pficon pficon-restart">&nbsp;</span>
                    Redeploy
                </button>
                }
            </div>
        </div>
    )
};

const DeploymentSuccessPanel = ({isLastStep, restartCallBack}) => {
    const message = isLastStep ? messages.ANSIBLE_LAST_PHASE_SUCCESSFUL : messages.ANSIBLE_PHASE_SUCCESSFUL;
    return (
        <div className="wizard-pf-complete blank-slate-pf">
            <div className="wizard-pf-success-icon">
                <span className="glyphicon glyphicon-ok-circle" />
            </div>
            <h3 className="blank-slate-pf-main-action">
                {message}
            </h3>
            <br />
            <button className="btn btn-primary" onClick={restartCallBack}>
                <span className="pficon pficon-restart">&nbsp;</span>
                Rerun Step
            </button>
        </div>
    )
};