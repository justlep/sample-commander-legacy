
'use strict';

let {ko, Helper} = require('../common'),
    DialogManager = require('../DialogManager'),
    DEFAULT_WIDTH = 530,
    instance,
    getInstance = function(dirItem, callback) {
        Helper.assertObject(dirItem, 'invalid dirItem for CreateSubdirDialog.getInstance()');
        Helper.assertFunction(callback, 'invalid onSubmit for CreateSubdirDialog.getInstance()');
        if (!instance) {
            instance = new CreateSubdirDialog();
        }
        instance.dirItem(dirItem);
        instance.newName('');
        instance.setSubmitCallback(callback);
        return instance;
    };

/**
 * Dialog opened after dragging selected files to a folder
 * @constructor
 */
function CreateSubdirDialog() {

    let self = this,
        dialogManager = DialogManager.getInstance(),
        submitCallback = null;

    this.settings = DialogManager.createDialogSettings({
                        templateName: 'createSubdirDialogTpl',
                        modalWidth: DEFAULT_WIDTH
                    });

    this.newName = ko.observable('');
    this.dirItem = ko.observable();

    /**
     * Sets the callback function called on the positive button.
     * @param callback (function) e.g. function(CreateSubdirDialog, moveFiles){..}
     *                            where {moveFiles} is true if move button was clicked, otherwise copy
     */
    this.setSubmitCallback = function(callback) {
        Helper.assertFunction(callback, 'Invalid submit callback for CreateSubdirDialog');
        submitCallback = callback;
    };

    this.submit = function() {
        self.newName((self.newName()||'').trim());
        if (Helper.isValidDirName(self.newName())) {
            submitCallback(self.newName());
        }
    };

    this.show = function() {
        dialogManager.showDialog(this);
    };
}

module.exports = {getInstance};
