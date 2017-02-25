module.exports = function (grunt, options) {
    'use strict';

    return {
        options: {
            pretty: true,
            data: {
                pkg: grunt.file.readJSON('package.json')
            }
        },
        html: {
            files: {
                "src/index.html": "src/index.pug"
            }
        }
    };
};