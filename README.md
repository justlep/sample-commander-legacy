# Synchronizer
An application for copying .WAV file from a fieldrecorder and/or SD card to the harddisk.\
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

