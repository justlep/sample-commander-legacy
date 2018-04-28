
'use strict';

const MAX_AUDIOFILE_SIZE_FOR_SPECTROGRAMS_IN_BYTES = 600 * 1024 * 1024,
    {ko, Helper, _} = require('./common'),
    scaleSpectrogram = require('./scaleSpectrogram'),
    nodeFs = require('fs'),
    nodePath = require('path'),
    nodeExecFile = require('child_process').execFile,
    Config = require('./Config'),
    LINEAR_SPECTROGRAM_FORMAT = '800x800',
    FINAL_SPECTROGRAM_HEIGHT = 250,
    KEEP_LINEAR_SPECTRO = false;

/**
 * @param {string} audioFilename
 * @return string
 */
function getSpectroFilenameForAudioFilename(audioFilename) {
    return audioFilename.replace(/\.\w+$/i, '.spectro.png');
}
/**
 * @param {string} spectroFilename
 * @return string
 */
function getLinearSpectroFilenameForSpectroFilename(spectroFilename) {
    return spectroFilename.replace(/\.spectro\.png$/, '.spectro-lin.png');
}


let _instance;

/**
 * @param {ko.observableArray} files
 * @constructor
 */
function Spectrograms(files) {
    console.log(_instance);
    Helper.assert(!_instance, 'Only one instance of Spectrograms allowed');
    Helper.assert(ko.isObservable(files) && _.isArray(files()), 'Invalid files observable array for Spectrograms');
    _instance = this;

    this.hideSpectrograms = () => files().forEach(f => f.spectrogram(null));

    let config = Config.getInstance(),
        _spectrogramProcessQueue = ko.observableArray(),
        _isStopSpectroRequested = false,
        _processNextSpectrogram = () => {
            let {f, audioFilename, parentDirPath, spectroImgFilename, ffmpegExe} = _spectrogramProcessQueue()[0],
                linearSpectroFilename = getLinearSpectroFilenameForSpectroFilename(spectroImgFilename),
                args = [
                    '-y',
                    '-i',
                    audioFilename,
                    '-lavfi',
                    `showspectrumpic=s=${LINEAR_SPECTROGRAM_FORMAT}:color=fire:legend=0`,
                    linearSpectroFilename
                ],
                linearSpectroImgFilePath = nodePath.join(parentDirPath, linearSpectroFilename),
                scaledSpectroFilePath = nodePath.join(parentDirPath, spectroImgFilename);

            // console.log('cmd: ' + cmd);

            nodeExecFile(ffmpegExe, args, {
                cwd: parentDirPath,
                timeout: undefined // makes sense or not?
            }, (err, stdout, stderr) => {
                if (err) {
                    console.error('Failed to generate %s. Error is:\n%s', linearSpectroImgFilePath, stderr);
                } else {
                    // just overwrite the old one
                    scaleSpectrogram(linearSpectroImgFilePath, scaledSpectroFilePath, FINAL_SPECTROGRAM_HEIGHT, !KEEP_LINEAR_SPECTRO)
                        .then(filePath => {
                            console.log('spectrogram converted to log scale');
                            return filePath;
                        }).catch(err => {
                            console.error(err);
                            console.warn('Failed to convert spectrogram to log scale. Using linear version.');
                            return linearSpectroImgFilePath;
                        }).then(effectiveSpectroFilePath => {
                            if (!_isStopSpectroRequested) {
                                f.spectrogram(effectiveSpectroFilePath);
                            }
                        });
                }

                _spectrogramProcessQueue.shift();
                if (_isStopSpectroRequested) {
                    _spectrogramProcessQueue.removeAll();
                } else if (_spectrogramProcessQueue().length) {
                    setTimeout(_processNextSpectrogram, 50);
                }
            });
        };

    this.remainingSpectrogramsToProcess = ko.computed(() => _spectrogramProcessQueue().length);
    this.currentlyProcessedAudioFilename = ko.pureComputed(() => {
        let o = _spectrogramProcessQueue()[0];
        return o && o.audioFilename;
    });

    this.cancelSpectrogramProcessing = () => {
        _isStopSpectroRequested = true;
    };

    let _filterAudioFilesEligibleForSpectrogramCreation =
        (f) => f.isAudioFile && (f.filesize <= MAX_AUDIOFILE_SIZE_FOR_SPECTROGRAMS_IN_BYTES) && !f.spectrogram();

    this.showSpectrograms = () => {
        _isStopSpectroRequested = false;
        let ffmpegExe = config.ffmpegExecutablePath();

        if (!ffmpegExe) {
            alert('Need to set path to ffmpeg.exe first!');
            return;
        }

        if (this.remainingSpectrogramsToProcess()) {
            alert('Please wait until all pending spectrogram jobs have finished');
            return;
        }

        files().filter(_filterAudioFilesEligibleForSpectrogramCreation).forEach(f => {
            let audioFilename = f.filename,
                parentDirPath = nodePath.join(f.path, '..'),
                spectroImgFilename = getSpectroFilenameForAudioFilename(audioFilename),
                spectroImgFilePath = nodePath.join(parentDirPath, spectroImgFilename),
                stats,
                exists = false;

            try {
                stats = nodeFs.statSync(spectroImgFilePath);
                exists = stats.isFile();
            } catch (err) {
                // nothing
            }

            if (exists) {
                f.spectrogram(spectroImgFilePath);
            } else {
                _spectrogramProcessQueue.push({
                    f,
                    audioFilename,
                    parentDirPath,
                    spectroImgFilename,
                    ffmpegExe
                });
            }
        });

        if (this.remainingSpectrogramsToProcess()) {
            _processNextSpectrogram();
        }
    };

    this.isEnabled = ko.computed({
        read: ko.computed(() => files().find(f => f.spectrogram())),
        write: (enable) => {
            if (!config.ffmpegExecutablePath()) {
                alert('You must configure ffmpeg first, then click the SPEC button again.');
                config.openFfmpegExecutableFileDialog();
            } else if (enable) {
                this.showSpectrograms();
            } else {
                _isStopSpectroRequested = true;
                this.hideSpectrograms()
            }
        }
    }).extend({toggleable: true});

    this.displayedHeight = config.spectrogramHeight;

    this.displayedHeightOptions = [100, 200, 300];
}

/**
 * @return {Spectrograms} the instance if exists, otherwise throw error
 * @static
 */
Spectrograms.getExistingInstance = function() {
    Helper.assert(_instance, 'Called Spectrograms.getExistingInstance() when no instance exists');
    return _instance;
};

module.exports = Spectrograms;
