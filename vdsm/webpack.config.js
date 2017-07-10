var webpack = require('webpack')
var CleanWebpackPlugin = require('clean-webpack-plugin')
var CopyWebpackPlugin = require('copy-webpack-plugin')
var GenerateI18N = require('./GenerateI18N')

var isProd = process.env.NODE_ENV === 'production'

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
      loader: 'babel-loader',
        query:
        {
          presets: ['es2015']
        }
    }, {
      test: /\.css$/,
      loader: 'style-loader!css-loader'
    }, {
      test: /\.(png|jpg|jpeg|gif|svg)$/,
      loader: 'url-loader?limit=10000'
    }, {
      test: /\.woff(2)?(\?v=[0-9].[0-9].[0-9])?$/,
      loader: 'url-loader?mimetype=application/font-woff'
    }, {
      test: /\.(ttf|eot|svg)(\?v=[0-9].[0-9].[0-9])?$/,
      loader: 'file-loader?name=[name].[ext]'
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
    new CleanWebpackPlugin(['dist']),
    new GenerateI18N(['dist/i18n/', 'po/LOCALES']),
    new CopyWebpackPlugin([
      {from: '../LICENSE'},
      {from: 'README.md'},
      {from: 'static/ovirt.html'},
      {from: 'static/app.css'},
      {from: 'static/vdsm', to: 'vdsm'},
      {from: 'static/images', to: 'images'}
    ])
  ]
}

if (isProd) {
  config.plugins.push(
    new webpack.optimize.DedupePlugin()
    /*
    Quick fix of https://bugzilla.redhat.com/show_bug.cgi?id=1460614
    Recent UglifyJSPlugin and D3 library seem to be no friends.
    Let's use this quick workaround since the bug is blocker now. More general fix needs provided later.

    , new webpack.optimize.UglifyJsPlugin({
      minimize: true
    })
*/
)
} else {// isDev
  config.plugins.push(
    new webpack.DefinePlugin({
      '__DEV__': JSON.stringify(true)
    })
  )
}
