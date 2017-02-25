module.exports = function (grunt /* ,options*/) {
    'use strict';

    var path = require('path'),
        buildCommand = 'node ' + path.resolve(__dirname, '../scripts/buildOrRun');

    return {
       nwjsBuild: {
            command: buildCommand + ' --build',
            options: {
                callback: function(err, stdout, stderr, cb) {
                    grunt.log.ok(stdout);
                    cb();
                }
            }
        },
        nwjsRun: {
            command: buildCommand + ' --run',
            options: {
                callback: function(err, stdout, stderr, cb) {
                    grunt.log.ok(stdout);
                    cb();
                }
            }
        }
    };
};