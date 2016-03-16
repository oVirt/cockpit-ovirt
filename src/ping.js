// --- ping-content -------------------------------
import $ from 'jquery'

import {debugMsg, spawnVdsm} from './helpers'

export function renderPing () {
  var vdsmPingResponse = ''
  spawnVdsm('ping', null,
    function (data) { vdsmPingResponse += data },
    function () { pingSuccessful(vdsmPingResponse) },
    pingFailed)
  vdsmPingResponse = ''
}

function pingSuccessful (vdsmPingResponse) {
  var json = vdsmPingResponse
  var resp = $.parseJSON(json)
  if (resp.hasOwnProperty('status') && resp.status.hasOwnProperty('code') && resp.status.hasOwnProperty('message')) {
    if (resp.status.code === 0) {
      printPingContent('Ping succeeded.<br/>The cockpit-ovirt plugin is installed and VDSM connection can be established.'.translate(), json)// still might be an error, but well-formatted response with its description
    } else { // well-formatted error-response with description
      printPingContent('Ping failed: {0}'.translate().format(resp.status.message), json)
    }
    return
  }

  // wrong format
  pingFailed(null, 'Ping failed with malformed error message returned: {0}'.translate().format(json))
}

function pingFailed (stderr, detail) {
  if (!detail) {
    detail = 'Ping execution failed.'.translate()
  }

  detail = stderr + '\n' + detail
  printPingContent(detail, '{"status": {"message": "' + detail + '", "code": 1}}')
}

function printPingContent (humanText, parserText) {
  var content = "<div id='ping-content-human'>" + humanText + '</div>'
  content += "<div id='ping-content-parser' hidden>" + parserText + '</div>'

  var pingContent = $('#ping-content')
  pingContent.html(content)

  debugMsg('Ping content: ' + content)
}
