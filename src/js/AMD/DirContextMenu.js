'use strict';

define(['AMD/Helper', 'AMD/DialogManager', 'AMD/dialogs/RenameDirDialog', 'AMD/dialogs/CreateSubdirDialog'],
    function(Helper, DialogManager, RenameDirDialog, CreateSubdirDialog) {

    var gui = require('nw.gui'),
        nodeFs = require('fs'),
        nodePath = require('path'),
        menu = new gui.Menu(),
        target = null,
        currentDirItem = null,
        instance = null,
        getInstance = function(targetWatcher, dirItem) {
            Helper.assertObject(targetWatcher, 'invalid targetWatcher in DirContextMenu.getInstance');
            Helper.assertObjectOrEmpty(dirItem, 'invalid dirItem in DirContextMenu.getInstance');
            if (!instance) {
                instance = new DirContextMenu();
            }
            target = targetWatcher;
            currentDirItem = dirItem;
            return instance;
        },

        HANDLERS = {
            ITEM_DIR_RENAME: function() {
                RenameDirDialog.getInstance(currentDirItem, function(newName) {
                    try {
                        var oldPath = currentDirItem.path,
                            newPath = nodePath.resolve(currentDirItem.path, '..', newName);
                        nodeFs.renameSync(oldPath, newPath);
                        currentDirItem.name = newName;
                        currentDirItem.path = newPath;
                        $('#' + currentDirItem.elemId).text(currentDirItem.name);
                        target.fixDirItemPathsAfterDirectoryRenamed(oldPath, newPath);
                        target.sortDirectories();
                        DialogManager.getInstance().reset();
                    } catch (e) {
                        console.error('Could not rename directory', e);
                    }
                }).show();
            },
            ITEM_DIR_CREATE: function() {
                CreateSubdirDialog.getInstance(currentDirItem, function(newName) {
                    try {
                        var newPath = nodePath.resolve(currentDirItem.path, newName);
                        nodeFs.mkdirSync(newPath);

                        target.addSubdirectoryItem(newName, currentDirItem);
                        DialogManager.getInstance().reset();
                    } catch (e) {
                        console.error('Could not rename directory', e);
                    }
                }).show();
            },
            DIR_ITEM_OPEN_IN_EXPLORER: function() {
                var path = currentDirItem.path;
                gui.Shell.openItem(path);
            },
            DIR_ITEM_OPEN_IN_SOURCE: function() {
                Helper.notify(Helper.EVENTS.CHANGE_SOURCE_PATH, currentDirItem.path);
            }
        };

    menu.append(new gui.MenuItem({
        label: 'Create subdirectory...',
        click: HANDLERS.ITEM_DIR_CREATE
    }));
    menu.append(new gui.MenuItem({
        label: 'Rename directory...',
        click: HANDLERS.ITEM_DIR_RENAME
    }));
    menu.append(new gui.MenuItem({type: 'separator'}));
    menu.append(new gui.MenuItem({
        label: 'Open in Explorer',
        click: HANDLERS.DIR_ITEM_OPEN_IN_EXPLORER
    }));
    menu.append(new gui.MenuItem({type: 'separator'}));
    menu.append(new gui.MenuItem({
        label: '<-- in Source',
        click: HANDLERS.DIR_ITEM_OPEN_IN_SOURCE
    }));



    function DirContextMenu() {
        this.show = function(e) {
            Helper.assertObject(e, 'missing e for DirContextMenu.show()');
            e.preventDefault();
            menu.popup(e.originalEvent.x, e.originalEvent.y);
        }
    }

    return {
        getInstance: getInstance
    };
});