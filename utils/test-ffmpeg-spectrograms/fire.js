
const audioFilenames = ['siren.wav']; // ['sweep.wav', 'bing.wav', 'sweep-linear.wav'];
const ffmpegExe = 'ffmpeg.exe';
const WINDOW_FUNCS = [
	 'rect'
	,'bartlett'
	,'hann'
	,'hanning'
	,'hamming'
	,'blackman'
	,'welch'
	,'flattop'
	,'bharris'
	,'bnuttall'
	,'bhann'
	,'sine'
	,'nuttall'
	,'lanczos'
	,'gauss'
	,'tukey'
	,'dolph'
	,'cauchy'
	,'parzen'
	,'poisson'];

// 
let windowFuncs = ['hann'];
let ampScales = ['lin','sqrt','cbrt','log','4thrt','5thrt'];

let nodeExec = require('child_process').execSync;

audioFilenames.forEach(audioFilename => {
    ampScales.forEach(ampScale => {
        windowFuncs.forEach(winFunc => {
            let spectroImgFilename = audioFilename + '-' + winFunc + '-' + ampScale + '.png';
            let cmd = ffmpegExe + ` -y -i "${audioFilename}" -lavfi showspectrumpic=s=800x800:color=fire:scale=${ampScale}:legend=0:win_func=${winFunc} "${spectroImgFilename}"`;
            nodeExec(cmd);
        });
    });
});