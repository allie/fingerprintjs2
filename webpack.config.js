var path = require("path");
var webpack = require("webpack");
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
    entry: {
        fingerprint2: ["./fingerprint2.js"]
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].min.js"
    },
    resolve: {
        modules: ["node_modules"]
    },
    plugins: [
        new BundleAnalyzerPlugin()
    ]
};
