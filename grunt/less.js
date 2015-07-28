module.exports = function (grunt, cfg) {
    'use strict';

    var path = require('path'),
        ce = require('cloneextend'),

        GENERATE_COMPRESSED_CSS = false,
        GENERATE_RAW_CSS = true,

        LESS_PATH = 'src/less/',
        CSS_PATH = 'src/css/',
        SOURCE_MAP_PATH = CSS_PATH,
        SOURCE_MAP_URL = '/css/',

        OPTIONS_BASE = {
            relativeUrls: true,
            strictMath: false, // some LESS files (e.g. Gridlock) won't compile correctly with strictMath enabled
            optimization: 2
        },

        files = grunt.file.expand({
                    expand: true,
                    cwd: LESS_PATH,
                    dest: CSS_PATH,
                    extDot: 'last',
                    ext: '.min.css'
                }, [
                    '**/*.less',
                    '!includes/**/*.less',
                    '!imports/**/*.less'
                ]),

        lessConfig = {};

    grunt.log.debug('files: ' + JSON.stringify(files));

    files.forEach(function(lessFilePath, index){
        var taskBaseName    = lessFilePath.replace('.less','').replace('/','_'),
            taskNameCompressed = taskBaseName + '__compressed',
            taskNameRaw = taskBaseName + '__raw',
            filename        = lessFilePath.replace(/(.*?)(\.less)$/,'$1').replace('.less',''),
            cssFileRaw      = CSS_PATH + filename+ '.css',
            cssFileMin      = CSS_PATH + filename+ '.min.css',
            sourceMapFilename = filename + '.min.css.map',
            fileMapCompressed = {},
            fileMapRaw        = {};

        fileMapCompressed[cssFileMin] = LESS_PATH + lessFilePath;
        fileMapRaw[cssFileRaw]        = LESS_PATH + lessFilePath;

        if (GENERATE_COMPRESSED_CSS) {
            lessConfig[taskNameCompressed] = {
                options: ce.cloneextend(OPTIONS_BASE, {
                    compress: true,
                    yuicompress: true,
                    dumpLineNumbers: 'all',
                    sourceMap: true,
                    sourceMapFilename: SOURCE_MAP_PATH + sourceMapFilename,
                    sourceMapURL: SOURCE_MAP_URL + sourceMapFilename
                }),
                files: fileMapCompressed
            };
        }

        if (GENERATE_RAW_CSS) {
            lessConfig[taskNameRaw] = {
                options: OPTIONS_BASE,
                files: fileMapRaw
            };
        }
    });

    grunt.log.debug('config: ' + JSON.stringify(lessConfig, null, 2));

    return lessConfig;
};