import ini from 'ini'

const VG_NAME = "gluster_vg_"
const POOL_NAME = "gluster_thinpool_"
const LV_NAME = "gluster_lv_"
const DEFAULT_POOL_METADATA_SIZE_GB = 16
const POOL_METADATA_SIZE_PERCENT = 0.005
const MIN_ARBITER_BRICK_SIZE_KB = 20 * 1024 * 1024
const MAX_ARBITER_BRICK_SIZE_KB = 200 * 1024 * 1024
const DEFAULT_SHARD_SIZE_KB = 4096
const PRE_FLIGHT_CHECK_SCRIPT = '/usr/share/ansible/gdeploy/scripts/grafton-sanity-check.sh'

var GdeployUtil = {
    getDefaultGedeployModel() {
        return {
            hosts: ['', '', ''],
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
            bricks: [
                { name: "engine", device: "sdb",
                    brick_dir: "/gluster_bricks/engine", size: "100",
                    thinp: false
                },
                { name: "data", device: "sdb",
                    brick_dir: "/gluster_bricks/data", size: "500",
                    thinp: true
                },
                { name: "vmstore", device: "sdb",
                    brick_dir: "/gluster_bricks/vmstore", size: "500",
                    thinp: true
                },
            ]
        }
    },
    createGdeployConfig(glusterModel, templateModel, filePath) {
        const template = JSON.parse(JSON.stringify(templateModel));
        const volumeTemplate = template.volume
        const volumeConfigs = this.createVolumeConfigs(glusterModel.volumes, glusterModel.hosts, volumeTemplate)
        const brickConfig = this.createBrickConfig(glusterModel)
        const preFlightCheck = this.createPreFlightCheck(glusterModel.hosts, brickConfig.pvConfig)
        const redhatSubscription = this.createRedhatSubscription(glusterModel.subscription)
        const yumConfig = this.createYumConfig(glusterModel.subscription)
        // We will keep everything in the template except hosts, volumes and brick configurations
        const gdeployConfig = this.mergeConfigWithTemplate(
            template,
            glusterModel.hosts,
            preFlightCheck,
            volumeConfigs,
            brickConfig,
            redhatSubscription,
            yumConfig
        )
        const configString = this.convertToString(gdeployConfig)
        return this.writeConfigFile(filePath, configString)
    },
    createPreFlightCheck(hosts, pvConfig) {
        const preFlightCheck = {
            action: 'execute',
            ignore_script_errors: 'no'
        }
        let disks = Object.keys(pvConfig).join()
        preFlightCheck.file = `${PRE_FLIGHT_CHECK_SCRIPT} -d ${disks} -h ${hosts.join()}`
        return preFlightCheck
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
    createBrickConfig(glusterModel) {
        const brickConfig = {
            pvConfig: {}, vgConfig: {},
            lvConfig: [], thinPoolConfig: {},
            arbiterLvConfig: {}, arbiterThinPoolConfig: {}
        }
        brickConfig.raidParam = {
            disktype: glusterModel.raidConfig.raidType,
            diskcount: glusterModel.raidConfig.diskCount,
            stripesize: glusterModel.raidConfig.stripeSize
        }
        const that = this
        glusterModel.bricks.forEach(function(brick, index) {
            //If there is no PV added for the given device, add it now.
            if (!brickConfig.pvConfig.hasOwnProperty(brick.device)) {
                brickConfig.pvConfig[brick.device] = {
                    action: 'create',
                    devices: brick.device,
                    ignore_pv_errors: 'no'
                }
            }
            //If there is no VG added for the given device, add it now.
            if (!brickConfig.vgConfig.hasOwnProperty(brick.device)) {
                brickConfig.vgConfig[brick.device] = {
                    action: 'create',
                    vgname: VG_NAME + brick.device,
                    pvname: brick.device,
                    ignore_vg_errors: 'no'
                }
            }
            //Find if the brick is used for arbiter volume.
            const is_arbiter = glusterModel.volumes[index].is_arbiter
            //Create the lv configuration for the brick
            const lvConfig = {
                action: 'create',
                lvname: LV_NAME + brick.name,
                ignore_lv_errors: 'no'
            }
            lvConfig.vgname = VG_NAME + brick.device
            lvConfig.mount = brick.brick_dir
            if (brick.thinp) {
                //If it is a thinlv, check if there is a thinpool already created for the device.
                //If it is already created then increase the thinpool size by brick size.
                if (brickConfig.thinPoolConfig.hasOwnProperty(brick.device)) {
                    //If thinpool configuration is already seperated because of previous arbiter brick then
                    //we have to increment that with the current brick size regardless of it is arbiter or not.
                    if(brickConfig.arbiterThinPoolConfig.hasOwnProperty(brick.device)){
                        brickConfig.arbiterThinPoolConfig[brick.device].size += is_arbiter ?
                            that.getArbiterBrickSize(parseInt(brick.size)) : parseInt(brick.size)
                        brickConfig.arbiterThinPoolConfig[brick.device].poolmetadatasize =
                            that.getPoolMetadataSize(brickConfig.arbiterThinPoolConfig[brick.device].size) + "GB"
                    }else if(is_arbiter){
                        //If it is arbiter brick but thinpool configuration is not yet seperated then
                        //seperate now. Clone the regular thinpool and increase the size by arbiter size
                        const thinpool_arbiter = JSON.parse(JSON.stringify(brickConfig.thinPoolConfig[brick.device]))
                        thinpool_arbiter.size = thinpool_arbiter.size + that.getArbiterBrickSize(parseInt(brick.size))
                        thinpool_arbiter.poolmetadatasize = that.getPoolMetadataSize(thinpool_arbiter.size) + "GB"
                        brickConfig.arbiterThinPoolConfig[brick.device] = thinpool_arbiter
                    }
                    brickConfig.thinPoolConfig[brick.device].size += parseInt(brick.size)
                    brickConfig.thinPoolConfig[brick.device].poolmetadatasize =
                       that.getPoolMetadataSize(brickConfig.thinPoolConfig[brick.device].size)
                    brickConfig.thinPoolConfig[brick.device].size += brickConfig.thinPoolConfig[brick.device].poolmetadatasize
                    brickConfig.thinPoolConfig[brick.device].poolmetadatasize += "GB"
                } else {
                    //Create a thinpool if it is not created already
                    const thinpool = {
                        action: 'create',
                        poolname: POOL_NAME + brick.device,
                        ignore_lv_errors: 'no'
                    }
                    thinpool.vgname = VG_NAME + brick.device
                    thinpool.lvtype = 'thinpool'
                    thinpool.size = parseInt(brick.size)
                    thinpool.poolmetadatasize = that.getPoolMetadataSize(thinpool.size) + "GB"
                    brickConfig.thinPoolConfig[brick.device] = thinpool
                    if(is_arbiter){
                        //For arbiter brick, just clone the regular thinpool and modify the size
                        const thinpool_arbiter = JSON.parse(JSON.stringify(thinpool))
                        thinpool_arbiter.size = that.getArbiterBrickSize(parseInt(brick.size))
                        thinpool_arbiter.poolmetadatasize = that.getPoolMetadataSize(thinpool_arbiter.size)
                        thinpool_arbiter.size += thinpool_arbiter.poolmetadatasize
                        thinpool_arbiter.poolmetadatasize += "GB"
                        brickConfig.arbiterThinPoolConfig[brick.device] = thinpool_arbiter
                    }
                }
                //If thinlv, then we need to add the thinpoolname, virtualsize and lvtype as 'thinlv'
                lvConfig.lvtype = 'thinlv'
                lvConfig.poolname = POOL_NAME + brick.device
                lvConfig.virtualsize = brick.size + "GB"
            } else {
                lvConfig.size = brick.size + "GB"
                lvConfig.lvtype = 'thick'
            }
            brickConfig.lvConfig.push(lvConfig)

            if(is_arbiter){
                const lv_arbiter = JSON.parse(JSON.stringify(lvConfig))
                if (brick.thinp) {
                    lv_arbiter.virtualsize = this.getArbiterBrickSize(parseInt(brick.size)) + "GB"
                }else{
                    lv_arbiter.size = this.getArbiterBrickSize(parseInt(brick.size)) + "GB"
                }
                brickConfig.arbiterLvConfig[lvConfig.lvname] = lv_arbiter
            }
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
    mergeConfigWithTemplate(template, hosts, preFlightCheck, volumeConfigs, brickConfig, redhatSubscription, yumConfig) {
        const gdeployConfig = {}
        for (var section in template) {
            if (template.hasOwnProperty(section)) {
                //Replace the host sections in template with real hosts
                if (section === 'hosts') {
                    gdeployConfig['hosts'] = hosts
                    if(preFlightCheck != null){
                        gdeployConfig['script1'] = preFlightCheck
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
                    Object.keys(brickConfig.pvConfig).forEach(function(pv, index) {
                        gdeployConfig['pv' + (index + 1)] = brickConfig.pvConfig[pv]
                    })
                    //Create all VGS
                    Object.keys(brickConfig.vgConfig).forEach(function(vg, index) {
                        gdeployConfig['vg' + (index + 1)] = brickConfig.vgConfig[vg]
                    })
                    //Create all thinpools before creating lvs
                    //thinpools and lvs will use lv module in gdeploy. So we need to keep unique numbering
                    //for each lv section.
                    let lvIndex = 1
                    Object.keys(brickConfig.thinPoolConfig).forEach(function(thinpool, index) {
                        brickConfig.thinPoolConfig[thinpool].size = brickConfig.thinPoolConfig[thinpool].size + "GB"
                        //If there is an thinpool with the same name, then we have to
                        //create regular thinpool in first two hosts and arbiter thinpool in last host.
                        if (brickConfig.arbiterThinPoolConfig.hasOwnProperty(thinpool)) {
                            gdeployConfig['lv' + (lvIndex++) + `:{${hosts[0]},${hosts[1]}}`] = brickConfig.thinPoolConfig[thinpool]
                            brickConfig.arbiterThinPoolConfig[thinpool].size = brickConfig.arbiterThinPoolConfig[thinpool].size + "GB"
                            gdeployConfig['lv' + (lvIndex++) + `:${hosts[2]}`] = brickConfig.arbiterThinPoolConfig[thinpool]
                        } else {
                            gdeployConfig['lv' + lvIndex++] = brickConfig.thinPoolConfig[thinpool]
                        }
                    })
                    //Create all lvs.
                    brickConfig.lvConfig.forEach(function(lv, index) {
                        //If there is an arbiter lv with the same lvname, then we have to
                        //create regular size lv in first two hosts and arbiter lv in last host.
                        if(brickConfig.arbiterLvConfig.hasOwnProperty(lv.lvname)){
                            gdeployConfig['lv' + (lvIndex++) + `:{${hosts[0]},${hosts[1]}}`] = lv
                            gdeployConfig['lv' + (lvIndex++) + `:${hosts[2]}`] = brickConfig.arbiterLvConfig[lv.lvname]
                        }else{
                            gdeployConfig['lv' + lvIndex++] = lv
                        }
                    })
                } else if (section === 'volume') {
                    volumeConfigs.forEach(function(volumeConfig, index) {
                        gdeployConfig['volume' + (index + 1)] = volumeConfig
                    })
                } else {
                    gdeployConfig[section] = template[section]
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
    writeConfigFile(filePath, configString) {
        const file = cockpit.file(filePath)
        return file.replace(configString)
            .always(function(tag) {
                file.close()
            })
    },
    createHEAnswerFileForGlusterStorage(volumeName, glusterServers, filePath) {
        let configString = "[environment:default]"
        configString = this.appendLine(configString, `OVEHOSTED_STORAGE/storageDomainConnection=str:${glusterServers[0]}:/${volumeName}`)
        if (glusterServers.length > 1) {
            configString = this.appendLine(configString, `OVEHOSTED_STORAGE/mntOptions=str:backup-volfile-servers=${glusterServers.slice(1).join(":")}`)
        }
        return this.writeConfigFile(filePath, configString)
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
            console.log("True")
            callBack(true)
        })
        .fail(function(code) {
            console.log("false")
            callBack(false)
        })
    }
}

export default GdeployUtil
