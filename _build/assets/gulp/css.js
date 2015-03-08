var gulp = require('gulp');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var plumber = require('gulp-plumber');
var concat = require('gulp-concat');

gulp.task('libcss', function () {
    return gulp.src([
            'bower_components/cropper/dist/cropper.min.css'
        ])
        .pipe(plumber())
        .pipe(concat('dependencies.css'))
        .pipe(gulp.dest('../../assets/components/markdowneditor/css'));
});

gulp.task('github-md', function () {
    return gulp.src([
            'bower_components/github-markdown-css/github-markdown.css'
        ])
        .pipe(plumber())
        .pipe(concat('github-markdown.css'))
        .pipe(gulp.dest('../../assets/components/markdowneditor/css'));
});

gulp.task('css-highlight', function () {
    return gulp.src([
            'src/vendor/highlight/styles/github.css'
        ])
        .pipe(plumber())
        .pipe(concat('highlight.css'))
        .pipe(gulp.dest('../../assets/components/markdowneditor/css'));
});

gulp.task('css', function () {
    return gulp.src('scss/app.scss')
            .pipe(sourcemaps.init())
            .pipe(plumber())
            .pipe(sass({
                paths: ['assets']
            }))
            .pipe(sourcemaps.write())
            .pipe(gulp.dest('../../assets/components/markdowneditor/css'));
});

gulp.task('css:watch', ['css'], function () {
    gulp.watch('scss/*.scss', ['css'])
});
