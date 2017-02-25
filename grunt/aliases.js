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
        'shell:runDebug'
    ]);

    grunt.registerTask('buildApp', [
        'clean',
        'default',
        'copy:prepareBuild',
        'copyPackageJson',
        'uglify:jsForBuild',
        'nwjs:buildApp'
        //, 'clean:oldPreparedBuild'
    ]);

    grunt.registerTask('zipBuild', [
        'clean:oldZips',
        'compress:zipWin32',
        'compress:zipWin64'
    ]);

    grunt.registerTask('buildAppCompressed', [
        'clean',
        'default',
        'copy:prepareBuild',
        'copyPackageJson',
        'uglify:jsForBuild',
        'nwjs:buildApp',
        'compressExeFile'
        //, 'clean:oldPreparedBuild'
    ]);
};