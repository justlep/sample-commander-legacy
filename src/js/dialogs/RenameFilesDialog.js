
'use strict';

const {ko, Helper, _, $} = require('../common'),
    DialogManager = require('../DialogManager'),
    Config = require('../Config'),
    PathWatcher = require('../PathWatcher'),
    DEFAULT_WIDTH = 700,
    getInstance = function(opts) {
        if (!instance) {
            instance = new RenameFilesDialog();
        }
        instance.init(opts);
        return instance;
    },
    nodeFs = require('fs'),
    nodePath = require('path'),
    Spectrograms = require('../Spectrograms');

let instance;

/**
 * Dialog opened after dragging selected files to a folder
 * @constructor
 */
function RenameFilesDialog() {

    let DEFAULT_REGEX_SEARCH = '',
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
    this.totalSize = ko.pureComputed(() => this.fileItems().reduce((totalSize, fileItem) => totalSize + fileItem.filesize, 0));
    this.processedFileItems = ko.observableArray();
    this.renamedFileItems = ko.observableArray();
    this.progressInPercent = ko.pureComputed(() => {
        let copiedSize = this.processedFileItems().length,
            totalSize = this.fileItems().length;

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

    let _createRegex = () => {
        let ignoreCaseI = this.regexIgnoreCase() ? 'i' : '';
        return new RegExp('(' + this.regexSearch() + ')', 'g' + ignoreCaseI);
    };

    this.isRegexValid = ko.pureComputed(() => {
        let regex = this.regexSearch(),
            isValid = true;
        if (regex) {
            try {
                _createRegex();
            } catch (e) {
                isValid = false;
            }
        }
        return isValid;
    });

    this.regexToUse = ko.pureComputed(() => {
        let useRegex = this.useRegex(),
            isValid = this.isRegexValid();
        
        return (useRegex && isValid) ? _createRegex() : null;
    });

    this.resetSettings = () => {
        this.regexSearch(DEFAULT_REGEX_SEARCH);
        this.regexReplace(DEFAULT_REGEX_REPLACE);
        this.regexIgnoreCase(true);
        this.targetPattern(ORIGINAL_NAME_PLACEHOLDER);
        this.counterStart(DEFAULT_COUNTER_START);
        this.counterDigits(DEFAULT_COUNTER_DIGITS);
        this.counterStepsize(DEFAULT_COUNTER_STEPSIZE);
        this.useRegex(DEFAULT_USE_REGEX);
        this.regexIgnoreCase(DEFAULT_REGEX_IGNORE_CASE);
    };

    this.applySettings = () => {
        let trimmedTargetPattern = $.trim(this.targetPattern());
        if (!trimmedTargetPattern) {
            return;
        }

        let parsedCounterStart = parseInt(this.counterStart(), 10),
            counterStart = isNaN(parsedCounterStart) ? DEFAULT_COUNTER_START : Math.round(parsedCounterStart),
            counterStepsize = parseInt(this.counterStepsize(), 10) || DEFAULT_COUNTER_STEPSIZE,
            counterDigits = parseInt(this.counterDigits(), 10) || DEFAULT_COUNTER_DIGITS,
            counter = counterStart;

        this.fileItems().forEach(fileItem => {
            let oldName = /* fileItem._newFilename() || */ fileItem.filename,
                counterStr = '' + counter,
                oldExt,
                newName;

            for (let i = counterDigits - counterStr.length; i > 0; i--) {
                counterStr = '0' + counterStr;
            }

            oldName.match(/(.*)(\.wav)/i);
            newName = RegExp.$1;
            oldExt = RegExp.$2;

            newName = trimmedTargetPattern.replace(ORIGINAL_NAME_PLACEHOLDER_REGEX, newName);
            newName = newName.replace(COUNTER_PLACEHOLDER_REGEX, counterStr);

            if (this.regexToUse()) {
                newName = newName.replace(this.regexToUse(), this.regexReplace());
            } else if (!this.useRegex() && this.regexSearch()) {
                newName = newName.replace(this.regexSearch(), this.regexReplace());
            }

            newName = $.trim(newName.replace(/\s{2,}/g, ' '));

            fileItem._newFilename(newName + oldExt);

            counter += counterStepsize;
        });
    };

    this.regexSearch.subscribe(this.applySettings);
    this.regexReplace.subscribe(this.applySettings);
    this.useRegex.subscribe(this.applySettings);
    this.regexIgnoreCase.subscribe(this.applySettings);
    this.targetPattern.subscribe(this.applySettings);
    this.counterStart.subscribe(this.applySettings);
    this.counterDigits.subscribe(this.applySettings);
    this.counterStepsize.subscribe(this.applySettings);

    this.insertCounterPlaceholder = () => {
        this.targetPattern(this.targetPattern() + COUNTER_PLACEHOLDER);
    };

    this.insertNamePlaceholder = function() {
        this.targetPattern(this.targetPattern() + ORIGINAL_NAME_PLACEHOLDER);
    };

    this.reusePatternSelected = (ctx, e) => {
        let dropdown = e.target,
            pattern = dropdown.value;
        this.targetPattern(pattern || ORIGINAL_NAME_PLACEHOLDER);
        dropdown.selectedIndex = 0;
    };

    this.renameFilesNow = () => {
        this.inProgress(true);
        this.doneWithErrors(false);
        let trimmedPattern = $.trim(this.targetPattern());
        if (trimmedPattern !== ORIGINAL_NAME_PLACEHOLDER) {
            config.addLastRenamePattern(trimmedPattern);
        }
        this.fileItems().forEach(fileItem => {

            fileItem.__renameFailed = true;
            fileItem.__renameSkippedExists = false;

            let oldPath = fileItem.path,
                newPath = nodePath.resolve(oldPath, '..', fileItem._newFilename()),
                oldSpectroPath = Spectrograms.getSpectroFilenameForAudioFilename(oldPath);

            // TODO fs.exists is deprecated
            if (nodeFs.existsSync(newPath)) {
                fileItem.__renameSkippedExists = true;
                this.doneWithErrors(true);
            } else {
                try {
                    nodeFs.renameSync(oldPath, newPath);
                    this.renamedFileItems.push(fileItem);
                    fileItem.__renameFailed = false;

                    // TODO refresh file item filename, path and hash
                } catch (e) {
                    fileItem.__renameFailed = true;
                    this.doneWithErrors(true);
                    console.error('Unable to rename file %s.', oldPath, e);
                }

                // silently rename spectrogram, too
                if (!fileItem.__renameFailed && nodeFs.existsSync(oldSpectroPath)) {
                    let newSpectroPath = Spectrograms.getSpectroFilenameForAudioFilename(newPath);
                    try {
                        nodeFs.renameSync(oldSpectroPath, newSpectroPath);
                    } catch (e) {
                        this.doneWithErrors(true);
                        console.error('Unable to rename spectrogram %s into %s', oldSpectroPath, newSpectroPath);
                    }
                }
            }
            this.processedFileItems.push(fileItem);
        });

        this.isComplete(true);

        if (this.renamedFileItems().length) {
            source.reload();
        }
    };

    this.close = () => {
        this.fileItems.removeAll();
        dialogManager.reset();
    };

    this.show = function() {
        dialogManager.showDialog(this);
        DialogManager.autoHeight();
    };

    /**
     * @param {object} opts
     * @param {PathWatcher} opts.source
     */
    this.init = (opts) => {
        Helper.assert(opts && opts.source instanceof PathWatcher,
            'invalid source for RenameFilesDialog.init()');
        source = opts.source;
        this.inProgress(false);
        this.processedFileItems.removeAll();
        this.renamedFileItems.removeAll();
        this.fileItems(source.getVisibleSelectedFileItems());
        this.fileItems().forEach(fileItem => {
            let newFilenameToInitWith = fileItem.newFilename || fileItem.filename;
            if (!fileItem.newFilename) {
                fileItem._newFilename = ko.observable(newFilenameToInitWith);
            } else {
                fileItem._newFilename(newFilenameToInitWith);
            }

        });
        this.resetSettings();
        if (this.fileItems().length === 1 && /(.*)\.\w+$/.test(this.fileItems()[0].filename)) {
            let filenameWoExt = RegExp.$1;
            this.targetPattern(filenameWoExt || '');
        }
        this.isComplete(false);
    };
}

module.exports = {getInstance};
