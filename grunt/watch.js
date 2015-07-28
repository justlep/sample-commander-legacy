module.exports = function (grunt, options) {
    'use strict';
    return {
        nonLess: {
            files: [
                'src/**/*.html',
                'src/**/*.js',
                'src/**/*.css',
                '!src/less/**',
                '!**/lib/**',
                '!**/node/**',
                '!**/node_modules/**'
            ],
            tasks: [/* nothing */]
        },
        less: {
            files: ['src/less/**/*.less'],
            tasks: ['newer:less']
        }
    };
};