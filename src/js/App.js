
'use strict';

let {ko, _, Helper, $, gui} = require('./common'),
    Config = require('./Config'),
    PathWatcher = require('./PathWatcher'),
    Spectrograms = require('./Spectrograms'),
    DialogManager = require('./DialogManager'),
    ConfirmDialog = require('./dialogs/ConfirmDialog'),
    InfoDialog = require('./dialogs/InfoDialog'),
    CopyMoveFilesDialog = require('./dialogs/CopyMoveFilesDialog'),
    DirContextMenu = require('./DirContextMenu'),
    FileContextMenu = require('./FileContextMenu'),
    SourceContextMenu = require('./SourceContextMenu'),
    TargetContextMenu = require('./TargetContextMenu'),
    FilteredFileBinding = require('./knockout/FilteredFileBinding'),
    PathWatcherInfoBinding = require('./knockout/PathWatcherInfoBinding'),
    AbortLoadingOnClickBinding = require('./knockout/AbortLoadingOnClickBinding'),
    instance = null,
    KEYS = {
        ARROW_LEFT: 37,
        ARROW_RIGHT: 39
    },
    DUPLICATE_FILTER_MODE = {
        NONE: 'none',
        WITH_DUPLICATES: 'with',
        WITHOUT_DUPLICATES: 'without'
    },
    SPECTROGRAM_CLICKZONE_CLASS = 'spectro__clickzone';

/**
 * The App.
 * @constructor
 */
function App() {
    let self = this,
        audioElement = $('audio:first')[0],
        audioDuration = ko.observable(0),
        audioPositionInSeconds = ko.observable(0),
        HANDLERS = {
            FILE_DRAG_START: (e) => {
                let dt = e.originalEvent.dataTransfer,
                    fileItem = ko.contextFor(e.target).$data;

                // TODO fixme in some situations after some selecting/deselection, this event wont fire anymore.

                dt.effectAllowed = 'copy';
                dt.dropEffect = 'copy';

                console.log('file: %s, selected: %o', fileItem.filename, self.source.isFileItemSelected(fileItem));
                if (!self.source.isFileItemSelected(fileItem)) {
                    self.source.toggleSelectFileItem(fileItem, true);
                }

                // basics: http://tutorials.html5rocks.com/de/tutorials/dnd/basics/
                // dt.dropEffect = 'copy';
                // dt.setData('fileItemJSON', JSON.stringify(fileItem));

                // make file droppable to the desktop (see http://thecssninja.com/talks/dnd_and_friends/)
                // (!) Disabled since with this enabled, dragging a file will generate a COPY of the file
                // in the windows temp folder!
                // dt.setData('DownloadURL', Helper.MIME_TYPES.WAV + ':' + fileItem.filename + ':' + fileItem.path);
            },
            DIR_DRAG_OVER: (e) => e.preventDefault(),
            DIR_DRAG_ENTER: (e) => {
                e.preventDefault();
                $(this).addClass('drag-over');
            },
            DIR_DRAG_LEAVE: (e) => {
                e.preventDefault();
                $(this).removeClass('drag-over');
            },
            DIR_DROP: (e) => {
                e.preventDefault();
                $(this).removeClass('drag-over');

                let dirItem = ko.contextFor(e.target).$data;

                CopyMoveFilesDialog.getInstance({
                    source: self.source,
                    targetDirItem: dirItem
                }).show();
            },
            DIR_CONTEXTMENU: (e) => {
                let dirItem = ko.contextFor(e.target).$data;
                DirContextMenu.getInstance(self.target, dirItem).show(e);
            },
            DIR_DOUBLECLICK: (e) => {
                let dirItem = ko.contextFor(e.target).$data;
                self.target.path(dirItem.path);
            },
            SELECTED_SOURCE_FILES_CHANGE: () => {
                let selectedIds = self.source.selectedFileIds();
                $('#sourceList li').each(function() {
                    let id = this.getAttribute('data-id') || '',
                        newSelected = (selectedIds.indexOf(id) >= 0),
                        oldSelected = (this.className.indexOf('selected') >= 0);

                    if (newSelected !== oldSelected) {
                        this.className = (newSelected) ? (this.className + ' selected ') :
                            this.className.replace(/selected/, '').replace('  ',' ');
                    }
                });
            },
            KEY_PRESSED: (e) => {
                if (e.charCode) {
                    return;
                }
                if (self.dialogManager.isDialogOpen()) {
                    return;
                }
                if (e.keyCode === KEYS.ARROW_LEFT) {
                    self.playPrevious();
                    return false;
                } else if (e.keyCode === KEYS.ARROW_RIGHT) {
                    self.playNext();
                    return false;
                }
            },

            /**
             * Bound as click handler on anything that is or contains a file item as context.
             * @param ctx
             * @param e
             * @param filePlaying
             */
            SOURCE_FILE_CLICK: (ctx, e /* , filePlaying */) => {
                let context = ko.contextFor(e.target),
                    clickedFileItem = context && context.$data,
                    skipFilePlaying = false;

                if (e.shiftKey) {
                    self.source.shiftSelectFileItem(clickedFileItem);
                } else if (e.ctrlKey) {
                    self.source.toggleSelectFileItem(clickedFileItem);
                    skipFilePlaying = !self.source.isFileItemSelected(clickedFileItem);
                } else if (clickedFileItem.isAudioFile && this.isFilePlaying(clickedFileItem) && clickedFileItem.spectrogram()) {
                    let offsetX = e.offsetX || 0,
                        target = (e.target.className === SPECTROGRAM_CLICKZONE_CLASS) && e.target,
                        percentage = target ? (100 * offsetX / $(target).width()) : 0;

                    this.audioPositionInPercent(percentage);
                    return;
                } else {
                    self.source.selectFileItem(clickedFileItem);
                }

                if (clickedFileItem.isAudioFile && !skipFilePlaying) {
                    self.playFileItem(clickedFileItem);
                }
            },

            SOURCE_FILE_RIGHTCLICK: (ctx, e /*, filePlaying */) => {
                let context = ko.contextFor(e.target),
                    clickedFileItem = context && context.$data;
                e.preventDefault();
                e.stopPropagation();

                if (e.target.className === SPECTROGRAM_CLICKZONE_CLASS) {
                    audioElement.pause();
                    return;
                }

                FileContextMenu.getInstance({
                    sourceWatcher: self.source,
                    targetWatcher: self.target,
                    fileItem: clickedFileItem
                }).show(e);
            },
            SOURCE_RIGHTCLICK: (ctx, e) => SourceContextMenu.getInstance(self.source).show(e),
            TARGET_RIGHTCLICK: (ctx, e) => TargetContextMenu.getInstance(self.target).show(e),
            SOURCE_LIST_CLICK: () => self.source.selectedFileIds.removeAll()
        };

    this.DUPLICATE_FILTER_OPTS = _.values(DUPLICATE_FILTER_MODE);

    this.playFileItem = (fileItemOrId) => {
        let fileItem = _.isObject(fileItemOrId) ? fileItemOrId : null;
        if (!fileItem) {
            fileItem = self.source.files().find(item => item.id === fileItemOrId);
        }
        if (fileItem) {
            audioDuration(0);
            self.filePlaying(_.clone(fileItem));
        }
    };

    this.dialogManager = DialogManager.getInstance();

    this.config = Config.getInstance();
    this.filter = ko.observable('');
    this.filePlaying = ko.observable();

    this.hiddenFileIdsByFilter = ko.observableArray();
    this.filter.subscribe(function() {
        let newHiddenIds = [],
            filter = self.filter().toLowerCase();
        _.each(self.source.files(), function(fileItem) {
            let filename = fileItem.filename.toLowerCase(),
                matches = !filter || (filename.indexOf(filter) >= 0);
            if (!matches) {
                newHiddenIds.push(fileItem.id);
            }
        });
        self.hiddenFileIdsByFilter(newHiddenIds);
    });

    this.hiddenFileIdsByDuplicateFilter = ko.observableArray();
    this.duplicateFilter = ko.observable(DUPLICATE_FILTER_MODE.NONE);
    this.duplicatesLoading = ko.observable(false);
    this.duplicatesLoaded = ko.observable(false);
    this.duplicateIds = ko.observableArray();

    this.duplicateFilter.subscribe(function(newMode) {
        if (newMode !== DUPLICATE_FILTER_MODE.NONE && !self.duplicatesLoaded() && !self.duplicatesLoading()) {
            findDuplicates();
        }
        updateHiddenFileIdsByDuplicateFilter();
    });

    this.resetDuplicateFilter = function() {
        self.duplicateFilter(DUPLICATE_FILTER_MODE.NONE);
        self.duplicatesLoading(false);
        self.duplicatesLoaded(false);
        self.duplicateIds.removeAll();
    };

    function updateHiddenFileIdsByDuplicateFilter() {
        let newHiddenIds = [],
            showDuplicates = (self.duplicateFilter() === DUPLICATE_FILTER_MODE.WITH_DUPLICATES),
            hideDuplicates = (self.duplicateFilter() === DUPLICATE_FILTER_MODE.WITHOUT_DUPLICATES);

        if (hideDuplicates || showDuplicates) {
            _.each(self.source.files(), function(fileItem) {
                let hasDuplicates = (fileItem.duplicateIds && fileItem.duplicateIds.length);
                if ((showDuplicates && !hasDuplicates) || (hasDuplicates && hideDuplicates)) {
                    newHiddenIds.push(fileItem.id);
                }
            });
        }
        self.hiddenFileIdsByDuplicateFilter(newHiddenIds);
    }

    self.duplicateIds.subscribe(updateHiddenFileIdsByDuplicateFilter);


    this.source = new PathWatcher({
        configPathObservable: this.config.sourcePath,
        maxDirsObservable: this.config.maxDirs,
        listId: 'sourceList'
    });
    this.target = new PathWatcher({
        configPathObservable: this.config.targetPath,
        maxDirsObservable: this.config.maxDirs,
        directoriesOnly: true,
        listId: 'targetList'
    });

    this.spectrograms = new Spectrograms(this.source.files);

    this.resetFilter = function() {
        self.filter('');
    };

    this.selectSourcePath = function() {
        $('#sourcePath').trigger('click');
    };

    this.selectTargetPath = function() {
        $('#targetPath').trigger('click');
    };

    this.reloadAll = function() {
        self.filePlaying(null);
        self.source.reload();
        self.target.reload();
    };

    function initOnce() {
        gui.Window.get().on('new-win-policy', (frame, url, policy) => {
            alert(119);
            policy.forceNewWindow();
            return false;
        });

        self.reloadAll();

        Helper.assert(_.isElement(audioElement), 'Missing the audioElement');

        $(document).on('keyup', HANDLERS.KEY_PRESSED);
        $(document.body).on('dragstart', '.file', HANDLERS.FILE_DRAG_START)
                        .on('dragover', '.dir', HANDLERS.DIR_DRAG_OVER)
                        .on('dragenter', '.dir', HANDLERS.DIR_DRAG_ENTER)
                        .on('dragleave', '.dir', HANDLERS.DIR_DRAG_LEAVE)
                        .on('drop', '.dir', HANDLERS.DIR_DROP);

        $('#directoryList').on('contextmenu', '.dir', HANDLERS.DIR_CONTEXTMENU)
                           .on('dblclick', '.dir', HANDLERS.DIR_DOUBLECLICK);
        self.source.selectedFileIds.subscribe(HANDLERS.SELECTED_SOURCE_FILES_CHANGE);
        Helper.listen(Helper.EVENTS.PLAY_FILE, self.playFileItem);
        Helper.listen(Helper.EVENTS.CHANGE_SOURCE_PATH, function(newPath) {
            Helper.assertString(newPath, 'Invalid newPath for SET_SOURCE_PATH handler');
            self.source.path(newPath);
        });
        Helper.listen(Helper.EVENTS.CHANGE_TARGET_PATH, function(newPath) {
            Helper.assertString(newPath, 'Invalid newPath for SET_TARGET_PATH handler');
            self.target.path(newPath);
        });
        Helper.listen(Helper.EVENTS.SWAP_PATHS, self.swapPaths);
        Helper.listen(Helper.EVENTS.PATH_CHANGED, self.resetDuplicateFilter);
        Helper.listen(Helper.EVENTS.MODAL_SHOW, function() {
            self.filePlaying(null);
        });

        console.log('init done');
    }

    this.onSourceFileClicked = HANDLERS.SOURCE_FILE_CLICK;
    this.onSourceRightclick = HANDLERS.SOURCE_RIGHTCLICK;
    this.onTargetRightclick = HANDLERS.TARGET_RIGHTCLICK;

    this.onSourceFileRightClicked = HANDLERS.SOURCE_FILE_RIGHTCLICK;

    this.audioPositionInPercent = ko.computed({
        read: ko.pureComputed(() => {
            let duration = audioDuration();
            return duration ? Math.floor(100 * audioPositionInSeconds() / duration) : 0;
        }),
        write: (percent) => {
            let duration = audioDuration();
            audioElement.currentTime = Math.min(duration * percent / 100, duration);
            if (!audioElement.ended) {
                audioElement.play();
            }
        }
    });

    this.isFilePlaying = (file) => {
        let fp = file && this.filePlaying();
        return fp && fp.id === file.id;
    };

    this.getBgImageStyleForPath = (path) => {
        if (!path) {
            return '';
        }
        let style = `background-image: url('file:///${path.replace(/[\\]/g, '/').replace(/'/g,'\\\'')}')`;
        // console.warn('x: %o, path: %s, url=%s', x, path, url);
        return style;
    };

    this.config.floatingList.subscribe(() => {
        if (this.filePlaying() && !audioElement.paused) {
            setTimeout(this.scrollToPlayedFile, 100);
        }
    });

    /**
     * Scrolls to the file that is currently being played.
     * @param ctx
     * @param e
     */
    this.scrollToPlayedFile = function(/* ctx, e */) {
        let selector = self.filePlaying() && 'li[data-id=' + self.filePlaying().id + ']:first';
        if (selector) {
            // the same file may reside in multiple list simultaneously, and we wanna scroll all of them..
            $(selector).each(function() {
                $(this).closest('.col-content .scrollable-container').stop().scrollTo(selector, {
                    duration: 200,
                    offset: {top: -6}
                });
            });
        }
    };

    ko.computed(() => {
        let shouldRefocus = this.spectrograms.isEnabled() && this.spectrograms.displayedHeight();
        if (shouldRefocus && !ko.computedContext.isInitial()) {
            setTimeout(this.scrollToPlayedFile, 250);
        }
    });

    this.swapPaths = function() {
        let oldTargetPath = self.target.path();
        self.target.path(self.source.path());
        self.source.path(oldTargetPath);
    };

    function findDuplicates() {
        self.duplicatesLoaded(false);
        self.duplicatesLoading(true);
        self.target.checkDuplicates(self.source.files(), function() {
            console.log('Duplicate check done.');
            let duplicateIds = [];
            _.each(self.source.files(), function(fileItem) {
                if (fileItem.duplicateIds) {
                    duplicateIds.push(fileItem.id);
                }
            });

            // filter mode may have been resetted meanwhile, so check it before updating..
            if (self.duplicateFilter() !== DUPLICATE_FILTER_MODE.NONE) {
                self.duplicatesLoading(false);
                self.duplicatesLoaded(true);
                self.duplicateIds(duplicateIds);
            }
        });
    }

    function playNextOrPrev(next) {
        let playedId = self.filePlaying() && self.filePlaying().id,
            newIdToPlay = null,
            jSourceList = $('#sourceList'),
            nextLI = next && (jSourceList.find('li[data-id='+ playedId +']:visible:first').next('li')[0]
                            || jSourceList.find('li:visible:first')[0]),
            prevLI = !next && (jSourceList.find('li[data-id='+ playedId +']:visible:first').prev('li')[0]
                            || jSourceList.find('li:visible:last')[0]),
            usedLI = nextLI || prevLI;

        if (usedLI) {
            newIdToPlay = usedLI.getAttribute('data-id');
            self.playFileItem(newIdToPlay);
        }
    }

    this.playNext = function() {
        playNextOrPrev(true);
    };

    this.playPrevious = function() {
        playNextOrPrev(false);
    };

    this.onSourceListClick = HANDLERS.SOURCE_LIST_CLICK;

    this.stopAudio = function(/* app, e */) {
        if (self.filePlaying()) {
            try {
                audioElement.pause();
                audioElement.currentTime = 0;
            } catch (e) {
                // so what (can happen on invalid files
            }
        }
    };

    audioElement.ondurationchange = (e) => {
        audioDuration(audioElement.duration || 0);
    };

    audioElement.ontimeupdate = (e) => {
        audioPositionInSeconds(audioElement.currentTime || 0);
    };

    initOnce();
}


module.exports = {
    run: function() {
        Helper.assert(!instance, 'App already running');
        instance = new App();
        ko.applyBindings(instance);
    }
};