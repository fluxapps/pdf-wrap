const gulp = require("gulp");
const ts = require("gulp-typescript");
const sourcemaps = require("gulp-sourcemaps");
const del = require("del");
const file = require("gulp-file");
const spawn = require("child_process").spawn;
const terser = require("gulp-terser");
const eslint = require("gulp-eslint");
const typedoc = require("gulp-typedoc");
const concat = require("gulp-concat");
const resolve = require("resolve");

const appProperties = require("./app.properties");

// build ----------------------------------------------------

// --- clean
/*
 * Cleans the build by removing the build directory.
 */
gulp.task("clean", function () {
    return del(`${appProperties.build.dir}/**`, {force: false});
});


// docs -----------------------------------------------------

// --- mkdocs

// --- typedoc
/*
 * Generates the typescript api documentation
 */
gulp.task("typedoc", () => {
    return gulp.src([
        `${appProperties.root}/src/api/**/*.ts`,
        `${appProperties.root}/src/pdfjs/pdfjs.document.service.ts`,
        `${appProperties.root}/src/log-config.ts`,
    ])
        .pipe(typedoc({
            module: "commonjs",
            target: "ES6",
            out: `${appProperties.build.dirs.docs}/typedoc`,
            name: "PDF Wrap",
            externalPattern: `${appProperties.root}/node_modules/**`,
            excludeExternals: true,
            ignoreCompilerErrors: true,
            includeDeclarations: true,
            excludePrivate: true,
            excludeProtected: true,
            excludeNotExported: true,
            readme: `${appProperties.root}/README.md`,
            tsconfig: `${appProperties.root}/tsconfig.json`

        }));
});

/*
 * Generates the full PDF Wrap documentation
 */
gulp.task("mkdocs", gulp.series("typedoc", (done) => {

    spawn("mkdocs", ["build"], {stdio: "inherit", shell: true})
        .once("exit", function (code) {
            if (code === 0) {

                gulp.src(`${appProperties.build.dirs.docs}/typedoc/**/*`)
                    .pipe(gulp.dest(`${appProperties.build.dirs.docs}/mkdocs/typedoc`))
                    .on("end", done)
                    .on("error", done);

            } else {
                done(`Process finished with exit code ${code}`);
            }
        });
}));

// --- publishDoc
/*
 * Builds and publishes the documentation
 */
gulp.task("publishDoc", gulp.series("mkdocs", (done) => {

    spawn("ghp-import", [`${appProperties.build.dirs.docs}/mkdocs`, "-p", "-n"], {stdio: "inherit", shell: true})
        .once("exit", function (code) {
            if (code === 0) {
                done();
            } else {
                done(`Process finished with exit code ${code}`);
            }
        });
}));

// other ----------------------------------------------------

// --- copyDependencies
/*
 * Copies every dependency declared in package.json
 */
gulp.task("copyDependencies", function (done) {
    done(); // Noop don't bundle dependencies.
});

// --- copyCMaps
/*
 * Copies the cmaps used in pdfjs.
 */
gulp.task("copyCMaps", () => {

    const packagePath = getPdfJsPath();
    return gulp.src(`${packagePath}/cmaps/**/*`)
        .pipe(gulp.dest(`${appProperties.build.dirs.libs}/pdf-wrap/assets/cmaps`));
});

// --- copyImages
/*
 * Copies pdfJS images which are needed of pdfJS.
 */
gulp.task("copyImages", () => {
    const packagePath = getPdfJsPath();
    return gulp.src(`${packagePath}/web/images/*`)
        .pipe(gulp.dest(`${appProperties.build.dirs.libs}/pdf-wrap/assets/images`));
});

// --- copyPDFJS
/*
 * Copies pdfJS files which are needed in order to use it.
 */
gulp.task("copyPDFJS", gulp.series(gulp.parallel("copyCMaps", "copyImages"), () => {
    const packagePath = getPdfJsPath();
    return gulp
        .src([
            `${packagePath}/build/pdf.worker.js`
        ])
        .pipe(gulp.dest(`${appProperties.build.dirs.libs}/pdf-wrap/assets`));
}));

// -- copyCSS
/*
 * Copies the css needed for the viewer.
 */
gulp.task("copyCSS", () => {
    const packagePath = getPdfJsPath();
    return gulp.src([
        `${packagePath}/web/pdf_viewer.css`,
        `${appProperties.root}/src/assets/css/pdf-wrap.css`
    ])
        .pipe(concat("pdf-wrap.css"))
        .pipe(gulp.dest(`${appProperties.build.dirs.libs}/pdf-wrap/assets`))
});

// --- transformPackageJSON
/*
 * Declares every dependency used in package.json as bundledDependencies.
 * In addition devDependencies are cleared.
 */
gulp.task("transformPackageJSON", function () {

    const pkg = require(`${appProperties.root}/package.json`);
    pkg.devDependencies = {};
    pkg.scripts = {};
    pkg.main = "index.js";

    return file("package.json", JSON.stringify(pkg), {src: true})
        .pipe(gulp.dest(`${appProperties.build.dirs.dist}/npm`));
});

// --- transformPackageJSON
/*
 * Declares every dependency used in package.json as bundledDependencies.
 * In addition devDependencies are cleared.
 */
gulp.task("copyNpmRc", function () {

    return gulp.src([
        `${appProperties.root}/.npmrc`
    ])
        .pipe(gulp.dest(`${appProperties.build.dirs.dist}/npm`))
});


// --- transpileTypescript
/*
 * Transpiles typescript to javascript based on the tsconfig.json file
 * and generates inline source maps.
 */
gulp.task("transpileTypescript", function () {

    const tsProject = ts.createProject("tsconfig.json");

    return tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest(appProperties.build.dirs.javascript));
});

// verification ---------------------------------------------

// --- test
/*
 * Runs the tests
 */
gulp.task("test", gulp.series("transpileTypescript", (done) => {
    spawn("yarn", ["mocha"], {stdio: "inherit", shell: true})
        .once("exit", function (code) {
            if (code === 0) {
                done();
            } else {
                done(`Process finished with exit code ${code}`);
            }
        });
}));

// --- lint
/*
 * Lints the typescript code
 */
gulp.task("lint", () =>
    gulp.src(`${appProperties.root}/src/**/*.ts`)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError())
);

// --- build
/*
 * Transpiles typescript and runs the tests.
 */
gulp.task("build", gulp.parallel("test", "lint"));

// --- minify
/*
 * Minify javascript files.
 */
gulp.task("minify", gulp.series("build", function () {

    const options = {
        output: {
            beautify: false
        },
        nameCache: null,
        toplevel: false,
        ie8: false,
        warnings: false
    };

    return gulp.src(`${appProperties.build.dirs.javascript}/src/**/*.js`)
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(terser(options))
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest(`${appProperties.build.dirs.libs}/pdf-wrap`))
}));

// --- package
gulp.task("lib", gulp.series("minify", () => {
    return gulp.src(`${appProperties.build.dirs.javascript}/src/**/*.ts`)
        .pipe(gulp.dest(`${appProperties.build.dirs.libs}/pdf-wrap`))

}));

/*
 * Copies javascript files, README.md, LICENSE.md and package.json to the libs directory.
 */
gulp.task("package", gulp.series(gulp.parallel("lib", "copyDependencies", "copyPDFJS", "copyCSS", "transformPackageJSON", "copyNpmRc"), function () {

    return gulp
        .src([
            `${appProperties.root}/README.md`,
            `${appProperties.root}/LICENSE.md`,
            `${appProperties.root}/CHANGELOG.md`,
            `${appProperties.build.dirs.libs}/pdf-wrap/**/*`
        ])
        .pipe(gulp.dest(`${appProperties.build.dirs.dist}/npm`));
}));

// --- repackage
/*
 * Cleans the build and execute package.
 */
gulp.task("repackage", gulp.series("clean", "package"));

// npm ------------------------------------------------------

// --- pack
/*
 * Executes yarn pack.
 */
gulp.task("pack", gulp.series("repackage", function (done) {

    spawn("yarn", ["pack"], {stdio: "inherit", cwd: `${appProperties.build.dirs.dist}/npm`, shell: true})
        .once("exit", function (code) {
            if (code === 0) {
                done();
            } else {
                done(`Process finished with exit code ${code}`);
            }
        });
}));

// --- publish
/*
 * Publishes the npm distribution.
 */
gulp.task("publish", gulp.series("repackage", function (done) {
    spawn("yarn", ["publish", "--access", "public"], {stdio: "inherit", cwd: `${appProperties.build.dirs.dist}/npm`, shell: true})
        .once("exit", function (code) {
            if (code === 0) {
                done();
            } else {
                done(`Process finished with exit code ${code}`);
            }
        });
}));

function getPdfJsPath() {
    const packageName = "pdfjs-dist";
    const searchTerm = `/${packageName}/`;
    /**
     * @type {string}
     */
    const pdfjsPath = resolve.sync(packageName, { basedir: appProperties.root });
    const index = pdfjsPath.lastIndexOf(searchTerm) + searchTerm.length - 1;
    return  pdfjsPath.substring(0, index);
}

