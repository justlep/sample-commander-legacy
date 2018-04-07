# Synchronizer [![Build Status](https://travis-ci.org/justlep/synchronizer.svg?branch=master)](https://travis-ci.org/justlep/synchronizer)
An application for browsing an audio sample collection and for synchronizing .WAV files from a fieldrecorder or SD card to the PC.
Based on NodeJS and Node-Webkit. Compileable to a standalone program (currently tested on Win7/64bit only),
but should easily be adjustable for Linux/Mac.

**Update April 2018**: can now generate & display spectrograms for the .wav files (requires [ffmpeg](https://ffmpeg.org/download.html) to be installed). Clicks on the spectrograms change the current play position.

![](https://raw.githubusercontent.com/justlep/synchronizer/master/doc/screenshots/overview.png)
With spectrograms (clickable to change the play position):
![](https://raw.githubusercontent.com/justlep/synchronizer/master/doc/screenshots/spectrogram-floating.png)


## Installation
A pre-compiled zip with the latest build can be 
[downloaded here](http://dl.justlep.net/synchronizer/Synchronizer-v1.0.8-Win64.zip) (approx. 65MB, unpacked ~150MB).
Just extract it somewhere and run `Synchronizer.exe`.

However, if you have Nodejs installed, you're free to build the app all by yourself.
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
* **build/Synchronizer/<platform>/**

Build platforms are defined in the config section of package.json.
Allowed platforms: ['win32', 'win64', 'osx32', 'osx64', 'linux32', 'linux64']
See: https://github.com/nwjs/nw-builder


## More Screenshots: (see [doc/](./doc/))
