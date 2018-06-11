const path = require("path");

module.exports = {

    entry: "./src/js/index.js",
    output: {
        path: path.resolve(__dirname, "build/www"),
        filename: "main.js"
    }

};