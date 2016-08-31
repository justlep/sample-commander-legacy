module.exports = function (grunt, options) {
    'use strict';
    return {
        options: {
            platforms: ['win'],
            buildDir: 'build/',
            // Issue with missing ffmpegsumo.dll -> https://github.com/nwjs/nw-builder/issues/252
            version: '0.12.3'
        },
        buildApp: {
            src: ['build/preparedBuild/**']
        }
    };
};