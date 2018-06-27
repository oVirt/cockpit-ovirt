import PropTypes from 'prop-types';
import React, { Component } from 'react'
import Selectbox from '../common/Selectbox'
import classNames from 'classnames'
import isGdeployAvailable from './../../helpers/GdeployUtil'
import {footerButtons} from "../common/Wizard/Wizard";

class WizardHostStep extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hosts: props.glusterModel.hosts,
            hostTypes: [{ key: "", title: "" }],
            errorMsg: "",
            errorMsgs: {},
            isGdeployAvailableOnHost: false,
            isSingleNode: props.isSingleNode
        }
        this.updateHost = this.updateHost.bind(this);
        this.getHostList = this.getHostList.bind(this);
        this.handleSelectedHostUpdate = this.handleSelectedHostUpdate.bind(this);
        props.glusterModel.isSingleNode = props.isSingleNode
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
        if(this.state.isSingleNode && this.state.hosts[0].length > 0) {
          this.trimHostProperties()
          return true
        }
        if (this.props.gdeployWizardType === "setup" || this.props.gdeployWizardType === "expand_cluster") {
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
                  for (var i = 0; i < hostList.hosts.length; i++) {
                      hosts[i] = hostList.hosts[i].hostname
                  }
                  that.setState({ hostTypes, hosts })
            })
        }
        let that = this
        isGdeployAvailable.isGdeployAvailable(function (boolVal) {
            that.setState({
              isGdeployAvailableOnHost: boolVal
            })
            if(that.state.isGdeployAvailableOnHost === false) {
              that.props.registerCustomActionBtnStateCallback({disableBtnsList: [footerButtons.NEXT], hidden: true}, that.props.stepIndex)
              let errorMsg = "Gdeploy isn't installed on Host. To continue deployment, please install Gdeploy on Host and try again."
              that.setState({ errorMsg })
            }
        })
    }
    getHostList(callback){
      cockpit.spawn(
        [ "vdsm-client", "--gluster-enabled", "GlusterHost", "list" ]
      ).done(function(list) {
        if(list != null || list != undefined) {
          let poolList = JSON.parse(list)
          poolList.hosts.forEach(function (host, index) {
            if(host.hostname.indexOf("/") != -1) {
              host.hostname = host.hostname.split("/")[0]
            }
          })
          callback(poolList)
        } else {
          console.log("HostList is empty");
          callback({})
        }
      }).fail(function(err){
        console.log("Error while fetching pool list: ", err);
        callback({})
      })
    }
    handleSelectedHostUpdate(index, value){
        let hosts = this.state.hosts
        let hostTypes = this.state.hostTypes
        let tempValue = hosts[index]
        let tempIndex = index
        let swapped = false
        hosts.forEach(function (host, index) {
          if(host === value) {
            swapped = true
            tempIndex = index
          }
        })
        if(swapped) {
          hosts[index] = value
          hostTypes[index].key = value
          hostTypes[index].title = value
          hosts[tempIndex] = tempValue
          hostTypes[tempIndex].key = tempValue
          hostTypes[tempIndex].title = tempValue
        } else {
          hosts[index] = value
          hostTypes[index].key = value
          hostTypes[index].title = value
        }
        this.trimHostProperties()
        this.setState({ hostTypes })
        this.setState({ hosts })
    }
    render() {
        const hostRows = [];
        const that = this
        if(that.state.isSingleNode) {
          hostRows.push(
            <HostRow host={this.state.hosts[0]} key={0} hostNo={1 }
              gdeployWizardType={that.props.gdeployWizardType}
              hostTypes={that.state.hostTypes}
              errorMsg = {that.state.errorMsgs[0]}
              deleteCallBack={() => this.handleDelete(0)}
              changeCallBack={(e) => this.updateHost(0, e.target.value)}
            />
          )
        } else {
          this.state.hosts.forEach(function (host, index) {
              if (this.props.gdeployWizardType === "setup" || this.props.gdeployWizardType === "expand_cluster") {
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
        }
        return (
            <div>
                {this.state.errorMsg && <div className="alert alert-danger">
                    <span className="pficon pficon-error-circle-o"></span>
                    <strong>{this.state.errorMsg}</strong>
                </div>
                }
                <form className="form-horizontal">
                    {hostRows}
                    {!that.state.isSingleNode &&
                    <div className="col-md-offset-2 col-md-8 alert alert-info gdeploy-wizard-host-ssh-info">
                        <span className="pficon pficon-info"></span>
                        <strong>
                            gdeploy will login to gluster hosts as root user using passwordless ssh connections.
                            Make sure, passwordless ssh is configured for all gluster hosts from the first host.
                        </strong>
                    </div>
                  }
                </form>
            </div>
        )
    }
}

WizardHostStep.propTypes = {
    stepName: PropTypes.string.isRequired,
    hosts: PropTypes.array.isRequired
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
                        gdeployWizardType={gdeployWizardType}
                        />
                    }
                    {errorMsg && errorMsg.length > 0 && <span className="help-block">{errorMsg}</span>}
                </div>
            </div>
        </div>
    )
}
export default WizardHostStep
