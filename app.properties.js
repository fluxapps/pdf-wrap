const path = require("path");

function build(subdir) {
    return path.resolve(__dirname, "build", subdir? subdir : "");
}

module.exports = {

    root: path.resolve(__dirname),

    build: {
        dir: build(),

        dirs: {
            javascript: build("javascript"),
            dist: build("distributions"),
            libs: build("libs")
        }
    }
};