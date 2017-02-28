module.exports = function (/*grunt, options*/) {
    'use strict';
    return {
        options: {
            expand: true
        },
        srcToPrepareBuild: {
            files: [
                {
                    cwd: 'src/css',
                    src: ['**', '!components/**', '!**/.svn'],
                    dest: 'build/preparedBuild/css/',
                    expand: true
                },
                {
                    cwd: 'src',
                    src: ['index.html', 'node_modules/**', 'images/**', 'js/**', 'fonts/**'],
                    dest: 'build/preparedBuild/',
                    expand: true
                }
            ]
        }
    };
};