import React, { Component } from 'react'
import Selectbox from '../common/Selectbox'
import classNames from 'classnames'

class WizardVolumesStep extends Component {
    constructor(props) {
        super(props);
        this.state = {
            volumes: props.volumes,
            errorMsg: "",
            errorMsgs: {}
        }
        this.handleDelete = this.handleDelete.bind(this)
        this.handleAdd = this.handleAdd.bind(this)
        this.handleUpdate = this.handleUpdate.bind(this)
    }
    handleDelete(index) {
        const volumes = this.state.volumes
        volumes.splice(index, 1);
        this.setState({ volumes, errorMsgs: {} })
    }
    getEmptyRow() {
        return { name: "", type: "replicate", is_arbiter: false, brick_dir: "" }
    }
    handleAdd() {
        const volumes = this.state.volumes
        volumes.push(this.getEmptyRow())
        this.setState({ volumes })
    }
    handleUpdate(index, property, value) {
        const volumes = this.state.volumes
        volumes[index][property] = value
        const errorMsgs= this.state.errorMsgs
        this.validateVolume(volumes[index], index, errorMsgs)
        this.setState({ volumes, errorMsgs })
    }
    // Trim "Name" and "Brick Dirs" values
    trimVolumeProperties(){
      const inVolumes = this.state.volumes
      for(var i=0; i< inVolumes.length; i++){
        this.state.volumes[i].name = inVolumes[i].name.trim()
        this.state.volumes[i].brick_dir = inVolumes[i].brick_dir.trim()
      }
    }
    validateVolume(volume, index, errorMsgs){
        let valid = true
        errorMsgs[index] = {}
        if(volume.name.trim().length <1){
            valid = false
            errorMsgs[index].name = "Volume name cannot be empty"
        }
        if(volume.brick_dir.trim().length<4){
            errorMsgs[index].brick_dir = "Brick directory cannot be empty"
                valid = false
        }
        return valid
    }
    validate(){
        this.trimVolumeProperties()
        let valid = true
        const that = this
        let errorMsg = ""
        const errorMsgs= {}
        if( this.state.volumes.length <1){
            valid = false;
            errorMsg = "Minimum one volume should be defined for hosted-engine deployment"
        }
        this.state.volumes.forEach(function(volume, index){
            if(!that.validateVolume(volume, index, errorMsgs) && valid){
                valid = false;
            }
        })
        this.setState({ errorMsg, errorMsgs })
        return valid
    }
    shouldComponentUpdate(nextProps, nextState){
        if(!this.props.validating && nextProps.validating ){
            this.props.validationCallBack(this.validate())
        }
        return true;
    }
    componentDidMount(){
        if (this.props.gdeployWizardType === "create_volume" || this.props.gdeployWizardType === "expand_cluster") {
            let volumes = this.state.volumes
            volumes.splice(0)
            volumes.push(this.getEmptyRow())
            this.setState({ volumes })
        }
    }
    render() {
        const volumeRows = [];
        const that = this
        this.state.volumes.forEach(function (volume, index) {
            volumeRows.push(
                <VolumeRow volume={volume} key={index} index={index}
                    errorMsgs = {that.state.errorMsgs[index]}
                    changeCallBack={this.handleUpdate}
                    deleteCallBack={() => this.handleDelete(index)}
                    />
            )
        }, this)
        return (
            <div>
                {this.state.errorMsg &&
                    <div className="alert alert-danger">
                        <span className="pficon pficon-error-circle-o"></span>
                        <strong>{this.state.errorMsg}</strong>
                    </div>
                }
                {volumeRows.length > 0 &&
                    <form className="form-horizontal">
                        <table className="gdeploy-wizard-table">
                            <tbody>
                                <tr>
                                    <th>Name</th>
                                    <th>Volume Type</th>
                                    <th>Arbiter</th>
                                    <th>Brick Dirs</th>
                                </tr>
                                {volumeRows}
                            </tbody>
                        </table>
                    </form>
                }
                <a onClick={this.handleAdd} className="col-md-offset-4">
                    <span className="pficon pficon-add-circle-o">
                        <strong> Add Volume</strong>
                    </span>
                </a>
                {(this.props.gdeployWizardType === "setup") &&
                    <div className="col-md-offset-2 col-md-8 alert alert-info gdeploy-wizard-host-ssh-info">
                        <span className="pficon pficon-info"></span>
                        <strong>
                            First volume in the list will be used for hosted-engine deployment
                        </strong>
                    </div>
                }
            </div>
        )
    }
}

WizardVolumesStep.propTypes = {
    stepName: React.PropTypes.string.isRequired,
    volumes: React.PropTypes.array.isRequired
}

const VolumeRow = ({volume, index, errorMsgs, changeCallBack, deleteCallBack}) => {
    const volumeTypes = [
        { key: "replicate", title: "Replicate" }
    ]
    const volumeName = classNames(
        "form-group",
        { "has-error": errorMsgs && errorMsgs.name }
    )
    const brick_dir = classNames(
        "form-group",
        { "has-error": errorMsgs && errorMsgs.brick_dir }
    )
    return (
        <tr>
            <td  className="col-md-3">
                <div className={volumeName}>
                    <input type="text" className="form-control"
                        value={volume.name}
                        onChange={(e) => changeCallBack(index, "name", e.target.value)}
                        />
                    {errorMsgs && errorMsgs.name && <span className="help-block">{errorMsgs.name}</span>}
                </div>
            </td>
            <td className="col-md-3">
                <Selectbox optionList={volumeTypes}
                    selectedOption={volume.type}
                    callBack={(e) => changeCallBack(index, "type", e)}
                    />
            </td>
            <td className="col-md-1">
                <input type="checkbox" className="form-control" title="Third host in the host list will be used for creating arbiter bricks"
                    checked={volume.is_arbiter}
                    onChange={(e) => changeCallBack(index, "is_arbiter", e.target.checked)}
                    />
            </td>
            <td className="col-md-3">
                <div className={brick_dir}>
                    <input type="text" className="form-control"
                        value={volume.brick_dir}
                        onChange={(e) => changeCallBack(index, "brick_dir", e.target.value)}
                        />
                    {errorMsgs && errorMsgs.brick_dir && <span className="help-block">{errorMsgs.brick_dir}</span>}
                </div>
            </td>
            <td className="col-sm-1">
                <a onClick={deleteCallBack}>
                    <span className="pficon pficon-delete gdeploy-wizard-delete-icon">
                    </span>
                </a>
            </td>
        </tr>
    )
}
export default WizardVolumesStep
