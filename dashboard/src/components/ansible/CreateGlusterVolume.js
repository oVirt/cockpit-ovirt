import React from 'react'
import AnsibleSetup from './AnsibleSetup'

function CreateGlusterVolume(){
  function openGlusterManagement(){
    cockpit.jump("/ovirt-dashboard#/gluster-management");
  }
  return <AnsibleSetup ansibleWizardType="create_volume" onSuccess={openGlusterManagement} onClose={openGlusterManagement}/>
}

export default CreateGlusterVolume
