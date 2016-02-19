// --- helpers ----------------------------------------------------------
function printError(text) {
    console.log("Error: " + text);

//    var message = $("#error-msg");
//   message.append("<p>" + text + "</p>");
//    message.css("color", "red");
}

function debugMsg(text) {
    if (isDebug) {
        console.log("Debug: " + text);
    }
}

function nullToEmpty(obj) {
    return obj == null ? "" : obj;
}

function spawnVdsm(commandName, stdin, stdoutCallback, successCallback, failCallback, arg1) {
    if (!failCallback) {
        failCallback = vdsmFail;
    }

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
    proc.fail(failCallback);
}

function parseVdsmJson(json) {
    try {
        var resp = jQuery.parseJSON(json);
        if (resp.hasOwnProperty('status') && resp.status.hasOwnProperty('code') && resp.status.hasOwnProperty('message')) {
            return resp;
        }
    } catch (err) {
        printError("parseVdsmJson() exception: " + err);
    }

    printError("Malformed data format received (missing status code): " + json);
    return null;
}

function vdsmFail() {
    printError("Vdsm execution failed!");
}

function disableButton(name) {
    var button = $("#" + name);
    button.attr("disabled", true);
}

function normalizePercentage(value) {
    return Math.min(Math.max(parseFloat(value), 0.0), 1.0);
}

function getActualTimeStamp() {
    var dt = new Date();
    return dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
}

function registerBtnOnClickListener(elementIdStartsWith, handler) {
    $("[id^='"+elementIdStartsWith+"']").on("click", function () {
        var dataPattern = $(this).attr("data-pattern");

        if (dataPattern) {
            handler(dataPattern);
        } else {
            handler();
        }
    });
}
