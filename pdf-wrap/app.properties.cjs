const path = require("path");

function build(...subDirs) {
    return path.resolve(__dirname, ...subDirs);
}

const APP_PROPERTIES = {
    root: build(),
    dist: build("lib"),
    doc: build("doc"),
    assets: {
        dir: build("assets"),
        css: build("assets"),
        image: build("assets", "images"),
        script: build("assets"),
        cmaps: build("assets", "cmaps")
    }
};

module.exports = APP_PROPERTIES;
