# Synchronizer
An application for copying .WAV files from a fieldrecorder and/or SD card to the harddisk.\
Based on NodeJS and Node-Webkit. Compileable to a standalone program (currently tested on Win7/64bit only),
but should easily be adjustable for Linux/Mac.

## Install

```sh
$ npm install
```

## Run locally (with developer tools enabled)
```sh
$ grunt runDebug
```

## Build standalone application (uncompressed)
```sh
$ grunt buildApp
```
## Build standalone application (with the .exe file compressed)
```sh
$ grunt buildAppCompressed
```

After either build task, the executable standalone program is located in 
* **target/Synchronizer/win64/** and/or
* **target/Synchronizer/win32/**  

## Screenshots (see ./doc/screenshots/)
The GUI with the SD card (=Source) on the left, and the sample collection folder (=Target) on the right.\
Files can be dragged to the right to open a copy/move dialog.\
Optionally, files can be hidden which either already **exist** or **not exist** in the Target. Duplicates are recognized no matter how deep within the Target subfolder structure they are or if they've been renamed.
![](https://raw.githubusercontent.com/justlep/synchronizer/master/doc/screenshots/dragging.png)
Renaming files. Allows to search/replace inside the filenames, add sequence numbers etc.
![](https://raw.githubusercontent.com/justlep/synchronizer/master/doc/screenshots/rename.png)
Drag files to the target, then decide whether to copy or move them.
![](https://raw.githubusercontent.com/justlep/synchronizer/master/doc/screenshots/copymove.png)
