import { Jimp } from "jimp";

export default async (pathIMG) => {
    try {
        const image = await Jimp.read(pathIMG);
        const bmpBuffer = await image.getBuffer('image/bmp');

        const uint8Array = new Uint8Array(
            bmpBuffer.buffer,
            bmpBuffer.byteOffset,
            bmpBuffer.byteLength
        );

        return uint8Array;
    } catch (e) {
        console.error(`Ошибка при конвертации файла ${pathIMG} `, e)
    }
}