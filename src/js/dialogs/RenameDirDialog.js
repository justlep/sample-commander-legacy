
'use strict';

let {ko, Helper} = require('../common'),
    DialogManager = require('../DialogManager'),
    DEFAULT_WIDTH = 530,
    instance,
    getInstance = function(dirItem, callback) {
        Helper.assertObject(dirItem, 'invalid dirItem for RenameDirDialog.getInstance()');
        Helper.assertFunction(callback, 'invalid onSubmit for RenameDirDialog.getInstance()');
        if (!instance) {
            instance = new RenameDirDialog();
        }
        instance.dirItem(dirItem);
        instance.setSubmitCallback(callback);
        return instance;
    };

/**
 * Dialog opened after dragging selected files to a folder
 * @constructor
 */
function RenameDirDialog() {

    var self = this,
        dialogManager = DialogManager.getInstance(),
        submitCallback = null;

    this.settings = DialogManager.createDialogSettings({
                        templateName: 'renameDirDialogTpl',
                        modalWidth: DEFAULT_WIDTH
                    });

    this.newName = ko.observable();
    this.dirItem = ko.observable();
    this.dirItem.subscribe(function(newDirItem) {
        self.newName(newDirItem.name);
    });

    /**
     * Sets the callback function called on the positive button.
     * @param callback (function) e.g. function(RenameDirDialog, moveFiles){..}
     *                            where {moveFiles} is true if move button was clicked, otherwise copy
     */
    this.setSubmitCallback = function(callback) {
        Helper.assertFunction(callback, 'Invalid submit callback for RenameDirDialog');
        submitCallback = callback;
    };

    this.submit = function() {
        self.newName((self.newName()||'').trim());
        if (self.newName() !== self.dirItem().name && Helper.isValidDirName(self.newName())) {
            submitCallback(self.newName());
        }
    };

    this.show = function() {
        dialogManager.showDialog(this);
    };
}

module.exports = {getInstance};
