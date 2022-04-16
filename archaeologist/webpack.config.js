const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');

const _getSmugglerApiUrl = (mode) => {
  return mode === 'development'
    ? "http://localhost:3000"
    : "https://mazed.dev/smuggler"
}

const _getSmugglerApiUrlMask = (mode) => {
  const url = new URL(_getSmugglerApiUrl(mode))
  url.pathname = '*'
  return url.toString().replace(/:\d+/, '')
}

const _manifestTransformDowngradeToV2 = (manifest) => {
  // Downgrade manifest to version 2, Firefox does not support version 3 yet
  manifest.manifest_version = 2
  // background scripts are declared differently in v2
  const {service_worker} = manifest.background
  manifest.background.scripts = [service_worker]
  delete manifest.background.service_worker
  // host_permissions are not supported in v2
  manifest.permissions.push(
    // Need this access to download preview images from an origin different from
    // original page. For instance images hosted in CDN.
    "<all_urls>",
    ...manifest.host_permissions,
  )
  delete manifest.host_permissions
  // Rename action to browser_action
  manifest.browser_action = manifest.action
  delete manifest.action
  // Manifest V3 new features
  delete manifest.cross_origin_embedder_policy
  delete manifest.cross_origin_opener_policy
  return manifest
}

const _manifestTransform = (buffer, mode, env) => {
  let manifest = JSON.parse(buffer.toString())

  const {firefox = false} = env

  // Add Mazed URL to host_permissions to grant access to mazed cookies
  const smugglerApiUrlMask = _getSmugglerApiUrlMask(mode)
  manifest.host_permissions.push(smugglerApiUrlMask)
  // Exclude Mazed from list of URLs where content.js is injected to
  manifest.content_scripts.forEach((item, index, theArray) => {
    const {exclude_matches = []} = item
    exclude_matches.push(
      smugglerApiUrlMask,
    )
    theArray[index] = {
      ...item,
      exclude_matches,
    }
  });
  if (firefox) {
    manifest = _manifestTransformDowngradeToV2(manifest)
  }
  return JSON.stringify(manifest, null, 2);
}

const config = (env, argv) => {
  return {
    entry: {
      popup: path.join(__dirname, "src/popup.tsx"),
      content: path.join(__dirname, "src/content.ts"),
      background: path.join(__dirname, "src/background.ts"),
    },
    output: {path: path.join(__dirname, "target/unpacked"), filename: "[name].js"},
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
          exclude: /\.module\.css$/,
        },
        {
          test: /\.ts(x)?$/,
          loader: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            "style-loader",
            {
              loader: "css-loader",
              options: {
                importLoaders: 1,
                modules: true,
              },
            },
          ],
          include: /\.module\.css$/,
        },
        {
          test: /\.svg$/,
          use: "file-loader",
        },
        {
          test: /\.png$/,
          use: [
            {
              loader: "url-loader",
              options: {
                mimetype: "image/png",
              },
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: [".js", ".jsx", ".tsx", ".ts"],
    },
    performance: {
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    },
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              defaults: true,
              arguments: true,
              toplevel: true,
              ecma: 6,
            },
            output: {
              // Always insert braces in if, for, do, while or with statements,
              // even if their body is a single statement
              braces: true,
              // Preserve JSDoc-style comments that contain "@license" or "@preserve"
              comments: "some",
              // Escape Unicode characters in strings and regexps. Chrome does
              // not accept minified files with UTF8 encodding for some reason.
              ascii_only: true,
            }
          },
          // Extract some legal comments into a separate file
          extractComments: true,
        })],
    },
    stats: {
      errorDetails: true,
    },
    devtool: 'source-map',
    plugins: [
      new CopyPlugin({
        patterns: [{
          from: "public", to: ".",
          transform: (context, absoluteFrom) => {
            if (absoluteFrom.endsWith("/manifest.json")) {
              return _manifestTransform(context, argv.mode, env)
            }
            return context
          },
        }],
      }),
      new webpack.ProvidePlugin({
        process: 'process/browser',
      }),
      new webpack.DefinePlugin({
        'process.env.CHROME': JSON.stringify(env.chrome || false),
        'process.env.FIREFOX': JSON.stringify(env.firefox || false),
        'process.env.SAFARI': JSON.stringify(env.safari || false),
        'process.env.BROWSER': JSON.stringify(
          (env.chrome) ? "chrome"
            : (env.firefox) ? "firefox"
              : (env.safari) ? "safari" : ""
        ),
        'process.env.REACT_APP_SMUGGLER_API_URL': JSON.stringify(
          _getSmugglerApiUrl(argv.mode)
        ),
      }),
    ],
  }
};

module.exports = config;
