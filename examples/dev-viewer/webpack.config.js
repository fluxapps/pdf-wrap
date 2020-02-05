const path = require("path");
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {

    entry: {
        main: path.resolve(__dirname, "src", "js", "index.js"),
    },
    output: {
        path: path.resolve(__dirname, "build", "www"),
        filename: "[name].js"
    },

    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new HtmlWebpackPlugin({
            template: 'src/index.html'
        }),
        new CopyWebpackPlugin([
            {from: "src/assets", to: "assets"},
            {from: "node_modules/@srag/pdf-wrap/assets", to: "assets/libs/pdf-wrap"},
            {from: "node_modules/@srag/pdf-wrap/assets/images", to: "images"},
        ]),
    ],

    devtool: "source-map",
    mode: "development",

    module: {
        rules: [{
            test: /\.css$/,
            loaders: ['style-loader', 'css-loader']
        }, {
            test: /\.html$/,
            loader: "raw-loader" // loaders: ['raw-loader'] is also perfectly acceptable.
        },
            {
                test: /\.(png|jpe?g|gif|svg|bcmap)$/,
                loader: "file-loader"
            }
        ]
    },

    devServer: {
        contentBase: path.resolve(__dirname, "build", "www"),
        compress: false,
        hot: true,
        http2: false,
        port: 9001
    }
};
