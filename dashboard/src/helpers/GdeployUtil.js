import ini from 'ini'
import { CONFIG_FILES as constants } from '../components/gdeploy/constants'

const VG_NAME = "gluster_vg_"
const POOL_NAME = "gluster_thinpool_"
const LV_NAME = "gluster_lv_"
const DEFAULT_POOL_METADATA_SIZE_GB = 16
const POOL_METADATA_SIZE_PERCENT = 0.005
const MIN_ARBITER_BRICK_SIZE_KB = 20 * 1024 * 1024
const MAX_ARBITER_BRICK_SIZE_KB = 200 * 1024 * 1024
const DEFAULT_SHARD_SIZE_KB = 4096
const PRE_FLIGHT_CHECK_SCRIPT = '/usr/share/gdeploy/scripts/grafton-sanity-check.sh'

var GdeployUtil = {
    getDefaultGedeployModel() {
        return {
            hosts: ['', '', ''],
            fqdns: ['', ''],
            subscription: {
                username: "", password: "", poolId: "", yumUpdate: false,
                rpms: "",
                repos: ""
            },
            raidConfig: {
                raidType: "raid6", stripeSize: "256", diskCount: "12"
            },
            volumes: [
                { name: "engine", type: "replicate",
                    is_arbiter: false,
                    brick_dir: "/gluster_bricks/engine/engine"
                },
                { name: "data", type: "replicate",
                    is_arbiter: false,
                    brick_dir: "/gluster_bricks/data/data"
                },
                { name: "vmstore", type: "replicate",
                    is_arbiter: false,
                    brick_dir: "/gluster_bricks/vmstore/vmstore"
                },
            ],
            bricks: [{
                host: "",
                host_bricks: [
                    { name: "engine", device: "sdb",
                        brick_dir: "/gluster_bricks/engine", size: "100",
                        thinp: false,
                        is_vdo_supported: false,
                        logicalSize: "1000"
                    },
                    { name: "data", device: "sdb",
                        brick_dir: "/gluster_bricks/data", size: "500",
                        thinp: true,
                        is_vdo_supported: false,
                        logicalSize: "5000"
                    },
                    { name: "vmstore", device: "sdb",
                        brick_dir: "/gluster_bricks/vmstore", size: "500",
                        thinp: true,
                        is_vdo_supported: false,
                        logicalSize: "5000"
                    },
                ]
            }],
            lvCacheConfig: [{
                host: "", lvCache: false, ssd: "", lvCacheSize: "1", cacheMode: "writethrough"
            }],
        }
    },
    createGdeployConfig(glusterModel, templateModel, filePath, callback) {
        const template = JSON.parse(JSON.stringify(templateModel));
        const volumeTemplate = template.volume
        const volumeConfigs = this.createVolumeConfigs(glusterModel.volumes, glusterModel.hosts, volumeTemplate)
        const vdoConfig = this.createVdoConfig(glusterModel)
        const brickConfig = this.createBrickConfig(glusterModel, vdoConfig)
        const preFlightCheck = this.createPreFlightCheck(glusterModel.hosts, brickConfig.pvConfig)
        const redhatSubscription = this.createRedhatSubscription(glusterModel.subscription)
        const yumConfig = this.createYumConfig(glusterModel.subscription)
        const lvCacheConfig = this.createLvCacheConfig(glusterModel)
        // We will keep everything in the template except hosts, volumes and brick configurations
        const gdeployConfig = this.mergeConfigWithTemplate(
            template,
            glusterModel.hosts,
            preFlightCheck,
            volumeConfigs,
            brickConfig,
            lvCacheConfig,
            redhatSubscription,
            yumConfig,
            vdoConfig
        )
        const configString = this.convertToString(gdeployConfig)
        this.handleDirAndFileCreation(filePath, configString, function(result){
          callback(true)
        })
        const that = this
        this.findGdeployVersion(function(isSupported) {
          if(isSupported) {
            that.saveGdeployInventory(glusterModel)
          }
        })
    },
    createPreFlightCheck(hosts, pvConfig) {
        let preFlightCheck = []
        pvConfig.forEach(function(pvHost, index) {
            const hostPreFlightCheckObject = {
              host: pvHost.host,
              hostPreFlightCheck: {
                action: 'execute',
                ignore_script_errors: 'no'
              }
            }
            let disksArray = Object.keys(pvHost)
            if(disksArray.indexOf('host') >= 0){
                disksArray.splice(disksArray.indexOf('host'), 1)
            }
            disksArray.forEach(function(disk, index){
                let trimmedDisk = disk.split('/').pop()
                disksArray[index] = trimmedDisk
            })
            let disks = disksArray.join()
            hostPreFlightCheckObject.hostPreFlightCheck.file = `${PRE_FLIGHT_CHECK_SCRIPT} -d ${disks} -h ${hosts.join()}`
            preFlightCheck.push(hostPreFlightCheckObject)
        })
        return preFlightCheck
    },
    createExpandClusterConfig(glusterModel, expandClusterConfigFilePath){
        const that = this
        let filePath = expandClusterConfigFilePath
        cockpit.spawn(
          [ "hostname" ]
        ).done(function(hostname){
          var configString = "[hosts]" + "\n" + hostname
          for (var i = 0; i < glusterModel.hosts.length; i++) {
            configString += glusterModel.hosts[i] + "\n"
          }
          configString += "\n[peer]\n" + "action=probe"
          that.handleDirAndFileCreation(filePath, configString, function(result){
            console.log("Result after creating expand cluster config file: ", result);
          })
        }).fail(function(err){
          console.log("Error while fetching hostname: ", err);
        })
    },

    createYumConfig(subscription) {
        //Required only if we have to install some packages.
        if (subscription.rpms.length > 0) {
            const yumConfig = {
                action: 'install',
                packages: subscription.rpms,
                update: subscription.yumUpdate ? 'yes' : 'no',
                gpgcheck: 'yes',
                ignore_yum_errors: 'no'
            }
            //Required only if we have to add yum repos. if we have a cdn
            //username then its treated as cdn repo and we should not add here.
            if (subscription.repos.length > 0 && subscription.username.trim().length === 0) {
                yumConfig.repos = subscription.repos
            }
            return yumConfig
        }
        return null
    },
    createRedhatSubscription(subscription) {
        //RedHat Subscription can be done only if cdn username is specified
        if (subscription.username.trim().length > 0 && subscription.password.length > 0) {
            const config = {
                ignore_register_errors: 'no',
                ignore_attach_pool_errors: 'no',
                ignore_enable_errors: 'no'
            }
            config.action = 'register'
            config["disable-repos"] = 'yes'
            config.username = subscription.username.trim()
            config.password = subscription.password
            if (subscription.poolId.trim().length > 0) {
                config.pool = subscription.poolId.trim()
            }
            if (subscription.repos.trim().length > 0) {
                config.repos = subscription.repos.trim()
            }
            return config
        }

        return null
    },
    createBrickConfig(glusterModel, vdoConfig) {
        const brickConfig = {
            pvConfig: [], vgConfig: [],
            lvConfig: [], thinPoolConfig: [],
            arbiterLvConfig: {}, arbiterThinPoolConfig: {}
        }
        brickConfig.raidParam = {
            disktype: glusterModel.raidConfig.raidType,
            diskcount: glusterModel.raidConfig.diskCount,
            stripesize: glusterModel.raidConfig.stripeSize
        }
        const that = this
        glusterModel.bricks.forEach(function(brickHost, hostIndex) {
            brickConfig.pvConfig.push({host: brickHost.host})
            brickConfig.vgConfig.push({host: brickHost.host})
            brickConfig.lvConfig.push({host: brickHost.host, host_lvConfig: []})
            brickConfig.thinPoolConfig.push({host: brickHost.host})
            let vdoHostIndex = vdoConfig.findIndex(function (hostVdoConfig) {
                return hostVdoConfig.host == brickHost.host
            })
            brickHost.host_bricks.forEach(function(brick, index) {
                let device = brick.device
                if (vdoHostIndex >= 0) {
                    let devices = vdoConfig[vdoHostIndex].vdoConfig.devices.split(",")
                    let names = vdoConfig[vdoHostIndex].vdoConfig.names.split(",")
                    let deviceIndex = devices.indexOf(device)
                    if (deviceIndex >= 0) {
                        let name = names[deviceIndex]
                        device = "/dev/mapper/" + name
                    }
                }
                //If there is no PV added for the given device, add it now.
                if (!brickConfig.pvConfig[hostIndex].hasOwnProperty(brick.device)) {
                    brickConfig.pvConfig[hostIndex][brick.device] = {
                        action: 'create',
                        devices: device,
                        ignore_pv_errors: 'no'
                    }
                }
                //If there is no VG added for the given device, add it now.
                if (!brickConfig.vgConfig[hostIndex].hasOwnProperty(brick.device)) {
                    brickConfig.vgConfig[hostIndex][brick.device] = {
                        action: 'create',
                        vgname: VG_NAME + brick.device.split('/').pop(),
                        pvname: device,
                        ignore_vg_errors: 'no'
                    }
                }
                //Find if the brick is used for arbiter volume.
                const is_arbiter = (hostIndex % 3 == 2) && glusterModel.volumes[index].is_arbiter
                //Create the lv configuration for the brick
                const lvConfig = {
                    action: 'create',
                    lvname: LV_NAME + brick.name,
                    ignore_lv_errors: 'no'
                }
                lvConfig.vgname = VG_NAME + brick.device.split('/').pop()
                lvConfig.mount = brick.brick_dir
                if (brick.thinp) {
                    //If it is a thinlv, check if there is a thinpool already created for the device.
                    //If it is already created then increase the thinpool size by brick size.
                    if (brickConfig.thinPoolConfig[hostIndex].hasOwnProperty(brick.device)) {
                        brickConfig.thinPoolConfig[hostIndex][brick.device].size += parseInt(brick.size)
                        brickConfig.thinPoolConfig[hostIndex][brick.device].poolmetadatasize =
                           that.getPoolMetadataSize(brickConfig.thinPoolConfig[hostIndex][brick.device].size)
                        brickConfig.thinPoolConfig[hostIndex][brick.device].size += brickConfig.thinPoolConfig[hostIndex][brick.device].poolmetadatasize
                        brickConfig.thinPoolConfig[hostIndex][brick.device].poolmetadatasize += "GB"
                    } else {
                        //Create a thinpool if it is not created already
                        const thinpool = {
                            action: 'create',
                            poolname: POOL_NAME + brick.device.split('/').pop(),
                            ignore_lv_errors: 'no'
                        }
                        thinpool.vgname = VG_NAME + brick.device.split('/').pop()
                        thinpool.lvtype = 'thinpool'
                        thinpool.size = parseInt(brick.size)
                        thinpool.poolmetadatasize = that.getPoolMetadataSize(thinpool.size) + "GB"
                        brickConfig.thinPoolConfig[hostIndex][brick.device] = thinpool
                    }
                    //If thinlv, then we need to add the thinpoolname, virtualsize and lvtype as 'thinlv'
                    lvConfig.lvtype = 'thinlv'
                    lvConfig.poolname = POOL_NAME + brick.device.split('/').pop()
                    lvConfig.virtualsize = brick.size + "GB"
                } else {
                    lvConfig.size = brick.size + "GB"
                    lvConfig.lvtype = 'thick'
                }
                brickConfig.lvConfig[hostIndex].host_lvConfig.push(lvConfig)

            }, this)
        }, this)
        return brickConfig
    },
    getPoolMetadataSize(poolSize){
        return Math.min(DEFAULT_POOL_METADATA_SIZE_GB, Math.ceil(poolSize * POOL_METADATA_SIZE_PERCENT))
    },
    getArbiterBrickSize(brickSize) {
        //Calculate the size of arbiter brick based on the Brick Size.
        //Formula: max (min_arbiter_size, min (max_arbiter_size, 2 * (brick-size/shard-size) * 4KB) )
        const brickSizeKB = brickSize * 1024 * 1024
        const shardSizeKB = DEFAULT_SHARD_SIZE_KB
        const arbiterSizeKB = Math.max(MIN_ARBITER_BRICK_SIZE_KB, 2 * (brickSizeKB / shardSizeKB) * 4)
        //Return size in GBs
        return Math.ceil(arbiterSizeKB / (1024 * 1024))
    },
    mergeConfigWithTemplate(template, hosts, preFlightCheck, volumeConfigs, brickConfig, lvCacheConfig, redhatSubscription, yumConfig, vdoConfig) {
        const gdeployConfig = {}
        for (var section in template) {
            if (template.hasOwnProperty(section)) {
                //Replace the host sections in template with real hosts
                if (section === 'hosts') {
                    gdeployConfig['hosts'] = hosts
                    if(preFlightCheck != null){
                        preFlightCheck.forEach(function(hostPreFlightCheckObject, index) {
                            gdeployConfig['script1:' + hostPreFlightCheckObject.host] = hostPreFlightCheckObject.hostPreFlightCheck
                        })
                    }
                    if (brickConfig.hasOwnProperty("raidParam")) {
                        //Not truly ini format. But we need RAID params in the following format.
                        // [disktype]
                        // raid6
                        // [diskcount]
                        // 4
                        // [stripesize]
                        // 256
                        gdeployConfig.disktype = [brickConfig.raidParam.disktype]
                        gdeployConfig.diskcount = [brickConfig.raidParam.diskcount]
                        gdeployConfig.stripesize = [brickConfig.raidParam.stripesize]
                    }
                    if (redhatSubscription != null) {
                        gdeployConfig['RH-subscription'] = redhatSubscription
                    }
                } else if (section === 'yum1') {
                    if (yumConfig != null) {
                        gdeployConfig['yum1'] = yumConfig
                    }
                } else if (section === 'pv') {
                    //Add all brick related configurations in the place of 'pv' section

                    //Create all PVS
                    brickConfig.pvConfig.forEach(function(pvHost, hostIndex) {
                        let pvIndex = 1
                        Object.keys(pvHost).forEach(function(pv, index) {
                            if(pv != 'host'){
                                gdeployConfig['pv' + (pvIndex++) + ':' + pvHost.host] = brickConfig.pvConfig[hostIndex][pv]
                            }
                        })
                    })

                    //Create all VGS
                    brickConfig.vgConfig.forEach(function(vgHost, hostIndex) {
                        let vgIndex = 1
                        Object.keys(vgHost).forEach(function(vg, index) {
                            if(vg != 'host'){
                                gdeployConfig['vg' + (vgIndex++) + ':' + vgHost.host] = brickConfig.vgConfig[hostIndex][vg]
                            }
                        })
                    })
                    //Create all thinpools before creating lvs
                    //thinpools and lvs will use lv module in gdeploy. So we need to keep unique numbering
                    //for each lv section.
                    let lvIndex = 1
                    brickConfig.thinPoolConfig.forEach(function(thinPoolConfigHost, hostIndex){
                        Object.keys(thinPoolConfigHost).forEach(function(thinpool, index) {
                            if(thinpool != 'host'){
                                brickConfig.thinPoolConfig[hostIndex][thinpool].size = brickConfig.thinPoolConfig[hostIndex][thinpool].size + "GB"
                                gdeployConfig['lv' + (lvIndex++) + ':' + thinPoolConfigHost.host] = brickConfig.thinPoolConfig[hostIndex][thinpool]
                            }
                        })
                    })
                    //Create all lvs.
                    brickConfig.lvConfig.forEach(function(lvConfigHost, hostIndex){
                        lvConfigHost.host_lvConfig.forEach(function(lv, index) {
                            gdeployConfig['lv' + (lvIndex++) + ':' + lvConfigHost.host] = lv
                        })
                    })
                    if (lvCacheConfig.length != 0) {
                      lvCacheConfig.forEach(function (hostLvCacheConfig, index) {
                        gdeployConfig['lv' + (lvIndex++) + ':' + hostLvCacheConfig.host] = hostLvCacheConfig.lvCacheConfig
                      })
                    }
                } else if (section === 'volume') {
                    volumeConfigs.forEach(function(volumeConfig, index) {
                        gdeployConfig['volume' + (index + 1)] = volumeConfig
                    })
                } else {
                    gdeployConfig[section] = template[section]
                }
                if (vdoConfig.length != 0) {
                    let vdoIndex = 1
                    vdoConfig.forEach(function(hostVdoConfigs, hostIndex) {
                        if (hostVdoConfigs.vdoConfig.devices != "") {
                            gdeployConfig['vdo' + (vdoIndex++) + ':' + hostVdoConfigs.host] = hostVdoConfigs.vdoConfig
                        }
                    })
                }
            }
        }
        return gdeployConfig
    },
    createVolumeConfigs(volumesList, hostList, volumeTemplate) {
        const volumeConfigs = []
        volumesList.map(function(volume) {
            const config = JSON.parse(JSON.stringify(volumeTemplate))
            config.volname = volume.name;
            //We need to specify the hostnames because of a bug in gdeploy rhbz#1434774
            config.brick_dirs = `${hostList[0]}:${volume.brick_dir},${hostList[1]}:${volume.brick_dir},${hostList[2]}:${volume.brick_dir}`
            if (volume.type === "distribute") {
                config.replica = "no"
                delete config.replica_count
            } else if (volume.is_arbiter) {
                config.arbiter_count = 1
            }
            volumeConfigs.push(config)
        })

        return volumeConfigs

    },
    createLvCacheConfig(glusterModel){
        const lvConfig = glusterModel.lvCacheConfig
        const lvCacheConfig = []
        glusterModel.bricks.forEach(function (bricksHost, hostIndex) {
            const brickIndex = (bricksHost.host_bricks[0].name === "engine" && bricksHost.host_bricks.length > 0) ?  1 : 0
            const brick = bricksHost.host_bricks[brickIndex]
            // If checkbox is checked
            if(lvConfig[hostIndex].lvCache){
                const hostLvCacheConfig = {
                  host: lvConfig[hostIndex].host,
                  lvCacheConfig: {
                    action: 'setup-cache',
                    ssd: lvConfig[hostIndex].ssd.trim(),
                    vgname: VG_NAME + brick.device.split('/').pop(),
                    poolname: POOL_NAME + brick.device.split('/').pop(),
                    cache_lv: 'lvcache',
                    cache_lvsize: lvConfig[hostIndex].lvCacheSize + "GB",
                    cachemode: lvConfig[hostIndex].cacheMode.trim(),
                    ignore_lv_errors: 'no'
                  }
                }
                lvCacheConfig.push(hostLvCacheConfig)
            }
        })
        return lvCacheConfig
    },
    createVdoConfig(glusterModel){
        const vdoConfigs = []
        glusterModel.bricks.forEach(function(bricksHost, hostIndex) {
          const hostVdoConfigs = {
            host: bricksHost.host,
            vdoConfig: {
              action: 'create',
              devices: "",
              names: "",
              logicalsize: "",
              blockmapcachesize: "128M",
              readcache: "enabled",
              readcachesize: "20M",
              emulate512: "on",
              writepolicy: "auto",
              ignore_vdo_errors: "no"
            }
          }
          const devices = []
          const names = []
          const logicalSizes = []
          const slabsizes = []

          bricksHost.host_bricks.forEach(function(brick, index) {
            if (brick.is_vdo_supported) {
                  let deviceIndex = devices.indexOf(brick.device)
                  if (deviceIndex === -1) {
                      devices.push(brick.device)
                      names.push("vdo_" + brick.device)
                      logicalSizes.push(brick.logicalSize+"G")
                  }
                  else {
                      logicalSizes[deviceIndex] = (parseInt(logicalSizes[deviceIndex]) + parseInt(brick.logicalSize)) + "G"
                  }
              }
          })
          logicalSizes.forEach(function(logicalSize, index) {
              if (parseInt(logicalSize) >= 1000) {
                  slabsizes.push("32G")
              } else {
                slabsizes.push("2G")
              }
          })
          hostVdoConfigs.vdoConfig.devices = devices.join()
          hostVdoConfigs.vdoConfig.names = names.join()
          hostVdoConfigs.vdoConfig.logicalsize = logicalSizes.join()
          if (slabsizes.length != 0) {
            hostVdoConfigs.vdoConfig['slabsize'] = slabsizes.join()
          }
          vdoConfigs.push(hostVdoConfigs)
        })
        return vdoConfigs
    },
    convertToString(config) {
        var configString = "#gdeploy configuration generated by cockpit-gluster plugin"
        for (var section in config) {
            if (config.hasOwnProperty(section)) {
                configString = this.appendLine(configString, '[' + section + ']')
                if (config[section] && (typeof config[section] === "object") && (config[section] instanceof Array)) {
                    for (var i = 0; i < config[section].length; i++) {
                        configString = this.appendLine(configString, config[section][i])
                    }
                } else {
                    for (var key in config[section]) {
                        if (config[section].hasOwnProperty(key)) {
                            let value = config[section][key]
                            if (typeof value === 'string' || value instanceof String || Number.isInteger(value)) {
                                configString = this.appendLine(configString, key + "=" + value)
                            } else if (typeof value === 'boolean' && value) {
                                //Simple values like [disktype]\nraid6 are converted into object with boolean value true like {disktype:{'raid6":true}}.
                                //We have to ignore the value 'true' and just add the key 'raid6' in the configuration.
                                configString = this.appendLine(configString, key)
                            }
                        }
                    }
                }
                configString = this.appendLine(configString, "")
            }
        }
        return configString
    },
    appendLine(baseString, newString) {
        return baseString + '\n' + newString
    },
    writeConfigFile(filePath, configString, callback) {
        const file = cockpit.file(filePath)
        file.replace(configString)
            .always(function(tag) {
                file.close()
                callback(true)
            })
    },
    createHEAnswerFileForGlusterStorage(volumeName, glusterServers, filePath, callback) {
        let configString = "[environment:default]"
        configString = this.appendLine(configString, `OVEHOSTED_STORAGE/storageDomainConnection=str:${glusterServers[0]}:/${volumeName}`)
        if (glusterServers.length > 1) {
            configString = this.appendLine(configString, `OVEHOSTED_STORAGE/mntOptions=str:backup-volfile-servers=${glusterServers.slice(1).join(":")}`)
        }
        this.handleDirAndFileCreation(filePath, configString, function(result){
          callback(true)
        })
    },
    runExpandCluster(expandClusterConfigFile, successCallback){
        let proc = cockpit.spawn(
            ["gdeploy",
                "-c",
                expandClusterConfigFile
            ]
        )
        .done(successCallback(true))
        .fail(successCallback(false))
        // .stream(stdoutCallback)
        return proc
    },
    runGdeploy(configFile, stdoutCallback, successCallback, failCallback) {
        //gdeploy -c /cockpit-gluster/src/gdeploy-templat.conf
        let proc = cockpit.spawn(
            ["gdeploy",
                "-c",
                configFile
            ]
        )
        .done(successCallback)
        .fail(failCallback)
        .stream(stdoutCallback)
        return proc
    },
    isGdeployAvailable(callBack){
        let proc = cockpit.spawn(
            ["gdeploy",
                "--version"
            ]
        )
        .done(function(code) {
            callBack(true)
        })
        .fail(function(code) {
            callBack(false)
        })
    },
    isRhelSystem(callBack){
        let proc = cockpit.spawn(
            ["grep",
             'PRETTY_NAME="Red Hat Enterprise Linux"',
             '/etc/os-release'
            ]
        )
        .done(function(code) {
            callBack(true)
        })
        .fail(function(code) {
            callBack(false)
        })
    },
    createDir(filePath, callback){
      // pick only directory path
      const dirPath = filePath.substring(0, filePath.lastIndexOf("/"))
       cockpit.spawn(
        [ "mkdir", dirPath ], { "superuser":"require" }
      ).done(function(code){
        console.log("Directory " + dirPath + " created successfully.");
        callback(code)
      }).fail(function(code){
        console.log("Failed to create directory " + dirPath + ", Reason: "+ code);
        callback(code)
      })
    },
    backupOldFileWithTimestamp(filePath, callback){
      // pick only directory path
      const dirPath = filePath.substring(0, filePath.lastIndexOf("/"))
      // pick only file name, omiting .conf
      const fileName = filePath.split("/").pop().split(".")[0]
      // Complete file path containing timestamp.
      const backupPath = dirPath + "/" + fileName + "-" + new Date().getTime() + ".conf"
       cockpit.spawn(
        [ "mv", filePath, backupPath ], { "superuser":"require" }
      ).done(function(code){
        console.log("Backup of " + backupPath + " completed successfully.");
        callback(code)
      }).fail(function(code){
        console.log("Failed to take backup of " + backupPath + ", Reason: "+ code);
        callback(code)
      })
    },
    checkIfDirExist(filePath, callback){
      // pick only directory path
      const dirPath = filePath.substring(0, filePath.lastIndexOf("/"))
       cockpit.spawn(
        [ "ls", dirPath ], { "superuser":"require" }
      ).done(function(code){
        console.log("Directory " + dirPath + " is exist.");
        callback(true)
      }).fail(function(code){
        console.log("Directory " + dirPath + " does not exist.");
        callback(false)
      })
    },
    checkIfFileExist(filePath, callback){
      cockpit.file(filePath, { "superuser":"require" }).read()
          .done(function (content, tag) {
            if(content != null && tag != "-") {
              console.log("File " + filePath + " is exist.");
              callback(true)
            } else {
              console.log("File " + filePath + " does not exist.");
              callback(false)
            }
          })
          .fail(function (error) {
            console.log("Failed to read File "+ filePath + ", Reason: "+ error);
            callback(false)
          });
    },
    handleDirAndFileCreation(filePath, configString, callback) {
      const that = this
      this.checkIfDirExist(filePath, function(isDirPresent) {
        if(isDirPresent) {
          that.checkIfFileExist(filePath, function(isFilePresent) {
            if(isFilePresent) {
              that.backupOldFileWithTimestamp(filePath, function(response1) {
                that.writeConfigFile(filePath, configString, function(response2) {
                  callback(true)
                })
              })
            } else {
              console.log("File " + filePath + " is not present to take backup, so creating the file.");
              that.writeConfigFile(filePath, configString, function(response1) {
                callback(true)
              })
            }
          })
        } else {
          that.createDir(filePath, function(response1) {
              that.writeConfigFile(filePath, configString, function(response2) {
                callback(true)
              })
          })
        }
      })
    },
    isVdoSupported(callback){
      // Executing vdo command and gdeploy version to know vdo support
      const that = this
      cockpit.spawn(
        [ "vdo", "list" ], { "superuser":"require" }
      ).done(function(res){
        that.findGdeployVersion(function(isSupported) {
          if(isSupported) {
            callback(true)
          } else {
            callback(false)
          }
        })
      }).fail(function(code){
        callback(false)
      })
    },
    // Creates file required to add the 2nd and 3rd hosts and storage domain
    // to the engine after successful HE deployment
    saveGdeployInventory(glusterModel) {
      if(glusterModel.fqdns[0].length > 0 && glusterModel.fqdns[1].length > 0) {
        let inventoryModel = {
          "gluster": {}
        }
        let sdModelList = []
        let hostList = [glusterModel.hosts[1], glusterModel.hosts[2]]
        let firstHostFqdn = glusterModel.hosts[0]
        inventoryModel.gluster.hosts = hostList
        let mntOptions = "backup-volfile-servers=" + hostList.join(":")
        glusterModel.volumes.forEach(function(volume, index) {
          if(index !== 0) {
            let sdModel = {}
            sdModel.name = volume.name
            sdModel.host = firstHostFqdn
            sdModel.address = firstHostFqdn
            sdModel.path = volume.name
            sdModel.mount_options = mntOptions
            sdModelList.push(sdModel)
          }
        })
        let gdeployInventory = "gluster:\n hosts:\n  " + glusterModel.fqdns[0] + ":\n  " + glusterModel.fqdns[1]
                              + ":\n vars:\n  storage_domains: " + JSON.stringify(sdModelList)
        let filePath = constants.gdeployInventoryFile
        const that = this
        const dirPath = filePath.substring(0, filePath.lastIndexOf("/"))
        cockpit.script("if [ ! -d " + dirPath + " ]; then mkdir " + dirPath + "; fi", { "superuser": "require" })
          .done(function(exitCode) {
            const file = cockpit.file(filePath, {"superuser": "require" })
            file.replace(gdeployInventory)
                .always(function(tag) {
                  console.log("tag: ", tag);
                    file.close()
                })
          })
          .fail(function(error) {
            console.log("Failed to create " + dirPath + "directory: ", error);
          })
        }
    },
    findGdeployVersion(callback) {
      const that = this
      cockpit.spawn(
        [ "rpm", "-qa", "gdeploy" ], { "superuser":"require" }
      ).done(function(gVersion){
        if(that.isGdeploySupportVdo(gVersion)) {
          callback(true)
        } else {
          callback(false)
        }
      }).fail(function(code){
        callback(false)
      })
    },
    isGdeploySupportVdo(gVersion) {
      let gVersions = gVersion.split("-")
      const baseVersionArr = gVersions[1].split(".")
      const firstNumber = parseInt(baseVersionArr[0])
      const secondNumber = parseInt(baseVersionArr[1])
      const thirdNumber = parseInt(baseVersionArr[2])
      if((gVersions[1] === "2.0.2" && parseInt(gVersions[2]) >= 25)
        || firstNumber > 2 || (firstNumber === 2 &&  secondNumber > 0)
        || (firstNumber === 2 &&  secondNumber === 0 && thirdNumber >= 7)) {
        return true
      } else {
        return false
      }
    },
    isPingable(address, callBack) {
      let proc = cockpit.spawn(
          ["ping", "-w", "1",
            address
          ]
      )
      .done(function(code) {
          callBack(true)
      })
      .fail(function(code) {
          callBack(false)
      })
    }
}

export default GdeployUtil
