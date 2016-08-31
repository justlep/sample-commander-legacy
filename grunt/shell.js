module.exports = function (grunt /* ,options*/) {
    'use strict';

    var path = require('path'),
        nwExecutablePath = path.join(__dirname, '../node_modules/nodewebkit/nodewebkit/nw.exe');

    return {
        runDebug: {
            command: nwExecutablePath + ' .',
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