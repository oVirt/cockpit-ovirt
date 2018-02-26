import React from 'react'
import Selectbox from '../../common/Selectbox'
import { getClassNames } from '../../../helpers/HostedEngineSetupUtil'
import { deploymentTypes, messages, status } from "../constants";
import TargetListContainer from "./iSCSI/TargetList/TargetListContainer";
import LunListContainer from "./iSCSI/LunList/LunListContainer";

const storageTypes = [
    { key: "nfs", title: "NFS" },
    { key: "iscsi", title: "iSCSI" },
    { key: "fc", title: "Fiber Channel"},
    { key: "glusterfs", title: "Gluster" }
];

const nfsVersions = [
    { key: "3", title: "v3" },
    { key: "4", title: "v4" }
];

const HeWizardStorage = ({collapsibleSections, deploymentType, errorMsg, errorMsgs, handleCollapsibleSectionChange,
                             handleIscsiTargetRequest, handleStorageConfigUpdate, handleLunSelection,
                             handleTargetSelection, iscsiLunData, iscsiTargetData, lunRetrievalStatus,
                             selectedIscsiTarget, selectedLun, storageConfig, targetRetrievalStatus}) => {
    const nfsSelected = storageConfig.domainType.value.includes("nfs");
    const iscsiSelected = storageConfig.domainType.value === "iscsi";
    const glusterSelected = storageConfig.domainType.value === "glusterfs";
    const isOtopiDeployment = deploymentType === deploymentTypes.OTOPI_DEPLOYMENT;
    const isAnsibleDeployment = deploymentType === deploymentTypes.ANSIBLE_DEPLOYMENT;
    let targetRetrievalBtnClasses = "btn btn-primary";
    targetRetrievalBtnClasses += targetRetrievalStatus === status.POLLING ? " disabled" : "";

    let advancedSectionIconClasses = "pficon fas he-wizard-collapsible-section-icon ";
    advancedSectionIconClasses += collapsibleSections["advanced"] ? "fa-angle-right" : "fa-angle-down";
    const advancedSectionClasses = collapsibleSections["advanced"] ? "collapse" : "";

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

                {targetRetrievalStatus === status.FAILURE &&
                    <div className="row" style={{marginLeft: "40px"}}>
                        <div className="alert alert-danger col-sm-8">
                            <span className="pficon pficon-error-circle-o" />
                            <strong>{ messages.TARGET_RETRIEVAL_FAILED }</strong>
                        </div>
                    </div>
                }

                {lunRetrievalStatus === status.FAILURE &&
                    <div className="row" style={{marginLeft: "40px"}}>
                        <div className="alert alert-danger col-sm-8">
                            <span className="pficon pficon-error-circle-o" />
                            <strong>{ messages.LUN_RETRIEVAL_FAILED }</strong>
                        </div>
                    </div>
                }

                <div className="form-group">
                    <div className="col-md-9">
                        {/*<span className="pficon fas fa-angle-down" />*/}
                        <h3>Storage Settings</h3>
                    </div>
                </div>

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

                <div style={iscsiSelected ? {} : {display: 'none'}}>
                    <div className={getClassNames("iSCSIPortalUser", errorMsgs)}>
                        <label className="col-md-3 control-label">Portal Username</label>
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

                    {isAnsibleDeployment &&
                        <div className={getClassNames("iSCSIDiscoverUser", errorMsgs)}>
                            <label className="col-md-3 control-label">Discovery Username</label>
                            <div className="col-md-6">
                                <input type="text" style={{width: "150px"}}
                                       title="Enter the user for the iSCSI portal you wish to use."
                                       className="form-control"
                                       value={storageConfig.iSCSIDiscoverUser.value}
                                       onChange={(e) => handleStorageConfigUpdate("iSCSIDiscoverUser", e.target.value)}
                                />
                                {errorMsgs.iSCSIDiscoverUser &&
                                    <span className="help-block">{errorMsgs.iSCSIDiscoverUser}</span>
                                }
                            </div>
                        </div>
                    }

                    {isAnsibleDeployment &&
                        <div className={getClassNames("iSCSIDiscoverPassword", errorMsgs)}>
                            <label className="col-md-3 control-label">Discovery Password</label>
                            <div className="col-md-6">
                                <input type="password" style={{width: "150px"}}
                                       title="Enter the user for the iSCSI portal you wish to use."
                                       className="form-control"
                                       value={storageConfig.iSCSIDiscoverPassword.value}
                                       onChange={(e) => handleStorageConfigUpdate("iSCSIDiscoverPassword", e.target.value)}
                                />
                                {errorMsgs.iSCSIDiscoverPassword &&
                                    <span className="help-block">{errorMsgs.iSCSIDiscoverPassword}</span>
                                }
                            </div>
                        </div>
                    }


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

                    {isOtopiDeployment &&
                        <span>
                            <div className={getClassNames("iSCSITargetName", errorMsgs)}>
                                <label className="col-md-3 control-label">Target Name</label>
                                <div className="col-md-6">
                                    <input type="text" style={{width: "250px"}}
                                           title="Enter the iSCSI target name."
                                           className="form-control"
                                           value={storageConfig.iSCSITargetName.value}
                                           onChange={(e) => handleStorageConfigUpdate("iSCSITargetName", e.target.value)} />
                                    {errorMsgs.iSCSITargetName &&
                                        <span className="help-block">{errorMsgs.iSCSITargetName}</span>
                                    }
                                </div>
                            </div>
                        </span>
                    }

                    {isAnsibleDeployment &&
                        <span>
                            <div className="form-group">
                                <span className="col-md-offset-3 col-md-6">
                                    <button type="button"
                                            className={targetRetrievalBtnClasses}
                                            onClick={handleIscsiTargetRequest}>
                                        Retrieve Target List
                                    </button>
                                </span>
                            </div>

                            {targetRetrievalStatus === status.POLLING &&
                                <div className="form-group" style={{marginTop: "20px"}}>
                                    <div className="col-md-9 horizontal-center">
                                        <div className="spinner blank-slate-pf-icon storage-retrieval-spinner vertical-center"/>
                                        <div className="vertical-center storage-retrieval-msg">
                                            Retrieving iSCSI Targets
                                        </div>
                                    </div>
                                </div>
                            }

                            {iscsiTargetData !== null &&
                                <TargetListContainer targetList={iscsiTargetData}
                                                     handleTargetSelection={handleTargetSelection}
                                                     selectedTarget={selectedIscsiTarget} />
                            }

                            {lunRetrievalStatus === status.POLLING &&
                                <div className="form-group" style={{marginTop: "20px"}}>
                                    <div className="col-md-9 horizontal-center">
                                        <div className="spinner blank-slate-pf-icon storage-retrieval-spinner vertical-center"/>
                                        <div className="vertical-center storage-retrieval-msg">
                                            Retrieving LUNs
                                        </div>
                                    </div>
                                </div>
                            }

                            {iscsiLunData !== null &&
                                <LunListContainer lunList={iscsiLunData}
                                                  handleLunSelection={handleLunSelection}
                                                  selectedLun={selectedLun} />
                            }
                        </span>
                    }
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

                <div className="form-group">
                    <div className="col-md-9">
                        <span className={advancedSectionIconClasses} />
                        <h3 className="he-wizard-collapsible-section-header">
                            <a className="he-wizard-collapse-section-link"
                               onClick={(e) => handleCollapsibleSectionChange("advanced")}>
                                Advanced
                            </a>
                        </h3>
                    </div>
                </div>

                <span className={advancedSectionClasses}>
                    <div className={getClassNames("imgSizeGB", errorMsgs)}>
                        <label className="col-md-3 control-label">Disk Size (GB)</label>
                        <div className="col-md-6 he-text-with-units">
                            <input type="number" style={{width: "60px"}}
                                   min={storageConfig.imgSizeGB.range.min}
                                   max={storageConfig.imgSizeGB.range.max}
                                   placeholder="Disk Size"
                                   title="Enter the disk size for the VM."
                                   className="form-control"
                                   value={storageConfig.imgSizeGB.value}
                                   onChange={(e) => handleStorageConfigUpdate("imgSizeGB", e.target.value)}
                            />
                            {errorMsgs.imgSizeGB && <span className="help-block">{errorMsgs.imgSizeGB}</span>}
                        </div>
                    </div>

                    <div style={nfsSelected ? {} : { display: 'none' }}>
                        <div className="form-group">
                            <label className="col-md-3 control-label">NFS Version</label>
                            <div className="col-md-6">
                                <div style={{width: "120px"}}>
                                    <Selectbox optionList={nfsVersions}
                                               selectedOption={storageConfig.nfsVersion.value}
                                               callBack={(e) => handleStorageConfigUpdate("nfsVersion", e)}
                                    />
                                </div>
                            </div>
                        </div>

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
                </span>
            </form>
        </div>
    )
};

export default HeWizardStorage;
