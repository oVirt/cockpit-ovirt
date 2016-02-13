// --- vm-detail-screen & vm manipulation methods -----------------------

// depends on hostvms.js::latestHostVMSList

function consoleFileContent(vm) {
// TODO: content of .vv file
    var blob = new Blob([
        "Hello, world!\n",
        "TODO: generate .vv file"
    ], {type: "text/plain;charset=utf-8"});

    return blob;
}

function downloadConsole(vmId) {
    var vm = getVmDetails_vdsmToInternal(vmId, latestHostVMSList);

    saveAs(consoleFileContent(vm), "console.vv");

    printError("TODO: finish generating of console file");
}

function shutdown(vmId) {
    spawnVdsm("shutdown", null, null, shutdownSuccess, vmId);
    disableButton('btn-shutdown-' + vmId);
}

function shutdownSuccess() {
    setTimeout(readVmsList, DELAY_BEFORE_RELOAD_AFTER_VDSM_ACTION);
}

function forceoff(vmId) {
    spawnVdsm("destroy", null, null, shutdownSuccess, vmId);
    disableButton('btn-forceoff-' + vmId);
}

function renderVmDetailActual() {// called after successful readVmsList() to refresh rendered VM Detail
    var vmId = getVmIdFromPath();
    if (vmId != null) {
        renderVmDetail(vmId);
    }
}

function renderVmDetail(vmId) {
    // populate VM detail data
    var vm = getVmDetails_vdsmToInternal(vmId, latestHostVMSList);

    if (vm != null) {
        var template = $("#vm-detail-templ").html();
        var html = Mustache.to_html(template, vm);
        $("#vm-detail-content").html(html);

        $("#vm-detail-not-available").hide();

        renderUsageChartsDetail(vmId);
    } else {
        $("#vm-detail-not-available").show();
    }
}

function renderUsageChartsDetail(vmId) {
    var lineOptions = {};

    var usageRecords = vmUsage[vmId];
    if (usageRecords) {// TODO: optimization: call chart.addData instead of full rendering
        renderCpuChartDetail(getUsageChartDetail("cpu", vmId), usageRecords, lineOptions);
        renderMemoryChartDetail(getUsageChartDetail("mem", vmId), usageRecords, lineOptions);
        renderDiskIOChartDetail(getUsageChartDetail("diskio", vmId), usageRecords, lineOptions);
        renderNetworkIOChartDetail(getUsageChartDetail("networkio", vmId), usageRecords, lineOptions);
    }
}

function getUsageChartDetail(device, vmId) {
    var deviceId = "#" + device + "UsageChartDetail-" + vmId;
    if ($(deviceId) == null || $(deviceId).get(0) == null) {
        return null;
    }

    var ctx = $(deviceId).get(0).getContext("2d");
    var myChart = new Chart(ctx);
    return myChart;
}

function renderCpuChartDetail(myChart, usageRecords, options) {
    if (myChart != null) {
        var system = [];
        var user = [];
        var total = [];
        var timestamps = [];
        var tsCounter = 0;
        usageRecords.forEach(function _(ur){
            var s = parseFloat(ur.cpuSys);//normalizePercentage(ur.cpuSys);
            var u = parseFloat(ur.cpuUser);//normalizePercentage(ur.cpuUser);
            system.push(s);
            user.push(u);
            total.push(s+u);

            if (usageRecords.length < 5 || (tsCounter++) % 4 == 0) {
                timestamps.push(ur.timestamp);
            } else {
                timestamps.push("");
            }
        });
        var cpuSysFillColor = "rgba(255,255,255,0.1)";
        var cpuSysPointColor = "rgba(255,0,0,1)";
        var cpuSysStrokeColor = "rgba(255,255,255,0.5)";

        var cpuUserPointColor = "rgba(0,255,0,1)";
        var cpuUserStrokeColor = "rgba(0,255,0,1)";

        var cpuTotalPointColor = "rgba(0,0,255,1)";
        var cpuTotalStrokeColor = "rgba(0,0,255,1)";
        myChart.Line({
            labels: timestamps,
            datasets:[
                {
                    label: "System",
                    fillColor: cpuSysFillColor,
                    strokeColor: cpuSysStrokeColor,
                    pointColor: cpuSysPointColor,
                    pointStrokeColor: cpuSysStrokeColor,
                    pointHighlightFill: cpuSysPointColor,
                    pointHighlightStroke: cpuSysPointColor,
                    data: system
                },
                {
                    label: "User",
                    fillColor: cpuSysFillColor,
                    strokeColor: cpuUserStrokeColor,
                    pointColor: cpuUserPointColor,
                    pointStrokeColor: cpuUserStrokeColor,
                    pointHighlightFill: cpuUserPointColor,
                    pointHighlightStroke: cpuUserPointColor,
                    data: user
                },
                {
                    label: "Total",
                    fillColor: cpuSysFillColor,
                    strokeColor: cpuTotalStrokeColor,
                    pointColor: cpuTotalPointColor,
                    pointStrokeColor: cpuTotalStrokeColor,
                    pointHighlightFill: cpuTotalPointColor,
                    pointHighlightStroke: cpuTotalPointColor,
                    data: total
                }
            ]
        }, options);
    }
}

function renderMemoryChartDetail(myChart, usageRecords, options) {
    if (myChart != null) {
        var memory = [];
        var timestamps = [];
        var tsCounter = 0;
        usageRecords.forEach(function _(ur){
            var m = parseFloat(ur.memory);//normalizePercentage(ur.cpuSys);
            memory.push(m);

            if (usageRecords.length < 5 || (tsCounter++) % 4 == 0) {
                timestamps.push(ur.timestamp);
            } else {
                timestamps.push("");
            }
        });
        var memoryFillColor = "rgba(255,255,255,0.1)";
        var memoryPointColor = "rgba(0,255,0,1)";
        var memoryStrokeColor = "rgba(0,255,0,1)";
        myChart.Line({
            labels: timestamps,
            datasets:[
                {
                    label: "Used Memory",
                    fillColor: memoryFillColor,
                    strokeColor: memoryStrokeColor,
                    pointColor: memoryPointColor,
                    pointStrokeColor: memoryStrokeColor,
                    pointHighlightFill: memoryPointColor,
                    pointHighlightStroke: memoryPointColor,
                    data: memory
                }
            ]
        }, options);
    }}

function renderDiskIOChartDetail(myChart, usageRecords, options) {
    if (myChart != null) {
        var read = [];
        var write = [];
        var timestamps = [];
        var tsCounter = 0;
        usageRecords.forEach(function _(ur){
            var r = parseFloat(ur.diskRead);
            var w = parseFloat(ur.diskWrite);
            read.push(r);
            write.push(w);

            if (usageRecords.length < 5 || (tsCounter++) % 4 == 0) {
                timestamps.push(ur.timestamp);
            } else {
                timestamps.push("");
            }
        });
        var writeFillColor = "rgba(255,255,255,0.1)";
        var writePointColor = "rgba(255,0,0,1)";
        var writeStrokeColor = "rgba(255,255,255,0.5)";

        var readPointColor = "rgba(0,255,0,1)";
        var readStrokeColor = "rgba(0,255,0,1)";

        myChart.Line({
            labels: timestamps,
            datasets:[
                {
                    label: "Write",
                    fillColor: writeFillColor,
                    strokeColor: writeStrokeColor,
                    pointColor: writePointColor,
                    pointStrokeColor: writeStrokeColor,
                    pointHighlightFill: writePointColor,
                    pointHighlightStroke: writePointColor,
                    data: write
                },
                {
                    label: "Read",
                    fillColor: writeFillColor,
                    strokeColor: readStrokeColor,
                    pointColor: readPointColor,
                    pointStrokeColor: readStrokeColor,
                    pointHighlightFill: readPointColor,
                    pointHighlightStroke: readPointColor,
                    data: read
                }
            ]
        }, options);
    }
}

function renderNetworkIOChartDetail(myChart, usageRecords, options) {
    if (myChart != null) {
        var read = [];
        var write = [];
        var timestamps = [];
        var tsCounter = 0;
        usageRecords.forEach(function _(ur){
            var r = parseFloat(ur.netRx);
            var w = parseFloat(ur.netTx);
            read.push(r);
            write.push(w);

            if (usageRecords.length < 5 || (tsCounter++) % 4 == 0) {
                timestamps.push(ur.timestamp);
            } else {
                timestamps.push("");
            }
        });
        var writeFillColor = "rgba(255,255,255,0.1)";
        var writePointColor = "rgba(255,0,0,1)";
        var writeStrokeColor = "rgba(255,255,255,0.5)";

        var readPointColor = "rgba(0,255,0,1)";
        var readStrokeColor = "rgba(0,255,0,1)";

        myChart.Line({
            labels: timestamps,
            datasets:[
                {
                    label: "Write",
                    fillColor: writeFillColor,
                    strokeColor: writeStrokeColor,
                    pointColor: writePointColor,
                    pointStrokeColor: writeStrokeColor,
                    pointHighlightFill: writePointColor,
                    pointHighlightStroke: writePointColor,
                    data: write
                },
                {
                    label: "Read",
                    fillColor: writeFillColor,
                    strokeColor: readStrokeColor,
                    pointColor: readPointColor,
                    pointStrokeColor: readStrokeColor,
                    pointHighlightFill: readPointColor,
                    pointHighlightStroke: readPointColor,
                    data: read
                }
            ]
        }, options);
    }}

// ----------------------------------------------------------------------
function getVmDetails_vdsmToInternal(vmId, parsedVdsmGetAllVMs) {// lookup cached VM detail
    if (parsedVdsmGetAllVMs.hasOwnProperty('items')) {
        for (var i = 0; i < parsedVdsmGetAllVMs.items.length; i++) {
            var src = parsedVdsmGetAllVMs.items[i];
            if (src.vmId == vmId) {
                return _getVmDetails(src);
            }
        }
    }

    return null;
}
