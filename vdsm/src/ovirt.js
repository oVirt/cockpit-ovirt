import $ from 'jquery'
import cockpit from 'cockpit'

import '../node_modules/patternfly/dist/css/patternfly.css'
import '../node_modules/patternfly/dist/css/patternfly-additions.css'

import '../node_modules/bootstrap/dist/js/bootstrap'
import '../node_modules/patternfly/dist/js/patternfly'

import {CONFIG} from './constants'
import {GLOBAL} from './globaldata'

import {debugMsg, printError, printWarning, registerBtnOnClickListener, goTo, scheduleNextAutoRefresh, confirmModal} from './helpers'
import {isLoggedInEngine, setEngineLoginTitle, setEngineFunctionalityVisibility, toggleEngineLoginVisibility, isAllVmsPath} from './engineLogin'
import {readEngineVmsList, refreshEngineVmsList, hostToMaintenance} from './enginevms'
import {readVmsList, shutdownAllHostVmsConfirm} from './hostvms'
import {getVmIdFromPath, renderVmDetail} from './vmdetail'
import {saveVdsmConf, reloadVdsmConf, loadVdsmConf} from './vdsmscreen'
import {renderPing} from './ping'
import {i18nInit, gettext as _} from './i18n'

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
    printWarning(_('Please login to Engine to see list of cluster VMs'))
    goTo('/vms')
    // TODO: display engine login form
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
      defaultScreen(_('vmId must be specified'))
    }
  } else if (isAllVmsPath()) {
    showEngineVmsScreen()
  } else if (path[0] === 'vdsm') {
    showVdsmScreen()
  } else if (path[0] === 'ping') {
    showPing()
  } else {
    defaultScreen(_('Unknown location path: {0}').format(path[0]))
  }
}

function defaultScreen (errorText) {
  printError(errorText)
  showVmsScreen()
}
/*
function jump (component) {
  console.log('jump called with: ' + component)
  cockpit.jump(component)// TODO: specify host
}
*/
function refreshActionClicked (ignore) {
  var buttonRefresh = $('#action-refresh')
  var buttonRefreshText = $('#action-refresh-text')

  if (buttonRefresh.attr('data-pattern') === 'off') {
    startAutorefresher()
    scheduleNextAutoRefresh()

    buttonRefreshText.text(_('Refresh: auto'))
    buttonRefresh.attr('data-pattern', 'on')
  } else {
    stopAutorefresher()

    buttonRefreshText.text(_('Refresh: off'))
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

function hostToMaintenanceActionClicked () {
  if (isLoggedInEngine()) {
    confirmModal(_('Set Host to Maintenance'), _('Please confirm the host shall be set to maintenance mode (by engine)'),
      function () {
        hostToMaintenance()
        setTimeout(readVmsList, CONFIG.reload.delay_after_vdsm_action)
      })
  } else {
    shutdownAllHostVmsConfirm()
  }
}

function initNavigation () {
  $('#main-btn-menu li').on('click', function () {
    var dataPattern = $(this).attr('data-pattern')
    goTo(dataPattern)
  })

  registerBtnOnClickListener('action-refresh', refreshActionClicked)
  registerBtnOnClickListener('action-host-to-maintenance', hostToMaintenanceActionClicked)

  registerBtnOnClickListener('editor-vdsm-btn-save', saveVdsmConf)
  registerBtnOnClickListener('editor-vdsm-btn-reload', reloadVdsmConf)

  registerBtnOnClickListener('engine-login-title', toggleEngineLoginVisibility)
}

function initEngineLogin () {
  if (isLoggedInEngine()) {
    setEngineLoginTitle(_('Logged to Engine'))
  }
  setEngineFunctionalityVisibility()
}

// TODO: call i18nInit() before  $(document).ready(), handle inner translateHtml() call
function initialize () {
  i18nInit()

  initNavigation()
  initEngineLogin()

  $(cockpit).on('locationchanged', onLocationChanged)
  onLocationChanged()

  refreshActionClicked()// start auto-refresher
}

$(document).ready(initialize)
