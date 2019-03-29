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
        this.runCleanUpPlaybook = this.runCleanUpPlaybook.bind(this)
    }
    componentDidMount() {
        this.runAnsiblePlaybook()
    }
    ansibleDone() {
        this.setState({ ansibleStatus: 0 })
        let filePath = CONFIG_FILES.ansibleStatus
        let fileContent = String(this.state.ansibleStatus)
        this.saveDeploymentLog(filePath, fileContent, 1)
    }
    ansibleStdout(data) {
        this.setState({ ansibleLog: this.state.ansibleLog + data })
    }
    ansibleFail(response) {
      this.setState({ ansibleStatus: -1 })
      const that = this;
      if(response.exit_status === 1) {
        this.ansibleStdout("ERROR! No inventory was parsed, please check your configuration and options. Could be problem in inventory file.")
      }
      let filePath = CONFIG_FILES.ansibleStatus
      let fileContent = String(this.state.ansibleStatus)
      this.saveDeploymentLog(filePath, fileContent, 1)
      that.setState({ ansibleLog: that.state.ansibleLog + "Please check "+ CONFIG_FILES.glusterDeploymentLog +" for more informations." })
    }
    runAnsiblePlaybook() {
      const that = this
      let filePath = CONFIG_FILES.ansibleInventoryFile
      if(this.props.ansibleWizardType == "expand_volume") {
        filePath = CONFIG_FILES.ansibleExpandVolumeInventoryFile
      }
      if(that.props.ansibleWizardType === "expand_cluster"){
        AnsibleUtil.runExpandCluster(function(response) {
          AnsibleUtil.runAnsiblePlaybook(that.props.isVerbosityEnabled, CONFIG_FILES.ansibleInventoryFile, that.ansibleStdout, that.ansibleDone, that.ansibleFail, function(response) {
            that.setState({ ansibleStatus: 1 })
            if(response === true){
              that.ansibleDone()
            } else {
              that.ansibleFail(response)
            }
          })
        })
      } else {
        AnsibleUtil.runAnsiblePlaybook(that.props.isVerbosityEnabled, filePath, that.ansibleStdout, that.ansibleDone, that.ansibleFail, function(response) {
          that.setState({ ansibleStatus: 1 })
          if(response === true){
            that.ansibleDone()
          } else {
            that.ansibleFail(response)
          }
        })
      }
    }
    runCleanUpPlaybook(){
      const that = this;
      this.state.ansibleLog = ""
      AnsibleUtil.runAnsibleCleanupPlaybook(this.ansibleStdout, this.ansibleDone, this.ansibleFail, function(response) {
        console.log("Cleanup playbook executed.");
        that.setState({ ansibleLog: that.state.ansibleLog + "Please check "+ CONFIG_FILES.glusterDeploymentCleanUpLog +" for more informations." })
        that.saveDeploymentLog(CONFIG_FILES.glusterDeploymentCleanUpLog, that.state.ansibleLog, 2)
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
    saveDeploymentLog(filePath, fileContent, n) {
      const that = this;
      if (n <= 2) {
        AnsibleUtil.handleDirAndFileCreation(filePath, fileContent, function (result) {
            console.log("Status File: ", result)
            that.saveDeploymentLog(CONFIG_FILES.glusterDeploymentLog, that.state.ansibleLog, n+1)
        })
      }
    }
    render() {
        if (this.state.ansibleStatus === 0) {
            return <SuccessPanel callBack={this.callBack} ansibleWizardType={this.props.ansibleWizardType} />
        }
        return (
            <div className="col-sm-12">
                <div className="panel panel-default">
                        <Status status={this.state.ansibleStatus} reDeployCallback={this.props.reDeployCallback} runCleanUpPlaybook={this.runCleanUpPlaybook}/>
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

const Status = ({ status, reDeployCallback, runCleanUpPlaybook}) => {
    let msg = "Deployment in progress"
    let statusIcon = <div className="spinner spinner-lg blank-slate-pf-icon"></div>
    if (status === -1) {
        msg = "Deployment failed"
        statusIcon = <span className="pficon-error-circle-o"></span>
    }
    return (
        <div className="panel-heading">
            {statusIcon}
            <span>{msg}</span>
            <div className="pull-right">
                {status === -1 &&
                  <div>
                     <button className="btn btn-primary" onClick={runCleanUpPlaybook}>
                        CleanUp
                     </button> &nbsp;
                     <button className="btn btn-primary" onClick={reDeployCallback}>
                        <span className="pficon pficon-restart">&nbsp;</span>
                        Redeploy
                     </button>
                  </div>
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
    } else if (ansibleWizardType === "expand_volume") {
        message = "Successfully expanded volume"
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
            { ansibleWizardType === "expand_volume" && <h5 className="blank-slate-pf-main-action">
                  Please run rebalance on the volume expanded.
                </h5>
            }
            <button type="button" className="btn btn-lg btn-primary"
                onClick={callBack}>
                {buttonLabel}
        </button>
        </div>
    )
}

export default WizardExecutionStep
