
'use strict';

let {ko, Helper, _} = require('../common'),
    DialogManager = require('../DialogManager'),
    PathWatcher = require('../PathWatcher'),
    Config = require('../Config'),
    DEFAULT_WIDTH = 700,
    VALID_FILE_PATTERN_REGEX = /\*\.[a-z0-9_-]+$/i,
    instance,
    getInstance = function(opts) {
        if (!instance) {
            instance = new DeleteFilesDialog();
        }
        instance.init(opts);
        return instance;
    },
    nodeFs = require('fs');

/**
 * Dialog opened after dragging selected files to a folder
 * @constructor
 */
function DeleteFilesDialog() {

    var self = this,
        dialogManager = DialogManager.getInstance(),
        config = Config.getInstance(),
        source;

    this.settings = DialogManager.createDialogSettings({
                        templateName: 'deleteFilesDialogTpl',
                        modalWidth: DEFAULT_WIDTH
                    });

    this.predefinedPatterns = [
        {name: 'ZOOM H6 project files', pattern: '*.hprj'},
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
        var copiedSize = self.processedFileItems().length,
            totalSize = self.fileItems().length;

        return (totalSize) ? Math.round(100 * copiedSize / totalSize) : 0;
    });

    this.isValidPattern = ko.pureComputed(function() {
        return self.useFilePattern() && VALID_FILE_PATTERN_REGEX.test(self.filePattern()||'');
    });

    this.canDelete = ko.pureComputed(function() {
        var isPatternOk = (!self.useFilePattern() || self.isValidPattern()),
            hasFiles = !!self.fileItems().length;

        return isPatternOk && hasFiles;
    });

    this.deleteFiles = function() {
        if (!self.canDelete()) {
            return;
        }
        if (self.useFilePattern()) {
            config.projectFilePattern(self.filePattern());
        }
        self.inProgress(true);
        self.doneWithErrors(false);
        _.each(self.fileItems(), function(fileItem) {
            fileItem.__deleteFailed = false;
            var srcPath = fileItem.path;
            try {
                nodeFs.unlinkSync(srcPath);
                self.deletedFileItems.push(fileItem);
                fileItem.__deleteFailed = false;
            } catch (e) {
                fileItem.__deleteFailed = true;
                self.doneWithErrors(true);
                console.error('Unable to delete file %s.', srcPath, e);
            }
            self.processedFileItems.push(fileItem);
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
    getInstance: getInstance,
    getInstanceForDeleteProjectFiles: function(opts) {
        Helper.assertObject(opts, 'invalid opts for DeleteFilesDialog.getInstanceForDeleteProjectFiles');
        opts.forProjectFiles = true;
        return getInstance(opts);
    }
};
