import PropTypes from 'prop-types';
import React, { Component } from 'react'
import WizardHostStep from './Ansible-Wizard-Hosts'
import WizardFqdnStep from './Ansible-Wizard-Fqdns'
import WizardPackageStep from './Ansible-Wizard-Packages'
import WizardVolumesStep from './Ansible-Wizard-Volumes'
import WizardBricksStep from './Ansible-Wizard-Bricks'
import WizardPreviewStep from './Ansible-Wizard-Preview'
import Wizard from '../common/Wizard/Wizard'
import AnsibleUtil from '../../helpers/AnsibleUtil'
import { CONFIG_FILES } from './constants'

class AnsibleSetup extends Component {
    constructor(props) {
        super(props);
        this.state = {
            //TODO: These default values should be cleared before merging
            glusterModel: AnsibleUtil.getDefaultAnsibleModel(),
            isDeploymentStarted: false,
            title: '',
            isRhvhSystem: false
        };
        this.handleFinish = this.handleFinish.bind(this)
        this.onStepChange = this.onStepChange.bind(this)
        this.handleReDeploy = this.handleReDeploy.bind(this)
        this.onSuccess = this.onSuccess.bind(this)
        this.setTitle = this.setTitle.bind(this)
    }
    componentDidMount() {
      this.setTitle(this.props.ansibleWizardType)
      let that = this
      AnsibleUtil.isRhvhSystem(function (isAvailable) {
          that.setState({ isRhvhSystem: isAvailable })
      })
    }
    onSuccess() {
        console.log("Ansible inventory file is being generated");
    }
    onStepChange(activeStep) {

    }
    handleFinish() {
        this.setState({ isDeploymentStarted: true })
    }
    handleReDeploy(){
        this.setState({ isDeploymentStarted: false })
    }
    setTitle(ansibleWizardType) {
      let tempTitle = ''
      if(ansibleWizardType === "expand_cluster") {
          tempTitle = "Expand Cluster"
      } else if (ansibleWizardType === "create_volume") {
        tempTitle = "Create Volume"
      } else if (ansibleWizardType === "expand_volume") {
        tempTitle = "Expand Volume " + this.props.volumeName
      } else {
        tempTitle="Gluster Deployment"
      }
      this.setState({ title: tempTitle})
    }
    render() {
        let wizardChildren = []
        let index = 1;
        wizardChildren.push(<WizardHostStep key={index++} ansibleWizardType={this.props.ansibleWizardType}
            stepName="Hosts"
            glusterModel={this.state.glusterModel}
            isSingleNode={this.props.isSingleNode}
            />)
        if ((this.props.ansibleWizardType === "setup" || this.props.ansibleWizardType === "expand_cluster") && this.state.isRhvhSystem === false) {
            wizardChildren.push(<WizardPackageStep key={index++} ansibleWizardType={this.props.ansibleWizardType}
                stepName="Packages"
                subscription={this.state.glusterModel.subscription}
                />)
        }
        wizardChildren.push(<WizardVolumesStep key={index++} ansibleWizardType={this.props.ansibleWizardType}
            stepName="Volumes"
            volumes={this.state.glusterModel.volumes}
            volumeName={this.props.volumeName}
            isSingleNode={this.props.isSingleNode}
            />)
        wizardChildren.push(<WizardBricksStep key={index++} ansibleWizardType={this.props.ansibleWizardType}
            stepName="Bricks"
            glusterModel={this.state.glusterModel}
            hosts={this.state.glusterModel.hosts}
            expandVolumeHosts={this.state.glusterModel.expandVolumeHosts}
            multiPathCheck={this.state.glusterModel.multiPathCheck}
            volumes={this.state.glusterModel.volumes}
            volumeName={this.props.volumeName}
            bricks={this.state.glusterModel.bricks}
            raidConfig={this.state.glusterModel.raidConfig}
            lvCacheConfig={this.state.glusterModel.lvCacheConfig}
            />)
        wizardChildren.push(<WizardPreviewStep key={index++} ansibleWizardType={this.props.ansibleWizardType}
            stepName="Review"
            glusterModel={this.state.glusterModel}
            heAnsweFilePath={CONFIG_FILES.heAnsfileFile}
            heCommanAnswer={CONFIG_FILES.heCommonAnsFile}
            onSuccess={this.props.onSuccess}
            reDeployCallback={this.handleReDeploy}
            isDeploymentStarted={this.state.isDeploymentStarted}
            isRhvhSystem={this.state.isRhvhSystem}
            isSingleNode={this.props.isSingleNode}
            expandClusterConfigFilePath={CONFIG_FILES.expandClusterConfigFile}
            />)
        return (
            <Wizard title={this.state.title} onClose={this.props.onClose}
                onFinish={this.handleFinish} onStepChange={this.onStepChange}
                isDeploymentStarted={this.state.isDeploymentStarted}>
                {wizardChildren}
            </Wizard>
        )
    }
}

AnsibleSetup.propTypes = {
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
}
export default AnsibleSetup
