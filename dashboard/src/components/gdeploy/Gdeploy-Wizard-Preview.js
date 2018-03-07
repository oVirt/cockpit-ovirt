import React, { Component } from 'react'
import WizardExecutionStep from './Gdeploy-Wizard-Execution'
import GdeployUtil from '../../helpers/GdeployUtil'
import ini from 'ini'

class WizardPreviewStep extends Component {
    constructor(props) {
        super(props);
        this.state = {
            gdeployConfig: "",
            isEditing: false,
            isChanged: false
        }
        this.handleConfigChange = this.handleConfigChange.bind(this)
        this.handleEdit = this.handleEdit.bind(this)
        this.handleSave = this.handleSave.bind(this)
        this.readGdeployConfig = this.readGdeployConfig.bind(this)
        this.createGdeployConfig = this.createGdeployConfig.bind(this)
    }
    createGdeployConfig() {
        if (this.props.glusterModel.volumes.length > 0 && this.props.glusterModel.hosts.length > 0) {
            this.setState({
                gdeployConfig: "Creating Gdeploy configuration...",
                isChanged: false
            })
            const that = this
            cockpit.file(this.props.templatePath).read()
            .done(function(template) {
                if (template != null) {
                    const configTemplate = ini.parse(template)
                    if (that.props.gdeployWizardType === "expand_cluster") {
                        GdeployUtil.createExpandClusterConfig(that.props.glusterModel, that.props.expandClusterConfigFilePath)
                    }
                    GdeployUtil.createGdeployConfig(that.props.glusterModel,
                        configTemplate,
                        that.props.configFilePath,
                    function(returnValue){
                      console.log(`Gdeploy configuration saved successfully to ${that.props.configFilePath}`)
                      that.readGdeployConfig()
                    })
                }
            })
            GdeployUtil.createHEAnswerFileForGlusterStorage(this.props.glusterModel.volumes[0].name,
                this.props.glusterModel.hosts,
                this.props.heAnsweFilePath,
            function(returnValue){
              console.log(`Hosted Engine configuration saved successfully to ${that.props.heAnsweFilePath}`)
            })
        }
    }
    readGdeployConfig() {
        const that = this
        this.setState({ gdeployConfig: "Loading Gdeploy configuration..." })
        cockpit.file(that.props.configFilePath).read()
        .done(function(gdeployConfig) {
            that.setState({ gdeployConfig })
        })
        .fail(function(error) {
            that.setState({ gdeployConfig: `Failed to load the config file ${that.props.configFilePath} \n ${error}` })
        })
    }
    componentWillReceiveProps(nextProps) {
        if ((nextProps.activeStep == 4 || (nextProps.gdeployWizardType === "create_volume" && nextProps.activeStep == 3)) && !this.state.isChanged && !this.props.isDeploymentStarted) {
            this.createGdeployConfig()
        }
    }
    handleConfigChange(e) {
        this.setState({
            gdeployConfig: e.target.value,
            isChanged: true
        })
    }
    handleEdit() {
        this.setState({ isEditing: true })
    }
    handleSave() {
        this.setState({ isEditing: false })
        GdeployUtil.writeConfigFile(this.props.configFilePath, this.state.gdeployConfig, function (result) {
            console.log("Result after editing and saving config file: ", result)
        })
    }
    render() {
        if (this.props.isDeploymentStarted) {
            return (
                <WizardExecutionStep configFilePath={this.props.configFilePath}
                    heAnsweFilePath={this.props.heAnsweFilePath}
                    heCommanAnswer={this.props.heCommanAnswer}
                    onSuccess={this.props.onSuccess}
                    reDeployCallback={this.props.reDeployCallback}
                    gdeployWizardType={this.props.gdeployWizardType}
                    expandClusterConfigFilePath={this.props.expandClusterConfigFilePath}
                    />
            )
        } else {
            return (
                <div className="col-sm-12">
                    <div className="panel panel-default">
                        <div className="panel-heading">
                            <span className="pficon-settings"></span>
                            <span>
                                Generated Gdeploy configuration : {this.props.configFilePath}
                            </span>
                            <div className="pull-right">
                                {this.state.isEditing &&
                                    <button className="btn btn-default"
                                        onClick={this.handleSave}>
                                        <span className="pficon pficon-save">&nbsp;</span>
                                        Save
                                        </button>
                                }
                                {!this.state.isEditing &&
                                    <button className="btn btn-default"
                                        onClick={this.handleEdit}>
                                        <span className="pficon pficon-edit">&nbsp;</span>
                                        Edit
                                    </button>
                                }
                                <button className="btn btn-default"
                                    onClick={this.createGdeployConfig}>
                                    <span className="fa fa-refresh">&nbsp;</span>
                                    Reload
                                    </button>
                            </div>
                        </div>
                        <textarea className="gdeploy-wizard-config-preview"
                            value={this.state.gdeployConfig} onChange={this.handleConfigChange} readOnly={!this.state.isEditing}>
                        </textarea>
                    </div>
                </div>
            )
        }
    }
}

WizardPreviewStep.propTypes = {
    stepName: React.PropTypes.string.isRequired,
    heAnsweFilePath: React.PropTypes.string.isRequired,
    templatePath: React.PropTypes.string.isRequired,
    glusterModel: React.PropTypes.object.isRequired,
    configFilePath: React.PropTypes.string.isRequired,
    heCommanAnswer: React.PropTypes.string.isRequired,
    isDeploymentStarted: React.PropTypes.bool.isRequired,
    onSuccess: React.PropTypes.func.isRequired,
    reDeployCallback: React.PropTypes.func.isRequired
}

export default WizardPreviewStep
