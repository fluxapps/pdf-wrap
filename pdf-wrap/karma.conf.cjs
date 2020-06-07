module.exports = (config) => {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '../',

        frameworks: ["mocha", "karma-typescript"],
        files: [
            "pdf-wrap/src/**/*.ts"
        ],

        plugins: [
            "karma-spec-reporter",
            "karma-*"
        ],

        preprocessors: {
            "**/*.ts": "karma-typescript" // *.tsx for React Jsx
        },

        customLaunchers: {
            ChromeHeadlessNoSandbox: {
                base: 'ChromeHeadless',
                flags: [
                    '--no-sandbox', //default karma-esm configuration
                    '--disable-setuid-sandbox', //default karma-esm configuration
                ],
            },
        },
        browsers: ["ChromeHeadlessNoSandbox"],

        karmaTypescriptConfig: {
            tsconfig: "./pdf-wrap/tsconfig.spec.json",
            compilerDelay: 500,
            bundlerOptions: {
                addNodeGlobals: false,
                entrypoints: /.+?\.spec\.ts$/
            },
            reports: {
                "text-summary": ""
            }
        },

        logLevel: config.LOG_INFO,

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true,

        reporters: ["spec", "karma-typescript"]
    });

    return config;
}
