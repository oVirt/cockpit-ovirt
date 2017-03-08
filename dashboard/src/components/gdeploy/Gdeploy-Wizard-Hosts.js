import React, { Component } from 'react'
import classNames from 'classnames'

class WizardHostStep extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hosts: props.hosts,
            errorMsg: "",
            errorMsgs: {}
        }
        this.updateHost = this.updateHost.bind(this);
    }
    updateHost(index, hostaddress) {
        const hosts = this.state.hosts;
        hosts[index] = hostaddress
        const errorMsgs= this.state.errorMsgs
        if(hostaddress.length > 0){
            errorMsgs[index] =""
        }else{
            errorMsgs[index] ="Host address cannot be empty"
        }
        this.setState({ hosts, errorMsgs })
    }
    validate(){
        let errorMsg = ""
        const errorMsgs= {}
        let valid = true
        if (this.state.hosts.length != 3) {
            errorMsg = "Three hosts are required to deploy Gluster."
            valid = false
        }
        this.state.hosts.forEach(function (host, index) {
            if (host.trim().length == 0) {
                errorMsgs[index] = "Host address cannot be empty"
                if(valid){
                    valid = false;
                }
            }
        })
        this.setState({ errorMsg, errorMsgs })
        return valid
    }
    shouldComponentUpdate(nextProps, nextState){
        if(!this.props.validating && nextProps.validating){
            this.props.validationCallBack(this.validate())
        }
        return true;
    }
    componentDidMount(){
        $('[data-toggle=popover]').popovers()
    }
    render() {
        const hostRows = [];
        const that = this
        this.state.hosts.forEach(function (host, index) {
            hostRows.push(
                <HostRow host={host} key={index} hostNo={index + 1}
                    errorMsg = {that.state.errorMsgs[index]}
                    deleteCallBack={() => this.handleDelete(index)}
                    changeCallBack={(e) => this.updateHost(index, e.target.value)}
                    />
            )
        }, this)
        return (
            <div>
                {this.state.errorMsg && <div className="alert alert-danger">
                    <span className="pficon pficon-error-circle-o"></span>
                    <strong>{this.state.errorMsg}</strong>
                </div>
                }
            <form className="form-horizontal">
                {hostRows}
                <div className="col-md-offset-2 col-md-8 alert alert-info gdeploy-wizard-host-ssh-info">
                    <span className="pficon pficon-info"></span>
                    <strong>
                        gdeploy will login to gluster hosts as root user using passwordless ssh connections.
                        Make sure, passwordless ssh is configured for all gluster hosts from the first host.
                    </strong>
                </div>
            </form>
            </div>
        )
    }
}

WizardHostStep.propTypes = {
    stepName: React.PropTypes.string.isRequired,
    hosts: React.PropTypes.array.isRequired
}

const HostRow = ({host, hostNo, errorMsg, changeCallBack, deleteCallBack}) => {
    const hostClass = classNames(
        "form-group",
        { "has-error": errorMsg && errorMsg.length > 0 }
    )
    return (
        <div>
            <div className={hostClass}>
                <label className="col-md-2 control-label">Host{hostNo} {hostNo == 3 && <a tabIndex="0" role="button" data-toggle="popover"
                        data-trigger="focus" data-html="true" title="" data-placement="right"
                        data-content="This host will be used as arbiter node while creating arbiter volumes" >
                            <span className="fa fa-info-circle"></span>
                    </a>
                }
                </label>
                <div className="col-md-6">
                    <input type="text" placeholder="Gluster network address"
                        title="Enter the address of gluster network which will be used for gluster data traffic."
                        className="form-control"
                        value={host}
                        onChange={changeCallBack}
                        />
                    {errorMsg && errorMsg.length > 0 && <span className="help-block">{errorMsg}</span>}
                </div>
            </div>
        </div>
    )
}
export default WizardHostStep