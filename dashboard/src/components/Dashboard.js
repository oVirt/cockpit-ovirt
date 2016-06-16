import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { VirtualMachines, NetworkInterfaces,
  SshHostKey } from '../helpers/Dashboard'

export default class Dashboard extends Component {
  render() {
    return (
      <div>
        <h2>
          Virtualization
        </h2>
        <div className="col-md-4 cockpit-info-table-container">
          <table className="cockpit-info-table">
            <Links />
            <SshKey />
          </table>
        </div>
        <div className="col-md-6">
          <RunningVms />
        </div>
      </div>
    )
  }
}

class RunningVms extends Component {
  constructor(props) {
    super(props)
    this.state = {
      vms: null
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
        {this.state.vms != null ?
          <div className="row">
            <div className="col-md-3 list-view-pf-left">
              <span className="pficon pficon-virtual-machine
                list-view-pf-icon-sm" />
            </div>
            <div className="col-md-4">
              Virtual Machines
            </div>
            <div className="col-md-4">
              <strong>
                {this.state.vms.length}
              </strong> Running
            </div>
          </div>
        : null}
    </div>
    )
  }
}

class Links extends Component {
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
      "Networking Information": "/network",
      "System Logs": "/system/logs",
      "Storage": "/storage"
    }
    let links = []
    let id = 0
    for (let url in urls) {
      links.push(<tr key={id}>
        <td>{url}: </td>
        <td>
          <button
            className="btn btn-default"
            onClick={() => this.onClick(urls[url])}>
            View
          </button>
        </td>
      </tr>
      )
      id++
    }
    return (
      <tbody>
        {links}
      </tbody>
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
      <tbody>
        <tr>
          <td>SSH Host Key: </td>
          <td>
            <button
              className="btn btn-default"
              type="button"
              onClick={this.onClick}>
              Show
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
          </td>
        </tr>
      </tbody>
    )
  }
}

class HostKeyModal extends Component {
  constructor(props) {
    super(props)
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
