import React, { Component } from 'react'
import Selectbox from '../common/Selectbox'
import classNames from 'classnames'

class WizardHostStep extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hosts: props.hosts,
            hostTypes: [],
            errorMsg: "",
            errorMsgs: {}
        }
        this.updateHost = this.updateHost.bind(this);
        this.getHostList = this.getHostList.bind(this);
        this.handleSelectedHostUpdate = this.handleSelectedHostUpdate.bind(this);
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
    // Trim "Host1","Host2" and "Host3" values
    trimHostProperties(){
      const inHosts = this.state.hosts
      if(inHosts.length > 0){
        for(var i =0; i< inHosts.length; i++){
          this.state.hosts[i] = inHosts[i].trim()
        }
      }
    }
    validate(){
        if (this.props.gdeployWizardType === "setup") {
            this.trimHostProperties()
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
        else {
            let errorMsg = ""
            const errorMsgs= {}
            let valid = true
            let that = this
            this.state.hosts.forEach(function (host, index) {
              let nextIndex = that.state.hosts.indexOf(host, index + 1)
              while (nextIndex != -1) {
                errorMsgs[index] = "No two hosts can be the same"
                errorMsgs[nextIndex] = "No two hosts can be the same"
                if(valid){
                  valid = false;
                }
                nextIndex = that.state.hosts.indexOf(host, nextIndex + 1)
              }
            })
            this.setState({ errorMsg, errorMsgs })
            return valid
        }
    }
    shouldComponentUpdate(nextProps, nextState){
        if(!this.props.validating && nextProps.validating){
            this.props.validationCallBack(this.validate())
          this.props.validationCallBack(this.validate())
        }
        return true;
    }
    componentDidMount(){
        $('[data-toggle=popover]').popovers()
        if (this.props.gdeployWizardType === "create_volume") {
            let that = this
            let hostTypes = []
            this.getHostList(function (hostList) {
                hostList.hosts.forEach(function (host) {
                    let hostType = { key: host.hostname, title: host.hostname }
                    hostTypes.push(hostType)
                })
                let hosts = that.state.hosts
                for (var i = 0; i < hosts.length; i++) {
                    hosts[i] = hostList.hosts[i].hostname
                }
                that.setState({ hostTypes, hosts })
            })
        }
    }
    getHostList(callback){
        cockpit.spawn(
          [ "vdsm-client", "--gluster-enabled", "GlusterHost", "list" ]
        ).done(function(poolList){
          cockpit.spawn(
            [ "hostname" ]
          ).done(function(hostname){
            let regexAlpha = /localhost/
            let regexNum = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/
            poolList.hosts.forEach(function (host, index) {
              if(host.hostname.match(regexAlpha) || host.hostname.match(regexNum)){
                host.hostname = hostname.trim()
              }
            })
            callback(poolList)
          }).fail(function(err){
            console.log("Error while fetching hostname: ", err);
            callback(null)
          })
        }).fail(function(err){
          console.log("Error while fetching pool list: ", err);
          callback(null)
        })
    }
    handleSelectedHostUpdate(index, value){
        let hosts = this.state.hosts
        hosts[index] = value
        this.setState({ hosts })
    }
    render() {
        const hostRows = [];
        const that = this
        this.state.hosts.forEach(function (host, index) {
            if (this.props.gdeployWizardType === "setup") {
                hostRows.push(
                  <HostRow host={host} key={index} hostNo={index + 1}
                    gdeployWizardType={that.props.gdeployWizardType}
                    hostTypes={that.state.hostTypes}
                    errorMsg = {that.state.errorMsgs[index]}
                    deleteCallBack={() => this.handleDelete(index)}
                    changeCallBack={(e) => this.updateHost(index, e.target.value)}
                  />
                )
            }
            else {
                hostRows.push(
                  <HostRow host={host} key={index} hostNo={index + 1}
                    gdeployWizardType={that.props.gdeployWizardType}
                    hostTypes={that.state.hostTypes}
                    errorMsg = {that.state.errorMsgs[index]}
                    deleteCallBack={() => this.handleDelete(index)}
                    changeCallBack={(e) => this.handleSelectedHostUpdate(index, e)}
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

const HostRow = ({host, hostNo, gdeployWizardType, hostTypes, errorMsg, changeCallBack, deleteCallBack}) => {
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
                    {(gdeployWizardType === "setup" || gdeployWizardType === "expand_cluster") && <input type="text" placeholder="Gluster network address"
                        title="Enter the address of gluster network which will be used for gluster data traffic."
                        className="form-control"
                        value={host}
                        onChange={changeCallBack}
                        />
                    }
                    {gdeployWizardType === "create_volume" && hostTypes.length > 0 && <Selectbox optionList={hostTypes}
                        selectedOption={host}
                        callBack={(e) => changeCallBack(e)}
                        />
                    }
                    {errorMsg && errorMsg.length > 0 && <span className="help-block">{errorMsg}</span>}
                </div>
            </div>
        </div>
    )
}
export default WizardHostStep
