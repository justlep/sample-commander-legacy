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
                    dest: 'target/preparedBuild/css/',
                    expand: true
                },
                {
                    cwd: 'src/js',
                    src: ['lib/**/*.js'],
                    dest: 'target/preparedBuild/js/',
                    expand: true
                },
                {
                    cwd: 'src',
                    src: ['fonts/**'],
                    dest: 'target/preparedBuild/',
                    expand: true
                },
                {
                    cwd: 'src',
                    src: ['index.html', 'node_modules/**', 'images/**'],
                    dest: 'target/preparedBuild/',
                    expand: true
                }
            ]
        }
    };
};