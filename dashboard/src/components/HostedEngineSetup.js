import React, { Component } from 'react'
import RunSetup from '../helpers/HostedEngineSetup'
var classNames = require('classnames')

var setup = null

class HostedEngineSetup extends Component {
  constructor(props) {
    super(props)
      this.state = {
        hidden: true,
        cancelled: false
      }
    this.onClick = this.onClick.bind(this)
    this.abortCallback = this.abortCallback.bind(this)
    this.startSetup = this.startSetup.bind(this)
  }
  onClick () {
    this.setState({hidden: false})
    this.setState({cancelled: false})
    this.startSetup()
  }
  startSetup() {
    setup = new RunSetup(this.abortCallback)
  }
  abortCallback() {
    this.setState({cancelled: true})
    this.setState({hidden: true})
  }
  render() {
    return (
      <div>
        {this.state.hidden ?
          <Curtains
            callback={this.onClick}
            cancelled={this.state.cancelled}
            />
          :
          <Setup setupCallback={this.startSetup}/>
        }
      </div>
    )
  }
}

class Setup extends Component {
  // TODO: move all of the I/O and event stuff to Redux instead of
  // passing state
  constructor(props) {
    super(props)
    this.state = {
      question: null,
      output: null,
      terminated: false,
      denied: false,
      success: false
    }
    this.resetState = this.resetState.bind(this)
    this.processExit = this.processExit.bind(this)
    this.parseOutput = this.parseOutput.bind(this)
    this.passInput = this.passInput.bind(this)
    this.restart = this.restart.bind(this)
  }
  resetState() {
    var question = {
      prompt: [],
      suggested: '',
      password: false,
      complete: false
    }

    var output = {
      infos: [],
      warnings: [],
      errors: [],
      lines: [],
    }
    this.setState({question: question})
    this.setState({output: output})
    this.setState({terminated: false})
    this.setState({success: false})
  }
  restart() {
    this.resetState()
    this.props.setupCallback()
    this.setState({setup: setup.start(this.parseOutput,
                                      this.processExit)
                  })
  }
  componentWillMount() {
    this.resetState()
    this.setState({setup: setup.start(this.parseOutput,
                                      this.processExit)
                  })
  }
  componentWillUnmount() {
    setup.close()
  }
  processExit(status, accessDenied = false) {
    this.setState({terminated: true})
    this.setState({denied: accessDenied})
    this.setState({success: status == 0 ? true : false})
    console.log(this.state.success)
  }
  passInput(input) {
    if (this.state.question.prompt.length > 0) {
      setup.handleInput(input)
      this.resetState()
    }
  }
  parseOutput(ret) {
    var question = this.state.question
    question.suggested = ret.question.suggested

    question.prompt = question.prompt.concat(ret.question.prompt)
    question.password = ret.question.password
    question.complete = ret.question.complete || this.state.question.complete

    this.setState({question: question})

    for (var key in ret.output) {
      var value = this.state.output
      if (key === "terminated") {
         this.setState({terminated: ret.output.terminated})
      } else {
          // Pop off the beginning of the box if it gets too long, since
          // otopi has a lot of informational messages for some steps,
          // and it pushes everything down the screen
          if (value[key].length > 10) {
            value[key].shift()
          }
          value[key] = value[key].concat(ret.output[key])
      }
      this.setState({output: value })
    }
  }
  render() {
    let finished_error = this.state.terminated  &&
      this.state.output.errors.length > 0

    let show_input = !this.state.terminated &&
      (this.state.question.prompt.length > 0 &&
        this.state.question.complete)

    return (
      <div>
        {this.state.success ?
        <Success /> :
          this.state.denied ?
          <NoPermissions /> :
            <div className="ovirt-input">
              {this.state.output.infos.length > 0 ?
                <Message messages={this.state.output.infos}
                  type="info"
                  icon="info"/>
              : null }
              {this.state.output.warnings.length > 0 ?
                <Message messages={this.state.output.warnings}
                  type="warning"
                  icon="warning-triangle-o"/>
              : null }
              <HostedEngineOutput output={this.state.output}/>
              {show_input ?
                <HostedEngineInput
                  question={this.state.question}
                  password={this.state.question.password}
                  passInput={this.passInput}
                  errors={this.state.output.errors}/>
                : !this.state.terminated ? <div>
                  <div className="spinner"/>
                  <CancelButton /></div> : null }
              {finished_error ?
                <div>
                  <Message messages={this.state.output.errors}
                    type="danger"
                    icon="error-circle-o" />
                  <RestartButton restartCallback={this.restart} />
                </div>
                : null }
            </div>
        }
      </div>
    )
  }
}

class HostedEngineInput extends Component {
  constructor(props) {
    super(props)
    this.state = {
      input: ''
    }
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleInput = this.handleInput.bind(this)
  }
  handleInput(e) {
    this.setState({input: e.target.value})
  }
  handleSubmit(e) {
    e.preventDefault()
    this.props.passInput(this.state.input)
  }
  componentWillReceiveProps(nextProps) {
    var suggested = nextProps.question.suggested
    this.setState({input: suggested})
  }
  render() {
    var inputClass = classNames({
      'col-xs-7': true,
      'form-group': true,
      'has-error': this.props.errors.length > 0
    })
    var prompt = this.props.question.prompt.map(function(line, i) {
      return <span key={i}>
        {line}<br />
        </span>
    })
    var err_text = this.props.errors.length > 0 ?
      this.props.errors.map(function(err, i) {
        return <span key={i} className="help-block">{err}</span>
    }) : null

    var type = this.props.password ? 'password' : 'text'

    return (
      <form
        onSubmit={this.handleSubmit}>
        <div className={inputClass}>
          <label
            className="control-label he-input"
            htmlFor="input">
            {prompt}
          </label>
          <div className="form-inline">
            <input
              autoFocus
              type={type}
              className="form-control"
              onChange={this.handleInput}
              value={this.state.input} />
            <button type="submit"
              className="btn btn-default">
              Next
            </button>
          </div>
          {err_text}
          <CancelButton />
        </div>
      </form>
    )
  }
}

class CancelButton extends Component {
  constructor(props) {
    super(props)
    this.onClick = this.onClick.bind(this)
  }
  onClick() {
    setup.close()
  }
  render() {
    return (
      <div>
        <button
          type="button"
          className="btn btn-danger btn-spacer"
          onClick={this.onClick}>
          Cancel Setup
        </button>
      </div>
    )
  }
}

class RestartButton extends Component {
  constructor(props) {
    super(props)
    this.onClick = this.onClick.bind(this)
  }
  onClick() {
    this.props.restartCallback()
  }
  render() {
    return (
      <div>
        <button className="btn btn-primary btn-spacer"
          onClick={this.onClick}>
          Restart Setup
        </button>
      </div>
    )
  }
}

const HostedEngineOutput = ({output}) => {
  var output_div = output.lines.map(function(line, i) {
    return <span key={i}>
      {line}<br />
    </span>
  })
  return (
    <div className="panel panel-default viewport">
      <div className="he-input">
        {output_div}
      </div>
    </div>
  )
}

const Success = () => {
  return (
    <div className="curtains curtains-ct blank-slate-pf">
      <div className="container-center">
        <div className="blank-slate-pf-icon">
          <i className="pficon-ok" />
        </div>
        <h1>
          Hosted Engine Setup successfully completed!
        </h1>
      </div>
    </div>
  )
}

const NoPermissions = () => {
  return (
    <div className="curtains curtains-ct blank-slate-pf">
      <div className="container-center">
        <div className="blank-slate-pf-icon">
          <i className="pficon-error-circle-o" />
        </div>
        <h1>
          Hosted Engine Setup exited with "Access Denied". Does this user have
          permissions to run it?
        </h1>
      </div>
    </div>
  )
}

const Curtains = ({callback, cancelled}) => {
  let message = cancelled ?
    "Hosted engine setup was aborted" :
    "Configure and install a highly-available virtual machine which will"
    "run oVirt Engine to manage multiple compute nodes, or add this systemd"
    "to an existing hosted engine cluster"
  let button_text = cancelled ?
    "Restart" : "Start"
  return (
    <div className="curtains curtains-ct blank-slate-pf">
      <div className="container-center">
        <div className="blank-slate-pf-icon">
          <i className="pficon-cluster" />
        </div>
        <h1>
          Hosted Engine Setup
        </h1>
        <p>
          {message}
        </p>
        <div className="blank-slate-pf-main-action">
          <button
            className="btn btn-lg btn-primary"
            onClick={callback}>{button_text}</button>
        </div>
      </div>
    </div>
  )
}

const Message = ({messages, type, icon}) => {
  var type = "alert alert-" + type
  var icon = "pficon pficon-" + icon
  var output = messages.map(function(message, i) {
      return <div key={i}>
          <span className={icon}></span>
          {message}
      </div>
  }, this)
  return (
      <div className={type}>{output}</div>
  )
}

export default HostedEngineSetup
