/**
 * Keeps the version within the src/package.json in sync with the version from /package.json.
 * (version in src/package.json is displayed in the app's window title bar)
 */
module.exports = function (grunt) {
    'use strict';

    var SRC_PACKAGE_JSON = 'src/package.json';

    grunt.registerTask('updateSourcePackageJson', 'Updates the version in the source package json', function () {
        var opts = this.options(),
            projectVersion = grunt.file.readJSON('package.json').version,
            sourcePkg = grunt.file.readJSON(SRC_PACKAGE_JSON),
            oldJsonString = JSON.stringify(sourcePkg, null, 2),
            newJsonString;

            sourcePkg.version = projectVersion;
            sourcePkg.window.title = sourcePkg.window.title.replace(/v[0-9.]+$/, 'v' + projectVersion);
            newJsonString = JSON.stringify(sourcePkg, null, 2);

            // maybe add more adjustments later...

        if (oldJsonString !== newJsonString) {
            grunt.file.write(SRC_PACKAGE_JSON, newJsonString);
            grunt.log.writeln('Updated src/package.json to version ' + projectVersion);
        } else {
            grunt.log.writeln('Update skipped - src/package.json already version ' + projectVersion);
        }
    });
};