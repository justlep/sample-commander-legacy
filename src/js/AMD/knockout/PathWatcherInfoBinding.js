
'use strict';

/**
 * Summarizes the watchers loaded content (# of files and/or directories)
 * @param valueAccessor (PathWatcher)
 */
define(['knockout', 'AMD/Helper', 'AMD/PathWatcher'], function(ko, Helper, PathWatcher) {

    ko.bindingHandlers.pathWatcherInfo = {
        init: null,
        update: function(element, valueAccessor /*, allBindings, viewModel, bindingContext */) {
            Helper.assert(valueAccessor() instanceof PathWatcher, 'No PathWatcher given for pathWatcherInfo binding');

            var watcher = valueAccessor(),
                dirsOnly = watcher.directoriesOnly(),
                fileNum = !dirsOnly && watcher.files().length,
                dirNum = (dirsOnly) ? watcher.directories().length : watcher.directoriesWithFiles().length,
                fileWord = (fileNum === 1) ? 'file' : 'files',
                dirWord = (dirNum === 1) ? 'directory' : 'directories';

            if (dirsOnly) {
                element.innerHTML = dirNum + ' ' + dirWord;
            } else {
                element.innerHTML = fileNum + ' ' + fileWord + ' in ' + dirNum + ' ' + dirWord;
            }
        }
    };

});