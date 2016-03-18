// --- Engine VMs screen (all vms list) ---------------------------------
import $ from 'jquery'
import Mustache from 'mustache'

import {CONFIG} from './constants'
import {GLOBAL} from './globaldata'

import {getVmDetails_vdsmToInternal, vmStatusToHtml} from './vmdetail'
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

function getAllVmsListSuccess (vdsmEngineAllVms) {
  debugMsg('getAllVmsListSuccess() called')
  var vms = parseVdsmJson(vdsmEngineAllVms)
  if (vms != null) {
    if (vms.status.code === 0) {
      GLOBAL.latestEngineVmsList = vms
      renderEngineVmsList(vms)
    } else {
      printError(_('getAllVmsList() error: {0}').format(vms.status.code), vms.status.message)
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
  } else {
    $('#engine-virtual-machines-list').html('')
    $('#engine-virtual-machines-novm-message').show()
  }
}

function onEngineVmClick (vmId) {
  if (getVmDetails_vdsmToInternal(vmId, GLOBAL.latestHostVMSList)) { // the VM is running on this host
    onVmClick(vmId)
  } else { // remote cockpit
        // get VM's host
    var vm = getVmDetails_engineToInternal(vmId, GLOBAL.latestEngineVmsList.content.vm)
    if (!vm) {
      debugMsg("Host data for engine VM '" + vmId + "' not found")
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

// --- Engine data transformation ---------------------------------------
function _getEngineHostDetails (src) { // src are parsed host data retrieved from engine (via REST API)
  return {
    name: src.content.name,
    address: src.content.address // ip/fqdn of the host
  }
}

function _getEngineVmDetails (src, host) { // src is one item from parsed engine's vms list
  var cpuTopology = src.cpu.topology
  var totalCpus = cpuTopology.sockets * cpuTopology.cores * cpuTopology.threads

  var vm = {
    id: src.id,
    name: src.name,
    origin: src.origin,
    memory: src.memory,
    memoryHuman: formatHumanReadableBytes(src.memory, 0),
    vCPUs: totalCpus,
    type: src.type,
    status: src.status.state,
    statusHtml: vmStatusToHtml(src.status.state),
    osType: src.os.type,
    host: host
        // small icon
        // memory guaranteed
        // display
        // host
  }
  return vm
}

// ------------------------------------------------------------
var vdsmEngineHost = {}
function readEngineHost (hostId) {
  debugMsg('Reading detail for hostId: ' + hostId)
  spawnVdsm('engineBridge', JSON.stringify(getEngineCredentialsTokenOnly()),
        function (data) {
          debugMsg('getHost() Stdout retrieved for hostId: ' + hostId)
          vdsmEngineHost[hostId] += data
        },
        function () {
          getEngineHostSuccess(hostId)
        },
        engineBridgeFail, 'getHost', hostId)
  vdsmEngineHost[hostId] = ''
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

function getEngineHostSuccess (hostId) {
  debugMsg('getEngineHostSuccess() for hostId=' + hostId)
  debugMsg('Source host data: ' + vdsmEngineHost[hostId])

  var src = parseVdsmJson(vdsmEngineHost[hostId])
  if (src != null) {
    if (src.status.code === 0) {
      var host = _getEngineHostDetails(src)
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

function getVmDetails_engineToInternal (vmId, parsedEngineVms) { // lookup cached VM detail
  var s = parsedEngineVms.find(function (src) { return src.id === vmId })
  if (!s || !s.host || !s.host.id) {
    return undefined
  }

  var hostId = s.host.id
  return _getEngineVmDetails(s, getHostById(hostId))
}
