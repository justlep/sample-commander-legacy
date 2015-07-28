module.exports = function (grunt, options) {
    'use strict';
    return {
        options: {
            platforms: ['win'],
            buildDir: 'target/'
        },
        buildApp: {
            src: ['target/preparedBuild/**']
        }
    };
};