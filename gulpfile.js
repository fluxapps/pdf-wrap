const gulp = require("gulp");
const ts = require("gulp-typescript");
const sourcemaps = require("gulp-sourcemaps");
const del = require("del");
const copyNodeModules = require("copy-node-modules");
const file = require("gulp-file");
const spawn = require("child_process").spawn;
const uglify = require("gulp-uglify");
const sequence = require("gulp-sequence");
const gulpTslint = require("gulp-tslint");
const tslint = require("tslint");

const appProperties = require("./app.properties");

// build ----------------------------------------------------

// --- clean
/*
 * Cleans the build by removing the build directory.
 */
gulp.task("clean", function () {
    return del(`${appProperties.build.dir}/**`, {force: false});
});

// --- build
/*
 * Transpiles typescript and runs the tests.
 */
gulp.task("build", ["test", "lint"], function (done) {
    done();
});

// --- package
/*
 * Copies javascript files, README.md, LICENSE.md and package.json to the libs directory.
 */
gulp.task("package", ["uglifyJS", "copyDependencies", "transformPackageJSON"], function () {

    return gulp
        .src([
            `${appProperties.root}/README.md`,
            `${appProperties.root}/LICENSE.md`,
            `${appProperties.build.dirs.libs}/pdf-wrap/**/*`
        ])
        .pipe(gulp.dest(`${appProperties.build.dirs.dist}/npm`));
});

// --- repackage
/*
 * Cleans the build and execute package.
 */
gulp.task("repackage", sequence("clean", "package"));

// --- uglifyJS
/*
 * Uglifies javascript files.
 */
gulp.task("uglifyJS", ["build"], function () {

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
        .pipe(uglify(options))
        .pipe(gulp.dest(`${appProperties.build.dirs.libs}/pdf-wrap`))
});


// docs -----------------------------------------------------

// --- mkdocs

// --- jsdoc


// other ----------------------------------------------------

// --- copyDependencies
/*
 * Copies every dependency declared in package.json
 */
gulp.task("copyDependencies", function (done) {

    copyNodeModules(appProperties.root, `${appProperties.build.dirs.dist}/npm`, {devDependencies: false}, function (err, _) {

        if (err) {
            done(err);
        } else {
            done();
        }
    });
});

// --- lint
/*
 * Lints the typescript code
 */
gulp.task("lint", () =>
    gulp.src(`${appProperties.root}/src/**/*.ts`)
        .pipe(gulpTslint({
            formatter: "stylish",
            program: tslint.Linter.createProgram("./tsconfig.json"), // required for type aware rules
            configuration: "./tslint.json"
        }))
        .pipe(gulpTslint.report({
            summarizeFailureOutput: true,
            allowWarnings: false
        }))
);

// --- transformPackageJSON
/*
 * Declares every dependency used in package.json as bundledDependencies.
 * In addition devDependencies are cleared.
 */
gulp.task("transformPackageJSON", function () {

    const pkg = require(`${appProperties.root}/package.json`);
    pkg.devDependencies = {};
    pkg["bundledDependencies"] = Object.keys(pkg.dependencies);

    return file("package.json", JSON.stringify(pkg), {src: true})
        .pipe(gulp.dest(`${appProperties.build.dirs.dist}/npm`));
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
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(appProperties.build.dirs.javascript));
});


// npm ------------------------------------------------------

// --- pack
/*
 * Executes yarn pack.
 */
gulp.task("pack", ["package"], function (done) {

    spawn("yarn", ["pack"], {stdio: "inherit", cwd: `${appProperties.build.dirs.dist}/npm`})
        .once("exit", function (code) {
            if (code === 0) {
                done();
            } else {
                done(`Process finished with exit code ${code}`);
            }
        });
});

// --- publish
/*
 * Publishes the npm distribution.
 */
gulp.task("publish", ["repackage"], function (done) {
    spawn("yarn", ["publish"], {stdio: "inherit", cwd: `${appProperties.build.dirs.dist}/npm`})
        .once("exit", function (code) {
            if (code === 0) {
                done();
            } else {
                done(`Process finished with exit code ${code}`);
            }
        });
});

// verification ---------------------------------------------

// --- test
/*
 * Runs the tests
 */
gulp.task("test", ["transpileTypescript"], function (done) {
    spawn("yarn", ["mocha"], {stdio: "inherit"})
        .once("exit", function (code) {
            if (code === 0) {
                done();
            } else {
                done(`Process finished with exit code ${code}`);
            }
        });
});
