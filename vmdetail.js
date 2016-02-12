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
    } else {
        $("#vm-detail-not-available").show();
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
