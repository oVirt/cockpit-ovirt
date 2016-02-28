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
    var vm = getVmDetails_vdsmToInternal(vmId, GLOBAL.latestHostVMSList);
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
    var vm = getVmDetails_vdsmToInternal(vmId, GLOBAL.latestHostVMSList);

    if (!vm) {
        $("#vm-detail-not-available").show();
        return ;
    }

    var template = $("#vm-detail-templ").html();
    var html = Mustache.to_html(template, vm);
    $("#vm-detail-content").html(html);

    $("#vm-detail-not-available").hide();

    renderUsageChartsDetail(vmId);
}

function renderUsageChartsDetail(vmId) {
    var usageRecords = GLOBAL.vmUsage[vmId];
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

            timestamps.push(ur.timestamp);
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

/*
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
*/
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

    return undefined;
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

    return html;
}