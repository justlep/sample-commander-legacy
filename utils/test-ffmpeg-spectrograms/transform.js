
const IMAGE = './sweep-linear.wav-hann.png';
const IMAGE2 = 'testbild.png';
const TARGET_IMAGE = 'sweep-linear.wav-hann-logscale.png';
const sharp = require('sharp');
const CHANNELS = 3;

let metadata,
    sharpImage;

sharpImage = sharp(IMAGE);
sharpImage.metadata().then(meta => {
    metadata = meta;

    if (meta.channels !== CHANNELS) {
        console.error('Expected image with %s color channels, but found %s', CHANNELS, meta.channels);
        process.exit(1);
    }

    return sharpImage.flip().raw().toBuffer();

}).then(sourcePixelBuffer => {

    const W = metadata.width,
        H = metadata.height,
        H_MINUS_1 = H - 1,
        BYTES_PER_LINE = W * CHANNELS,
        SOURCE_LINES_AND_WEIGHT = new Array(H).fill(0).map( (_foo, y) => {
            let perc = y / H_MINUS_1,
                fIdem = perc, // 1:1
                f2Pow = Math.pow(2, perc),
                fSquared = perc * perc,
                f = fSquared,
                line = f * H_MINUS_1,
                mod = line % 1;

            console.log('y=%s --> perc=%s --> f=%s --> line=%s', y, perc, f, line);

            return {
                y: y,
                line: line,
                line1ByteIndex: Math.floor(line) * BYTES_PER_LINE,
                weight1: 1 - mod,
                line2ByteIndex: Math.min(H_MINUS_1, Math.ceil(line)) * BYTES_PER_LINE,
                weight2: (line <= H_MINUS_1) ? mod : 0
            };
        });

    let targetPixelBuffer = Buffer.from(sourcePixelBuffer);

    // console.dir(SOURCE_LINES_AND_WEIGHT);

    for (let y = 0, targetByteIndex = 0; y < H; y++) {
        let source = SOURCE_LINES_AND_WEIGHT[y],
            xByteOffs = 0;

        // console.dir(source);

        while (xByteOffs < BYTES_PER_LINE) {
            let indexP1 = source.line1ByteIndex + xByteOffs,
                indexP2 = source.line2ByteIndex + xByteOffs,
                p1 = sourcePixelBuffer[indexP1],
                p2 = sourcePixelBuffer[indexP2],
                weightedP1 = source.weight1 * p1,
                weightedP2 = source.weight2 * p2,
                targetPixel = Math.min(255, Math.round(weightedP1 + weightedP2));

            targetPixelBuffer[targetByteIndex] = targetPixel;

            xByteOffs++;
            targetByteIndex++;
        }
    }

    sharp(targetPixelBuffer, {
        raw: {
            width: W,
            height: H,
            channels: metadata.channels
        }
    })
    .flip()
    .ignoreAspectRatio()
    .withoutEnlargement()
    .resize(W, Math.round(H/2))
    .png()
    .toFile(TARGET_IMAGE, (err, info) => {
        if (err) {
            console.error('Failed to save image: ' + err);
        } else {
            console.log('Saved ' + TARGET_IMAGE);
        }
    });

}).catch(err => {
    console.error(err);
    process.exit(1);
});
