"use strict";

import gulp from "gulp";
import concat from "gulp-concat";
import imagemin from "gulp-imagemin";
import include from "gulp-include";
import plumber from "gulp-plumber";
import rename from "gulp-rename";
import sourcemaps from "gulp-sourcemaps";
import uglify from "gulp-uglify";
import yaml from "gulp-yaml";
import browserSync from "browser-sync";
import cp from "child_process";
import { deleteAsync } from "del";
import fs from "fs";
import gulpSass from "gulp-sass";
import source from "vinyl-source-stream";

/**
 * Notify
 *
 * Show a notification in the browser's corner.
 *
 * @param {*} message
 */
function notify(message) {
  browserSync.notify(message);
}

/**
 * Config Task
 *
 * Build the main YAML config file.
 */
function config() {
  return gulp.src('_config.yml')
    .pipe(include())
    .on('error', console.error)
    .pipe(gulp.dest('./'))
    .pipe(browserSync.reload({ stream: true }));
}

/**
 * Jekyll Task
 *
 * Build the Jekyll Site.
 *
 * @param {*} done
 */
function jekyll(done) {
  notify('Building Jekyll...');
  let bundle = process.platform === "win32" ? "bundle.bat" : "bundle";
  return cp
    .spawn(bundle, ['exec', 'jekyll build'], { stdio: 'inherit' })
    .on('close', done);
}

/**
 * Server Task
 *
 * Launch server using BrowserSync.
 *
 * @param {*} done
 */
function server(done) {
  browserSync({
    server: {
      baseDir: '_site'
    }
  });
  done();
}

/**
 * Reload Task
 *
 * Reload page with BrowserSync.
 *
 * @param {*} done
 */
function reload(done) {
  notify('Reloading...');
  browserSync.reload();
  done();
}

/**
 * Sass Task
 *
 * Compile SASS files.
 */
function compileSass() {
  return (
    gulp
      .src("css/style.scss")
      .pipe(gulpSass())
      .pipe(gulp.dest("css"))
  );
}

/**
 * Main JS Task
 *
 * All regular .js files are collected, minified and concatenated into one
 * single scripts.min.js file (and sourcemap)
 */
function mainJs() {
  notify('Building JS files...');
  return gulp.src('src/js/main/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(concat('scripts.min.js'))
    .pipe(plumber())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('_site/assets/js/'))
    .pipe(browserSync.reload({ stream: true }))
    .pipe(gulp.dest('assets/js'));
}

/**
 * Preview JS Task
 *
 * Copy preview JS files to the assets folder.
 */
function previewJs() {
  notify('Copying preview files...');
  return gulp.src('src/js/preview/**/*.*')
    .pipe(gulp.dest('assets/js/'));
}

/**
 * JavaScript Task
 *
 * Run all the JS related tasks.
 */
const js = gulp.parallel(mainJs, previewJs);

/**
 * Images Task
 *
 * All images are optimized and copied to assets folder.
 */
function images() {
  notify('Copying image files...');
  return gulp.src('src/img/**/*.{jpg,png,gif,svg}')
    .pipe(plumber())
    .pipe(imagemin({ optimizationLevel: 5, progressive: true, interlaced: true }))
    .pipe(gulp.dest('assets/img/'));
}

/**
 * Watch Task
 *
 * Watch files to run proper tasks.
 */
function watch() {
  
  // Watch SASS files for changes & rebuild styles
  gulp.watch(['_sass/**/*.scss'], gulp.series(compileSass, jekyll, reload));

  // Watch JS files for changes & recompile
  gulp.watch('src/js/main/**/*.js', mainJs);

  // Watch preview JS files for changes, copy files & reload
  gulp.watch('src/js/preview/**/*.js', gulp.series(previewJs, reload));

  // Watch images for changes, optimize & recompile
  gulp.watch('src/img/**/*', gulp.series(images, config, jekyll, reload));

  // Watch html/md files, rebuild config, run Jekyll & reload BrowserSync
  gulp.watch(['*.html', '_includes/*.html', '_layouts/*.html', '_posts/*', '_authors/*', 'pages/*', 'category/*'], gulp.series(config, jekyll, reload));
}

/**
 * Default Task
 *
 * Running just `gulp` will:
 * - Compile the theme, SASS and JavaScript files
 * - Optimize and copy images to its folder
 * - Build the config file
 * - Compile the Jekyll site
 * - Launch BrowserSync & watch files
 */
const run = gulp.series(gulp.parallel(js, images), config, jekyll, gulp.parallel(server, watch));

/**
 * Build Task
 *
 * Running just `gulp build` will:
 * - Compile the theme, SASS and JavaScript files
 * - Optimize and copy images to its folder
 * - Build the config file
 * - Compile the Jekyll site
 */
const build = gulp.series(gulp.parallel(js, images), config, jekyll);

export { run as default, compileSass };
