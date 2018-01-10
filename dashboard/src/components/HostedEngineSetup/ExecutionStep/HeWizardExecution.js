import React from 'react'
import { deploymentStatus } from '../constants';
import DeploymentSuccessPanel from '../Execution/DeploymentSuccessPanel'
import HeSetupContainer from '../HeSetup/HeSetupContainer'

const HeWizardExecution = ({heSetupStatus, setup, startSetup}) => {
    if (heSetupStatus === deploymentStatus.SUCCESS) {
        return <DeploymentSuccessPanel />
    } else {
        return <HeSetupContainer setupCallback={startSetup}
                                 setup={setup}/>
    }
};

export default HeWizardExecution;