const gulp = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const autoprefixer = require("gulp-autoprefixer");
const cleanCSS = require("gulp-clean-css");
const terser = require("gulp-terser");
const concat = require("gulp-concat");
const imagemin = require("gulp-imagemin");
const browserSync = require("browser-sync").create();
const fileInclude = require("gulp-file-include");

const paths = {
  html: "src/html/*.html",
  partials: "src/html/partials/*.html",
  scss: "src/scss/**/*.scss",
  js: "src/js/**/*.js",
  images: "src/images/**/*",
  build: "build"
};

function html() {
  return gulp
    .src(paths.html)
    .pipe(
      fileInclude({
        prefix: "@@",
        basepath: "@file"
      })
    )
    .pipe(gulp.dest(paths.build))
    .pipe(browserSync.stream());
}

function styles() {
  return gulp
    .src("src/scss/app.scss")
    .pipe(sass().on("error", sass.logError))
    .pipe(
      autoprefixer({
        cascade: false
      })
    )
    .pipe(cleanCSS())
    .pipe(gulp.dest("build/css"))
    .pipe(browserSync.stream());
}

function scripts() {
  return gulp
    .src(paths.js)
    .pipe(concat("app.min.js"))
    .pipe(terser())
    .pipe(gulp.dest("build/js"))
    .pipe(browserSync.stream());
}

function images() {
  return gulp
    .src(paths.images)
    .pipe(imagemin())
    .pipe(gulp.dest("build/images"));
}

function staticFiles() {
  return gulp
    .src(["robots.txt", "sitemap.xml", ".htaccess"], { allowEmpty: true })
    .pipe(gulp.dest(paths.build));
}

function serve() {
  browserSync.init({
    server: {
      baseDir: paths.build
    },
    notify: false,
    open: true
  });

  gulp.watch([paths.html, paths.partials], html);
  gulp.watch(paths.scss, styles);
  gulp.watch(paths.js, scripts);
  gulp.watch(paths.images, images);
}

const build = gulp.series(html, styles, scripts, images, staticFiles);
const dev = gulp.series(build, serve);

exports.html = html;
exports.styles = styles;
exports.scripts = scripts;
exports.images = images;
exports.build = build;
exports.default = dev;