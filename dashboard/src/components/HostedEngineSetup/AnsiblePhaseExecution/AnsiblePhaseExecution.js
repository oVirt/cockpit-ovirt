import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import {deploymentStatus as status, messages} from '../constants';

const AnsiblePhaseExecution = ({isLastStep, output, phaseExecutionStatus}) => {
    if (phaseExecutionStatus === status.SUCCESS) {
        return <DeploymentSuccessPanel isLastStep={isLastStep} />
    } else {
        return <OutputPanel output={output}
                            phaseExecutionStatus={phaseExecutionStatus} />
    }
};

export default AnsiblePhaseExecution;

class OutputPanel extends Component {
    constructor(props) {
        super(props);
        this.state = {
            output: this.props.output
        };

        this.scrollToBottom = this.scrollToBottom.bind(this);
    }

    scrollToBottom() {
        const scrollHeight = this.node.scrollHeight;
        const height = this.node.clientHeight;
        const maxScrollTop = scrollHeight - height;
        ReactDOM.findDOMNode(this.node).scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
    }

    componentDidUpdate() {
        this.scrollToBottom()
    }

    render() {
        const outputLines = this.props.output.lines.filter(n => n);
        const outputDiv = outputLines.map(function (line, i) {
            try {
                const ln = JSON.parse(line);
                const type = ln["OVEHOSTED_AC/type"].replace("OVEHOSTED_AC/", "").toUpperCase();
                const data = ln["OVEHOSTED_AC/body"];

                return (
                    <span className="ansible-output-line" key={i}>
                    [ {type} ] {data}<br/>
                </span>
                )
            } catch (e) {
                console.log("Error in Ansible JSON output. Error: " + e);
            }
        });

        return (
            <div className="panel panel-default ansible-output-container">
                <div className="panel-heading">
                    <Status phaseExecutionStatus={this.props.phaseExecutionStatus} />
                </div>
                <div className="he-input viewport ansible-output-panel"
                     ref={input => this.node = input}>
                    {outputDiv}
                </div>
            </div>
        )
    }
}

const Status = ({phaseExecutionStatus}) => {
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
        </div>
    )
};

const DeploymentSuccessPanel = ({isLastStep}) => {
    const message = isLastStep ? messages.ANSIBLE_LAST_PHASE_SUCCESSFUL : messages.ANSIBLE_PHASE_SUCCESSFUL;
    return (
        <div className="wizard-pf-complete blank-slate-pf">
            <div className="wizard-pf-success-icon">
                <span className="glyphicon glyphicon-ok-circle" />
            </div>
            <h3 className="blank-slate-pf-main-action">
                {message}
            </h3>
        </div>
    )
};
