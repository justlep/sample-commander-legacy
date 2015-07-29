module.exports = function (/*grunt, options*/) {

    'use strict';

    return {
        options: {
            sourceMap: true,
            sourceMapName: function(jsPath) {
                return jsPath.replace(/\.js$/, '-sourcemap.json');
            },
            compress: {
                drop_console: true
            },
            environment: 'production'
        },
        jsForBuild: {
            files: [
                {
                    expand: true,
                    cwd: 'src/js',
                    src: ['**/*.js', '!lib/**/*.js'],
                    dest: 'target/preparedBuild/js',
                    extDot: 'last',
                    ext: '.js'
                }
            ]
        }
    };
};