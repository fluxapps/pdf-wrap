const TERSER_CONFIG = {
    sourceMap: {
        content: true
    },
    output: {
        beautify: false
    },
    ecma: 2015,
    nameCache: null,
    toplevel: false,
    ie8: false,
    safari10: false,
    warnings: true
};

module.exports = TERSER_CONFIG;
