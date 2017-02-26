/**
 * Defines 2 tasks for building or running the app via nwjs.
 * Usage:
 *   $ grunt nwjsBuild
 *   $ grunt nwjsRun
 */
module.exports = function (grunt) {
    'use strict';

    function getNwjsInstance(doRun) {
        var doBuild = !doRun,
            path = require('path'),
            pkg = grunt.file.readJSON(path.resolve(__dirname, '../package.json')),
            BUILD_TARGET_DIR = path.resolve(__dirname, '../build'),
            BUILD_SOURCES = BUILD_TARGET_DIR + '/preparedBuild/**',
            RUN_SOURCES = path.join(__dirname, '../src/**'),
            CACHE_DIR = path.resolve(__dirname, '../cache'),
            NwBuilder = require('nw-builder'),
            nw = new NwBuilder({
                files: doBuild ? BUILD_SOURCES : RUN_SOURCES,
                cacheDir: CACHE_DIR,
                buildDir: BUILD_TARGET_DIR,
                platforms: pkg.config.nwjsBuildPlatforms,
                version: pkg.config.nwjsBuildVersion,
                zip: doBuild,
                flavor: doRun ? 'sdk' : 'normal',
                toolbar: doRun,
                appVersion: pkg.version
            });

        nw.on('log',  grunt.log.writeln);

        return nw;
    }

    grunt.registerTask('nwjsBuild', 'Builds the app with NWJS', function() {
        var nw = getNwjsInstance(false),
            done = this.async();

        nw.build().then(function () {
            grunt.log.ok('nwjsBuild successfully done');
        }).catch(function (error) {
            grunt.fail.warn(error);
        }).then(function() {
            done();
        });
    });

    grunt.registerTask('nwjsRun', 'Runs the app with NWJS', function() {
        var nw = getNwjsInstance(true),
            done = this.async();

        nw.run().then(function() {
            grunt.log.ok('nwjsRun exitted normally');
        }).catch(function (error) {
            grunt.fail.warn(error);
        }).then(function() {
            done();
        });
    });

};