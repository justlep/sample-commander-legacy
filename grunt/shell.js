module.exports = function (/*grunt, options*/) {
    'use strict';

    var fs = require('fs'),
        nwExePath = fs.realpathSync('./node_modules/nodewebkit/nodewebkit/nw.exe');

    function log(err, stdout, stderr, cb) {
        console.log(stdout);
        cb();
    }

    return {
        runDebug: {
            command: nwExePath + ' .',
            options: {
                callback: log,
                execOptions: {
                    cwd: 'src/'
                }
            }
        }
    };
};