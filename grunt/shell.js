module.exports = function (grunt /* ,options*/) {
    'use strict';

    var path = require('path'),
        nwExecutablePath = path.join(__dirname, '../node_modules/nodewebkit/bin/nodewebkit');

    return {
        runDebug: {
            command: 'node ' + nwExecutablePath + ' .',
            options: {
                callback: function(err, stdout, stderr, cb) {
                    grunt.log.ok(stdout);
                    cb();
                },
                execOptions: {
                    cwd: 'src/'
                }
            }
        }
    };
};