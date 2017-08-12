import React, { Component } from 'react'
import Selectbox from '../common/Selectbox'
import classNames from 'classnames'

const storageTypes = [
    { key: "nfs3", title: "NFS3" },
    { key: "nfs4", title: "NFS4" },
    { key: "iscsi", title: "iSCSI" },
    { key: "fc", title: "Fiber Channel"},
    { key: "glusterfs", title: "Gluster" }
];

class WizardStorageStep extends Component {

    constructor(props) {
        super(props);
        this.state = {
            storageConfig: props.heSetupModel.storage,
            errorMsg: "",
            errorMsgs: {},
            storageType: "nfs3"
        };

        this.handleStorageConfigUpdate = this.handleStorageConfigUpdate.bind(this);
        this.setStorageTypeDisplaySettings = this.setStorageTypeDisplaySettings.bind(this);
    }

    handleStorageConfigUpdate(property, value) {
        const storageConfig = this.state.storageConfig;
        storageConfig[property].value = value;
        const errorMsgs= this.state.errorMsgs;

        const isStorageTypeUpdate = property === "domainType";
        let storageType = this.state.storageType;
        if (isStorageTypeUpdate) {
            this.setStorageTypeDisplaySettings(value);
            storageType = value;
        }

        this.setState({ storageConfig, errorMsgs, storageType })
    }

    setStorageTypeDisplaySettings(storageType) {
        const storageConfig = this.state.storageConfig;

        // NFS Properties
        let isNfs = storageType === "nfs3" || storageType === "nfs4";
        storageConfig.storagePath.showInReview = isNfs;
        storageConfig.storageDomain.showInReview = isNfs;

        storageConfig.storagePath.useInAnswerFile = isNfs;
        storageConfig.storageDomain.useInAnswerFile = isNfs;

        // iSCSI Properties
        let isIscsi = storageType === "iscsi";
        storageConfig.iSCSIPortalIPAddress.showInReview = isIscsi;
        storageConfig.iSCSIPortalPort.showInReview = isIscsi;
        storageConfig.iSCSITargetName.showInReview = isIscsi;
        storageConfig.iSCSIPortalUser.showInReview = isIscsi;
        storageConfig.LunID.showInReview = isIscsi;

        storageConfig.iSCSIPortalIPAddress.useInAnswerFile = isIscsi;
        storageConfig.iSCSIPortalPort.useInAnswerFile = isIscsi;
        storageConfig.iSCSITargetName.useInAnswerFile = isIscsi;
        storageConfig.iSCSIPortalUser.useInAnswerFile = isIscsi;
        storageConfig.LunID.useInAnswerFile = isIscsi;

        // GlusterFS Properties
        let isGluster = storageType === "glusterfs";
        storageConfig.storageDomainConnection.showInReview = isGluster;
        storageConfig.storageDomainConnection.useInAnswerFile = isGluster;

        // Shared Properties
        storageConfig.mntOptions.showInReview = isNfs || isGluster;
        storageConfig.mntOptions.useInAnswerFile = isNfs || isGluster;
    }

    validate() {
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

        return (
            <div>
                {this.state.errorMsg && <div className="alert alert-danger">
                    <span className="pficon pficon-error-circle-o"></span>
                    <strong>{this.state.errorMsg}</strong>
                </div>
                }
                <form className="form-horizontal he-form-container">
                    <div className="form-group">
                        <label className="col-md-3 control-label">Storage Type</label>
                        <div className="col-md-3">
                            <Selectbox optionList={storageTypes}
                                selectedOption={this.state.storageConfig.domainType.value}
                                callBack={(e) => this.handleStorageConfigUpdate("domainType", e)}
                                />
                        </div>
                    </div>

                    <div style={(this.state.storageType === "nfs3" || this.state.storageType === "nfs4") ? {} : { display: 'none' }}>
                        <div className={hostClass}>
                            <label className="col-md-3 control-label">Storage Path</label>
                            <div className="col-md-4">
                                <input type="text" placeholder="host:/path"
                                       title="Enter the path for the shared storage you wish to use."
                                       className="form-control"
                                       value={this.state.storageConfig.storagePath.value}
                                       onChange={(e) => this.handleStorageConfigUpdate("storagePath", e.target.value)}
                                        />
                                {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                            </div>
                        </div>

                        <div className={hostClass}>
                            <label className="col-md-3 control-label">Storage Domain</label>
                            <div className="col-md-4">
                                <input type="text"
                                       title=""
                                       className="form-control"
                                       value={this.state.storageConfig.storageDomain.value}
                                       onChange={(e) => this.handleStorageConfigUpdate("storageDomain", e.target.value)}
                                        />
                                {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                            </div>
                        </div>

                        <div className={hostClass}>
                            <label className="col-md-3 control-label">Mount Options</label>
                            <div className="col-md-4">
                                <input type="text"
                                       title=""
                                       className="form-control"
                                       value={this.state.storageConfig.mntOptions.value}
                                       onChange={(e) => this.handleStorageConfigUpdate("mntOptions", e.target.value)}
                                />
                                {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                            </div>
                        </div>
                    </div>

                    <div style={this.state.storageType === "iscsi" ? {} : { display: 'none' }}>
                        <div className={hostClass}>
                            <label className="col-md-3 control-label">Portal User</label>
                            <div className="col-md-4">
                                <input type="text"
                                       title="Enter the user for the iSCSI portal you wish to use."
                                       className="form-control"
                                       value={this.state.storageConfig.iSCSIPortalUser.value}
                                       onChange={(e) => this.handleStorageConfigUpdate("iSCSIPortalUser", e.target.value)}
                                />
                                {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                            </div>
                        </div>

                        <div className={hostClass}>
                            <label className="col-md-3 control-label">Portal IP Address</label>
                            <div className="col-md-4">
                                <input type="text"
                                       title="Enter the IP address for the iSCSI portal you wish to use."
                                       className="form-control"
                                       value={this.state.storageConfig.iSCSIPortalIPAddress.value}
                                       onChange={(e) => this.handleStorageConfigUpdate("iSCSIPortalIPAddress", e.target.value)}
                                />
                                {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                            </div>
                        </div>

                        <div className={hostClass}>
                            <label className="col-md-3 control-label">Portal Port</label>
                            <div className="col-md-4">
                                <input type="text"
                                       title="Enter the port for the iSCSI portal you wish to use."
                                       className="form-control"
                                       value={this.state.storageConfig.iSCSIPortalPort.value}
                                       onChange={(e) => this.handleStorageConfigUpdate("iSCSIPortalPort", e.target.value)}
                                />
                                {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                            </div>
                        </div>

                        <div className={hostClass}>
                            <label className="col-md-3 control-label">Target Name</label>
                            <div className="col-md-4">
                                <input type="text"
                                       title="Enter the iSCSI target name."
                                       className="form-control"
                                       value={this.state.storageConfig.iSCSITargetName.value}
                                       onChange={(e) => this.handleStorageConfigUpdate("iSCSITargetName", e.target.value)}
                                />
                                {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                            </div>
                        </div>

                        <div className={hostClass}>
                            <label className="col-md-3 control-label">Destination LUN</label>
                            <div className="col-md-4">
                                <input type="text"
                                       title="Enter the iSCSI target name."
                                       className="form-control"
                                       value={this.state.storageConfig.LunID.value}
                                       onChange={(e) => this.handleStorageConfigUpdate("LunID", e.target.value)}
                                />
                                {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                            </div>
                        </div>
                    </div>

                    <div style={this.state.storageType === "glusterfs" ? {} : { display: 'none' }}>
                        <div className={hostClass}>
                            <label className="col-md-3 control-label">Storage Connection</label>
                            <div className="col-md-4">
                                <input type="text" placeholder="host:/path"
                                       title="Enter the path for the shared storage you wish to use."
                                       className="form-control"
                                       value={this.state.storageConfig.storageDomainConnection.value}
                                       onChange={(e) => this.handleStorageConfigUpdate("storageDomainConnection", e.target.value)}
                                />
                                {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
                            </div>
                        </div>

                        <div className={hostClass}>
                            <label className="col-md-3 control-label">Mount Options</label>
                            <div className="col-md-4">
                                <input type="text"
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
    heSetupModel: React.PropTypes.object.isRequired
};

export default WizardStorageStep