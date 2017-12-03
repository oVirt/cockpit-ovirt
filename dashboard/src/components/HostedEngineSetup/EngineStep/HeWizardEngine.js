import React from 'react'
import MultiRowTextBoxContainer from '../MultiRowTextBox/MultiRoxTextBoxContainer'
import { getClassNames } from '../../../helpers/HostedEngineSetupUtil'

const HeWizardEngine = ({heSetupModel, errorMsg, errorMsgs, handleEngineConfigUpdate, handleRecipientAddressUpdate, handleRecipientAddressDelete}) => {
    const engineConfig = heSetupModel.engine;
    const notificationsConfig = heSetupModel.notifications;

    return (
        <div>
            <form className="form-horizontal he-form-container">
                {errorMsg &&
                <div className="row" style={{marginLeft: "40px"}}>
                    <div className="alert alert-danger col-sm-8">
                        <span className="pficon pficon-error-circle-o" />
                        <strong>{errorMsg}</strong>
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
                               onChange={(e) => handleEngineConfigUpdate("hostIdentifier", e.target.value, "engine")}
                        />
                        {errorMsg && errorMsg.length > 0 && <span className="help-block">{errorMsg}</span>}
                    </div>
                </div>

                <div className={getClassNames("adminUsername", errorMsgs)}>
                    <label className="col-md-4 control-label">Admin Username</label>
                    <div className="col-md-6">
                        <input type="text" style={{width: "140px"}}
                               title="Enter the admin username."
                               className="form-control"
                               value={engineConfig.adminUsername.value}
                               onChange={(e) => handleEngineConfigUpdate("adminUsername", e.target.value, "engine")}
                        />
                        {errorMsg && errorMsg.length > 0 && <span className="help-block">{errorMsg}</span>}
                    </div>
                </div>

                <div className={getClassNames("adminPassword", errorMsgs)}>
                    <label className="col-md-4 control-label">Admin Portal Password</label>
                    <div className="col-md-6">
                        <input type="password" style={{width: "140px"}}
                               title="Enter the admin portal password."
                               className="form-control"
                               value={engineConfig.adminPassword.value}
                               onChange={(e) => handleEngineConfigUpdate("adminPassword", e.target.value, "engine")}
                        />
                        {errorMsg && errorMsg.length > 0 && <span className="help-block">{errorMsg}</span>}
                    </div>
                </div>

                <div className={getClassNames("confirmAdminPortalPassword", errorMsgs)}
                     style={engineConfig.adminPassword.value !== "" ? {} : {display: 'none'}}>
                    <label className="col-md-4 control-label">Confirm Password</label>
                    <div className="col-md-6">
                        <input type="password" style={{width: "140px"}}
                               title="Confirm the admin portal password."
                               className="form-control"
                               value={engineConfig.confirmAdminPortalPassword.value}
                               onChange={(e) => handleEngineConfigUpdate("confirmAdminPortalPassword", e.target.value, "engine")}
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
                               onChange={(e) => handleEngineConfigUpdate("smtpServer", e.target.value, "notifications")}
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
                               onChange={(e) => handleEngineConfigUpdate("smtpPort", e.target.value, "notifications")}
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
                               onChange={(e) => handleEngineConfigUpdate("sourceEmail", e.target.value, "notifications")}
                        />
                        {errorMsgs.sourceEmail && <span className="help-block">{errorMsgs.sourceEmail}</span>}
                    </div>
                </div>

                <div className={getClassNames("destEmail", errorMsgs)}>
                    <label className="col-md-4 control-label">Recipient E-Mail Addresses</label>
                    <div className="col-md-6">
                        <div style={{width: "300px"}}>
                            <MultiRowTextBoxContainer values={notificationsConfig.destEmail.value}
                                             itemType={"Address"}
                                             rowLimit={3}
                                             handleValueUpdate={handleRecipientAddressUpdate}
                                             handleValueDelete={handleRecipientAddressDelete}/>
                            {errorMsgs.destEmail && <span className="help-block">{errorMsgs.destEmail}</span>}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
};

export default HeWizardEngine;