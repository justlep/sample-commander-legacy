'use strict';

define(['AMD/Helper', 'AMD/DialogManager', 'AMD/Config', 'AMD/dialogs/DeleteFilesDialog'],
    function(Helper, DialogManager, Config, DeleteFilesDialog) {

    var gui = require('nw.gui'),
        menu = new gui.Menu(),
        config = Config.getInstance(),
        source = null,
        instance = null,
        getInstance = function(sourceWatcher) {
            Helper.assertObject(sourceWatcher, 'invalid sourceWatcher in SourceContextMenu.getInstance');
            if (!instance) {
                instance = new SourceContextMenu();
            }
            source = sourceWatcher;
            return instance;
        },
        asListItem = new gui.MenuItem({
            label: 'Show as floating list',
            type: 'checkbox',
            click: function() {
                config.floatingList(!config.floatingList());
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
        updateListItem = function() {
            asListItem.checked = config.floatingList();
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
    menu.append(new gui.MenuItem({type: 'separator'}));
    menu.append(new gui.MenuItem({
        label: 'Show in Explorer',
        click: function() {
            gui.Shell.openItem(source.path());
        }
    }));
    menu.append(new gui.MenuItem({type: 'separator'}))
    menu.append(new gui.MenuItem({
        label: 'Delete project files...',
        click: function() {
            DeleteFilesDialog.getInstanceForDeleteProjectFiles({
                source: source
            }).show();
        }
    }));
    menu.append(new gui.MenuItem({type: 'separator'}))
    menu.append(asListItem);
    menu.append(filesizeItem);
    menu.append(cdateItem);
    menu.append(tooltipItem);
    menu.append(autoplayItem);
    menu.append(new gui.MenuItem({type: 'separator'}))
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

    var onPathItemClick = function() {
        var newPath = this.label;
        source.path(newPath);
    };

    function updateRecentPaths() {
        for (var i=0; i<Config.MAX_RECENT_PATHS; i++) {
            var item = lastPathMenu.items[i],
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
        config.floatingList.subscribe(updateListItem);
        updateListItem();
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

    return {
        getInstance: getInstance
    };
});