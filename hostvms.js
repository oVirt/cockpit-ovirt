// --- vms-screen -------------------------------------------------------
var latestHostVMSList = "";// latest parsed&successful VDSM's getAllVmStats() result
var vmUsage = {}; // historical usage statistics, see addVmUsage()

var vdsmDataVmsList = ""; // might be partial output from the VDSM process; TODO: risk of data overlapping
function vdsmOutput(data) {
    vdsmDataVmsList += data;
    debugMsg("vdsmOutput: <code>" + vdsmDataVmsList + "</code>");
}

function readVmsList() {// invoke VDSM to get fresh vms data from the host
    spawnVdsm("getAllVmStats", null, vdsmOutput, getAllVmStatsSuccess);
    vdsmDataVmsList = "";
}

function getAllVmStatsSuccess() {
    var vms = parseVdsmJson(vdsmDataVmsList);
    if (vms != null) {
        if (vms.status.code == 0) {
            latestHostVMSList = vms; // cache for reuse i.e. in displayVMDetail()
            renderHostVms(vms);
        } else {
            printError("getAllVmStats() error (" + vms.status.code + "): " + vms.status.message);
        }
    }
}

function renderHostVms(vmsFull) {
    // the 'vmsFull' is parsed json result of getAllVmStats()
    if (vmsFull.hasOwnProperty('items') && vmsFull.items.length > 0) {
        var vms = [];

        // prepare data
        var timestamp = getActualTimeStamp();
        vmsFull.items.forEach(function translate(srcVm) {
            var vm = _getVmDetails(srcVm);
            vms.push(vm);

            var diskRead = getVmDeviceRate(vm, 'disks', 'readRate');
            var diskWrite = getVmDeviceRate(vm, 'disks', 'writeRate');
            var netRx = getVmDeviceRate(vm, 'network', 'rxRate');
            var netTx = getVmDeviceRate(vm, 'network', 'txRate');
            addVmUsage(vm.id, timestamp, parseFloat(vm.cpuUser), parseFloat(vm.cpuSys), parseFloat(vm.memUsage),
                diskRead, diskWrite, netRx, netTx);
        });

        // render vms list from template
        var data = {units: vms};
        var template = $("#vms-list-templ").html();
        var html = Mustache.to_html(template, data);
        $("#virtual-machines-list").html(html);
        $("#virtual-machines-novm-message").hide();


        refreshUsageCharts();
        renderVmDetailActual();
    } else {
        $("#virtual-machines-list").html("");
        $("#virtual-machines-novm-message").show();
    }
}

function getVmDeviceRate(vm, device, rateName) {
    var total = 0.0;
    if (vm.hasOwnProperty(device)) {
        vm[device].forEach(function (d) {
            if (d.hasOwnProperty(rateName)) {
                var rate = parseFloat(d[rateName]);
                total += rate;
            }
        });

    }
    return total;
}

function onVmClick(vmId) {// show vm detail
    goTo('/vm/' + vmId);
}

// --- vms-screen usage charts ------------------------------------------
function addVmUsage(vmId, timestamp, cpuUser, cpuSys, mem, diskRead, diskWrite, netRx, netTx) {
    var record = {
        timestamp: timestamp,
        cpuUser: cpuUser,
        cpuSys: cpuSys,
        memory: mem,
        diskRead: diskRead,
        diskWrite: diskWrite,
        netRx: netRx,
        netTx: netTx
    };

    if (!vmUsage[vmId]) {
        vmUsage[vmId] = [];
    }

    // TODO: limit length of historical data
    vmUsage[vmId].push(record); // keep history
}

function getUsageChart(device, vmId) {
    var deviceId = "#" + device + "UsageChart-" + vmId;
    if ($(deviceId) == null || $(deviceId).get(0) == null) {
        return null;
    }

    var ctx = $(deviceId).get(0).getContext("2d");
    var myChart = new Chart(ctx);
    return myChart;
}

function refreshCpuChart(myChart, usageRecord, options) {
    if (myChart != null) {
        var user = normalizePercentage(usageRecord.cpuUser);
        var sys = normalizePercentage(usageRecord.cpuSys);
        var idle = 1.0 - Math.min(user + sys, 1.0);
        myChart.Doughnut([
            {
                value: user,
                color: "#46BFBD",
                highlight: "#5AD3D1"
            },
            {
                value: sys,
                color: "#F7464A",
                highlight: "#FF5A5E"
            },
            {
                value: idle,
                color: "#33FF33",
                highlight: "#33FF99"
            }
        ], options);
    }
}

function refreshMemoryChart(myChart, usageRecord, options) {
    if (myChart != null) {
        var used = normalizePercentage(usageRecord.memory);
        var free = 1.0 - used;
        myChart.Doughnut([
            {
                value: used,
                color: "#46BFBD",
                highlight: "#5AD3D1"
            },
            {
                value: free,
                color: "#33FF33",
                highlight: "#33FF99"
            }
        ], options);
    }
}

function refreshBarChart(myChart, r, w, options) {
    myChart.Bar({
        labels: ['R,W'],
        datasets: [
            {label: "Read",
                fillColor: "#46BFBD",
                strokeColor: "#5AD3D1",
                highlightFill: "#46BFBD",
                highlightStroke: "#5AD3D1",
                data: [r]},
            {label: "Write",
                fillColor: "#F7464A",
                strokeColor: "#FF5A5E",
                highlightFill: "#F7464A",
                highlightStroke: "#FF5A5E",
                data: [w]}
        ]}, options);
}

function refreshDiskIOChart(myChart, usageRecord, options) {
    if (myChart != null) {
        var r = usageRecord.diskRead;
        var w = usageRecord.diskWrite;
        refreshBarChart(myChart, r, w, options);
    }
}

function refreshNetworkIOChart(myChart, usageRecord, options) {
    if (myChart != null) {
        var r = usageRecord.netRx;
        var w = usageRecord.netTx;
        refreshBarChart(myChart, r, w, options);
    }
}

function refreshUsageCharts() {
    var doughnutOptions = {
        animateRotate:false,
        animateScale: false
    };
    var barOptions = {};
    $.each(vmUsage, function (key, usageRecords) {
        if (usageRecords.length > 0) {
            var last = usageRecords[usageRecords.length - 1];
            refreshCpuChart(getUsageChart("cpu", key), last, doughnutOptions);
            refreshMemoryChart(getUsageChart("mem", key), last, doughnutOptions);
            refreshDiskIOChart(getUsageChart("diskio", key), last, barOptions);
            refreshNetworkIOChart(getUsageChart("networkio", key), last, barOptions);
        }
    });
}

// ----------------------------------------------------------------------
function _getVmDetails(src) { // src is one item from parsed getAllVmStats
    var vm = {
        id: src.vmId,
        name: src.vmName,
        guestIPs: src.guestIPs,
        status: src.status,
        guestFQDN: src.guestFQDN,
        username: src.username,

        displayType: src.displayType,
        displayIp: src.displayIp,
        displayPort: src.displayPort,
        displayInfo: src.displayInfo,

        appsList: src.appsList,

        memUsage: src.memUsage,
        cpuUser: src.cpuUser,
        elapsedTime: src.elapsedTime,
        cpuSys: src.cpuSys,
        vcpuPeriod: src.vcpuPeriod,
        vcpuQuota: src.vcpuQuota,
        guestCPUCount: src.guestCPUCount,

        vmType: src.vmType,
        kvmEnable: src.kvmEnable,
        acpiEnable: src.acpiEnable,
    };
    return vm;
}
