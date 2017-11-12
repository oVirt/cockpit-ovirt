import React, { Component } from 'react'
import {CheckIfRegistered} from '../helpers/HostedEngineSetup'
import HeSetupWizardContainer from './HostedEngineSetup/HeSetupWizard/HeSetupWizardContainer'
import GdeploySetup from './gdeploy/GdeploySetup'
import GdeployUtil from '../helpers/GdeployUtil'
import { heSetupState, deploymentOption } from './HostedEngineSetup/constants'

const classNames = require('classnames');

class HostedEngineSetup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cancelled: false,
      deploymentOption: deploymentOption.REGULAR,
      state: heSetupState.POLLING,
      gdeployAvailable: false,
      registered: false,
      registeredTo: "",
      answerFiles: []
    };
    this.registeredCallback = this.registeredCallback.bind(this);
    this.onClick = this.onClick.bind(this);
    this.abortCallback = this.abortCallback.bind(this);
    this.startSetup = this.startSetup.bind(this);
    this.startGdeploy = this.startGdeploy.bind(this);
    this.handleOptionChange = this.handleOptionChange.bind(this);
    this.redeploy = this.redeploy.bind(this);

    CheckIfRegistered(this.registeredCallback);
  }

  componentDidMount() {
    const that = this;
    GdeployUtil.isGdeployAvailable(function (isAvailable) {
      that.setState({ gdeployAvailable: isAvailable })
    })
  }

  onClick() {
    this.setState({ cancelled: false });

    if (this.state.deploymentOption === deploymentOption.REGULAR) {
      this.startSetup()
    } else if (this.state.deploymentOption === deploymentOption.HYPERCONVERGED) {
      this.startGdeploy();
    }
  }

  registeredCallback(isRegistered, engine) {
    if (isRegistered) {
      this.setState({state: heSetupState.REGISTERED,
                     registeredTo: engine})
    } else {
      this.setState({state: heSetupState.EMPTY})
    }
  }

  redeploy() {
    this.setState({state: heSetupState.EMPTY})
  }

  startSetup(answerFiles) {
    this.setState({ state: heSetupState.HOSTED_ENGINE, answerFiles: answerFiles });
  }

  startGdeploy() {
    this.setState({ state: heSetupState.GDEPLOY })
  }

  abortCallback() {
    this.setState({ cancelled: true })
    this.setState({ state: heSetupState.EMPTY })
  }

  handleOptionChange(changeEvent) {
    this.setState({
      deploymentOption: changeEvent.target.value
    });
  }

  render() {
    return (
      <div>
        { this.state.state === heSetupState.POLLING &&
          <div className="spinner" />
        }
        { this.state.state === heSetupState.REGISTERED &&
          <Registered
            callback={this.redeploy}
            engine={this.state.registeredTo}
          />
        }
        { this.state.state === heSetupState.EMPTY &&
          <Curtains
            callback={this.onClick}
            cancelled={this.state.cancelled}
            deploymentOption={this.state.deploymentOption}
            gdeployAvailable={this.state.gdeployAvailable}
            selectionChangeCallback={this.handleOptionChange}
            />
        }
        {this.state.state === heSetupState.HOSTED_ENGINE &&
          <HeSetupWizardContainer
              gDeployAnswerFilePaths={this.state.answerFiles}
              onSuccess={this.startSetup}
              onClose={this.abortCallback}
          />
        }
        { this.state.state === heSetupState.GDEPLOY &&
          <GdeploySetup onSuccess={this.startSetup} onClose={this.abortCallback} />
        }
      </div>
    )
  }
}

const Curtains = ({callback, cancelled, deploymentOption, gdeployAvailable, selectionChangeCallback}) => {
  let message = cancelled ?
    "Hosted engine setup was aborted" :
    "Configure and install a highly-available virtual machine which will \
    run oVirt Engine to manage multiple compute nodes, or add this system \
    to an existing hosted engine cluster."
  let button_text = cancelled ?
    "Restart" : "Start"
  const gdeployClass = classNames({
    radio: true,
    "disabled": !gdeployAvailable
  })
  const gdeployTitle = gdeployAvailable ?
    "Gluster volume will be provisioned using gdeploy and hosted engine will be deployed on gluster" :
    "Gdeploy utility is not installed. Install gdeploy to enable gluster deployment"
  return (
    <div className="curtains curtains-ct blank-slate-pf">
      <div className="container-center">
        <div className="blank-slate-pf-icon">
          <i className="pficon-cluster" />
        </div>
        <h1>
          Hosted Engine Setup
        </h1>
        <p className="curtains-message">
          {message}
        </p>
        <form>
          <div className="radio">
            <label>
              <input type="radio" value="regular"
                checked={deploymentOption === "regular"}
                onChange={selectionChangeCallback} />
              Standard
              </label>
          </div>
          <div className={gdeployClass}  data-placement="top" title={gdeployTitle}>
            <label>
              <input type="radio" value="hci" disabled={!gdeployAvailable}
                checked={deploymentOption === "hci"}
                onChange={selectionChangeCallback} />
              Hosted Engine with Gluster
              </label>
          </div>
        </form>
        <div className="blank-slate-pf-main-action">
          <button
            className="btn btn-lg btn-primary"
            onClick={callback}>{button_text}</button>
        </div>
      </div>
    </div>
  )
};

const Registered = ({callback, engine}) => {
  let message = `This system is already registered to ${engine}!`
  let button_text = "Redeploy"
  return (
    <div className="curtains curtains-ct blank-slate-pf">
      <div className="container-center">
        <div className="blank-slate-pf-icon">
          <i className="pficon-cluster" />
        </div>
        <h1>
          Hosted Engine Setup
        </h1>
        <p className="curtains-message">
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
};

export default HostedEngineSetup
