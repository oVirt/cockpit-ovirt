var webpack = require('webpack')
var CleanWebpackPlugin = require('clean-webpack-plugin')
var CopyWebpackPlugin = require('copy-webpack-plugin')
var fs = require('fs')

var isProd = isProd = process.env.NODE_ENV === 'production'

function mkdir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

var SRC_FILEANME = 'src/i18n/i18n.src.json'
var GENERATED_I18N_PREFIX = 'dist/i18n/'
var TRANSLATE_FOR_LOCALES = ['de'] // the 'en'-locale is by default, extend list for other locales

function GenerateI18N(options) {
}
GenerateI18N.prototype.apply = function (compiler) {
  compiler.plugin('compilation', function () {// generate translation files
    var i18nSrcJson = fs.readFileSync(SRC_FILEANME, "utf8")
    var src = JSON.parse(i18nSrcJson)

    mkdir('dist')
    mkdir(GENERATED_I18N_PREFIX)

    TRANSLATE_FOR_LOCALES.forEach(function (locale) {
      // generate translation
      var translation = {
        meta: {
          "___description": "Generated " + locale + " from " + SRC_FILEANME,
          locale: locale
        },
        html: {},
        messages: {}
      }

      // html
      for (var key in src.html) {
        if (key === '___description') {
          continue
        }

        if (src.html[key].hasOwnProperty(locale) && src.html[key][locale]) {
          translation.html[key] = src.html[key][locale]
        } else {
          console.log('For locale "'+locale+'": Missing HTML translation of "' + key + '"')
        }
      }

      // messages
      for (var key in src.messages) {
        if (key === '___description') {
          continue
        }

        if (src.messages[key].hasOwnProperty(locale) && src.messages[key][locale]) {
          translation.messages[key] = src.messages[key][locale]
        } else {
          console.log('For locale "'+locale+'": Missing MESSAGE translation of "' + key + '"')
        }
      }

      // write generated translation
      var filename = GENERATED_I18N_PREFIX + 'i18n.' + locale + '.json'
      fs.writeFile(filename, JSON.stringify(translation), function (err) {
        if (err) {
          return console.log(err);
        }
        console.log("Locale file " + filename + ' was generated');
      })
    })
  })
}
module.exports = GenerateI18N

var config = module.exports = {
  entry: [
    './src/ovirt.js'
  ],
  output: {
    path: __dirname + '/dist',
    publicPath: './',
    filename: 'bundle.js'
  },
  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loader: 'babel'
    }, {
      test: /\.css$/,
      loader: 'style!css'
    }, {
      test: /\.(png|jpg|jpeg|gif|svg)$/,
      loader: 'url?limit=10000'
    }, {
      test: /\.woff(2)?(\?v=[0-9].[0-9].[0-9])?$/,
      loader: 'url?mimetype=application/font-woff'
    }, {
      test: /\.(ttf|eot|svg)(\?v=[0-9].[0-9].[0-9])?$/,
      loader: 'file?name=[name].[ext]'
    }]
  },
  externals: {
    // require("jquery") is external and available
    //  on the global var jQuery
    'jquery': 'jQuery',
    'cockpit': 'cockpit',
    'mustache': 'Mustache'
  },
  plugins: [
    new CleanWebpackPlugin(['dist', 'generated']),
    new GenerateI18N([]),
    new CopyWebpackPlugin([
      {from: 'LICENSE'},
      {from: 'README.md'},
      {from: 'static/manifest.json'},
      {from: 'static/ovirt.html'},
      {from: 'static/vdsm', to: 'vdsm'},
      {from: 'static/images', to: 'images'}
    ])
  ]
}

if (isProd) {
  config.plugins.push(
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      minimize: true
    })
  )
} else {// isDev
  config.plugins.push(
    new webpack.DefinePlugin({
      '__DEV__': JSON.stringify(true)
    })
  )
}
