import React, { Component } from 'react'
import WizardHostStep from './Gdeploy-Wizard-Hosts'
import WizardPackageStep from './Gdeploy-Wizard-Packages'
import WizardVolumesStep from './Gdeploy-Wizard-Volumes'
import WizardBricksStep from './Gdeploy-Wizard-Bricks'
import WizardPreviewStep from './Gdeploy-Wizard-Preview'
import Wizard from './Wizard'
import GdeployUtil from '../../helpers/GdeployUtil'
import { CONFIG_FILES } from './constants'

class GdeploySetup extends Component {
    constructor(props) {
        super(props);
        this.state = {
            //TODO: These default values should be cleared before merging
            glusterModel: GdeployUtil.getDefaultGedeployModel(),
            isDeploymentStarted: false
        };
        this.handleFinish = this.handleFinish.bind(this)
        this.onStepChange = this.onStepChange.bind(this)
    }
    onStepChange(activeStep) {

    }
    handleFinish() {
        this.setState({ isDeploymentStarted: true })
    }
    render() {
        return (
            <Wizard title="Gluster Deployment" onClose={this.props.onClose}
                onFinish={this.handleFinish} onStepChange={this.onStepChange}>
                <WizardHostStep stepName="Hosts" hosts={this.state.glusterModel.hosts} />
                <WizardPackageStep stepName="Packages" subscription={this.state.glusterModel.subscription} />
                <WizardVolumesStep stepName="Volumes" volumes={this.state.glusterModel.volumes} />
                <WizardBricksStep stepName="Bricks"
                    glusterModel={this.state.glusterModel}
                    bricks={this.state.glusterModel.bricks}
                    raidConfig={this.state.glusterModel.raidConfig}
                    />
                <WizardPreviewStep stepName="Review" glusterModel={this.state.glusterModel}
                    configFilePath={CONFIG_FILES.gdeployConfigFile}
                    heAnsweFilePath={CONFIG_FILES.heAnsfileFile}
                    heCommanAnswer={CONFIG_FILES.heCommonAnsFile}
                    templatePath={CONFIG_FILES.gdeployTemplate}
                    onSuccess={this.props.onSuccess}
                    isDeploymentStarted={this.state.isDeploymentStarted}
                    />
            </Wizard>
        )
    }
}

GdeploySetup.propTypes = {
    onClose: React.PropTypes.func.isRequired,
    onSuccess: React.PropTypes.func.isRequired,
}
export default GdeploySetup