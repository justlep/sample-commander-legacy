module.exports = function (grunt, opts) {
    'use strict';

    var zipComment = [
            '<%= package.name %>',
            'Version <%= package.version %>',
            '<%= package.repository.url %>'
        ].join('\n\n'),
        path = require('path');

    return {
        options: {
            mode: 'zip',
            level: 1,
            pretty: true,
            comment: zipComment
        },
        zipWin32: {
            options: {
                archive: 'build/Synchronizer-v<%= pkg.version %>-Win32.zip'
            },
            files: [
                {
                    expand: true,
                    cwd: 'build/',
                    src: ['Synchronizer/win32/**/*.*']
                }
            ]
        },
        zipWin64: {
            options: {
                archive: 'build/Synchronizer-v<%= pkg.version %>-Win64.zip'
            },
            files: [
                {
                    expand: true,
                    cwd: 'build/',
                    src: ['Synchronizer/win64/**/*.*']
                }
            ]
        }
    };
};