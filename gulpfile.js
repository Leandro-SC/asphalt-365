const gulp = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const autoprefixer = require("gulp-autoprefixer").default;
const cleanCSS = require("gulp-clean-css");
const terser = require("gulp-terser");
const concat = require("gulp-concat");
const browserSync = require("browser-sync").create();
const fileInclude = require("gulp-file-include");
const sharp = require("sharp");
const through2 = require("through2");
const path = require("path");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const paths = {
  html: "src/html/*.html",
  partials: "src/html/partials/*.html",
  scss: "src/scss/**/*.scss",
  js: "src/js/**/*.js",
  images: "src/images/**/*.{jpg,jpeg,png,svg}",
  videos: "src/videos/**/*.{mp4,mov,avi,mkv,webm}",
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
    .src(paths.images, { encoding: false })
    .pipe(
      through2.obj(function (file, _, cb) {
        if (file.isNull()) {
          cb(null, file);
          return;
        }

        const ext = path.extname(file.path).toLowerCase();
        const supportedRasterFormats = [".jpg", ".jpeg", ".png"];
        const supportedSvgFormats = [".svg"];

        const sourceRoot = path.resolve("src/images");
        const outputRoot = path.resolve("build/images");
        const relativePath = path.relative(sourceRoot, file.path);
        const relativeDir = path.dirname(relativePath);
        const outputDir = path.join(outputRoot, relativeDir);

        fs.mkdirSync(outputDir, { recursive: true });

        if (supportedSvgFormats.includes(ext)) {
          fs.writeFileSync(path.join(outputDir, path.basename(file.path)), file.contents);
          cb();
          return;
        }

        if (!supportedRasterFormats.includes(ext)) {
          cb();
          return;
        }

        const fileName = path.basename(file.path, ext);
        const originalExt = ext === ".jpeg" ? ".jpg" : ext;

        Promise.all([
          sharp(file.contents)
            .jpeg({ quality: 82, progressive: true })
            .toFile(path.join(outputDir, `${fileName}${originalExt}`)),

          sharp(file.contents)
            .webp({ quality: 82 })
            .toFile(path.join(outputDir, `${fileName}.webp`)),

          sharp(file.contents)
            .avif({ quality: 58 })
            .toFile(path.join(outputDir, `${fileName}.avif`))
        ])
          .then(() => cb())
          .catch(cb);
      })
    );
}


function videos(done) {
  const videoFiles = [];

  gulp
    .src(paths.videos, { read: false, allowEmpty: true })
    .on("data", (file) => {
      videoFiles.push(file.path);
    })
    .on("end", async () => {
      for (const filePath of videoFiles) {
        const ext = path.extname(filePath).toLowerCase();
        const fileName = path.basename(filePath, ext);

        const sourceRoot = path.resolve("src/videos");
        const outputRoot = path.resolve("build/videos");

        const relativePath = path.relative(sourceRoot, filePath);
        const relativeDir = path.dirname(relativePath);

        const outputDir = path.join(outputRoot, relativeDir);

        fs.mkdirSync(outputDir, { recursive: true });

        const mp4Output = path.join(outputDir, `${fileName}.mp4`);
        const webmOutput = path.join(outputDir, `${fileName}.webm`);

        await new Promise((resolve, reject) => {
          ffmpeg(filePath)
            .videoCodec("libx264")
            .outputOptions([
              "-crf 28",
              "-preset slow",
              "-movflags +faststart"
            ])
            .audioCodec("aac")
            .audioBitrate("128k")
            .size("?x720")
            .save(mp4Output)
            .on("end", resolve)
            .on("error", reject);
        });

        await new Promise((resolve, reject) => {
          ffmpeg(filePath)
            .videoCodec("libvpx-vp9")
            .outputOptions([
              "-crf 32",
              "-b:v 0"
            ])
            .noAudio()
            .size("?x720")
            .save(webmOutput)
            .on("end", resolve)
            .on("error", reject);
        });

        console.log(`✔ Video optimizado: ${fileName}`);
      }

      done();
    })
    .on("error", done);
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
}

const devBuild = gulp.series(html, styles, scripts, staticFiles);
const build = gulp.series(html, styles, scripts, images, videos, staticFiles);
const dev = gulp.series(devBuild, serve);

exports.html = html;
exports.styles = styles;
exports.scripts = scripts;
exports.images = images;
exports.videos = videos;
exports.build = build;
exports.dev = dev;
exports.default = dev;