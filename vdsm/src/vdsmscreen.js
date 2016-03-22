// --- vdsm-screen -------------------------------------------------------
import $ from 'jquery'
import cockpit from 'cockpit'

import {CONFIG} from './constants'

import {printError, debugMsg, confirmModal} from './helpers'

import { gettext as _ } from './i18n'

export function loadVdsmConf (inform) {
  var editor = $('#editor-vdsm-conf')

  cockpit.file(CONFIG.vdsm.conf_file_name).read().done(function (content, tag) {
    editor.val(content)
    if (inform) {
      writeVdsmConfMsg('Loaded', true)
    }
  }).fail(function (error) {
    printError(_('Error reading vdsm.conf: {0}').format(error))
  })
}

export function reloadVdsmConf () {
  confirmModal(_('Reload stored vdsm.conf'), _('Content of vdsm.conf will be reloaded, unsaved changes will be lost.<br/>Please confirm.'),
    function () {
      loadVdsmConf(true)
    })
}

export function saveVdsmConf () {
  confirmModal(_('Save to vdsm.conf'), _('Content of vdsm.conf file will be replaced.<br/>Please confirm.'),
    function () {
      var editor = $('#editor-vdsm-conf')
      var content = editor.val()

      cockpit.file(CONFIG.vdsm.conf_file_name).replace(content).done(function (tag) {
        debugMsg('Content of vdsm.conf replaced.')
        writeVdsmConfMsg('Saved', true)
      }).fail(function (error) {
        printError(_('Error writing vdsm.conf: {0}').format(error))
      })
    })
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
