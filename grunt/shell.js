module.exports = function (grunt /* ,options*/) {
    'use strict';

    var fs = require('fs'),
        nwExePath = fs.realpathSync('./node_modules/nodewebkit/nodewebkit/nw.exe');

    return {
        runDebug: {
            command: nwExePath + ' .',
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