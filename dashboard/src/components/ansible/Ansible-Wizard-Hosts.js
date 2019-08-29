import PropTypes from 'prop-types';
import React, { Component } from 'react'
import Selectbox from '../common/Selectbox'
import classNames from 'classnames'
import {footerButtons} from "../common/Wizard/Wizard";
import ansibleUtil from './../../helpers/AnsibleUtil'

class WizardHostStep extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hosts: props.glusterModel.hosts,
            expandVolumeHosts: props.glusterModel.expandVolumeHosts,
            hostTypes: [{ key: "", title: "" }],
            errorMsg: "",
            errorMsgs: {},
            isSingleNode: props.isSingleNode,
            isGlusterAnsibleAvailableOnHost: false,
        }
        this.updateHost = this.updateHost.bind(this);
        this.getHostList = this.getHostList.bind(this);
        this.handleSelectedHostUpdate = this.handleSelectedHostUpdate.bind(this);
        this.handleExpandVolumeUpdate = this.handleExpandVolumeUpdate.bind(this);
        props.glusterModel.isSingleNode = props.isSingleNode
    }
    updateHost(index, hostaddress) {
        const hosts = this.state.hosts;
        if(this.props.ansibleWizardType === "expand_volume") {
          if(this.state.expandVolumeHosts && this.state.expandVolumeHosts.length > 0) {
            this.handleExpandVolumeUpdate(index, hosts[index], false)
            this.handleExpandVolumeUpdate(index, hostaddress, true)
          }
        }
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
        if (this.props.ansibleWizardType === "setup" || this.props.ansibleWizardType === "expand_cluster") {
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
        } else if((this.props.ansibleWizardType === "create_volume" || this.props.ansibleWizardType === "expand_volume") && this.state.hostTypes.length === 1) {
            let errorMsg = ""
            const errorMsgs= {}
            let valid = true
            if(this.state.hostTypes[0].title.length == 0) {
              errorMsgs[0] = "Host address cannot be empty"
              if(valid){
                valid = false;
              }
            }
            this.setState({ errorMsg, errorMsgs })
            return valid
        } else if(this.props.ansibleWizardType === "expand_volume"){
            const errorMsgs = {}
            let valid = true
            if(this.state.expandVolumeHosts.length%3 !== 0 || this.state.expandVolumeHosts.length === 0) {
              this.state.hosts.forEach(function(value, index) {
                errorMsgs[index] = "Select hosts in a multiple of 3"
              })
              if(valid) {
                valid = false;
              }
            }
            this.setState({ errorMsgs })
            return valid
        } else {
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
        if (this.props.ansibleWizardType === "create_volume") {
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
        } else if(this.props.ansibleWizardType === "expand_volume") {
            let that = this
            this.getHostList(function (hostList) {
              if(hostList != null && hostList != undefined && hostList.hosts.length > 0) {
                let hosts = that.state.hosts
                let expandVolumeHosts = that.state.expandVolumeHosts
                for (var i = 0; i < hostList.hosts.length; i++) {
                    hosts[i] = hostList.hosts[i].hostname
                }
                if(hostList.hosts.length === 3) {
                  for (var i = 0; i < hostList.hosts.length; i++) {
                      expandVolumeHosts[i] = hostList.hosts[i].hostname
                  }
                }
                that.setState({ hosts, expandVolumeHosts })
              }
            })
        }
        let that = this
        ansibleUtil.isGlusterAnsibleAvailable(function (boolVal) {
            that.setState({
              isGlusterAnsibleAvailableOnHost: boolVal
            })
            if(that.state.isGlusterAnsibleAvailableOnHost === false) {
              that.props.registerCustomActionBtnStateCallback({disableBtnsList: [footerButtons.NEXT], hidden: true}, that.props.stepIndex)
              let errorMsg = "gluster-ansible-roles is not installed on Host. To continue deployment, please install gluster-ansible-roles on Host and try again."
              that.setState({ errorMsg })
            }
        })
    }
    componentWillReceiveProps(nextProps) {
      if(nextProps.ansibleWizardType === "expand_volume") {
        let hostTypes = this.state.hostTypes
        hostTypes = []
        this.state.expandVolumeHosts.forEach(function(value, index) {
          let hostType = { key: value, title: value }
          hostTypes.push(hostType)
        })
        this.setState({ hostTypes })
      }
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
    handleExpandVolumeUpdate(index, value, check){
      let expandVolumeHosts = this.state.expandVolumeHosts
      if(check) {
        expandVolumeHosts.push(value)
      } else {
        expandVolumeHosts.splice(expandVolumeHosts.indexOf(value), 1)
      }
      this.setState({ expandVolumeHosts })
    }
    render() {
        const hostRows = [];
        const that = this
        if(that.state.isSingleNode) {
          hostRows.push(
            <HostRow host={this.state.hosts[0]} key={0} hostNo={1 }
              ansibleWizardType={that.props.ansibleWizardType}
              hostTypes={that.state.hostTypes}
              errorMsg = {that.state.errorMsgs[0]}
              deleteCallBack={() => this.handleDelete(0)}
              changeCallBack={(e) => this.updateHost(0, e.target.value)}
            />
          )
        } else if(this.props.ansibleWizardType === "create_volume" && this.state.hostTypes.length === 1) {
          hostRows.push(
            <HostRow host={this.state.hosts[0]} key={0} hostNo={1 }
              ansibleWizardType={that.props.ansibleWizardType}
              hostTypes={that.state.hostTypes}
              errorMsg = {that.state.errorMsgs[0]}
              deleteCallBack={() => this.handleDelete(0)}
              changeCallBack={(e) => this.updateHost(0, e.target.value)}
            />
          )
        } else {
          this.state.hosts.forEach(function (host, index) {
              if (this.props.ansibleWizardType === "setup" || this.props.ansibleWizardType === "expand_cluster") {
                  hostRows.push(
                    <HostRow host={host} key={index} hostNo={index + 1}
                      ansibleWizardType={that.props.ansibleWizardType}
                      hostTypes={that.state.hostTypes}
                      hostLength={this.state.hosts.length}
                      errorMsg = {that.state.errorMsgs[index]}
                      deleteCallBack={() => this.handleDelete(index)}
                      changeCallBack={(e) => this.updateHost(index, e.target.value)}
                    />
                  )
              } else if (this.props.ansibleWizardType === "create_volume"){
                  hostRows.push(
                    <HostRow host={host} key={index} hostNo={index + 1}
                      ansibleWizardType={that.props.ansibleWizardType}
                      hostTypes={that.state.hostTypes}
                      hostLength={this.state.hosts.length}
                      errorMsg = {that.state.errorMsgs[index]}
                      deleteCallBack={() => this.handleDelete(index)}
                      changeCallBack={(e) => this.handleSelectedHostUpdate(index, e)}
                    />
                  )
              } else if (this.props.ansibleWizardType === "expand_volume"){
                  hostRows.push(
                    <HostRow host={host} key={index} hostNo={index + 1}
                      ansibleWizardType={that.props.ansibleWizardType}
                      hostTypes={that.state.hostTypes}
                      hostLength={this.state.hosts.length}
                      errorMsg = {that.state.errorMsgs[index]}
                      deleteCallBack={() => this.handleDelete(index)}
                      changeCallBack={(e) => this.updateHost(index, e.target.value)}
                      changeExpandVolumeCallBack={(e) => this.handleExpandVolumeUpdate(index, e.target.value, e.target.checked)}
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
                    {(this.props.ansibleWizardType === "expand_volume" && this.state.hosts.length !== 3) &&
                      <div className="col-md-offset-2 col-md-8 alert alert-info ansible-wizard-host-ssh-info">
                          <span className="pficon pficon-info"></span>
                          <strong>
                              Check the hosts on which the volume should be expanded.
                              Select the hosts in a multiple of 3.
                          </strong>
                      </div>
                    }
                    {!(this.state.hostTypes.length === 1) &&
                      <div className="col-md-offset-2 col-md-8 alert alert-info ansible-wizard-host-ssh-info">
                          <span className="pficon pficon-info"></span>
                          <strong>
                              Ansible will login to gluster hosts as root user using passwordless ssh connections.
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
    stepName: PropTypes.string.isRequired
}

const HostRow = ({host, hostNo, ansibleWizardType, hostTypes, hostLength, errorMsg, changeCallBack, changeExpandVolumeCallBack, deleteCallBack}) => {
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
                    {(ansibleWizardType === "setup" || ansibleWizardType === "expand_cluster") && <input type="text" placeholder="Gluster network address"
                        title="Enter the address of gluster network which will be used for gluster data traffic."
                        className="form-control"
                        value={host}
                        onChange={changeCallBack}
                        />
                    }
                    {ansibleWizardType === "create_volume" && hostTypes.length > 0 && <Selectbox optionList={hostTypes}
                        selectedOption={host}
                        callBack={(e) => changeCallBack(e)}
                        ansibleWizardType={ansibleWizardType}
                        />
                    }
                    {ansibleWizardType === "expand_volume" && <div className="row">
                        <div className="col-md-10">
                          <input type="text" placeholder="Gluster network address"
                            title="Enter the address of gluster network which will be used for gluster data traffic."
                            className="form-control"
                            value={host}
                            onChange={changeCallBack}
                            />
                        </div>
                        {hostLength!==3 && <div className="col-md-2">
                            <input type="checkbox" value={host} name={host}
                            className="form-control ansible-wizard-thinp-checkbox"
                            onChange={changeExpandVolumeCallBack}/>
                          </div>
                        }
                      </div>
                    }
                    {errorMsg && errorMsg.length > 0 && <span className="help-block">{errorMsg}</span>}
                </div>
            </div>
        </div>
    )
}
export default WizardHostStep
