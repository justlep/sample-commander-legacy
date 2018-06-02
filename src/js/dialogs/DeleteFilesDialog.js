
'use strict';

const {ko, Helper, _} = require('../common'),
    DialogManager = require('../DialogManager'),
    PathWatcher = require('../PathWatcher'),
    Config = require('../Config'),
    DEFAULT_WIDTH = 700,
    VALID_FILE_PATTERN_REGEX = /\*\.[a-z0-9_-]+$/i,
    getInstance = function(opts) {
        if (!instance) {
            instance = new DeleteFilesDialog();
        }
        instance.init(opts);
        return instance;
    },
    nodeFs = require('fs'),
    Spectrograms = require('../Spectrograms'),
    H6_PROJECT_FILE_PATTERN = '*.hprj';

let instance;

/**
 * Dialog opened after dragging selected files to a folder
 * @constructor
 */
function DeleteFilesDialog() {

    let self = this,
        dialogManager = DialogManager.getInstance(),
        config = Config.getInstance(),
        source;

    this.settings = DialogManager.createDialogSettings({
                        templateName: 'deleteFilesDialogTpl',
                        modalWidth: DEFAULT_WIDTH
                    });

    this.predefinedPatterns = [
        {name: 'ZOOM H6 project files', pattern: H6_PROJECT_FILE_PATTERN},
        {name: 'Backup files', pattern: '*.bak'},
        {name: 'Wave files', pattern: '*.wav'},
        {name: 'MP3 files', pattern: '*.mp3'}
    ];

    this.useFilePattern = ko.observable();
    this.filePattern = ko.observable();
    this.isComplete = ko.observable(false);
    this.doneWithErrors = ko.observable(false);
    this.fileItems = ko.observableArray();
    this.inProgress = ko.observable(false);
    this.totalSize = ko.pureComputed(function() {
        return _.reduce(self.fileItems(), function(totalSize, fileItem) {
            return totalSize + fileItem.filesize;
        }, 0);
    });
    this.processedFileItems = ko.observableArray();
    this.deletedFileItems = ko.observableArray();
    this.progressInPercent = ko.pureComputed(function() {
        let copiedSize = self.processedFileItems().length,
            totalSize = self.fileItems().length;

        return (totalSize) ? Math.round(100 * copiedSize / totalSize) : 0;
    });

    this.isDeleteEmptyParentFolderSelected = ko.observable(true);
    this.isRemoveEmptyFolderOptionAvailable = ko.computed(function() {
        return self.useFilePattern() && self.filePattern() === H6_PROJECT_FILE_PATTERN;
    });

    this.isValidPattern = ko.pureComputed(function() {
        return self.useFilePattern() && VALID_FILE_PATTERN_REGEX.test(self.filePattern()||'');
    });

    this.canDelete = ko.pureComputed(function() {
        let isPatternOk = (!self.useFilePattern() || self.isValidPattern()),
            hasFiles = !!self.fileItems().length;

        return isPatternOk && hasFiles;
    });

    this.deletedFolders = ko.observableArray();

    this.deleteFiles = function() {
        if (!self.canDelete()) {
            return;
        }
        if (self.useFilePattern()) {
            config.projectFilePattern(self.filePattern());
        }
        self.deletedFolders.removeAll();

        let deleteEmptyParentFolder = self.isRemoveEmptyFolderOptionAvailable() && self.isDeleteEmptyParentFolderSelected(),
            deletableFoldersMap = {};

        self.inProgress(true);
        self.doneWithErrors(false);
        _.each(self.fileItems(), function(fileItem) {
            fileItem.__deleteFailed = false;
            let srcPath = fileItem.path;
            try {
                nodeFs.unlinkSync(srcPath);
                self.deletedFileItems.push(fileItem);
                if (deleteEmptyParentFolder) {
                    let folderPath = srcPath.replace(/(.*)[/\\][^/\\]+$/, '$1');
                    deletableFoldersMap[folderPath] = 1;
                }
            } catch (e) {
                fileItem.__deleteFailed = true;
                self.doneWithErrors(true);
                console.error('Unable to delete file %s.', srcPath, e);
            }

            let deletableSpectroFile = !fileItem.__deleteFailed && Spectrograms.getSpectroFilenameForAudioFilename(srcPath);
            if (deletableSpectroFile) {
                try {
                    nodeFs.unlinkSync(deletableSpectroFile);
                } catch (e) {
                    self.doneWithErrors(true);
                    console.error('Failed to delete spectro file %s', deletableSpectroFile);
                }
            }

            self.processedFileItems.push(fileItem);
        });

        Object.keys(deletableFoldersMap).forEach(function(folderPath) {
            // console.log('Checking folder: ' + folderPath);
            let pathContent = nodeFs.readdirSync(folderPath),
                isEmpty = pathContent && pathContent.every(p => (p === '.' || p === '..'));

            if (!isEmpty) {
                console.log('Skip delete non-empty folder: ' + folderPath);
            } else {
                try {
                    nodeFs.rmdirSync(folderPath);
                    self.deletedFolders.push(folderPath);
                } catch (e) {
                    console.error('Error while deleting folder ' + folderPath);
                }
            }
        });

        self.isComplete(true);
        _.each(self.deletedFileItems(), function(fileItem) {
            source.files.remove(fileItem);
        });
    };

    this.close = function() {
        self.fileItems.removeAll();
        dialogManager.reset();
    };

    this.show = function() {
        dialogManager.showDialog(this);
        DialogManager.autoHeight();
    };

    self.applyPattern = function() {
        if (self.isValidPattern()) {
            source.loadFileItemsByPattern(self.filePattern(), function(matchedFileItems) {
                self.fileItems(matchedFileItems)
            });
        } else {
            self.fileItems([]);
        }
    };

    this.init = function(opts) {
        Helper.assertObject(opts, 'invalid opts for DeleteFilesDialog.init()');
        Helper.assert(opts.source && opts.source instanceof PathWatcher,
                                'invalid source for DeleteFilesDialog.init()');
        source = opts.source;
        self.inProgress(false);
        self.processedFileItems.removeAll();
        self.deletedFileItems.removeAll();
        self.useFilePattern(!!opts.forProjectFiles);
        self.deletedFolders.removeAll();
        if (self.useFilePattern()) {
            self.filePattern(config.projectFilePattern());
            self.applyPattern();
        } else {
            self.fileItems(source.getVisibleSelectedFileItems());
        }
        self.isComplete(false);
    };
}

module.exports = {
    getInstance,
    getInstanceForDeleteProjectFiles: function(opts) {
        Helper.assertObject(opts, 'invalid opts for DeleteFilesDialog.getInstanceForDeleteProjectFiles');
        opts.forProjectFiles = true;
        return getInstance(opts);
    }
};
