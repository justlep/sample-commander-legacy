'use strict';

define(['knockout',
        'AMD/Helper',
        'AMD/DialogManager'],
    function(ko, Helper, DialogManager) {

    var DEFAULT_WIDTH = 530,
        TEMPLATES = {
            DEFAULT: 'confirmDialogTpl'
        },
        instance,
        getInstance = function(confirmCallback, optionalTemplateName, optionalContextVars) {
            Helper.assertStringOrEmpty(optionalTemplateName, 'invalid tempalte name for ConfirmDialog.getInstance()');
            if (!instance) {
                instance = new ConfirmDialog();
            }
            instance.setConfirmCallback(confirmCallback);
            instance.setTemplateName(optionalTemplateName);
            instance.setContextVars(optionalContextVars);
            instance.settings.modalWidth = (TEMPLATES.REVERT_ENTRY === optionalTemplateName) ? 550  : DEFAULT_WIDTH;
            return instance;
        };

    /**
     * A simple "Möchten Sie wirklich fortfahren?" confirm dialog.
     * @constructor
     */
    function ConfirmDialog() {

        var self = this,
            dialogManager = DialogManager.getInstance(),
            confirmCallback = null;

        this.settings = DialogManager.createDialogSettings({
                            templateName: TEMPLATES.DEFAULT,
                            modalWidth: DEFAULT_WIDTH
                        });

        /**
         * Object containing properties that might be used in the template via data-bind.
         */
        this.contextVars = null;

        /**
         * Sets the template name for this dialog or the default templateName if empty.
         * @param [templateName] (String) the template to set; If falsy, the {@link TEMPLATES.DEFAULT} is set
         * @returns (Object) this instance (chainable)
         */
        this.setTemplateName = function(templateName) {
            Helper.assertStringOrEmpty(templateName, 'Invalid templateName for ConfirmDialog');
            this.settings.templateName = templateName || TEMPLATES.DEFAULT;
            return this;
        };

        /**
         * Sets the callback function called on the positive button.
         * @param callback (function) e.g. function(confirmDialog){..}
         */
        this.setConfirmCallback = function(callback) {
            Helper.assertFunction(callback, 'Invalid confirm callback for ConfirmDialog');
            confirmCallback = callback;
        };

        this.setContextVars = function(newContextVars) {
            this.contextVars = newContextVars || null;
        };

        /**
         * Triggered via data-bind by the template's ok button.
         */
        this.confirm = function() {
            confirmCallback(self);
            dialogManager.reset();
            return false;
        };

        this.show = function() {
            dialogManager.showDialog(this);
        };
    }

    return {
        getInstance: getInstance,
        getInstanceForSomething: function(someInfo, onConfirm) {
            return getInstance(onConfirm, TEMPLATES.DEFAULT, {someInfo: someInfo});
        }
    };

});
