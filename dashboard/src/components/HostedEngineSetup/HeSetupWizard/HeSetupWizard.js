import React from 'react'
import { loadingState as state, messages } from '../constants'
import HeWizardNetworkContainer from '../NetworkStep/HeWizardNetworkContainer'
import HeWizardEngineContainer from '../EngineStep/HeWizardEngineContainer'
import HeWizardStorageContainer from '../StorageStep/HeWizardStorageContainer'
import HeWizardVmContainer from '../VmStep/HeWizardVmContainer'
import HeWizardPreviewContainer from '../PreviewStep/HeWizardPreviewContainer'
import Wizard from '../../common/Wizard'

const HeSetupWizard = ({abortCallback, handleFinish, handleRedeploy, heSetupModel, isDeploymentStarted,
                       loadingState, onSuccess, onStepChange, setup, systemData, virtSupported,
                       systemDataRetrieved}) => {
    const virtNotSupported = virtSupported === -1;
    const systemDataNotRetrievable = systemDataRetrieved === -1;

    return (
        <div>
            {loadingState === state.POLLING &&
            <div className="curtains curtains-ct blank-slate-pf he-data-loading-container">
                <div className="container-center">
                    <div className="spinner" />
                    <br />
                    <h1>Loading Wizard</h1>
                </div>
            </div>
            }

            {loadingState === state.READY &&
            <Wizard title="Hosted Engine Deployment"
                    onClose={abortCallback}
                    onFinish={handleFinish}
                    onStepChange={onStepChange}
                    isDeploymentStarted={isDeploymentStarted}>
                <HeWizardStorageContainer stepName="Storage" model={heSetupModel}/>
                <HeWizardNetworkContainer stepName="Network" heSetupModel={heSetupModel.model}
                                          systemData={systemData}
                />
                <HeWizardVmContainer stepName="VM"
                                     model={heSetupModel}
                                     systemData={systemData}
                />
                <HeWizardEngineContainer stepName="Engine" heSetupModel={heSetupModel.model}/>
                <HeWizardPreviewContainer stepName="Review" heSetupModel={heSetupModel.model}
                                   isDeploymentStarted={isDeploymentStarted}
                                   onSuccess={onSuccess}
                                   reDeployCallback={handleRedeploy}
                                   setup={setup}
                                   abortCallback={abortCallback}
                />
            </Wizard>
            }

            <div style={loadingState === state.ERROR ? {} : {display: 'none'}}
                 className="he-error-msg-container-outer">

                <div className="he-error-msg-container-inner">
                    {virtNotSupported &&
                    <div className="container">
                        <div className="alert alert-danger he-error-msg">
                            <span className="pficon pficon-error-circle-o" />
                            <strong>{ messages.VIRT_NOT_SUPPORTED }</strong>
                        </div>
                    </div>
                    }

                    {systemDataNotRetrievable &&
                    <div className="container">
                        <div className="alert alert-danger he-error-msg">
                            <span className="pficon pficon-error-circle-o" />
                            <strong>{ messages.SYS_DATA_UNRETRIEVABLE }</strong>
                        </div>
                    </div>
                    }
                </div>
            </div>
        </div>
    )
};

export default HeSetupWizard;