// --- vdsm-screen -------------------------------------------------------

function loadVdsmConf(inform) {
    var editor = $("#editor-vdsm-conf");

    cockpit.file(VDSM_CONF_FILENAME).read().done(function (content, tag) {
        editor.val(content);
//        debugMsg("Content of vdsm.conf loaded: " + content);
        if (inform) {
            writeVdsmConfMsg("Loaded", true);
        }
    }).fail(function (error) {
        printError("Error reading vdsm.conf: " + error)
    });
}

function reloadVdsmConf() {
    if (confirm("Content of vdsm.conf will be reloaded, unsaved changes will be lost.\n\nPlease confirm.")) {
        loadVdsmConf(true);
    }
}

function saveVdsmConf() {
    if (confirm("Content of vdsm.conf file will be replaced.\n\nPlease confirm.")) {
        var editor = $("#editor-vdsm-conf");
        var content = editor.val();

        cockpit.file(VDSM_CONF_FILENAME).replace(content).done(function (tag) {
            debugMsg("Content of vdsm.conf replaced.");
            writeVdsmConfMsg("Saved", true);
        }).fail(function (error) {
            printError("Error writing vdsm.conf: " + error);
        });
    }
}

function writeVdsmConfMsg(text, autoclear) {
    var msg = $("#editor-vds-conf-msg");
    msg.html(text);
    debugMsg("writeVdsmConfMsg: " + text);
    if (autoclear) {
        setTimeout(clearVdsmConfMsg, AUTO_CLEAR_MSG_DELAY)
    }
}

function clearVdsmConfMsg() {
    var msg = $("#editor-vds-conf-msg");
    msg.html("");
}
