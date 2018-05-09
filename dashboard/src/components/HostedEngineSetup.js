import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import {CheckIfRegistered, checkForGdeployAnsFiles} from '../helpers/HostedEngineSetup'
import HeSetupWizardContainer from './HostedEngineSetup/HeSetupWizard/HeSetupWizardContainer'
import GdeploySetup from './gdeploy/GdeploySetup'
import GdeployUtil from '../helpers/GdeployUtil'
import {heSetupState, deploymentOption, deploymentTypes, messages} from './HostedEngineSetup/constants'
import { CONFIG_FILES as constants } from '../components/gdeploy/constants'
import Selectbox from './common/Selectbox'
import logoUrl from '../../static/branding/ovirt/ovirt-logo-highres.png'

const classNames = require('classnames');

class HostedEngineSetup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cancelled: false,
      deploymentOption: deploymentOption.REGULAR,
      deploymentType: deploymentTypes.ANSIBLE_DEPLOYMENT,
      state: heSetupState.POLLING,
      closeRequestRecvd: false,
      gdeployAvailable: false,
      gdeployFilesFound: false,
      gdeployWizardType: "setup",
      registered: false,
      registeredTo: "",
      answerFiles: [],
      showFqdn: false
    };
    this.registeredCallback = this.registeredCallback.bind(this);
    this.gdeployFileCallback = this.gdeployFileCallback.bind(this);
    this.onClick = this.onClick.bind(this);
    this.abortCallback = this.abortCallback.bind(this);
    this.handleCloseSelection = this.handleCloseSelection.bind(this);
    this.startSetup = this.startSetup.bind(this);
    this.startGdeploy = this.startGdeploy.bind(this);
    this.handleOptionChange = this.handleOptionChange.bind(this);
    this.redeploy = this.redeploy.bind(this);
    this.deploymentTypeChange = this.deploymentTypeChange.bind(this);
    this.startButtonHandler = this.startButtonHandler.bind(this);
    this.handleExistingGlusterConfigSelection = this.handleExistingGlusterConfigSelection.bind(this);
    CheckIfRegistered(this.registeredCallback);
  }

  componentWillMount() {
      checkForGdeployAnsFiles(this.gdeployFileCallback);
  }

  componentDidMount() {
    const that = this;
    GdeployUtil.isGdeployAvailable(function (isAvailable) {
      that.setState({ gdeployAvailable: isAvailable })
      GdeployUtil.findGdeployVersion(function(isSupported) {
        that.setState({ showFqdn: isSupported })
      })
    })
  }

  onClick() {
    this.setState({ cancelled: false, gdeployWizardType: "setup" });

    if (this.state.deploymentOption === deploymentOption.REGULAR) {
      this.startSetup();
    } else if (this.state.deploymentOption === deploymentOption.HYPERCONVERGED) {
      this.startGdeploy();
    } else if (this.state.deploymentOption === deploymentOption.USE_EXISTING_GLUSTER_CONFIG) {
        this.startSetup([constants.heAnsfileFile, constants.heCommonAnsFile]);
    }
  }

  startButtonHandler(option) {
    this.setState({ cancelled: false });

    if (option === deploymentOption.REGULAR) {
      this.startSetup();
    } else if (option === deploymentOption.HYPERCONVERGED && !this.state.gdeployFilesFound) {
      this.startGdeploy();
    } else if (option === deploymentOption.HYPERCONVERGED && this.state.gdeployFilesFound) {
      this.setState({ state: heSetupState.GLUSTER_CONFIG_CHOICE_REQD });
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

  gdeployFileCallback(filesExist) {
      if (filesExist) {
          this.setState({ gdeployFilesFound: true });
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
    if (this.state.state === heSetupState.HOSTED_ENGINE) {
      this.setState({closeRequestRecvd: true});
    } else {
      this.setState({ cancelled: true });
      this.setState({ state: heSetupState.EMPTY });
    }
  }

  handleCloseSelection(closeDialog) {
    if (closeDialog) {
      this.setState({cancelled: true, state: heSetupState.EMPTY, closeRequestRecvd: false});
    } else {
      this.setState({ state: heSetupState.HOSTED_ENGINE, closeRequestRecvd: false });
    }
  }

  handleOptionChange(changeEvent) {
    this.setState({
      deploymentOption: changeEvent.target.value
    });
  }

  handleExistingGlusterConfigSelection(option) {
    if (option === deploymentOption.USE_EXISTING_GLUSTER_CONFIG) {
      this.startSetup([constants.heAnsfileFile, constants.heCommonAnsFile]);
    } else if (option === deploymentOption.HYPERCONVERGED) {
      this.startGdeploy();
    }
  }

  deploymentTypeChange(type) {
    this.setState({ deploymentType: type });
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
            deploymentType={this.state.deploymentType}
            deploymentTypeChangeCallback={this.deploymentTypeChange}
            gdeployAvailable={this.state.gdeployAvailable}
            gdeployFilesFound={this.state.gdeployFilesFound}
            selectionChangeCallback={this.handleOptionChange}
            startButtonHandler={this.startButtonHandler} />
        }
        {this.state.state === heSetupState.HOSTED_ENGINE &&
          <span>
            <HeSetupWizardContainer
                deploymentType={this.state.deploymentType}
                gDeployAnswerFilePaths={this.state.answerFiles}
                onSuccess={this.startSetup}
                showWizard={!this.state.closeRequestRecvd}
                onClose={this.abortCallback} />
            <span style={this.state.closeRequestRecvd ? {} : {display: 'none'}}>
              <CloseWizardConfirmationDialog closeSelectionHandler={this.handleCloseSelection} />
            </span>
          </span>
        }
        {this.state.state === heSetupState.GLUSTER_CONFIG_CHOICE_REQD &&
          <ExistingGlusterConfigDialog glusterConfigSelectionHandler={this.handleExistingGlusterConfigSelection}
                                       onClose={this.abortCallback} />
        }
        {this.state.state === heSetupState.GDEPLOY &&
          <GdeploySetup onSuccess={this.startSetup}
                        onClose={this.abortCallback}
                        gdeployWizardType={this.state.gdeployWizardType}
                        showFqdn={this.state.showFqdn} />
        }
      </div>
    )
  }
}

const Curtains = ({callback, cancelled, deploymentTypeOption, deploymentType, deploymentTypeChangeCallback,
                      gdeployAvailable, gdeployFilesFound, selectionChangeCallback, startButtonHandler}) => {
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
    "Gdeploy utility is not installed. Install gdeploy to enable gluster deployment";
  const deploymentTypeOptions = [
      { key: deploymentTypes.ANSIBLE_DEPLOYMENT, title: "Ansible-based Deployment (Preview)" },
      { key: deploymentTypes.OTOPI_DEPLOYMENT, title: "OTOPI-based Deployment (Recommended)" }
  ];

  return (
    <div className="curtains curtains-with-footer blank-slate-pf">
      <div className="wizard-container-center">
        <div className="blank-slate-pf-icon">
          <img src={logoUrl} className="curtains-logo" />
        </div>
        <h1 className="curtains-header">
          Hosted Engine Setup
        </h1>
        <div className="row">
          <div className="col-sm-8 col-sm-offset-2">
            <p className="curtains-message">
                {message}
            </p>
          </div>
        </div>
        <div className="he-wizard-deployment-options-container">
          <DeploymentOptionPanel iconType={"pficon-cluster"}
                                 deploymentTypeOption={deploymentOption.REGULAR}
                                 mainText={"Hosted Engine"}
                                 subText={"Deploy oVirt hosted engine on storage that has already been provisioned"}
                                 buttonText={"Start"}
                                 buttonCallback={startButtonHandler} />

          <DeploymentOptionPanel iconType={"fa-database"}
                                 deploymentTypeOption={deploymentOption.HYPERCONVERGED}
                                 isLastOption
                                 mainText={"Hyperconverged"}
                                 subText={"Configure gluster storage and oVirt hosted engine"}
                                 buttonText={"Start"}
                                 buttonCallback={startButtonHandler} />
        </div>
        <HeWizardFooter />
      </div>
    </div>
  )
};

const DeploymentOptionPanel = ({iconType, mainText, subText, buttonText, buttonCallback, deploymentTypeOption,
                                   isLastOption}) => {
  let containerClasses = "deployment-option-panel-container";
  containerClasses += isLastOption ? " last-deployment-option-panel-container" : "";
  const iconClasses = iconType.startsWith("fa") ? "fa " + iconType : iconType;

  return (
    <span className={containerClasses}>
     <div className="deployment-option-panel-icon">
       <span className={iconClasses} />
     </div>
     <span className="deployment-option-panel-main-text">
       <h3>{mainText}</h3>
     </span>
     <div className="deployment-option-panel-sub-text">
       <h5>{subText}</h5>
     </div>
     <button className="btn btn-primary" onClick={() => buttonCallback(deploymentTypeOption)}>
       {buttonText}
     </button>
   </span>
  )
};

const HeWizardFooter = () => {
  return (
      <div className="he-wizard-footer">
        <div className="container">
          <div className="row he-wizard-footer-content">
            <div className="col-sm-6">
              <div className="row">
                <div className="col-sm-3 he-wizard-footer-header">
                  Getting Started
                </div>
                <div className="col-sm-6">
                  <ul className="he-wizard-footer-links">
                    <li>
                      <a href="https://ovirt.org/documentation/self-hosted/Self-Hosted_Engine_Guide/" target="_blank">
                        Installation Guide
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="col-sm-6">
              <div className="row">
                <div className="col-sm-4 he-wizard-footer-header">
                  More Information
                </div>
                <div className="col-sm-6">
                  <ul className="he-wizard-footer-links">
                    <li>
                      <a href="http://www.ovirt.org" target="_blank">oVirt Homepage</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
};

class CloseWizardConfirmationDialog extends Component  {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
      $(ReactDOM.findDOMNode(this)).modal('show')
  }

  componentWillUnmount() {
      $(ReactDOM.findDOMNode(this)).modal('hide')
  }

  render() {
      return (
          <div className="modal" data-backdrop="static" role="dialog">
            <div className="modal-dialog modal-lg" style={{ width: "400px" }}>
              <div className="modal-content">
                <div className="modal-header">
                  <dt className="modal-title">Exit Wizard</dt>
                </div>
                <div className="modal-body clearfix">
                  <div>
                    <div className="row">
                      <div className="col-sm-10 col-sm-offset-1">
                        <div className="popup-dialog-text">
                            Are you sure you want to exit the wizard?
                        </div>
                      </div>
                    </div>

                    <div className="row popup-dialog-btn-row">
                      <div className="col-sm-3 col-sm-offset-3">
                        <button type="button"
                                className="btn btn-default confirm-close-dialog-btn"
                                aria-label="Close the wizard"
                                onClick={(e) => this.props.closeSelectionHandler(true)}>
                          Yes
                        </button>
                      </div>

                      <div className="col-sm-3">
                        <button type="button"
                                className="btn btn-default confirm-close-dialog-btn"
                                style={{ float: "right" }}
                                aria-label="Do not close the wizard"
                                onClick={(e) => this.props.closeSelectionHandler(false)}>
                          No
                        </button>
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

class ExistingGlusterConfigDialog extends Component  {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
      $(ReactDOM.findDOMNode(this)).modal('show')
  }

  componentWillUnmount() {
      $(ReactDOM.findDOMNode(this)).modal('hide')
  }

  render() {
      return (
          <div className="modal" data-backdrop="static" role="dialog">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <button type="button"
                          className="close wizard-pf-dismiss"
                          aria-label="Close" onClick={this.props.onClose}
                          data-dismiss="modal" aria-hidden="true" >
                    <span className="pficon pficon-close" />
                  </button>
                  <dt className="modal-title">Gluster Configuration Found</dt>
                </div>
                <div className="modal-body clearfix">
                  <div>
                    <div className="row">
                      <div className="col-sm-10 col-sm-offset-1">
                        <div className="popup-dialog-text">
                            {messages.GLUSTER_CONFIGURATION_FOUND}
                        </div>
                      </div>
                    </div>

                    <div className="row popup-dialog-note-row">
                      <div className="col-sm-10 col-sm-offset-1">
                        <div className="popup-dialog-note">
                          Note: To view existing gluster configuration details, see the Storage section in the main Cockpit tab.
                        </div>
                      </div>
                    </div>

                    <div className="row popup-dialog-btn-row">
                      <div className="col-sm-3 col-sm-offset-3">
                        <button type="button"
                                className="btn btn-default"
                                aria-label="Use existing configuration"
                                onClick={(e) => this.props.glusterConfigSelectionHandler(deploymentOption.USE_EXISTING_GLUSTER_CONFIG)}>
                          Use Existing Configuration
                        </button>
                      </div>

                      <div className="col-sm-3">
                        <button type="button"
                                className="btn btn-default"
                                aria-label="Run gluster wizard"
                                onClick={(e) => this.props.glusterConfigSelectionHandler(deploymentOption.HYPERCONVERGED)}>
                          Run Gluster Wizard
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
      )
  }
};

const Registered = ({callback, engine}) => {
  let message = `This system is already registered to ${engine}!`
  let button_text = "Redeploy"
  return (
      <div>
        <div className="curtains curtains-with-footer blank-slate-pf">
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
        <HeWizardFooter />
      </div>
  )
};

export default HostedEngineSetup
