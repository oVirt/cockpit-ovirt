import $ from 'jquery'
import cockpit from 'cockpit'

import '../node_modules/patternfly/dist/css/patternfly.css'
import '../node_modules/patternfly/dist/css/patternfly-additions.css'

import '../node_modules/bootstrap/dist/js/bootstrap'
import '../node_modules/patternfly/dist/js/patternfly'

import {CONFIG} from './constants'
import {GLOBAL} from './globaldata'

import {debugMsg, printError, registerBtnOnClickListener, goTo, scheduleNextAutoRefresh} from './helpers'
import {isLoggedInEngine, setEngineLoginTitle, setEngineFunctionalityVisibility, toggleEngineLoginVisibility, isAllVmsPath} from './engineLogin'
import {readEngineVmsList, refreshEngineVmsList, hostToMaintenance} from './enginevms'
import {readVmsList, shutdownAllHostVmsConfirm} from './hostvms'
import {getVmIdFromPath, renderVmDetail} from './vmdetail'
import {saveVdsmConf, reloadVdsmConf, loadVdsmConf} from './vdsmscreen'
import {renderPing} from './ping'

function showVmsScreen () {
  hideAllScreens()
  readVmsList()
  $('#vms-screen').show()
  $('#main-btn-menu-hostvms').addClass('active')
}

function showEngineVmsScreen () {
  debugMsg('showEngineVmsScreen() called')
  if (isLoggedInEngine()) {
    hideAllScreens()
    readEngineVmsList()
    $('#engine-vms-screen').show()
  } else { // should not happen, engine is not available
    printError('showEngineVmsScreen() called but no engine login is available')
    goTo('/vms')
  }

  $('#main-btn-menu-allvms').addClass('active')
}

function showVmDetailScreen (vmId) {
  hideAllScreens()

  if (!GLOBAL.latestHostVMSList) { // ensure vms list is read
    readVmsList()
  } else {
    renderVmDetail(vmId)
  }

  $('#vm-detail-screen').show()
}

function showVdsmScreen () {
  hideAllScreens()
  loadVdsmConf()
  $('#vdsm-screen').show()
  $('#main-btn-menu-vdsm').addClass('active')
}

function showPing () {
  $('#ovirt-content').hide()
  renderPing()
  $('#ping-content').show()
}

function hideAllScreens () {
  $('#vms-screen').hide()
  $('#engine-vms-screen').hide()
  $('#vm-detail-screen').hide()
  $('#vdsm-screen').hide()

  $('#ovirt-content').show()

  $('#main-btn-menu li').removeClass('active')
}

function onLocationChanged () {
  debugMsg('Location path:' + cockpit.location.path)
  var path = cockpit.location.path
  if (path.length === 0 || path[0] === '/' || path[0] === 'vms') { // vms-screen
    showVmsScreen()
  } else if (path[0] === 'vm') { // vm-detail-screen
    var vmId = getVmIdFromPath()
    if (vmId != null) {
      showVmDetailScreen(vmId)
    } else {
      defaultScreen('vmId must be specified')
    }
  } else if (isAllVmsPath()) {
    showEngineVmsScreen()
  } else if (path[0] === 'vdsm') {
    showVdsmScreen()
  } else if (path[0] === 'ping') {
    showPing()
  } else {
    defaultScreen('Unknown location path: ' + path[0])
  }
}

function defaultScreen (errorText) {
  printError(errorText)
  showVmsScreen()
}

function jump (component) {
  cockpit.jump(component)// TODO: specify host
}

function refreshActionClicked (ignore) {
  var buttonRefresh = $('#action-refresh')
  var buttonRefreshText = $('#action-refresh-text')

  if (buttonRefresh.attr('data-pattern') === 'off') {
    startAutorefresher()
    scheduleNextAutoRefresh()

    buttonRefreshText.text('Refresh: auto')
    buttonRefresh.attr('data-pattern', 'on')
  } else {
    stopAutorefresher()

    buttonRefreshText.text('Refresh: off')
    buttonRefresh.attr('data-pattern', 'off')
  }
}

$(document).on('scheduleNextAutoRefreshEvent',
  function () {
    if (GLOBAL.autoRefresher) {
      setTimeout(refresh, CONFIG.reload.auto_refresh_interval)
    }
  })

function startAutorefresher () {
  GLOBAL.autoRefresher = true // setInterval(refresh, CONFIG.reload.auto_refresh_interval)
}

function stopAutorefresher () {
  // clearInterval(GLOBAL.autoRefresher)
  GLOBAL.autoRefresher = false
}

function refresh () {
  // TODO: refresh selectively depending on the locationPath
  debugMsg('refresh() called')

  readVmsList()
  refreshEngineVmsList()

  scheduleNextAutoRefresh()
}

// TODO: use bootstrap's confirmation dialogs
function hostToMaintenanceActionClicked () {
  if (isLoggedInEngine()) {
    if (confirm('Please confirm the host shall be set to maintenance mode (by engine)')) {
      hostToMaintenance()
    }
  } else {
    shutdownAllHostVmsConfirm()
  }

  setTimeout(readVmsList, CONFIG.reload.delay_after_vdsm_action)
}

function initNavigation () {
  $('#main-btn-menu li').on('click', function () {
    var dataPattern = $(this).attr('data-pattern')
    goTo(dataPattern)
  })

  registerBtnOnClickListener('action-refresh', refreshActionClicked)
  registerBtnOnClickListener('action-host-to-maintenance', hostToMaintenanceActionClicked)

  registerBtnOnClickListener('a-jump-vdsm-service-mngmt', jump)
  registerBtnOnClickListener('editor-vdsm-btn-save', saveVdsmConf)
  registerBtnOnClickListener('editor-vdsm-btn-reload', reloadVdsmConf)

  registerBtnOnClickListener('engine-login-title', toggleEngineLoginVisibility)
}

function initEngineLogin () {
  if (isLoggedInEngine()) {
    setEngineLoginTitle('Logged to Engine')
  }
  setEngineFunctionalityVisibility()
}

function initialize () {
  initNavigation()
  initEngineLogin()

  $(cockpit).on('locationchanged', onLocationChanged)
  onLocationChanged()

  refreshActionClicked()// start auto-refresher
}

$(document).ready(initialize)
