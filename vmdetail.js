// --- vm-detail-screen & vm manipulation methods -----------------------

// depends on hostvms.js::latestHostVMSList

var VM_STATUS_ICONS_PATH_PREFIX = "external/images/";
var VM_STATUS_ICONS = {
//    "Default": "",
    "down": "off.png",
    "up": "on.png",
    "powering up":"powering_up.png",
    "powering down": "powering_down.png"
    //"Paused":""
/*    MigratingFrom = 5,
    MigratingTo = 6,
    Unknown = 7,
    NotResponding = 8,
    WaitForLaunch = 9,
    RebootInProgress = 10,
    SavingState = 11,
    RestoringState = 12,
    Suspended = 13,
    ImageIllegal = 14,
    ImageLocked = 15,
    PoweringDown = 16*/
};

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

    printError("TODO: finish generating of console.vv file. " + url);
}

function shutdown(vmId) {
    spawnVdsm("shutdown", null, null, shutdownSuccess, vdsmFail, vmId);
    //disableButton('btn-shutdown-' + vmId);
}

function shutdownSuccess() {
    setTimeout(readVmsList, DELAY_BEFORE_RELOAD_AFTER_VDSM_ACTION);
}

function forceoff(vmId) {
    spawnVdsm("destroy", null, null, shutdownSuccess, vdsmFail, vmId);
    //disableButton('btn-forceoff-' + vmId);
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
    var lineOptions = {
        ///Boolean - Whether grid lines are shown across the chart
        scaleShowGridLines: true,
        //String - Colour of the grid lines
        scaleGridLineColor: "rgba(0,0,0,.05)",
        //Number - Width of the grid lines
        scaleGridLineWidth: 1,
        //Boolean - Whether to show horizontal lines (except X axis)
        scaleShowHorizontalLines: true,
        //Boolean - Whether to show vertical lines (except Y axis)
        scaleShowVerticalLines: true,
        //Boolean - Whether the line is curved between points
        bezierCurve: true,
        //Number - Tension of the bezier curve between points
        bezierCurveTension: 0.2,//0.4
        //Boolean - Whether to show a dot for each point
        pointDot: true,
        //Number - Radius of each point dot in pixels
        pointDotRadius: 1,
        //Number - Pixel width of point dot stroke
        pointDotStrokeWidth: 1,
        //Number - amount extra to add to the radius to cater for hit detection outside the drawn point
        pointHitDetectionRadius: 10,
        //Boolean - Whether to show a stroke for datasets
        datasetStroke: true,
        //Number - Pixel width of dataset stroke
        datasetStrokeWidth: 1,//2
        //Boolean - Whether to fill the dataset with a colour
        datasetFill: false,
        //String - A legend template
        legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].strokeColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>"
    };

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

function getUsageDataset(usageRecords, attr1, attr2, inclSum) {
    var ds1 = [];
    var ds2 = [];
    var total = [];
    var timestamps = [];

    var pruneFactor = Math.floor(usageRecords.length / USAGE_CHART_MAX_POINTS);
    pruneFactor = (pruneFactor == 0) ? 1 : pruneFactor;
    for (var index = 0; index < usageRecords.length; index++) {
        if (index == 0 || index == (usageRecords.length - 1) || (index % pruneFactor) == 0) {
            var ur = usageRecords[index];

            var a = parseFloat(ur[attr1]);
            ds1.push(a);

            if (attr2) {
                var b = parseFloat(ur[attr2]);
                ds2.push(b);

                if (inclSum) {
                    total.push(a + b);
                }
            }

            if (index == 0 || index == (usageRecords.length - 1) || (index % USAGE_CHART_TIMESTAMP_DENSITY) == 0) {
                timestamps.push(ur.timestamp);
            } else {
                timestamps.push("");
            }
        }
    }

    return {
        ds1: ds1,
        ds2: ds2,
        timestamps: timestamps,
        total: total
    }
}

function renderCpuChartDetail(myChart, usageRecords, options) {
    if (myChart != null) {
        var ds = getUsageDataset(usageRecords, 'cpuSys', 'cpuUser', true);

        var cpuSysFillColor = "rgba(255,255,255,0.1)";
        var cpuSysPointColor = "rgba(255,0,0,1)";
        var cpuSysStrokeColor = "rgba(255,255,255,0.5)";

        var cpuUserPointColor = "rgba(0,255,0,1)";
        var cpuUserStrokeColor = "rgba(0,255,0,1)";

        var cpuTotalPointColor = "rgba(0,0,255,1)";
        var cpuTotalStrokeColor = "rgba(0,0,255,1)";
        myChart.Line({
            labels: ds.timestamps,
            datasets: [
                {
                    label: "System",
                    fillColor: cpuSysFillColor,
                    strokeColor: cpuSysStrokeColor,
                    pointColor: cpuSysPointColor,
                    pointStrokeColor: cpuSysStrokeColor,
                    pointHighlightFill: cpuSysPointColor,
                    pointHighlightStroke: cpuSysPointColor,
                    data: ds.ds1
                },
                {
                    label: "User",
                    fillColor: cpuSysFillColor,
                    strokeColor: cpuUserStrokeColor,
                    pointColor: cpuUserPointColor,
                    pointStrokeColor: cpuUserStrokeColor,
                    pointHighlightFill: cpuUserPointColor,
                    pointHighlightStroke: cpuUserPointColor,
                    data: ds.ds2
                },
                {
                    label: "Total",
                    fillColor: cpuSysFillColor,
                    strokeColor: cpuTotalStrokeColor,
                    pointColor: cpuTotalPointColor,
                    pointStrokeColor: cpuTotalStrokeColor,
                    pointHighlightFill: cpuTotalPointColor,
                    pointHighlightStroke: cpuTotalPointColor,
                    data: ds.total
                }
            ]
        }, options);
    }
}

function renderMemoryChartDetail(myChart, usageRecords, options) {
    if (myChart != null) {
        var ds = getUsageDataset(usageRecords, 'memory', null);

        var memoryFillColor = "rgba(255,255,255,0.1)";
        var memoryPointColor = "rgba(0,255,0,1)";
        var memoryStrokeColor = "rgba(0,255,0,1)";
        myChart.Line({
            labels: ds.timestamps,
            datasets: [
                {
                    label: "Used Memory",
                    fillColor: memoryFillColor,
                    strokeColor: memoryStrokeColor,
                    pointColor: memoryPointColor,
                    pointStrokeColor: memoryStrokeColor,
                    pointHighlightFill: memoryPointColor,
                    pointHighlightStroke: memoryPointColor,
                    data: ds.ds1
                }
            ]
        }, options);
    }
}

function renderDiskIOChartDetail(myChart, usageRecords, options) {
    if (myChart != null) {
        var ds = getUsageDataset(usageRecords, 'diskRead', 'diskWrite');

        var writeFillColor = "rgba(255,255,255,0.1)";
        var writePointColor = "rgba(255,0,0,1)";
        var writeStrokeColor = "rgba(255,255,255,0.5)";

        var readPointColor = "rgba(0,255,0,1)";
        var readStrokeColor = "rgba(0,255,0,1)";

        myChart.Line({
            labels: ds.timestamps,
            datasets: [
                {
                    label: "Write",
                    fillColor: writeFillColor,
                    strokeColor: writeStrokeColor,
                    pointColor: writePointColor,
                    pointStrokeColor: writeStrokeColor,
                    pointHighlightFill: writePointColor,
                    pointHighlightStroke: writePointColor,
                    data: ds.ds2
                },
                {
                    label: "Read",
                    fillColor: writeFillColor,
                    strokeColor: readStrokeColor,
                    pointColor: readPointColor,
                    pointStrokeColor: readStrokeColor,
                    pointHighlightFill: readPointColor,
                    pointHighlightStroke: readPointColor,
                    data: ds.ds1
                }
            ]
        }, options);
    }
}

function renderNetworkIOChartDetail(myChart, usageRecords, options) {
    if (myChart != null) {
        var ds = getUsageDataset(usageRecords, 'netRx', 'netTx');

        var writeFillColor = "rgba(255,255,255,0.1)";
        var writePointColor = "rgba(255,0,0,1)";
        var writeStrokeColor = "rgba(255,255,255,0.5)";

        var readPointColor = "rgba(0,255,0,1)";
        var readStrokeColor = "rgba(0,255,0,1)";

        myChart.Line({
            labels: ds.timestamps,
            datasets: [
                {
                    label: "Tx",
                    fillColor: writeFillColor,
                    strokeColor: writeStrokeColor,
                    pointColor: writePointColor,
                    pointStrokeColor: writeStrokeColor,
                    pointHighlightFill: writePointColor,
                    pointHighlightStroke: writePointColor,
                    data: ds.ds2
                },
                {
                    label: "Rx",
                    fillColor: writeFillColor,
                    strokeColor: readStrokeColor,
                    pointColor: readPointColor,
                    pointStrokeColor: readStrokeColor,
                    pointHighlightFill: readPointColor,
                    pointHighlightStroke: readPointColor,
                    data: ds.ds1
                }
            ]
        }, options);
    }
}

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

function vmStatusToHtml(status) {
    var html = "";
    var iconFile = VM_STATUS_ICONS[status.toLowerCase()];
    if (iconFile) {
        html = "<img src=\"" + VM_STATUS_ICONS_PATH_PREFIX + iconFile + "\" title=\"" + status + "\" width=\"30\" height=\"30\">";
    } else {
        html = status;// use text as default
    }

    //debugMsg("vmStatusToHtml(" + status + "): " + html);
    return html;
}