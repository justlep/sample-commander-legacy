module.exports = function (/*grunt, options*/) {
    'use strict';

    function log(err, stdout, stderr, cb) {
        console.log(stdout);
        cb();
    }

    return {
        runDebug: {
            command: 'nw .',
            options: {
                callback: log,
                execOptions: {
                    cwd: 'src/'
                }
            }
        }
    };
};