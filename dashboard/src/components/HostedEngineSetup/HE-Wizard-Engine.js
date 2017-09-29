import React, { Component } from 'react'
import MultiRowTextBox from './MultiRowTextBox'
import { getClassNames } from '../../helpers/HostedEngineSetupUtil'
import { getErrorMsgForProperty, validatePropsForUiStage } from './Validation'
import { messages } from './constants'

class WizardEngineStep extends Component {
    constructor(props) {
        super(props);
        this.state = {
            heSetupModel: props.heSetupModel,
            errorMsg: "",
            errorMsgs: {}
        };

        this.handleRecipientAddressDelete = this.handleRecipientAddressDelete.bind(this);
        this.handleRecipientAddressUpdate = this.handleRecipientAddressUpdate.bind(this);
        this.handleEngineConfigUpdate = this.handleEngineConfigUpdate.bind(this);
        this.validateConfigUpdate = this.validateConfigUpdate.bind(this);
        this.validateAdminPasswordMatch = this.validateAdminPasswordMatch.bind(this);
        this.validateAllInputs = this.validateAllInputs.bind(this);
    }

    handleRecipientAddressDelete(index) {
        const addresses = this.state.heSetupModel.notifications.destEmail.value;
        addresses.splice(index, 1);
        this.setState({ addresses, errorMsgs: {} });
    }

    handleRecipientAddressUpdate(index, address) {
        const addresses = this.state.heSetupModel.notifications.destEmail.value;
        addresses[index] = address;
        const errorMsgs= this.state.errorMsgs;
        this.setState({ addresses, errorMsgs });
    }

    handleEngineConfigUpdate(propName, value, configType) {
        const heSetupModel = this.state.heSetupModel;

        heSetupModel[configType][propName].value = value;

        if (propName === "adminPortalPassword") {
            heSetupModel.engine.adminPortalPassword.useInAnswerFile = true;
        }

        this.validateConfigUpdate(propName, heSetupModel[configType]);
        this.setState({ heSetupModel });
    }

    validateConfigUpdate(propName, config) {
        let errorMsg = this.state.errorMsg;
        const errorMsgs = {};
        const prop = config[propName];
        const propErrorMsg = getErrorMsgForProperty(prop);

        if (propErrorMsg !== "") {
            errorMsgs[propName] = propErrorMsg;
        } else {
            errorMsg = "";
        }

        if (propName === "confirmAdminPortalPassword") {
            this.validateAdminPasswordMatch(errorMsgs);
        }

        this.setState({ errorMsg, errorMsgs });
    }

    validateAdminPasswordMatch(errorMsgs) {
        const engineConfig = this.state.heSetupModel.engine;
        let passwordsMatch = engineConfig.adminPortalPassword.value === engineConfig.confirmAdminPortalPassword.value;

        if (!passwordsMatch) {
            errorMsgs.confirmAdminPortalPassword = messages.PASSWORD_MISMATCH;
        }

        return passwordsMatch;
    }

    validateAllInputs() {
        let errorMsg = "";
        let errorMsgs = {};
        let propsAreValid = validatePropsForUiStage("Engine", this.props.heSetupModel, errorMsgs);
        let passwordsMatch = this.validateAdminPasswordMatch(errorMsgs);

        if (!propsAreValid || !passwordsMatch) {
            errorMsg = messages.GENERAL_ERROR_MSG;
        }

        this.setState({ errorMsg, errorMsgs });
        return propsAreValid && passwordsMatch;
    }

    shouldComponentUpdate(nextProps, nextState){
        if(!this.props.validating && nextProps.validating){
            this.props.validationCallBack(this.validateAllInputs())
        }
        return true;
    }

    render() {
        const engineConfig = this.state.heSetupModel.engine;
        const notificationsConfig = this.state.heSetupModel.notifications;
        const errorMsgs = this.state.errorMsgs;

        return (
            <div>
                <form className="form-horizontal he-form-container">
                    {this.state.errorMsg &&
                        <div className="row" style={{marginLeft: "40px"}}>
                            <div className="alert alert-danger col-sm-8">
                                <span className="pficon pficon-error-circle-o" />
                                <strong>{this.state.errorMsg}</strong>
                            </div>
                        </div>
                    }

                    <div className={getClassNames("hostIdentifier", errorMsgs)}>
                        <label className="col-md-4 control-label">Host Identifier</label>
                        <div className="col-md-6">
                            <input type="text" style={{width: "120px"}}
                                   title="Enter the host identifier."
                                   className="form-control"
                                   value={engineConfig.hostIdentifier.value}
                                   onChange={(e) => this.handleEngineConfigUpdate("hostIdentifier", e.target.value, "engine")}
                            />
                            {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                        </div>
                    </div>

                    <div className={getClassNames("adminUsername", errorMsgs)}>
                        <label className="col-md-4 control-label">Admin Username</label>
                        <div className="col-md-6">
                            <input type="text" style={{width: "140px"}}
                                   title="Enter the admin username."
                                   className="form-control"
                                   value={engineConfig.adminUsername.value}
                                   onChange={(e) => this.handleEngineConfigUpdate("adminUsername", e.target.value, "engine")}
                            />
                            {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                        </div>
                    </div>

                    <div className={getClassNames("adminPortalPassword", errorMsgs)}>
                        <label className="col-md-4 control-label">Admin Portal Password</label>
                        <div className="col-md-6">
                            <input type="password" style={{width: "140px"}}
                                   title="Enter the admin portal password."
                                   className="form-control"
                                   onChange={(e) => this.handleEngineConfigUpdate("adminPortalPassword", e.target.value, "engine")}
                            />
                            {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                        </div>
                    </div>

                    <div className={getClassNames("confirmAdminPortalPassword", errorMsgs)}
                         style={engineConfig.adminPortalPassword.value !== "" ? {} : {display: 'none'}}>
                        <label className="col-md-4 control-label">Confirm Password</label>
                        <div className="col-md-6">
                            <input type="password" style={{width: "140px"}}
                                   title="Confirm the admin portal password."
                                   className="form-control"
                                   onChange={(e) => this.handleEngineConfigUpdate("confirmAdminPortalPassword", e.target.value, "engine")}
                            />
                            {errorMsgs.confirmAdminPortalPassword && <span className="help-block">{errorMsgs.confirmAdminPortalPassword}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="col-md-9 he-stage-header">
                            <h3>Notification Server (SMTP) Settings</h3>
                        </div>
                    </div>

                    <div className={getClassNames("smtpServer", errorMsgs)}>
                        <label className="col-md-4 control-label">Server Name</label>
                        <div className="col-md-6">
                            <input type="text"  style={{width: "120px"}}
                                   placeholder="localhost"
                                   title="Please provide the name of the SMTP server through which we will send notifications."
                                   className="form-control"
                                   value={notificationsConfig.smtpServer.value}
                                   onChange={(e) => this.handleEngineConfigUpdate("smtpServer", e.target.value, "notifications")}
                            />
                            {errorMsgs.smtpServer && <span className="help-block">{errorMsgs.smtpServer}</span>}
                        </div>
                    </div>

                    <div className={getClassNames("smtpPort", errorMsgs)}>
                        <label className="col-md-4 control-label">Server Port Number</label>
                        <div className="col-md-6">
                            <input type="number"  style={{width: "75px"}}
                                   placeholder="25"
                                   title="Please provide the TCP port number of the SMTP server"
                                   className="form-control"
                                   value={notificationsConfig.smtpPort.value}
                                   onChange={(e) => this.handleEngineConfigUpdate("smtpPort", e.target.value, "notifications")}
                            />
                            {errorMsgs.smtpPort && <span className="help-block">{errorMsgs.smtpPort}</span>}
                        </div>
                    </div>

                    <div className={getClassNames("sourceEmail", errorMsgs)}>
                        <label className="col-md-4 control-label">Sender E-Mail Address</label>
                        <div className="col-md-6">
                            <input type="text"  style={{width: "120px"}}
                                   placeholder="root@localhost"
                                   title="Please provide the email address from which notifications will be sent"
                                   className="form-control"
                                   value={notificationsConfig.sourceEmail.value}
                                   onChange={(e) => this.handleEngineConfigUpdate("sourceEmail", e.target.value, "notifications")}
                            />
                            {errorMsgs.sourceEmail && <span className="help-block">{errorMsgs.sourceEmail}</span>}
                        </div>
                    </div>

                    <div className={getClassNames("destEmail", errorMsgs)}>
                        <label className="col-md-4 control-label">Recipient E-Mail Addresses</label>
                        <div className="col-md-6">
                            <div style={{width: "300px"}}>
                                <MultiRowTextBox values={notificationsConfig.destEmail.value}
                                                 itemType={"Address"}
                                                 rowLimit={3}
                                                 handleValueUpdate={this.handleRecipientAddressUpdate}
                                                 handleValueDelete={this.handleRecipientAddressDelete}/>
                                {errorMsgs.destEmail && <span className="help-block">{errorMsgs.destEmail}</span>}
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        )
    }
}

WizardEngineStep.propTypes = {
    stepName: React.PropTypes.string.isRequired,
    heSetupModel: React.PropTypes.object.isRequired
};

export default WizardEngineStep