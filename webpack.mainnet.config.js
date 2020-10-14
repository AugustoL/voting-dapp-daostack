const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const baseConfig = require('./webpack.base.config.js');

// tslint:disable-next-line:no-var-requires
require('dotenv').config();


const config = merge(baseConfig, {
  mode: 'production',

  devtool: '',
  
  optimization: {
    moduleIds: 'hashed',
    splitChunks: {
      chunks: 'all',
      maxAsyncRequests: 10
    },
    minimize: true,
      minimizer: [
          new TerserPlugin({
              parallel: require('os').cpus().length,
              terserOptions: {
                mangle: false
              }
          })
      ]
  },

  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, 'dist'),
    // necessary for HMR to know where to load the hot update chunks
    publicPath: ''
  },

  entry: [
    // the entry point of our app
    'src/index.tsx',
  ],

  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          { // creates style nodes from JS strings
            loader: "style-loader"
          },
          { // translates CSS into CommonJS (css-loader) and automatically generates TypeScript types
            loader: 'typings-for-css-modules-loader',
            options: {
              camelCase: true,
              modules: true,
              namedExport: true,
              localIdentName: '[name]__[local]___[hash:base64:5]',
              importLoaders: 2,
              sourceMap: true
            }
          },
          { // compiles Sass to CSS
            loader: "sass-loader",
            options: {
              sourceMap: true
            }
          },
          { // Load global scss files in every other scss file without an @import needed
            loader: 'sass-resources-loader',
            options: {
              resources: ['./src/assets/styles/global-variables.scss']
            },
          },
        ]
      }
    ],
  },

  plugins: [
    new webpack.EnvironmentPlugin({
      NETWORK: "main",
      NODE_ENV: "production",
      BASE_URL: "",
      ARC_GRAPHQLHTTPPROVIDER: "",
      ARC_GRAPHQLWSPROVIDER : "",
      ARC_WEB3PROVIDER : "https://mainnet.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2",
      ARC_WEB3PROVIDERREAD : "https://mainnet.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2",
      ARC_IPFSPROVIDER: "",
      ARC_IPFSPROVIDER_HOST : "",
      ARC_IPFSPROVIDER_PORT : "",
      ARC_IPFSPROVIDER_PROTOCOL : "",
      ARC_IPFSPROVIDER_API_PATH : "",
      INFURA_ID : "",
      DAO_AVATAR_ADDRESS: "0x519b70055af55a007110b4ff99b0ea33071c720a",
      DAO_CONTROLLER_ADDRESS: "0x9f828ac3baa9003e8a4e0b24bcae7b027b6740b0"
    }),
    new CopyWebpackPlugin([
      { from: 'src/assets', to: 'assets' }
    ])
  ]
});

if (process.env.ANALYZE) {
  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
  config.plugins.push(new BundleAnalyzerPlugin());
}

module.exports = config;
