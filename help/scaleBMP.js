import parseBmp from "./parseBMP.js"
import fs from "fs/promises";
import path from "path";

export default async (uint8Array, newWidth, newHeight) => {
    const { fileHeader, infoHeader, body } = await parseBmp(uint8Array);
    const bytesPerPixel = infoHeader.bitCount / 8;

    const sizeHeader = 54;
    const newRowSize = Math.ceil((newWidth * bytesPerPixel) / 4) * 4;
    const sizePixelsWithPadding = newRowSize * newHeight;
    const newBuffer = sizeHeader + sizePixelsWithPadding;

    const newIint8Array = new Uint8Array(newBuffer);
    const view = new DataView(newIint8Array.buffer, newIint8Array.byteOffset, newIint8Array.byteLength);

    newIint8Array[0] = fileHeader.signature.charCodeAt(0);
    newIint8Array[1] = fileHeader.signature.charCodeAt(1);

    view.setUint32(2, newBuffer, true);
    view.setUint16(6, fileHeader.reserved1, true);
    view.setUint16(8, fileHeader.reserved2, true);
    view.setUint32(10, sizeHeader, true);

    view.setUint32(14, infoHeader.headerSize, true);
    view.setInt32(18, newWidth, true);
    view.setInt32(22, newHeight, true);
    view.setUint16(26, infoHeader.planes, true);
    view.setUint16(28, infoHeader.bitCount, true);
    view.setUint32(30, infoHeader.compression, true);
    view.setUint32(34, sizePixelsWithPadding, true);
    view.setInt32(38, infoHeader.xPixelsPerMeter, true);
    view.setInt32(42, infoHeader.yPixelsPerMeter, true);
    view.setUint32(46, infoHeader.colorsUsed, true);
    view.setUint32(50, infoHeader.colorsImportant, true);

    const oldWidth = infoHeader.width;
    const oldHeight = Math.abs(infoHeader.height);

    const getOldPixel = (x, y) => {
        const index = (y * oldWidth + x) * bytesPerPixel;
        return {
            B: body[index],
            G: body[index + 1],
            R: body[index + 2]
        };
    };

    for (let yNew = 0; yNew < newHeight; yNew++) {
        const yOldExact = oldHeight > 1 ? (yNew * (oldHeight - 1)) / (newHeight - 1) : 0;
        const yTop = Math.floor(yOldExact);
        const yBottom = Math.min(yTop + 1, oldHeight - 1);
        const weightBottom = yOldExact - yTop;
        const weightTop = 1 - weightBottom;

        const newRowStart = sizeHeader + (yNew * newRowSize);

        for (let xNew = 0; xNew < newWidth; xNew++) {
            const xOldExact = oldWidth > 1 ? (xNew * (oldWidth - 1)) / (newWidth - 1) : 0;
            const xLeft = Math.floor(xOldExact);
            const xRight = Math.min(xLeft + 1, oldWidth - 1);
            const weightRight = xOldExact - xLeft;
            const weightLeft = 1 - weightRight;

            const pTopLeft = getOldPixel(xLeft, yTop);
            const pTopRight = getOldPixel(xRight, yTop);
            const pBottomLeft = getOldPixel(xLeft, yBottom);
            const pBottomRight = getOldPixel(xRight, yBottom);

            const bMixed = Math.round(
                (pTopLeft.B * weightLeft + pTopRight.B * weightRight) * weightTop +
                (pBottomLeft.B * weightLeft + pBottomRight.B * weightRight) * weightBottom
            );
            const gMixed = Math.round(
                (pTopLeft.G * weightLeft + pTopRight.G * weightRight) * weightTop +
                (pBottomLeft.G * weightLeft + pBottomRight.G * weightRight) * weightBottom
            );
            const rMixed = Math.round(
                (pTopLeft.R * weightLeft + pTopRight.R * weightRight) * weightTop +
                (pBottomLeft.R * weightLeft + pBottomRight.R * weightRight) * weightBottom
            );

            const pxNewIndex = newRowStart + (xNew * bytesPerPixel);

            newIint8Array[pxNewIndex] = bMixed;
            newIint8Array[pxNewIndex + 1] = gMixed;
            newIint8Array[pxNewIndex + 2] = rMixed;
        }
    }

    const projectRoot = process.cwd();
    await fs.mkdir(path.join(projectRoot, "dist"), { recursive: true });
    await fs.writeFile(path.join(projectRoot, "dist", "image.bmp"), newIint8Array);

    return newIint8Array;
}
