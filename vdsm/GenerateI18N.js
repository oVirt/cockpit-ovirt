var fs = require('fs')
var po2json = require('po2json')

var GENERATED_I18N_PREFIX = 'dist/i18n/'
var LOCALES_FILE = 'po/LOCALES'

function mkdir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

/**
 * @param options[0] - destination dir name ending with '/' (default: 'dist/i18n/')
 * options[1] - filename listing supported locales (default: 'po/LOCALES')
 * @constructor
 */
function GenerateI18N(options) {
  if (options.length > 0) {
    GENERATED_I18N_PREFIX = options[0]
  }

  if (options.length > 1) {
    LOCALES_FILE = options[1]
  }
}

GenerateI18N.prototype.apply = function (compiler) {
  compiler.plugin('compilation', function () {// generate translation files
    console.log(`GenerateI18N compilation: GENERATED_I18N_PREFIX: ${GENERATED_I18N_PREFIX}, LOCALES_FILE: ${LOCALES_FILE}`)

    var localesContent = fs.readFileSync(LOCALES_FILE).toString()
    console.log(`list of locales read: "${localesContent}"`)

    var translateForLocales = localesContent.split(' ')
    translateForLocales.forEach(function (locale) {
      locale = locale.trim()
      var srcPo = `po/${locale}.po`
      var filename = `${GENERATED_I18N_PREFIX}i18n.${locale}.json`

      console.log(`Generating json for locale: ${locale}, from: ${srcPo} to: ${filename}`)

      var json = po2json.parseFileSync(srcPo, {format: 'raw', stringify: true, pretty: false})

      mkdir('dist')
      mkdir(GENERATED_I18N_PREFIX)

      // write generated translation
      fs.writeFile(filename, json, function (err) {
        if (err) {
          return console.log(err)
        }
        console.log(`Locale file ${filename} was generated`)
      })
    })
  })
}

module.exports = GenerateI18N
