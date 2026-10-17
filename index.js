import path from "path";
import getBMP from "./help/getBMP.js"
import drawBMP from "./help/drawBMP.js"
import scaleBMP from "./help/scaleBMP.js";

const pathIMG = path.join(import.meta.dirname, "img", "image.png");
const uint8Array = await getBMP(pathIMG);

const scaleIMG = await scaleBMP(uint8Array, 50, 50);
drawBMP(scaleIMG);
