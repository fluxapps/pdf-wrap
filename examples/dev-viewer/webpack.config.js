const path = require("path");
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {

    entry: {
        main: path.resolve(__dirname, "src", "js", "index.js"),
    },
    output: {
        path: path.resolve(__dirname, "build", "www"),
        filename: "main.js",
        publicPath: "/"
    },

    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new HtmlWebpackPlugin({
            template: './src/index.html'
        })
    ],

    devtool: "none",
    mode: "development",

    module: {
        rules: [{
            test: /\.css$/,
            loaders: ['style', 'css']
        }, {
            test: /\.html$/,
            loader: "raw-loader" // loaders: ['raw-loader'] is also perfectly acceptable.
        }]
    },

    devServer: {
        contentBase: path.resolve(__dirname, "build", "www"),
        compress: false,
        hot: true,
        http2: false,
        port: 9001
    }
};
