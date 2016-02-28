// --- helpers ----------------------------------------------------------
function printError(text) {
    console.log("Error: " + text);
}

function debugMsg(text) {
    if (CONFIG.isDebug) {
        console.log("Debug: " + text);
    }
}

function nullToEmpty(obj) {
    return obj == null ? "" : obj;
}

function spawnVdsm(commandName, stdin, stdoutCallback, successCallback, failCallback, arg1, arg2) {
    if (!failCallback) {
        failCallback = vdsmFail;
    }

    var spawnArgs = [CONFIG.vdsm.client_path, commandName];
    if (typeof(arg1) !== 'undefined') {
        spawnArgs.push(arg1);
        if (typeof(arg2) !== 'undefined') {
            spawnArgs.push(arg2);
        }
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
            debugMsg("vdsm json successfully parsed");
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
    return new Number(Math.max(parseFloat(value), 0.0).toFixed(2));
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

function formatHumanReadableBytes(bytes,decimals) {
    if(bytes == 0) return '0 Byte';
    var k = 1024;
    var dm = decimals + 1 || 3;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toPrecision(dm) + ' ' + sizes[i];
}

function formatHumanReadableSecsToTime(seconds) {
//    var sec_num = parseInt(this, 10); // don't forget the second param
    var hours   = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds - (hours * 3600)) / 60);
    var seconds = seconds - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time    = hours+':'+minutes+':'+seconds;
    return time;
}