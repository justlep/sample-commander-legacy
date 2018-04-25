
const audioFilenames = ['sweep.wav', 'bing.wav', 'sweep-linear.wav'];
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
let windowFuncs = ['hann','lanczos'];


let nodeExec = require('child_process').execSync;

audioFilenames.forEach(audioFilename => {
	windowFuncs.forEach(winFunc => {
		let spectroImgFilename = audioFilename + '-' + winFunc + '.png';
		let cmd = ffmpegExe + ` -y -i "${audioFilename}" -lavfi showspectrumpic=s=800x400:color=fire:legend=0:win_func=${winFunc},format=yuv444p "${spectroImgFilename}"`;
		nodeExec(cmd);
	});
});