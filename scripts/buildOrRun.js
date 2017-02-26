
var args = process.argv || [],
    doRun = args.includes('--run'),
    doBuild = args.includes('--build');

if (doRun == doBuild) {
    console.error('ERROR: must be called with parameter --run OR --build')
    process.exit(1);
}

var path = require('path'),
    grunt = require('grunt'),
    pkg = grunt.file.readJSON(path.resolve(__dirname, '../package.json')),
    BUILD_TARGET_DIR = path.resolve(__dirname, '../build'),
    CACHE_DIR = path.resolve(__dirname, '../cache'),
    BUILD_SOURCES = BUILD_TARGET_DIR + '/preparedBuild/**',
    RUN_SOURCES = path.join(__dirname, '../src/**'),
    NwBuilder = require('nw-builder'),
    nw = new NwBuilder({
        files: doBuild ? BUILD_SOURCES : RUN_SOURCES,
        cacheDir: CACHE_DIR,
        buildDir: BUILD_TARGET_DIR,
        platforms: pkg.config.nwjsBuildPlatforms,
        version: pkg.config.nwjsBuildVersion,
        zip: doBuild,
        flavor: doRun ? 'sdk' : 'normal',
        toolbar: doRun,
        appVersion: pkg.version
    });

nw.on('log',  console.log);

if (doBuild) {

    // Build returns a promise
    nw.build().then(function () {
        console.log('all done!');
    }).catch(function (error) {
        console.error(error);
    });

} else {
    // Run returns a promise
    nw.run().then(function() {
        console.log('nwjs exitted normally');
    }).catch(function (error) {
        console.error(error);
    });
}
