var webpack = require('webpack')
var CleanWebpackPlugin = require('clean-webpack-plugin')
var CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: [
    './src/ovirt.js'
  ],
  output: {
    path: __dirname + '/dist',
    publicPath: '/',
    filename: 'bundle.js'
  },
  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loader: 'babel'
    }]
  },
  externals: {
    // require("jquery") is external and available
    //  on the global var jQuery
    'jquery': 'jQuery',
    'c3': 'c3',
    'd3': 'd3',
    'cockpit': 'cockpit',
    'blob': 'Blob',
    'save-as': 'saveAs',
    'mustache': 'Mustache'
  },
  plugins: [
    new CleanWebpackPlugin(['dist']),
    new CopyWebpackPlugin([
      { from: 'static/manifest.json' },
      { from: 'static/ovirt.html' },
      { from: 'static/vdsm', to: 'vdsm' },
      // TODO: migrate below manual dependencies to proper npm ones
      { from: 'external/css', to: 'css' },
      { from: 'external/fonts', to: 'fonts' },
      { from: 'external/images', to: 'images' },
      { from: 'external/img', to: 'images' },
      { from: 'external/js', to: 'js' }
    ]),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      minimize: true
    })
  ]
}
