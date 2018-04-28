/**
 * @typedef {Object} LinesAndWeightsObject
 * @property {number} line1ByteIndex
 * @property {number} weight1
 * @property {number} line2ByteIndex
 * @property {number} weight2
 */

'use strict';

const CHANNELS = 4,
    nodeFs = require('fs');

let _sourceLinesAndWeightsCache_byHeight = {},
    /**
     * @param {number} width
     * @param {number} height
     * @return {LinesAndWeightsObject[]}
     */
    getSourceLinesAndWeightForWidthandHeight = function(width, height){
        const BYTES_PER_LINE = width * CHANNELS,
            KEY = width + '_' + height,
            FSQUARD_OFFSET = 0.05,
            FSQUARED_OFFSET_SQUARE = Math.pow(1 + FSQUARD_OFFSET, 2);

        // little offset for the squared version, added since
        // x^2 for x < 0.05 is extremely small, resulting in silly repetition patterns at the lower bottom of the spectrogram
        // online graph plotter: https://rechneronline.de/funktionsgraphen/

        let linesAndWeights = _sourceLinesAndWeightsCache_byHeight[KEY] || [];

        if (!linesAndWeights.length) {
            for (let y = 1; y <= height; y++) {
                let perc = y / height,
                    fSquared = perc * perc,                                                 // x^2 -> sqrt(x) scale
                    fSquaredCorrected = Math.pow(perc + FSQUARD_OFFSET, 2) / FSQUARED_OFFSET_SQUARE,
                    //fEHochX = (Math.pow(Math.E, perc * 2) - 1) / (Math.E * Math.E - 1),   // e^x -> ln(x) scale
                    //fTwoHochX = (Math.pow(2, perc * 2) - 1) / 3,                          // 2^x -> logx(x) scale
                    //fLinear = perc,                                                       // 1:1
                    f = fSquaredCorrected,
                    line = Math.max(1, Math.min(f * height, height)),
                    lineSafeZeroBased = line - 1,
                    mod = line % 1;

                // console.log('y=%s --> perc=%s --> f=%s --> line=%s', y, perc, f, line);

                linesAndWeights[y - 1] = {
                    line1ByteIndex: Math.floor(lineSafeZeroBased) * BYTES_PER_LINE,
                    weight1: 1 - mod,
                    line2ByteIndex: Math.ceil(lineSafeZeroBased) * BYTES_PER_LINE,
                    weight2: (line <= height) ? mod : 0
                };
            }
            _sourceLinesAndWeightsCache_byHeight[KEY] = linesAndWeights;
        }
        return linesAndWeights;
    };


/**
 * @param {string} linearSpectroFile - path to spectrogram picture
 * @param {string} targetSpectroFile - path to new spectrogram with frequency axis converted to non-linear scale
 * @param {number} [newHeight] - defaults to the original one
 * @param {boolean} [deleteOriginalOnSuccess=false] if true and source and target files are different, the source
 *                                                  file will be deleted after successful conversion (and saving)
 * @return {Promise} resolves with the converted spectrogram's path
 */
function convertToNonLinearScale(linearSpectroFile, targetSpectroFile, newHeight, deleteOriginalOnSuccess) {
    return new Promise( (resolve, reject) => {
        let img = new Image();
        img.onerror = function() {
            reject('Unable to load image: ' + linearSpectroFile);
        };

        img.onload = function() {
            const W = img.width,
                H = img.height,
                BYTES_PER_LINE = W * CHANNELS;

            if (H % 2) {
                reject('Image height must be even, but is ' + H);
                return;
            }

            let canvas = document.createElement('canvas'),
                targetCanvas = document.createElement('canvas'),
                ctx,
                mirrorData = function(data) {
                    let index1 = BYTES_PER_LINE * H / 2 - 1,
                        index2 = index1 + BYTES_PER_LINE;

                    for (let y = H / 2; y > 0; y--) {
                        for (let x = 0, tmp; x < BYTES_PER_LINE; x++, index1--, index2--) {
                            tmp = data[index2];
                            data[index2] = data[index1];
                            data[index1] = tmp;
                        }
                        index2 += 2 * BYTES_PER_LINE;
                    }
                };

            canvas.width = W;
            canvas.height = H;
            targetCanvas.width = W;
            targetCanvas.height = H;

            ctx = canvas.getContext('2d');
            ctx.translate(0, H);
            ctx.scale(1, -1);
            ctx.drawImage(img, 0, 0);

            let imageData = ctx.getImageData(0, 0, W, H),
                data = imageData.data,
                targetCtx = targetCanvas.getContext('2d'),
                targetImageData = targetCtx.getImageData(0, 0, W, H),
                targetData = targetImageData.data,
                sourceLinesAndWeights = getSourceLinesAndWeightForWidthandHeight(W, H);

            // non-linear scaling here
            for (let y = 0, targetByteIndex = 0, source, xByteOffs; y < H; y++) {
                source = sourceLinesAndWeights[y];
                xByteOffs = 0;

                while (xByteOffs < BYTES_PER_LINE) {
                    let indexP1 = source.line1ByteIndex + xByteOffs,
                        indexP2 = source.line2ByteIndex + xByteOffs,
                        p1 = data[indexP1],
                        p2 = data[indexP2],
                        weightedP1 = source.weight1 * p1,
                        weightedP2 = source.weight2 * p2,
                        targetPixel = Math.min(255, Math.round(weightedP1 + weightedP2));

                    targetData[targetByteIndex] = targetPixel;

                    xByteOffs++;
                    targetByteIndex++;
                }
            }

            mirrorData(targetData);

            // in case we need to resize, anyway, we'll leave final mirroring to the resized version
            if (newHeight === H) {
                targetCtx.putImageData(targetImageData, 0, 0);

            } else {
                targetCtx.putImageData(targetImageData, 0, 0);
                // reuse the original canvas. Setting a new width auto-resets its context & image data
                canvas.height = newHeight;
                let ctx = canvas.getContext('2d'),
                    imageData = ctx.getImageData(0, 0, W, H),
                    data = imageData.data;

                ctx.scale(1, newHeight / H);
                let tmpImage = new Image();
                tmpImage.src = targetCanvas.toDataURL('image/png');
                ctx.drawImage(tmpImage, 0, 0);

                targetCanvas = canvas;
            }

            targetCanvas.toBlob(function(blob) {

                let fileReader = new FileReader();

                fileReader.onload  = function(/* progressEvent */) {
                    nodeFs.writeFile(targetSpectroFile, Buffer.from(this.result), function(err) {
                        if (err) {
                            reject(err);
                            return;
                        }

                        if (deleteOriginalOnSuccess && linearSpectroFile !== targetSpectroFile) {
                            console.log('Deleting linear spectrogram file: ' + linearSpectroFile);
                            nodeFs.unlinkSync(linearSpectroFile);
                        }

                        console.log('Finished writing spectrogram: ' + targetSpectroFile);
                        resolve(targetSpectroFile);
                    });
                };

                fileReader.onerror = () => reject('FileReader failed');
                fileReader.readAsArrayBuffer(blob);

            }, 'image/png');
        };

        img.src = linearSpectroFile;
    });
}



module.exports = convertToNonLinearScale;