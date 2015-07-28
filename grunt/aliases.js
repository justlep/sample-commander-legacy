module.exports = function (grunt, options) {
    'use strict';

    grunt.registerTask('prepareCss', [
        'sprite',
        'less'
    ]);

    grunt.registerTask('default', [
        'prepareCss',
        'jshint'
    ]);

    grunt.registerTask('watchLess', [
        'prepareCss',
        'watch:less'
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