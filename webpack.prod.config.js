const path = require("path");

const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const merge = require("webpack-merge");
const webpack = require("webpack");
const WebpackShellPlugin = require("webpack-shell-plugin");

const baseConfig = require("./webpack.base.config.js");

// Get short commit hash from git
const GitRevisionPlugin = require("git-revision-webpack-plugin");
const gitRevisionPlugin = new GitRevisionPlugin();
const shortCommitHash = gitRevisionPlugin.commithash().substring(0,8);

const config = merge(baseConfig, {
  mode: "production",
  devtool: "",

  entry: {
    // the entry point of our app
    app: "./src/index.tsx",
    // "ipfs-http-client": ["ipfs-http-client"],
    // "@daostack/migration": ["@daostack/migration/"]
  },

  output: {
    filename: "[name].bundle-"+shortCommitHash+".js",
    chunkFilename: "[name].bundle-"+shortCommitHash+".js",
    path: path.join(__dirname+"/dist"),

    publicPath: "",
  },
  
  node: {
    __dirname: false
  },

  optimization: {
    minimize: true,
    minimizer: [
      new OptimizeCSSAssetsPlugin({}),
      new TerserPlugin({
        terserOptions: {
        }
      })
    ],
    splitChunks: {
      chunks: "all",
    }
  },

  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              modules: {
                localIdentName: "[name]--[local]--"+shortCommitHash
              },
              importLoaders: 2
            }
          },
          "sass-loader",
          {
            loader: "sass-resources-loader",
            options: {
              resources: ["./src/assets/styles/global-variables.scss"]
            }
          }
        ],
      },
    ],
  },

plugins: [
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: "[name]."+shortCommitHash+".css",
      chunkFilename: "[id]."+shortCommitHash+".css",
      modules: true
    }),

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
      DAO_CONTROLLER_ADDRESS: "0x9f828ac3baa9003e8a4e0b24bcae7b027b6740b0",
      DAO_LANDING_PAGE_URL: "https://gateway.pinata.cloud/ipfs/QmPhoeL14E5SBFBaC4bA3nuRpg3MpxdWVYdPrdXHdQ3EHY"
    }),

    new CopyWebpackPlugin([
      { from: "src/assets", to: "assets" }
    ]),
  ],
});

if (process.env.ANALYZE) {
  const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
  config.plugins.push(new BundleAnalyzerPlugin());
}

module.exports = config;
