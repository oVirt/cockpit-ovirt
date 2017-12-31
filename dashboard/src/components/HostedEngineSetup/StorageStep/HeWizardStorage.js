import React from 'react'
import Selectbox from '../../common/Selectbox'
import { getClassNames } from '../../../helpers/HostedEngineSetupUtil'

const storageTypes = [
    { key: "nfs3", title: "NFS3" },
    { key: "nfs4", title: "NFS4" },
    { key: "iscsi", title: "iSCSI" },
    { key: "fc", title: "Fiber Channel"},
    { key: "glusterfs", title: "Gluster" }
];

const HeWizardStorage = ({errorMsg, errorMsgs, handleStorageConfigUpdate, storageConfig}) => {
    let nfsSelected = storageConfig.domainType.value === "nfs3" || storageConfig.domainType.value === "nfs4";
    let iscsiSelected = storageConfig.domainType.value === "iscsi";
    let glusterSelected = storageConfig.domainType.value === "glusterfs";

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

                <div className="form-group">
                    <label className="col-md-3 control-label">Storage Type</label>
                    <div className="col-md-6">
                        <div style={{width: "120px"}}>
                            <Selectbox optionList={storageTypes}
                                       selectedOption={storageConfig.domainType.value}
                                       callBack={(e) => handleStorageConfigUpdate("domainType", e)}
                            />
                        </div>
                    </div>
                </div>

                <div style={nfsSelected ? {} : { display: 'none' }}>
                    <div className={getClassNames("storageDomain", errorMsgs)}>
                        <label className="col-md-3 control-label">Storage Domain Name</label>
                        <div className="col-md-6">
                            <input type="text" style={{width: "250px"}}
                                   title=""
                                   className="form-control"
                                   value={storageConfig.storageDomain.value}
                                   onChange={(e) => handleStorageConfigUpdate("storageDomain", e.target.value)}
                            />
                            {errorMsgs.storageDomain &&
                                <span className="help-block">{errorMsgs.storageDomain}</span>
                            }
                        </div>
                    </div>
                </div>

                <div style={iscsiSelected ? {} : {display: 'none'}}>
                    <div className={getClassNames("iSCSIPortalUser", errorMsgs)}>
                        <label className="col-md-3 control-label">Portal User</label>
                        <div className="col-md-6">
                            <input type="text" style={{width: "150px"}}
                                   title="Enter the user for the iSCSI portal you wish to use."
                                   className="form-control"
                                   value={storageConfig.iSCSIPortalUser.value}
                                   onChange={(e) => handleStorageConfigUpdate("iSCSIPortalUser", e.target.value)}
                            />
                            {errorMsgs.iSCSIPortalUser &&
                                <span className="help-block">{errorMsgs.iSCSIPortalUser}</span>
                            }
                        </div>
                    </div>

                    <div className={getClassNames("iSCSIPortalPassword", errorMsgs)}>
                        <label className="col-md-3 control-label">Portal Password</label>
                        <div className="col-md-6">
                            <input type="password" style={{width: "150px"}}
                                   title="Enter the user for the iSCSI portal you wish to use."
                                   className="form-control"
                                   value={storageConfig.iSCSIPortalPassword.value}
                                   onChange={(e) => handleStorageConfigUpdate("iSCSIPortalPassword", e.target.value)}
                            />
                            {errorMsgs.iSCSIPortalPassword &&
                                <span className="help-block">{errorMsgs.iSCSIPortalPassword}</span>
                            }
                        </div>
                    </div>

                    <div className={getClassNames("iSCSIPortalIPAddress", errorMsgs)}>
                        <label className="col-md-3 control-label">Portal IP Address</label>
                        <div className="col-md-6">
                            <input type="text" style={{width: "110px"}}
                                   title="Enter the IP address for the iSCSI portal you wish to use."
                                   className="form-control"
                                   value={storageConfig.iSCSIPortalIPAddress.value}
                                   onChange={(e) => handleStorageConfigUpdate("iSCSIPortalIPAddress", e.target.value)}
                            />
                            {errorMsgs.iSCSIPortalIPAddress &&
                                <span className="help-block">{errorMsgs.iSCSIPortalIPAddress}</span>
                            }
                        </div>
                    </div>

                    <div className={getClassNames("iSCSIPortalPort", errorMsgs)}>
                        <label className="col-md-3 control-label">Portal Port</label>
                        <div className="col-md-6">
                            <input type="number" style={{width: "75px"}}
                                   placeholder="3260"
                                   title="Enter the port for the iSCSI portal you wish to use."
                                   className="form-control"
                                   value={storageConfig.iSCSIPortalPort.value}
                                   onChange={(e) => handleStorageConfigUpdate("iSCSIPortalPort", e.target.value)}
                            />
                            {errorMsgs.iSCSIPortalPort &&
                                <span className="help-block">{errorMsgs.iSCSIPortalPort}</span>
                            }
                        </div>
                    </div>

                    <div className={getClassNames("iSCSITargetName", errorMsgs)}>
                        <label className="col-md-3 control-label">Target Name</label>
                        <div className="col-md-6">
                            <input type="text" style={{width: "250px"}}
                                   title="Enter the iSCSI target name."
                                   className="form-control"
                                   value={storageConfig.iSCSITargetName.value}
                                   onChange={(e) => handleStorageConfigUpdate("iSCSITargetName", e.target.value)}
                            />
                            {errorMsgs.iSCSITargetName &&
                                <span className="help-block">{errorMsgs.iSCSITargetName}</span>
                            }
                        </div>
                    </div>

                    <div className={getClassNames("LunID", errorMsgs)}>
                        <label className="col-md-3 control-label">Destination LUN</label>
                        <div className="col-md-6">
                            <input type="text" style={{width: "250px"}}
                                   title="Enter the iSCSI target name."
                                   className="form-control"
                                   value={storageConfig.LunID.value}
                                   onChange={(e) => handleStorageConfigUpdate("LunID", e.target.value)}
                            />
                            {errorMsgs.LunID &&
                                <span className="help-block">{errorMsgs.LunID}</span>
                            }
                        </div>
                    </div>
                </div>

                <div style={(nfsSelected || glusterSelected) ? {} : {display: 'none'}}>
                    <div className={getClassNames("storageDomainConnection", errorMsgs)}>
                        <label className="col-md-3 control-label">Storage Connection</label>
                        <div className="col-md-6">
                            <input type="text" style={{width: "250px"}}
                                   placeholder="host:/path"
                                   title="Enter the path for the shared storage you wish to use."
                                   className="form-control"
                                   value={storageConfig.storageDomainConnection.value}
                                   onChange={(e) => handleStorageConfigUpdate("storageDomainConnection", e.target.value)}
                            />
                            {errorMsgs.storageDomainConnection &&
                                <span className="help-block">{errorMsgs.storageDomainConnection}</span>
                            }
                        </div>
                    </div>

                    <div className={getClassNames("mntOptions", errorMsgs)}>
                        <label className="col-md-3 control-label">Mount Options</label>
                        <div className="col-md-6">
                            <input type="text" style={{width: "250px"}}
                                   title=""
                                   className="form-control"
                                   value={storageConfig.mntOptions.value}
                                   onChange={(e) => handleStorageConfigUpdate("mntOptions", e.target.value)}
                            />
                            {errorMsgs.mntOptions &&
                                <span className="help-block">{errorMsgs.mntOptions}</span>
                            }
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
};

export default HeWizardStorage;