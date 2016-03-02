// TODO: wrap into object GLOBAL

export var GLOBAL = {
  autoRefresher: {},
  latestHostVMSList: {}, // latest parsed&successful VDSM's getAllVmStats() result
  latestEngineVmsList: {}, // latest parsed&successful engine VMS list
  vmUsage: {}, // historical usage statistics, see addVmUsage()
  hosts: {} // map host-id : host
}
