const CONFIG = {
    spec: "./test/**/*.spec.ts",
    extension: ["ts"],
    package: "./package.json",
    require: [
        "ts-node/register/transpile-only",
    ]
};

module.exports = CONFIG;
