import React from 'react'
import AnsibleSetup from './AnsibleSetup'

function ExpandBrick(){
  function openGlusterManagement(){
    cockpit.jump("/ovirt-dashboard#/gluster-management");
  }
  return <AnsibleSetup ansibleWizardType="expand_volume" volumeName={window.location.href.split('/').pop()} onSuccess={openGlusterManagement} onClose={openGlusterManagement}/>
}

export default ExpandBrick
