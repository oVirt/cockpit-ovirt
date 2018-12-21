import React from 'react'
import AnsibleSetup from './AnsibleSetup'

function ExpandCluster(){
  function openGlusterManagement(){
    cockpit.jump("/ovirt-dashboard#/gluster-management");
  }
  return <AnsibleSetup ansibleWizardType="expand_cluster" onSuccess={openGlusterManagement} onClose={openGlusterManagement}/>
}

export default ExpandCluster
