import React from 'react'
import GdeploySetup from './GdeploySetup'

function CreateGlusterVolume(){
  function openGlusterManagement(){
    cockpit.jump("/ovirt-dashboard#/gluster-management");
  }
  return <GdeploySetup gdeployWizardType="create_volume" onSuccess={openGlusterManagement} onClose={openGlusterManagement}/>
}

export default CreateGlusterVolume
