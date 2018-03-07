import React, { Component } from 'react'
import GdeploySetup from './gdeploy/GdeploySetup'

const classNames = require('classnames');

class GlusterManagement extends Component {

  constructor(props) {
    super(props);
    this.state = {
      volumeSelectedRow: 'None',
      host: {},
      volumeBricks: {},
      volumeInfo: {},
      volumeStatus: {},
      hostStatus: false,
      volumeStatusStatus: false,
      volumeInfoStatus: false,
      volumeBricksStatus: false,
      gdeployState: "",
      gdeployWizardType: ""
    };
    this.handleVolumeRowClick = this.handleVolumeRowClick.bind(this);
    this.getVolumeStatus = this.getVolumeStatus.bind(this);
    this.getVolumeStatus = this.getVolumeStatus.bind(this);
    this.getHostList = this.getHostList.bind(this);
    this.startGlusterManagement = this.startGlusterManagement.bind(this);
    this.applyGlusterChanges = this.applyGlusterChanges.bind(this);
    this.abortCallback = this.abortCallback.bind(this);
  }

  componentDidMount() {
    let that = this
    this.getHostList(function (hostJson) {
      that.getVolumeStatus(function (volumeStatusJson) {
        that.getVolumeInfo(function (volumeInfoJson) {
          let volumeBricks = {}
          if(Object.keys(volumeInfoJson).length != 0 && Object.keys(volumeStatusJson).length != 0) {
            Object.keys(volumeInfoJson.volumes).forEach(function (volume) {
              volumeBricks[volume] = []
              Object.values(volumeStatusJson.volumeStatus.bricks).forEach(function (brick) {
                if(brick.brick.match(volume)) {
                  volumeBricks[volume].push(brick)
                }
              })
            })
          }
          that.setState({
            host: hostJson,
            hostStatus: true,
            volumeStatus: volumeStatusJson,
            volumeStatusStatus: true,
            volumeInfo: volumeInfoJson,
            volumeInfoStatus: true,
            volumeBricks: volumeBricks,
            volumeBricksStatus: true
          })
        })
      })
    })
  }

  getHostList(callback){
    cockpit.spawn(
      [ "vdsm-client", "--gluster-enabled", "GlusterHost", "list" ]
    ).done(function(list){
      let poolList = JSON.parse(list)
      cockpit.spawn(
        [ "hostname" ]
      ).done(function(current_hostname){
        let hostname = current_hostname.replace(/-nic[\d\w]*\./g, ".")
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
        callback({})
      })
    }).fail(function(err){
      console.log("Error while fetching pool list: ", err);
      callback({})
    })
  }

  getVolumeStatus(callback) {
    cockpit.spawn(
      ["vdsm-client", "--gluster-enabled", "GlusterVolume", "status", "volumeName=all"]
    ).done(function(volumeStatusList){
      callback(JSON.parse(volumeStatusList))
    }).fail(function(err){
      console.log("Error while fetching volume status: ", err);
      callback({})
    })
  }

  getVolumeInfo(callback) {
    cockpit.spawn(
      ["vdsm-client", "--gluster-enabled", "GlusterVolume", "list"]
    ).done(function(volumeInfoList){
      callback(JSON.parse(volumeInfoList))
    }).fail(function(err){
      console.log("Error while fetching volume info: ", err);
      callback({})
    })
  }

  handleVolumeRowClick(volume) {
    this.setState({
      volumeSelectedRow: this.state.volumeSelectedRow == volume ? 'None':volume
    })
  }

  startGlusterManagement(action) {
      let gdeployWizardType = action
      let gdeployState = "MANAGE"
      this.setState({ gdeployWizardType, gdeployState })
  }

  applyGlusterChanges(){
      this.setState({
          gdeployState: "",
          gdeployWizardType: ""
      })
  }

  abortCallback(){
      this.setState({
          gdeployState: "",
          gdeployWizardType: ""
      })
  }

  render() {

    let hostsTable = null
    let bricksTable = null
    let volumesTable = null
    let modalWindow = null
    let options = null

    if (Object.keys(this.state.host).length != 0) {
        hostsTable = []
        this.state.host.hosts.forEach(function(host, index) {
        let uuid = "uuid: " + host.uuid
        hostsTable.push(
          <li key={index} className="list-group-item">
            <div className="row">
              <div className="col-sm-6">
                {host.hostname} <span className="fa fa-info-circle" title={uuid}></span>
              </div>
              <div className="col-sm-6">
                {host.status}
              </div>
            </div>
          </li>
        )
      }, this)
    }

    if (Object.keys(this.state.volumeBricks).length != 0) {
      if(this.state.volumeSelectedRow !== 'None') {
        bricksTable = []
        this.state.volumeBricks[this.state.volumeSelectedRow].forEach(function (brick, index) {
          let hostuuid = "hostuuid: " + brick.hostuuid
          let pid = "pid: " + brick.pid
          let rdma_port = ""
          if(brick.rdma_port && ((brick.rdma_port).length != 0)) {
            rdma_port = "rdma_port: " + brick.rdma_port
          }
          let port = "port: " + brick.port
          let info = hostuuid + '\n' + pid + '\n' + 'rdma_port' + '\n' + port
          bricksTable.push(
            <li key={index} className="list-group-item">
              <div className="row">
                <div className="col-sm-8">
                  {brick.brick} <span className="fa fa-info-circle" title={info}></span>
                </div>
                <div className="col-sm-4">
                  {brick.status}
                </div>
              </div>
            </li>
          )
        }, this)
      }
    }

    if (this.state.volumeSelectedRow != 'None') {
      if (Object.keys(this.state.volumeInfo).length != 0) {
        modalWindow = []
        options = []
        let volumeTemp = this.state.volumeInfo.volumes[this.state.volumeSelectedRow]
        let that = this
        Object.keys(volumeTemp).forEach(function (key, index) {
          let values = volumeTemp[key]
          if(typeof(values) == 'string' || typeof(values) == 'boolean') {
            modalWindow.push(
              <ul key={index} className="list-unstyled">
                <li><strong>{key}</strong> {volumeTemp[key]}</li>
              </ul>
            )
          } else if((typeof(values) != 'string' || typeof(values) != 'boolean')
          && !(key.match('bricks')) && !(key.match('options'))) {
            volumeTemp[key].forEach(function (props, index) {
              modalWindow.push(
                <ul key={index} className="list-unstyled">
                  <li><strong>{key}</strong> {props}</li>
                </ul>
              )
            })
          }
        })
      }
    }

    if (Object.keys(this.state.volumeInfo).length != 0) {
      volumesTable = []
      Object.keys(this.state.volumeInfo.volumes).forEach(function(volume, index) {
        let volumeTemp = this.state.volumeInfo.volumes[volume]
        let countUp = 0
        let countDown = 0
        this.state.volumeBricks[volume].forEach(function (brick) {
          if(brick.status == 'ONLINE') {
            countUp++
          } else {
            countDown++
          }
        })
        volumesTable.push(
          <li key={index} className="list-group-item" onClick={this.handleVolumeRowClick.bind(this, volumeTemp.volumeName)}>
            <div className="row" style={{backgroundColor: this.state.volumeSelectedRow == volumeTemp.volumeName ? "#cfcfd1":"white"}}>
              <div className="col-sm-2">
                {volumeTemp.volumeName}
              </div>
              <div className="col-sm-2">
                Default
              </div>
              <div className="col-sm-2">
                {volumeTemp.volumeType}
              </div>
              <div className="col-sm-2">
                {volumeTemp.volumeStatus}
              </div>
              <div className="col-sm-2">
                <i className="fa fa-caret-up statusIcon" aria-hidden="true"> {countUp}</i>
                <i className="fa fa-caret-down statusIcon" aria-hidden="true"> {countDown}</i>
              </div>
              <div>
                <button className="btn btn-link btn-find" title="More Info" type="button" data-toggle="modal" data-target="#about-modal">
                  <span className="fa fa-lg fa-info-circle"></span>
                </button>
              </div>
            </div>
            <div className="bricksList" style={{display: this.state.volumeSelectedRow == volumeTemp.volumeName ? "block":"none"}}>
              <ul className="list-group">
                <li className="list-group-item">
                  <div className="row">
                    <div className="col-sm-8">
                      <strong>Brick</strong>
                    </div>
                    <div className="col-sm-4">
                      <strong>Status</strong>
                    </div>
                  </div>
                </li>
                {bricksTable}
              </ul>
            </div>
          </li>
        )
      }, this)
    }

    return (
      <div>
        { this.state.hostStatus === false &&
          this.state.volumeStatusStatus === false &&
          this.state.volumeInfoStatus === false &&
          this.state.volumeBricksStatus === false &&
          <div className="spinner spinner-lg"/>
        }
        { this.state.hostStatus === true &&
          this.state.volumeStatusStatus === true &&
          this.state.volumeInfoStatus === true &&
          this.state.volumeBricksStatus === true &&
          <div>
            <div className="glusterHeading">
              <h1>Gluster Management</h1>
            </div>
            <div className="hostList">
              <div className="glusterHeading">
                <h2>Hosts</h2>
              </div>
              <ul className="list-group">
                <li className="list-group-item">
                  <div className="row">
                    <div className="col-sm-6">
                      <strong>Name</strong>
                    </div>
                    <div className="col-sm-6">
                      <strong>Peer Status</strong>
                    </div>
                  </div>
                </li>
                {hostsTable}
              </ul>
              <div className="manageGlusterButtons">
                <button onClick={this.startGlusterManagement.bind(this, 'expand_cluster')}>Expand Cluster</button>
              </div>
            </div>
            <div className="volumeList">
              <div className="glusterHeading">
                <h2>Volumes</h2>
              </div>
              <ul className="list-group">
                <li className="list-group-item">
                  <div className="row">
                    <div className="col-sm-2">
                      <strong>Name</strong>
                    </div>
                    <div className="col-sm-2">
                      <strong>Cluster</strong>
                    </div>
                    <div className="col-sm-2">
                      <strong>Volume Type</strong>
                    </div>
                    <div className="col-sm-2">
                      <strong>Volume Status</strong>
                    </div>
                    <div className="col-sm-2">
                      <strong>Bricks</strong>
                    </div>
                    <div className="col-sm-2">
                      <strong></strong>
                    </div>
                  </div>
                </li>
                {volumesTable}
              </ul>
              <div className="manageGlusterButtons">
                <button onClick={this.startGlusterManagement.bind(this, 'create_volume')} >Create Volume</button>
              </div>
            </div>
            <div className="modal fade" id="about-modal" tabIndex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
              <div className="modal-dialog">
                <div className="modal-content about-modal-pf">
                  <div className="modal-header">
                    <button type="button" className="close" data-dismiss="modal" aria-hidden="true">
                      <span className="pficon pficon-close"></span>
                    </button>
                  </div>
                  <div className="modal-body">
                    <h1>More Info</h1>
                    <div className="product-versions-pf">
                      {modalWindow}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
        {this.state.gdeployState === "MANAGE" &&
            <GdeploySetup onSuccess={this.applyGlusterChanges} onClose={this.abortCallback} gdeployWizardType={this.state.gdeployWizardType} />
        }
      </div>
    )
  }
}

export default GlusterManagement
