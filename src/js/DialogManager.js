
'use strict';

let {ko, _, $, Helper} = require('./common'),
    instance,
    getInstance = function() {
        if (!instance) {
            instance = new DialogManager();
        }
        return instance;
    },
    DEFAULT_DIALOG_SETTINGS = {
        templateName: '',                          // the template to render
        modalContainerId: 'syncer-modal-container', // the overlay container (for conflict-free styling)
        modalCloseClass: 'modalClose',            // the class of element on which clicking will close the modal
        modalWidth: '530',                        // width of the modal window
        showCloseButton: false                    // if true, the dialog has a 'schließen' button on top/right
    },

    /**
     * Creates a settings map to be provided as property 'settings' by Dialog objects which are
     * passed to {@link DialogManager#dialog()}.
     *
     * @param [settings] (Object) map of custom settings overriding the {@link DEFAULT_DIALOG_SETTINGS}
     * @returns (Object) settings map
     */
    createDialogSettings = function(settings) {
        return $.extend({}, DEFAULT_DIALOG_SETTINGS, settings||{});
    },

    /**
     * @returns (Boolean) true if the given dialog has a valid settings maps, i.e. one containing
     *                    all the keys from the {@link DEFAULT_DIALOG_SETTINGS} and a valid templateName value.
     */
    hasDialogValidSettings = function(dialog) {
        return dialog && dialog.settings && dialog.settings.templateName &&
                _.every(DEFAULT_DIALOG_SETTINGS||{}, (val, key) => typeof dialog.settings[key] !== 'undefined');
    },

    autoHeight = function() {
        $('#syncer-modal-container').css('height','auto');
    };


/**
 * The DialogManager class. To be instantiated as a singleton only.
 * @constructor
 */
function DialogManager() {
    var self = this,
        jModalDialog = $('#dialog'),
        currentDialog = ko.observable(null),
        currentDialogSettings = null,
        HANDLERS = {
            MODAL_SHOW: function(/* simpleModal */) {
                Helper.notify(Helper.EVENTS.MODAL_SHOW);
            }
        };

    this.dialog = ko.computed({
        read: function() {
            return currentDialog();
        },
        write: function(dialog) {
            if (dialog) {
                Helper.assert(hasDialogValidSettings(dialog), 'Dialog has invalid settings.');
                currentDialog(dialog);
                currentDialogSettings = dialog.settings;
            } else {
                currentDialog(null);
                currentDialogSettings = null;
            }
            console.log('New dialog set: %o', dialog);
        }
    });

    this.templateToRender = ko.computed(function() {
        // (!) don't use just currentDialogSettings here, otherwise this computed won't be updated anymore!
        var templateName = self.dialog() && self.dialog().settings.templateName;
        console.log('Overlay template: %s', templateName);
        return templateName;
    });


    /**
     * Shows the dialog currently set or the given one.
     *
     * @param [newDialog] (Object) (optional) the dialog object to render; If null, the current one is used.
     * @param [focusFirstTextField] (Boolean) (optional) if true, the first visible textfield of the dialog
     *                                                   will get focused
     */
    this.showDialog = function(newDialog, focusFirstTextField) {
        Helper.assert(newDialog || currentDialog(), 'There is no dialog to show');
        if (newDialog) {
            self.dialog(newDialog);
        }

        jModalDialog.modal({
            onClose: self.reset,
            onShow: HANDLERS.MODAL_SHOW,
            overlayClose: true,
            closeClass: currentDialogSettings.modalCloseClass,
            containerId: currentDialogSettings.modalContainerId,
            containerCss: {
                width: currentDialogSettings.modalWidth,
                height: 'auto'
            },
            zIndex: 1082,
            position: null,
            autoPosition: true,
            autoResize: true,
            persist: true // otherwise simplemodal will cache the html of the first modal call
        });

        if (focusFirstTextField) {
            console.warn('Focussing first visible textfield');
            setTimeout(function() {
                $('#dialog input[type=text]:visible:first').focus();
            }, 500);
        }
    };

    this.reset = function() {
        // maybe add fade effect here; see http://www.ericmmartin.com/projects/simplemodal/
        $.modal.close();
        self.dialog(null);
    };

    this.isDialogOpen = function() {
        return $('#' + DEFAULT_DIALOG_SETTINGS.modalContainerId).is(':visible');
    }
}

module.exports = {
    getInstance,
    createDialogSettings,
    autoHeight
};