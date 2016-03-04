// --- vms-screen -------------------------------------------------------
import $ from 'jquery'
import c3 from 'c3'
import d3 from 'd3'
import Mustache from 'mustache'

import {CONFIG} from './constants'
import {GLOBAL} from './globaldata'

import {downloadConsole, forceoff, shutdown, restart, renderVmDetailActual, guestIPsToHtml, vmStatusToHtml} from './vmdetail'
import {debugMsg, normalizePercentage, spawnVdsm, parseVdsmJson, printError, goTo, getActualTimeStamp, registerBtnOnClickListener, pruneArray, formatHumanReadableSecsToTime, computePercent} from './helpers'

var vdsmDataVmsList = '' // might be partial output from the VDSM process TODO: risk of data overlapping
function vdsmOutput (data) {
  vdsmDataVmsList += data
  debugMsg('vdsmOutput: <code>' + vdsmDataVmsList + '</code>')
}

export function readVmsList () { // invoke VDSM to get fresh vms data from the host
  spawnVdsm('getAllVmStats', null, vdsmOutput, getAllVmStatsSuccess)
  vdsmDataVmsList = ''
}

function getAllVmStatsSuccess () {
  var vms = parseVdsmJson(vdsmDataVmsList)
  if (vms != null) {
    if (vms.status.code === 0) {
      GLOBAL.latestHostVMSList = vms // cache for reuse i.e. in displayVMDetail()
      renderHostVms(vms)
    } else {
      printError('getAllVmStats() error (' + vms.status.code + '): ' + vms.status.message)
    }
  }
}

function renderHostVms (vmsFull) {
  // the 'vmsFull' is parsed json result of getAllVmStats()
  if (vmsFull.hasOwnProperty('items') && vmsFull.items.length > 0) {
    var vms = []

    // prepare data
    var timestamp = getActualTimeStamp()
    vmsFull.items.forEach(function translate (srcVm) {
      var vm = _getVmDetails(srcVm)
      vms.push(vm)

      var diskRead = getVmDeviceRate(srcVm, 'disks', 'readRate')
      var diskWrite = getVmDeviceRate(srcVm, 'disks', 'writeRate')
      var netRx = getVmDeviceRate(srcVm, 'network', 'rxRate')
      var netTx = getVmDeviceRate(srcVm, 'network', 'txRate')

      var lastUsageRecord = addVmUsage(vm.id, vm.vcpuCount, timestamp, parseFloat(vm.cpuUser),
        parseFloat(vm.cpuSys), parseFloat(vm.memUsage), diskRead, diskWrite, netRx, netTx)
      appendVmUsage(vm, lastUsageRecord)
    })

    // render vms list from template
    var data = {units: vms}
    var template = $('#vms-list-templ').html()
    var html = Mustache.to_html(template, data)
    $('#virtual-machines-list').html(html)
    $('#virtual-machines-novm-message').hide()

    // register button event listeners
    registerBtnOnClickListener('btn-download-console-', downloadConsole)
    registerBtnOnClickListener('btn-forceoff-vm-', forceoff)
    registerBtnOnClickListener('btn-shutdown-vm-', shutdown)
    registerBtnOnClickListener('btn-restart-vm-', restart)
    registerBtnOnClickListener('host-vms-list-item-', onVmClick)
    refreshUsageCharts()
    renderVmDetailActual()
  } else {
    $('#virtual-machines-list').html('')
    $('#virtual-machines-novm-message').show()
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
  debugMsg('Max diskMax=' + GLOBAL.vmUsageMax.disk + ', netMax=' + GLOBAL.vmUsageMax.net)
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
  var maximum = usageRecord.vcpuCount * 100.0

  var user = normalizePercentage(usageRecord.cpuUser)// TODO: VDSM reports chaotically, the retrieved numbers need to be reviewed
  var sys = normalizePercentage(usageRecord.cpuSys)
  var used = (user + sys).toFixed(1)
  var idle = (maximum - used).toFixed(1)

  debugMsg('user: ' + user + ', sys: ' + sys + ', used: ' + used)
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

  var labels = [used + '%']
  refreshDonutChart(chartDivId, labels, [['Free', free], ['Used', used]], [['available', 'used']])
}

function refreshDonutChart (chartDivId, labels, columns, groups) {
  var chartConfig = $().c3ChartDefaults().getDefaultDonutConfig()
  chartConfig.bindto = chartDivId

  chartConfig.data = {
    type: 'donut',
    columns: columns,
    groups: groups,
    order: null
  }
  chartConfig.donut.width = 8

  chartConfig.color = {
    pattern: ['#3f9c35', '#cc0000', '#D1D1D1']
  }

  c3.generate(chartConfig)

  // add labels
  var donutChartTitle = d3.select(chartDivId).select('text.c3-chart-arcs-title')
  donutChartTitle.text('')
  donutChartTitle.insert('tspan').text(labels[0]).classed('donut-title-small-pf', true).attr('dy', 0).attr('x', 0)
  if (labels.length > 1) {
    donutChartTitle.insert('tspan').text(labels[1]).classed('donut-title-small-pf', true).attr('dy', 20).attr('x', 0)
  }
}

function refreshUsageCharts () {
  $.each(GLOBAL.vmUsage, function (key, usageRecords) {
    if (usageRecords.length > 0) {
      var last = usageRecords[usageRecords.length - 1]
      refreshCpuChart(getUsageElementId('cpu', key), last)
      refreshMemoryChart(getUsageElementId('mem', key), last)
      // refreshDiskIOChart(getUsageElementId('diskio', key), last, diskMax)
      // refreshNetworkIOChart(getUsageElementId('networkio', key), last, netMax)
    }
  })
}

// ----------------------------------------------------------------------
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
