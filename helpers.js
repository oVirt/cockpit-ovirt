// --- helpers ----------------------------------------------------------
function printError(text) {
    console.log("Error: " + text);

    var message = $("#error-msg");
    message.append("<p>" + text + "</p>");
    message.css("color", "red");
}

function debugMsg(text) {
    if (isDebug) {
        console.log("Debug: " + text);
    }
    //var message = $("#message");
    //message.html("<p>DEBUG:<br/>" + text + "</p>");
}

function nullToEmpty(obj) {
    return obj == null ? "" : obj;
}

function spawnVdsm(commandName, stdin, stdoutCallback, successCallback, arg1) {
    var spawnArgs = [];
    if (typeof(arg1) !== 'undefined') {
        spawnArgs = [VDSM, commandName, arg1];
    } else {
        spawnArgs = [VDSM, commandName];
    }

    var proc = cockpit.spawn(spawnArgs);
    proc.input(stdin);
    proc.done(successCallback);
    proc.stream(stdoutCallback);
    proc.fail(vdsmFail);
}

function parseVdsmJson(json) {
    try {
        var resp = jQuery.parseJSON(json);
        if (resp.hasOwnProperty('status') && resp.status.hasOwnProperty('code') && resp.status.hasOwnProperty('message')) {
            return resp;
        }
    } catch (err) {

    }

    printError("Malformed data format received (missing status code): " + json);
    return null;
}

function vdsmFail() {
    printError("Vdsm execution failed!");
    alert("vdsmFail");
}

function disableButton(name) {
    var button = $("#" + name);
    button.attr("disabled", true);
}
