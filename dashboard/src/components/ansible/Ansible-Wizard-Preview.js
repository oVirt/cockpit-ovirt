import PropTypes from 'prop-types';
import React, { Component } from 'react'
import WizardExecutionStep from './Ansible-Wizard-Execution'
import AnsibleUtil from '../../helpers/AnsibleUtil'
import ini from 'ini'
import { CONFIG_FILES } from './constants'

class WizardPreviewStep extends Component {
    constructor(props) {
        super(props);
        this.state = {
            ansibleConfig: "",
            ansibleConfig: "",
            isEditing: false,
            isChanged: false,
            ansibleFileGenerated: false
        }
        this.handleConfigChange = this.handleConfigChange.bind(this)
        this.handleEdit = this.handleEdit.bind(this)
        this.handleSave = this.handleSave.bind(this)
        this.readAnsibleConfig = this.readAnsibleConfig.bind(this)
        this.createAnsibleConfig = this.createAnsibleConfig.bind(this)
    }
    createAnsibleConfig() {
        if (this.props.glusterModel.volumes.length > 0 && this.props.glusterModel.hosts.length > 0) {
            this.setState({
                ansibleConfig: "Creating Ansible configuration...",
                isChanged: false
            })
            const that = this
            AnsibleUtil.createAnsibleConfig(that.props.glusterModel,
                CONFIG_FILES.ansibleInventoryFile,
                that.props.ansibleWizardType,
                that.props.isSingleNode,
            function(returnValue){
              console.log(`Ansible configuration saved successfully to ${CONFIG_FILES.ansibleInventoryFile}`)
              that.readAnsibleConfig()
            })
            AnsibleUtil.createHEAnswerFileForGlusterStorage(this.props.glusterModel.volumes[0].name,
                this.props.glusterModel.hosts,
                this.props.heAnsweFilePath,
            function(returnValue){
              console.log(`Hosted Engine configuration saved successfully to ${that.props.heAnsweFilePath}`)
            })
        }
    }
    readAnsibleConfig() {
        const that = this
        this.setState({ ansibleConfig: "Loading Ansible configuration..." })
        cockpit.file(CONFIG_FILES.ansibleInventoryFile).read()
        .done(function(ansibleConfig) {
            that.setState({ ansibleConfig })
        })
        .fail(function(error) {
            that.setState({ ansibleConfig: `Failed to load the config file ${CONFIG_FILES.ansibleInventoryFile} \n ${error}` })
        })
    }
    componentWillReceiveProps(nextProps) {
      if(this.state.ansibleFileGenerated) {
        if(nextProps.ansibleWizardType === "create_volume" && nextProps.activeStep !== 3) {
          this.setState({ ansibleFileGenerated: false})
        } else if(nextProps.ansibleWizardType === "expand_cluster") {
          if (this.props.isRhvhSystem && nextProps.activeStep !== 3) {
            this.setState({ ansibleFileGenerated: false})
          } else if(!this.props.isRhvhSystem && nextProps.activeStep !== 4) {
            this.setState({ ansibleFileGenerated: false})
          }
        } else if(nextProps.ansibleWizardType === "setup") {
            if(this.props.isSingleNode) {
              if(this.props.isRhvhSystem) {
                if(nextProps.activeStep !== 3) {
                  this.setState({ ansibleFileGenerated: false})
                }
              } else if(!this.props.isRhvhSystem) {
                if(nextProps.activeStep !== 4) {
                  this.setState({ ansibleFileGenerated: false})
                }
              }
            } else if(!this.props.isSingleNode) {
              if(this.props.isRhvhSystem) {
                if(nextProps.activeStep !== 4) {
                  this.setState({ ansibleFileGenerated: false})
                }
              } else if(!this.props.isRhvhSystem) {
                if(nextProps.activeStep !== 5) {
                  this.setState({ ansibleFileGenerated: false})
                }
              }
            }
        }
      }
      if(!this.state.ansibleFileGenerated && (!this.state.isChanged || !this.props.isDeploymentStarted)) {
        if(nextProps.ansibleWizardType === "create_volume" && nextProps.activeStep == 3) {
          this.createAnsibleConfig()
          this.setState({ ansibleFileGenerated: true})
        } else if(nextProps.ansibleWizardType === "expand_cluster") {
          if (this.props.isRhvhSystem && nextProps.activeStep == 3) {
            this.createAnsibleConfig()
            this.setState({ ansibleFileGenerated: true})
          } else if(!this.props.isRhvhSystem && nextProps.activeStep == 4) {
            this.createAnsibleConfig()
            this.setState({ ansibleFileGenerated: true})
          }
        } else if(nextProps.ansibleWizardType === "setup") {
            if(this.props.isSingleNode) {
              if(this.props.isRhvhSystem) {
                if(nextProps.activeStep == 3) {
                  this.createAnsibleConfig()
                  this.setState({ ansibleFileGenerated: true})
                }
              } else if(!this.props.isRhvhSystem) {
                if(nextProps.activeStep == 4) {
                  this.createAnsibleConfig()
                  this.setState({ ansibleFileGenerated: true})
                }
              }
            } else if(!this.props.isSingleNode) {
              if(this.props.isRhvhSystem) {
                if(nextProps.activeStep == 4) {
                  this.createAnsibleConfig()
                  this.setState({ ansibleFileGenerated: true})
                }
              } else if(!this.props.isRhvhSystem) {
                if(nextProps.activeStep == 5) {
                  this.createAnsibleConfig()
                  this.setState({ ansibleFileGenerated: true})
                }
              }
            }
        }
      }
    }
    handleConfigChange(e) {
        this.setState({
            ansibleConfig: e.target.value,
            isChanged: true
        })
    }
    handleEdit() {
        this.setState({
          isEditing: true
        })
    }
    handleSave() {
        this.setState({ isEditing: false })
        AnsibleUtil.writeConfigFile(CONFIG_FILES.ansibleInventoryFile, this.state.ansibleConfig, function (result) {
            console.log("Result after editing and saving config file: ", result)
        })
    }
    render() {
        if (this.props.isDeploymentStarted) {
            return (
                <WizardExecutionStep
                    heAnsweFilePath={this.props.heAnsweFilePath}
                    heCommanAnswer={this.props.heCommanAnswer}
                    onSuccess={this.props.onSuccess}
                    reDeployCallback={this.props.reDeployCallback}
                    ansibleWizardType={this.props.ansibleWizardType}
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
                                Generated Ansible inventory : {CONFIG_FILES.ansibleInventoryFile}
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
                                    onClick={this.readAnsibleConfig}>
                                    <span className="fa fa-refresh">&nbsp;</span>
                                    Reload
                                    </button>
                            </div>
                        </div>
                        <textarea className="ansible-wizard-config-preview"
                            value={this.state.ansibleConfig} onChange={this.handleConfigChange} readOnly={!this.state.isEditing}>
                        </textarea>
                    </div>
                </div>
            )
        }
    }
}

WizardPreviewStep.propTypes = {
    stepName: PropTypes.string.isRequired,
    heAnsweFilePath: PropTypes.string.isRequired,
    glusterModel: PropTypes.object.isRequired,
    heCommanAnswer: PropTypes.string.isRequired,
    isDeploymentStarted: PropTypes.bool.isRequired,
    onSuccess: PropTypes.func.isRequired,
    reDeployCallback: PropTypes.func.isRequired
}

export default WizardPreviewStep
