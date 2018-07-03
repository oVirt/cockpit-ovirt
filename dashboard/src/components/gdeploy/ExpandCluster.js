import React from 'react'
import GdeploySetup from './GdeploySetup'


function ExpandCluster(){
  function openGlusterManagement(){
    cockpit.jump("/ovirt-dashboard#/gluster-management");
  }
  return <GdeploySetup gdeployWizardType="expand_cluster" onSuccess={openGlusterManagement} onClose={openGlusterManagement}/>
}

export default ExpandCluster
