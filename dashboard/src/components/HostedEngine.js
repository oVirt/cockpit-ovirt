import React, { Component } from 'react'
import RunSetup from '../helpers/HostedEngineSetup'
var classNames = require('classnames')

var setup = null

class HostedEngine extends Component {
  constructor(props) {
    super(props)
      this.state = {
        hidden: true,
        foo: "bar"
      }
    this.onClick = this.onClick.bind(this)
  }
  onClick () {
    this.setState({hidden: false})
  }
  componentWillMount() {
    setup = new RunSetup()
  }
  render() {
    return (
      <div>
        {this.state.hidden ?
          <Curtains callback={this.onClick} />
          :
          <Setup />
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
      output: null
    }
    this.resetState = this.resetState.bind(this)
    this.parseOutput = this.parseOutput.bind(this)
    this.passInput = this.passInput.bind(this)
  }
  resetState() {
    var question = {
      prompt: [],
      suggested: ''
    }

    var output = {
      infos: [],
      warnings: [],
      errors: [],
      lines: [],
      terminated: false
    }
    this.setState({question: question})
    this.setState({output: output})
  }
  componentWillMount() {
    this.resetState()
    this.setState({setup: setup.start(this.parseOutput)})
  }
  componentWillUnmount() {
    setup.close()
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

    this.setState({question: question})

    for (var key in ret.output) {
      var value = this.state.output
      if (key === "terminated") {
         value.terminated = ret.output.terminated
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
    let finished_error = this.state.output.terminated &&
      this.state.output.errors.length > 0

    let show_input = !this.state.output.terminated &&
      this.state.question.prompt.length > 0

    return (
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
            passInput={this.passInput}
            errors={this.state.output.errors}/>
          : !this.state.output.terminated ? <div className="spinner"/> : null }
        {finished_error ?
          <Message messages={this.state.output.errors}
            type="danger"
            icon="error-circle-o" />
          : null }
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
    return (
      <form
        onSubmit={this.handleSubmit}>
        <div className={inputClass}>
          <label
            className="control-label he-input"
            htmlFor="input">
            {prompt}
          </label>
          <input
            type="text"
            className="form-control"
            onChange={this.handleInput}
            value={this.state.input} />
          {err_text}
        </div>
      </form>
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

const Curtains = ({callback}) => {
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
          Configure and install a highly-available virtual machine which will
          run oVirt Engine to manage multiple compute nodes, or add this systemd
          to an existing hosted engine cluster
        </p>
        <div className="blank-slate-pf-main-action">
          <button
            className="btn btn-lg btn-primary"
            onClick={callback}>Start</button>
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

export default HostedEngine
