// --- vm-detail-screen & vm manipulation methods -----------------------
import $ from 'jquery'
import cockpit from 'cockpit'
// import saveAs from 'browser-filesaver'
import Mustache from 'mustache'
import c3 from 'c3'

import {CONFIG, VM_STATUS_ICONS, VM_STATUS_ICONS_PATH_PREFIX} from './constants'
import {GLOBAL} from './globaldata'

import {printError, spawnVdsm, vdsmFail, debugMsg} from './helpers'
import {_getVmDetails, readVmsList} from './hostvms'

import { gettext as _ } from './i18n'
/*
function consoleFileContent (vm) {
// TODO: generate content of .vv file
  var blob = new Blob([
    'Hello, world!\n',
    'TODO: generate .vv file'
  ], {type: 'text/plaincharset=utf-8'})

  return blob
}
*/
export function downloadConsole (vmId) {
/*  var vm = getVmDetailsVdsmToInternal(vmId, GLOBAL.latestHostVMSList)
  saveAs(consoleFileContent(vm), 'console.vv') // TODO: resolve content-security-policy error
*/
  printError('TODO: finish generating of console.vv file. ')
}

export function shutdown (vmId) {
  debugMsg('shutdown of: ' + vmId)
  spawnVdsm('shutdown', null, null, shutdownSuccess, vdsmFail, vmId)
}

export function restart (vmId) {
  debugMsg('restart of: ' + vmId)
  spawnVdsm('restart', null, null, shutdownSuccess, vdsmFail, vmId)
}

function shutdownSuccess () {
  setTimeout(readVmsList, CONFIG.reload.delay_after_vdsm_action)
}

export function forceoff (vmId) {
  debugMsg('forceoff of: ' + vmId)
  spawnVdsm('destroy', null, null, shutdownSuccess, vdsmFail, vmId)
}

export function renderVmDetailActual () { // called after successful readVmsList() to refresh rendered VM Detail
  var vmId = getVmIdFromPath()
  if (vmId != null) {
    renderVmDetail(vmId)
  }
}

export function renderVmDetail (vmId) {
  // populate VM detail data
  var vm = getVmDetailsVdsmToInternal(vmId, GLOBAL.latestHostVMSList)

  if (!vm) {
    $('#vm-detail-not-available').show()
    return
  }

  $('#vm-detail-not-available').hide()

  var template = $('#vm-detail-templ').html()
  var html = Mustache.to_html(template, vm)
  $('#vm-detail-content').html(html)

  renderUsageChartsDetail(vmId)
}

function renderUsageChartsDetail (vmId) {
  var usageRecords = GLOBAL.vmUsage[vmId]
  if (usageRecords) { // TODO: optimization: add data to existing chart instead of full rendering
    renderCpuChartDetail(getUsageDetailElementId('cpu', vmId), usageRecords)
    renderMemoryChartDetail(getUsageDetailElementId('mem', vmId), usageRecords)
    renderDiskIOChartDetail(getUsageDetailElementId('diskio', vmId), usageRecords)
    renderNetworkIOChartDetail(getUsageDetailElementId('networkio', vmId), usageRecords)
  }
}

function getUsageDetailElementId (device, vmId) {
  var divId = '#' + device + 'UsageChartDetail-' + vmId
  return divId
}

function getUsageDataset (usageRecords, attr1, attr2, inclSum) {
  var ds1 = []
  var ds2 = []
  var total = []
  var timestamps = []

  var pruneFactor = Math.floor(usageRecords.length / CONFIG.charts.usage_chart_max_points)
  pruneFactor = (pruneFactor === 0) ? 1 : pruneFactor
  for (var index = 0; index < usageRecords.length; index++) {
    if (index === 0 || index === (usageRecords.length - 1) || (index % pruneFactor) === 0) {
      var ur = usageRecords[index]

      var a = parseFloat(ur[attr1]).toFixed(1)
      ds1.push(a)

      if (attr2) {
        var b = parseFloat(ur[attr2]).toFixed(1)
        ds2.push(b)

        if (inclSum) {
          total.push((parseFloat(a) + parseFloat(b)).toFixed(1))
        }
      }

      timestamps.push(ur.timestamp)
    }
  }

  return {
    ds1: ds1,
    ds2: ds2,
    timestamps: timestamps,
    total: total
  }
}

function prefillDs (ds) {
  if (ds) {
    while (ds.length < 10) {
      ds.splice(1, 0, 0)
    }
  }
}

function renderUsageDetailChart (chartDivId, timestamps, dsArray1, dsArray2) {
  prefillDs(dsArray1)
  prefillDs(dsArray2)

  // fire event to refresh chart asynchronously
  setTimeout(() => {
    $.event.trigger({
      'type': 'renderSparklineChartEvent',
      'chartDivId': chartDivId,
      'timestamps': timestamps,
      'dsArray1': dsArray1,
      'dsArray2': dsArray2
    }) }, CONFIG.reload.delay_before_vmdetail_charts)
}

$(document).on('renderSparklineChartEvent',
  function (e) {
    renderSparklineChart(e.chartDivId, e.timestamps, e.dsArray1, e.dsArray2)
  })

// TODO: add timestamps
function renderSparklineChart (chartDivId, timestamps, dataArray1, dataArray2) {
  debugMsg(`Rendering vmdetail chart: ${chartDivId}`)
  var chartConfig = $().c3ChartDefaults().getDefaultSparklineConfig()
  chartConfig.bindto = chartDivId
  chartConfig.data = {
    columns: [dataArray1],
    axis: {
      x: {
        show: true
      },
      y: {
        show: true
      }
    },
    legend: {
      show: true,
      position: 'right'
    },
    type: 'area'
  }

  if (dataArray2) {
    chartConfig.data.columns.push(dataArray2)
  }
  c3.generate(chartConfig)
}

function renderCpuChartDetail (chartDivId, usageRecords) {
  var ds = getUsageDataset(usageRecords, 'cpuSys', 'cpuUser', true)
  ds.total.unshift(_('CPU %'))
  ds.timestamps.unshift('timestamps')
  renderUsageDetailChart(chartDivId, ds.timestamps, ds.total)
}

function renderMemoryChartDetail (chartDivId, usageRecords) {
  var ds = getUsageDataset(usageRecords, 'memory', null)
  ds.ds1.unshift(_('Memory %'))
  ds.timestamps.unshift('timestamps')
  renderUsageDetailChart(chartDivId, ds.timestamps, ds.ds1)
}

function renderDiskIOChartDetail (chartDivId, usageRecords) {
  var ds = getUsageDataset(usageRecords, 'diskRead', 'diskWrite')
  ds.ds1.unshift(_('Read'))
  ds.ds2.unshift(_('Write'))
  ds.timestamps.unshift('timestamps')
  renderUsageDetailChart(chartDivId, ds.timestamps, ds.ds1, ds.ds2)
}

function renderNetworkIOChartDetail (chartDivId, usageRecords) {
  var ds = getUsageDataset(usageRecords, 'netRx', 'netTx')
  ds.ds1.unshift(_('Rx'))
  ds.ds2.unshift(_('Tx'))
  ds.timestamps.unshift('timestamps')
  renderUsageDetailChart(chartDivId, ds.timestamps, ds.ds1, ds.ds2)
}

// ----------------------------------------------------------------------
export function getVmDetailsVdsmToInternal (vmId, parsedVdsmGetAllVMs) { // lookup cached VM detail
  if (parsedVdsmGetAllVMs.hasOwnProperty('items')) {
    return _getVmDetails(parsedVdsmGetAllVMs.items.find(function (src) {
      return src.vmId === vmId
    }))
  }

  return undefined
}

export function guestIPsToHtml (guestIPs) {
  return _('Guest IPs: {0}').format(guestIPs)
}

export function vmStatusToHtml (status) {
  if (status) {
    var html = ''
    var iconFile = VM_STATUS_ICONS[status.toLowerCase()]
    if (iconFile) {
      html = `<img src="${VM_STATUS_ICONS_PATH_PREFIX}${iconFile}" title="${status}" width="30" height="30">`
    } else {
      html = status// use text value as default
    }

    return html
  }

  return ''
}

export function getVmIdFromPath () {
  var path = cockpit.location.path
  if (path.length >= 2 && path[0] === 'vm') {
    return path[1]
  }
  return null
}
