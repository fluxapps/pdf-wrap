import gulp from "gulp";
import ts from "gulp-typescript";
import sourcemaps from "gulp-sourcemaps";
import del from "del";
import {spawn} from "child_process";
// import terser from "gulp-terser-js";
import eslint from "gulp-eslint";
import typedoc from "gulp-typedoc";
import concat from "gulp-concat";
import rename from "gulp-rename";
import resolve from "resolve";
// import merge from "merge2";
import path from "path";
// import terserConfig from "./terser-config.cjs";
import ciDetect from "@npmcli/ci-detect";

import appProperties from "./app.properties.cjs";

// build ----------------------------------------------------

// --- clean
/*
 * Cleans the build by removing the build directory.
 */
gulp.task("clean", function () {
    return del([appProperties.doc, appProperties.assets.dir, appProperties.dist], {force: false});
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
            out: path.join(appProperties.doc, "typedoc"),
            name: "PDF Wrap",
            externalPattern: `**/node_modules/**`,
            exclude: `${appProperties.root}/src/api/**/*.(spec|mocks).ts`,
            excludeExternals: true,
            ignoreCompilerErrors: true,
            includeDeclarations: true,
            excludePrivate: true,
            excludeProtected: true,
            excludeNotExported: true,
            readme: `${appProperties.root}/README.md`,
            tsconfig: `${appProperties.root}/tsconfig.app.json`
        }));
});

/*
 * Generates the full PDF Wrap documentation
 */
gulp.task("mkdocs", (done) => {

    spawn("mkdocs", ["build"], {stdio: "inherit", shell: true})
        .once("exit", function (code) {
            if (code === 0) {
                done();
            } else {
                done(`Process finished with exit code ${code}`);
            }
        });
});


/*
 * Generates the full PDF Wrap documentation
 */
gulp.task("generateDoc", gulp.series("mkdocs", "typedoc"));

// --- publishDoc
/*
 * Builds and publishes the documentation
 */
gulp.task("publishDoc", gulp.series("generateDoc", (done) => {

    spawn("ghp-import", [path.join(appProperties.doc, "mkdocs"), "-p", "-n"], {stdio: "inherit", shell: true})
        .once("exit", function (code) {
            if (code === 0) {
                done();
            } else {
                done(`Process finished with exit code ${code}`);
            }
        });
}));

// other ----------------------------------------------------

// --- copyCMaps
/*
 * Copies the cmaps used in pdfjs.
 */
gulp.task("copyCMaps", () => {

    const packagePath = getPdfJsPath();
    return gulp.src(`${packagePath}/cmaps/**/*`)
        .pipe(gulp.dest(appProperties.assets.cmaps));
});

// --- copyImages
/*
 * Copies pdfJS images which are needed of pdfJS.
 */
gulp.task("copyImages", () => {
    const packagePath = getPdfJsPath();
    return gulp.src(`${packagePath}/web/images/*`)
        .pipe(gulp.dest(appProperties.assets.image));
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
        .pipe(gulp.dest(appProperties.assets.script));
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
        .pipe(gulp.dest(appProperties.assets.css));
});


// --- transpileTypescript
/*
 * Transpiles typescript to javascript based on the tsconfig.json file
 * and generates inline source maps.
 */
function transpileTypescript() {

    const tsProject = ts.createProject("tsconfig.app.json");

    return tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .pipe(sourcemaps.write(".", { includeContent: false, sourceRoot: '../src' }))
        .pipe(rename((it) => {
            const newPath = path.join(...(it.dirname.split(path.sep).slice(1)));
            it.dirname = newPath === "." ? "./" : newPath;
            return it;
        }))
        .pipe(gulp.dest(appProperties.dist));

    /**
     * return merge([
     tsResult.dts,
     tsResult.js.pipe(terser(terserConfig))
     ])
     .pipe(sourcemaps.write(".", { includeContent: false, sourceRoot: '../src' }))
     .pipe(gulp.dest(appProperties.dist));
     */

}

gulp.task("transpile", gulp.series(transpileTypescript));

// verification ---------------------------------------------

// --- test
/*
 * Runs the tests
 */
export function test (done) {
    spawn("yarn", ["karma", "start", "karma.conf.cjs"], {stdio: "inherit", env: process.env, shell: true})
        .once("exit", function (code) {
            if (code === 0) {
                done();
            } else {
                done(`Process finished with exit code ${code}`);
            }
        });
}

// --- lint
/*
 * Lints the typescript code
 */
export function lint() {
    return gulp.src([
        `${appProperties.root}/src/**/*.ts`
    ])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError())
}

// --- build
/*
 * Transpiles typescript and runs the tests.
 */
if (ciDetect()) {
    gulp.task("build", "transpile");
} else {
    gulp.task("build", gulp.series(lint, test, "transpile"));
}

/*
 * Copies javascript files, README.md, LICENSE.md and package.json to the libs directory.
 */
gulp.task("package", gulp.series(gulp.parallel("build", "copyPDFJS", "copyCSS")));

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

