module.exports = function (/*grunt, options*/) {
    'use strict';
    return {
        options: {
            expand: true
        },
        prepareBuild: {
            files: [
                {
                    cwd: 'src/css',
                    src: ['**', '!components/**', '!**/.svn'],
                    dest: 'build/preparedBuild/css/',
                    expand: true
                },
                {
                    cwd: 'src/js',
                    src: ['lib/**/*.js'],
                    dest: 'build/preparedBuild/js/',
                    expand: true
                },
                {
                    cwd: 'src',
                    src: ['fonts/**'],
                    dest: 'build/preparedBuild/',
                    expand: true
                },
                {
                    cwd: 'src',
                    src: ['index.html', 'node_modules/**', 'images/**'],
                    dest: 'build/preparedBuild/',
                    expand: true
                }
            ]
        }
    };
};