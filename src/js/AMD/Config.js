
'use strict';

define(['knockout', 'underscore', 'jquery'], function(ko, _, $) {

    var nodePath = require('path'),
        execPath = process.execPath,
        isStandalone = /Synchronizer.exe$/.test(execPath),
        appPath = (isStandalone) ? nodePath.resolve(execPath, '..') : nodePath.resolve('.'),
        CONFIG_FILE = nodePath.resolve(appPath, 'config.json'),
        MAX_RECENT_PATHS = 10,
        MAX_RECENT_REPLACE_PATTERNS = 20,
        DEFAULT_PROJECT_FILE_PATTERN = '*.hprj',
        jsonfile = require('jsonfile'), // no module 'jsonfile'
        instance = null,
        getInstance = function() {
            if (!instance) {
                instance = new Config();
            }
            return instance;
        };

    // Open dev tools automatically if not run in standalone mode
    /*
    if (!isStandalone) {
        require('nw.gui').Window.get().showDevTools();
    }
    */

    /**
     *
     * @constructor
     */
    function Config() {

        var self = this,
            PROPERTIES_TO_PERSIST = [
                'sourcePath',
                'targetPath',
                'autoplay',
                'floatingList',
                'showFilesize',
                'showCDate',
                'maxDirs',
                'showSourcePaths',
                'lastSourcePaths',
                'lastTargetPaths',
                'filePathTooltip',
                'lastRenamePatterns',
                'projectFilePattern',
                'editorExecutablePath'
            ],
            writeConfig = function() {
                var configToWrite = {};
                _.each(PROPERTIES_TO_PERSIST, function(prop) {
                    if (_.isFunction(self[prop])) {
                        configToWrite[prop] = self[prop]();
                    }
                });

                try {
                    jsonfile.writeFileSync(CONFIG_FILE, configToWrite);
                    console.log('Config written to file "%s" -> %o', CONFIG_FILE, configToWrite);
                } catch (e) {
                    console.error('Unable to write config to file "%s",', CONFIG_FILE);
                }
            },
            initOnce = function() {
                // Load config OR use default one and persist it
                try {
                    var config = jsonfile.readFileSync(CONFIG_FILE);
                    console.log('Found config file "%s"', CONFIG_FILE);
                    _.each(config, function(val, key) {
                        if (_.contains(PROPERTIES_TO_PERSIST, key)) {
                            self[key](val);
                            console.log("Read prop from config file: %s -> %s", key, val);
                        }
                    });
                } catch (e) {
                    console.log('No config found.');
                    writeConfig();
                }

                self.sourcePath.subscribe(function(newPath) {
                    self.addLastSourcePath(newPath);
                });

                self.targetPath.subscribe(function(newPath) {
                    self.addLastTargetPath(newPath);
                });

                _.each(PROPERTIES_TO_PERSIST, function(prop) {
                    // assert isFunction(self[prop])
                    self[prop].subscribe(writeConfig);
                });
            };

        this.sourcePath = ko.observable(appPath);
        this.targetPath = ko.observable(appPath);
        this.autoplay = ko.observable(true);
        this.filePathTooltip = ko.observable(true);
        this.floatingList = ko.observable(true);
        this.showFilesize = ko.observable(true);
        this.showCDate = ko.observable(true);
        this.maxDirs = ko.observable(300);
        this.showSourcePaths = ko.observable(true);
        this.lastSourcePaths = ko.observableArray();
        this.lastTargetPaths = ko.observableArray();
        this.lastRenamePatterns = ko.observableArray();
        this.projectFilePattern = ko.observable(DEFAULT_PROJECT_FILE_PATTERN);
        this.editorExecutablePath = ko.observable('');

        this.openEditorExecutableFileDialog = function() {
            $('#editor-executable-file').trigger('click');
        };

        this.saveEditorExecutableFileDialog = function() {
            var filePath = $('#editor-executable-file').val();
            if (filePath) {
                this.editorExecutablePath(filePath);
            }
        };

        this.clearLastSourcePaths = function() {
            self.lastSourcePaths.removeAll();
        };
        this.clearLastTargetPaths = function() {
            self.lastTargetPaths.removeAll();
        };

        function addLastPath(obsArr, path) {
            if (_.contains(obsArr(), path)) {
                obsArr.remove(path);
            }
            obsArr.splice(0, 0, path);
            if (obsArr().length > MAX_RECENT_PATHS) {
                obsArr(obsArr.splice(0, MAX_RECENT_PATHS));
            }
        }

        this.addLastSourcePath = function(path) {
            addLastPath(self.lastSourcePaths, path);
        };
        this.addLastTargetPath = function(path) {
            addLastPath(self.lastTargetPaths, path);
        };

        this.addLastRenamePattern = function(pattern) {
            if (!pattern) {
                alert('no pattern');
                return;
            }
            var obsArr = self.lastRenamePatterns;
            if (_.contains(obsArr(), pattern)) {
                obsArr.remove(pattern);
            }
            obsArr.splice(0, 0, pattern);
            if (obsArr().length > MAX_RECENT_REPLACE_PATTERNS) {
                obsArr(obsArr.splice(0, MAX_RECENT_REPLACE_PATTERNS));
            }
        };

        initOnce();
    }

    return {
        getInstance: getInstance,
        MAX_RECENT_PATHS: MAX_RECENT_PATHS,
        MAX_RECENT_REPLACE_PATTERNS: MAX_RECENT_REPLACE_PATTERNS
    };
});