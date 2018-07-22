
'use strict';

const {Helper, gui} = require('./common'),
    Config = require('./Config'),
    DialogManager = require('./DialogManager'),
    DeleteFilesDialog = require('./dialogs/DeleteFilesDialog'),
    Spectrograms = require('./Spectrograms'),
    menu = new gui.Menu(),
    config = Config.getInstance();

let source = null,
    instance = null,
    getInstance = function(sourceWatcher) {
        Helper.assertObject(sourceWatcher, 'invalid sourceWatcher in SourceContextMenu.getInstance');
        if (!instance) {
            instance = new SourceContextMenu();
        }
        source = sourceWatcher;
        return instance;
    },
    isRecursive = new gui.MenuItem({
        label: 'Recurse subdirectories',
        type: 'checkbox',
        click: function() {
            config.recurseSource(!config.recurseSource());
        }
    }),
    filesizeItem = new gui.MenuItem({
        type: 'checkbox',
        label: 'Show filesize',
        click: function() {
            config.showFilesize(!config.showFilesize());
        }
    }),
    cdateItem = new gui.MenuItem({
        type: 'checkbox',
        label: 'Show Creation Date',
        click: function() {
            config.showCDate(!config.showCDate());
        }
    }),
    autoplayItem = new gui.MenuItem({
        type: 'checkbox',
        label: 'Autoplay',
        click: function() {
            config.autoplay(!config.autoplay());
        }
    }),
    tooltipItem = new gui.MenuItem({
        type: 'checkbox',
        label: 'Show path tooltip',
        click: function() {
            config.filePathTooltip(!config.filePathTooltip());
        }
    }),
    updateRecurseItem = function() {
        isRecursive.checked = config.recurseSource();
    },
    updateFilesizeItem = function() {
        filesizeItem.checked = config.showFilesize();
    },
    updateCDateItem = function() {
        cdateItem.checked = config.showCDate();
    },
    updateAutoplayItem = function() {
        autoplayItem.checked = config.autoplay();
    },
    updateTooltipItem = function() {
        tooltipItem.checked = config.filePathTooltip();
    },
    lastPathMenu = new gui.Menu();


menu.append(new gui.MenuItem( {
    label: 'Recent paths',
    submenu: lastPathMenu
}));
menu.append(new gui.MenuItem({
    label: 'Parent directory',
    click: () => source.gotoParent()
}));
menu.append(new gui.MenuItem({type: 'separator'}));
menu.append(new gui.MenuItem({
    label: 'Show in Explorer',
    click: function() {
        gui.Shell.openItem(source.path());
    }
}));
menu.append(new gui.MenuItem({type: 'separator'}));
menu.append(new gui.MenuItem({
    label: 'Delete project files...',
    click: function() {
        DeleteFilesDialog.getInstanceForDeleteProjectFiles({
            source: source
        }).show();
    }
}));

menu.append(new gui.MenuItem({type: 'separator'}));

let configSubMenu = new gui.Menu();
configSubMenu.append(new gui.MenuItem({
    label: 'Configure ffmpeg...',
    click: () => config.openFfmpegExecutableFileDialog()
}));
configSubMenu.append(new gui.MenuItem({
    label: 'Show app config file in Explorer',
    click: config.showConfigFileInExplorer
}));
menu.append(new gui.MenuItem({
    label: 'Config',
    submenu: configSubMenu
}));

menu.append(new gui.MenuItem({type: 'separator'}));
menu.append(isRecursive);
menu.append(filesizeItem);
menu.append(cdateItem);
menu.append(tooltipItem);
menu.append(autoplayItem);
menu.append(new gui.MenuItem({type: 'separator'}));
menu.append(new gui.MenuItem({
    label: 'Show same path in Target -->',
    click: function() {
        Helper.notify(Helper.EVENTS.CHANGE_TARGET_PATH, source.path());
    }
}));
menu.append(new gui.MenuItem({
    label: 'Swap with Target <->',
    click: function() {
        Helper.notify(Helper.EVENTS.SWAP_PATHS);
    }
}));

let onPathItemClick = function() {
    let newPath = this.label;
    source.path(newPath);
};

function updateRecentPaths() {
    for (let i=0; i<Config.MAX_RECENT_PATHS; i++) {
        let item = lastPathMenu.items[i],
            path = config.lastSourcePaths()[i];
        if (!item) {
            item = new gui.MenuItem({
                label: '',
                click: onPathItemClick
            });
            lastPathMenu.append(item);
        }

        item.label = path || '<empty>';
        item.enabled = !!path;
    }

    if (lastPathMenu.items.length < Config.MAX_RECENT_PATHS + 2) {
        lastPathMenu.append(new gui.MenuItem({
            type: 'separator'
        }));
        lastPathMenu.append(new gui.MenuItem({
            label: 'Clear all',
            click: function() {
                config.lastSourcePaths.removeAll();
            }
        }));
    }
}


/**
 * @constructor
 */
function SourceContextMenu() {
    config.recurseSource.subscribe(updateRecurseItem);
    updateRecurseItem();
    config.showFilesize.subscribe(updateFilesizeItem);
    updateFilesizeItem();
    config.showCDate.subscribe(updateCDateItem);
    updateCDateItem();
    config.autoplay.subscribe(updateAutoplayItem);
    updateAutoplayItem();
    config.filePathTooltip.subscribe(updateTooltipItem);
    updateTooltipItem();
    config.lastSourcePaths.subscribe(updateRecentPaths);
    updateRecentPaths();

    this.show = function(e) {
        Helper.assertObject(e, 'missing e for SourceContextMenu.show()');
        e.preventDefault();
        menu.popup(e.originalEvent.x, e.originalEvent.y);
    }
}

module.exports = {getInstance};