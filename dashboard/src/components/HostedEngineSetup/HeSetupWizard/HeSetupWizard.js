import React from 'react'
import { deploymentTypes, status, messages, ansiblePhases, wizardSections as sectNames } from '../constants'
import HeWizardNetworkContainer from '../NetworkStep/HeWizardNetworkContainer'
import HeWizardEngineContainer from '../EngineStep/HeWizardEngineContainer'
import HeWizardStorageContainer from '../StorageStep/HeWizardStorageContainer'
import HeWizardVmContainer from '../VmStep/HeWizardVmContainer'
import HeWizardPreviewContainer from '../PreviewStep/HeWizardPreviewContainer'
import Wizard from '../../common/Wizard/Wizard'
import MultiPartStepContainer from '../../common/Wizard/MultiPartStep/MultiPartStepContainer'
import AnsiblePhasePreviewContainer from "../AnsiblePhasePreview/AnsiblePhasePreviewContainer";

const HeSetupWizard = ({abortCallback, defaultsProvider, deploymentType, handleFinish, handleRedeploy, heSetupModel, isDeploymentStarted,
                           loadingState, onSuccess, onStepChange, setup, sufficientMemAvail, systemData, virtSupported,
                           systemDataRetrieved, gDeployAnswerFilePaths}) => {
    return (
        <div>
            {loadingState === status.POLLING &&
            <div className="curtains curtains-ct blank-slate-pf he-data-loading-container">
                <div className="container-center">
                    <div className="spinner" />
                    <br />
                    <h1>Loading Wizard</h1>
                </div>
            </div>
            }

            {loadingState === status.SUCCESS && deploymentType === deploymentTypes.ANSIBLE_DEPLOYMENT &&
                <Wizard title="Hosted Engine Deployment"
                        onClose={abortCallback}
                        onFinish={handleFinish}
                        onStepChange={onStepChange}
                        isDeploymentStarted={isDeploymentStarted}
                        width={"1100px"}>
                    <MultiPartStepContainer stepName="VM/Engine">
                        <HeWizardVmContainer stepName="VM"
                                             deploymentType={deploymentType}
                                             model={heSetupModel}
                                             systemData={systemData}
                                             defaultsProvider={defaultsProvider}/>
                        <HeWizardEngineContainer stepName="Engine"
                                                 deploymentType={deploymentType}
                                                 heSetupModel={heSetupModel.model}/>
                        <AnsiblePhasePreviewContainer abortCallBack={abortCallback}
                                                      stepName={"Preview"}
                                                      heSetupModel={heSetupModel.model}
                                                      sections={[sectNames.VM, sectNames.ENGINE]}
                                                      phase={ansiblePhases.BOOTSTRAP_VM}/>
                    </MultiPartStepContainer>
                    <MultiPartStepContainer stepName={"Storage"}>
                        <HeWizardStorageContainer stepName="Storage"
                                              deploymentType={deploymentType}
                                              model={heSetupModel}/>
                        <AnsiblePhasePreviewContainer abortCallBack={abortCallback}
                                                      stepName={"Preview"}
                                                      heSetupModel={heSetupModel.model}
                                                      sections={[sectNames.STORAGE]}
                                                      phase={ansiblePhases.CREATE_STORAGE}/>
                    </MultiPartStepContainer>
                    <MultiPartStepContainer stepName={"Network"}>
                        <HeWizardNetworkContainer stepName="Network"
                                                  deploymentType={deploymentType}
                                                  heSetupModel={heSetupModel.model}
                                                  systemData={systemData}
                                                  defaultsProvider={defaultsProvider}/>
                        <AnsiblePhasePreviewContainer abortCallBack={abortCallback}
                                                      stepName={"Preview"}
                                                      heSetupModel={heSetupModel.model}
                                                      sections={[sectNames.NETWORK]}
                                                      phase={ansiblePhases.TARGET_VM}/>
                    </MultiPartStepContainer>
                </Wizard>
            }

            {loadingState === status.SUCCESS && deploymentType === deploymentTypes.OTOPI_DEPLOYMENT &&
                <Wizard title="Hosted Engine Deployment"
                        onClose={abortCallback}
                        onFinish={handleFinish}
                        onStepChange={onStepChange}
                        isDeploymentStarted={isDeploymentStarted}>
                    <HeWizardVmContainer stepName="VM"
                                         deploymentType={deploymentType}
                                         model={heSetupModel}
                                         systemData={systemData}
                                         defaultsProvider={defaultsProvider}/>
                    <HeWizardEngineContainer stepName="Engine"
                                             deploymentType={deploymentType}
                                             heSetupModel={heSetupModel.model}/>
                    <HeWizardStorageContainer stepName="Storage"
                                              deploymentType={deploymentType}
                                              model={heSetupModel}/>
                    <HeWizardNetworkContainer stepName="Network"
                                              deploymentType={deploymentType}
                                              heSetupModel={heSetupModel.model}
                                              systemData={systemData}
                                              defaultsProvider={defaultsProvider}/>
                    <HeWizardPreviewContainer stepName="Review"
                                                deploymentType={deploymentType}
                                                heSetupModel={heSetupModel.model}
                                                isDeploymentStarted={isDeploymentStarted}
                                                onSuccess={onSuccess}
                                                reDeployCallback={handleRedeploy}
                                                setup={setup}
                                                abortCallback={abortCallback}
                                                gDeployAnswerFilePaths={gDeployAnswerFilePaths}/>
                </Wizard>
            }

            <div style={loadingState === status.FAILURE ? {} : {display: 'none'}}
                 className="he-error-msg-container-outer">

                <div className="he-error-msg-container-inner">
                    {!virtSupported &&
                        <div className="container">
                            <div className="alert alert-danger he-error-msg">
                                <span className="pficon pficon-error-circle-o" />
                                <strong>{ messages.VIRT_NOT_SUPPORTED }</strong>
                            </div>
                        </div>
                    }

                    {!systemDataRetrieved &&
                        <div className="container">
                            <div className="alert alert-danger he-error-msg">
                                <span className="pficon pficon-error-circle-o" />
                                <strong>{ messages.SYS_DATA_UNRETRIEVABLE }</strong>
                            </div>
                        </div>
                    }

                    {!sufficientMemAvail &&
                        <div className="container">
                            <div className="alert alert-danger he-error-msg">
                                <span className="pficon pficon-error-circle-o" />
                                <strong>{ messages.INSUFFICIENT_MEM_AVAIL }</strong>
                            </div>
                        </div>
                    }
                </div>
            </div>
        </div>
    )
};

export default HeSetupWizard;