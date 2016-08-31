module.exports = function (grunt) {
    'use strict';

    var ROOT_PACKAGE_JSON_PATH = 'package.json',
        PACKAGE_JSON_SOURCE_PATH = 'src/package.json',
        PACKAGE_JSON_TARGET_PATH = 'build/preparedBuild/package.json';

    grunt.registerTask('copyPackageJson', 'Copies an altered package.json to the preparedBuild path.',
        function () {
            var rootPackageJson = grunt.file.readJSON(ROOT_PACKAGE_JSON_PATH),
                packageJson = grunt.file.readJSON(PACKAGE_JSON_SOURCE_PATH),
                version = rootPackageJson.version;

            packageJson.window.toolbar = false;
            packageJson.version = version;
            packageJson.window.title += ' v' + version;

            grunt.file.write(PACKAGE_JSON_TARGET_PATH, JSON.stringify(packageJson, null, 2));

            grunt.log.writeln('\nCopied an updated package.json copied to ' + PACKAGE_JSON_TARGET_PATH);
        });
};