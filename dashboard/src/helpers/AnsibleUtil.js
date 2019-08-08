import ini from 'ini'
import { CONFIG_FILES as constants } from '../components/ansible/constants'
import yaml from 'js-yaml';
import _ from 'lodash';

const VG_NAME = "gluster_vg_"
const POOL_NAME = "gluster_thinpool_"
const LV_NAME = "gluster_lv_"
const DEFAULT_POOL_METADATA_SIZE_GB = 16
const POOL_METADATA_SIZE_PERCENT = 0.005
const MIN_ARBITER_BRICK_SIZE_KB = 20 * 1024 * 1024
const MAX_ARBITER_BRICK_SIZE_KB = 200 * 1024 * 1024
const DEFAULT_SHARD_SIZE_KB = 4096

var AnsibleUtil = {
    getDefaultAnsibleModel() {
        return {
            hosts: ['', '', ''],
            expandVolumeHosts: [],
            fqdns: ['', ''],
            subscription: {
                username: "", password: "", poolId: "", yumUpdate: false,
                rpms: "",
                repos: ""
            },
            raidConfig: {
                raidType: "RAID6", stripeSize: "256", diskCount: "12"
            },
            volumes: [
                { name: "engine", type: "replicate",
                    is_arbiter: 0,
                    brick_dir: "/gluster_bricks/engine/engine"
                },
                { name: "data", type: "replicate",
                    is_arbiter: 0,
                    brick_dir: "/gluster_bricks/data/data"
                },
                { name: "vmstore", type: "replicate",
                    is_arbiter: 1,
                    brick_dir: "/gluster_bricks/vmstore/vmstore"
                },
            ],
            bricks: [{
                host: "",
                host_bricks: [
                    { name: "engine", device: "/dev/sdb",
                        brick_dir: "/gluster_bricks/engine", size: "100",
                        thinp: false,
                        is_vdo_supported: false,
                        logicalSize: "1000"
                    },
                    { name: "data", device: "/dev/sdb",
                        brick_dir: "/gluster_bricks/data", size: "500",
                        thinp: true,
                        is_vdo_supported: false,
                        logicalSize: "5000"
                    },
                    { name: "vmstore", device: "/dev/sdb",
                        brick_dir: "/gluster_bricks/vmstore", size: "500",
                        thinp: true,
                        is_vdo_supported: false,
                        logicalSize: "5000"
                    },
                ]
            }],
            lvCacheConfig: [{
                host: "", lvCache: false, ssd: "", lvCacheSize: "1", cacheMode: "writethrough", thinpoolName: "--select--"
            }],
            isSingleNode: false
        }
    },
    createAnsibleConfig(glusterModel, filePath, ansibleWizardType = "none", isSingleNode, callback) {
      if(isSingleNode) {
        this.saveGlusterInventoryForSingleNode(glusterModel)
      } else {
        this.saveGlusterInventory(glusterModel);
      }
      if(ansibleWizardType === "expand_volume") {
        this.createAnsibleConfigForExpandVolume(glusterModel, constants.ansibleExpandVolumeInventoryFile, ansibleWizardType, isSingleNode, callback)
      } else {
        let groups = {};
        let { hosts, volumes, bricks, raidConfig, lvCacheConfig } = glusterModel;
        hosts = hosts.filter(function (e) {
          return e
        })
        groups.hc_nodes = {};
        groups.hc_nodes.hosts = {};
        let groupVars = {}
        if(raidConfig.raidType === "JBOD") {
          groupVars.gluster_infra_disktype = raidConfig.raidType;
        } else {
          groupVars.gluster_infra_disktype = raidConfig.raidType;
          groupVars.gluster_infra_stripe_unit_size = parseInt(raidConfig.stripeSize);
          groupVars.gluster_infra_diskcount = parseInt(raidConfig.diskCount);
        }
        groupVars.gluster_set_selinux_labels = true
        groupVars.gluster_infra_fw_ports = [
         "2049/tcp",
         "54321/tcp",
         "5900/tcp",
         "5900-6923/tcp",
         "5666/tcp",
         "16514/tcp"
       ]
       groupVars.gluster_infra_fw_permanent = true
       groupVars.gluster_infra_fw_state = "enabled"
       groupVars.gluster_infra_fw_zone = "public"
       groupVars.gluster_infra_fw_services = ["glusterfs"]
       groupVars.gluster_features_force_varlogsizecheck = false

        let hostLength = 1
        if(!isSingleNode) {
          hostLength = hosts.length
        }
        for (let hostIndex = 0; hostIndex < hostLength;hostIndex++){
          let hostVars = {};
          hostVars.gluster_infra_volume_groups = [];
          hostVars.gluster_infra_mount_devices = [];
          let processedDevs = {}; // VG and VDO is processed once per device processedVG implies processedVDO
          let hostBricks = bricks[hostIndex]["host_bricks"];
          let hostCacheConfig = lvCacheConfig[hostIndex];
          hostVars.gluster_infra_vdo = [];
          let groupedBricks = _.groupBy(hostBricks, "device");

          for (let brick of hostBricks){
            let devName = brick.device.split("/").pop();
            let pvName = brick.device;
            let vgName = VG_NAME+`${devName}`;
            let thinpoolName = POOL_NAME+`${vgName}`;
            let lvName = LV_NAME+`${brick.name}`;
            let isDevProcessed = Object.keys(processedDevs).indexOf(devName) > -1;
            let isThinpoolCreated = false;
            if(isDevProcessed){
              isThinpoolCreated = processedDevs[devName]['thinpool'];
            }
            let isVDO = brick.is_vdo_supported == true && brick.logicalSize;
            //TODO: cache more than one device.
            if(hostCacheConfig.lvCache && hostVars.gluster_infra_cache_vars == undefined){
              let selectedThinpName = "gluster_thinpool_gluster_vg_" + hostCacheConfig.thinpoolName
            let cachedisk = "/dev/" + hostCacheConfig.thinpoolName + "," + hostCacheConfig.ssd
            hostVars.gluster_infra_cache_vars = [{
              vgname: "gluster_vg_"+ hostCacheConfig.thinpoolName,
              cachedisk: cachedisk,
              cachelvname: `cachelv_${selectedThinpName}`,
              cachethinpoolname: selectedThinpName,
              cachelvsize: `${hostCacheConfig.lvCacheSize - (hostCacheConfig.lvCacheSize/10)}G`,
              cachemode: hostCacheConfig.cacheMode
            }];
            }
            if(brick.is_vdo_supported){
              let vdoName = `vdo_${devName}`;
              let slabsize = (brick.logicalSize <= 1000) ? "2G": "32G";
              let logicalsize = `${brick.logicalSize}G`;
              pvName = "/dev/mapper/"+vdoName;
              if(hostVars.gluster_infra_vdo.length > 0){
                hostVars.gluster_infra_vdo.forEach(function(inBrick, index){
                  if(brick.device !== inBrick.device) {
                    hostVars.gluster_infra_vdo.push({
                      name: vdoName,
                      device: brick.device,
                      slabsize: slabsize,
                      logicalsize: logicalsize,
                      blockmapcachesize: "128M",
                      readcache: "enabled",
                      readcachesize: "20M",
                      emulate512: "on",
                      writepolicy: "auto"
                    });
                  } else {
                      let logicalsizes = parseInt(hostVars.gluster_infra_vdo[index].logicalsize.replace(/G/g,"G")) + parseInt(brick.logicalSize)
                      hostVars.gluster_infra_vdo[index].logicalsize = logicalsizes + "G"
                      hostVars.gluster_infra_vdo[index].slabsize = (logicalsizes <= 1000) ? "2G": "32G";
                  }
                })
              } else {
                hostVars.gluster_infra_vdo.push({
                  name: vdoName,
                  device: brick.device,
                  slabsize: slabsize,
                  logicalsize: logicalsize,
                  blockmapcachesize: "128M",
                  readcache: "enabled",
                  readcachesize: "20M",
                  emulate512: "on",
                  writepolicy: "auto"
                });
              }
            }

            if(!isDevProcessed){
              //create vg
              hostVars.gluster_infra_volume_groups.push({
                vgname: vgName,
                pvname: pvName
              });
            }
            if(brick.thinp){
              if(hostVars.gluster_infra_thinpools == undefined){
                hostVars.gluster_infra_thinpools = [];
              }
              let poolMetadataSize = this.getPoolMetadataSize(brick.size)
              if(hostVars.gluster_infra_thinpools.length > 0){
                let count = 0
                hostVars.gluster_infra_thinpools.forEach(function(inThinp, index){
                  if(thinpoolName === inThinp.thinpoolname) {
                    count++
                  }
                  if(thinpoolName === inThinp.thinpoolname && parseInt(poolMetadataSize.slice(0, -1)) > parseInt(inThinp.poolmetadatasize.slice(0, -1))) {
                    hostVars.gluster_infra_thinpools[index]['poolmetadatasize'] = poolMetadataSize
                  }
                });
                if(count == 0){
                  hostVars.gluster_infra_thinpools.push({
                    vgname: vgName,
                    thinpoolname: thinpoolName,
                    poolmetadatasize: poolMetadataSize
                  });
                }
              } else {
                hostVars.gluster_infra_thinpools.push({
                  vgname: vgName,
                  thinpoolname: thinpoolName,
                  poolmetadatasize: poolMetadataSize
                });
              }

              isThinpoolCreated = true;
            }

            if(brick.thinp){
              if(hostVars.gluster_infra_lv_logicalvols == undefined){
                hostVars.gluster_infra_lv_logicalvols = [];
              }
              hostVars.gluster_infra_lv_logicalvols.push({
                vgname: vgName,
                thinpool: thinpoolName,
                lvname: lvName,
                lvsize: `${brick.size}G`
              });
            }
            if(!brick.thinp){
              if(hostVars.gluster_infra_thick_lvs == undefined){
                hostVars.gluster_infra_thick_lvs = [];
              }
              let lvSize = ""
              if(brick.is_vdo_supported) {
                let count = 0
                let brickNo = groupedBricks[brick.device].length
                for(let aBrick of groupedBricks[brick.device]) {
                  count++
                  if(brickNo === count){
                    lvSize = "100%FREE"
                  } else {
                    lvSize = `${aBrick.logicalSize}G`
                  }
                  let hasDuplicate = false
                  hostVars.gluster_infra_thick_lvs.map(v => v.lvname).sort().sort((a, b) => {
                    if (a === b) hasDuplicate = true
                  })

                  if(!hasDuplicate) {
                    hostVars.gluster_infra_thick_lvs.push({
                      vgname: vgName,
                      lvname: LV_NAME+`${aBrick.name}`,
                      size: lvSize
                    });
                  }
                }
              } else {
                lvSize = `${brick.size}G`
                hostVars.gluster_infra_thick_lvs.push({
                  vgname: vgName,
                  lvname: lvName,
                  size: lvSize
                });
              }
              hostVars.gluster_infra_thick_lvs = hostVars.gluster_infra_thick_lvs.filter((obj, pos, arr) => {
                return arr.map(mapObj =>
                  mapObj['lvname']).indexOf(obj['lvname']) === pos;
                });
            }
            hostVars.gluster_infra_mount_devices.push({
              path: brick.brick_dir,
              lvname: lvName,
              vgname: vgName
            });
            processedDevs[devName] = {thinpool: isThinpoolCreated}
          }
          if(hostVars.gluster_infra_vdo.length === 0) {
            delete hostVars["gluster_infra_vdo"]
          } else {
            hostVars.gluster_infra_vdo = hostVars.gluster_infra_vdo.filter((obj, pos, arr) => {
              return arr.map(mapObj =>
                mapObj['device']).indexOf(obj['device']) === pos;
            });
            hostVars.gluster_infra_vdo = Array.from(new Set(hostVars.gluster_infra_vdo.map(JSON.stringify))).map(JSON.parse);
          }
          groups.hc_nodes.hosts[hosts[hostIndex]] = hostVars;
        }

        groupVars.cluster_nodes = hosts
        groupVars.gluster_features_hci_cluster = "{{ cluster_nodes }}"
        groupVars.gluster_features_hci_volumes = [];
        if(glusterModel.isSingleNode || hosts.length === 1) {
          groupVars.gluster_features_hci_volume_options = constants.distVolumeOptions
        }
        for(let volumeIndex = 0; volumeIndex < volumes.length;volumeIndex++){
          let volume = volumes[volumeIndex];
          if(volume.is_arbiter) {
            volume.is_arbiter = 1
          }
          groupVars.gluster_features_hci_volumes.push({
            volname: volume.name,
            brick: volume.brick_dir,
            arbiter: volume.is_arbiter
          });
        }
        groups.hc_nodes.vars = groupVars;

        const configString = yaml.dump(groups)
        this.handleDirAndFileCreation(filePath, configString, function(result){
          callback(true)
        })
        const that = this
      }
    },
    createAnsibleConfigForExpandVolume(glusterModel, filePath, ansibleWizardType, isSingleNode, callback) {
      let groups = {};
      let { hosts, volumes, bricks, raidConfig, lvCacheConfig } = glusterModel;
      hosts = glusterModel.expandVolumeHosts
      hosts = hosts.filter(function (e) {
        return e
      })
      groups.hc_nodes = {};
      groups.hc_nodes.hosts = {};
      let groupVars = {}
      if(raidConfig.raidType === "JBOD") {
        groupVars.gluster_infra_disktype = raidConfig.raidType;
      } else {
        groupVars.gluster_infra_disktype = raidConfig.raidType;
        groupVars.gluster_infra_stripe_unit_size = parseInt(raidConfig.stripeSize);
        groupVars.gluster_infra_diskcount = parseInt(raidConfig.diskCount);
      }
     groupVars.gluster_features_force_varlogsizecheck = false

      let hostLength = 1
      if(!isSingleNode) {
        hostLength = hosts.length
      }
      for (let hostIndex = 0; hostIndex < hostLength;hostIndex++){
        let hostVars = {};
        hostVars.gluster_infra_volume_groups = [];
        hostVars.gluster_infra_mount_devices = [];
        let processedDevs = {}; // VG and VDO is processed once per device processedVG implies processedVDO
        let hostBricks = bricks[hostIndex]["host_bricks"];
        let hostCacheConfig = lvCacheConfig[hostIndex];
        hostVars.gluster_infra_vdo = [];
        let groupedBricks = _.groupBy(hostBricks, "device");

        for (let brick of hostBricks){
          let devName = brick.device.split("/").pop();
          let pvName = brick.device;
          let vgName = VG_NAME+`${devName}`;
          let thinpoolName = POOL_NAME+`${vgName}`;
          let lvName = LV_NAME+`${brick.name}`;
          let isDevProcessed = Object.keys(processedDevs).indexOf(devName) > -1;
          let isThinpoolCreated = false;
          if(isDevProcessed){
            isThinpoolCreated = processedDevs[devName]['thinpool'];
          }
          let isVDO = brick.is_vdo_supported == true && brick.logicalSize;
          //TODO: cache more than one device.
          if(hostCacheConfig.lvCache && hostVars.gluster_infra_cache_vars == undefined){
            let selectedThinpName = "gluster_thinpool_gluster_vg_" + hostCacheConfig.thinpoolName
            let cachedisk = "/dev/" + hostCacheConfig.thinpoolName + "," + hostCacheConfig.ssd
            hostVars.gluster_infra_cache_vars = [{
              vgname: "gluster_vg_"+ hostCacheConfig.thinpoolName,
              cachedisk: cachedisk,
              cachelvname: `cachelv_${selectedThinpName}`,
              cachethinpoolname: selectedThinpName,
              cachelvsize: `${hostCacheConfig.lvCacheSize - (hostCacheConfig.lvCacheSize/10)}G`,
              cachemode: hostCacheConfig.cacheMode
            }];
          }
          if(brick.is_vdo_supported){
            let vdoName = `vdo_${devName}`;
            let slabsize = (brick.logicalSize <= 1000) ? "2G": "32G";
            let logicalsize = `${brick.logicalSize}G`;
            pvName = "/dev/mapper/"+vdoName;
            if(hostVars.gluster_infra_vdo.length > 0){
              hostVars.gluster_infra_vdo.forEach(function(inBrick, index){
                if(brick.device !== inBrick.device) {
                  hostVars.gluster_infra_vdo.push({
                    name: vdoName,
                    device: brick.device,
                    slabsize: slabsize,
                    logicalsize: logicalsize,
                    blockmapcachesize: "128M",
                    readcache: "enabled",
                    readcachesize: "20M",
                    emulate512: "on",
                    writepolicy: "auto"
                  });
                } else {
                    let logicalsizes = parseInt(hostVars.gluster_infra_vdo[index].logicalsize.replace(/G/g,"G")) + parseInt(brick.logicalSize)
                    hostVars.gluster_infra_vdo[index].logicalsize = logicalsizes + "G"
                    hostVars.gluster_infra_vdo[index].slabsize = (logicalsizes <= 1000) ? "2G": "32G";
                }
              })
            } else {
              hostVars.gluster_infra_vdo.push({
                name: vdoName,
                device: brick.device,
                slabsize: slabsize,
                logicalsize: logicalsize,
                blockmapcachesize: "128M",
                readcache: "enabled",
                readcachesize: "20M",
                emulate512: "on",
                writepolicy: "auto"
              });
            }
          }

          if(!isDevProcessed){
            //create vg
            hostVars.gluster_infra_volume_groups.push({
              vgname: vgName,
              pvname: pvName
            });
          }
          if(brick.thinp){
            if(hostVars.gluster_infra_thinpools == undefined){
              hostVars.gluster_infra_thinpools = [];
            }
            let poolMetadataSize = this.getPoolMetadataSize(brick.size)
            if(hostVars.gluster_infra_thinpools.length > 0){
              let count = 0
              hostVars.gluster_infra_thinpools.forEach(function(inThinp, index){
                if(thinpoolName === inThinp.thinpoolname) {
                  count++
                }
                if(thinpoolName === inThinp.thinpoolname && parseInt(poolMetadataSize.slice(0, -1)) > parseInt(inThinp.poolmetadatasize.slice(0, -1))) {
                  hostVars.gluster_infra_thinpools[index]['poolmetadatasize'] = poolMetadataSize
                }
              });
              if(count == 0){
                hostVars.gluster_infra_thinpools.push({
                  vgname: vgName,
                  thinpoolname: thinpoolName,
                  poolmetadatasize: poolMetadataSize
                });
              }
            } else {
              hostVars.gluster_infra_thinpools.push({
                vgname: vgName,
                thinpoolname: thinpoolName,
                poolmetadatasize: poolMetadataSize
              });
            }

            isThinpoolCreated = true;
          }

          if(brick.thinp){
            if(hostVars.gluster_infra_lv_logicalvols == undefined){
              hostVars.gluster_infra_lv_logicalvols = [];
            }
            hostVars.gluster_infra_lv_logicalvols.push({
              vgname: vgName,
              thinpool: thinpoolName,
              lvname: lvName,
              lvsize: `${brick.size}G`
            });
          }
          if(!brick.thinp){
            if(hostVars.gluster_infra_thick_lvs == undefined){
              hostVars.gluster_infra_thick_lvs = [];
            }
            let lvSize = ""
            if(brick.is_vdo_supported) {
              let count = 0
              let brickNo = groupedBricks[brick.device].length
              for(let aBrick of groupedBricks[brick.device]) {
                count++
                if(brickNo === count){
                  lvSize = "100%FREE"
                } else {
                  lvSize = `${aBrick.logicalSize}G`
                }
                let hasDuplicate = false
                hostVars.gluster_infra_thick_lvs.map(v => v.lvname).sort().sort((a, b) => {
                  if (a === b) hasDuplicate = true
                })

                if(!hasDuplicate) {
                  hostVars.gluster_infra_thick_lvs.push({
                    vgname: vgName,
                    lvname: LV_NAME+`${aBrick.name}`,
                    size: lvSize
                  });
                }
              }
            } else {
              lvSize = `${brick.size}G`
              hostVars.gluster_infra_thick_lvs.push({
                vgname: vgName,
                lvname: lvName,
                size: lvSize
              });
            }
            hostVars.gluster_infra_thick_lvs = hostVars.gluster_infra_thick_lvs.filter((obj, pos, arr) => {
              return arr.map(mapObj =>
                mapObj['lvname']).indexOf(obj['lvname']) === pos;
              });
          }
          hostVars.gluster_infra_mount_devices.push({
            path: brick.brick_dir,
            lvname: lvName,
            vgname: vgName
          });
          processedDevs[devName] = {thinpool: isThinpoolCreated}
        }
        if(hostVars.gluster_infra_vdo.length === 0) {
          delete hostVars["gluster_infra_vdo"]
        } else {
          hostVars.gluster_infra_vdo = hostVars.gluster_infra_vdo.filter((obj, pos, arr) => {
            return arr.map(mapObj =>
              mapObj['device']).indexOf(obj['device']) === pos;
          });
          hostVars.gluster_infra_vdo = Array.from(new Set(hostVars.gluster_infra_vdo.map(JSON.stringify))).map(JSON.parse);
        }
        groups.hc_nodes.hosts[hosts[hostIndex]] = hostVars;
      }

      groupVars.cluster_nodes = hosts
      groupVars.gluster_features_hci_cluster = "{{ cluster_nodes }}"
      groupVars.gluster_features_hci_volumes = [];
      for(let volumeIndex = 0; volumeIndex < volumes.length;volumeIndex++){
        let volume = volumes[volumeIndex];
        let arbiter = 0
        if(volume.is_arbiter) {
          arbiter = 1
        }
        groupVars.gluster_features_hci_volumes.push({
          volname: volume.name,
          brick: volume.brick_dir,
          arbiter: arbiter
        });
      }
      groups.hc_nodes.vars = groupVars;

      const configString = yaml.dump(groups)
      this.handleDirAndFileCreation(filePath, configString, function(result){
        callback(true)
      })
      const that = this
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
    getArbiterBrickSize(brickSize) {
        //Calculate the size of arbiter brick based on the Brick Size.
        //Formula: max (min_arbiter_size, min (max_arbiter_size, 2 * (brick-size/shard-size) * 4KB) )
        const brickSizeKB = brickSize * 1024 * 1024
        const shardSizeKB = DEFAULT_SHARD_SIZE_KB
        const arbiterSizeKB = Math.max(MIN_ARBITER_BRICK_SIZE_KB, 2 * (brickSizeKB / shardSizeKB) * 4)
        //Return size in GBs
        return Math.ceil(arbiterSizeKB / (1024 * 1024))
    },
    getPoolMetadataSize(poolSize){
        return Math.min(DEFAULT_POOL_METADATA_SIZE_GB, Math.ceil(poolSize * POOL_METADATA_SIZE_PERCENT)) + 'G'
    },
    createHEAnswerFileForGlusterStorage(volumeName, glusterServers, filePath, callback) {
        let configString = "[environment:default]"
        configString = this.appendLine(configString, `OVEHOSTED_STORAGE/storageDomainConnection=str:${glusterServers[0]}:/${volumeName}`)
        if (glusterServers.indexOf("") === -1) {
            configString = this.appendLine(configString, `OVEHOSTED_STORAGE/mntOptions=str:backup-volfile-servers=${glusterServers.slice(1).join(":")}`)
        }
        this.handleDirAndFileCreation(filePath, configString, function(result){
          callback(true)
        })
    },
    runAnsiblePlaybook(isVerbosityEnabled, configFile, stdoutCallback, successCallback, failCallback, callBack) {
          const options = { "environ": ["ANSIBLE_INVENTORY_UNPARSED_FAILED=true"] };
          let cmd = [];
          if(isVerbosityEnabled) {
            cmd = ["/root/../usr/bin/ansible-playbook",
               "/root/../usr/share/cockpit/ovirt-dashboard/ansible/hc_wizard.yml",
               "-i",
               configFile, "-vv"
             ];
          } else {
            cmd = ["/root/../usr/bin/ansible-playbook",
               "/root/../usr/share/cockpit/ovirt-dashboard/ansible/hc_wizard.yml",
               "-i",
               configFile
             ];
          }
          cockpit.spawn(cmd, options)
          .done(function(successCallback){
            console.log("Playbook executed successfully. ",successCallback);
            callBack(true);
          })
          .fail(function(failCallback){
            console.log("Playbook execution failed. ",failCallback);
            callBack(failCallback)
          })
          .stream(stdoutCallback);
    },
    runAnsibleCleanupPlaybook(stdoutCallback, successCallback, failCallback, callBack) {
          const options = { "environ": ["ANSIBLE_INVENTORY_UNPARSED_FAILED=true"] };
          let cmd = ["/root/../usr/bin/ansible-playbook",
             constants.glusterCleanupPlayBook,
             "-i",
             constants.ansibleInventoryFile
           ];
           cockpit.spawn(cmd, options)
           .done(function(successCallback){
             console.log("Cleanup Playbook executed successfully. ",successCallback);
             if(typeof callBack === 'function'){
               callBack(true)
             }
           })
           .fail(function(failCallback){
             console.log("Cleanup Playbook execution failed. ",failCallback);
             if(typeof callBack === 'function'){
               callBack(failCallback)
             }
           })
           .stream(stdoutCallback);
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
    isRhvhSystem(callBack){
        let proc = cockpit.spawn(
            ["grep",
             'VARIANT="Red Hat Virtualization Host"',
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
        [ "mkdir", "-p", dirPath ], { "superuser":"require" }
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
      // pick only file name, omiting .yml
      const fileName = filePath.split("/").pop().split(".")[0]
      // Complete file path containing timestamp.
      const backupPath = dirPath + "/" + fileName + "-" + new Date().getTime() + "." + filePath.split(".")[1]
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
      // Executing vdo command to know vdo support
      const that = this
      cockpit.spawn(
        [ "vdo", "list" ], { "superuser":"require" }
      ).done(function(res){
        callback(true)
      }).fail(function(code){
        callback(false)
      })
    },
    // Creates file required to add the 2nd and 3rd hosts and storage domain
    // to the engine after successful HE deployment
    saveGlusterInventory(glusterModel) {
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
            sdModel.path = "/" + volume.name
            sdModel.mount_options = mntOptions
            sdModelList.push(sdModel)
          }
        })
        let glusterInventory = "gluster:\n hosts:\n  " + glusterModel.fqdns[0] + ":\n  " + glusterModel.fqdns[1]
                              + ":\n vars:\n  storage_domains: " + JSON.stringify(sdModelList)
        let filePath = constants.glusterInventory
        const that = this
        const dirPath = filePath.substring(0, filePath.lastIndexOf("/"))
        cockpit.script("if [ ! -d " + dirPath + " ]; then mkdir " + dirPath + "; fi", { "superuser": "require" })
          .done(function(exitCode) {
            const file = cockpit.file(filePath, {"superuser": "require" })
            file.replace(glusterInventory)
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
    // Creates file required to add storage domain
    // to the engine after successful HE deployment for Single Node Deployment
    saveGlusterInventoryForSingleNode(glusterModel) {
      if(glusterModel.isSingleNode) {
        let inventoryModel = {
          "gluster": {}
        }
        let sdModelList = []
        let firstHostFqdn = glusterModel.hosts[0]
        inventoryModel.gluster.hosts = [firstHostFqdn]
        glusterModel.volumes.forEach(function(volume, index) {
          if(index !== 0) {
            let sdModel = {}
            sdModel.name = volume.name
            sdModel.host = firstHostFqdn
            sdModel.address = firstHostFqdn
            sdModel.path = "/" + volume.name
            sdModel.mount_options = ""
            sdModelList.push(sdModel)
          }
        })
        let glusterInventory = "gluster:\n hosts:\n  " + firstHostFqdn + ":\n "
                                + "vars:\n  storage_domains: " + JSON.stringify(sdModelList)
        let filePath = constants.glusterInventory
        const that = this
        const dirPath = filePath.substring(0, filePath.lastIndexOf("/"))
        cockpit.script("if [ ! -d " + dirPath + " ]; then mkdir " + dirPath + "; fi", { "superuser": "require" })
          .done(function(exitCode) {
            const file = cockpit.file(filePath, {"superuser": "require" })
            file.replace(glusterInventory)
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
    },
    isHostAddedInKnownHosts(address, callBack) {
      let proc = cockpit.spawn(
          ["ssh-keygen","-F",
            address
          ]
      )
      .done(function(code) {
          callBack(true)
      })
      .fail(function(code) {
          callBack(false)
      })
    },
    isGlusterAnsibleAvailable(callback) {
      cockpit.spawn(
        [ "rpm", "-qa", "gluster-ansible-roles" ], { "superuser":"require" }
      ).done(function(gVersion){
        if (typeof gVersion === "string" && gVersion !== "") {
          callback(true);
        } else {
          callback(false);
        }
      }).fail(function(code){
        callback(false)
      })
    },
    createExpandClusterConfig(glusterModel, expandClusterConfigFilePath){
      const that = this
      let filePath = expandClusterConfigFilePath
        var configString = "[hosts]" + "\n"
        for (var i = 0; i < glusterModel.hosts.length; i++) {
          configString += glusterModel.hosts[i] + "\n"
        }
        that.handleDirAndFileCreation(filePath, configString, function(result){
          console.log("Result after creating expand cluster config file: ", result);
        })
    },
    runExpandCluster(callBack){
      const options = { "environ": ["ANSIBLE_INVENTORY_UNPARSED_FAILED=true"] };
      let cmd = ["/root/../usr/bin/ansible-playbook",
         constants.expandClusterPlayBook,
         "-i",
         constants.expandClusterConfigFilePath
       ];
       cockpit.spawn(cmd, options)
       .done(function(code) {
         callBack(true)
       })
       .fail(function(code) {
         callBack(false)
       })
    }
}

export default AnsibleUtil
