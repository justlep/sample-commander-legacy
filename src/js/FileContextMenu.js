'use strict';

const nodeSpawn = require("child_process").spawn;

let {_, Helper, gui} = require('./common'),
    Config = require('./Config'),
    DialogManager = require('./DialogManager'),
    DeleteFilesDialog = require('./dialogs/DeleteFilesDialog'),
    RenameFilesDialog = require('./dialogs/RenameFilesDialog'),
    menu = new gui.Menu(),
    fs = require('fs'),
    source = null,
    target = null,
    config = Config.getInstance(),
    currentFileItem = null,
    nodePath = require('path'),
    instance = null,
    getInstance = function(opts) {
        Helper.assertObject(opts, 'invalid opts in FileContextMenu.getInstance');
        Helper.assertObject(opts.sourceWatcher, 'invalid sourceWatcher in FileContextMenu.getInstance');
        Helper.assertObject(opts.targetWatcher, 'invalid targetWatcher in FileContextMenu.getInstance');
        Helper.assertObjectOrEmpty(opts.fileItem, 'invalid fileItem in FileContextMenu.getInstance');
        if (!instance) {
            instance = new FileContextMenu();
        }
        source = opts.sourceWatcher;
        target = opts.targetWatcher;
        currentFileItem = opts.fileItem;
        updateOpenDuplicateItem();
        updateOpenInEditorEditorItem();
        config.editorExecutablePath.subscribe(updateOpenInEditorEditorItem);
        return instance;
    },

    updateOpenDuplicateItem = function() {
        let hasDuplicates = (currentFileItem.duplicateIds && currentFileItem.duplicateIds.length),
            duplicateNumber = (hasDuplicates) ? currentFileItem.duplicateIds.length : 0;
        itemOpenDuplicates.enabled = hasDuplicates;
        itemOpenDuplicates.label = itemOpenDuplicates.label.replace(/\d+/, duplicateNumber);
    },
    updateOpenInEditorEditorItem = function() {

        itemOpenInEditor.enabled = !!config.editorExecutablePath();
    },
    HANDLERS = {
        ITEM_PLAY: function() {
            if (currentFileItem && currentFileItem.isAudioFile) {
                Helper.notify(Helper.EVENTS.PLAY_FILE, currentFileItem);
            }
        },
        ITEM_OPEN_IN_APPLICATION: function() {
            gui.Shell.openItem(currentFileItem.path);
        },
        ITEM_SHOW_IN_FOLDER: function() {
            gui.Shell.showItemInFolder(currentFileItem.path);
        },
        ITEM_DELETE_FILES: function() {
            if (!source.isFileItemSelected(currentFileItem)) {
                source.toggleSelectFileItem(currentFileItem, true);
            }
            DeleteFilesDialog.getInstance({
                source: source
            }).show();
        },
        ITEM_RENAME_FILES: function() {
            if (!source.isFileItemSelected(currentFileItem)) {
                source.toggleSelectFileItem(currentFileItem, true);
            }
            RenameFilesDialog.getInstance({
                source: source
            }).show();
        },
        ITEM_SHOW_PATH_IN_SOURCE: function() {
            Helper.notify(Helper.EVENTS.CHANGE_SOURCE_PATH, nodePath.resolve(currentFileItem.path, '..'));
        },
        ITEM_SHOW_PATH_IN_TARGET: function() {
            Helper.notify(Helper.EVENTS.CHANGE_TARGET_PATH, nodePath.resolve(currentFileItem.path, '..'));
        },
        ITEM_OPEN_DUPLICATES: function() {
            _.each(currentFileItem.duplicateIds, function(duplicateItemId) {
                let duplicateItem = target.getFileItemById(duplicateItemId);
                if (duplicateItem) {
                    gui.Shell.showItemInFolder(duplicateItem.path);
                }
            });
        },
        CONFIGURE_EDITOR: function() {
            config.openEditorExecutableFileDialog();
        },
        ITEM_OPEN_IN_EDITOR: function() {
            Helper.assert(currentFileItem && currentFileItem.isAudioFile && currentFileItem.path, 'Invalid file');
            let editorExecutable = config.editorExecutablePath(),
                editorArgs = editorExecutable && [currentFileItem.path];

            if (editorArgs) {
                nodeSpawn(editorExecutable, [editorArgs], {
                    detached: true,
                    shell: false
                });
            } else {
                alert('need to configure Editor first!');
            }
        }
    },
    itemOpenDuplicates = new gui.MenuItem({
        label: 'Show Duplicates in Explorer (0)',
        click: HANDLERS.ITEM_OPEN_DUPLICATES
    }),
    itemOpenInEditor = new gui.MenuItem({
        label: 'Open in Editor',
        click: HANDLERS.ITEM_OPEN_IN_EDITOR
    });

menu.append(new gui.MenuItem({
    label: 'Play file',
    click: HANDLERS.ITEM_PLAY
}));
menu.append(new gui.MenuItem({type: 'separator'}));
menu.append(new gui.MenuItem({
    label: 'Rename selected...',
    click: HANDLERS.ITEM_RENAME_FILES
}));
menu.append(new gui.MenuItem({
    label: 'Delete selected...',
    click: HANDLERS.ITEM_DELETE_FILES
}));
menu.append(new gui.MenuItem({type: 'separator'}));
menu.append(new gui.MenuItem({
    label: 'Open in default application',
    click: HANDLERS.ITEM_OPEN_IN_APPLICATION
}));
menu.append(itemOpenInEditor);
menu.append(new gui.MenuItem({
    label: 'Configure Editor...',
    click: HANDLERS.CONFIGURE_EDITOR
}));
menu.append(new gui.MenuItem({type: 'separator'}));
menu.append(new gui.MenuItem({
    label: 'Show in Explorer',
    click: HANDLERS.ITEM_SHOW_IN_FOLDER
}));
menu.append(itemOpenDuplicates);
menu.append(new gui.MenuItem({type: 'separator'}));
menu.append(new gui.MenuItem({
    label: 'Path in Source <--',
    click: HANDLERS.ITEM_SHOW_PATH_IN_SOURCE
}));
menu.append(new gui.MenuItem({
    label: 'Path in Target -->',
    click: HANDLERS.ITEM_SHOW_PATH_IN_TARGET
}));
menu.append(new gui.MenuItem({type: 'separator'}));
menu.append(new gui.MenuItem({
    label: 'Select all',
    click: function() {
        source.selectAll();
    }
}));




function FileContextMenu() {
    this.show = function(e) {
        Helper.assertObject(e, 'missing e for FileContextMenu.show()');
        e.preventDefault();
        menu.popup(e.originalEvent.x, e.originalEvent.y);
    }
}

module.exports = {getInstance};