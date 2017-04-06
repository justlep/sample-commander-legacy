module.exports = function (grunt, options) {
    'use strict';

    grunt.registerTask('default', [
        'less',
        'jshint',
        'pug'
    ]);

    grunt.registerTask('watchLessAndPug', [
        'less',
        'pug',
        'concurrent:watchLessAndPug'
    ]);

    grunt.registerTask('runDebug', [
        'default',
        'nwjsRun'
    ]);

    grunt.registerTask('buildApp', [
        'clean',
        'default',
        'copy:srcToPrepareBuild',
        // no uglification of js sources currently since grunt-contrib-uglify doesn't yet support the uglify2#harmony branch
        // also: sources are getting zipped during nwjs build anyway
        'copyPackageJson',
        'nwjsBuild',
        'clean:oldPreparedBuild'
    ]);

    grunt.registerTask('zipBuild', [
        'clean:oldZips',
        'compress:zipWin64'
    ]);

    grunt.registerTask('buildAppCompressed', [
        'buildApp',
        'compressExeFile'
        //, 'clean:oldPreparedBuild'
    ]);
};