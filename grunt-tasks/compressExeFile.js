/*jslint maxlen: 140 */
module.exports = function (grunt) {
    'use strict';

    var nodePath = require('path'),
        COMPRESSION_LEVEL = 1, // level 1 = fast, 9 = slow,best
        PACKER_EXE = nodePath.resolve('utils/upx391w/upx.exe'),
        EXE_FILE_32 = nodePath.resolve('build/Synchronizer/win32/Synchronizer.exe'),
        EXE_FILE_64 = nodePath.resolve('build/Synchronizer/win64/Synchronizer.exe');

    grunt.registerTask('compressExeFile', 'Compresses the built standalone .exe file.', function () {

        var doneFn = this.async();

        // delay needed as the .exe-file handle might still be blocked for some microseconds..
        setTimeout(function() {

            var child = grunt.util.spawn({
                cmd: PACKER_EXE,
                grunt: false,
                args: ['-'+COMPRESSION_LEVEL, EXE_FILE_32, EXE_FILE_64]
            }, doneFn);

            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);

        }, 500);

        grunt.log.writeln('\nCompressed files: \n---> ' + EXE_FILE_32 + '\n---> ' + EXE_FILE_64);
    });
};