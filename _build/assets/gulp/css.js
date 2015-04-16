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
            'scss/vendor/github-markdown-css/github-markdown.css'
        ])
        .pipe(plumber())
        .pipe(concat('github-markdown.css'))
        .pipe(gulp.dest('../../assets/components/markdowneditor/css'));
});

gulp.task('noembed-css', function () {
    return gulp.src([
            'scss/vendor/noembed/*.scss'
        ])
        .pipe(plumber())
        .pipe(sass())
        .pipe(concat('noembed.css'))
        .pipe(gulp.dest('../../assets/components/markdowneditor/css'));
});

gulp.task('cards-css', function () {
    return gulp.src([
            'scss/vendor/cards/*.scss'
        ])
        .pipe(plumber())
        .pipe(sass())
        .pipe(concat('cards.css'))
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

gulp.task('css:watch', ['css', 'cards-css'], function () {
    gulp.watch('scss/*.scss', ['css']);
    gulp.watch('scss/vendor/cards/*.scss', ['cards-css']);
});
