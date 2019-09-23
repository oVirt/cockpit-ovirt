import PropTypes from 'prop-types';
import React, { Component } from 'react'
import Selectbox from '../common/Selectbox'
import classNames from 'classnames'

class WizardVolumesStep extends Component {
    constructor(props) {
        super(props);
        this.state = {
            volumes: props.volumes,
            isSingleNode: props.isSingleNode,
            errorMsg: "",
            errorMsgs: {}
        }
        this.handleDelete = this.handleDelete.bind(this)
        this.handleAdd = this.handleAdd.bind(this)
        this.handleUpdate = this.handleUpdate.bind(this)
        this.getVolumeInfo = this.getVolumeInfo.bind(this)
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
        if(property === "name") {
          let brick_dir = "/gluster_bricks/" + value + "/" + value
          volumes[index]["brick_dir"] = brick_dir
          volumes[index][property] = value
        } else if(this.props.ansibleWizardType === "expand_volume" && property === "brick_dir") {
          let brick_dir_split = value.split("/")
          let brick_dir = ""
          if(brick_dir_split.length > 3) {
            brick_dir = "/gluster_bricks/" + brick_dir_split[3] + "/" + brick_dir_split[3]
          } else {
            brick_dir = "/gluster_bricks/" + brick_dir_split[2] + "/" + brick_dir_split[2]
          }
          volumes[index][property] = brick_dir
        } else {
          volumes[index][property] = value
        }
        const errorMsgs= this.state.errorMsgs
        this.validateVolume(volumes[index], index, errorMsgs)
        this.setState({ volumes, errorMsgs })
    }
    getVolumeInfo(volumeName, callback){
      let that = this;
      cockpit.spawn(["vdsm-client", "--gluster-enabled", "GlusterVolume", "list", "volumeName="+volumeName])
      .done(
        function (volumeInfoJson){
          var volumeInfo = JSON.parse(volumeInfoJson);
          callback(volumeInfo.volumes);
        }
      )
      .fail(
        function(err){
          console.log("Error while fetching volume info: ", err);
          callback(null);
        }
      );
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
        } else if(volume.brick_dir.trim()[0] !== "/") {
            errorMsgs[index].brick_dir = "Brick directory should start with a \"/\""
            valid = false
        } else if(volume.brick_dir.trim().match(/[/]/g).length < 2) {
            errorMsgs[index].brick_dir = "Brick directory needs to point to a specific path. Should be in the format similar to \"/gluster_bricks/example/example\""
            valid = false
        } else if(volume.brick_dir.trim().split("/")[1] !== "gluster_bricks") {
            errorMsgs[index].brick_dir = "Brick directory should start with \"/gluster_bricks/\""
            valid = false
        } else if(this.props.ansibleWizardType === "expand_volume") {
            if(volume.name === volume.brick_dir.split("/")[2]) {
              errorMsgs[index].brick_dir = "Brick directory for expanding volume shouldn't contain volume name"
              valid = false
            } if(volume.brick_dir.split("/")[2].length == 0 || volume.brick_dir.split("/")[2] == "" || volume.brick_dir.split("/")[2] == " ") {
              errorMsgs[index].brick_dir = "Brick directory can't be empty"
              valid = false
            }
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
        if (this.props.ansibleWizardType === "create_volume" || this.props.ansibleWizardType === "expand_cluster") {
            let volumes = this.state.volumes
            volumes.splice(0)
            volumes.push(this.getEmptyRow())
            this.setState({ volumes })
        } else if(this.props.ansibleWizardType === "expand_volume") {
            let volumes = this.state.volumes
            volumes.splice(0)
            volumes.push(this.getEmptyRow())
            let that = this
            this.getVolumeInfo(that.props.volumeName, function(volumeInfo){
                volumes[0]["brick_dir"] = "/gluster_bricks/"
                volumes[0]["is_arbiter"] = volumeInfo[that.props.volumeName]["isArbiter"] === true ? 1:0
                volumes[0]["name"] = volumeInfo[that.props.volumeName]["volumeName"]
                volumes[0]["type"] = volumeInfo[that.props.volumeName]["volumeType"].toLowerCase()
              }
            );
            this.setState({ volumes });
        }
    }
    render() {
        const volumeRows = [];
        const that = this
        this.state.volumes.forEach(function (volume, index) {
            volumeRows.push(
                <VolumeRow volume={volume} ansibleWizardType={this.props.ansibleWizardType} isSingleNode={this.state.isSingleNode} key={index} index={index}
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
                        <table className="ansible-wizard-table">
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
                {!(this.props.ansibleWizardType === "expand_volume") &&
                  <a onClick={this.handleAdd} className="col-md-offset-4">
                      <span id="addVolumeButton" className="pficon pficon-add-circle-o">
                          <strong> Add Volume</strong>
                      </span>
                  </a>
                }
                {(this.props.ansibleWizardType === "setup") &&
                    <div className="col-md-offset-2 col-md-8 alert alert-info ansible-wizard-host-ssh-info">
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
    stepName: PropTypes.string.isRequired,
    volumes: PropTypes.array.isRequired
}

const VolumeRow = ({volume, ansibleWizardType, isSingleNode, index, errorMsgs, changeCallBack, deleteCallBack}) => {
    let volumeNameId = "volumeName" + (index+1)
    let volumeGlusterBrickDirId = "volumeGlusterBrickDir" + (index+1)
    const volumeTypes = [{key: "", title: ""}]
    if(isSingleNode) {

      volumeTypes[0].key = "distribute"
      volumeTypes[0].title = "Distribute"
      volume.type = "distribute"
    } else {

      volumeTypes[0].key = "replicate"
      volumeTypes[0].title = "Replicate"
      volume.type = "replicate"
    }
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
                    <input type="text"
                        id={volumeNameId}
                        className="form-control"
                        value={volume.name}
                        onChange={(e) => changeCallBack(index, "name", e.target.value)}
                        disabled={(ansibleWizardType === "expand_volume")?true:false}
                        />
                    {errorMsgs && errorMsgs.name && <span className="help-block">{errorMsgs.name}</span>}
                </div>
            </td>
            <td className="col-md-3">
                <Selectbox optionList={volumeTypes}
                    selectedOption={volume.type}
                    callBack={(e) => changeCallBack(index, "type", e)}
                    ansibleWizardType={ansibleWizardType}
                    tab="volume"
                    />
            </td>
            <td className="col-md-1">
                <input type="checkbox" className="form-control" title="Third host in the host list will be used for creating arbiter bricks"
                    checked={volume.is_arbiter}
                    onChange={(e) => changeCallBack(index, "is_arbiter", e.target.checked)}
                    disabled={(isSingleNode || ansibleWizardType === "expand_volume") ? true : false}
                    />
            </td>
            <td className="col-md-3">
                <div className={brick_dir}>
                    <input type="text"
                        id={volumeGlusterBrickDirId}
                        className="form-control"
                        value={volume.brick_dir}
                        onChange={(e) => changeCallBack(index, "brick_dir", e.target.value)}
                        />
                    {errorMsgs && errorMsgs.brick_dir && <span className="help-block">{errorMsgs.brick_dir}</span>}
                </div>
            </td>
            { ansibleWizardType !== "expand_volume" && <td className="col-sm-1">
                  <a onClick={deleteCallBack}>
                      <span className="pficon pficon-delete ansible-wizard-delete-icon">
                      </span>
                  </a>
              </td>
            }
        </tr>
    )
}
export default WizardVolumesStep
