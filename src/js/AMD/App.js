
'use strict';

define(['knockout', 'AMD/Config', 'AMD/PathWatcher', 'underscore', 'AMD/Helper', 'AMD/DialogManager',
        'AMD/dialogs/ConfirmDialog',
        'AMD/dialogs/InfoDialog',
        'AMD/dialogs/CopyMoveFilesDialog',
        'AMD/DirContextMenu',
        'AMD/FileContextMenu',
        'AMD/SourceContextMenu',
        'AMD/TargetContextMenu',
        'AMD/knockout/FilteredFileBinding',
        'AMD/knockout/PathWatcherInfoBinding',
        'AMD/knockout/AbortLoadingOnClickBinding',
        'jquery.scrollTo'],

    function(ko, Config, PathWatcher, _, Helper, DialogManager, ConfirmDialog, InfoDialog, CopyMoveFilesDialog,
             DirContextMenu, FileContextMenu, SourceContextMenu, TargetContextMenu) {

    var instance = null,
        getInstance = function() {
            if (!instance) {
                instance = new App();
            }
            return instance;
        },
        KEYS = {
            ARROW_LEFT: 37,
            ARROW_RIGHT: 39
        },
        DUPLICATE_FILTER_MODE = {
            NONE: 'none',
            WITH_DUPLICATES: 'with',
            WITHOUT_DUPLICATES: 'without'
        };

    /**
     * The App.
     * @constructor
     */
    function App() {
        var self = this,
            HANDLERS = {
                FILE_DRAG_START: function(e) {
                    var dt = e.originalEvent.dataTransfer,
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
                DIR_DRAG_OVER: function(e) {e.preventDefault()},
                DIR_DRAG_ENTER: function(e) {
                    e.preventDefault();
                    $(this).addClass('drag-over');
                },
                DIR_DRAG_LEAVE: function(e) {
                    e.preventDefault();
                    $(this).removeClass('drag-over');
                },
                DIR_DROP: function(e) {
                    e.preventDefault();
                    $(this).removeClass('drag-over');

                    var dirItem = ko.contextFor(e.target).$data;

                    CopyMoveFilesDialog.getInstance({
                        source: self.source,
                        targetDirItem: dirItem
                    }).show();
                },
                DIR_CONTEXTMENU: function(e) {
                    var dirItem = ko.contextFor(e.target).$data;
                    DirContextMenu.getInstance(self.target, dirItem).show(e);
                },
                DIR_DOUBLECLICK: function(e) {
                    var dirItem = ko.contextFor(e.target).$data;
                    self.target.path(dirItem.path);
                },
                SELECTED_SOURCE_FILES_CHANGE: function() {
                    var selectedIds = self.source.selectedFileIds();
                    $('#sourceList li').each(function() {
                        var id = this.getAttribute('data-id') || '',
                            newSelected = (selectedIds.indexOf(id) >= 0),
                            oldSelected = (this.className.indexOf('selected') >= 0);

                        if (newSelected !== oldSelected) {
                            this.className = (newSelected) ? (this.className + ' selected ') :
                                this.className.replace(/selected/, '').replace('  ',' ');
                        }
                    });
                },
                KEY_PRESSED: function(e) {
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
                SOURCE_FILE_CLICK: function(ctx, e /* , filePlaying */) {
                    var context = ko.contextFor(e.target),
                        clickedFileItem = context && context.$data,
                        skipFilePlaying = false;

                    if (e.shiftKey) {
                        self.source.shiftSelectFileItem(clickedFileItem);
                    } else if (e.ctrlKey) {
                        self.source.toggleSelectFileItem(clickedFileItem);
                        skipFilePlaying = !self.source.isFileItemSelected(clickedFileItem);
                    } else {
                        self.source.selectFileItem(clickedFileItem);
                    }

                    if (clickedFileItem.isAudioFile && !skipFilePlaying) {
                        self.playFileItem(clickedFileItem);
                    }
                },

                SOURCE_FILE_RIGHTCLICK: function(ctx, e /*, filePlaying */) {
                    var context = ko.contextFor(e.target),
                        clickedFileItem = context && context.$data;
                    e.preventDefault();
                    e.stopPropagation();
                    FileContextMenu.getInstance({
                        sourceWatcher: self.source,
                        targetWatcher: self.target,
                        fileItem: clickedFileItem
                    }).show(e);
                },
                SOURCE_RIGHTCLICK: function(ctx, e) {
                    SourceContextMenu.getInstance(self.source).show(e);
                },
                TARGET_RIGHTCLICK: function(ctx, e) {
                    TargetContextMenu.getInstance(self.target).show(e);
                },
                SOURCE_LIST_CLICK: function() {
                    self.source.selectedFileIds.removeAll();
                }
            };

        this.playFileItem = function(fileItemOrId) {
            var fileItem = _.isObject(fileItemOrId) ? fileItemOrId : null;
            if (!fileItem) {
                fileItem = _.find(self.source.files(), function(item) {
                    return item.id === fileItemOrId;
                });
            }
            if (fileItem) {
                self.filePlaying(_.clone(fileItem));
            }
        };

        this.dialogManager = DialogManager.getInstance();

        this.config = Config.getInstance();
        this.filter = ko.observable('');
        this.filePlaying = ko.observable();

        this.hiddenFileIdsByFilter = ko.observableArray();
        this.filter.subscribe(function() {
            var newHiddenIds = [],
                filter = self.filter().toLowerCase();
            _.each(self.source.files(), function(fileItem) {
                var filename = fileItem.filename.toLowerCase(),
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
            var newHiddenIds = [],
                showDuplicates = (self.duplicateFilter() === DUPLICATE_FILTER_MODE.WITH_DUPLICATES),
                hideDuplicates = (self.duplicateFilter() === DUPLICATE_FILTER_MODE.WITHOUT_DUPLICATES);

            if (hideDuplicates || showDuplicates) {
                _.each(self.source.files(), function(fileItem) {
                    var hasDuplicates = (fileItem.duplicateIds && fileItem.duplicateIds.length);
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
            self.reloadAll();

            $(document.body).on('dragstart', '.file', HANDLERS.FILE_DRAG_START);
            $(document.body).on('dragover', '.dir', HANDLERS.DIR_DRAG_OVER);
            $(document.body).on('dragenter', '.dir', HANDLERS.DIR_DRAG_ENTER);
            $(document.body).on('dragleave', '.dir', HANDLERS.DIR_DRAG_LEAVE);
            $(document.body).on('drop', '.dir', HANDLERS.DIR_DROP);
            $(document).on('keyup', HANDLERS.KEY_PRESSED);
            $('#directoryList').on('contextmenu', '.dir', HANDLERS.DIR_CONTEXTMENU);
            $('#directoryList').on('dblclick', '.dir', HANDLERS.DIR_DOUBLECLICK);
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
        }

        this.onSourceFileClicked = HANDLERS.SOURCE_FILE_CLICK;
        this.onSourceRightclick = HANDLERS.SOURCE_RIGHTCLICK;
        this.onTargetRightclick = HANDLERS.TARGET_RIGHTCLICK;

        this.onSourceFileRightClicked = HANDLERS.SOURCE_FILE_RIGHTCLICK;

        this.switchListMode = function() {
            self.config.floatingList(!self.config.floatingList());
        };

        /**
         * Scrolls to the file that is currently being played.
         * @param ctx
         * @param e
         */
        this.scrollToPlayedFile = function(/* ctx, e */) {
            var selector = self.filePlaying() && 'li[data-id=' + self.filePlaying().id + ']:first';
            if (selector) {
                // the same file may reside in multiple list simultaneously, and we wanna scroll all of them..
                $(selector).each(function() {
                    $(this).closest('.col-content .scrollable-container').scrollTo(selector, {
                        duration: 200,
                        offset: {top: -6}
                    });
                });
            }
        };

        this.swapPaths = function() {
            var oldTargetPath = self.target.path();
            self.target.path(self.source.path());
            self.source.path(oldTargetPath);
        };

        function findDuplicates() {
            self.duplicatesLoaded(false);
            self.duplicatesLoading(true);
            self.target.checkDuplicates(self.source.files(), function() {
                console.log('Duplicate check done.');
                var duplicateIds = [];
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
            var playedId = self.filePlaying() && self.filePlaying().id,
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
                $('#innerplayer').each(function() {
                    try {
                        this.pause();
                        this.currentTime = 0;
                    } catch (e) {
                        // so what (can happen on invalid files
                    }
                });
            }
        };

        initOnce();
    }


    return {
        getInstance: getInstance
    };
});