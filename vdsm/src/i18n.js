import $ from 'jquery'
import cockpit from 'cockpit'

import {debugMsg, printError} from './helpers'

function getLang () {
  var lang = navigator.language
  if (navigator.languages) {
    lang = navigator.languages[0]
  }

  if (!lang) {
    lang = 'en'
  } else {
    lang = lang.split('-')[0].toLowerCase()
  }

  debugMsg('Using language: {0}'.format(lang))
  return lang
}

export function i18nInit () {
  var locale = getLang()
  var i18nFile = 'i18n/i18n.' + locale + '.json'
  debugMsg('i18nFile: ' + i18nFile)

  if (locale === 'en') { // no translation needed
    return
  }

  // download translations for a locale
  $.get(i18nFile).done(
    function (po) {
      cockpit.locale(po)
      debugMsg('cockpit.language: ' + cockpit.language)

      translateHtml()
    }).fail(function () {
      printError(`Failed to load i18n resource: ${i18nFile}`, '', true)
    })
}

export function gettext (text) {
  return cockpit.gettext(text)
}

// translate ovirt.html to current locale
function translateHtml () {
  cockpit.translate()
}
