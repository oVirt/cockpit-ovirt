// --- helpers ----------------------------------------------------------
import $ from 'jquery'
import cockpit from 'cockpit'

import {CONFIG} from './constants'

export function goTo (locationPath) {
  cockpit.location.go(locationPath)
}

export function printError (text) {
  console.log('Error: ' + text)
}

export function debugMsg (text) {
  if (typeof __DEV__ !== 'undefined') {
    console.log('Debug: ' + text)
  }
}

export function nullToEmpty (obj) {
  return obj == null ? '' : obj
}

export function spawnVdsm (commandName, stdin, stdoutCallback, successCallback, failCallback, arg1, arg2) {
  if (!failCallback) {
    failCallback = vdsmFail
  }

  var spawnArgs = [CONFIG.vdsm.client_path, commandName]
  if (typeof (arg1) !== 'undefined') {
    spawnArgs.push(arg1)
    if (typeof (arg2) !== 'undefined') {
      spawnArgs.push(arg2)
    }
  }

  var proc = cockpit.spawn(spawnArgs)
  proc.input(stdin)
  proc.done(successCallback)
  proc.stream(stdoutCallback)
  proc.fail(failCallback)
}

export function parseVdsmJson (json) {
  try {
    var resp = $.parseJSON(json)
    if (resp.hasOwnProperty('status') && resp.status.hasOwnProperty('code') && resp.status.hasOwnProperty('message')) {
      debugMsg('vdsm json successfully parsed')
      return resp
    }
  } catch (err) {
    printError('parseVdsmJson() exception: ' + err)
  }

  printError('Malformed data format received (missing status code): ' + json)
  return null
}

export function vdsmFail () {
  printError('Vdsm execution failed! Please check: \n' +
    '- [path_to_cokcpit-ovirt-plugin]/vdsm/vdsm is executable,\n' +
    '- __DEV__ environment variable when building.\n\n' +
    'VDSM path: ' + CONFIG.vdsm.client_path)
}

export function disableButton (name) {
  var button = $('#' + name)
  button.attr('disabled', true)
}

export function normalizePercentage (value) {
  return Number(Math.max(parseFloat(value), 0.0).toFixed(2))
}

export function getActualTimeStamp () {
  var dt = new Date()
  return dt.getHours() + ':' + dt.getMinutes() + ':' + dt.getSeconds()
}

export function registerBtnOnClickListener (elementIdStartsWith, handler) {
  $("[id^='" + elementIdStartsWith + "']").off('click')
  $("[id^='" + elementIdStartsWith + "']").on('click', function () {
    var dataPattern = $(this).attr('data-pattern')

    if (dataPattern) {
      handler(dataPattern)
    } else {
      handler()
    }
  })
}

export function formatHumanReadableBytes (bytes, decimals) {
  if (bytes === 0) return '0 Byte'
  var k = 1024
  var dm = decimals + 1 || 3
  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  var i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toPrecision(dm) + ' ' + sizes[i]
}

export function formatHumanReadableSecsToTime (seconds) {
  var hours = Math.floor(seconds / 3600)
  var minutes = Math.floor((seconds - (hours * 3600)) / 60)
  seconds = seconds - (hours * 3600) - (minutes * 60)

  if (hours < 10) { hours = '0' + hours }
  if (minutes < 10) { minutes = '0' + minutes }
  if (seconds < 10) { seconds = '0' + seconds }
  var time = hours + ':' + minutes + ':' + seconds
  return time
}

export function pruneArray (ar) {
  var result = ar.filter(function (e, i) { return !(i % 2) })
  debugMsg('pruneArray(): starting length: ' + ar.length + ', resulting length: ' + result.length)
  return result
}

export function computePercent (val, max) {
  var f = (max > 0) ? (val / max) : (0)
  f = f.toFixed(4)
  return f * 100.0
}

export function scheduleNextAutoRefresh () {
  $.event.trigger({'type': 'scheduleNextAutoRefreshEvent'})
}
