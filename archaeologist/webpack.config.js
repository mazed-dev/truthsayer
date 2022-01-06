const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

const _getSmugglerApiUrl = (mode) => {
  return mode === 'development'
    ? "http://localhost:3000"
    : "https://mazed.dev/smuggler"
}

const _manifestTransform = (buffer, mode) => {
  const manifest = JSON.parse(buffer.toString());

  // Add Mazed URL to host_permissions to grant access to mazed cookies
  const mazedUrl = new URL(_getSmugglerApiUrl(mode))
  mazedUrl.pathname = ''
  manifest["host_permissions"] = [
    mazedUrl.toString(),
  ]

  // Exclude Mazed from list of URLs where content.js is injected to
  mazedUrl.pathname = '*'
  manifest["content_scripts"].forEach((item, index, theArray) => {
    const { exclude_matches = [] } = item
    exclude_matches.push(
      mazedUrl.toString(),
    )
    theArray[index] = {
      ...item,
      exclude_matches,
    }
  });
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
      alias: {
        "react-dom": "@hot-loader/react-dom",
      },
    },
    performance: {
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
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
              return _manifestTransform(context, argv.mode)
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
