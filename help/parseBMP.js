export default async (uint8Array) => {
    const view = new DataView(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength);

    const fileHeader = {
        signature: String.fromCharCode(uint8Array[0], uint8Array[1]),
        fileSize: view.getUint32(2, true),
        reserved1: view.getUint16(6, true),
        reserved2: view.getUint16(8, true),
        pixelOffset: view.getUint32(10, true),
    };

    const infoHeader = {
        headerSize: view.getUint32(14, true),
        width: view.getInt32(18, true),
        height: view.getInt32(22, true),
        planes: view.getUint16(26, true),
        bitCount: view.getUint16(28, true),
        compression: view.getUint32(30, true),
        imageSize: view.getUint32(34, true),
        xPixelsPerMeter: view.getInt32(38, true),
        yPixelsPerMeter: view.getInt32(42, true),
        colorsUsed: view.getUint32(46, true),
        colorsImportant: view.getUint32(50, true),
    };

    const width = infoHeader.width;
    const height = Math.abs(infoHeader.height);
    const pixelOffset = fileHeader.pixelOffset;

    const bytesPerPixel = infoHeader.bitCount / 8;
    const body = new Uint8Array(width * height * bytesPerPixel);

    let rawCursor = pixelOffset;
    let cleanCursor = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            body[cleanCursor] = uint8Array[rawCursor];
            body[cleanCursor + 1] = uint8Array[rawCursor + 1];
            body[cleanCursor + 2] = uint8Array[rawCursor + 2];

            cleanCursor += bytesPerPixel;
            rawCursor += bytesPerPixel;
        }

        const remainder = (width * bytesPerPixel) % 4;
        if (remainder !== 0) {
            rawCursor += (4 - remainder);
        }
    }

    return {
        fileHeader,
        infoHeader,
        body
    };
};
