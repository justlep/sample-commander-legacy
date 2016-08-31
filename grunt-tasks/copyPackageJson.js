module.exports = function (grunt) {
    'use strict';

    var PACKAGE_JSON_SOURCE_PATH = 'src/package.json',
        PACKAGE_JSON_TARGET_PATH = 'build/preparedBuild/package.json';

    grunt.registerTask('copyPackageJson', 'Copies an altered package.json to the preparedBuild path.',
        function () {
            var packageJson = grunt.file.readJSON(PACKAGE_JSON_SOURCE_PATH);

            packageJson.window.toolbar = false;
            packageJson.window.title += ' v' + packageJson.version;

            grunt.file.write(PACKAGE_JSON_TARGET_PATH, JSON.stringify(packageJson, null, 2));

            grunt.log.writeln('\nCopied an updated package.json copied to ' + PACKAGE_JSON_TARGET_PATH);
        });
};