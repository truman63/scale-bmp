import parseBmp from "./parseBMP.js"

const writeColor = (red, green, blue, text = "██") => {
    process.stdout.write(`\x1b[38;2;${red};${green};${blue}m${text}\x1b[0m`)
}

export default async (uint8Array) => {
    const { fileHeader, infoHeader, body } = await parseBmp(uint8Array);

    const width = infoHeader.width;
    const height = infoHeader.height;
    const bytesPerPixel = infoHeader.bitCount / 8;

    for (let y = height - 1; y >= 0; y--) {
        const start = y * width * bytesPerPixel

        for (let x = 0; x < width; x++) {
            const i = start + x * bytesPerPixel

            const r = body[i + 2]
            const g = body[i + 1]
            const b = body[i]

            writeColor(r, g, b);
        }
        console.log();
    }
}