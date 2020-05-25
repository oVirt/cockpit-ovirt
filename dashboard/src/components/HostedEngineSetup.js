import React, { Component } from "react";
import ReactDOM from "react-dom";
import {
  CheckIfRegistered,
  checkForGdeployAnsFiles,
} from "../helpers/HostedEngineSetup";
import HeSetupWizardContainer from "./HostedEngineSetup/HeSetupWizard/HeSetupWizardContainer";
import AnsibleSetup from "./ansible/AnsibleSetup";
import AnsibleUtil from "../helpers/AnsibleUtil";
import {
  heSetupState,
  deploymentOption,
  deploymentTypes,
  messages,
} from "./HostedEngineSetup/constants";
import { CONFIG_FILES as constants } from "../components/ansible/constants";
import Selectbox from "./common/Selectbox";
import logoUrl from "../../static/branding/ovirt/ovirt-logo-highres-black.png";
import HeSetupFooter from "./HeSetupFooter";

const classNames = require("classnames");

class HostedEngineSetup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ansibleLog: "",
      cancelled: false,
      deploymentOption: deploymentOption.REGULAR,
      deploymentType: deploymentTypes.ANSIBLE_DEPLOYMENT,
      state: heSetupState.POLLING,
      closeRequestRecvd: false,
      gdeployAvailable: false,
      gdeployFilesFound: false,
      ansibleWizardType: "setup",
      registered: false,
      registeredTo: "",
      answerFiles: [],
      showFqdn: true,
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
    this.handleExistingGlusterConfigSelection = this.handleExistingGlusterConfigSelection.bind(
      this
    );
    CheckIfRegistered(this.registeredCallback);
  }

  UNSAFE_componentWillMount() {
    checkForGdeployAnsFiles(this.gdeployFileCallback);
  }

  componentDidMount() {}

  onClick() {
    this.setState({ cancelled: false, ansibleWizardType: "setup" });

    if (this.state.deploymentOption === deploymentOption.REGULAR) {
      this.startSetup();
    } else if (
      this.state.deploymentOption === deploymentOption.HYPERCONVERGED
    ) {
      this.startGdeploy();
    } else if (
      this.state.deploymentOption ===
      deploymentOption.USE_EXISTING_GLUSTER_CONFIG
    ) {
      this.startSetup([constants.heAnsfileFile, constants.heCommonAnsFile]);
    }
  }

  startButtonHandler(option) {
    this.setState({ cancelled: false });

    if (option === deploymentOption.REGULAR) {
      this.startSetup();
    } else if (option === deploymentOption.HYPERCONVERGED) {
      this.setState({ state: heSetupState.GLUSTER_CONFIG_CHOICE_REQD });
    }
  }

  registeredCallback(isRegistered, engine) {
    if (isRegistered) {
      this.setState({ state: heSetupState.REGISTERED, registeredTo: engine });
    } else {
      this.setState({ state: heSetupState.EMPTY });
    }
  }

  gdeployFileCallback(filesExist) {
    if (filesExist) {
      this.setState({ gdeployFilesFound: true });
    }
  }

  redeploy() {
    this.setState({ state: heSetupState.EMPTY });
  }

  startSetup(answerFiles) {
    this.setState({
      state: heSetupState.HOSTED_ENGINE,
      answerFiles: answerFiles,
    });
  }

  startGdeploy() {
    this.setState({ state: heSetupState.GDEPLOY });
  }

  abortCallback() {
    if (this.state.state === heSetupState.HOSTED_ENGINE) {
      this.setState({ closeRequestRecvd: true });
    } else {
      this.setState({ cancelled: true });
      this.setState({ state: heSetupState.EMPTY });
    }
  }

  handleCloseSelection(closeDialog) {
    if (closeDialog) {
      this.setState({
        cancelled: true,
        state: heSetupState.EMPTY,
        closeRequestRecvd: false,
      });
    } else {
      this.setState({
        state: heSetupState.HOSTED_ENGINE,
        closeRequestRecvd: false,
      });
    }
  }

  handleOptionChange(changeEvent) {
    this.setState({
      deploymentOption: changeEvent.target.value,
    });
  }

  handleExistingGlusterConfigSelection(option, isSingleNode) {
    let that = this;
    if (option === deploymentOption.USE_EXISTING_GLUSTER_CONFIG) {
      this.startSetup([constants.heAnsfileFile, constants.heCommonAnsFile]);
    } else if (option === deploymentOption.HYPERCONVERGED) {
      that.setState({ isSingleNode: isSingleNode });
      this.startGdeploy();
    }
  }

  deploymentTypeChange(type) {
    this.setState({ deploymentType: type });
  }

  render() {
    return (
      <div>
        {this.state.state === heSetupState.POLLING && (
          <div className="spinner" />
        )}
        {this.state.state === heSetupState.REGISTERED && (
          <Registered
            callback={this.redeploy}
            engine={this.state.registeredTo}
          />
        )}
        {this.state.state === heSetupState.EMPTY && (
          <Curtains
            callback={this.onClick}
            cancelled={this.state.cancelled}
            deploymentOption={this.state.deploymentOption}
            deploymentType={this.state.deploymentType}
            deploymentTypeChangeCallback={this.deploymentTypeChange}
            gdeployAvailable={this.state.gdeployAvailable}
            gdeployFilesFound={this.state.gdeployFilesFound}
            selectionChangeCallback={this.handleOptionChange}
            startButtonHandler={this.startButtonHandler}
          />
        )}
        {this.state.state === heSetupState.HOSTED_ENGINE && (
          <span>
            <HeSetupWizardContainer
              deploymentType={this.state.deploymentType}
              gDeployAnswerFilePaths={this.state.answerFiles}
              onSuccess={this.startSetup}
              showWizard={!this.state.closeRequestRecvd}
              onClose={this.abortCallback}
            />
            {this.state.closeRequestRecvd && (
              <span>
                <CloseWizardConfirmationDialog
                  closeSelectionHandler={this.handleCloseSelection}
                />
              </span>
            )}
          </span>
        )}
        {this.state.state === heSetupState.GLUSTER_CONFIG_CHOICE_REQD && (
          <ExistingGlusterConfigDialog
            glusterConfigSelectionHandler={
              this.handleExistingGlusterConfigSelection
            }
            onClose={this.abortCallback}
          />
        )}
        {this.state.state === heSetupState.GDEPLOY && (
          <AnsibleSetup
            onSuccess={this.startSetup}
            onClose={this.abortCallback}
            ansibleWizardType={this.state.ansibleWizardType}
            showFqdn={this.state.showFqdn}
            isSingleNode={this.state.isSingleNode}
          />
        )}
      </div>
    );
  }
}

const Curtains = ({
  callback,
  cancelled,
  deploymentTypeOption,
  deploymentType,
  deploymentTypeChangeCallback,
  gdeployAvailable,
  gdeployFilesFound,
  selectionChangeCallback,
  startButtonHandler,
}) => {
  let message = cancelled
    ? "Hosted engine setup was aborted"
    : "Configure and install a highly-available virtual machine that will \
    run oVirt Engine to manage multiple compute nodes, or add this system \
    to an existing hosted engine cluster.";
  let button_text = cancelled ? "Restart" : "Start";
  const gdeployClass = classNames({
    radio: true,
    disabled: !gdeployAvailable,
  });
  const gdeployTitle = gdeployAvailable
    ? "Gluster volume will be provisioned using gdeploy and hosted engine will be deployed on gluster"
    : "Gdeploy utility is not installed. Install gdeploy to enable gluster deployment";
  const deploymentTypeOptions = [
    {
      key: deploymentTypes.ANSIBLE_DEPLOYMENT,
      title: "Ansible-based Deployment (Preview)",
    },
    {
      key: deploymentTypes.OTOPI_DEPLOYMENT,
      title: "OTOPI-based Deployment (Recommended)",
    },
  ];

  return (
    <div>
      <div className="curtains curtains-with-footer blank-slate-pf">
        <div className="wizard-container-center">
          <div className="blank-slate-pf-icon">
            <img src={logoUrl} className="curtains-logo" />
          </div>
          <h1 className="curtains-header">Hosted Engine Setup</h1>
          <div className="row">
            <div className="col-sm-8 col-sm-offset-2">
              <p className="curtains-message">{message}</p>
            </div>
          </div>
          <div className="he-wizard-deployment-options-container">
            <DeploymentOptionPanel
              id={"he-wizard-btn"}
              iconType={"pficon-cluster"}
              deploymentTypeOption={deploymentOption.REGULAR}
              mainText={"Hosted Engine"}
              subText={
                "Deploy oVirt hosted engine on storage that has already been provisioned"
              }
              buttonText={"Start"}
              buttonCallback={startButtonHandler}
            />

            <DeploymentOptionPanel
              id={"glusterDeploymentStart"}
              iconType={"fa-database"}
              deploymentTypeOption={deploymentOption.HYPERCONVERGED}
              isLastOption
              mainText={"Hyperconverged"}
              subText={"Configure Gluster storage and oVirt hosted engine"}
              buttonText={"Start"}
              buttonCallback={startButtonHandler}
            />
          </div>
        </div>
      </div>
      <HeSetupFooter />
    </div>
  );
};

const DeploymentOptionPanel = ({
  id,
  iconType,
  mainText,
  subText,
  buttonText,
  buttonCallback,
  deploymentTypeOption,
  isLastOption,
}) => {
  let containerClasses = "deployment-option-panel-container";
  containerClasses += isLastOption
    ? " last-deployment-option-panel-container"
    : "";
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
      <button
        id={id}
        className="btn btn-primary"
        onClick={() => buttonCallback(deploymentTypeOption)}
      >
        {buttonText}
      </button>
    </span>
  );
};

class CloseWizardConfirmationDialog extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    $(ReactDOM.findDOMNode(this)).modal("show");
  }

  componentWillUnmount() {
    $(ReactDOM.findDOMNode(this)).modal("hide");
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
                    <button
                      type="button"
                      className="btn btn-default confirm-close-dialog-btn"
                      aria-label="Close the wizard"
                      onClick={(e) => this.props.closeSelectionHandler(true)}
                    >
                      Yes
                    </button>
                  </div>

                  <div className="col-sm-3">
                    <button
                      type="button"
                      className="btn btn-default confirm-close-dialog-btn"
                      style={{ float: "right" }}
                      aria-label="Do not close the wizard"
                      onClick={(e) => this.props.closeSelectionHandler(false)}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class ExistingGlusterConfigDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showUseExistingConfOption: false,
      ansibleInventoryFileFound: false,
      cleanUpConfigPreview: false,
    };
    this.glusterCleanup = this.glusterCleanup.bind(this);
    this.ansibleDone = this.ansibleDone.bind(this);
    this.ansibleStdout = this.ansibleStdout.bind(this);
    this.ansibleFail = this.ansibleFail.bind(this);
    this.closeCleanUpConfigpreview = this.closeCleanUpConfigpreview.bind(this);
    let that = this;
    AnsibleUtil.checkIfFileExist(constants.ansibleInventoryFile, function (
      isExist
    ) {
      if (isExist) {
        that.setState({ ansibleInventoryFileFound: true });
      }
    });
  }

  componentDidMount() {
    $(ReactDOM.findDOMNode(this)).modal("show");
    let file = cockpit.file(constants.ansibleStatus);
    return file
      .read()
      .done((content, tag) => {
        if (content == "0" || content == 0) {
          this.setState({ showUseExistingConfOption: true });
        }
      })
      .fail((error) => {
        console.warn(`ansibleStatus file not written`, error);
      })
      .always((tag) => {
        file.close();
      });
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  scrollToBottom() {
    if (this.ansibleLogText != null) {
      const scrollHeight = this.ansibleLogText.scrollHeight;
      const height = this.ansibleLogText.clientHeight;
      const maxScrollTop = scrollHeight - height;
      ReactDOM.findDOMNode(this.ansibleLogText).scrollTop =
        maxScrollTop > 0 ? maxScrollTop : 0;
    }
  }

  componentWillUnmount() {
    $(ReactDOM.findDOMNode(this)).modal("hide");
  }

  ansibleDone() {
    const that = this;
    this.setState({
      ansibleLog:
        that.state.ansibleLog +
        "\nCleanup Successful!\nPlease check " +
        constants.glusterDeploymentCleanUpLog +
        "for more informations.",
    });
    that.saveLog(constants.glusterDeploymentCleanUpLog, that.state.ansibleLog);
  }

  ansibleStdout(data) {
    this.setState({ ansibleLog: this.state.ansibleLog + data });
  }

  ansibleFail(response) {
    const that = this;
    if (response.exit_status === 1) {
      this.ansibleStdout(
        "ERROR! No inventory was parsed, please check your configuration and options. Could be problem in inventory file."
      );
    }
    this.setState({
      ansibleLog:
        that.state.ansibleLog +
        "\nCleanup Failed!\nPlease check " +
        constants.glusterDeploymentCleanUpLog +
        "for more informations.",
    });
    that.saveLog(constants.glusterDeploymentCleanUpLog, that.state.ansibleLog);
  }

  closeCleanUpConfigpreview() {
    this.setState({ cleanUpConfigPreview: false });
  }

  glusterCleanup() {
    const that = this;
    that.setState({ cleanUpConfigPreview: true });
    this.state.ansibleLog = "";
    AnsibleUtil.runAnsibleCleanupPlaybook(
      this.ansibleStdout,
      this.ansibleDone,
      this.ansibleFail,
      function (response) {
        if (response === true) {
          that.ansibleDone();
        } else {
          that.ansibleFail(response);
        }
      }
    );
  }
  saveLog(filePath, fileContent) {
    const that = this;
    AnsibleUtil.handleDirAndFileCreation(filePath, fileContent, function (
      result
    ) {
      console.log("Status File: ", result);
    });
  }

  checkFlagForButton() {
    this.useExistingConfiguration = [];
    this.useExistingConfigurationMessage = [];
    this.divClasses = "row popup-dialog-btn-row";
    this.modalSize = "modal-content";
    this.secondOptionClass = "";
    this.thirdOptionClass = "";
    this.cleanUpConfigPreview = "";
    this.cleanUpConfiPreviewClass = "";
    const that = this;
    if (this.state.showUseExistingConfOption) {
      this.cleanUpConfiPreviewClass = "cleanup-config-preview-fourOptions";
      this.divClasses += " col-sm-16";
      this.thirdOptionClass += " col-sm-4";
      this.secondOptionClass += "col-sm-2 col-sm-offset-1";
      this.useExistingConfiguration.push(
        <div className="col-sm-2 col-sm-offset-1">
          <button
            type="button"
            id="useExistingConfiguration"
            className="btn btn-default"
            aria-label="Use existing configuration"
            onClick={(e) =>
              this.props.glusterConfigSelectionHandler(
                deploymentOption.USE_EXISTING_GLUSTER_CONFIG,
                false
              )
            }
          >
            Use Existing Configuration
          </button>
        </div>
      );
      this.useExistingConfigurationMessage.push(
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
                Note: To view existing gluster configuration details, see the
                Storage section in the main Cockpit tab.
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      this.cleanUpConfiPreviewClass = "cleanup-config-preview-threeOptions";
      this.divClasses += " col-sm-14";
      this.modalSize += " gluster_options_class_size";
      this.thirdOptionClass += "col-sm-5";
      this.secondOptionClass += "col-sm-2 col-sm-offset-2";
    }
    if (that.state.ansibleInventoryFileFound) {
      if (that.state.cleanUpConfigPreview) {
        this.cleanUpConfigPreview = (
          <div className="list-group">
            <div className="list-group-item">
              <textarea
                className={this.cleanUpConfiPreviewClass}
                ref={(input) => {
                  this.ansibleLogText = input;
                }}
                value={this.state.ansibleLog}
              ></textarea>
              <button
                type="button"
                className="pull-left btn btn-primary wizard-pf-close wizard-pf-dismiss"
                onClick={this.closeCleanUpConfigpreview}
                aria-hidden="true"
              >
                Close
              </button>
            </div>
          </div>
        );
      }
      that.ansibleInventory = [];
      that.ansibleInventory.push(
        <div className="col-sm-2" style={{ float: "left" }}>
          <button
            type="button"
            id="cleanUpGlusterDeployment"
            className="btn btn-default"
            aria-label="Cleanup Existing Gluster Deployment"
            style={
              that.state.ansibleInventoryFileFound ? {} : { display: "none" }
            }
            onClick={(e) =>
              window.confirm(
                "Are you sure that you want to clean the existing gluster deployment?"
              ) && this.glusterCleanup()
            }
          >
            Clean Existing Gluster Deployment
          </button>
          {that.cleanUpConfigPreview}
        </div>
      );
    }
  }

  render() {
    this.checkFlagForButton();
    return (
      <div className="modal" data-backdrop="static" role="dialog">
        <div className="modal-dialog modal-lg">
          <div className={this.modalSize}>
            <div className="modal-header">
              <button
                type="button"
                className="close wizard-pf-dismiss"
                aria-label="Close"
                onClick={this.props.onClose}
                data-dismiss="modal"
                aria-hidden="true"
              >
                <span className="pficon pficon-close" />
              </button>
              <dt className="modal-title">Gluster Configuration</dt>
            </div>
            <div className="modal-body clearfix">
              <div>
                {this.useExistingConfigurationMessage}
                <div className={this.divClasses}>
                  {this.ansibleInventory}
                  {this.useExistingConfiguration}
                  <div className={this.secondOptionClass}>
                    <button
                      type="button"
                      id="threeNodeDeploymentButton"
                      className="btn btn-default"
                      aria-label="Run gluster wizard"
                      onClick={(e) =>
                        this.props.glusterConfigSelectionHandler(
                          deploymentOption.HYPERCONVERGED,
                          false
                        )
                      }
                    >
                      Run Gluster Wizard
                    </button>
                  </div>
                  <div
                    className={this.thirdOptionClass}
                    style={{ float: "right" }}
                  >
                    <button
                      type="button"
                      id="singleNodeDeploymentButton"
                      className="btn btn-default"
                      aria-label="Run gluster wizard for single node"
                      onClick={(e) =>
                        this.props.glusterConfigSelectionHandler(
                          deploymentOption.HYPERCONVERGED,
                          true
                        )
                      }
                    >
                      Run Gluster Wizard For Single Node
                    </button>
                    <span
                      className="fa fa-lg fa-info-circle"
                      title="Single node setup doesn't provide high availability"
                    ></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const Registered = ({ callback, engine }) => {
  let message = `This system is already registered to ${engine}!`;
  let button_text = "Redeploy";
  return (
    <div>
      <div className="curtains curtains-with-footer blank-slate-pf">
        <div className="container-center">
          <div className="blank-slate-pf-icon">
            <i className="pficon-cluster" />
          </div>
          <h1>Hosted Engine Setup</h1>
          <p className="curtains-message">{message}</p>
          <div className="blank-slate-pf-main-action">
            <button className="btn btn-lg btn-primary" onClick={callback}>
              {button_text}
            </button>
          </div>
        </div>
      </div>
      <HeSetupFooter />
    </div>
  );
};

export default HostedEngineSetup;
