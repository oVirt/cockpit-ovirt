import React, { Component } from 'react'
import WizardHostStep from './Gdeploy-Wizard-Hosts'
import WizardPackageStep from './Gdeploy-Wizard-Packages'
import WizardVolumesStep from './Gdeploy-Wizard-Volumes'
import WizardBricksStep from './Gdeploy-Wizard-Bricks'
import WizardPreviewStep from './Gdeploy-Wizard-Preview'
import Wizard from './Wizard'
import GdeployUtil from '../../helpers/GdeployUtil'
import { CONFIG_FILES } from './constants'
import ini from 'ini'

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
        this.createGdeployConfig = this.createGdeployConfig.bind(this)
    }
    createGdeployConfig() {
        if (this.state.glusterModel.volumes.length > 0 && this.state.glusterModel.hosts.length > 0) {
            const that = this
            cockpit.file(CONFIG_FILES.gdeployTemplate).read()
                .done(function(template) {
                    if (template != null) {
                        const configTemplate = ini.parse(template)
                        GdeployUtil.createGdeployConfig(that.state.glusterModel, configTemplate, CONFIG_FILES.gdeployConfigFile)
                    }
                })
            GdeployUtil.createHEAnswerFileForGlusterStorage(this.state.glusterModel.volumes[0].name, this.state.glusterModel.hosts, CONFIG_FILES.heAnsfileFile)
        }
    }
    onStepChange(activeStep) {
        if (activeStep == 4) {
            this.createGdeployConfig()
        }
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
                <WizardBricksStep stepName="Bricks" bricks={this.state.glusterModel.bricks} />
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