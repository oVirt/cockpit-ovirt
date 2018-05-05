import React, { Component } from 'react'
import Selectbox from '../common/Selectbox'
import classNames from 'classnames'
import GdeployUtil from './../../helpers/GdeployUtil'

class WizardFqdnStep extends Component {
    constructor(props) {
        super(props);
        this.state = {
            fqdns: props.fqdns,
            errorMsg: "",
            errorMsgs: {},
            fqdnPingStatus: true
        }
        this.updateFqdn = this.updateFqdn.bind(this);
        this.validate = this.validate.bind(this);
    }
    updateFqdn(index, fqdnaddress) {
        const fqdns = this.state.fqdns;
        fqdns[index] = fqdnaddress
        const errorMsgs= this.state.errorMsgs
        this.setState({ fqdns, errorMsgs })
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
    validate(fqdn, index) {
      let errorMsg = ""
      const errorMsgs= {}
      if(fqdn.length > 0) {
        this.trimFqdnProperties()
        let that = this
        GdeployUtil.isPingable(fqdn, function (pingStatus) {
          if(!pingStatus) {
            errorMsgs[index] = "Host is not reachable"
            that.state.fqdnPingStatus = false
          } else {
            that.state.fqdnPingStatus = true
          }
        })
        this.setState({ errorMsg, errorMsgs })
      }
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
            if (this.props.gdeployWizardType === "setup") {
                fqdnRows.push(
                  <FqdnRow fqdn={fqdn} key={index} fqdnNo={index + 1}
                    gdeployWizardType={that.props.gdeployWizardType}
                    errorMsg = {that.state.errorMsgs[index]}
                    deleteCallBack={() => this.handleDelete(index)}
                    changeCallBack={(e) => this.updateFqdn(index, e.target.value)}
                    validate={() => this.validate(fqdn, index)}
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
                <form className="form-horizontal">
                    {fqdnRows}
                    <div className="col-md-offset-2 col-md-8 alert alert-info gdeploy-wizard-host-ssh-info">
                        <span className="pficon pficon-info"></span>
                        <strong>
                            If you want to add the additional hosts automatically to Hosted Engine, then please provide FQDN or IP address to use.
                        </strong>
                    </div>
                </form>
            </div>
        )
    }
}

WizardFqdnStep.propTypes = {
    stepName: React.PropTypes.string.isRequired
}

const FqdnRow = ({fqdn, fqdnNo, gdeployWizardType, errorMsg, changeCallBack, deleteCallBack, validate}) => {
    const fqdnClass = classNames(
        "form-group",
        { "has-error": errorMsg && errorMsg.length > 0 }
    )
    return (
        <div>
            <div className={fqdnClass}>
                <label className="col-md-2 control-label">Host{fqdnNo + 1}
                </label>
                <div className="col-md-6">
                    {(gdeployWizardType === "setup") && <input type="text" id="fqdn" placeholder="FQDN or IP address"
                        title="Enter the FQDN or IP address to use for hosts."
                        className="form-control"
                        value={fqdn}
                        onChange={changeCallBack}
                        onBlur={() => validate(document.getElementById("fqdn").value, fqdnNo)}
                        />
                    }
                    {errorMsg && errorMsg.length > 0 && <span className="help-block">{errorMsg}</span>}
                </div>
            </div>
        </div>
    )
}
export default WizardFqdnStep
