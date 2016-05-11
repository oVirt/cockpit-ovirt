import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { VirtualMachines, NetworkInterfaces,
  SshHostKey } from '../helpers/Dashboard'

export default class Dashboard extends Component {
  render() {
    return (
      <div>
        <RunningVms />
        <NICs />
        <SshKey />
      </div>
    )
  }
}

class RunningVms extends Component {
  constructor(props) {
    super(props)
    this.state = {
      vms: []
    }
    this.proxy = new VirtualMachines()
    this.updateList = this.updateList.bind(this)
    this.onClick = this.onClick.bind(this)
  }
  onClick() {
    console.log("Clicked!")
  }
  updateList(vms) {
    this.setState({vms: vms})
  }
  componentDidMount() {
    var self = this
    var interval = setInterval(function () {
      self.proxy.getVms(self.updateList)
    }, 1000)
    this.setState({intervalId: interval})
  }
  componentWillUnmount() {
    clearInterval(this.state.intervalId)
  }
  render() {
    return (
      <div>
      <div className="list-group list-view-pf">
        <div className="list-group-item">
          <div className="list-view-pf-main-info">
            <div className="list-view-pf-left">
              <span className="pficon pficon-virtual-machine
                list-view-pf-icon-sm" />
            </div>
            <div className="list-view-pf-body">
              <div className="list-view-pf-description">
                <div className="list-group-item-heading">
                  Virtual Machines
                </div>
              </div>
              <div className="list-view-pf-additional-info">
                <div className="list-view-pf-additional-info-item">
                  <span className="pficon pficon-screen" />
                  <strong> {this.state.vms.length}</strong> Running
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    )
  }
}

class NICs extends Component {
  constructor(props) {
    super(props)
    this.onClick = this.onClick.bind(this)
  }
  onClick(path) {
    // <a href=... and window.location are both weird inside cockpit
    // use cockpit.jump to load it
    cockpit.jump(path)
  }
  render() {
    let urls = {
      "View Networking Information": "/network",
      "View System Logs": "/system/logs",
      "View Storage": "/storage"
    }
    let buttons = []
    for (let url in urls) {
      buttons.push(<button
        className="btn btn-default"
        onClick={() => this.onClick(urls[url])}>
        {url}
      </button>
    )}
    return (
      <div className="btn-group">
        {buttons}
      </div>
      )
  }
}

class SshKey extends Component {
  constructor(props) {
    super(props)
    this.state = {
      host_key: 'Loading...',
      dialog_open: false
    }
    this.onClick = this.onClick.bind(this)
  }
  onClick() {
    this.setState({dialog_open: !this.state.dialog_open})
  }
  componentDidMount() {
    var self = this
    SshHostKey('rsa', function(key) {
      self.setState({host_key: key})
    })
  }
  render() {
    return (
      <div>
        <button className="btn btn-default"
          type="button"
          onClick={this.onClick}>
          Show SSH Host key
        </button>
        <div>
          {this.state.dialog_open ?
            <HostKeyModal
              hostKey={this.state.host_key}
              hide={this.onClick}
            />
            :
            null
          }
        </div>
      </div>
    )
  }
}

class HostKeyModal extends Component {
  constructor(props) {
    super(props)
    console.log(this.props)
  }
  componentDidMount() {
    $(ReactDOM.findDOMNode(this)).modal('show')

  }
  render() {
    var self = this
    var getHtml = function() { return {__html: self.props.hostKey}}
    return (
      <div className="modal fade">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button"
                className="close"
                data-dismiss="modal"
                aria-hidden="true">
                <span className="pficon pficon-close"></span>
              </button>
              <h4 className="modal-title">
                Host RSA Key
              </h4>
            </div>
            <div className="modal-body">
              <div dangerouslySetInnerHTML={getHtml()} />
            </div>
          </div>
        </div>
      </div>
    )
  }
}
