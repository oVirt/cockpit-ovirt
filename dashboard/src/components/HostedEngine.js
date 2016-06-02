import React, { Component } from 'react'
import HostedEngineSetup from './HostedEngineSetup'
import {checkDeployed, getMetrics} from '../helpers/HostedEngineStatus'
var classNames = require('classnames')

class HostedEngine extends Component {
  constructor(props) {
    super(props)
    this.state = {
      deployed: null
    }
    this.deployedCallback = this.deployedCallback.bind(this)
  }
  deployedCallback(value) {
    this.setState({deployed: value})
  }
  componentWillMount() {
    checkDeployed(this.deployedCallback)
  }
  render() {
    return (
      <div>
        {(this.state.deployed == null) ?
          <div className="spinner" /> :
          this.state.deployed ?
            <Status /> :
            <HostedEngineSetup />
        }
      </div>
    )
  }
}

class Status extends Component {
  constructor(props) {
    super(props)
    this.state = {
      status: null,
      vm: null
    }
    this.updateStatus = this.updateStatus.bind(this)
    this.onClick = this.onClick.bind(this)
  }
  onClick() {
    this.setState({expanded: !this.state.expanded})
  }
  updateStatus(status) {
    this.setState({status: status})
    let found_running = false
    let running_host = {}
    for (var key in status) {
      if (status[key]["engine-status"]["vm"] === "up") {
        running_host = {hostname: status[key]["hostname"]}
        found_running = true
      }
    }
    this.setState({vm: found_running ? running_host : false})
  }
  componentDidMount() {
    var self = this
    var interval = setInterval(function() {
      getMetrics(self.updateStatus)
    }, 1000)
    this.setState({intervalId: interval})
  }
  componentWillUnmount() {
    clearInterval(this.state.intervalId)
  }
  render() {
    let hosts = []
    for (let id in this.state.status) {
      let host = this.state.status[id]
      hosts.push(<HostDetail host={host} />)
    }
    let split = (arr, n) => {
      let tmp = []
      while (arr.length) {
        let chunk = arr.splice(0, n).map(function(host, i) {
          return <div className="col-md-6" key={i}>
            {host}
          </div>
        })
        let row = (
          <div className="row">
            {chunk}
          </div>
        )
        tmp.push(row)
      }
      return tmp
    }
    var rows = split(hosts, 2)
    return (
      <div className="container-fluid">
          <Engine
            status={this.state.vm}
          />
        {rows}
      </div>
    )
  }
}

const Engine = ({status}) => {
  let hostname = "Not running"
  if (status != null) {
    hostname = status.hostname
  }
  return (
    <div>
      {(status == null) ?
        <div className="spinner" /> :
          (status != false) ?
          <Running host={status.hostname} /> :
          <NotRunning />
      }
    </div>
  )
}

// There's an annoying amount of duplication here, because
// patternfly doesn't seem to like classless <div> inside
// list-groups, so we can't shove the boilerplate up to Engine
const NotRunning = () => {
  return (
    <div className="list-group list-view-pf">
      <div className="list-group-item">
        <div className="list-view-pf-main-info">
          <div className="list-view-pf-left">
            <span className="pficon pficon-error-circle-o
              list-view-pf-icon-lg" />
          </div>
          <div className="list-view-pf-body">
            <div className="list-view-pf-description">
              Hosted Engine is not running!
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const Running = ({host}) => {
  return (
    <div className="list-group list-view-pf">
      <div className="list-group-item">
        <div className="list-view-pf-main-info">
          <div className="list-view-pf-left">
            <span className="pficon pficon-ok list-view-pf-icon-lg
              list-view-pf-icon-success" />
          </div>
          <div className="list-view-pf-body">
            <div className="list-view-pf-description">
              <div className="list-group-item-heading">
                Hosted Engine is up!
              </div>
            </div>
            <div className="list-group-item-text">
              Hosted Engine is running on <strong>{host}</strong>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}

const HostDetail = ({host}) => {
  return (
    <div>
      <div className="list-group list-view-pf">
        <div className="list-group-item list-view-pf-stacked">
          <div className="list-view-pf-main-info">
            <div className="list-view-pf-body">
              <div className="list-view-pf-description">
                <div className="list-group-item-heading">
                  {host.hostname}
                </div>
                <div className="list-group-item-text">
                  Agent stopped: {host.stopped.toString()}<br />
                  Local Maintenance: {host.maintenance.toString()}
                </div>
              </div>
              <div className="list-view-pf-additional-info">
                <div className="list-view-pf-additional-info-item
                  list-view-pf-additional-info-item-stacked">
                  <strong>VM Status</strong>
                  <div>State: {host["engine-status"].vm}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/*
<div className="list-view-pf-additional-info-item
  list-view-pf-additional-info-item-stacked">
  <strong>Live Data</strong> {host["live-data"].toString()}
</div>
<div className="list-view-pf-additional-info-item
  list-view-pf-additional-info-item-stacked">
  <strong>Host ID</strong> {host["host-id"]}
</div>
<div>Health: {host["engine-status"].health}</div>
{("reason" in host["engine-status"]) ?
  <div>Reason: {host["engine-status"].reason}</div> :
  null
}
*/

export default HostedEngine
