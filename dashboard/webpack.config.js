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
          presets: ['es2015', 'react']
        }
      },
      { test: /\.css$/, loader: "style-loader!css-loader" }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(['dist']),
    new CopyWebpackPlugin([
      {from: 'README.md'},
      {from: 'static/manifest.json'},
      {from: 'static/index.html'},
      {from: 'static/app.css'}
    ])
  ]
};
