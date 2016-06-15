// --- vms-screen -------------------------------------------------------
import $ from 'jquery'
import c3 from 'c3'
import d3 from 'd3'
import Mustache from 'mustache'

import {CONFIG} from './constants'
import {GLOBAL} from './globaldata'

import {downloadConsole, forceoff, shutdown, restart, renderVmDetailActual, guestIPsToHtml, vmStatusToHtml} from './vmdetail'
import {debugMsg, normalizePercentage, spawnVdsm, vdsmFail, parseVdsmJson, printError, goTo, getActualTimeStamp, registerBtnOnClickListener, pruneArray, formatHumanReadableSecsToTime, computePercent, confirmModal, isHostVmsScreenDisplayed} from './helpers'

import { gettext as _ } from './i18n'

var isReadVmsListRunning = false
export function readVmsList () { // invoke VDSM to get fresh vms data from the host
  if (!isReadVmsListRunning) {
    lockReadVmsList()
    readVmsListImpl()
  } else {
    debugMsg('Skipping readVmsList(), since another is already running')
  }
}

function lockReadVmsList () {
  isReadVmsListRunning = true
}

function releaseLockReadVmsList () {
  isReadVmsListRunning = false
}

function readVmsListImpl () {
  var vdsmDataVmsList = ''
  function stdout (data) {
    vdsmDataVmsList += data
  }

  function success () {
    getAllVmStatsSuccess(vdsmDataVmsList)
    setTimeout(releaseLockReadVmsList, 0)
  }

  function fail () {
    vdsmFail()
    setTimeout(releaseLockReadVmsList, 0)
    // $.event.trigger({'type': 'readVmsListFinished'})
  }

  spawnVdsm('getAllVmStats', null, stdout, success, fail)
  // spawnVdsm('getAllVmStatsFakeExtend', null, stdout, success, fail)
}

function getAllVmStatsSuccess (vdsmDataVmsList) {
  debugMsg('readVmsList.succes(): <code>' + vdsmDataVmsList + '</code>')
  var vms = parseVdsmJson(vdsmDataVmsList)
  if (vms != null) {
    if (vms.status.code === 0) {
      GLOBAL.latestHostVMSList = vms // cache for reuse i.e. in displayVMDetail()

      // among the others, update GLOBAL.vmUsage
      var parsedVms = parseRetrievedHostVms(vms)

      if (isHostVmsScreenDisplayed()) {
        renderHostVms(parsedVms)
      }

      renderVmDetailActual()
    } else {
      printError(_('Error when reading VM stats ({0}): {1}').format(vms.status.code, vms.status.message))
    }
  }
}

function parseRetrievedHostVms (vmsFull) {
  // the 'vmsFull' is parsed json result of getAllVmStats()
  if (vmsFull.hasOwnProperty('items') && vmsFull.items.length > 0) {
    $('#virtual-machines-novm-message').hide()
    var vms = []

    // prepare data
    var timestamp = getActualTimeStamp()
    vmsFull.items.forEach(function (srcVm) {
      var vm = _getVmDetails(srcVm)
      vms.push(vm)

      var diskRead = getVmDeviceRate(srcVm, 'disks', 'readRate')
      var diskWrite = getVmDeviceRate(srcVm, 'disks', 'writeRate')
      var netRx = getVmDeviceRate(srcVm, 'network', 'rxRate')
      var netTx = getVmDeviceRate(srcVm, 'network', 'txRate')

      // append GLOBAL.vmUsage
      var lastUsageRecord = addVmUsage(vm.id, vm.vcpuCount, timestamp,
        parseFloat(vm.cpuUser),
        parseFloat(vm.cpuSys),
        parseFloat(vm.memUsage),
        diskRead, diskWrite, netRx, netTx)

      // append local 'vm in vms'
      appendVmUsage(vm, lastUsageRecord)
    })

    return vms
  }

  return undefined
}

function renderHostVms (vmsParsed) {
  $('#virtual-machines-loading-spinner').hide()

  if (vmsParsed && vmsParsed.length > 0) {
    $('#virtual-machines-novm-message').hide()

    renderHostVmsList(vmsParsed)

    // register button event listeners
    setTimeout(function () {
      registerBtnOnClickListener('btn-download-console-', downloadConsole)
      registerBtnOnClickListener('btn-forceoff-vm-', forceoff)
      registerBtnOnClickListener('btn-shutdown-vm-', shutdown)
      registerBtnOnClickListener('btn-restart-vm-', restart)
      registerBtnOnClickListener('host-vms-list-item-name-', onVmClick)
    }, 0)
  } else {
    removeAllFromChartCache()
    $('#virtual-machines-list').html('')
    $('#virtual-machines-novm-message').show()
  }
}

var ITEM_PREFIX = 'vms-list-item-full-'
function renderHostVmsList (vms) {
  // remove all div which are missing in 'vms'
  $("[id^='" + ITEM_PREFIX + "']").each(function () {
    var divVmId = $(this).attr('id').replace(ITEM_PREFIX, '')
    if (!vms.some(function (vm) { return vm.id === divVmId })) {
      // remove from DOM
      $(this).remove()
      removeFromChartCache(divVmId)
    }
  })

  vms.forEach(function (vm) {
    renderHostVm(vm)
  })
}

function renderHostVm (vm) {
  var div = $('#' + ITEM_PREFIX + vm.id)

  // generate new row for a VM
  var template = $('#vms-list-templ').html()
  var generatedDiv = Mustache.to_html(template, vm)

  if (div.length > 0) {
    // store donutcharts divs
    var cpuUsageChart = $('#cpuUsageChart-' + vm.id)
    var memUsageChart = $('#memUsageChart-' + vm.id)

    div.replaceWith(generatedDiv)

    // replace donutcharts divs
    $('#cpuUsageChart-' + vm.id).replaceWith(cpuUsageChart)
    $('#memUsageChart-' + vm.id).replaceWith(memUsageChart)
  } else { // append the new VM to the end
    $('#virtual-machines-list').append(generatedDiv)
  }

  var usageRecords = GLOBAL.vmUsage[vm.id]

  if (areChartsReady(vm)) {
    debugMsg(`Refreshing usage charts for vm: ${JSON.stringify(vm)}\nwith usage record: ${JSON.stringify(usageRecords[usageRecords.length - 1])}`)
    refreshVmUsageCharts(vm.id, usageRecords[usageRecords.length - 1])
  } else {
    debugMsg(`VM ${vm.id} is not up, skipping for charts`)
  }
}

function getVmDeviceRate (vm, device, rateName) {
  var total = 0.0
  if (vm.hasOwnProperty(device)) {
    $.each(vm[device], function (i, d) {
      if (d.hasOwnProperty(rateName)) {
        var rate = parseFloat(d[rateName])
        rate = (rate < 0.0) ? 0.0 : rate
        total += rate
      }
    })
  }
  return (total / (1024 * 1024)).toFixed(1) // to MB/s
}

export function onVmClick (vmId) { // show vm detail
  goTo('/vm/' + vmId)
}

// --- vms-screen usage charts ------------------------------------------
function computeUsageMaxs (lastRecord) {
  GLOBAL.vmUsageMax.disk = Math.max(lastRecord.diskRead, lastRecord.diskWrite, GLOBAL.vmUsageMax.disk)
  GLOBAL.vmUsageMax.net = Math.max(lastRecord.netRx, lastRecord.netTx, GLOBAL.vmUsageMax.net)
}

function addVmUsage (vmId, vcpuCount, timestamp, cpuUser, cpuSys, mem, diskRead, diskWrite, netRx, netTx) {
  var record = {
    timestamp: timestamp,
    vcpuCount: vcpuCount,
    cpuUser: cpuUser,
    cpuSys: cpuSys,
    memory: mem,
    diskRead: diskRead,
    diskWrite: diskWrite,
    netRx: netRx,
    netTx: netTx
  }

  if (!GLOBAL.vmUsage[vmId]) {
    GLOBAL.vmUsage[vmId] = []
  }

  if (GLOBAL.vmUsage[vmId].length > CONFIG.threshold.maxLengthVmUsage) {
    GLOBAL.vmUsage[vmId] = pruneArray(GLOBAL.vmUsage[vmId])
  }
  GLOBAL.vmUsage[vmId].push(record)

  computeUsageMaxs(record)

  return record
}

function getUsageElementId (device, vmId) {
  var divId = '#' + device + 'UsageChart-' + vmId
  return divId
}

function refreshCpuChart (chartDivId, usageRecord) {
  var maximum = (usageRecord.vcpuCount) ? (usageRecord.vcpuCount * 100.0) : (100.0)

  var user = normalizePercentage(usageRecord.cpuUser)
  var sys = normalizePercentage(usageRecord.cpuSys)
  var used = (user + sys).toFixed(1)
  var idle = (maximum - used).toFixed(1)

  var vCPUText = usageRecord.vcpuCount > 1 ? ' vCPUs' : ' vCPU'
  var labels = [used + '%']
  if (usageRecord.vcpuCount) {
    labels.push('of ' + usageRecord.vcpuCount + vCPUText)
  }

  refreshDonutChart(chartDivId, labels, [['User', user], ['Sys', sys], ['Idle', idle]], [['user', 'sys', 'idle']])
}

function refreshMemoryChart (chartDivId, usageRecord) {
  var maximum = 1.0// TODO: check this assumption for correctness

  var used = normalizePercentage(usageRecord.memory)
  var free = maximum - used

  var labels = [used + '%', 'of mem']
  refreshDonutChart(chartDivId, labels, [['Free', free], ['Used', used]], [['available', 'used']])
}

var donutChartCache = {}
function removeFromChartCache (vmId) {
  donutChartCache[getUsageElementId('cpu', vmId)] = undefined
  donutChartCache[getUsageElementId('mem', vmId)] = undefined
}

function removeAllFromChartCache () {
  donutChartCache = {}
}

function refreshDonutChart (chartDivId, labels, columns, groups) {
  debugMsg(`refreshDonutChart(): chartDivId=${JSON.stringify(chartDivId)}, labels=${JSON.stringify(labels)},\ncolumns=${JSON.stringify(columns)}`)
  if (donutChartCache[chartDivId]) {
    var existingChart = donutChartCache[chartDivId]
    existingChart.load({columns: columns})
  } else {
    var chartConfig = $().c3ChartDefaults().getDefaultDonutConfig()
    chartConfig.bindto = chartDivId

    chartConfig.data = {
      type: 'donut',
      columns: columns,
      groups: groups,
      order: null
    }
    chartConfig.donut.width = 8
    chartConfig.size.height = 120

    chartConfig.color = {
      pattern: ['#3f9c35', '#cc0000', '#D1D1D1']
    }

    var chart = c3.generate(chartConfig)
    donutChartCache[chartDivId] = chart
  }

  // add labels
  var donutChartTitle = d3.select(chartDivId).select('text.c3-chart-arcs-title')
  donutChartTitle.text('')
  donutChartTitle.insert('tspan').text(labels[0]).classed('donut-title-small-pf', true).attr('dy', 0).attr('x', 0)
  if (labels.length > 1) {
    donutChartTitle.insert('tspan').text(labels[1]).classed('donut-title-small-pf', true).attr('dy', 20).attr('x', 0)
  }
}

function refreshVmUsageCharts (vmId, usageRecord) {
  setTimeout(function () {
    refreshCpuChart(getUsageElementId('cpu', vmId), usageRecord)
    refreshMemoryChart(getUsageElementId('mem', vmId), usageRecord)
  }, 0)
}

export function shutdownAllHostVmsConfirm () {
  confirmModal(_('Engine not accessible'),
    _('Login to Engine not available.<br/>Please confirm all VMs on this host will be shut down'),
    shutdownAllHostVms)
}

function shutdownAllHostVms () {
  debugMsg('shutdownAllHostVms() called')
  var vms = GLOBAL.latestHostVMSList
  if (vms.hasOwnProperty('items')) {
    vms.items.forEach(function (vm) { shutdown(vm.vmId) })
  }
}

// ----------------------------------------------------------------------
export function isVmUp (vmDetail) {
  return (vmDetail['status'] &&
          vmDetail['status'].toLowerCase() === 'up')
}

function areChartsReady (vmDetail) {
  // TODO: fine-tune spinner until charts are ready
  return (vmDetail['status'] &&
          vmDetail['status'].toLowerCase() !== 'wait_for_launch_TODO')
}

export function _getVmDetails (src) { // src is one item from parsed getAllVmStats
  if (!src) {
    return undefined
  }

  var vm = {
    id: src.vmId,
    name: src.vmName,
    guestIPs: src.guestIPs,
    guestIPsHtml: guestIPsToHtml(src.guestIPs),
    status: src.status,
    statusHtml: vmStatusToHtml(src.status),
    guestFQDN: src.guestFQDN,
    username: src.username,

    displayType: src.displayType,
    displayIp: src.displayIp,
    displayPort: src.displayPort,
    displayInfo: src.displayInfo,

    appsList: src.appsList,

    memUsage: src.memUsage,
    cpuUser: src.cpuUser,
    elapsedTime: src.elapsedTime,
    elapsedTimeHuman: formatHumanReadableSecsToTime(src.elapsedTime),
    cpuSys: src.cpuSys,
    vcpuPeriod: src.vcpuPeriod,
    vcpuQuota: src.vcpuQuota,
    guestCPUCount: src.guestCPUCount,
    vcpuCount: src.vcpuCount,

    vmType: src.vmType,
    kvmEnable: src.kvmEnable,
    acpiEnable: src.acpiEnable
  }

  return vm
}

function appendVmUsage (vm, usageRecord) {
  vm['diskUsage'] = {
    Read: usageRecord.diskRead,
    ReadMax: GLOBAL.vmUsageMax.disk,
    ReadPercent: computePercent(usageRecord.diskRead, GLOBAL.vmUsageMax.disk),
    Write: usageRecord.diskWrite,
    WriteMax: GLOBAL.vmUsageMax.disk,
    WritePercent: computePercent(usageRecord.diskWrite, GLOBAL.vmUsageMax.disk)
  }

  vm['netUsage'] = {
    Rx: usageRecord.netRx,
    RxMax: GLOBAL.vmUsageMax.net,
    RxPercent: computePercent(5, GLOBAL.vmUsageMax.net),
    Tx: usageRecord.netTx,
    TxMax: GLOBAL.vmUsageMax.net,
    TxPercent: computePercent(50, GLOBAL.vmUsageMax.net)
  }
}
