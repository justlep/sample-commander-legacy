module.exports = function (grunt, options) {
    'use strict';
    return {
        options: {
            platforms: ['win'],
            buildDir: 'target/',
            // Issue with missing ffmpegsumo.dll -> https://github.com/nwjs/nw-builder/issues/252
            version: 'v0.12.0'
        },
        buildApp: {
            src: ['target/preparedBuild/**']
        }
    };
};