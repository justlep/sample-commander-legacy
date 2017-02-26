module.exports = function (/* grunt, cfg */) {
    'use strict';

    return {
        options: {
            compress: true,
            dumpLineNumbers: 'all',
            sourceMap: true,
            relativeUrls: true
        },
        all: {
            files: {
                'src/css/styles.css': 'src/less/styles.less',
                'src/css/uikit.css': 'src/less/uikit.less'
            }
        }
    };

};