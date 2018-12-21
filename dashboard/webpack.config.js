var CopyWebpackPlugin = require('copy-webpack-plugin')
var CleanWebpackPlugin = require('clean-webpack-plugin')

module.exports = {
  entry: [
    './src/app.js'
  ],
  output: {
    libraryTarget: 'var',
    library: 'Dashboard',
    path: __dirname + '/dist',
    filename: "app.js"
  },
  externals: {
    "jquery": "jQuery"
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        query:
        {
          presets: ['env', 'react']
        }
      }, {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        loader: 'url-loader?limit=10000'
      }, {
        test: /\.css$/,
        loader: "style-loader!css-loader"
      }, {
        test: /\.woff(2)?(\?v=[0-9].[0-9].[0-9])?$/,
        loader: 'file-loader'
      }, {
        test: /\.(ttf|eot|svg)(\?v=[0-9].[0-9].[0-9])?$/,
        loader: 'file-loader?name=[name].[ext]'
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(['dist']),
    new CopyWebpackPlugin([
      {from: 'README.md'},
      {from: 'static/manifest.json'},
      {from: 'static/index.html'},
      {from: 'static/app.css'},
      {from: 'static/hostedEngineAnsibleFiles', to: 'hostedEngineAnsibleFiles'},
      {from: 'static/ansible', to: 'ansible'}
    ])
  ]
};
