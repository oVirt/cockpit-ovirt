// --- Engine VMs screen (all vms list) ---------------------------------
import $ from 'jquery'
import Mustache from 'mustache'

import {CONFIG} from './constants'
import {GLOBAL} from './globaldata'

import {getVmDetailsVdsmToInternal, vmStatusToHtml} from './vmdetail'
import {onVmClick, shutdownAllHostVmsConfirm} from './hostvms'
import {getEngineCredentialsTokenOnly, isLoggedInEngine} from './engineLogin'
import {printError, debugMsg, spawnVdsm, parseVdsmJson, registerBtnOnClickListener, formatHumanReadableBytes} from './helpers'

import { gettext as _ } from './i18n'

export function readEngineVmsList () { // invoke VDSM (engineBridge) to get fresh VMS List from Engine (via Rest API)
  var vdsmEngineAllVms = ''
  spawnVdsm('engineBridge', JSON.stringify(getEngineCredentialsTokenOnly()),
    function (data) { vdsmEngineAllVms += data },
    function () { getAllVmsListSuccess(vdsmEngineAllVms) }, engineBridgeFail, 'getAllVms')
}

function engineBridgeFail (msg) {
  printError('engineBridge call failed: ' + msg)
}

export function refreshEngineVmsList () {
  if (isLoggedInEngine()) {
    readEngineVmsList()
  }
}

var getAllVmsListErrorFirst = true // ugly hack to avoid dummy error message
function getAllVmsListSuccess (vdsmEngineAllVms) {
  debugMsg('getAllVmsListSuccess() called')
  var vms = parseVdsmJson(vdsmEngineAllVms)
  if (vms != null) {
    if (vms.status.code === 0) {
      GLOBAL.latestEngineVmsList = vms
      renderEngineVmsList(vms)
    } else {
      printError(_('getAllVmsList() error: {0}').format(vms.status.code), vms.status.message, getAllVmsListErrorFirst)
      getAllVmsListErrorFirst = false
    }
  }
}

// ------------------------------------------------------------
function renderEngineVmsList (vmsFull) {
    // the 'vmsFull' is parsed json result of getAllVms() retrieved from engine (via bridge)
  if (vmsFull.hasOwnProperty('content') && vmsFull.content.hasOwnProperty('vm') && vmsFull.content.vm.length > 0) {
    var srcVms = vmsFull.content.vm

    var vms = []
    srcVms.forEach(function handleVm (srcVm) {
      var vm = _getEngineVmDetails(srcVm, getHostOfVm(srcVm))
      vms.push(vm)
    })

    var data = {units: vms}
    var template = $('#engine-vms-list-templ').html()
    var html = Mustache.to_html(template, data)
    $('#engine-virtual-machines-list').html(html)
    $('#engine-virtual-machines-novm-message').hide()

    registerBtnOnClickListener('engine-vms-list-item-', onEngineVmClick)
    registerBtnOnClickListener('btn-engine-vm-run-', onEngineRunVmClick)
  } else {
    $('#engine-virtual-machines-list').html('')
    $('#engine-virtual-machines-novm-message').show()
  }
}

/* TODO: fix VM-mngmt routing to work with the dashboard-react routing
 *
 */
function onEngineVmClick (vmId) {
  debugMsg(`onEngineVmClick(${vmId}) called`)
  if (getVmDetailsVdsmToInternal(vmId, GLOBAL.latestHostVMSList)) { // the VM is running on this host
    onVmClick(vmId)
  } else { // remote cockpit
        // get VM's host
    var vm = getVmDetailsEngineToInternal(vmId, GLOBAL.latestEngineVmsList.content.vm)
    if (!vm) {
      debugMsg(`Host data for engine VM '${vmId}' not found`)
      return
    }

    var host = vm.host
    if (!host) {
      debugMsg('onEngineVmClick(): host unknown for vmId=' + vmId)
      return
    }

    var url = 'https://' + host.address + ':' + CONFIG.cockpit.port + CONFIG.cockpit.ovirtComponent + '#/vm/' + vmId
    debugMsg('URL of engine VM detail: ' + url)

        // open the detail
    var win = open(url, '_blank')
    win.focus()
  }
}

function onEngineRunVmClick (vmId) {
  debugMsg(`onEngineRunVmClick(${vmId}) called`)
  var vm = getVmDetailsEngineToInternal(vmId, GLOBAL.latestEngineVmsList.content.vm, false)
  if (!vm) {
    debugMsg(`onEngineRunVmClick(): VM detail for '${vmId}' not found`)
    return
  }

  var stdout = ''
  spawnVdsm('engineBridge', JSON.stringify(getEngineCredentialsTokenOnly()),
    function (data) {
      stdout += data
    },
    function () {
      engineRunVmSuccess(vmId)
    },
    engineBridgeFail, 'runVm', vmId)
}

function engineRunVmSuccess (vmId) {}

// --- Engine data transformation ---------------------------------------
function _getEngineHostDetails (src) { // src are parsed host data retrieved from engine (via REST API)
  return {
    id: src.content.id,
    name: src.content.name,
    address: src.content.address // ip/fqdn of the host
  }
}

function _getEngineVmDetails (src, host) { // src is one item from parsed engine's vms list
  var cpuTopology = src.cpu.topology
  var totalCpus = cpuTopology.sockets * cpuTopology.cores * cpuTopology.threads

  var state = getState(src)

  var vm = {
    id: src.id,
    name: src.name,
    origin: src.origin,
    memory: src.memory,
    memoryHuman: formatHumanReadableBytes(src.memory, 0),
    vCPUs: totalCpus,
    type: src.type,
    status: state,
    statusHtml: vmStatusToHtml(state),
    osType: src.os.type,
    host: host,

    // actions
    runActionHidden: isRunActionAllowed(src) ? '' : 'hidden'
        // small icon
        // memory guaranteed
        // display
        // host
  }
  return vm
}

/**
 * Might vary among versions
 */
function getState (engineVm) {
  return (engineVm['status']) ? (
    engineVm['status']['state'] ? (engineVm['status']['state']) : (engineVm['status'])
  ) : ''
}

function isRunActionAllowed (engineVm) {
  var state = getState(engineVm).toLowerCase()

  return ['down', ''].includes(state)
}

// ------------------------------------------------------------
function readEngineHost (hostId) {
  debugMsg('Reading detail for hostId: ' + hostId)
  var vdsmEngineHost = ''
  spawnVdsm('engineBridge', JSON.stringify(getEngineCredentialsTokenOnly()),
        function (data) {
          debugMsg('getHost() Stdout retrieved for hostId: ' + hostId)
          vdsmEngineHost += data
        },
        function () {
          getEngineHostSuccess(vdsmEngineHost)
        },
        engineBridgeFail, 'getHost', hostId)
}

function getHostOfVm (vm) {
  if (vm.hasOwnProperty('host') && vm.host.hasOwnProperty('id')) {
    return getHostById(vm.host.id)
  }
  return undefined
}

function getHostById (hostId) {
  debugMsg('getHostById( ' + hostId + ' ) called.')
  var host = GLOBAL.hosts[hostId]
  if (host) {
    debugMsg('Host already in cache: ' + JSON.stringify(host))
    return host
  }

  readEngineHost(hostId)// issue asynchronous read

    // asynchronous query has been issued, data will be ready next time
  return undefined
}

function getEngineHostSuccess (data) {
  debugMsg('getEngineHostSuccess(): source host data: ' + data)
  var src = parseVdsmJson(data)
  debugMsg('getEngineHostSuccess() json parsed')

  if (src != null) {
    if (src.status.code === 0) {
      var host = _getEngineHostDetails(src)
      var hostId = host.id
      debugMsg('Adding hostId=' + hostId + ', host=' + JSON.stringify(host))
      GLOBAL.hosts[hostId] = host
    } else {
      printError(_('getEngineHostSuccess() error: {0}').format(src.status.code), src.status.message)
    }
  }
}

export function hostToMaintenance () {
  // switch the host to maintenance mode via REST API
  debugMsg('hostToMaintenance() called')
  if (!isLoggedInEngine()) {
    printError(_("Can't switch host to maintenance, missing engine login."))
    return
  }

  var vdsmOut = ''
  spawnVdsm('engineBridge', JSON.stringify(getEngineCredentialsTokenOnly()),
    function (data) { vdsmOut += data },
    function () { hostToMaintenanceSuccess(vdsmOut) },
    function () {
      engineBridgeFail()
      shutdownAllHostVmsConfirm()
    },
    'hostToMaintenance')
}

function hostToMaintenanceSuccess (vdsmOut) {
  debugMsg('hostToMaintenanceSuccess() called. Data: ' + vdsmOut)
  var resp = $.parseJSON(vdsmOut)
  if (resp.hasOwnProperty('status') && resp.status.hasOwnProperty('code') &&
    resp.status.hasOwnProperty('message') && resp.status.code === 0) {
    return
  }

  // error
  printError(_('Switch host to maintenance failed'), vdsmOut)
  shutdownAllHostVmsConfirm()
}

function getVmDetailsEngineToInternal (vmId, parsedEngineVms, inclHost = true) { // lookup cached VM detail
  var s = parsedEngineVms.find(function (src) { return src.id === vmId })
  if (!s) {
    debugMsg(`parsedEngineVms(${vmId}) not found`)
    return undefined
  }

  if (inclHost) {
    if (!s.host || !s.host.id) {
      return undefined
    }

    return _getEngineVmDetails(s, getHostById(s.host.id))
  } else {
    return _getEngineVmDetails(s)
  }
}
