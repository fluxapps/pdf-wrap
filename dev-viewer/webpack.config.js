const path = require("path");
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const resolve = require("resolve");

const WRAP_LIB_PATH = getWarpPath();

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
            {from: `${WRAP_LIB_PATH}/build/distributions/npm/assets`, to: "assets/libs/pdf-wrap"},
            {from: `${WRAP_LIB_PATH}/build/distributions/npm/assets/images`, to: "images"},
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
        port: 9500
    }
};

function getWarpPath() {
    const packageName = "@srag/pdf-wrap";
    const searchTerm = `/${packageName}/`;
    /**
     * @type {string}
     */
    const pdfjsPath = resolve.sync(packageName, { basedir: __dirname });
    const index = pdfjsPath.lastIndexOf(searchTerm) + searchTerm.length - 1;
    return  pdfjsPath.substring(0, index);
}
