'use strict';
var fs = require('fs');
var gulp = require('gulp');

fs.readdirSync(__dirname + '/gulp').forEach(function (module) {
    require(__dirname + '/gulp/' + module)
});

gulp.task('build', ['js', 'libjs', 'css', 'libcss']);
gulp.task('default', ['js:watch', 'css:watch']);
