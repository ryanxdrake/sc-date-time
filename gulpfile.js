var autoprefixer, bump, changelog, concat, del, filter, fs, git, gulp, htmlmin, ngtemplate, order, path, releaseVersion, rename, runSequence, stylus, tag_version;

fs = require('fs');

path = require('path');

gulp = require('gulp');

git = require('gulp-git');

bump = require('gulp-bump');

filter = require('gulp-filter');

tag_version = require('gulp-tag-version');

del = require('del');

concat = require('gulp-concat-util');

order = require('gulp-order');

rename = require('gulp-rename');

runSequence = require('run-sequence');

changelog = require('conventional-changelog');

stylus = require('gulp-stylus');

autoprefixer = require('gulp-autoprefixer');

ngtemplate = require('gulp-ngtemplate');

htmlmin = require('gulp-htmlmin');

gulp.task('clean:dist', function(cb) {
  return del(['dist/*'], cb);
});

gulp.task('compile:html', ['clean:dist'], function() {
  return gulp.src(['./src/*.html']).pipe(rename({
    prefix: 'olDateTime-',
    extname: '.tpl'
  })).pipe(htmlmin({
    collapseWhitespace: true
  })).pipe(ngtemplate({
    module: 'olDateTime'
  })).pipe(rename({
    extname: '.tpl.temp'
  })).pipe(gulp.dest('dist'));
});

gulp.task('compile:js', ['compile:html'], function() {
  return gulp.src(['./src/main.js'])
  .pipe(rename('ol-date-time.js')).pipe(gulp.dest('dist'));
});

gulp.task('compile:javascript', ['compile:js'], function() {
  var pkg;
  pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  return gulp.src(['./dist/ol-date-time.js', './dist/*.tpl.temp']).pipe(order(['dist/ol-date-time.js', 'dist/*.tpl.temp'])).pipe(concat('ol-date-time.js')).pipe(concat.header("/*\n	@license ol-date-time\n	@author SimeonC\n	@license 2015 MIT\n	@version " + pkg.version + "\n\n	See README.md for requirements and use.\n*/")).pipe(gulp.dest('dist'));
});

gulp.task('compile:stylus', ['clean:dist'], function() {
  var pkg;
  pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  return gulp.src(['./src/styles.styl']).pipe(stylus()).pipe(autoprefixer()).pipe(concat()).pipe(concat.header("/*\n	@license ol-date-time\n	@author SimeonC\n	@license 2015 MIT\n	@version " + pkg.version + "\n\n	See README.md for requirements and use.\n*/")).pipe(rename('ol-date-time.css')).pipe(gulp.dest('dist'));
});

gulp.task('compile:main', ['compile:javascript', 'compile:stylus']);

gulp.task('compile', ['compile:main'], function(cb) {
  return del(['dist/*.temp'], cb);
});


/*
	Bumping version number and tagging the repository with it.

	You can use the commands

		gulp prerel		# makes v0.1.0 -> v0.1.1-pre1
		gulp patch		# makes v0.1.0 → v0.1.1
		gulp minor		# makes v0.1.1 → v0.2.0
		gulp major		# makes v0.2.1 → v1.0.0

	To bump the version numbers accordingly after you did a patch,
	introduced a feature or made a backwards-incompatible release.
 */

releaseVersion = function(importance) {
  return gulp.src(['./package.json', './bower.json']).pipe(bump({
    type: importance
  })).pipe(gulp.dest('./'));
};

gulp.task('tagversion', function() {
  return gulp.src(['./package.json', './bower.json', './changelog.md', './dist/*']).pipe(git.commit('chore(release): Bump Version Number')).pipe(filter('package.json')).pipe(tag_version());
});

gulp.task('changelog', function(cb) {
  var pkg;
  pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  return changelog({
    version: pkg.version,
    repository: pkg.repository.url
  }, function(err, content) {
    return fs.writeFile('./changelog.md', content, cb);
  });
});

gulp.task('release:prerel', function() {
  return releaseVersion('prerelease');
});

gulp.task('release:patch', function() {
  return releaseVersion('patch');
});

gulp.task('release:minor', function() {
  return releaseVersion('minor');
});

gulp.task('release:major', function() {
  return releaseVersion('major');
});

gulp.task('prerel', function() {
  return runSequence('release:prerel', 'changelog', 'compile', 'tagversion');
});

gulp.task('patch', function() {
  return runSequence('release:patch', 'changelog', 'compile', 'tagversion');
});

gulp.task('minor', function() {
  return runSequence('release:minor', 'changelog', 'compile', 'tagversion');
});

gulp.task('major', function() {
  return runSequence('release:major', 'changelog', 'compile', 'tagversion');
});

gulp.task('default', ['compile']);
