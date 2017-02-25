module.exports = function (grunt, options) {
    'use strict';
    return {
        less: {
            files: ['src/less/**/*.less'],
            tasks: ['newer:less']
        },
        pug: {
            files: ['src/**/*.pug'],
            tasks: ['pug']
        }
    };
};