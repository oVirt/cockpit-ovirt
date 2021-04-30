const webpack = require('webpack')
const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const InlineManifestWebpackPlugin = require('inline-manifest-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const production = process.env.NODE_ENV === 'production'

// define specific fonts to be embed in CSS via data urls
let fontsToEmbed

// define the CSS files references in js to be extracted
let cssToExtract

module.exports = {
  bail: true,
  mode: production ? 'production' : 'development',
  devtool: production ? 'source-map' : 'eval-source-map',

  entry: {
    'app': './src/app.js'
  },

  // cockpit.js gets included via <script>, everything else should be bundled
  externals: {
    'cockpit': 'cockpit'
  },

  output: {
    filename: '[name].[chunkhash:8].js',
    chunkFilename: '[name].[chunkhash:8].chunk.js',
    path: path.resolve(__dirname, 'ovirt-dashboard')
  },

  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          name: 'vendor',
          chunks: 'initial',
          test: /[\\/]node_modules[\\/]/
        }
      }
    },
    runtimeChunk: { name: 'webpack-manifest' }
  },

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },

      // extract CSS included from node_modules
      {
        test: /\.css$/,
        include: cssToExtract = [
          path.resolve(__dirname, 'node_modules')
        ],
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: true
            }
          }
        ]
      },
      {
        test: /\.css$/,
        exclude: cssToExtract,
        use: ['style-loader', 'css-loader']
      },

      // inline base64 URLs for <= 8k images, direct URLs for the rest
      {
        test: /\.(png|jpg|jpeg|gif)$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 8192,
            name: 'media/[name].[hash:8].[ext]' // TODO: keep?
          }
        }
      },

      // embed the woff2 fonts and any fonts that are used by the PF icons
      // directly in the CSS (to avoid lag applying fonts), export the rest
      // to be loaded seperately as needed
      {
        test: fontsToEmbed = [
          /\.woff2(\?v=[0-9].[0-9].[0-9])?$/,
          /PatternFlyIcons-webfont\.ttf/
        ],
        use: {
          loader: 'url-loader',
          options: {}
        }
      },
      {
        test: /\.(ttf|eot|svg|woff(?!2))(\?v=[0-9].[0-9].[0-9])?$/,
        exclude: fontsToEmbed,
        use: {
          loader: 'file-loader',
          options: {
            name: 'fonts/[name].[hash:8].[ext]'
          }
        }
      }
    ]
  },

  plugins: [
    new webpack.ProvidePlugin({
      jQuery: 'jquery' // Bootstrap's JavaScript implicitly requires jQuery global
    }),

    new CleanWebpackPlugin(),
    new CopyWebpackPlugin([
      {from: 'README.md'},
      {from: 'static/manifest.json'},
      {from: 'static/app.css'},
      {from: 'static/hostedEngineAnsibleFiles', to: 'hostedEngineAnsibleFiles'},
      {from: 'static/ansible', to: 'ansible'}
    ]),

    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'static/index.html.ejs',
      inject: true,
    }),
    new InlineManifestWebpackPlugin('webpack-manifest'),

    // This pulls all of the depends on modules out of the entry chunks and puts them
    // together here.  Every entry then shares this chunk and it can be cached between
    // them.  The HtmlWebpackPlugins just need to reference it so the script tag is
    // written correctly.  HashedModuleIdsPlugin keeps the chunk id stable as long
    // as the contents of the chunk stay the same (i.e. no new modules are used).
    new webpack.HashedModuleIdsPlugin(),

    new MiniCssExtractPlugin({
      filename: '[name].[contenthash:8].css',
      chunkFilename: '[name].[contenthash:8].chunk.css'
    })
  ]
}
