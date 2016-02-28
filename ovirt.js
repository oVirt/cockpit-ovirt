function showVmsScreen() {
    hideAllScreens();
    readVmsList();
    $("#vms-screen").show();
    $("#main-btn-menu-hostvms").addClass("active");
}

function showEngineVmsScreen() {
    debugMsg("showEngineVmsScreen() called");
    if (isLoggedInEngine()) {
        hideAllScreens();
        readEngineVmsList();
        $("#engine-vms-screen").show();
    } else {// should not happen, engine is not available
        printError('showEngineVmsScreen() called but no engine login is available');
        goTo('/vms');
    }

    $("#main-btn-menu-allvms").addClass("active");
}

function showVmDetailScreen(vmId) {
    hideAllScreens();

    if (!GLOBAL.latestHostVMSList) {// ensure vms list is read
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
    $("#main-btn-menu-vdsm").addClass("active");
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

    $("#main-btn-menu li").removeClass("active");
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

function refreshActionClicked(ignore) {
    var spanRefresh = $("#action-refresh");
    var spanRefreshA = $("#action-refresh a");

    if (spanRefresh.attr("data-pattern") == "off") {
        startAutorefresher();

        spanRefreshA.text("Refresh: auto");
        spanRefresh.attr("data-pattern", "on");
    } else {
        stopAutorefresher();

        spanRefreshA.text("Refresh: off");
        spanRefresh.attr("data-pattern", "off");
    }
}

function startAutorefresher() {
    GLOBAL.autoRefresher = setInterval(refresh, CONFIG.reload.auto_refresh_interval);
}

function stopAutorefresher() {
    clearInterval(GLOBAL.autoRefresher);
    GLOBAL.autoRefresher = null;
}

function refresh() {
    // TODO: refresh selectively depending on the locationPath
    debugMsg("refresh() called");
    readVmsList();
    refreshEngineVmsList();
}

function initNavigation() {
    $("#main-btn-menu li").on("click", function () {
        var dataPattern = $(this).attr("data-pattern");
        goTo(dataPattern);
    });

    registerBtnOnClickListener('action-refresh', refreshActionClicked);

    registerBtnOnClickListener('a-jump-vdsm-service-mngmt', jump);
    registerBtnOnClickListener('editor-vdsm-btn-save', saveVdsmConf);
    registerBtnOnClickListener('editor-vdsm-btn-reload', reloadVdsmConf);

    registerBtnOnClickListener('engine-login-title', toggleEngineLoginVisibility);
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
    refreshActionClicked();// start auto-refresher
}

$(document).ready(initialize);
