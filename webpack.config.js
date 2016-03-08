var webpack = require('webpack')
var CleanWebpackPlugin = require('clean-webpack-plugin')
var CopyWebpackPlugin = require('copy-webpack-plugin')

var isProd = isProd = process.env.NODE_ENV === 'production'

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
    new CopyWebpackPlugin([
      { from: 'LICENSE' },
      { from: 'README.md' },
      { from: 'static/manifest.json' },
      { from: 'static/ovirt.html' },
      { from: 'static/vdsm', to: 'vdsm' },
      { from: 'static/images', to: 'images' },
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
}
