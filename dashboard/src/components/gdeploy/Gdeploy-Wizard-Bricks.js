import React, { Component } from 'react'
import Selectbox from '../common/Selectbox'
import classNames from 'classnames'
import GdeployUtil from '../../helpers/GdeployUtil'

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
            bricksList: props.bricks,
            raidConfig: props.raidConfig,
            hostTypes: [],
            selectedHost: {hostName: "", hostIndex: 0},
            enabledFields: ['name', 'device', 'brick_dir', 'size', 'thinp'],
            hostArbiterVolumes: [],
            arbiterVolumes: [],
            lvCacheConfig: props.lvCacheConfig,
            cacheMode: "writethrough",
            cacheModeOption: [{ key: "writethrough", title: "writethrough" }, { key: "writeback", title: "writeback" }],
            selectedCacheModeOption: {cacheMode: "writethrough", cacheModeIndex: 0},
            errorMsg: "",
            errorMsgs: {}
        }
        this.handleDelete = this.handleDelete.bind(this)
        this.handleAdd = this.handleAdd.bind(this)
        this.handleUpdate = this.handleUpdate.bind(this)
        this.handleRaidConfigUpdate = this.handleRaidConfigUpdate.bind(this)
        this.handleLvCacheConfig = this.handleLvCacheConfig.bind(this)
        this.handleSelectedHostUpdate = this.handleSelectedHostUpdate.bind(this)
        this.updateBrickHosts = this.updateBrickHosts.bind(this)
        this.updateBrickDetails = this.updateBrickDetails.bind(this)
        this.updateArbiterHostBricks = this.updateArbiterHostBricks.bind(this)
        this.handleCacheModeChange = this.handleCacheModeChange.bind(this)
    }
    componentDidMount(){
        let bricksList = this.state.bricksList

        // Set bricks size to 500 if gdeployType is create_volume or expand_cluster
        if (this.props.gdeployWizardType === "create_volume" || this.props.gdeployWizardType === "expand_cluster") {
            bricksList[0].host_bricks[0].thinp = true
            bricksList[0].host_bricks[0].size = "500"
        }

        bricksList.push(JSON.parse(JSON.stringify(bricksList[0])))
        bricksList.push(JSON.parse(JSON.stringify(bricksList[0])))

        let lvCacheConfig = this.state.lvCacheConfig
        lvCacheConfig.push(JSON.parse(JSON.stringify(this.props.lvCacheConfig[0])))
        lvCacheConfig.push(JSON.parse(JSON.stringify(this.props.lvCacheConfig[0])))

        // Checking for arbiter volumes
        let arbiterVolumes = []
        this.props.glusterModel.volumes.forEach(function(volume, index) {
            if(volume.is_arbiter){
                arbiterVolumes.push(volume.name)
            }
        })
        let enabledFields = this.state.enabledFields
        if (this.props.gdeployWizardType === "setup") {
            enabledFields = ['device', 'size']
        }
        this.setState({bricksList, arbiterVolumes, enabledFields})

        // Checking for VDO support
        let isVdoSupported = false
        let that = this
        GdeployUtil.isVdoSupported(function(res){
            isVdoSupported = res
            bricksList.forEach(function(bricksHost, hostIndex){
                bricksHost.host_bricks.forEach(function(brick, index){
                    brick['isVdoSupported'] = res
                })
                if (that.props.gdeployWizardType !== "setup") {
                  bricksHost.host_bricks[0].logicalSize = "5000"
                }
            })
            that.setState({bricksList, lvCacheConfig, arbiterVolumes, isVdoSupported})
        });
    }
    componentWillReceiveProps(nextProps){
        // Checking if hosts have changed
        let hostsHaveChanged = false
        if(nextProps.hosts.length !== this.state.hostTypes.length) {
            hostsHaveChanged = true
        }else{
            for(var i = 0; i < nextProps.hosts.length; i++) {
                if(nextProps.hosts[i] !== this.state.hostTypes[i].title){
                    hostsHaveChanged = true;
                    break;
                }
            }
        }

        // Updating hostTypes, bricksList and lvCacheConfig if hosts have changed
        if(hostsHaveChanged){
            this.updateBrickHosts(nextProps.hosts)
        }

        // Modify bricks according to volume details
        let new_volumes = []
        let new_brick_dirs = []
        nextProps.glusterModel.volumes.forEach(function (volume, index) {
          new_volumes.push(volume.name)

          // Get volume brick_dir in the form of bricksList brick_dir
          let brick_dir = ""
          let brick_dir_split = volume.brick_dir.split('/')
          let length = brick_dir_split.length
          let lastIndex = volume.brick_dir.lastIndexOf('/')
          if (brick_dir_split[length - 1] === brick_dir_split[length - 2]) {
              brick_dir = volume.brick_dir.slice(0, lastIndex)
          }
          else {
              brick_dir = volume.brick_dir
          }
          new_brick_dirs.push(brick_dir)
        })
        let old_volumes = []
        let old_brick_dirs = []
        this.state.bricksList[0].host_bricks.forEach(function (brick, index) {
          old_volumes.push(brick.name)
          old_brick_dirs.push(brick.brick_dir)
        })
        if (old_volumes.join() != new_volumes.join() ||
            old_brick_dirs.join() != new_brick_dirs.join()) {
                this.updateBrickDetails(nextProps.glusterModel.volumes)
        }

        // Check for arbiter volume and update respective brick in the arbiter host
        let arbiterVolumes = []
        nextProps.glusterModel.volumes.forEach(function(volume, index) {
            if(volume.is_arbiter){
                arbiterVolumes.push(volume.name)
            }
        })
        if (arbiterVolumes.join() != this.state.arbiterVolumes.join()) {
            this.updateArbiterHostBricks(arbiterVolumes, nextProps.glusterModel.volumes)
        }
        this.handleSelectedHostUpdate(nextProps.hosts[0])
    }
    updateBrickHosts(hosts){
        let hostTypes = []
        let bricksList = []
        let lvCacheConfig = this.state.lvCacheConfig
        let that = this
        hosts.map(function(host, i) {
            let hostType = {key: host, title: host}
            hostTypes.push(hostType)
            let brickHost = that.state.bricksList[i]
            brickHost.host = host
            bricksList.push(brickHost)
            lvCacheConfig[i].host = host
        })
        this.setState({hostTypes, bricksList, lvCacheConfig})
    }
    updateBrickDetails(newVolumes){
        let that = this
        let newHostBricks = []
        let brickTemplate = this.getEmptyRow()
        newVolumes.forEach(function (volume, index) {
            brickTemplate.name = volume.name
            brickTemplate.device = "sdb"
            let brick_dir_split = volume.brick_dir.split('/')
            let length = brick_dir_split.length
            let lastIndex = volume.brick_dir.lastIndexOf('/')
            if (brick_dir_split[length - 1] === brick_dir_split[length - 2]) {
                brickTemplate.brick_dir = volume.brick_dir.slice(0, lastIndex)
            }
            else {
                brickTemplate.brick_dir = volume.brick_dir
            }
            if (that.props.gdeployWizardType === "setup" && volume.name === "engine") {
                brickTemplate.size = "100"
                brickTemplate.thinp = false
                brickTemplate.logicalSize = "1000"
            }
            else {
                brickTemplate.size = "500"
                brickTemplate.thinp = true
                brickTemplate.logicalSize = "5000"
            }
            newHostBricks.push(JSON.parse(JSON.stringify(brickTemplate)))
        })

        let bricksList = this.state.bricksList
        bricksList.forEach(function (bricksHost, hostIndex) {
            bricksHost.host_bricks = JSON.parse(JSON.stringify(newHostBricks))
        })
        this.setState({ bricksList })
    }
    updateArbiterHostBricks(arbiterVolumes, volumes){
        let bricksList = this.state.bricksList
        let bricksHaveChanged = false
        volumes.forEach(function(volume, index) {
            if((this.state.arbiterVolumes.indexOf(volume.name) < 0 ^ arbiterVolumes.indexOf(volume.name) < 0) == 1){
                if(volume.is_arbiter){
                    let arbiterBrickSize = GdeployUtil.getArbiterBrickSize(parseInt(bricksList[2].host_bricks[index].size))
                    bricksList[2].host_bricks[index].size = JSON.stringify(arbiterBrickSize)
                    bricksList[2].host_bricks[index].logicalSize = JSON.stringify(arbiterBrickSize * 10)
                }
                else{
                    if (this.props.gdeployWizardType === "setup" && bricksList[2].host_bricks[index].name === "engine") {
                        bricksList[2].host_bricks[index].size = "100"
                        bricksList[2].host_bricks[index].logicalSize = "1000"
                    } else {
                        bricksList[2].host_bricks[index].size = "500"
                        bricksList[2].host_bricks[index].logicalSize = "5000"
                    }
                }
                bricksHaveChanged = true
            }
        }, this)
        if(bricksHaveChanged){
            this.setState({bricksList, arbiterVolumes})
        }
    }
    handleDelete(index) {
        const bricksList = this.state.bricksList
        bricksList.forEach(function (bricksHost, hostIndex) {
            bricksHost.host_bricks.splice(index, 1)
        })
        this.setState({ bricksList, errorMsgs: {} })
    }
    getEmptyRow() {
        let isVdoSupported = this.state.isVdoSupported
        return { name: "", device: "", brick_dir: "", thinp: true, size:"1", is_vdo_supported: false, logicalSize: "0", isVdoSupported: isVdoSupported }
    }
    handleAdd() {
        let bricksList = this.state.bricksList
        let newBricksList = []
        let newBrickRow = this.getEmptyRow()
        bricksList.forEach(function (brickHost, i) {
            let newBrickHost = JSON.parse(JSON.stringify(brickHost))
            newBrickHost.host_bricks.push(newBrickRow)
            newBricksList.push(newBrickHost)
        })
        this.setState({bricksList: newBricksList})
    }
    handleRaidConfigUpdate(property, value) {
        const raidConfig = this.state.raidConfig
        raidConfig[property] = value
        const errorMsgs= this.state.errorMsgs
        this.validateRaidConfig(raidConfig, errorMsgs)
        this.setState({ raidConfig, errorMsgs })
    }
    getHostIndex(hostName){
        const hostIndex = this.state.bricksList.findIndex(function(brickHost){
            return brickHost.host === hostName
        })
        return hostIndex
    }
    handleSelectedHostUpdate(value){
        let hostIndex = this.getHostIndex(value)
        let selectedHost = this.state.selectedHost
        selectedHost.hostName = value
        selectedHost.hostIndex = hostIndex
        let hostArbiterVolumes = []
        this.props.glusterModel.volumes.forEach(function(volume, index) {
            if(volume.is_arbiter == true && hostIndex == 2){
                hostArbiterVolumes.push(volume.name)
            }
        })
        let enabledFields = Object.keys(this.state.bricksList[0].host_bricks[0])
        if (this.props.gdeployWizardType === "setup") {
            if(hostIndex % 3 == 0) {
              enabledFields = ['device', 'size']
            }
            else {
              enabledFields = ['device']
            }
        }
        this.setState({selectedHost, enabledFields, hostArbiterVolumes})
    }
    handleUpdate(index, property, value) {
        let bricksList = this.state.bricksList
        const errorMsgs= this.state.errorMsgs
        let that = this
        if (property == "is_vdo_supported" && value) {
            bricksList.forEach(function (bricks) {
                bricks.host_bricks.forEach(function(eachBrick) {
                  eachBrick.is_vdo_supported = true
                })
            })
        } else {
          bricksList.forEach(function (bricks) {
              bricks.host_bricks.forEach(function(eachBrick) {
                eachBrick.is_vdo_supported = false
              })
          })
        }
        if (property == "is_vdo_supported") {
            bricksList[that.state.selectedHost.hostIndex].host_bricks.forEach(function (brick, brickIndex) {
                if (brick['device'] == bricksList[that.state.selectedHost.hostIndex].host_bricks[index]['device']) {
                    brick[property] = value
                }
            })
        }
        else if (property == "logicalSize") {
            bricksList[this.state.selectedHost.hostIndex].host_bricks[index][property] = value
        }
        else {
            for(var i = 2; i >= this.state.selectedHost.hostIndex; i--){
                if(this.state.selectedHost.hostIndex != 2 && this.props.glusterModel.volumes[index].is_arbiter && i == 2 && property == 'size'){
                    const arbiterValue = GdeployUtil.getArbiterBrickSize(parseInt(value))
                    bricksList[i].host_bricks[index][property] = JSON.stringify(arbiterValue)
                }
                else {
                    bricksList[i].host_bricks[index][property] = value
                }
                if(property == "size") {
                    bricksList[i].host_bricks[index]['logicalSize'] = JSON.stringify(bricksList[i].host_bricks[index][property] * 10)
                }
                if (property == "device") {
                    let device = bricksList[i].host_bricks[index][property]
                    let isDeviceVdoEnabled = bricksList[i].host_bricks.some((brick, brickIndex) => {
                        return (brickIndex != index && brick["device"] == device &&  brick["is_vdo_supported"])
                    })
                    bricksList[i].host_bricks[index]["is_vdo_supported"] = isDeviceVdoEnabled
                }
            }
        }
        this.validateBrick(bricksList[this.state.selectedHost.hostIndex].host_bricks[index], index, errorMsgs)
        this.setState({ bricksList, errorMsgs })
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
      const that =this
      const lvCacheConfig = []
        if(value) {
          that.state.lvCacheConfig.forEach(function(eachConfig) {
            eachConfig.lvCache = true
            lvCacheConfig.push(eachConfig)
          })
        } else {
          that.state.lvCacheConfig.forEach(function(eachConfig) {
            eachConfig.lvCache = false
            lvCacheConfig.push(eachConfig)
          })
        }
        const lvCacheConfigIndex = lvCacheConfig.findIndex(function(hostLvCacheConfig){
            return hostLvCacheConfig.host == this.state.selectedHost.hostName
        }, this)
        lvCacheConfig[lvCacheConfigIndex][property] = value
        const errorMsgs= this.state.errorMsgs
        this.validateLvCacheConfig(lvCacheConfig[lvCacheConfigIndex], errorMsgs)
        this.setState({ lvCacheConfig, errorMsgs })
    }

    handleCacheModeChange(value) {
      this.handleLvCacheConfig( "cacheMode", value)
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
        this.state.bricksList.forEach(function(bricksHost, index) {
            const inBricks = bricksHost.host_bricks
            for(var i =0; i< inBricks.length; i++){
                this.state.bricksList[index].host_bricks[i].name = inBricks[i].name.trim()
                this.state.bricksList[index].host_bricks[i].device = inBricks[i].device.trim()
                this.state.bricksList[index].host_bricks[i].brick_dir = inBricks[i].brick_dir.trim()
            }
        }, this)
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
        if(brick.is_vdo_supported && brick.logicalSize.trim().length<1){
            errorMsgs[index].logicalSize = "Logical size cannot be empty"
            valid = false;
        }else{
            const logicalSize = Number(brick.logicalSize)
            const brickSize = Number(brick.size)
            if(brick.is_vdo_supported && logicalSize < brickSize){
                errorMsgs[index].logicalSize = "Logical size should be greater or equals to brick size"
                valid = false
            }
        }
        return valid
    }
    validate(){
        this.trimBrickProperties()
        let valid = true
        const errorMsgs= {}
        let errorMsg = ""
        this.state.bricksList.forEach(function(bricksHost, hostIndex){
            if(this.props.glusterModel.volumes.length != bricksHost.host_bricks.length){
              valid = false;
              errorMsg = "Brick definition does not match with Volume definition"
            }
            const that = this

            bricksHost.host_bricks.forEach(function(brick, index){
              if(!that.validateBrick(brick, index, errorMsgs) && valid ){
                valid = false
              }
            })
        }, this)
        if(!this.validateRaidConfig(this.state.raidConfig, errorMsgs)){
            valid = false
        }
        this.state.lvCacheConfig.forEach(function(hostLvCacheConfig, hostIndex) {
            if(!this.validateLvCacheConfig(hostLvCacheConfig, errorMsgs)){
              valid = false
            }
        }, this)
        this.setState({ errorMsg, errorMsgs })
        return valid
    }
    isAllDeviceSame(){
      var deviceList = []
      this.state.bricks.forEach(function (brick, index) {
        deviceList.push(brick.device)
      })
      var checkItem = deviceList[0]
      var isSame = true;
      for (var i = 0; i < deviceList.length; i++) {
        if (deviceList[i] != checkItem) {
          isSame = false
          break
        }
      }
      return isSame
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
        let isVdoSupported = false
        let is_same_device = this.isAllDeviceSame()

        this.state.bricksList[this.state.selectedHost.hostIndex].host_bricks.forEach(function (brick, index) {
            if(brick.is_vdo_supported){
              isVdoSupported = true
            }

            bricksRow.push(
                <BrickRow hostIndex={this.state.selectedHost.hostIndex}
                    enabledFields={this.state.enabledFields}
                    hostArbiterVolumes={this.state.hostArbiterVolumes} brick={brick} key={index} index={index}
                    errorMsgs = {that.state.errorMsgs[index]}
                    changeCallBack={this.handleUpdate}
                    deleteCallBack={() => this.handleDelete(index)}
                    gdeployWizardType={this.props.gdeployWizardType}
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
                        <div className="form-group">
                          <label className="col-md-2 control-label">Select Host</label>
                          <div className="col-md-4">
                            {
                              (this.state.hostTypes.length <= 0) ? null :
                              <Selectbox optionList={this.state.hostTypes}
                                selectedOption={this.state.selectedHost.hostName}
                                callBack={(e) => this.handleSelectedHostUpdate(e)}
                                />
                            }
                          </div>
                        </div>
                        <hr />
                        <table className="gdeploy-wizard-bricks-table">
                            <tbody>
                                <tr className="gdeploy-wizard-bricks-row">
                                    <th>LV Name</th>
                                    <th>Device Name</th>
                                    <th>Size(GB)</th>
                                    <th>Thinp</th>
                                    <th>Mount Point</th>
                                    <th style={this.state.isVdoSupported ? {} : { display: 'none' }}>Enable Dedupe & Compression</th>
                                    <th style={isVdoSupported ? {} : { display: 'none' }}>Logical Size(GB)</th>
                                </tr>
                                {bricksRow}
                            </tbody>
                        </table>
                    </div>
                }
                </form>
                {this.props.gdeployWizardType !== "setup" &&
                    <a onClick={this.handleAdd} className="col-md-offset-4">
                        <span className="pficon pficon-add-circle-o">
                            <strong> Add Bricks</strong>
                        </span>
                    </a>
                }
                <form className="form-horizontal">
                    <div className="panel-heading gdeploy-wizard-section-title">
                        <input type="checkbox"
                            checked={this.state.lvCacheConfig[this.state.selectedHost.hostIndex].lvCache}
                            onChange={(e) => this.handleLvCacheConfig("lvCache", e.target.checked)}
                            />
                        <label className="control-label">&nbsp;&nbsp;Configure LV Cache</label>
                    </div>
                    <div className={ssd}
                      style={this.state.lvCacheConfig[this.state.selectedHost.hostIndex].lvCache ? {} : { display: 'none' }}>
                        <label className="col-md-3 control-label">SSD</label>
                        <div className="col-md-3">
                        <input type="text" className="form-control"
                            value={this.state.lvCacheConfig[this.state.selectedHost.hostIndex].ssd}
                            onChange={(e) => this.handleLvCacheConfig("ssd", e.target.value)}
                            />
                            <span className="help-block">{ssdMsg}</span>
                        </div>
                    </div>
                    <div className={lvCacheSize}
                      style={this.state.lvCacheConfig[this.state.selectedHost.hostIndex].lvCache ? {} : { display: 'none' }}>
                        <label className="col-md-3 control-label">LV Size(GB)</label>
                        <div className="col-md-3">
                            <input type="number" className="form-control"
                                value={this.state.lvCacheConfig[this.state.selectedHost.hostIndex].lvCacheSize}
                                onChange={(e) => this.handleLvCacheConfig("lvCacheSize", e.target.value)}
                                />
                                <span className="help-block">{lvCacheSizeMsg}</span>
                        </div>
                    </div>
                    <div className={cacheMode}
                      style={this.state.lvCacheConfig[this.state.selectedHost.hostIndex].lvCache ? {} : { display: 'none' }}>
                        <label className="col-md-3 control-label">Cache Mode <span className="fa fa-lg fa-info-circle"
                            title="Caching mode is write-through by default. If cache is configured in other mode, please add input here."></span></label>
                        <div className="col-md-3">
                        <Selectbox optionList={this.state.cacheModeOption}
                          selectedOption={this.state.selectedCacheModeOption.cacheMode}
                          callBack={(e) => this.handleCacheModeChange(e)}
                          />
                            <span className="help-block">{cacheModeMsg}</span>
                        </div>
                    </div>
                </form>
                <div className="col-md-offset-2 col-md-8 alert alert-warning" style={isVdoSupported && is_same_device ? {} : { display: 'none' }}>
                    <span className="pficon pficon-info"></span>
                    <strong>
                        Dedupe/compression is enabled at the storage device, and will be applicable for all bricks that use the device.
                    </strong>
                </div>
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
    bricks: React.PropTypes.array.isRequired,
    hosts: React.PropTypes.array.isRequired,
    lvCacheConfig: React.PropTypes.array.isRequired
}

const BrickRow = ({hostIndex, enabledFields, hostArbiterVolumes, brick, index, errorMsgs, changeCallBack, deleteCallBack, gdeployWizardType}) => {
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
    const logicalSize = classNames(
        { "has-error": errorMsgs && errorMsgs.logicalSize }
    )
    return (
        <tr className="gdeploy-wizard-bricks-row">
            <td className="col-md-1">
                <div className={name}>
                    <input type="text" className="form-control"
                        value={brick.name}
                        onChange={(e) => changeCallBack(index, "name", e.target.value)}
                        disabled={(enabledFields.indexOf('name') >= 0) ? false : true}
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
                        disabled={(enabledFields.indexOf('device') >= 0) ? false : true}
                        />
                    {errorMsgs && errorMsgs.device && <span className="help-block">{errorMsgs.device}</span>}
                </div>
            </td>
            <td className="col-md-1">
                <div className={size}>
                    <input type="number" className="form-control"
                        value={brick.size}
                        onChange={(e) => changeCallBack(index, "size", e.target.value)}
                        disabled={(enabledFields.indexOf('size') >= 0 || hostArbiterVolumes.indexOf(brick.name) >= 0 ) ? false : true}
                        />
                    {errorMsgs && errorMsgs.size && <span className="help-block">{errorMsgs.size}</span>}
                </div>
            </td>
            <td className="col-md-1">
                <input type="checkbox" className="gdeploy-wizard-thinp-checkbox"
                    checked={brick.thinp}
                    onChange={(e) => changeCallBack(index, "thinp", e.target.checked)}
                    disabled={(enabledFields.indexOf('thinp') >= 0) ? false : true}
                    />
            </td>
            <td className="col-md-2">
                <div className={brick_dir}>
                    <input type="text" className="form-control"
                        value={brick.brick_dir}
                        onChange={(e) => changeCallBack(index, "brick_dir", e.target.value)}
                        disabled={(enabledFields.indexOf('brick_dir') >= 0) ? false : true}
                        />
                    {errorMsgs && errorMsgs.brick_dir && <span className="help-block">{errorMsgs.brick_dir}</span>}
                </div>
            </td>
            <td className="col-md-1" className="col-md-1" style={brick.isVdoSupported ? {} : { display: 'none' }}>
                <input type="checkbox" className="gdeploy-wizard-thinp-checkbox" title="Configure dedupe & compression using VDO."
                    checked={brick.is_vdo_supported}
                    onChange={(e) => changeCallBack(index, "is_vdo_supported", e.target.checked)}
                    />
            </td>
            <td className="col-md-1" style={brick.is_vdo_supported ? {} : { display: 'none' }}>
                <div className={logicalSize}>
                    <input type="number" className="form-control" title="Default logical size will be four times of brick size."
                        value={brick.logicalSize}
                        onChange={(e) => changeCallBack(index, "logicalSize", e.target.value)}
                        />
                    {errorMsgs && errorMsgs.logicalSize && <span className="help-block">{errorMsgs.logicalSize}</span>}
                </div>
            </td>
            <td className="col-sm-1 gdeploy-wizard-bricks-delete">
                {gdeployWizardType !== "setup" &&
                    <a onClick={deleteCallBack}>
                        <span className="pficon pficon-delete gdeploy-wizard-delete-icon">
                        </span>
                    </a>
                }
            </td>
        </tr>
    )
}

export default WizardBricksStep
