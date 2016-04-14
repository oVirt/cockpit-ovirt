import React, { Component } from 'react'
import { VirtualMachines, NetworkInterfaces } from '../helpers/Dashboard'

export default class Dashboard extends Component {
  render() {
    return (
      <div>
        <RunningVms />
        <NICs />
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
    this.nics = new NetworkInterfaces()
  }
  componentDidMount() {
    var self = this
    var interval = setInterval(function () {
      var model = self.nics.listNics()
    }, 1000)
    this.setState({intervalId: interval})
  }
  componentWillUnmount() {
    clearInterval(this.state.intervalId)
  }
  render() {
    return (
      <div />
      )
  }
}
