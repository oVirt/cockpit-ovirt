import React from 'react'
import { deploymentStatus } from '../constants';
import DeploymentSuccessPanel from '../Execution/DeploymentSuccessPanel'
import HeSetupContainer from '../HeSetup/HeSetupContainer'

// const HeWizardExecution = ({heSetupStatus, setup, startSetup}) => {
const HeWizardExecution = ({heSetupStatus, heSetupModel, gDeployAnswerFilePaths, abortCallback}) => {
    if (heSetupStatus === deploymentStatus.SUCCESS) {
        return <DeploymentSuccessPanel />
    } else {
        return <HeSetupContainer gDeployAnswerFilePaths={gDeployAnswerFilePaths}
                                 heSetupModel={heSetupModel}
                                 abortCallback={abortCallback}/>
    }
};

export default HeWizardExecution;