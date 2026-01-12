const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const config = (env, argv) => {
  const dev = !!env.WEBPACK_SERVE;

  return {
    entry: ["./src/index.tsx"],
    optimization: {
      splitChunks: {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendor",
            chunks: "all",
          },
        },
      },
    },
    performance: {
      maxAssetSize: 512000,
      maxEntrypointSize: 512000,
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: "esbuild-loader",
          options: {
            loader: "tsx",
            target: "es2018",
          },
        },
        {
          test: /\.js?$/,
          loader: "esbuild-loader",
          resolve: {
            fullySpecified: false,
          },
          options: {
            target: "es2018",
          },
        },
        {
          test: /\.scss$/i,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: "dts-css-modules-loader",
              options: {
                namedExport: true,
                banner:
                  "/* @generated */\n/* prettier-ignore */\n/* eslint-disable */",
              },
            },
            {
              loader: "css-loader",
              options: {
                modules: true,
              },
            },
            {
              loader: "sass-loader",
              options: {
                api: "modern",
              },
            },
          ],
        },
        {
          test: /\.css$/i,
          use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
        },
        {
          test: /\.(svg|png|jpe?g)$/,
          type: "asset/resource",
        },
      ],
    },
    output: {
      path: path.resolve(__dirname, "build"),
      publicPath: dev ? "/" : "/public/",
      filename: "[name].[fullhash].js",
    },
    plugins: [
      new HtmlWebpackPlugin({
        inject: true,
        template: "./src/index.html",
      }),
      new ForkTsCheckerWebpackPlugin(),
      new MiniCssExtractPlugin(),
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, "public"),
      },
      compress: true,
      open: true,
      port: 8095,
      historyApiFallback: true,
    },
    resolve: {
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      plugins: [new TsconfigPathsPlugin()],
    },
    devtool: "source-map",
  };
};

module.exports = config;
