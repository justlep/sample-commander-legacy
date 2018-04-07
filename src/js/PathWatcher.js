
'use strict';

let {ko, Helper, _, moment, $} = require('./common'),
    FileComparer = require('./FileComparer'),
    FILE_PATTERN = ['*.wav', '*.WAV'],       // TODO make this configurable
    AUDIO_FILE_PATTERN = /\.(wav|mp3|ogg)$/i,
    MAX_AUDIOFILE_SIZE_FOR_SPECTROGRAMS_IN_BYTES = 600 * 1024 * 1024,
    readdirp = require('readdirp'),
    nodeCrypto = require('crypto'),
    config = require('./Config').getInstance(),
    nodeExec = require('child_process').exec,
    nodeFs = require('fs'),
    nodePath = require('path'),
    createFileItem = function(fileInfo) {
        let size = fileInfo.stat.size || 0,
            idHash = nodeCrypto.createHash('sha1'),
            resolvedPath = nodePath.resolve(fileInfo.fullPath),
            ctime = fileInfo.stat.ctime.getTime(),
            mtime = fileInfo.stat.mtime.getTime();

        idHash.update(resolvedPath + '_-_-_' + size + '_-_-_' + ctime + mtime + '_-_-_');

        return {
            id: idHash.digest('hex'),
            isAudioFile: !!AUDIO_FILE_PATTERN.test(resolvedPath),
            filename: fileInfo.name,
            path: resolvedPath,
            parentDir: fileInfo.parentDir,
            filesize: size,
            formattedCDate: moment(mtime).format('DD.MM.YYYY - hh:mm:ss (ddd)'),
            formattedFilesize: (size/(1024*1024)).toFixed(1),
            spectrogram: ko.observable()
        };
    },
    createDirectoryItem = function(name, path) {
        let item = {
                name: name,
                path: nodePath.resolve(path),
                depth: 0,
                elemId: Helper.generateId()
            };

        return item;
    },

    calculateDirItemDepths = function(dirItems, rootPath) {
        _.each(dirItems, function(dirItem) {
            if (dirItem.path.toLowerCase().indexOf(rootPath.toLowerCase()) !== 0) {
                return;
            }
            let matchedDelimiters = dirItem.path.substring(rootPath.length).match(/[\/\\]/g);
            dirItem.depth = matchedDelimiters && matchedDelimiters.length;
        });

        // console.log(dirItems);
    },

    /**
     * Returns a sorted list of directories from the given list of file items.
     * @param fileItems (Array) of file items
     * @return Array of String
     */
    getDirectoriesFromFileItems = function(fileItems) {
        let dirs = {};
        _.each(fileItems, function(fileItem) {
            dirs[fileItem.parentDir] = null;
        });
        return _.keys(dirs);
    },

    compareFileOrDirItems = function(item1, item2) {
        return item1.path.replace(/[\\\/]/g,'\n').localeCompare(item2.path.replace(/[\\\/]/g,'\n'))
    };

/**
 * @param opts (Object) map of options (all required)
 *          - configPathObservable (Observable) observable within the config (to be persisted)
 *          - maxDirsObservable (Observable) observable within the config telling the max # of dirs to load
 *          - directoriesOnly (Boolean) [optiopnal] if given, only directories will be loaded, no files
 *          - listId (String) the id of the UL element
 * @constructor
 */
function PathWatcher(opts) {
    Helper.assertFunction(opts.configPathObservable, 'Missing configPathObservable');
    Helper.assert(!opts.directoriesOnly || _.isFunction(opts.maxDirsObservable), 'Missing maxDirs');
    Helper.assertString(opts.listId, 'Missing listId');

    let self = this,
        dirsOnly = ko.observable(!!opts.directoriesOnly),
        abortRequested = false,
        lastSelectedFileId = null,
        jList = $('#' + opts.listId);

    this.directoriesOnly = ko.computed({
        read: dirsOnly,
        write: self.reload
    });

    this.aborted = ko.observable(false);
    this.maxDirsExceeded = ko.observable(false);
    this.isLoading = ko.observable(false);
    this.directoriesWithFiles = ko.observableArray();
    this.directories = ko.observableArray();
    this.files = ko.observableArray();
    this.invalidPath = ko.observable(false);

    this.selectedFileIds = ko.observableArray().extend({deferred: true});
    this.files.subscribe(function() {
        self.selectedFileIds.removeAll();
    });

    // update list of directories containing matching files whenever the files list changes
    this.files.subscribe(function() {
        self.directoriesWithFiles(getDirectoriesFromFileItems(self.files()));
    });

    this.unselectAll = function() {
        if (self.selectedFileIds().length) {
            self.selectedFileIds.removeAll();
        }
        lastSelectedFileId = null;
    };

    this.selectAll = function() {
        let allIds = _.map(self.files(), function(fileItem) {
            return fileItem.id;
        });
        self.selectedFileIds(allIds);
        lastSelectedFileId = null;
    };

    this.sortDirectories = function() {
        self.directories.sort(compareFileOrDirItems);
    };

    function sortFiles(files) {
        files.sort(compareFileOrDirItems);
    }

    this.getFileItemById = function(itemId) {
        return _.findWhere(self.files(), {id: itemId});
    };

    this.getFileItemsByIds = function(ids) {
        return _.filter(self.files(), function(fileItem) {
            return _.contains(ids, fileItem.id);
        });
    };

    this.getSelectedFileItems = function() {
        return self.getFileItemsByIds(self.selectedFileIds());
    };

    /**
     * @return only those selected file items that are currently visible
     */
    this.getVisibleSelectedFileItems = function() {
        let newFileItems = [],
            visibleLIs = jList.find('li:visible');

        _.each(self.getSelectedFileItems(), function(fileItem) {
            let fileIsVisible = !!visibleLIs.filter('li[data-id="'+ fileItem.id +'"]:first').length;

            if (fileIsVisible) {
                newFileItems.push(fileItem);
            }
        });

        return newFileItems;
    };

    this.shiftSelectFileItem = function(fileItem) {
        if (!lastSelectedFileId) {
            return;
        }
        let indexLast = -1,
            indexClicked = -1,
            startIndex,
            endIndex,
            filesArray = self.files();

        _.each(filesArray, function(file, i) {
            if (file.id === fileItem.id) {
                indexClicked = i;
            }
            // NOT else!!
            if (file.id === lastSelectedFileId) {
                indexLast = i;
            }
        });

        startIndex = Math.min(indexLast, indexClicked);
        endIndex = Math.max(indexLast, indexClicked);

        for (let i=startIndex; i <= endIndex; i++) {
            let idToAdd = filesArray[i].id;
            if (self.selectedFileIds().indexOf(idToAdd) < 0) {
                self.selectedFileIds.push(idToAdd);
            }
        }

        lastSelectedFileId = fileItem.id;
    };

    /**
     * Loads all files matching a given pattern.
     * @param filePattern (String|Array)
     * @param callback (function) called when loaded, e.g. function(fileItems){..}
     */
    this.loadFileItemsByPattern = function(filePattern, callback) {
        Helper.assertString(filePattern, 'invalid filePattern for PathWatcher.getFileItemsByPattern');
        Helper.assertFunction(callback, 'invalid callback for PathWatcher.getFileItemsByPattern');

        let matchedFiles = [],
            stream = readdirp({
                root: self.path(),
                fileFilter: (_.isArray(filePattern)) ? filePattern : [filePattern]
            });

        stream.on('data', function(fileInfo) {
            matchedFiles.push(createFileItem(fileInfo));
        }).on('end', function (err /*, res */) {
            sortFiles(matchedFiles);
            callback(matchedFiles);
        });
    };

    this.toggleSelectFileItem = function(fileItem, skipRememberLastSelected) {
        let id = fileItem.id;
        if (self.selectedFileIds().indexOf(id) >= 0) {
            self.selectedFileIds.remove(id);
        } else {
            self.selectedFileIds.push(id);
            if (!skipRememberLastSelected) {
                lastSelectedFileId = fileItem.id;
            }
        }
    };

    this.selectFileItem = function(fileItem) {
        let id = fileItem.id;
        self.unselectAll();
        self.selectedFileIds([id]);
        lastSelectedFileId = id;
    };

    this.addSubdirectoryItem = function(name, parentDirItem) {
        Helper.assertObject(parentDirItem, 'missing parentDirItem in PathWatcher.addSubdirectoryItem()');
        Helper.assertString(name, 'missing name in PathWatcher.addSubdirectoryItem()');
        let subdirItem = createDirectoryItem(name, nodePath.resolve(parentDirItem.path, name)),
            parentDirIndex = self.directories().indexOf(parentDirItem);
        subdirItem.depth = parentDirItem.depth + 1;
        if (parentDirIndex >= 0) {
            self.directories.splice(parentDirIndex+1, 0, subdirItem);
            self.sortDirectories();
        }
    };

    this.isFileItemSelected = function(fileItem) {
        return self.selectedFileIds().indexOf(fileItem.id) >= 0;
    };

    this.fixDirItemPathsAfterDirectoryRenamed = function(oldPath, newPath) {
        _.each(self.directories(), function(dirItem) {
            if (dirItem.path.indexOf(oldPath) === 0) {
                console.log('Fixing path for %s', dirItem.path);
                // TODO fix this as it may corrupt paths starting with the identical {oldPath}
                dirItem.path = newPath + oldPath.substring(oldPath.length);
            }
        });
    };

    /**
     * Scans the given new path for files matching the pattern + updates files() with the results.
     * @param newPath (String)
     * @param [callback] (Function) optional callback when loading is done
     */
    function loadFiles(newPath, callback) {
        Helper.assertString(newPath, 'invalid newPath for PathWatcher.loadFiles()');
        Helper.assertFunctionOrEmpty(callback, 'invalid callback for PathWatcher.loadFiles()');

        self.isLoading(true);
        abortRequested = false;

        let newFiles = [],
            aborted = false,
            stream = readdirp({
                root: newPath,
                fileFilter: FILE_PATTERN
            });

        stream.on('data', function(fileInfo) {
            newFiles.push(createFileItem(fileInfo));
            if (abortRequested) {
                aborted = true;
                console.log('stream destroy');
                stream.destroy();
            }

        }).on('end', function (err /*, res */) {
            self.isLoading(false);
            sortFiles(newFiles);
            self.files(newFiles);
            self.aborted(aborted);

            if (!err) {
                opts.configPathObservable(newPath);
            }
            if (callback) {
                callback();
            }
        });
    }

    /**
     * Scans the given new path for directories + updates directories() with the results.
     * @param newPath (String) the (pre-resolved) path to scan for subdirectories
     * @param [callback] (Function) optional callback when loading is done
     */
    function loadDirectories(newPath, callback) {
        Helper.assertString(newPath, 'invalid newPath for PathWatcher.loadFiles()');
        Helper.assertFunctionOrEmpty(callback, 'invalid callback for PathWatcher.loadFiles()');

        self.isLoading(true);
        self.files.removeAll();
        abortRequested = false;

        let newDirectories = [],
            aborted = false,
            maxDirsLeft = Math.max(opts.maxDirsObservable(), 0),
            resolvedPath = nodePath.resolve(newPath),
            stream = readdirp({
                root: newPath,
                entryType: 'directories'
            }),
            rootDirItem = createDirectoryItem(resolvedPath, resolvedPath, null, newDirectories);

        newDirectories.push(rootDirItem);

        stream.on('data', function(dirInfo) {
            if (--maxDirsLeft) {
                newDirectories.push(createDirectoryItem(dirInfo.name, dirInfo.fullPath,
                                                        dirInfo.parentDir, newDirectories));
            }
            if (abortRequested || !maxDirsLeft) {
                aborted = true;
                stream.destroy();
            }

        }).on('end', function (err/*, res */) {
            self.isLoading(false);
            calculateDirItemDepths(newDirectories, resolvedPath);
            self.directories(newDirectories);
            self.aborted(aborted);
            self.maxDirsExceeded(self.directories().length && !maxDirsLeft);
            self.sortDirectories();

            if (!err) {
                opts.configPathObservable(newPath);
            }
            if (callback) {
                callback();
            }
        });
    }

    this.path = ko.pureComputed({
        read: opts.configPathObservable,
        write: function(newPath) {
            if (!newPath) {
                return;
            }

            let resolvedPath = nodePath.resolve(newPath || '.');

            Helper.notify(Helper.EVENTS.PATH_CHANGED);

            // TODO fs.exists is deprecated
            nodeFs.exists(resolvedPath, function(exists) {
                if (!exists) {
                    console.warn('Path "%s" does not exist!', resolvedPath);
                    self.invalidPath(true);
                    return;
                }
                self.invalidPath(false);
                if (self.directoriesOnly()) {
                    loadDirectories(resolvedPath);
                } else {
                    loadFiles(resolvedPath);
                }
            });
        }
    });

    this.gotoParent = () => {
        let path = this.path(),
            parentPath = path && nodePath.resolve(path, '..');

        if (parentPath && parentPath !== path) {
            this.path(parentPath);
        }
    };

    /**
     * Reloads the current path of this watcher.
     */
    this.reload = function() {
        FileComparer.flushCacheForFileItems(self.files());
        self.path(self.path());
    };

    this.abort = function() {
        abortRequested = true;
    };

    this.onPathChange = function(ctx, e) {
        let newPath = e.target.value;
        if (newPath) {
            self.path(newPath);
        }
    };


    /**
     * Checks in this path for files that exist in the sourceItems.
     *
     * @param sourceItems (Array) of file items
     * @param callback (function) called when done
     */
    this.checkDuplicates = function(sourceItems, callback) {
        if (self.directoriesOnly() && !self.files().length) {
            loadFiles(self.path(), function() {
                FileComparer.checkDuplicateFileItems(sourceItems, self.files(), callback);
            });
        } else {
            FileComparer.checkDuplicateFileItems(sourceItems, self.files(), callback);
        }
    };


    this.hideSpectrograms = () => this.files().forEach(f => f.spectrogram(null));

    let _spectrogramProcessQueue = ko.observableArray(),
        _isStopSpectroRequested = false,
        _processNextSpectrogram = () => {
            let {f, audioFilename, parentDirPath, spectroImgFilename, spectroImgFilePath, ffmpegExe} = _spectrogramProcessQueue()[0],
                cmd = ffmpegExe + ` -i "${audioFilename}" -lavfi showspectrumpic=s=hd480:color=fire:legend=0,format=yuv444p "${spectroImgFilename}"`; // jshint ignore:line

            // console.log('cmd: ' + cmd);

            nodeExec(cmd, {
                cwd: parentDirPath,
                timeout: undefined // makes sense or not?
            }, (err, stdout, stderr) => {
                if (err) {
                    console.error('Failed to generate %s. Error is:\n%s', spectroImgFilePath, stderr);
                } else {
                    f.spectrogram(spectroImgFilePath);
                }

                _spectrogramProcessQueue.shift();
                if (_isStopSpectroRequested) {
                    _spectrogramProcessQueue.removeAll();
                } else if (_spectrogramProcessQueue().length) {
                    setTimeout(_processNextSpectrogram, 50);
                }
            });
        };

    this.remainingSpectrogramsToProcess = ko.computed(() => _spectrogramProcessQueue().length);
    this.currentlyProcessedAudioFilename = ko.pureComputed(() => {
        let o = _spectrogramProcessQueue()[0];
        return o && o.audioFilename;
    });
    this.cancelSpectrogramProcessing = () => {
        _isStopSpectroRequested = true;
    };

    let _filterAudioFilesEligibleForSpectrogramCreation =
        (f) => f.isAudioFile && (f.filesize <= MAX_AUDIOFILE_SIZE_FOR_SPECTROGRAMS_IN_BYTES) && !f.spectrogram();

    this.showSpectrograms = () => {
        _isStopSpectroRequested = false;
        let ffmpegExe = config.ffmpegExecutablePath();

        if (!ffmpegExe) {
            alert('Need to set path to ffmpeg.exe first!');
            return;
        }

        if (this.remainingSpectrogramsToProcess()) {
            alert('Please wait until all pending spectrogram jobs have finished');
            return;
        }

        this.files().filter(_filterAudioFilesEligibleForSpectrogramCreation).forEach(f => {
            let audioFilename = f.filename,
                audioFilePath = f.path,
                parentDirPath = nodePath.resolve(audioFilePath, '..'),
                spectroImgFilename = audioFilePath + '-spectro.png',
                spectroImgFilePath = nodePath.resolve(parentDirPath, spectroImgFilename),
                stats,
                exists = false;

            try {
                stats = nodeFs.statSync(spectroImgFilePath);
                exists = stats.isFile();
            } catch (err) {
                // nothing
            }

            if (exists) {
                f.spectrogram(spectroImgFilename);
            } else {
                _spectrogramProcessQueue.push({f, audioFilename, parentDirPath, spectroImgFilename, spectroImgFilePath, ffmpegExe});
            }
        });

        if (this.remainingSpectrogramsToProcess()) {
            _processNextSpectrogram();
        }
    };

}


module.exports = PathWatcher;