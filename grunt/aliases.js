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
        'copy:prepareBuild',
        'copyPackageJson',
        'uglify:jsForBuild',
        'nwjsBuild'
        //, 'clean:oldPreparedBuild'
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