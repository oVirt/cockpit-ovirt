// --- vdsm-screen -------------------------------------------------------
import $ from 'jquery'
import cockpit from 'cockpit'

import {CONFIG} from './constants'

import {printError, debugMsg} from './helpers'

export function loadVdsmConf (inform) {
  var editor = $('#editor-vdsm-conf')

  cockpit.file(CONFIG.vdsm.conf_file_name).read().done(function (content, tag) {
    editor.val(content)
    if (inform) {
      writeVdsmConfMsg('Loaded', true)
    }
  }).fail(function (error) {
    printError('Error reading vdsm.conf: ' + error)
  })
}

export function reloadVdsmConf () {
  if (window.confirm('Content of vdsm.conf will be reloaded, unsaved changes will be lost.\n\nPlease confirm.')) {
    loadVdsmConf(true)
  }
}

export function saveVdsmConf () {
  if (window.confirm('Content of vdsm.conf file will be replaced.\n\nPlease confirm.')) {
    var editor = $('#editor-vdsm-conf')
    var content = editor.val()

    cockpit.file(CONFIG.vdsm.conf_file_name).replace(content).done(function (tag) {
      debugMsg('Content of vdsm.conf replaced.')
      writeVdsmConfMsg('Saved', true)
    }).fail(function (error) {
      printError('Error writing vdsm.conf: ' + error)
    })
  }
}

function writeVdsmConfMsg (text, autoclear) {
  var msg = $('#editor-vds-conf-msg')
  msg.html(text)
  debugMsg('writeVdsmConfMsg: ' + text)
  if (autoclear) {
    setTimeout(clearVdsmConfMsg, CONFIG.reload.auto_clear_msg_delay)
  }
}

function clearVdsmConfMsg () {
  var msg = $('#editor-vds-conf-msg')
  msg.html('')
}
