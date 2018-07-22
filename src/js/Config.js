
'use strict';

let instance;

const {ko, _, $, gui} = require('./common'),
    nodePath = require('path'),
    execPath = process.execPath,
    isStandalone = /SampleCommander.exe$/.test(execPath),
    appPath = (isStandalone) ? nodePath.resolve(execPath, '..') : nodePath.resolve('.'),
    CONFIG_FILE = nodePath.resolve(appPath, 'config.json'),
    MAX_RECENT_PATHS = 10,
    MAX_RECENT_REPLACE_PATTERNS = 20,
    DEFAULT_PROJECT_FILE_PATTERN = '*.hprj',
    jsonfile = require('jsonfile'), // no module 'jsonfile'
    getInstance = function() {
        if (!instance) {
            instance = new Config();
        }
        return instance;
    };

// Open dev tools automatically if not run in standalone mode
/*
if (!isStandalone) {
    gui.Window.get().showDevTools();
}
*/

/**
 *
 * @constructor
 */
function Config() {

    let self = this,
        PROPERTIES_TO_PERSIST = [
            'sourcePath',
            'targetPath',
            'autoplay',
            'recurseSource',
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
            'editorExecutablePath',
            'ffmpegExecutablePath',
            'showTargetColumn',
            'spectrogramHeight'
        ],
        writeConfig = function() {
            resetFileInputs();

            let configToWrite = {};
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
                let config = jsonfile.readFileSync(CONFIG_FILE);
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
        },
        resetFileInputs = () => document.getElementById('filesForm').reset();

    this.sourcePath = ko.observable(appPath);
    this.targetPath = ko.observable(appPath);
    this.recurseSource = ko.observable(true);
    this.autoplay = ko.observable(true);
    this.filePathTooltip = ko.observable(true);
    this.floatingList = ko.observable(true);
    this.showFilesize = ko.observable(true);
    this.showTargetColumn = ko.observable(true);
    this.showCDate = ko.observable(true);
    this.maxDirs = ko.observable(300);
    this.showSourcePaths = ko.observable(true);
    this.lastSourcePaths = ko.observableArray();
    this.lastTargetPaths = ko.observableArray();
    this.lastRenamePatterns = ko.observableArray();
    this.projectFilePattern = ko.observable(DEFAULT_PROJECT_FILE_PATTERN);
    this.editorExecutablePath = ko.observable('');
    this.ffmpegExecutablePath = ko.observable('');
    this.spectrogramHeight = ko.observable(100);

    const J_FFMPEG_EXECUTABLE_FILE = $('#ffmpeg-executable-file'),
          J_EDITOR_EXECUTABLE_FILE = $('#editor-executable-file');


    this.openFfmpegExecutableFileDialog = function() {
        alert('Please select the ffmpeg executable (e.g. ffmpeg.exe on Windows)');
        J_FFMPEG_EXECUTABLE_FILE.trigger('click');
    };

    this.saveFfmpegExecutableFileDialog = function() {
        let filePath = J_FFMPEG_EXECUTABLE_FILE.val();
        resetFileInputs();
        if (filePath && /ffmpeg/.test(filePath)) {
            self.ffmpegExecutablePath(filePath);
        }
    };

    this.openEditorExecutableFileDialog = function() {
        alert('Select the executable file of your sample editor (e.g. audacity.exe on Windows)');
        J_EDITOR_EXECUTABLE_FILE.trigger('click');
    };

    this.showConfigFileInExplorer = function() {
        gui.Shell.showItemInFolder(CONFIG_FILE);
    };

    this.saveEditorExecutableFileDialog = function() {
        let filePath = J_EDITOR_EXECUTABLE_FILE.val();
        resetFileInputs();
        if (filePath) {
            self.editorExecutablePath(filePath);
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
        let obsArr = self.lastRenamePatterns;
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

module.exports = {
    getInstance,
    MAX_RECENT_PATHS,
    MAX_RECENT_REPLACE_PATTERNS
};