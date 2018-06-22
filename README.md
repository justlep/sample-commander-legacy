# LeP's Sample Commander [![Build Status](https://travis-ci.org/justlep/sample-commander.svg?branch=master)](https://travis-ci.org/justlep/sample-commander)
An application for browsing an audio sample collection and for copying/moving .WAV files from a fieldrecorder or SD card to the PC.
Based on NodeJS and Node-Webkit. Compileable to a standalone program (currently tested on Win7/64bit only),
but should easily be adjustable for Linux/Mac.

**Update April 2018**: can now display **spectrograms** for the .wav files (requires [ffmpeg](https://ffmpeg.org/download.html) being installed)
in 3 different sizes. Clicks on the spectrograms change the playback position.

![](https://raw.githubusercontent.com/justlep/sample-commander/master/doc/screenshots/overview.png)
With spectrograms (clickable to change the play position):
![](https://raw.githubusercontent.com/justlep/sample-commander/master/doc/screenshots/spectrogram-floating.png)

More screenshots in [doc/](./doc/)

## Download & Installation (prebuild for Windows 7)
A pre-compiled zip with the latest build can be 
[downloaded here](http://dl.justlep.net/sample-commander/SampleCommander-latest-Win64.zip) (approx. 65MB, unpacked ~150MB).
Just extract it anywhere you like and run `SampleCommander.exe`.

## Build manually using NodeJS 6+
If you have Nodejs installed, you can build the app yourself, starting with
```sh
$ npm install
```

#### Run locally (with developer tools enabled, optionally start watchers)
```sh
$ grunt runDebug
```

#### Run LESS/PUG watchers (auto-rebuild CSS/HTML when .less and .pug files change)
```sh
$ grunt watchLessAndPug
```

#### Build standalone application (uncompressed)
```sh
$ grunt buildApp
```
#### Build standalone application (with the .exe file compressed; win64 only)
```sh
$ grunt buildAppCompressed
```

After either build task, the executable standalone program is located in 
* **build/SampleCommander/\<platform>\/**

Build platforms are defined in the config section of package.json.
Allowed platforms: [`'win32', 'win64', 'osx32', 'osx64', 'linux32', 'linux64'`]  
See: https://github.com/nwjs/nw-builder

