// --- Engine login -----------------------------------------------------
ENGINE_RELATED_IDS = [// element ids to be set visible when engine login is available
    "main-btn-menu-allvms"
];

var vdsmLoginOut = "";
function engineLoginStdout(data) {
    vdsmLoginOut += data;
}

function engineLogin() {// get Engine token via host
    var userName = $("#engine-login-user").val();
    var pwd = $("#engine-login-pwd").val();
    var url = $("#engine-login-url").val();
    storeEngineCredentials(userName, pwd, url);

    var credentials = getEngineCredentials();
    // as {"user": "admin@internal","pwd": "admin","url": "https://engine.local/ovirt-engine"}
    var jsonCredentials = JSON.stringify(credentials);
    spawnVdsm("engineBridge", jsonCredentials,  engineLoginStdout, engineLoginSuccessful, 'getToken');
    engineLoginStdout = "";
}

function engineLogout() {
    removeEngineToken();

    setEngineLoginTitle("Login to Engine");
    setEngineLoginButtonVisibility();
    setEngineFunctionalityVisibility();
}

function toggleEngineLoginVisibility() {
    var loginFormElement = $("#engine-login-content");
    if (loginFormElement.is(':hidden')) {
        var credentials = getEngineCredentials();
        credentials['pwd'] = "";// for security

        var template = $("#engine-login-form-templ").html();
        var html = Mustache.to_html(template, credentials);
        loginFormElement.html(html);
        loginFormElement.show();
    } else {
        loginFormElement.hide();
    }
    setEngineLoginButtonVisibility();
}

function addEngineToken(token) {
    sessionStorage['engine-token'] = token;
}

function removeEngineToken() {
    sessionStorage.removeItem('engine-token');
}

function storeEngineCredentials(username, pwd, url, token) {
    var sessionStorage = window.sessionStorage;

    sessionStorage['engine-user'] = username;
    sessionStorage['engine-pwd'] = pwd;
    sessionStorage['engine-url'] = url;
    sessionStorage['engine-token'] = token;
}

function getEngineCredentialsTokenOnly() {
    var full = getEngineCredentials();
    return {url:full.url,
        token:full.token
    };
}

function getEngineCredentials() {
    var sessionStorage = window.sessionStorage;
    if (sessionStorage['engine-user'] != null) {
        var credentials = {
            user: sessionStorage['engine-user'],
            pwd: sessionStorage['engine-pwd'],
            url: sessionStorage['engine-url'],
            token: sessionStorage['engine-token']
        };
        return credentials;
    }

    return {// populate initial dummy data
        user: "admin@internal",
        pwd: "admin",
        url: "https://engine.local/ovirt-engine",
        token: null
    };
}

function engineLoginSuccessful() {
    var resp = parseVdsmJson(vdsmLoginOut);
    if (resp != null) {
        if (resp.status.code == 0) {
            if (resp.hasOwnProperty('content') && resp.content.hasOwnProperty('access_token')) {
                // TODO: make the title green
                setEngineLoginTitle("Logged to Engine");
                toggleEngineLoginVisibility();

                addEngineToken(resp.content.access_token);

                setEngineLoginButtonVisibility();
                setEngineFunctionalityVisibility();
            } else {
                engineLoginFailed('No token received', resp.status.code);
            }
        } else {
            engineLoginFailed(resp.status.message, resp.status.code);
        }
    }
}

function engineLoginFailed(msg, statusCode) {
    // TODO: make the title red
    setEngineLoginTitle("Engine login failed");

    removeEngineToken();

    setEngineLoginErrorMsg('(' + statusCode + ') ' + msg);
    setEngineFunctionalityVisibility();
}

function setEngineLoginErrorMsg(text) {
    var errorMsgElement = $("#engine-login-error-msg");
    if (errorMsgElement != null) {
        $("#engine-login-error-msg-text").html(text);
        errorMsgElement.show();
    }
}

function setEngineLoginTitle(message, detail) {
    var msgData = {
        message: message,
        param1: detail,
    };

    var template = $("#message-one-param-temp").html();
    var html = Mustache.to_html(template, msgData);
    $("#engine-login-title").html(html);
}

function isLoggedInEngine() {
    result = getEngineCredentials().token && getEngineCredentials().token.length > 0;
    return result;
}

function setEngineFunctionalityVisibility() {
    var enabled = isLoggedInEngine();
    ENGINE_RELATED_IDS.forEach(function(id){
        var element = $("#"+id);
        if (enabled) {
            element.show();
        } else {
            element.hide();
        }
    });

    if (isAllVmsPath()) {
        goTo('/');
    }
}

function setEngineLoginButtonVisibility() {
    if (isLoggedInEngine()) {
        $("#engine-login-button-login").hide();
        $("#engine-login-button-logout").show();
    } else {
        $("#engine-login-button-login").show();
        $("#engine-login-button-logout").hide();
    }
}
