import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { VirtualMachines, NetworkInterfaces, NodeStatus,
  SshHostKey, CheckIfNode } from '../helpers/Dashboard'
var classNames = require('classnames')

export default class Dashboard extends Component {
  constructor(props) {
    super(props)
    this.state = {
      node: false,
      showWarning: false
    }
    this.showPermissionWarning = this.showPermissionWarning.bind(this)
    this.checkIfNode = this.checkIfNode.bind(this)
  }
  componentWillMount() {
    this.checkIfNode()
  }
  showPermissionWarning() {
    this.setState({showWarning: true})
  }
  checkIfNode() {
    let self = this
    CheckIfNode(function(result) {
      self.setState({node: result})
    })
  }
  render() {
    return (
      <div>
        <h2>
          Virtualization
        </h2>
        {this.state.showWarning ?
          <div className="alert alert-danger">
            <span className="pficon pficon-warning-triangle-o" />
            Can't check node status! Please run as an administrator!
          </div> : null}
        <div className="row">
          <div className="col-md-4 cockpit-info-table-container">
            <table className="cockpit-info-table info-table-ct">
              {this.state.node ?
                <tbody>
                  <tr>
                    <td>
                      <h4>Node Status</h4>
                    </td>
                  </tr>
                </tbody>
              : null }
              {this.state.node ?
                <NodeTable showWarning={this.showPermissionWarning}/>
              : null }
              <tbody>
                <tr>
                  <td>
                    <br />
                    <h4>System</h4>
                  </td>
                </tr>
              </tbody>
              <Links />
              <SshKey />
            </table>
          </div>
          <div className="col-md-6">
            <RunningVms />
          </div>
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
          <ul className="list-group">
            <li className="list-group-item">
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
            </li>
          </ul>
        : null}
    </div>
    )
  }
}

class NodeTable extends Component {
  constructor(props) {
    super(props)
    this.state = {
      info: null,
      health: null,
      canRun: null,
    }
    this.helper = new NodeStatus()
    this.checkPermissions = this.checkPermissions.bind(this)
    this.updateInfo = this.updateInfo.bind(this)
    this.updateHealth = this.updateHealth.bind(this)
  }
  componentWillMount() {
    this.checkPermissions()
    this.updateInfo()
    this.updateHealth()
  }
  checkPermissions() {
    let self = this
    this.helper.checkPermissions(function(data) {
      self.setState({canRun: "success" in data})
    })
  }
  updateInfo() {
    let self = this
    this.helper.info(function(data) {
      self.setState({info: data})
    })
  }
  updateHealth() {
    let self = this
    this.helper.check(function(data) {
      self.setState({health: data})
    })
  }
  render() {
    let ready = (this.state.health != null &&
      this.state.info != null)

    let buttonMap = {
      layer : {
        content: ready ? this.state.info.current_layer: null,
        button: <NodeButton
          text="Rollback"
          modal={LayerModal}
          data={this.state.info}
        />,
        modal: InfoModal,
        data: this.state.info
      },
      health: {
        content: <NodeTableIcon health={this.state.health} />,
        modal: HealthModal,
        data: this.state.health
      },
    }

    let infos = {
      "Health": ready ?
      <NodeTableLink
        content={buttonMap.health.content}
        modal={buttonMap.health.modal}
        data={buttonMap.health.data}
        />
      : <td><div className="spinner" /></td>,
    "Current Layer": ready ?
      <NodeTableLink
        content={buttonMap.layer.content}
        modal={buttonMap.layer.modal}
        data={buttonMap.layer.data}
        button={buttonMap.layer.button}
        />
      : <td><div className="spinner" /></td>,
    }

    let infoLines = []
    let id = 0
    for (let i in infos) {
      infoLines.push(
        <tr key={i}>
          <td>{i}</td>
          {infos[i]}
        </tr>
      )
      id++
    }

    if (this.state.canRun != null && !this.state.canRun) {
      this.props.showWarning()
    }
    return (
      <tbody>
        {infoLines}
      </tbody>
    )
  }
}

class NodeTableLink extends Component {
  constructor(props) {
    super(props)
    this.state = {
      dialog_open: false,
    }
    this.onClick = this.onClick.bind(this)
  }
  onClick() {
    this.setState({dialog_open: !this.state.dialog_open})
  }
  render() {
    return (
      <td>
        <div>
          <a onClick={this.onClick}>
            {this.props.content}
          </a> {this.props.button}
        </div>
        <div>
          {this.state.dialog_open ?
            <this.props.modal
              data={this.props.data}
              hide={this.onClick}
              />
            :
            null
          }
        </div>
      </td>
    )
  }
}

class NodeButton extends Component {
  constructor(props) {
    super(props)
    this.state = {
      dialog_open: false,
    }
    this.onClick = this.onClick.bind(this)
  }
  onClick() {
    this.setState({dialog_open: !this.state.dialog_open})
  }
  render() {
    let style = {
      "marginLeft": "2vw"
    }
    return (
    <span>
      <button
        style={style}
        className="btn btn-default"
        type="button"
        onClick={this.onClick}>
        {this.props.text}
      </button>
      <div>
        {this.state.dialog_open ?
          <this.props.modal
            data={this.props.data}
            hide={this.onClick}
            />
          :
          null
        }
      </div>
    </span>
    )
  }
}

class NodeTableIcon extends Component {
  constructor(props) {
    super(props)
  }
  render() {
    let statusClass = classNames({
      "pficon": true,
      "list-view-pf-icon-md": true,
      "pficon-ok": this.props.health.status == "ok",
      "list-view-pf-icon-success": this.props.health.status == "ok",
      "pficon-warning-triangle-o": this.props.health.status != "ok",
      "list-view-pf-icon-warning": this.props.health.status != "ok"
    })
    return (
      <div>
        {this.props.health.status} <span className={statusClass} />
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
          <a
            onClick={() => this.onClick(urls[url])}>
            View
          </a>
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
            <a
              onClick={this.onClick}>
              View
            </a>
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

class InfoModal extends Component {
  constructor(props) {
    super(props)
  }
  componentDidMount() {
    $(ReactDOM.findDOMNode(this)).modal('show')
  }
  componentWillUnmount() {
    this.props.hide()
  }
  render() {
    let fields = this.props.data
    let entries = []
    let id = 0
    for (let field in fields) {
      entries.push(<div key={id}>
        <InfoEntry field={field} fields={fields} />
      </div>
      )
      id++
    }
    let title = "Node Information"
    let content = <div className="container-fluid">
        {entries}
      </div>
    let classes = {
      "modal-lg": true,
    }
    return (
      <Modal
        title={title}
        content={content}
        classes={classes}
      />
    )
  }
}

const InfoEntry = ({field, fields}) => {
  let type = Object.prototype.toString.call(fields[field])
  if (type == "[object Object]") {
    let entries = []
    let id = 0
    for (let f in fields[field]) {
      entries.push(<div key={id}>
        <InfoEntry field={f} fields={fields[field]} />
      </div>
      )
      id++
    }
    let accordionid = Math.floor((Math.random() * 100) + 1)
    let link = field.replace(/\./g, '').replace(/\+/g, '')
    return (
      <Accordion header={field} key={`${link}${accordionid}`}>
        {entries}
      </Accordion>
    )
  } else if (type == "[object Array]") {
    let entries = []
    for (let i = 0; i < fields[field].length; i++) {
      let sep = i == fields[field].length -1 ? '\u2514' : '\u251c'
      entries.push(<div key={i}>
        {sep}{fields[field][i]}
        </div>
      )
    }
     return (
      <div>
        <div>
          {field}
        </div>
        {entries}
      </div>
    )
  } else {
    return (
      <div className="row">
        <div className="col-md-4">
          <strong>{field}:</strong>
        </div>
        <div className="col-md-6 entry">
            {fields[field]}
        </div>
      </div>
    )
  }
}

class HealthModal extends Component {
  constructor(props) {
    super(props)
  }
  componentDidMount() {
    $(ReactDOM.findDOMNode(this)).modal('show')
  }
  componentWillUnmount() {
    this.props.hide()
  }
  render() {
    let fields = this.props.data
    let entries = []
    let id = 0
    for (let field in fields) {
      entries.push(<div key={id}>
        <HealthEntry field={field} fields={fields} />
      </div>
      )
      id++
    }
    let title = "Node Health"
    let content = <div className="container-fluid">
        {entries}
      </div>
    return (
      <Modal
        title={title}
        content={content}
      />
    )
  }
}

const HealthEntry = ({field, fields}) => {
  var humanize = (str) => {
    if (str != "vdsmd") {
      str = str.replace(/_/g, ' ')
      return str.charAt(0).toUpperCase() + str.slice(1)
    } else {
      return str
    }
  }
  let type = Object.prototype.toString.call(fields[field])
  if (type == "[object Object]") {
    let entries = []
    let id = 0
    let statusIcon = null
    let status = null
    for (let f in fields[field]) {
      if (f != "status") {
        entries.push(<div key={id}>
          <HealthEntry field={f} fields={fields[field]} />
        </div>
        )
      } else {
        status = fields[field][f]
        statusIcon = <HealthIcon
            status={fields[field][f]}
            />
      }
      id++
    }
    let accordionid = Math.floor((Math.random() * 100) + 1)
    let link = field.replace(/\./g, '').replace(/\+/g, '')
    return (
      <div>
        {entries.length ?
          <Accordion
            header={humanize(field)}
            key={`${link}${accordionid}`}
            icon={statusIcon}
            >
            {entries}
          </Accordion>
        : <HealthRow
            title={humanize(field)}
            status={status}
          /> }
      </div>
    )
  } else {
    return (
      <HealthRow
        title={humanize(field)}
        status={fields[field]}
      />
    )
  }
}

const HealthRow = ({title, status}) => {
  let pStyle = {
    fontSize: "1.1em"
  }
  return (
    <div className="row">
        <div style={pStyle} className="col-md-8">
          {title}
        </div>
        <span className="accordion-icon health-icon">
          <HealthIcon
            status={status}
            />
        </span>
    </div>
  )
}

const HealthIcon = ({status}) => {
  let icon = classNames({
    "pficon": true,
    "list-view-pf-icon-lg": true,
    "pficon-ok": status == "ok",
    "list-view-pf-icon-success": status == "ok",
    "pficon-warning-triangle-o": status != "ok",
    "list-view-pf-icon-warning": status != "ok",
  })
  return (
    <span className={icon} />
  )
}

class LayerModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      working: false,
      done: false,
      success: false,
      result: null
    }
    this.helper = new NodeStatus()
    this.onClick = this.onClick.bind(this)
    this.handleRollback = this.handleRollback.bind(this)
    this.resetState = this.resetState.bind(this)
  }
  resetState() {
    this.setState({done: false})
  }
  componentDidMount() {
    $(ReactDOM.findDOMNode(this)).modal('show')
  }
  componentWillUnmount() {
    this.props.hide()
    this.resetState()
  }
  onClick(layer) {
    this.setState({working: true})
    this.helper.rollback(this.handleRollback, layer)
  }
  handleRollback(data) {
    this.setState({working: false})
    this.setState({done: true})
    this.setState({success: data.success})
    if (data.success) {
      this.setState({result: data.next_layer})
    } else {
      let reason = data.reason.replace(/\n/g, "<br />")
      this.setState({result: reason})
    }
  }
  render() {
    let self = this
    let layers = this.props.data.layers
    let entries = []
    let id = 0
    for (let layer in layers) {
      layers[layer].map(function(l, i) {
        let buttonEnabled = l == self.props.data.current_layer ? true : false
        entries.push(<div key={`${l}${i}`}>
          <LayerEntry
            layer={l}
            handler={self.onClick}
            buttonEnabled={buttonEnabled}
            />
        </div>)
      })
      id++
    }

    let result = null

    if (this.state.done) {
      if (this.state.success) {
        result = <div className="row">
          <div className="alert alert-success">
            <span className="pficon pficon-ok"/>
            {this.state.result} will be active after rebooting
          </div>
        </div>
      } else {
        var getHtml = function() { return {__html: self.state.result}}
        result = <div className="row">
          <div className="alert alert-danger">
            <span className="pficon pficon-error-circle-o"/>
            <div dangerouslySetInnerHTML={getHtml()} />
          </div>
        </div>
      }
    }

    let title = "Layers"
    let content = <div className="container-fluid">
      <div className="row">
        <h4>
          Available Layers
        </h4>
      </div>
      {entries}
      {this.state.working ?
        <div className="spinner" /> :
        null}
      {this.state.done ?
        result : null }
    </div>
    return (
      <Modal
        title={title}
        content={content}
      />
    )
  }
}

const LayerEntry = ({layer, handler, buttonEnabled}) => {
  let pStyle = {
    fontSize: "1.1em"
  }
  let buttonClass = classNames({
    "btn": true,
    "btn-default": true,
    "disabled": buttonEnabled
  })
  return (
    <div className="row">
        <div style={pStyle} className="col-md-8">
          {layer}
        </div>
        <div className="col-md-3">
          <button
            className={buttonClass}
            onClick={() => handler(layer)}
            >
            Rollback
          </button>
        </div>
    </div>
  )
}

class HostKeyModal extends Component {
  constructor(props) {
    super(props)
  }
  componentDidMount() {
    $(ReactDOM.findDOMNode(this)).modal('show')
  }
  componentWillUnmount() {
    this.props.hide()
  }
  render() {
    var self = this
    var getHtml = function() { return {__html: self.props.hostKey}}
    let title = "Host RSA Key"
    let content = <div dangerouslySetInnerHTML={getHtml()} />
    return (
      <Modal
        title={title}
        content={content}
      />
    )
  }
}

const Modal = ({title, content, classes={}}) => {
  let baseClasses = {
    "modal-dialog": true,
  }
  let modalClasses = classNames($.extend({}, baseClasses, classes))
  return (
    <div className="modal fade">
      <div className={modalClasses}>
        <div className="modal-content">
          <div className="modal-header">
            <button type="button"
              className="close"
              data-dismiss="modal"
              aria-hidden="true">
              <span className="pficon pficon-close"></span>
            </button>
            <h4 className="modal-title">
              {title}
            </h4>
          </div>
          <div className="modal-body">
            {content}
          </div>
        </div>
      </div>
    </div>
  )
}

class Accordion extends Component {
  constructor(props) {
    super(props)
    this.state = {
      expanded: false,
      hover: false
    }
    this.onClick = this.onClick.bind(this)
  }
  onClick() {
    this.setState({expanded: !this.state.expanded})
  }
  render() {
    let caretClasses = {
      "fa": true,
      "fa-angle-down" : this.state.expanded,
      "fa-angle-right": !this.state.expanded,
    }

    let char = <div className="accordion-toggle">
        <i className={classNames(caretClasses)} />
      </div>
    let childStyle = {
      "marginLeft": "5px",
      "marginRight": "0px"
    }
    let rowClasses = {
      "accordion-row": true,
      "open": this.state.expanded
    }
    return (
      <div>
        <div className="row">
          <div className="accordion">
            <div className={classNames(rowClasses)} onClick={this.onClick}>
              {char}
              <div className="accordion-header">
                {this.props.header}
              </div>
              {this.props.icon != null ?
                <div className="accordion-icon health-icon">
                  {this.props.icon}
                </div>
              : null}
            </div>
          </div>
        </div>
        <div className="row" style={childStyle}>
          {this.state.expanded ?
            this.props.children :
            null}
        </div>
      </div>
    )
  }
}
