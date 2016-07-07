// --- Engine login -----------------------------------------------------
import $ from 'jquery'
import cockpit from 'cockpit'

import {debugMsg, printError, spawnVdsm, parseVdsmJson, vdsmFail, goTo} from './helpers'

import { gettext as _ } from './i18n'

export const ENGINE_RELATED_IDS = [// element ids to be set visible when engine login is available
  'main-btn-menu-allvms'
]

export function isAllVmsPath () {
  var path = cockpit.location.path
  return (path.length > 0 && path[0] === 'allVms')
}

function engineLogin () { // get Engine token via host
  var vdsmLoginOut = ''
  function stdout (data) {
    vdsmLoginOut += data
  }
  function success () {
    engineLoginSuccessful(vdsmLoginOut)
  }

  var userName = $('#engine-login-user').val()
  var pwd = $('#engine-login-pwd').val()
  var url = $('#engine-login-url').val()
  debugMsg('Engine login for: ' + userName)
  storeEngineCredentials(userName, pwd, url)

  var credentials = getEngineCredentials()
  var jsonCredentials = JSON.stringify(credentials)
  spawnVdsm('engineBridge', jsonCredentials, stdout, success, vdsmFail, 'getToken')

  onEngineLoginStart()
}

function onEngineLoginStart () {
  // TODO: show spinner
}

function onEngineLoginEnd () {
  // TODO: hide spinner
}

function engineLogout () {
  debugMsg('Engine logout')
  removeEngineToken()

  initEngineLogin()
}

function addEngineToken (token) {
  window.sessionStorage['engine-token'] = token
}

function removeEngineToken () {
  window.sessionStorage.removeItem('engine-token')
}

function storeEngineCredentials (username, pwd, url, token) {
  var sessionStorage = window.sessionStorage
  sessionStorage['engine-user'] = username
  sessionStorage['engine-pwd'] = pwd
  sessionStorage['engine-url'] = url
  if (token) {
    sessionStorage['engine-token'] = token
  }

  var localStorage = window.localStorage
  localStorage['engine-user'] = username
  localStorage['engine-url'] = url
}

export function getEngineCredentialsTokenOnly () {
  var full = getEngineCredentials()
  return {
    url: full.url,
    token: full.token
  }
}

function getEngineCredentials () {
  var sessionStorage = window.sessionStorage
  if (sessionStorage['engine-user']) {
    debugMsg('getEngineCredentials() populating sessionStorage credentials')
    return {
      user: sessionStorage['engine-user'],
      pwd: sessionStorage['engine-pwd'],
      url: sessionStorage['engine-url'],
      token: sessionStorage['engine-token']
    }
  }

  var localStorage = window.localStorage
  if (localStorage['engine-user']) {
    debugMsg('getEngineCredentials() populating localStorage credentials')
    return {
      user: localStorage['engine-user'],
      url: localStorage['engine-url']
    }
  }

  debugMsg('getEngineCredentials() populating dummy credentials')
  return { // populate initial dummy data
    user: 'admin@internal',
    pwd: '',
    url: 'https://[ENGINE_HOST]/ovirt-engine',
    token: null
  }
}

function engineLoginSuccessful (vdsmLoginOut) {
  debugMsg('engineLoginSuccessful() called')
  var resp = parseVdsmJson(vdsmLoginOut)
  onEngineLoginEnd()

  if (resp != null) {
    if (resp.status.code === 0) {
      if (resp.hasOwnProperty('content') && resp.content.hasOwnProperty('access_token')) {
        debugMsg('Login successful, token received')
        addEngineToken(resp.content.access_token)
        initEngineLogin()
      } else {
        engineLoginFailed(_('No token received'), resp.status.code)
      }
    } else {
      engineLoginFailed(resp.status.message, resp.status.code)
    }
  }
}

function engineLoginFailed (msg, statusCode) {
  debugMsg('Login error: ' + msg)
  onEngineLoginEnd()

  removeEngineToken()
  setEngineLoginErrorMsg('({0}) {1}'.format(statusCode, msg))
  initEngineLogin()
}

function setEngineLoginErrorMsg (text) {
  printError(text)
}

export function initEngineLogin () {
  if (isLoggedInEngine()) {
    setEngineLoginTitle(_('Logout from Engine'))
  } else {
    setEngineLoginTitle(_('Login to Engine'))
  }

  setEngineFunctionalityVisibility()
}

function setEngineLoginTitle (title) {
  $('#engine-login-title').html(title)
}

export function isLoggedInEngine () {
  const credentials = getEngineCredentials()
  return credentials.token && credentials.token.length > 0
}

export function setEngineFunctionalityVisibility () {
  if (isLoggedInEngine()) {
    ENGINE_RELATED_IDS.forEach(function (id) {
      // TODO
    })
  } else {
    // TODO
  }

  if (isAllVmsPath()) {
    goTo('/')
  }
}

export function showEngineLoginModal () {
  if (!isLoggedInEngine()) {
    var credentials = getEngineCredentials()

    $('#engine-login-user').val(credentials.user)
    if (credentials.pwd) {
      $('#engine-login-pwd').val(credentials.pwd)
    }
    $('#engine-login-url').val(credentials.url)

    $('#modal-engine-login-form-dologin').off('click')
    $('#modal-engine-login-form-dologin').on('click',
      function () {
        $('#modal-engine-login-form').modal('hide')

        engineLogin()
      })

    $('#modal-engine-login-form').modal('show')
  } else { // Text 'Logout from Engine' clicked
    engineLogout()
  }
}
