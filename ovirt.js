// --- global -----------------------------------------------------------
var VDSM = "/root/.local/share/cockpit/ovirt/vdsm/vdsm";
var VDSM_CONF_FILENAME = "/etc/vdsm/vdsm.conf";
var DELAY_BEFORE_RELOAD_AFTER_VDSM_ACTION = 1000;// one second
var AUTO_REFRESH_INTERVAL = 5000;// in ms
var AUTO_CLEAR_MSG_DELAY = 5000;
var USAGE_CHART_MAX_POINTS = 17;
var USAGE_CHART_TIMESTAMP_DENSITY = 3;

var isDebug = true;// print debug messages to console

// ----------------------------------------------------------------------
function showVmsScreen() {
    hideAllScreens();
    readVmsList();
    $("#vms-screen").show();
}

function showEngineVmsScreen() {
    if (isLoggedInEngine()) {
        hideAllScreens();
        readEngineVmsList();
        $("#engine-vms-screen").show();
    } else {// should not happen, engine is not available
        printError('showEngineVmsScreen() called but no engine login is available');
        goTo('/vms');
    }
}

function showVmDetailScreen(vmId) {
    hideAllScreens();

    if (!latestHostVMSList) {// ensure vms list is read
        readVmsList();
    } else {
        renderVmDetail(vmId);
    }

    $("#vm-detail-screen").show();
}

function showVdsmScreen() {
    hideAllScreens();
    loadVdsmConf();
    $("#vdsm-screen").show();
}

function showPing() {
    $("#ovirt-content").hide();
    renderPing();
    $("#ping-content").show();
}

function hideAllScreens() {
    $("#vms-screen").hide();
    $("#engine-vms-screen").hide();
    $("#vm-detail-screen").hide();
    $("#vdsm-screen").hide();

    $("#ovirt-content").show();
}

function getVmIdFromPath() {
    var path = cockpit.location.path;
    if (path.length >= 2 && path[0] == 'vm') {
        return path[1];
    }
    return null;
}

function onLocationChanged() {
    debugMsg("Location path:" + cockpit.location.path);
    var path = cockpit.location.path;
    if (path.length == 0 || path[0] == '/' || path[0] == 'vms') {// vms-screen
        showVmsScreen();
    } else if (path[0] == 'vm') {// vm-detail-screen
        var vmId = getVmIdFromPath();
        if (vmId != null) {
            showVmDetailScreen(vmId);
        } else {
            defaultScreen('vmId must be specified');
        }
    } else if (isAllVmsPath()) {
        showEngineVmsScreen();
    } else if (path[0] == 'vdsm') {
        showVdsmScreen();
    } else if (path[0] == 'ping') {
        showPing();
    } else {
        defaultScreen('Unknown location path: ' + path[0]);
    }
}

function isAllVmsPath() {
    var path = cockpit.location.path;
    return (path.length > 0 && path[0] == 'allVms');
}

function defaultScreen(errorText) {
    printError(errorText);
    showVmsScreen();
}

function goTo(locationPath) {
    cockpit.location.go(locationPath);
}

function jump(component) {
    cockpit.jump(component);// TODO: specify host
}

var autoRefresher;
function refreshButtonClicked() {
    var buttonRefresh = $("#button-refresh");
    if (buttonRefresh.attr("data-pattern") == "off") {
        autoRefresher = setInterval(refresh, AUTO_REFRESH_INTERVAL);

        buttonRefresh.text("Refresh: auto");
        buttonRefresh.attr("data-pattern", "on");
    } else {
        clearInterval(autoRefresher);
        autoRefresher = null;

        buttonRefresh.text("Refresh: off");
        buttonRefresh.attr("data-pattern", "off");
    }
}

function refresh() {
    // TODO: refresh selectively depending on the locationPath
    debugMsg("refresh() called");
    readVmsList();
    refreshEngineVmsList();
}

function initNavigation() {
    $("#main-btn-menu button").on("click", function () {
        var dataPattern = $(this).attr("data-pattern");
        goTo(dataPattern);
    });
}

function initEngineLogin() {
    if (isLoggedInEngine()) {
        setEngineLoginTitle("Logged to Engine");
    }
    setEngineFunctionalityVisibility();
}

function initialize() {
    initNavigation();
    initEngineLogin();

    $(cockpit).on("locationchanged", onLocationChanged);
    onLocationChanged();
    refreshButtonClicked();// start auto-refresher
}

$(document).ready(initialize);
