
'use strict';

const {Helper, gui} = require('./common'),
    Config = require('./Config'),
    DeleteFilesDialog = require('./dialogs/DeleteFilesDialog'),
    menu = new gui.Menu(),
    config = Config.getInstance();

/**
 * @param {String} label
 * @param {ko.observable} togglableObservable
 */
function createCheckboxMenuItem(label, togglableObservable) {
    let item = new gui.MenuItem({
        type: 'checkbox',
        label: label,
        click: togglableObservable.toggle,
        checked: togglableObservable()
    });
    togglableObservable.subscribe(isChecked => item.checked = isChecked);
    return item;
}

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
    click: () => gui.Shell.openItem(source.path())
}));
menu.append(new gui.MenuItem({type: 'separator'}));
menu.append(new gui.MenuItem({
    label: 'Delete project files...',
    click: () => DeleteFilesDialog.getInstanceForDeleteProjectFiles({source}).show()
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
menu.append(createCheckboxMenuItem('Recurse subdirectories', config.recurseSource));
menu.append(createCheckboxMenuItem('Show filesize', config.showFilesize));
menu.append(createCheckboxMenuItem('Show Creation Date', config.showCDate));
menu.append(createCheckboxMenuItem('Show path tooltip', config.filePathTooltip));
menu.append(createCheckboxMenuItem('Autoplay', config.autoplay));
menu.append(new gui.MenuItem({type: 'separator'}));
menu.append(new gui.MenuItem({
    label: 'Show same path in Target -->',
    click: () => Helper.notify(Helper.EVENTS.CHANGE_TARGET_PATH, source.path())
}));
menu.append(new gui.MenuItem({
    label: 'Swap with Target <->',
    click: () => Helper.notify(Helper.EVENTS.SWAP_PATHS)
}));

/**
 * @this {gui.MenuItem}
 */
let onPathItemClick = function() {
    let newPath = this.label;
    source.path(newPath);
}

function updateRecentPaths() {
    const _allPaths = config.lastSourcePaths();

    for (let i=0; i<Config.MAX_RECENT_PATHS; i++) {
        let item = lastPathMenu.items[i],
            path = _allPaths[i];

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
            click: () => config.lastSourcePaths.removeAll()
        }));
    }
}


/**
 * @constructor
 */
function SourceContextMenu() {
    config.lastSourcePaths.subscribe(updateRecentPaths);
    updateRecentPaths();

    this.show = (e) => {
        Helper.assertObject(e, 'missing e for SourceContextMenu.show()');
        e.preventDefault();
        menu.popup(e.originalEvent.x, e.originalEvent.y);
    };
}

module.exports = {getInstance};