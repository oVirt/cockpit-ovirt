import React, { Component } from 'react'
import Selectbox from '../common/Selectbox'
import classNames from 'classnames'

const raidTypes = [
    { key: "jbod", title: "JBOD" },
    { key: "raid5", title: "RAID 5" },
    { key: "raid6", title: "RAID 6" },
    { key: "raid10", title: "RAID 10" }
]
class WizardBricksStep extends Component {

    constructor(props) {
        super(props)
        this.state = {
            bricks: props.bricks,
            raidConfig: props.raidConfig,
            lvCacheConfig: props.lvCacheConfig,
            errorMsg: "",
            errorMsgs: {}
        }
        this.handleDelete = this.handleDelete.bind(this)
        this.handleAdd = this.handleAdd.bind(this)
        this.handleUpdate = this.handleUpdate.bind(this)
        this.handleRaidConfigUpdate = this.handleRaidConfigUpdate.bind(this)
        this.handleLvCacheConfig = this.handleLvCacheConfig.bind(this)
    }
    handleDelete(index) {
        const bricks = this.state.bricks
        bricks.splice(index, 1)
        this.setState({ bricks, errorMsgs: {} })
    }
    getEmptyRow() {
        return { name: "", device: "", brick_dir: "", thinp: true, size:"1" }
    }
    handleAdd() {
        const bricks = this.state.bricks
        bricks.push(this.getEmptyRow())
        this.setState({ bricks })
    }
    handleRaidConfigUpdate(property, value) {
        const raidConfig = this.state.raidConfig
        raidConfig[property] = value
        const errorMsgs= this.state.errorMsgs
        this.validateRaidConfig(raidConfig, errorMsgs)
        this.setState({ raidConfig, errorMsgs })
    }
    handleUpdate(index, property, value) {
        const bricks = this.state.bricks
        bricks[index][property] = value
        const errorMsgs= this.state.errorMsgs
        this.validateBrick(bricks[index], index, errorMsgs)
        this.setState({ bricks, errorMsgs })
    }
    validateRaidConfig(raidConfig, errorMsgs){
        let valid = true
        errorMsgs.raidConfig = {}
        if(raidConfig.stripeSize.trim().length < 1){
            errorMsgs.raidConfig.stripeSize = "Enter stripe size"
            valid = false
        }else{
            const stripeSize = Number(raidConfig.stripeSize)
            if(stripeSize < 1){
                errorMsgs.raidConfig.stripeSize = "Invalid stripe size"
                valid = false
            }
        }
        if(raidConfig.diskCount.trim().length < 1){
            errorMsgs.raidConfig.diskCount = "Enter data disk count"
            valid = false
        }else{
            const diskCount = Number(raidConfig.diskCount)
            //Atleast one disk will be present in the RAID/JBOD
            //We are not expecting more than 60 disks an a RAID volume
            if(diskCount < 1 || diskCount > 60 ){
                errorMsgs.raidConfig.diskCount = "Data disk count is invalid"
                valid = false
            }
        }
        return valid
    }

    handleLvCacheConfig(property, value) {
        const lvCacheConfig = this.state.lvCacheConfig
        lvCacheConfig[property] = value
        const errorMsgs= this.state.errorMsgs
        this.validateLvCacheConfig(lvCacheConfig, errorMsgs)
        this.setState({ lvCacheConfig, errorMsgs })
    }

    validateLvCacheConfig(lvCacheConfig, errorMsgs){
      let valid = true
      if(lvCacheConfig != null && lvCacheConfig.lvCache){
        errorMsgs.lvCacheConfig = {}
        if(lvCacheConfig.ssd.trim().length < 1){
            errorMsgs.lvCacheConfig.ssd = "Enter SSD"
            valid = false
        }
        if(lvCacheConfig.lvCacheSize.trim().length < 1){
            errorMsgs.lvCacheConfig.lvCacheSize = "Enter lv cache size"
            valid = false
        }else{
            const lvCacheSize = Number(lvCacheConfig.lvCacheSize)
            if(lvCacheSize < 1){
                errorMsgs.lvCacheConfig.lvCacheSize = "Invalid lv cache size"
                valid = false
            }
        }
        if(lvCacheConfig.cacheMode.trim().length < 1){
            errorMsgs.lvCacheConfig.cacheMode = "Enter cache mode"
            valid = false
        }
      }
      return valid
    }
    // Trim "LV Name","Device Name" and "Mount Point" values
    trimBrickProperties(){
      const inBricks = this.state.bricks
      for(var i =0; i< inBricks.length; i++){
        this.state.bricks[i].name = inBricks[i].name.trim()
        this.state.bricks[i].device = inBricks[i].device.trim()
        this.state.bricks[i].brick_dir = inBricks[i].brick_dir.trim()
      }
    }
    validateBrick(brick, index, errorMsgs){
        let valid  = true
        errorMsgs[index] = {}
        if(brick.name.trim().length <1){
            valid = false
            errorMsgs[index].name = "LV name cannot be empty"
        }
        if(brick.device.trim().length<3){
            errorMsgs[index].device = "Enter correct device name for brick"
            valid = false
        }
        if(brick.size.trim().length<1){
            errorMsgs[index].size = "Brick size cannot be empty"
            valid = false;
        }
        if(brick.brick_dir.trim().length <1){
            errorMsgs[index].brick_dir = "Mount point cannot be empty"
            valid = false;
        }
        return valid
    }
    validate(){
        this.trimBrickProperties()
        let valid = true
        const errorMsgs= {}
        let errorMsg = ""
        if(this.props.glusterModel.volumes.length != this.state.bricks.length){
            valid = false;
            errorMsg = "Brick definition does not match with Volume definition"
        }
        const that = this

        this.state.bricks.forEach(function(brick, index){
            if(!that.validateBrick(brick, index, errorMsgs) && valid ){
                valid = false
            }
        })
        if(!this.validateRaidConfig(this.state.raidConfig, errorMsgs)){
            valid = false
        }
        if(!this.validateLvCacheConfig(this.state.lvCacheConfig, errorMsgs)){
            valid = false
        }
        this.setState({ errorMsg, errorMsgs })
        return valid
    }
    shouldComponentUpdate(nextProps, nextState){
        if(!this.props.validating && nextProps.validating){
            this.props.validationCallBack(this.validate())
        }
        return true;
    }
    render() {
        const bricksRow = []
        const that = this
        this.state.bricks.forEach(function (brick, index) {
            bricksRow.push(
                <BrickRow brick={brick} key={index} index={index}
                    errorMsgs = {that.state.errorMsgs[index]}
                    changeCallBack={this.handleUpdate}
                    deleteCallBack={() => this.handleDelete(index)}
                    />
            )
        }, this)
        const stripeSizeMsg = this.state.errorMsgs.raidConfig ? this.state.errorMsgs.raidConfig.stripeSize : null
        const diskCountMsg = this.state.errorMsgs.raidConfig ? this.state.errorMsgs.raidConfig.diskCount : null
        const stripeSize = classNames(
            "form-group",
            { "has-error": stripeSizeMsg}
        )
        const diskCount = classNames(
            "form-group",
            { "has-error": diskCountMsg}
        )
        const ssdMsg = this.state.errorMsgs.lvCacheConfig ? this.state.errorMsgs.lvCacheConfig.ssd : ""
        const lvCacheSizeMsg = this.state.errorMsgs.lvCacheConfig ? this.state.errorMsgs.lvCacheConfig.lvCacheSize : ""
        const cacheModeMsg = this.state.errorMsgs.lvCacheConfig ? this.state.errorMsgs.lvCacheConfig.cacheMode : ""
        const ssd = classNames(
            "form-group",
            { "has-error": ssdMsg}
        )
        const lvCacheSize = classNames(
            "form-group",
            { "has-error": lvCacheSizeMsg}
        )
        const cacheMode = classNames(
            "form-group",
            { "has-error": cacheModeMsg}
        )
        return (
            <div>
                {this.state.errorMsg && <div className="alert alert-danger">
                    <span className="pficon pficon-error-circle-o"></span>
                    <strong>{this.state.errorMsg}</strong>
                </div>
                }
                <form className="form-horizontal">
                    <div className="panel-heading gdeploy-wizard-section-title">
                        <h3 className="panel-title">Raid Information <span className="fa fa-lg fa-info-circle"
                            title="Enter your hardware RAID configuration details. This information will be used to align brick's LVM configuration with underlying RAID configuration for better I/O performance"></span>
                        </h3>
                    </div>
                    <div className="form-group">
                        <label className="col-md-3 control-label">Raid Type</label>
                        <div className="col-md-2">
                            <Selectbox optionList={raidTypes}
                                selectedOption={this.state.raidConfig.raidType}
                                callBack={(e) => this.handleRaidConfigUpdate("raidType", e)}
                                />
                        </div>
                    </div>
                    <div className={stripeSize}>
                        <label className="col-md-3 control-label">Stripe Size(KB)</label>
                        <div className="col-md-2">
                            <input type="number" className="form-control"
                                value={this.state.raidConfig.stripeSize}
                                onChange={(e) => this.handleRaidConfigUpdate("stripeSize", e.target.value)}
                                />
                            <span className="help-block">{stripeSizeMsg}</span>
                        </div>
                    </div>
                    <div className={diskCount}>
                        <label className="col-md-3 control-label">Data Disk Count</label>
                        <div className="col-md-2">
                            <input type="number" className="form-control" min="1" max="60"
                                value={this.state.raidConfig.diskCount}
                                onChange={(e) => this.handleRaidConfigUpdate("diskCount", e.target.value)}
                                />
                            <span className="help-block">{diskCountMsg}</span>
                        </div>
                    </div>
                {bricksRow.length > 0 &&
                    <div>
                        <div className="panel-heading gdeploy-wizard-section-title">
                            <h3 className="panel-title">Brick Configuration</h3>
                        </div>
                        <table className="gdeploy-wizard-bricks-table">
                            <tbody>
                                <tr className="gdeploy-wizard-bricks-row">
                                    <th>LV Name</th>
                                    <th>Device Name</th>
                                    <th>Size(GB)</th>
                                    <th>Thinp</th>
                                    <th>Mount Point</th>
                                </tr>
                                {bricksRow}
                            </tbody>
                        </table>
                    </div>
                }
                </form>
                <a onClick={this.handleAdd} className="col-md-offset-4">
                    <span className="pficon pficon-add-circle-o">
                        <strong> Add Bricks</strong>
                    </span>
                </a>
                <form className="form-horizontal">
                    <div className="panel-heading gdeploy-wizard-section-title">
                        <input type="checkbox"
                            checked={this.state.lvCacheConfig.lvCache}
                            onChange={(e) => this.handleLvCacheConfig("lvCache", e.target.checked)}
                            />
                        <label className="control-label">&nbsp;&nbsp;Configure LV Cache</label>
                    </div>
                    <div className={ssd}
                      style={this.state.lvCacheConfig.lvCache ? {} : { display: 'none' }}>
                        <label className="col-md-3 control-label">SSD</label>
                        <div className="col-md-2">
                        <input type="text" className="form-control"
                            value={this.state.lvCacheConfig.ssd}
                            onChange={(e) => this.handleLvCacheConfig("ssd", e.target.value)}
                            />
                            <span className="help-block">{ssdMsg}</span>
                        </div>
                    </div>
                    <div className={lvCacheSize}
                      style={this.state.lvCacheConfig.lvCache ? {} : { display: 'none' }}>
                        <label className="col-md-3 control-label">LV Size(GB)</label>
                        <div className="col-md-2">
                            <input type="number" className="form-control"
                                value={this.state.lvCacheConfig.lvCacheSize}
                                onChange={(e) => this.handleLvCacheConfig("lvCacheSize", e.target.value)}
                                />
                                <span className="help-block">{lvCacheSizeMsg}</span>
                        </div>
                    </div>
                    <div className={cacheMode}
                      style={this.state.lvCacheConfig.lvCache ? {} : { display: 'none' }}>
                        <label className="col-md-3 control-label">Cache Mode <span className="fa fa-lg fa-info-circle"
                            title="Caching mode is write-through by default. If cache is configured in other mode, please add input here."></span></label>
                        <div className="col-md-2">
                        <input type="text" className="form-control"
                            value={this.state.lvCacheConfig.cacheMode}
                            onChange={(e) => this.handleLvCacheConfig("cacheMode", e.target.value)}
                            />
                            <span className="help-block">{cacheModeMsg}</span>
                        </div>
                    </div>
                </form>
                <div className="col-md-offset-2 col-md-8 alert alert-info gdeploy-wizard-host-ssh-info">
                    <span className="pficon pficon-info"></span>
                    <strong>
                        Arbiter bricks will be created on the third host in the host list.
                    </strong>
                </div>
            </div>
        )
    }
}

WizardBricksStep.propTypes = {
    stepName: React.PropTypes.string.isRequired,
    glusterModel: React.PropTypes.object.isRequired,
    raidConfig: React.PropTypes.object.isRequired,
    bricks: React.PropTypes.array.isRequired
}

const BrickRow = ({brick, index, errorMsgs, changeCallBack, deleteCallBack}) => {
    const name = classNames(
        { "has-error": errorMsgs && errorMsgs.name }
    )
    const device = classNames(
        { "has-error": errorMsgs && errorMsgs.device }
    )
    const size = classNames(
        { "has-error": errorMsgs && errorMsgs.size }
    )
    const brick_dir = classNames(
        { "has-error": errorMsgs && errorMsgs.brick_dir }
    )
    return (
        <tr className="gdeploy-wizard-bricks-row">
            <td className="col-md-1">
                <div className={name}>
                    <input type="text" className="form-control"
                        value={brick.name}
                        onChange={(e) => changeCallBack(index, "name", e.target.value)}
                        />
                    {errorMsgs && errorMsgs.name && <span className="help-block">{errorMsgs.name}</span>}
                </div>
            </td>
            <td className="col-md-1">
                <div className={device}>
                    <input type="text" placeholder="device name"
                        title="Name of the storage device (e.g sdb) which will be used to create brick"
                        className="form-control"
                        value={brick.device}
                        onChange={(e) => changeCallBack(index, "device", e.target.value)}
                        />
                    {errorMsgs && errorMsgs.device && <span className="help-block">{errorMsgs.device}</span>}
                </div>
            </td>
            <td className="col-md-1">
                <div className={size}>
                    <input type="number" className="form-control"
                        value={brick.size}
                        onChange={(e) => changeCallBack(index, "size", e.target.value)}
                        />
                    {errorMsgs && errorMsgs.size && <span className="help-block">{errorMsgs.size}</span>}
                </div>
            </td>
            <td className="col-md-1">
                <input type="checkbox" className="gdeploy-wizard-thinp-checkbox"
                    checked={brick.thinp}
                    onChange={(e) => changeCallBack(index, "thinp", e.target.checked)}
                    />
            </td>
            <td className="col-md-2">
                <div className={brick_dir}>
                    <input type="text" className="form-control"
                        value={brick.brick_dir}
                        onChange={(e) => changeCallBack(index, "brick_dir", e.target.value)}
                        />
                    {errorMsgs && errorMsgs.brick_dir && <span className="help-block">{errorMsgs.brick_dir}</span>}
                </div>
            </td>
            <td className="col-sm-1 gdeploy-wizard-bricks-delete">
                <a onClick={deleteCallBack}>
                    <span className="pficon pficon-delete gdeploy-wizard-delete-icon">
                    </span>
                </a>
            </td>
        </tr>
    )
}

export default WizardBricksStep
