import React, { Component } from 'react'
import Selectbox from '../common/Selectbox'
import { getClassNames } from '../../helpers/HostedEngineSetupUtil'
import { getErrorMsgForProperty, validatePropsForUiStage } from "./Validation";
import { messages } from './constants';

const storageTypes = [
    { key: "nfs3", title: "NFS3" },
    { key: "nfs4", title: "NFS4" },
    { key: "iscsi", title: "iSCSI" },
    { key: "fc", title: "Fiber Channel"},
    { key: "glusterfs", title: "Gluster" }
];

const nfsAnsFileFields = ["storagePath", "storageDomain"];

const requiredNfsFields = nfsAnsFileFields;

const iscsiAnsFileFields = [
    "iSCSIPortalUser", "iSCSIPortalIPAddress", "iSCSIPortalPort",
    "iSCSITargetName", "LunID"
];

const requiredIscsiFields = [
    "iSCSIPortalIPAddress", "iSCSIPortalPort",
    "iSCSITargetName", "LunID"
];

const glusterAnsFileFields = ["storageDomainConnection"];

const requiredGlusterFields = glusterAnsFileFields;

const glusterAndNfsAnsFileFields = ["mntOptions"];

const fieldProps = ["showInReview", "useInAnswerFile"];

class WizardStorageStep extends Component {

    constructor(props) {
        super(props);
        this.state = {
            model: props.model,
            heSetupModel: props.model.model,
            storageConfig: props.model.model.storage,
            errorMsg: "",
            errorMsgs: {}
        };

        this.handleStorageConfigUpdate = this.handleStorageConfigUpdate.bind(this);
        this.setStorageTypeDisplaySettings = this.setStorageTypeDisplaySettings.bind(this);
        this.validateConfigUpdate = this.validateConfigUpdate.bind(this);
        this.validateAllInputs = this.validateAllInputs.bind(this);
    }

    handleStorageConfigUpdate(propName, value) {
        const storageConfig = this.state.storageConfig;
        storageConfig[propName].value = value;
        this.setState({ storageConfig });

        if (propName === "domainType") {
            this.setStorageTypeDisplaySettings(value);
        } else {
            this.validateConfigUpdate(propName);
        }
    }

    setStorageTypeDisplaySettings(storageType) {
        const model = this.state.model;

        let isNfs = storageType === "nfs3" || storageType === "nfs4";
        let isIscsi = storageType === "iscsi";
        let isGluster = storageType === "glusterfs";

        model.setBooleanValues(nfsAnsFileFields, fieldProps, isNfs);
        model.setBooleanValues(requiredNfsFields, ["required"], isNfs);

        model.setBooleanValues(iscsiAnsFileFields, fieldProps, isIscsi);
        model.setBooleanValues(requiredIscsiFields, ["required"], isIscsi);

        model.setBooleanValues(glusterAnsFileFields, fieldProps, isGluster);
        model.setBooleanValues(requiredGlusterFields, ["required"], isGluster);

        model.setBooleanValues(glusterAndNfsAnsFileFields, fieldProps, isNfs || isGluster);
    }

    validateConfigUpdate(propName) {
        const config = this.state.storageConfig;
        let errorMsg = this.state.errorMsg;
        const errorMsgs = {};
        const prop = config[propName];
        const propErrorMsg = getErrorMsgForProperty(prop);

        if (propErrorMsg !== "") {
            errorMsgs[propName] = propErrorMsg;
        } else {
            errorMsg = "";
        }

        this.setState({ errorMsg, errorMsgs });
    }

    validateAllInputs() {
        let errorMsg = "";
        let errorMsgs = {};
        let propsAreValid = validatePropsForUiStage("Storage", this.state.heSetupModel, errorMsgs);

        if (!propsAreValid) {
            errorMsg = messages.GENERAL_ERROR_MSG;
        }

        this.setState({ errorMsg, errorMsgs });
        return propsAreValid;
    }

    shouldComponentUpdate(nextProps, nextState){
        if(!this.props.validating && nextProps.validating){
            this.props.validationCallBack(this.validateAllInputs())
        }
        return true;
    }

    render() {
        const config = this.state.storageConfig;
        const errorMsgs = this.state.errorMsgs;

        let nfsSelected = config.domainType.value === "nfs3" || config.domainType.value === "nfs4";
        let iscsiSelected = config.domainType.value === "iscsi";
        let glusterSelected = config.domainType.value === "glusterfs";

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

                    <div className="form-group">
                        <label className="col-md-3 control-label">Storage Type</label>
                        <div className="col-md-6">
                            <div style={{width: "120px"}}>
                                <Selectbox optionList={storageTypes}
                                    selectedOption={this.state.storageConfig.domainType.value}
                                    callBack={(e) => this.handleStorageConfigUpdate("domainType", e)}
                                    />
                            </div>
                        </div>
                    </div>

                    <div style={nfsSelected ? {} : { display: 'none' }}>
                        <div className={getClassNames("storagePath", errorMsgs)}>
                            <label className="col-md-3 control-label">Storage Path</label>
                            <div className="col-md-6">
                                <input type="text" style={{width: "300px"}}
                                       placeholder="host:/path"
                                       title="Enter the path for the shared storage you wish to use."
                                       className="form-control"
                                       value={this.state.storageConfig.storagePath.value}
                                       onChange={(e) => this.handleStorageConfigUpdate("storagePath", e.target.value)}
                                        />
                                {errorMsgs.storagePath && <span className="help-block">{errorMsgs.storagePath}</span>}
                            </div>
                        </div>

                        <div className={getClassNames("storageDomain", errorMsgs)}>
                            <label className="col-md-3 control-label">Storage Domain</label>
                            <div className="col-md-6">
                                <input type="text" style={{width: "250px"}}
                                       title=""
                                       className="form-control"
                                       value={this.state.storageConfig.storageDomain.value}
                                       onChange={(e) => this.handleStorageConfigUpdate("storageDomain", e.target.value)}
                                        />
                                {errorMsgs.storageDomain && <span className="help-block">{errorMsgs.storageDomain}</span>}
                            </div>
                        </div>
                    </div>

                    <div style={iscsiSelected ? {} : {display: 'none'}}>
                        <div className={getClassNames("iSCSIPortalUser", errorMsgs)}>
                            <label className="col-md-3 control-label">Portal User</label>
                            <div className="col-md-6">
                                <input type="text" style={{width: "250px"}}
                                       title="Enter the user for the iSCSI portal you wish to use."
                                       className="form-control"
                                       value={this.state.storageConfig.iSCSIPortalUser.value}
                                       onChange={(e) => this.handleStorageConfigUpdate("iSCSIPortalUser", e.target.value)}
                                />
                                {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                            </div>
                        </div>

                        <div className={getClassNames("iSCSIPortalIPAddress", errorMsgs)}>
                            <label className="col-md-3 control-label">Portal IP Address</label>
                            <div className="col-md-6">
                                <input type="text" style={{width: "110px"}}
                                       title="Enter the IP address for the iSCSI portal you wish to use."
                                       className="form-control"
                                       value={this.state.storageConfig.iSCSIPortalIPAddress.value}
                                       onChange={(e) => this.handleStorageConfigUpdate("iSCSIPortalIPAddress", e.target.value)}
                                />
                                {errorMsgs.iSCSIPortalIPAddress && <span className="help-block">{errorMsgs.iSCSIPortalIPAddress}</span>}
                            </div>
                        </div>

                        <div className={getClassNames("iSCSIPortalPort", errorMsgs)}>
                            <label className="col-md-3 control-label">Portal Port</label>
                            <div className="col-md-6">
                                <input type="number" style={{width: "75px"}}
                                       placeholder="3260"
                                       title="Enter the port for the iSCSI portal you wish to use."
                                       className="form-control"
                                       value={this.state.storageConfig.iSCSIPortalPort.value}
                                       onChange={(e) => this.handleStorageConfigUpdate("iSCSIPortalPort", e.target.value)}
                                />
                                {errorMsgs.iSCSIPortalPort && <span className="help-block">{errorMsgs.iSCSIPortalPort}</span>}
                            </div>
                        </div>

                        <div className={getClassNames("iSCSITargetName", errorMsgs)}>
                            <label className="col-md-3 control-label">Target Name</label>
                            <div className="col-md-6">
                                <input type="text" style={{width: "250px"}}
                                       title="Enter the iSCSI target name."
                                       className="form-control"
                                       value={this.state.storageConfig.iSCSITargetName.value}
                                       onChange={(e) => this.handleStorageConfigUpdate("iSCSITargetName", e.target.value)}
                                />
                                {errorMsgs.iSCSITargetName && <span className="help-block">{errorMsgs.iSCSITargetName}</span>}
                            </div>
                        </div>

                        <div className={getClassNames("LunID", errorMsgs)}>
                            <label className="col-md-3 control-label">Destination LUN</label>
                            <div className="col-md-6">
                                <input type="text" style={{width: "250px"}}
                                       title="Enter the iSCSI target name."
                                       className="form-control"
                                       value={this.state.storageConfig.LunID.value}
                                       onChange={(e) => this.handleStorageConfigUpdate("LunID", e.target.value)}
                                />
                                {errorMsgs.LunID && <span className="help-block">{errorMsgs.LunID}</span>}
                            </div>
                        </div>
                    </div>

                    <div style={glusterSelected ? {} : {display: 'none'}}>
                        <div className={getClassNames("storageDomainConnection", errorMsgs)}>
                            <label className="col-md-3 control-label">Storage Connection</label>
                            <div className="col-md-6">
                                <input type="text" style={{width: "250px"}}
                                       placeholder="host:/path"
                                       title="Enter the path for the shared storage you wish to use."
                                       className="form-control"
                                       value={this.state.storageConfig.storageDomainConnection.value}
                                       onChange={(e) => this.handleStorageConfigUpdate("storageDomainConnection", e.target.value)}
                                />
                                {errorMsgs.storageDomainConnection && <span className="help-block">{errorMsgs.storageDomainConnection}</span>}
                            </div>
                        </div>
                    </div>

                    <div style={(nfsSelected || glusterSelected) ? {} : {display: 'none'}}>
                        <div className={getClassNames("mntOptions", errorMsgs)}>
                            <label className="col-md-3 control-label">Mount Options</label>
                            <div className="col-md-6">
                                <input type="text" style={{width: "250px"}}
                                       title=""
                                       className="form-control"
                                       value={this.state.storageConfig.mntOptions.value}
                                       onChange={(e) => this.handleStorageConfigUpdate("mntOptions", e.target.value)}
                                />
                                {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        )
    }
}

WizardStorageStep.propTypes = {
    stepName: React.PropTypes.string.isRequired,
    model: React.PropTypes.object.isRequired
};

export default WizardStorageStep