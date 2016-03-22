export var GLOBAL = {
  autoRefresher: true,
  latestHostVMSList: {}, // latest parsed&successful VDSM's getAllVmStats() result
  latestEngineVmsList: {}, // latest parsed&successful engine VMS list
  vmUsage: {}, // historical usage statistics, see addVmUsage()
  vmUsageMax: {
    disk: 0,
    net: 0
  },
  hosts: {} // map host-id : host
}
