import React, { Component } from 'react'
import classNames from 'classnames'
import MultiRowTextBox from './MultiRowTextBox'

class WizardEngineStep extends Component {
    constructor(props) {
        super(props);
        this.state = {
            heSetupModel: props.heSetupModel,
            errorMsg: "",
            errorMsgs: {}
        };

        this.handleEngineConfigUpdate = this.handleEngineConfigUpdate.bind(this);
        this.handleRecipientAddressDelete = this.handleRecipientAddressDelete.bind(this);
        this.handleRecipientAddressUpdate = this.handleRecipientAddressUpdate.bind(this);
        this.validate = this.validate.bind(this);
    }

    handleEngineConfigUpdate(property, value, configType) {
        const heSetupModel = this.state.heSetupModel;
        const errorMsgs= this.state.errorMsgs;

        heSetupModel[configType][property].value = value;
        this.setState({ heSetupModel, errorMsgs });
    }

    handleRecipientAddressDelete(index) {
        const addresses = this.state.notificationsConfig.destEmail.value;
        addresses.splice(index, 1);
        this.setState({ addresses, errorMsgs: {} });
    }

    handleRecipientAddressUpdate(index, address) {
        const addresses = this.state.notificationsConfig.destEmail.value;
        addresses[index] = address;
        const errorMsgs= this.state.errorMsgs;
        this.setState({ addresses, errorMsgs });
    }

    validate () {
        return true
    }

    shouldComponentUpdate(nextProps, nextState){
        if(!this.props.validating && nextProps.validating){
            this.props.validationCallBack(this.validate())
        }
        return true;
    }

    render() {
        const hostClass = classNames(
            "form-group",
            { "has-error": this.errorMsg && this.errorMsg.length > 0 }
        );

        const engineConfig = this.state.heSetupModel.engine;
        const notificationsConfig = this.state.heSetupModel.notifications

        return (
            <div>
                {this.state.errorMsg &&
                    <div className="alert alert-danger">
                        <span className="pficon pficon-error-circle-o"></span>
                        <strong>{this.state.errorMsg}</strong>
                    </div>
                }
                <form className="form-horizontal he-form-container">
                    <div className={hostClass}>
                        <label className="col-md-4 control-label">Host Identifier</label>
                        <div className="col-md-4">
                            <input type="text"
                                   title="Enter the host identifier."
                                   className="form-control"
                                   value={engineConfig.hostIdentifier.value}
                                   onChange={(e) => this.handleEngineConfigUpdate("hostIdentifier", e.target.value, "engine")}
                            />
                            {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                        </div>
                    </div>

                    <div className={hostClass}>
                        <label className="col-md-4 control-label">Admin Username</label>
                        <div className="col-md-4">
                            <input type="text"
                                   title="Enter the admin username."
                                   className="form-control"
                                   value={engineConfig.adminUsername.value}
                                   onChange={(e) => this.handleEngineConfigUpdate("adminUsername", e.target.value, "engine")}
                            />
                            {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                        </div>
                    </div>

                    <div className={hostClass}>
                        <label className="col-md-4 control-label">Admin Portal Password</label>
                        <div className="col-md-4">
                            <input type="password"
                                   title="Enter the admin portal password."
                                   className="form-control"
                                   onChange={(e) => this.handleEngineConfigUpdate("adminPortalPassword", e.target.value, "engine")}
                            />
                            {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                        </div>
                    </div>

                    <div className={hostClass}>
                        <label className="col-md-4 control-label">Confirm Admin Portal Password</label>
                        <div className="col-md-4">
                            <input type="password"
                                   title="Confirm the admin portal password."
                                   className="form-control"
                            />
                            {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="col-md-9 he-stage-header">
                            <h3>Notification Server Settings</h3>
                        </div>
                    </div>

                    <div className={hostClass}>
                        <label className="col-md-4 control-label">SMTP Server IP Address</label>
                        <div className="col-md-4">
                            <input type="text"
                                   title="Enter the SMTP server address."
                                   className="form-control"
                                   value={notificationsConfig.smtpServer.value}
                                   onChange={(e) => this.handleEngineConfigUpdate("smtpServer", e.target.value, "notifications")}
                            />
                            {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                        </div>
                    </div>

                    <div className={hostClass}>
                        <label className="col-md-4 control-label">SMTP Server Port Number</label>
                        <div className="col-md-2">
                            <input type="text"
                                   title="Enter the SMTP port number."
                                   className="form-control"
                                   value={notificationsConfig.smtpPort.value}
                                   onChange={(e) => this.handleEngineConfigUpdate("smtpPort", e.target.value, "notifications")}
                            />
                            {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                        </div>
                    </div>

                    <div className={hostClass}>
                        <label className="col-md-4 control-label">SMTP Sender E-Mail Address</label>
                        <div className="col-md-4">
                            <input type="text"
                                   title="Enter the email address from which notifications should be sent."
                                   className="form-control"
                                   value={notificationsConfig.sourceEmail.value}
                                   onChange={(e) => this.handleEngineConfigUpdate("sourceEmail", e.target.value, "notifications")}
                            />
                            {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                        </div>
                    </div>

                    <div className={hostClass}>
                        <label className="col-md-4 control-label">SMTP Recipient E-Mail Addresses</label>
                        <div className="col-md-4">
                            <MultiRowTextBox values={notificationsConfig.destEmail.value}
                                             itemType={"Address"}
                                             rowLimit={3}
                                             handleValueUpdate={this.handleRecipientAddressUpdate}
                                             handleValueDelete={this.handleRecipientAddressDelete}/>
                            {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
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