/**
 * Dummy for a custom task.
 */
module.exports = function (grunt) {
    'use strict';

    grunt.registerTask('someCustomTask', 'Does yet nothing but log a string to the console',
        function () {
            var opts = this.options();

            grunt.log.writeln('someCustomTasks says: ' + opts.someText);
        });
};