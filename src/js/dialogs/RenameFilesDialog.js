
'use strict';

let {ko, Helper, _, $} = require('../common'),
    DialogManager = require('../DialogManager'),
    Config = require('../Config'),
    PathWatcher = require('../PathWatcher'),
    DEFAULT_WIDTH = 700,
    instance,
    getInstance = function(opts) {
        if (!instance) {
            instance = new RenameFilesDialog();
        }
        instance.init(opts);
        return instance;
    },
    nodeFs = require('fs'),
    nodePath = require('path');

/**
 * Dialog opened after dragging selected files to a folder
 * @constructor
 */
function RenameFilesDialog() {

    var self = this,
        DEFAULT_REGEX_SEARCH = '',
        DEFAULT_REGEX_REPLACE = '',
        ORIGINAL_NAME_PLACEHOLDER = '[N]',
        ORIGINAL_NAME_PLACEHOLDER_REGEX = new RegExp(Helper.escapeForRegex(ORIGINAL_NAME_PLACEHOLDER), 'g'),
        COUNTER_PLACEHOLDER = '[C]',
        COUNTER_PLACEHOLDER_REGEX = new RegExp(Helper.escapeForRegex(COUNTER_PLACEHOLDER), 'g'),
        DEFAULT_COUNTER_START = 1,
        DEFAULT_COUNTER_DIGITS = 2,
        DEFAULT_COUNTER_STEPSIZE = 1,
        DEFAULT_USE_REGEX = false,
        DEFAULT_REGEX_IGNORE_CASE = true,
        dialogManager = DialogManager.getInstance(),
        config = Config.getInstance(),
        source;

    this.settings = DialogManager.createDialogSettings({
                        templateName: 'renameFilesDialogTpl',
                        modalWidth: DEFAULT_WIDTH
                    });

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
    this.renamedFileItems = ko.observableArray();
    this.progressInPercent = ko.pureComputed(function() {
        var copiedSize = self.processedFileItems().length,
            totalSize = self.fileItems().length;

        return (totalSize) ? Math.round(100 * copiedSize / totalSize) : 0;
    });

    this.useRegex = ko.observable(DEFAULT_USE_REGEX);
    this.regexSearch = ko.observable(DEFAULT_REGEX_SEARCH);
    this.regexReplace = ko.observable(DEFAULT_REGEX_REPLACE);
    this.regexIgnoreCase = ko.observable(DEFAULT_REGEX_IGNORE_CASE);
    this.targetPattern = ko.observable(ORIGINAL_NAME_PLACEHOLDER);
    this.counterStart = ko.observable(DEFAULT_COUNTER_START);
    this.counterDigits = ko.observable(DEFAULT_COUNTER_DIGITS);
    this.counterStepsize = ko.observable(DEFAULT_COUNTER_STEPSIZE);

    function createRegex() {
        var ignoreCaseI = (self.regexIgnoreCase()) ? 'i' : '';
        return new RegExp('(' + self.regexSearch() + ')', 'g' + ignoreCaseI);
    }

    this.isRegexValid = ko.pureComputed(function() {
        var regex = self.regexSearch(),
            isValid = true;
        if (regex) {
            try {
                createRegex();
            } catch (e) {
                isValid = false;
            }
        }
        return isValid;
    });

    this.regexToUse = ko.pureComputed(function() {
        var useRegex = self.useRegex(),
            isValid = self.isRegexValid();
        return (useRegex && isValid) ? createRegex() : null;
    });

    this.resetSettings = function() {
        self.regexSearch(DEFAULT_REGEX_SEARCH);
        self.regexReplace(DEFAULT_REGEX_REPLACE);
        self.regexIgnoreCase(true);
        self.targetPattern(ORIGINAL_NAME_PLACEHOLDER);
        self.counterStart(DEFAULT_COUNTER_START);
        self.counterDigits(DEFAULT_COUNTER_DIGITS);
        self.counterStepsize(DEFAULT_COUNTER_STEPSIZE);
        self.useRegex(DEFAULT_USE_REGEX);
        self.regexIgnoreCase(DEFAULT_REGEX_IGNORE_CASE);
    };

    this.applySettings = function() {
        var trimmedTargetPattern = $.trim(self.targetPattern());
        if (!trimmedTargetPattern) {
            return;
        }

        var parsedCounterStart = parseInt(self.counterStart(), 10),
            counterStart = isNaN(parsedCounterStart) ? DEFAULT_COUNTER_START : Math.round(parsedCounterStart),
            counterStepsize = parseInt(self.counterStepsize(), 10) || DEFAULT_COUNTER_STEPSIZE,
            counterDigits = parseInt(self.counterDigits(), 10) || DEFAULT_COUNTER_DIGITS,
            counter = counterStart;

        _.each(self.fileItems(), function(fileItem) {
            var oldName = /* fileItem._newFilename() || */ fileItem.filename,
                oldExt = '',
                newName = '',
                counterStr = '' + counter;

            for (var i = counterDigits - counterStr.length; i > 0; i--) {
                counterStr = '0' + counterStr;
            }

            oldName.match(/(.*)(\.wav)/i);
            newName = RegExp.$1;
            oldExt = RegExp.$2;

            newName = trimmedTargetPattern.replace(ORIGINAL_NAME_PLACEHOLDER_REGEX, newName);
            newName = newName.replace(COUNTER_PLACEHOLDER_REGEX, counterStr);

            if (self.regexToUse()) {
                newName = newName.replace(self.regexToUse(), self.regexReplace());
            } else if (!self.useRegex() && self.regexSearch()) {
                newName = newName.replace(self.regexSearch(), self.regexReplace());
            }

            newName = $.trim(newName.replace(/\s{2,}/g, ' '));

            fileItem._newFilename(newName + oldExt);

            counter += counterStepsize;
        });
    };

    this.regexSearch.subscribe(self.applySettings);
    this.regexReplace.subscribe(self.applySettings);
    this.useRegex.subscribe(self.applySettings);
    this.regexIgnoreCase.subscribe(self.applySettings);
    this.targetPattern.subscribe(self.applySettings);
    this.counterStart.subscribe(self.applySettings);
    this.counterDigits.subscribe(self.applySettings);
    this.counterStepsize.subscribe(self.applySettings);

    this.insertCounterPlaceholder = function() {
        self.targetPattern(self.targetPattern() + COUNTER_PLACEHOLDER);
    };

    this.insertNamePlaceholder = function() {
        self.targetPattern(self.targetPattern() + ORIGINAL_NAME_PLACEHOLDER);
    };

    this.reusePatternSelected = function(ctx, e) {
        var dropdown = e.target,
            pattern = dropdown.value;
        self.targetPattern(pattern || ORIGINAL_NAME_PLACEHOLDER);
        dropdown.selectedIndex = 0;
    };

    this.renameFilesNow = function() {
        self.inProgress(true);
        self.doneWithErrors(false);
        var trimmedPattern = $.trim(self.targetPattern());
        if (trimmedPattern !== ORIGINAL_NAME_PLACEHOLDER) {
            config.addLastRenamePattern(trimmedPattern);
        }
        _.each(self.fileItems(), function(fileItem) {

            fileItem.__renameFailed = true;
            fileItem.__renameSkippedExists = false;

            var oldPath = fileItem.path,
                newPath = nodePath.resolve(oldPath, '..', fileItem._newFilename());

            // TODO fs.exists is deprecated
            if (nodeFs.existsSync(newPath)) {
                fileItem.__renameSkippedExists = true;
                self.doneWithErrors(true);
            } else {
                try {
                    nodeFs.renameSync(oldPath, newPath);
                    self.renamedFileItems.push(fileItem);
                    fileItem.__renameFailed = false;
                    // TODO refresh file item filename, path and hash
                } catch (e) {
                    fileItem.__renameFailed = true;
                    self.doneWithErrors(true);
                    console.error('Unable to rename file %s.', oldPath, e);
                }
            }
            self.processedFileItems.push(fileItem);
        });

        self.isComplete(true);

        if (self.renamedFileItems().length) {
            source.reload();
        }
    };

    this.close = function() {
        self.fileItems.removeAll();
        dialogManager.reset();
    };

    this.show = function() {
        dialogManager.showDialog(this);
        DialogManager.autoHeight();
    };

    this.init = function(opts) {
        Helper.assertObject(opts, 'invalid opts for RenameFilesDialog.init()');
        Helper.assert(opts.source && opts.source instanceof PathWatcher,
                                'invalid source for RenameFilesDialog.init()');
        source = opts.source;
        self.inProgress(false);
        self.processedFileItems.removeAll();
        self.renamedFileItems.removeAll();
        self.fileItems(source.getVisibleSelectedFileItems());
        _.each(self.fileItems(), function(fileItem) {
            var newFilenameToInitWith = fileItem.newFilename || fileItem.filename;
            if (!fileItem.newFilename) {
                fileItem._newFilename = ko.observable(newFilenameToInitWith);
            } else {
                fileItem._newFilename(newFilenameToInitWith);
            }

        });
        self.resetSettings();
        self.isComplete(false);
    };
}

module.exports = {
    getInstance: getInstance
};
