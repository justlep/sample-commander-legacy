
'use strict';

let {Helper, gui} = require('./common'),
    Config = require('./Config'),
    DialogManager = require('./DialogManager'),
    menu = new gui.Menu(),
    config = Config.getInstance(),
    target = null,
    instance = null,
    getInstance = function(targetWatcher) {
        Helper.assertObject(targetWatcher, 'invalid targetWatcher in TargetContextMenu.getInstance');
        if (!instance) {
            instance = new TargetContextMenu();
        }
        target = targetWatcher;
        return instance;
    },
    maxDirItem = new gui.MenuItem({
        type: 'checkbox',
        label: 'Directory limit...',
        checked: true,
        click: function() {
            let oldValue = config.maxDirs() || '',
                newValue = false;

            while (!newValue) {
                newValue = prompt('Set maximum number of directories to load', oldValue || newValue || '');
                if (newValue === null) {
                    return;
                }
                newValue = parseInt(newValue, 10);
                if (newValue && newValue > 0) {
                    config.maxDirs(newValue);
                    return;
                }
            }
        }
    }),
    lastPathMenu = new gui.Menu();


menu.append(new gui.MenuItem({
    label: 'One up',
    click: () => target.gotoParent()
}));
menu.append(new gui.MenuItem( {
    label: 'Recent paths',
    submenu: lastPathMenu
}));
menu.append(new gui.MenuItem({type: 'separator'}))
menu.append(new gui.MenuItem({
    label: 'Show in Explorer',
    click: function() {
        gui.Shell.openItem(target.path());
    }
}));
menu.append(new gui.MenuItem({type: 'separator'}))
menu.append(maxDirItem);
menu.append(new gui.MenuItem({type: 'separator'}))
menu.append(new gui.MenuItem({
    label: '<-- Show same path in Source',
    click: function() {
        Helper.notify(Helper.EVENTS.CHANGE_SOURCE_PATH, target.path());
    }
}));
menu.append(new gui.MenuItem({
    label: '<-> Swap with Source',
    click: function() {
        Helper.notify(Helper.EVENTS.SWAP_PATHS);
    }
}));

let onPathItemClick = function () {
    let newPath = this.label;
    target.path(newPath);
};

function updateRecentPaths() {
    for (let i=0; i<Config.MAX_RECENT_PATHS; i++) {
        let item = lastPathMenu.items[i],
            path = config.lastTargetPaths()[i];
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
                config.lastTargetPaths.removeAll();
            }
        }));
    }
}

function TargetContextMenu() {
    config.lastTargetPaths.subscribe(updateRecentPaths);
    updateRecentPaths();

    this.show = function(e) {
        Helper.assertObject(e, 'missing e for TargetContextMenu.show()');
        e.preventDefault();
        menu.popup(e.originalEvent.x, e.originalEvent.y);
    }
}

module.exports = {getInstance};