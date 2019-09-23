import PropTypes from 'prop-types';
import React, { Component } from 'react'
import Selectbox from '../common/Selectbox'
import classNames from 'classnames'
import AnsibleUtil from './../../helpers/AnsibleUtil'

class WizardFqdnStep extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hosts: props.hosts,
            fqdns: props.fqdns,
            errorMsg: "",
            errorMsgs: {},
            fqdnPingStatus: true
        }
        this.updateFqdn = this.updateFqdn.bind(this);
        this.validate = this.validate.bind(this);
        this.handleSameFqdnAsHost = this.handleSameFqdnAsHost.bind(this);
    }
    updateFqdn(index, fqdnaddress) {
        const fqdns = this.state.fqdns;
        fqdns[index] = fqdnaddress
        const errorMsgs= this.state.errorMsgs
        this.setState({ fqdns, errorMsgs })
    }
    handleSameFqdnAsHost() {
      var checkbox = document.getElementById('handleSameFqdnAsHost')
      var fqdnsInput = document.querySelectorAll("[id='fqdn']")
      var hosts = this.state.hosts
      var fqdns = this.state.fqdns
      const that = this
      if(checkbox.checked) {
          fqdnsInput.forEach(function (key, index) {
              key.setAttribute("disabled", "true")
              key.value=hosts[index+1]
              fqdns[index]=hosts[index+1]
              that.validate(fqdns)
          })
      } else {
          fqdnsInput.forEach(function (key, index) {
              key.removeAttribute("disabled")
              key.value=""
              fqdns[index]=""
          })
      }
      this.setState(fqdns)
    }
    // Trim "Fqdn2" and "Fqdn3" values
    trimFqdnProperties(){
      const inFqdns = this.state.fqdns
      if(inFqdns.length > 0){
        for(var i =0; i< inFqdns.length; i++){
          this.state.fqdns[i] = inFqdns[i].trim()
        }
      }
    }
    validate(fqdns) {
      let errorMsg = ""
      const errorMsgs= {}
      let that = this
      fqdns.forEach(function (fqdn, index) {
        if(fqdn.length > 0) {
          that.trimFqdnProperties()
          AnsibleUtil.isPingable(fqdn, function (pingStatus) {
            if(!pingStatus) {
              errorMsgs[index] = "Host is not reachable"
              that.state.fqdnPingStatus = false
              that.setState({ errorMsg, errorMsgs })
            } else {
              AnsibleUtil.isHostAddedInKnownHosts(fqdn, function(isAdded) {
                if(!isAdded) {
                  errorMsgs[index] = "FQDN is not added in known_hosts"
                  that.state.fqdnPingStatus = false
                  that.setState({ errorMsg, errorMsgs })
                } else if(!that.state.fqdnPingStatus) {
                  that.state.fqdnPingStatus = true
                }
              })
            }
            that.setState({ errorMsg, errorMsgs })
          })
        }
      })
    }
    shouldComponentUpdate(nextProps, nextState){
        const that = this
        if(!this.props.validating && nextProps.validating){
          let errorMsg = ""
          let errorMsgs= {}
          let index = 0
          if(this.state.fqdns[1].length === 0) {
            index = 1
          }
          if(this.state.fqdns[0].length === 0 && this.state.fqdns[1].length > 0
            || this.state.fqdns[0].length > 0 && this.state.fqdns[1].length === 0 ) {
            errorMsgs[index] = "Please provide fqdn or ip for both hosts."
            that.state.fqdnPingStatus = false
            this.setState({ errorMsg, errorMsgs })
          } else if(this.state.fqdns[0] !== "" && this.state.fqdns[1] !== "" && this.state.fqdns[0] === this.state.fqdns[1]) {
            errorMsgs[index] = "Both fqdn or ip can not be same."
            that.state.fqdnPingStatus = false
            this.setState({ errorMsg, errorMsgs })
          } else if(this.state.fqdns[0].length === 0 && this.state.fqdns[1].length === 0 && !this.state.fqdnPingStatus) {
            that.state.fqdnPingStatus = true
          }
          this.props.validationCallBack(this.state.fqdnPingStatus)
        }
        return true;
    }
    componentDidMount(){
        $('[data-toggle=popover]').popovers()
    }
    render() {
        const fqdnRows = [];
        const that = this
        this.state.fqdns.forEach(function (fqdn, index) {
            if (this.props.ansibleWizardType === "setup") {
                fqdnRows.push(
                  <FqdnRow fqdn={fqdn} key={index} fqdnNo={index + 1}
                    ansibleWizardType={that.props.ansibleWizardType}
                    errorMsg = {that.state.errorMsgs[index]}
                    deleteCallBack={() => this.handleDelete(index)}
                    changeCallBack={(e) => this.updateFqdn(index, e.target.value)}
                    validate={() => this.validate(this.state.fqdns)}
                  />
                )
            }
        }, this)
        return (
            <div>
                {this.state.errorMsg && <div className="alert alert-danger">
                    <span className="pficon pficon-error-circle-o"></span>
                    <strong>{this.state.errorMsg}</strong>
                </div>
                }
                <div className="col-md-offset-2 fqdnCheckboxDiv">
                    <input type="checkbox" id="handleSameFqdnAsHost" onChange={(e) => this.handleSameFqdnAsHost()}/>
                    <strong className="fqdnCheckboxTextInfo">
                          Use same hostnames as in previous step
                    </strong>
                </div>
                <form className="form-horizontal">
                    {fqdnRows}
                    <div className="col-md-offset-2 col-md-8 alert alert-info ansible-wizard-host-ssh-info">
                        <span className="pficon pficon-info"></span>
                        <strong>
                            Provide the address used to add the additional hosts to be
                            managed by Hosted Engine preferrably FQDN or IP address.
                            And both FQDN needs to be added in known_hosts file.
                        </strong>
                    </div>
                </form>
            </div>
        )
    }
}

WizardFqdnStep.propTypes = {
    stepName: PropTypes.string.isRequired
}

const FqdnRow = ({fqdn, fqdnNo, ansibleWizardType, errorMsg, changeCallBack, deleteCallBack, validate}) => {
    const fqdnClass = classNames(
        "form-group",
        { "has-error": errorMsg && errorMsg.length > 0 }
    )
    let id = "fqdn"+fqdnNo
    return (
        <div>
            <div className={fqdnClass}>
                <label className="col-md-2 control-label">Host{fqdnNo + 1}
                </label>
                <div className="col-md-6">
                    {(ansibleWizardType === "setup") && <input type="text" id={id} placeholder="FQDN or IP address"
                        title="Enter the FQDN or IP address to use for hosts."
                        className="form-control"
                        value={fqdn}
                        onChange={changeCallBack}
                        onBlur={() => validate(document.getElementById("fqdn").value)}
                        />
                    }
                    {errorMsg && errorMsg.length > 0 && <span className="help-block">{errorMsg}</span>}
                </div>
            </div>
        </div>
    )
}
export default WizardFqdnStep
