// --- Engine VMs screen (all vms list) ---------------------------------

var vdsmEngineAllVms = ""; // might be partial output from the VDSM process
function readEngineVmsList() { // invoke VDSM (engineBridge) to get fresh VMS List from Engine (via Rest API)
    spawnVdsm("engineBridge", JSON.stringify(getEngineCredentialsTokenOnly()), getAllVmsStdout, getAllVmsListSuccess, engineBridgeFail, 'getAllVms');
    vdsmEngineAllVms = "";
}

function engineBridgeFail(msg) {
    printError("engineBridge call failed: " + msg);
}

function refreshEngineVmsList() {
    if (isLoggedInEngine()) {
        readEngineVmsList();
    }
}

function getAllVmsStdout(data) {
    vdsmEngineAllVms += data;
}

function getAllVmsListSuccess() {
    var vms = parseVdsmJson(vdsmEngineAllVms);
    if (vms != null) {
        if (vms.status.code == 0) {
            renderEngineVmsList(vms);
        } else {
            printError("getAllVmsList error (" + vms.status.code + "): " + vms.status.message);
        }
    }
}

function renderEngineVmsList(vmsFull) {
    // the 'vmsFull' is parsed json result of getAllVms() retrieved from engine (via bridge)
    if (vmsFull.hasOwnProperty('content') && vmsFull.content.hasOwnProperty('vm') && vmsFull.content.vm.length > 0) {
        var srcVms = vmsFull.content.vm;

        var vms = [];
        srcVms.forEach(function handleVm(srcVm) {
            var vm = _getEngineVmDetails(srcVm);
            vms.push(vm);
        });

        var data = {units: vms};
        var template = $("#engine-vms-list-templ").html();
        var html = Mustache.to_html(template, data);
        $("#engine-virtual-machines-list").html(html);
        $("#engine-virtual-machines-novm-message").hide();
    } else {
        $("#engine-virtual-machines-list").html("");
        $("#engine-virtual-machines-novm-message").show();
    }
}

function onEngineVmClick(vmId) {
    // TODO:
    // get VM's host
    // call goTo for this host or redirect VM detail on other

    //goTo('/vm/' + vmId);
    debugMsg("TODO onEngineVmClick(): redirect to VM detail on other host");
    window.alert("TODO: redirect to VM detail on other host");
}

// --- Engine data transformation ---------------------------------------
function _getEngineVmDetails(src) { // src is one item from parsed engine's vms list
    var cpuTopology = src.cpu.topology;
    var totalCpus =  cpuTopology.sockets * cpuTopology.cores * cpuTopology.threads;
    var vm = {
        id: src.id,
        name: src.name,
        origin: src.origin,
        memory: src.memory,
        vCPUs : totalCpus,
        type: src.type,
        status: src.status.state,
        osType: src.os.type
        // small icon
        // memory guaranteed
        // display
        // host
    };
    return vm;
}