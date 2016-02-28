// TODO: wrap into object GLOBAL

var GLOBAL = {
    hosts : {} // map host-id : host
};
var autoRefresher;
var latestHostVMSList = {};// latest parsed&successful VDSM's getAllVmStats() result
var latestEngineVmsList = {}; // latest parsed&successful engine VMS list
var vmUsage = {}; // historical usage statistics, see addVmUsage()
var hosts = {}; // map host-id : host
