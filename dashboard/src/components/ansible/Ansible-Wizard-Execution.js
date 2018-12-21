import PropTypes from 'prop-types';
import React, { Component } from 'react'
import AnsibleUtil from '../../helpers/AnsibleUtil'
import ReactDOM from 'react-dom'
import { CONFIG_FILES } from './constants'

class WizardExecutionStep extends Component {
    constructor(props) {
        super(props);
        this.state = {
            ansibleLog: "",
            ansibleStatus: 1
        }
        this.ansibleDone = this.ansibleDone.bind(this)
        this.ansibleStdout = this.ansibleStdout.bind(this)
        this.ansibleFail = this.ansibleFail.bind(this)
        this.runAnsiblePlaybook = this.runAnsiblePlaybook.bind(this)
        this.callBack = this.callBack.bind(this)
    }
    componentDidMount() {
        this.runAnsiblePlaybook()
    }
    ansibleDone() {
        this.setState({ ansibleStatus: 0 })
        let filePath = CONFIG_FILES.ansibleStatus
        AnsibleUtil.handleDirAndFileCreation(filePath, String(this.state.ansibleStatus), function (result) {
            console.log("Status File: ", result)
        })
    }
    ansibleStdout(data) {
        this.setState({ ansibleLog: this.state.ansibleLog + data })
    }
    ansibleFail(exception) {
        this.setState({ ansibleStatus: -1 })
        let filePath = CONFIG_FILES.ansibleStatus
        AnsibleUtil.handleDirAndFileCreation(filePath, String(this.state.ansibleStatus), function (result) {
            console.log("Status File: ", result)
        })
    }
    runAnsiblePlaybook() {
        const that = this
      AnsibleUtil.runAnsiblePlaybook(CONFIG_FILES.ansibleInventoryFile, this.ansibleStdout, this.ansibleDone, this.ansibleFail, function(isSuccess) {
        that.setState({ ansibleStatus: 1 })
        if(isSuccess){
          that.ansibleDone()
        } else {
          that.ansibleFail(isSuccess)
        }
      })
    }
    callBack() {
        if (this.props.ansibleWizardType === "setup") {
            this.props.onSuccess(
              [this.props.heAnsweFilePath,
                this.props.heCommanAnswer
              ]
            )
        }
        else {
            this.props.onSuccess()
        }
    }
    componentDidUpdate(){
        this.scrollToBottom()
    }
    scrollToBottom(){
      if(this.ansibleLogText != null) {
        const scrollHeight = this.ansibleLogText.scrollHeight;
        const height = this.ansibleLogText.clientHeight;
        const maxScrollTop = scrollHeight - height;
        ReactDOM.findDOMNode(this.ansibleLogText).scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
      }
    }
    render() {
        if (this.state.ansibleStatus === 0) {
            return <SuccessPanel callBack={this.callBack} ansibleWizardType={this.props.ansibleWizardType} />
        }
        return (
            <div className="col-sm-12">
                <div className="panel panel-default">
                    <div className="panel-heading">
                        <Status status={this.state.ansibleStatus} reDeployCallback={this.props.reDeployCallback}/>
                    </div>
                    <div className="list-group">
                        <div className="list-group-item">
                            <textarea className="ansible-wizard-config-preview"
                                ref={(input) => { this.ansibleLogText = input }}
                                value={this.state.ansibleLog}>
                            </textarea>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

WizardExecutionStep.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    reDeployCallback: PropTypes.func.isRequired
}

const Status = ({ status, reDeployCallback }) => {
    let msg = "Deployment in progress"
    let statusIcon = <div className="spinner spinner-lg blank-slate-pf-icon"></div>
    if (status === -1) {
        msg = "Deployment failed"
        statusIcon = <span className="pficon-error-circle-o"></span>
    }
    return (
        <div>
            {statusIcon}
            <span>{msg}</span>
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
}

const SuccessPanel = ({ callBack, ansibleWizardType }) => {
    // Message to display in SuccessPanel
    let message = ""
    if (ansibleWizardType === "setup") {
        message = "Successfully deployed Gluster"
    } else if (ansibleWizardType === "expand_cluster") {
        message = "Successfully expanded cluster"
    } else {
        message = "Successfully created volume"
    }
    // Button Label
    let buttonLabel = ""
    if (ansibleWizardType === "setup") {
        buttonLabel = "Continue to Hosted Engine Deployment"
    } else {
        buttonLabel = "Close"
    }
    return (
        <div className="wizard-pf-complete blank-slate-pf">
            <div className="wizard-pf-success-icon">
                <span className="glyphicon glyphicon-ok-circle"></span>
            </div>
            <h5 className="blank-slate-pf-main-action">
                {message}
            </h5>
            <button type="button" className="btn btn-lg btn-primary"
                onClick={callBack}>
                {buttonLabel}
        </button>
        </div>
    )
}

export default WizardExecutionStep
