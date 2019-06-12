import PropTypes from 'prop-types';
import React, { Component } from 'react'
import Selectbox from '../common/Selectbox'
import classNames from 'classnames'
import AnsibleUtil from '../../helpers/AnsibleUtil'

const raidTypes = [
    { key: "JBOD", title: "JBOD" },
    { key: "RAID5", title: "RAID 5" },
    { key: "RAID6", title: "RAID 6" }
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
            cacheModeOptions: [{ key: "writethrough", title: "writethrough" }, { key: "writeback", title: "writeback" }],
            glusterModel: props.glusterModel,
            thinpoolName: "",
            thinpoolOptions: [],
            errorMsg: "",
            errorMsgs: {}
        }
        this.handleDelete = this.handleDelete.bind(this)
        this.handleUpdate = this.handleUpdate.bind(this)
        this.handleRaidConfigUpdate = this.handleRaidConfigUpdate.bind(this)
        this.handleLvCacheConfig = this.handleLvCacheConfig.bind(this)
        this.handleSelectedHostUpdate = this.handleSelectedHostUpdate.bind(this)
        this.updateBrickHosts = this.updateBrickHosts.bind(this)
        this.updateBrickDetails = this.updateBrickDetails.bind(this)
        this.updateArbiterHostBricks = this.updateArbiterHostBricks.bind(this)
        this.handleCacheModeChange = this.handleCacheModeChange.bind(this)
        this.handleThinPoolChange = this.handleThinPoolChange.bind(this)
    }
    componentDidMount(){
        let bricksList = this.state.bricksList
        while (bricksList.length < this.props.glusterModel.hosts.length){
          bricksList.push(JSON.parse(JSON.stringify(bricksList[0])));
        }

        // Set bricks size to 500 if ansibleType is create_volume or expand_cluster
        if (this.props.ansibleWizardType === "create_volume" || this.props.ansibleWizardType === "expand_cluster") {
            bricksList[0].host_bricks[0].thinp = true
            bricksList[0].host_bricks[0].size = "500"
        }

        let lvCacheConfig = this.state.lvCacheConfig;
        while (lvCacheConfig.length < this.props.glusterModel.hosts.length){
          lvCacheConfig.push(JSON.parse(JSON.stringify(this.props.lvCacheConfig[0])));
        }

        // Checking for arbiter volumes
        let arbiterVolumes = []
        this.props.glusterModel.volumes.forEach(function(volume, index) {
            if(volume.is_arbiter){
                arbiterVolumes.push(volume.name)
            }
        })
        let enabledFields = this.state.enabledFields
        if (this.props.ansibleWizardType === "setup") {
            enabledFields = ['device', 'size']
        } else {
            enabledFields = ['name', 'device', 'brick_dir', 'size']
        }
        this.setState({bricksList, arbiterVolumes, enabledFields})
        // Checking for VDO support
        let isVdoSupported = false
        let that = this
        AnsibleUtil.isVdoSupported(function(res){
            isVdoSupported = res
            bricksList.forEach(function(bricksHost, hostIndex){
                bricksHost.host_bricks.forEach(function(brick, index){
                    brick['isVdoSupported'] = res
                })
                if (that.props.ansibleWizardType !== "setup") {
                  bricksHost.host_bricks[0].logicalSize = "5000"
                }
            })
            that.setState({bricksList, lvCacheConfig, arbiterVolumes, isVdoSupported})
        });
        that.state.thinpoolOptions.push({key: "--select--", title: "--select--"}, {key: "sdb", title: "sdb"})
    }
    componentWillReceiveProps(nextProps){
        if(this.props.ansibleWizardType === "expand_volume") {
            let hostTypes = this.state.hostTypes
            hostTypes = []
            let hosts = this.state.hosts
            hosts = []
            let expandVolumeHosts = this.props.expandVolumeHosts
            if(expandVolumeHosts.length > 0 && expandVolumeHosts.length%3 === 0) {
                expandVolumeHosts.forEach(function(value, index) {
                    let host = value
                    let hostType = {key: value, title: value}
                    hosts.push(host)
                    hostTypes.push(hostType)
                })
                this.setState({ hosts, hostTypes })
            }
        }

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
            if(this.props.ansibleWizardType === "expand_volume" && this.props.expandVolumeHosts.length > 0 && this.props.expandVolumeHosts.length%3 === 0) {
              this.updateBrickHosts(this.props.expandVolumeHosts)
            } else {
              this.updateBrickHosts(nextProps.hosts)
            }
        }

        // Modify bricks according to volume details
        let new_volumes = []
        let new_brick_dirs = []
        let old_volumes = []
        let old_brick_dirs = []
        
        if(this.props.ansibleWizardType === "expand_volume") {
          // Modify bricks according to volume details
          nextProps.glusterModel.volumes.forEach(function (volume, index) {

            // Get volume brick_dir in the form of bricksList brick_dir
            let brick_dir = ""
            let brick_dir_split = volume.brick_dir.split('/')
            let length = brick_dir_split.length
            let lastIndex = volume.brick_dir.lastIndexOf('/')
            brick_dir = volume.brick_dir.slice(0, lastIndex)
            new_volumes.push(volume.brick_dir.split('/')[3])
            new_brick_dirs.push(brick_dir)
          })
          this.state.bricksList[0].host_bricks.forEach(function (brick, index) {
            old_volumes.push(brick.name)
            old_brick_dirs.push(brick.brick_dir)
          })
        } else {
          // Modify bricks according to volume details
          nextProps.glusterModel.volumes.forEach(function (volume, index) {
            new_volumes.push(volume.name)

            // Get volume brick_dir in the form of bricksList brick_dir
            let brick_dir = ""
            let brick_dir_split = volume.brick_dir.split('/')
            let length = brick_dir_split.length
            let lastIndex = volume.brick_dir.lastIndexOf('/')
            brick_dir = volume.brick_dir.slice(0, lastIndex)
            new_brick_dirs.push(brick_dir)
          })
          this.state.bricksList[0].host_bricks.forEach(function (brick, index) {
            old_volumes.push(brick.name)
            old_brick_dirs.push(brick.brick_dir)
          })
        }

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
          if(that.props.ansibleWizardType === "expand_volume") {
              let brick_dir_split = volume.brick_dir.split('/')
              let length = brick_dir_split.length
              let lastIndex = volume.brick_dir.lastIndexOf('/')
              brickTemplate.name = brick_dir_split[3]
              brickTemplate.brick_dir = volume.brick_dir.slice(0, lastIndex)
              brickTemplate.device = "/dev/sdb"
          } else {
              brickTemplate.name = volume.name
              let brick_dir_split = volume.brick_dir.split('/')
              let length = brick_dir_split.length
              let lastIndex = volume.brick_dir.lastIndexOf('/')
              brickTemplate.brick_dir = volume.brick_dir.slice(0, lastIndex)
              brickTemplate.device = "/dev/sdb"
          }
          if (that.props.ansibleWizardType === "setup" && volume.name === "engine") {
              brickTemplate.size = "100"
              brickTemplate.thinp = false
              brickTemplate.logicalSize = "1000"
          } else if(that.props.ansibleWizardType === "expand_volume") {
              brickTemplate.size = "500"
              brickTemplate.thinp = true
              brickTemplate.logicalSize = "5000"
          } else {
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
                    let arbiterBrickSize = AnsibleUtil.getArbiterBrickSize(parseInt(bricksList[2].host_bricks[index].size))
                    bricksList[2].host_bricks[index].size = JSON.stringify(arbiterBrickSize)
                    bricksList[2].host_bricks[index].logicalSize = JSON.stringify(arbiterBrickSize * 10)
                }
                else{
                    if (this.props.ansibleWizardType === "setup" && bricksList[2].host_bricks[index].name === "engine") {
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
    handleRaidConfigUpdate(property, value) {
        const raidConfig = this.state.raidConfig
        raidConfig[property] = value
        const errorMsgs= this.state.errorMsgs
        if(value == "JBOD") {
          raidConfig["stripeSize"] = ""
          raidConfig["diskCount"] = ""
        } else if (value == "RAID5" || value == "RAID6"){
          raidConfig["stripeSize"] = "256"
          raidConfig["diskCount"] = "12"
        }
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
        if (this.props.ansibleWizardType === "setup" || this.props.ansibleWizardType === "expand_volume") {
          enabledFields = ['device', 'size']
        } else {
          enabledFields = ['name', 'device', 'brick_dir', 'size']
        }
        let thinpName = "";
        const that = this;
        const thinpoolOptions = [];
        that.state.thinpoolOptions = [{key: "--select--", title: "--select--"}]
        that.state.bricksList.forEach(function(eachBrick){
          if(eachBrick.host === value){
            eachBrick.host_bricks.forEach(function(brick) {
              if(brick['thinp']) {
                thinpName = brick['device'].split("/").pop();
                if(thinpoolOptions.indexOf(thinpName) == -1) {
                  thinpoolOptions.push(thinpName);
                  that.state.thinpoolOptions.push({key: thinpName, title: thinpName})
                }
              }
            })
          }
        })
        this.setState({selectedHost, enabledFields, hostArbiterVolumes})
    }
    handleUpdate(index, property, value, selectedBrick) {
        let thinpName = "";
        const thinpoolOptions = [];
        let selectedHost = this.state.selectedHost
        let bricksList = this.state.bricksList
        const errorMsgs= this.state.errorMsgs
        let that = this
        that.state.thinpoolOptions = [{key: "--select--", title: "--select--"}]
        if(this.props.ansibleWizardType === "expand_volume") {
          bricksList.forEach(function(brick) {
              brick.host_bricks[index][property] = value
          })
          bricksList.forEach(function (eachBrick) {
            eachBrick.host_bricks.forEach(function (brick) {
              if(brick['thinp']) {
                thinpName = brick['device'].split("/").pop();
                if(thinpoolOptions.indexOf(thinpName) == -1) {
                  thinpoolOptions.push(thinpName);
                  that.state.thinpoolOptions.push({key: thinpName, title: thinpName})
                }
              }
            })
          })
          this.setState({ bricksList, errorMsgs })
          this.validateBrick(bricksList, index, errorMsgs)
        } else {
          if (property == "is_vdo_supported") {
            bricksList.forEach(function (eachBrick) {
              eachBrick.host_bricks.forEach(function (brick, brickIndex) {
                if(!value) {
                  bricksList[selectedHost.hostIndex].host_bricks.forEach(function (currentBrick) {
                    if(selectedBrick['device'] === currentBrick['device']) {
                      currentBrick[property] = value
                      if(that.props.ansibleWizardType == "setup" && eachBrick.host_bricks[0].name != brick.name && !brick.is_vdo_supported) {
                        brick.thinp = true
                      }
                    }
                  })
                }
                else if (brick['device'] == eachBrick.host_bricks[index]['device']) {
                      brick[property] = value
                      if(that.props.ansibleWizardType == "setup" && eachBrick.host_bricks[0].name != brick.name && brick.is_vdo_supported) {
                        brick.thinp = true
                      }
                  }
              })
            })
          }
          else if (property == "logicalSize") {
              bricksList[selectedHost.hostIndex].host_bricks[index][property] = value
          }
          else {
              for(var i = 2; i >= selectedHost.hostIndex; i--){
                  if(selectedHost.hostIndex != 2 && this.props.glusterModel.volumes[index].is_arbiter && i == 2 && property == 'size'){
                      const arbiterValue = AnsibleUtil.getArbiterBrickSize(parseInt(value))
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
          bricksList.forEach(function (eachBrick) {
            eachBrick.host_bricks.forEach(function (brick) {
              if(brick['thinp']) {
                thinpName = brick['device'].split("/").pop();
                if(thinpoolOptions.indexOf(thinpName) == -1) {
                  thinpoolOptions.push(thinpName);
                  that.state.thinpoolOptions.push({key: thinpName, title: thinpName})
                }
              }
            })
          })
          this.validateBrick(bricksList[selectedHost.hostIndex].host_bricks[index], index, errorMsgs)
          this.setState({ bricksList, errorMsgs })
        }
    }
    validateRaidConfig(raidConfig, errorMsgs){
        let valid = true
        errorMsgs.raidConfig = {}
        if(!(raidConfig.raidType == "JBOD") && raidConfig.stripeSize.trim().length < 1){
            errorMsgs.raidConfig.stripeSize = "Enter stripe size"
            valid = false
        }else if (!(raidConfig.raidType == "JBOD")){
            const stripeSize = Number(raidConfig.stripeSize)
            if(stripeSize < 1){
                errorMsgs.raidConfig.stripeSize = "Invalid stripe size"
                valid = false
            }
        }
        if(!(raidConfig.raidType == "JBOD") && raidConfig.diskCount.trim().length < 1){
            errorMsgs.raidConfig.diskCount = "Enter data disk count"
            valid = false
        }else if (!(raidConfig.raidType == "JBOD")){
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
      const lvCacheConfigIndex = that.state.lvCacheConfig.findIndex(function(hostLvCacheConfig) {
          return hostLvCacheConfig.host == this.state.selectedHost.hostName
      }, this)
      if(value || (property === "lvCacheSize" || property === "ssd")) {
        if(that.state.glusterModel.isSingleNode) {
          that.state.lvCacheConfig[0].lvCache = true
          lvCacheConfig.push(that.state.lvCacheConfig[0])
        } else if(property === "ssd" || property === "thinpoolName") {
          if(lvCacheConfigIndex == 0) {
            that.state.lvCacheConfig.forEach(function(eachConfig) {
              eachConfig[property] = value
              eachConfig.lvCache = true
              lvCacheConfig.push(eachConfig)
            })
          } else {
            that.state.lvCacheConfig[lvCacheConfigIndex][property] = value
            that.state.lvCacheConfig[lvCacheConfigIndex].lvCache = true
            that.state.lvCacheConfig.forEach(function(eachConfig) {
              lvCacheConfig.push(eachConfig)
            })
          }
        } else {
          that.state.lvCacheConfig.forEach(function(eachConfig) {
            eachConfig.lvCache = true
            lvCacheConfig.push(eachConfig)
          })
        }
      } else {
        that.state.lvCacheConfig.forEach(function(eachConfig) {
          eachConfig.lvCache = false
          lvCacheConfig.push(eachConfig)
        })
      }
      lvCacheConfig[lvCacheConfigIndex][property] = value
      const errorMsgs= this.state.errorMsgs
      this.validateLvCacheConfig(lvCacheConfig[lvCacheConfigIndex], errorMsgs)
      this.setState({ lvCacheConfig, errorMsgs })
    }

    handleCacheModeChange(value) {
      this.handleLvCacheConfig( "cacheMode", value)
    }

    handleThinPoolChange(value) {
      this.handleLvCacheConfig( "thinpoolName", value)
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
        if(lvCacheConfig.thinpoolName.trim() === "--select--" || lvCacheConfig.thinpoolName.trim() === ""){
            errorMsgs.lvCacheConfig.thinpoolName = "Please select thinpool device"
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
        if(this.props.ansibleWizardType == "expand_volume" && Array.isArray(brick)) {
            brick.forEach(function(eachBrick) {
              if(eachBrick.host_bricks[index].name.trim().length <1){
                  valid = false
                  errorMsgs[index].name = "LV name cannot be empty"
              }
              if(eachBrick.host_bricks[index].device.trim().length<3){
                  errorMsgs[index].device = "Enter correct device name for brick"
                  valid = false
              }
              if(eachBrick.host_bricks[index].size.trim().length<1){
                  errorMsgs[index].size = "Brick size cannot be empty"
                  valid = false;
              }
              if(eachBrick.host_bricks[index].brick_dir.trim().length <1){
                  errorMsgs[index].brick_dir = "Mount point cannot be empty"
                  valid = false;
              }
              if(eachBrick.host_bricks[index].is_vdo_supported && eachBrick.host_bricks[index].logicalSize.trim().length<1){
                  errorMsgs[index].logicalSize = "Logical size cannot be empty"
                  valid = false;
              }else{
                  const logicalSize = Number(eachBrick.host_bricks[index].logicalSize)
                  const brickSize = Number(eachBrick.host_bricks[index].size)
                  if(eachBrick.host_bricks[index].is_vdo_supported && logicalSize < brickSize){
                      errorMsgs[index].logicalSize = "Logical size should be greater or equals to brick size"
                      valid = false
                  }
              }
            })
        } else {
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
        }
        return valid
    }
    validate(){ //TODO: investigate set-state mutation
        this.trimBrickProperties() //TODO: fix set-state mutation
        let valid = true
        const errorMsgs= {}
        let errorMsg = ""
        this.state.bricksList.forEach(function(bricksHost, hostIndex){ //TODO: investigate set-state mutation

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
        if(!this.validateRaidConfig(this.state.raidConfig, errorMsgs)){  //TODO: fix set-state mutation
            valid = false
        }
        if(this.state.glusterModel.isSingleNode) {
          this.state.lvCacheConfig = [this.state.lvCacheConfig[0]]
        }
        this.state.lvCacheConfig.forEach(function(hostLvCacheConfig, hostIndex) {
            if(!this.validateLvCacheConfig(hostLvCacheConfig, errorMsgs)){  //TODO: fix set-state mutation
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
                    ansibleWizardType={this.props.ansibleWizardType}
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
        const thinpoolMsg = this.state.errorMsgs.lvCacheConfig ? this.state.errorMsgs.lvCacheConfig.thinpoolName : ""
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
        const thinpoolName = classNames(
            "form-group",
            { "has-error": thinpoolMsg}
        )
        return (
            <div>
                {this.state.errorMsg && <div className="alert alert-danger">
                    <span className="pficon pficon-error-circle-o"></span>
                    <strong>{this.state.errorMsg}</strong>
                </div>
                }
                <form className="form-horizontal">
                    <div className="panel-heading ansible-wizard-section-title">
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
                    {!(this.state.raidConfig.raidType == "JBOD") && <div className={stripeSize}>
                        <label className="col-md-3 control-label">Stripe Size(KB)</label>
                        <div className="col-md-2">
                            <input type="number" className="form-control"
                                value={this.state.raidConfig.stripeSize}
                                onChange={(e) => this.handleRaidConfigUpdate("stripeSize", e.target.value)}
                                />
                            <span className="help-block">{stripeSizeMsg}</span>
                        </div>
                    </div>}
                    {!(this.state.raidConfig.raidType == "JBOD") && <div className={diskCount}>
                        <label className="col-md-3 control-label">Data Disk Count</label>
                        <div className="col-md-2">
                            <input type="number" className="form-control" min="1" max="60"
                                value={this.state.raidConfig.diskCount}
                                onChange={(e) => this.handleRaidConfigUpdate("diskCount", e.target.value)}
                                />
                            <span className="help-block">{diskCountMsg}</span>
                        </div>
                    </div>}
                {bricksRow.length > 0 &&
                    <div>
                        <div className="panel-heading ansible-wizard-section-title">
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
                        <table className="ansible-wizard-bricks-table">
                            <tbody>
                                <tr className="ansible-wizard-bricks-row">
                                    <th>LV Name</th>
                                    <th>Device Name</th>
                                    <th>LV Size(GB) <span className="fa fa-lg fa-info-circle" style={isVdoSupported ? {} : { display: 'none' }}
                                        title="NOTE: LV for brick will be created to match the logical size of vdo volume."></span></th>
                                    <th>Thinp</th>
                                    <th>Mount Point</th>
                                    <th style={this.state.isVdoSupported ? {} : { display: 'none' }}>Enable Dedupe & Compression</th>
                                    <th style={isVdoSupported ? {} : { display: 'none' }}>Expanded Disk Size(GB)<span className="fa fa-lg fa-info-circle" style={isVdoSupported ? {} : { display: 'none' }}
                                        title="NOTE: This is the effective size of the disk after enabling dedupe and compression"></span></th>
                                </tr>
                                {bricksRow}
                            </tbody>
                        </table>
                    </div>
                }
                </form>
                <form className="form-horizontal">
                    <div id="lv-cache-toggle">
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
                        <input type="text" className="form-control" placeholder="/dev/sde"
                            value={this.state.lvCacheConfig[this.state.selectedHost.hostIndex].ssd}
                            onChange={(e) => this.handleLvCacheConfig("ssd", e.target.value)}
                            />
                            <span className="help-block">{ssdMsg}</span>
                        </div>
                    </div>
                    <div className={thinpoolName}
                      style={this.state.lvCacheConfig[this.state.selectedHost.hostIndex].lvCache ? {} : { display: 'none' }}>
                        <label className="col-md-3 control-label"> Thinpool device </label>
                        <div className="col-md-4">
                        <Selectbox optionList={this.state.thinpoolOptions}
                          selectedOption={this.state.lvCacheConfig[this.state.selectedHost.hostIndex].thinpoolName}
                          callBack={(e) => this.handleThinPoolChange(e)}
                          />
                            <span className="help-block">{thinpoolMsg}</span>
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
                        <Selectbox optionList={this.state.cacheModeOptions}
                          selectedOption={this.state.lvCacheConfig[this.state.selectedHost.hostIndex].cacheMode}
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
                <div className="col-md-offset-2 col-md-8 alert alert-info ansible-wizard-host-ssh-info">
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
    stepName: PropTypes.string.isRequired,
    glusterModel: PropTypes.object.isRequired,
    raidConfig: PropTypes.object.isRequired,
    bricks: PropTypes.array.isRequired,
    hosts: PropTypes.array.isRequired,
    lvCacheConfig: PropTypes.array.isRequired
}

const BrickRow = ({hostIndex, enabledFields, hostArbiterVolumes, brick, index, errorMsgs, changeCallBack, deleteCallBack, ansibleWizardType}) => {
    let deleteButton = true;
    if(ansibleWizardType === "setup" || ansibleWizardType === "expand_volume") {
      deleteButton = false
    }
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
        <tr className="ansible-wizard-bricks-row">
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
                <input type="checkbox" className="ansible-wizard-thinp-checkbox"
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
                <input type="checkbox" className="ansible-wizard-thinp-checkbox" title="Configure dedupe & compression using VDO."
                    checked={brick.is_vdo_supported}
                    onChange={(e) => changeCallBack(index, "is_vdo_supported", e.target.checked, brick)}
                    />
            </td>
            <td className="col-md-1" style={brick.is_vdo_supported ? {} : { display: 'none' }}>
                <div className={logicalSize}>
                    <input type="number" className="form-control" title="Default logical size will be ten times of brick size."
                        value={brick.logicalSize}
                        onChange={(e) => changeCallBack(index, "logicalSize", e.target.value)}
                        />
                    {errorMsgs && errorMsgs.logicalSize && <span className="help-block">{errorMsgs.logicalSize}</span>}
                </div>
            </td>
            <td className="col-sm-1 ansible-wizard-bricks-delete">
                {deleteButton &&
                    <a onClick={deleteCallBack}>
                        <span className="pficon pficon-delete ansible-wizard-delete-icon">
                        </span>
                    </a>
                }
            </td>
        </tr>
    )
}

export default WizardBricksStep
