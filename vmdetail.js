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
    saveAs(consoleFileContent(vm), "console.vv"); // TODO: resolve content-security-policy error

    printError("TODO: finish generating of console.vv file. ");
}

function shutdown(vmId) {
    spawnVdsm("shutdown", null, null, shutdownSuccess, vdsmFail, vmId);
}

function shutdownSuccess() {
    setTimeout(readVmsList, CONFIG.reload.delay_after_vdsm_action);
}

function forceoff(vmId) {
    spawnVdsm("destroy", null, null, shutdownSuccess, vdsmFail, vmId);
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
    /*
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
*/
    var usageRecords = vmUsage[vmId];
    if (usageRecords) {// TODO: optimization: add data to existing chart instead of full rendering
        renderCpuChartDetail(getUsageDetailElementId("cpu", vmId), usageRecords);
        renderMemoryChartDetail(getUsageDetailElementId("mem", vmId), usageRecords);
        renderDiskIOChartDetail(getUsageDetailElementId("diskio", vmId), usageRecords);
        renderNetworkIOChartDetail(getUsageDetailElementId("networkio", vmId), usageRecords);
    }
}

function getUsageDetailElementId(device, vmId) {
    var divId = "#" + device + "UsageChartDetail-" + vmId;
    return divId;
}
/*
function getUsageChartDetail(device, vmId) {
    var deviceId = getUsageDetailElementId(device, vmId);
    if ($(deviceId) == null || $(deviceId).get(0) == null) {
        return null;
    }

    var ctx = $(deviceId).get(0).getContext("2d");
    var myChart = new Chart(ctx);
    return myChart;
}
*/
function getUsageDataset(usageRecords, attr1, attr2, inclSum) {
    var ds1 = [];
    var ds2 = [];
    var total = [];
    var timestamps = [];

    var pruneFactor = Math.floor(usageRecords.length / CONFIG.charts.usage_chart_max_points);
    pruneFactor = (pruneFactor == 0) ? 1 : pruneFactor;
    for (var index = 0; index < usageRecords.length; index++) {
        if (index == 0 || index == (usageRecords.length - 1) || (index % pruneFactor) == 0) {
            var ur = usageRecords[index];

            var a = parseFloat(ur[attr1]).toFixed(1);
            ds1.push(a);

            if (attr2) {
                var b = parseFloat(ur[attr2]).toFixed(1);
                ds2.push(b);

                if (inclSum) {
                    total.push( (parseFloat(a) + parseFloat(b)).toFixed(1) );
                }
            }

//            if (index == 0 || index == (usageRecords.length - 1) || (index % USAGE_CHART_TIMESTAMP_DENSITY) == 0) {
                timestamps.push(ur.timestamp);
/*            } else {
                timestamps.push("");
            }*/
        }
    }

    return {
        ds1: ds1,
        ds2: ds2,
        timestamps: timestamps,
        total: total
    }
}
function prefillDs(ds) {
    if (ds) {
        while (ds.length < 10) {
            ds.splice(1, 0, 0);
        }
    }
}

function renderUsageDetailChart(chartDivId, timestamps, dsArray1, dsArray2) {
    prefillDs(dsArray1);
    prefillDs(dsArray2);
    renderSparklineChart(chartDivId, timestamps, dsArray1, dsArray2);
}

function renderSpinner(chartDivId) {
    $(chartDivId).html('<div class="spinner spinner-sm"></div>');
}

// TODO: add timestamps
function renderSparklineChart(chartDivId, timestamps, dataArray1, dataArray2) {
    var chartConfig = jQuery().c3ChartDefaults().getDefaultSparklineConfig();
    chartConfig.bindto = chartDivId;
    chartConfig.data = {
        columns: [dataArray1],
        axis: {
            x: {
                show: true
            },
            y: {
                show: true
            }
        },
        legend: {
            show: true,
            position: 'right'
        },
        type: 'area'
    };

    if (dataArray2) {
        chartConfig.data.columns.push(dataArray2);
    }
    c3.generate(chartConfig);
}


// TODO: add timestamps
function renderLineChart(chartDivId, timestamps, dataArray1, dataArray2) {
    var chartConfig = {
        bindto : chartDivId,
        data: {
            columns: [
                dataArray1
            ]
        },
        axis: {
            x: {
                show: false
            }
        },
        size: {
            height: 120
        },
    };

    if (dataArray2) {
        chartConfig.data.columns.push(dataArray2);
    }
    c3.generate(chartConfig);
}

function renderCpuChartDetail(chartDivId, usageRecords) {
    var ds = getUsageDataset(usageRecords, 'cpuSys', 'cpuUser', true);
    ds.total.unshift('CPU %');
    ds.timestamps.unshift('timestamps');
    renderUsageDetailChart(chartDivId, ds.timestamps, ds.total);
}

function renderMemoryChartDetail(chartDivId, usageRecords) {
    var ds = getUsageDataset(usageRecords, 'memory', null);
    ds.ds1.unshift('Memory %');
    ds.timestamps.unshift('timestamps');
    renderUsageDetailChart(chartDivId, ds.timestamps, ds.ds1);
}

function renderDiskIOChartDetail(chartDivId, usageRecords) {
    var ds = getUsageDataset(usageRecords, 'diskRead', 'diskWrite');
    ds.ds1.unshift('Read');
    ds.ds2.unshift('Write');
    ds.timestamps.unshift('timestamps');
    renderUsageDetailChart(chartDivId, ds.timestamps, ds.ds1, ds.ds2);
}

function renderNetworkIOChartDetail(chartDivId, usageRecords) {
    var ds = getUsageDataset(usageRecords, 'netRx', 'netTx');
    ds.ds1.unshift('Rx');
    ds.ds2.unshift('Tx');
    ds.timestamps.unshift('timestamps');
    renderUsageDetailChart(chartDivId, ds.timestamps, ds.ds1, ds.ds2);
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

function guestIPsToHtml(guestIPs) {
    return "Guest IPs: " + guestIPs;
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