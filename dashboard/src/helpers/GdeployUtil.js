import ini from 'ini'

const VG_NAME = "gluster_vg_"
const POOL_NAME = "gluster_thinpool_"
const LV_NAME = "gluster_lv_"
var GdeployUtil = {
    getDefaultGedeployModel() {
        return {
            hosts: ['', '', ''],
            subscription: {
                username: "", password: "", poolId: "", yumUpdate: true, gpgCheck: true,
                rpms: "vdsm-gluster,ovirt-hosted-engine-setup",
                repos: ""
            },
            volumes: [
                { name: "engine", type: "replicate",
                    is_arbiter: true,
                    brick_dir: "/gluster_bricks/engine/engine"
                },
                { name: "data", type: "replicate",
                    is_arbiter: true,
                    brick_dir: "/gluster_bricks/data/data"
                },
                { name: "vmstore", type: "replicate",
                    is_arbiter: true,
                    brick_dir: "/gluster_bricks/vmstore/vmstore"
                },
            ],
            bricks: [
                { name: "engine", device: "vdb",
                    brick_dir: "/gluster_bricks/engine", size: "150",
                    thinp: true, raidType: "RAID6", stripSize: "256",
                    diskCount: "12"
                },
                { name: "data", device: "vdb",
                    brick_dir: "/gluster_bricks/data", size: "500",
                    thinp: true, raidType: "RAID6",
                    stripSize: "256", diskCount: "12"
                },
                { name: "vmstore", device: "vdc",
                    brick_dir: "/gluster_bricks/vmstore", size: "500",
                    thinp: true, raidType: "RAID6",
                    stripSize: "256", diskCount: "12"
                },
            ]
        }
    },
    createGdeployConfig(glusterModel, templateModel, filePath) {
        const template = JSON.parse(JSON.stringify(templateModel));
        const volumeTemplate = template.volume
        const volumeConfigs = this.createVolumeConfigs(glusterModel.volumes, volumeTemplate)
        const brickConfig = this.createBrickConfig(glusterModel)
        const redhatSubscription = this.createRedhatSubscription(glusterModel.subscription)
        const yumConfig = this.createYumConfig(glusterModel.subscription)
        // We will keep everything in the template except hosts, volumes and brick configurations
        const gdeployConfig = this.mergeConfigWithTemplate(
            template,
            glusterModel.hosts,
            volumeConfigs,
            brickConfig,
            redhatSubscription,
            yumConfig
        )
        const configString = this.convertToString(gdeployConfig)
        return this.writeConfigFile(filePath, configString)
    },
    createYumConfig(subscription) {
        //Required only if we have to install some packages
        if (subscription.rpms != null && subscription.rpms.length > 0) {
            return {
                action: 'install',
                packages: subscription.rpms,
                update: subscription.yumUpdate ? 'yes' : 'no',
                gpgcheck: subscription.gpgCheck ? 'yes' : 'no'
            }
        }
        return null
    },
    createRedhatSubscription(subscription) {
        //RedHat Subscription can be done only if cdn username is specified
        if (subscription.username != null && subscription.username.length > 0) {
            return {
                action: 'register',
                username: subscription.username,
                password: subscription.password,
                pool: subscription.poolId,
                repos: subscription.repos
            }
        }
        return null
    },
    createBrickConfig(glusterModel) {
        const brickConfig = { pvConfig: {}, vgConfig: {}, lvConfig: [], thinPoolConfig: {} }
        glusterModel.bricks.forEach(function(brick, index) {
            //If there is no PV added for the given device, add it now.
            if (!brickConfig.pvConfig.hasOwnProperty(brick.device)) {
                brickConfig.pvConfig[brick.device] = { action: 'create', devices: brick.device }
            }
            //If there is no VG added for the given device, add it now.
            if (!brickConfig.vgConfig.hasOwnProperty(brick.device)) {
                brickConfig.vgConfig[brick.device] = { action: 'create', vgname: VG_NAME + brick.device, pvname: brick.device }
            }
            //Create the lv configuration for the brick
            const lvConfig = { action: 'create', poolname: LV_NAME + brick.name }
            lvConfig.vgname = VG_NAME + brick.device
            lvConfig.mount = brick.brick_dir
            if (brick.thinp) {
                //If it is a thinlv, check if there is a thinpool already created for the device.
                //If it is already created then increase the thinpool size by brick size.
                if (brickConfig.thinPoolConfig.hasOwnProperty(brick.device)) {
                    brickConfig.thinPoolConfig[brick.device].size += parseInt(brick.size)
                } else {
                    //Create a thinpool if it is not created already
                    const thinpool = { action: 'create', poolname: POOL_NAME + brick.device }
                    thinpool.vgname = VG_NAME + brick.device
                    thinpool.lvtype = 'thinpool'
                    thinpool.poolmetadatasize = '10MB'
                    thinpool.chunksize = '1024k'
                    thinpool.size = parseInt(brick.size)
                    brickConfig.thinPoolConfig[brick.device] = thinpool
                }
                //If thinlv, then we need to add the thinpoolname, virtualsize and lvtype as 'thinlv'
                lvConfig.lvtype = 'thinlv'
                lvConfig.poolname = POOL_NAME + brick.device
                lvConfig.virtualsize = brick.size
            } else {
                lvConfig.size = brick.size
                lvConfig.lvtype = 'thick'
            }
            brickConfig.lvConfig.push(lvConfig)
        })
        return brickConfig;
    },
    mergeConfigWithTemplate(template, hosts, volumeConfigs, brickConfig, redhatSubscription, yumConfig) {
        const gdeployConfig = {}
        for (var section in template) {
            if (template.hasOwnProperty(section)) {
                //Replace the host sections in template with real hosts
                if (section === 'hosts') {
                    gdeployConfig['hosts'] = hosts
                    if (redhatSubscription != null) {
                        gdeployConfig['RH-subscription'] = redhatSubscription
                    }
                } else if (section === 'yum1' && yumConfig != null) {
                    gdeployConfig['yum1'] = yumConfig
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
                    Object.keys(brickConfig.thinPoolConfig).forEach(function(thinpool, index) {
                        brickConfig.thinPoolConfig[thinpool].size = brickConfig.thinPoolConfig[thinpool].size + "GB"
                        gdeployConfig['lv' + (index + 1)] = brickConfig.thinPoolConfig[thinpool]
                    })
                    //Create all lvs. thinpool also created using lv section. So we need to include thinpool
                    //size to calculate the numbering for lvs.
                    const thinpoolCount = Object.keys(brickConfig.thinPoolConfig).length
                    brickConfig.lvConfig.forEach(function(lv, index) {
                        if (lv.lvtype === 'thinlv') {
                            lv.virtualsize = lv.virtualsize + "GB"
                        } else {
                            lv.size = lv.size + "GB"
                        }
                        gdeployConfig['lv' + (index + 1 + thinpoolCount)] = lv
                    })
                } else if (section === 'volume') {
                    volumeConfigs.forEach(function(volumeConfig, index) {
                        gdeployConfig['volume' + (index + 1)] = volumeConfig
                    })
                } else if (section === 'yum2:host1') {
                    volumeConfigs.forEach(function(volumeConfig, index) {
                        gdeployConfig['yum2:' + hosts[0]] = template[section]
                    })
                } else {
                    gdeployConfig[section] = template[section]
                }
            }
        }
        return gdeployConfig
    },
    createVolumeConfigs(volumesList, volumeTemplate) {
        const volumeConfigs = []
        volumesList.map(function(volume) {
            const config = JSON.parse(JSON.stringify(volumeTemplate))
            config.volname = volume.name;
            config.brick_dirs = volume.brick_dir
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
                            Number.isInteger
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
    }
}

export default GdeployUtil