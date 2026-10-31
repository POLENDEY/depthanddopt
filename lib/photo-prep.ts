"use client";

export type PhotoStyle = "white" | "raw";
export type PrepProgress = { text: string; percent: number };
export type PreparedPhoto = { file: File; width: number; height: number };

const outputSize = 2000;
const watermarkSrc = "/icon-512.png";

function context(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("This browser cannot edit images.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return ctx;
}

function blankCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

async function canvasFromBlob(blob: Blob, maxEdge = Infinity) {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = blankCanvas(bitmap.width * scale, bitmap.height * scale);
  context(canvas).drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the image."))), type, quality);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the watermark logo."));
    img.src = src;
  });
}

/** Shrinks the mask slightly and makes it fully solid, so no halo from the old background is left. */
function hardenAlpha(data: Uint8ClampedArray, width: number, height: number) {
  const alpha = new Uint8Array(width * height);
  for (let p = 0, i = 3; p < alpha.length; p++, i += 4) alpha[p] = data[i];
  const radius = 2;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let min = 255;
      for (let dy = -radius; dy <= radius && min > 0; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) {
          min = 0;
          break;
        }
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const value = nx < 0 || nx >= width ? 0 : alpha[ny * width + nx];
          if (value < min) min = value;
        }
      }
      const i = (y * width + x) * 4;
      const solid = min >= 96;
      data[i + 3] = solid ? 255 : 0;
      if (!solid) data[i] = data[i + 1] = data[i + 2] = 255;
    }
  }
}

function opaqueBounds(data: Uint8ClampedArray, width: number, height: number) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] <= 24) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  return maxX < 0 ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/** Smallest turn that lays a slightly tilted product flat. Round items are left alone. */
function levelDegrees(data: Uint8ClampedArray, width: number, height: number) {
  let count = 0;
  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumYY = 0;
  let sumXY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] < 40) continue;
      count++;
      sumX += x;
      sumY += y;
      sumXX += x * x;
      sumYY += y * y;
      sumXY += x * y;
    }
  }
  if (count < 80) return 0;
  const cx = sumX / count;
  const cy = sumY / count;
  const mu20 = sumXX / count - cx * cx;
  const mu02 = sumYY / count - cy * cy;
  const mu11 = sumXY / count - cx * cy;
  const trace = mu20 + mu02;
  const disc = Math.sqrt(Math.max(0, (trace * trace) / 4 - (mu20 * mu02 - mu11 * mu11)));
  const major = trace / 2 + disc;
  const minor = trace / 2 - disc;
  if (minor <= 1 || major / minor < 1.18) return 0;
  let degrees = (0.5 * Math.atan2(2 * mu11, mu20 - mu02) * 180) / Math.PI;
  while (degrees > 45) degrees -= 90;
  while (degrees < -45) degrees += 90;
  if (Math.abs(degrees) < 0.8 || Math.abs(degrees) > 15) return 0;
  return -degrees;
}

function rotate(source: HTMLCanvasElement, degrees: number) {
  const rad = (degrees * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const canvas = blankCanvas(source.width * cos + source.height * sin, source.width * sin + source.height * cos);
  const ctx = context(canvas);
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rad);
  ctx.drawImage(source, -source.width / 2, -source.height / 2);
  return canvas;
}

function crop(source: HTMLCanvasElement, box: { x: number; y: number; w: number; h: number }) {
  const canvas = blankCanvas(box.w, box.h);
  context(canvas).drawImage(source, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
  return canvas;
}

async function stampWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const logo = await loadImage(watermarkSrc);
  const side = Math.min(width, height);
  const size = Math.round(side * 0.12);
  const margin = Math.round(side * 0.045);
  const x = width - margin - size;
  const y = height - margin - size;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(logo, x, y, size, size);
  ctx.restore();
}

async function whiteWithWatermark(file: File, onProgress?: (update: PrepProgress) => void): Promise<PreparedPhoto> {
  onProgress?.({ text: "Preparing image. The first cutout can take a minute.", percent: 8 });
  const source = await toBlob(await canvasFromBlob(file, 2400), "image/png");

  onProgress?.({ text: "Removing background", percent: 18 });
  const { removeBackground } = await import("@imgly/background-removal");
  const cutoutBlob = await removeBackground(source, {
    model: "isnet",
    device: "cpu",
    output: { format: "image/png", quality: 1 },
    progress: (key, current, total) => {
      if (key.startsWith("fetch")) {
        onProgress?.({ text: "Downloading the cutout model (first time only)", percent: Math.round(18 + (total ? current / total : 0) * 32) });
      } else {
        onProgress?.({ text: "Removing background", percent: 58 });
      }
    },
  });

  onProgress?.({ text: "Leveling, sizing, and adding the watermark", percent: 74 });
  const cutout = await canvasFromBlob(cutoutBlob);
  const cutoutCtx = context(cutout);
  const pixels = cutoutCtx.getImageData(0, 0, cutout.width, cutout.height);
  hardenAlpha(pixels.data, cutout.width, cutout.height);
  cutoutCtx.putImageData(pixels, 0, 0);

  const tilt = levelDegrees(pixels.data, cutout.width, cutout.height);
  const leveled = tilt ? rotate(cutout, tilt) : cutout;
  const leveledPixels = context(leveled).getImageData(0, 0, leveled.width, leveled.height);
  const bounds = opaqueBounds(leveledPixels.data, leveled.width, leveled.height);
  if (!bounds) throw new Error("No product was found in that photo. Try a clearer shot, or upload it as a raw photo.");
  const product = crop(leveled, bounds);

  const out = blankCanvas(outputSize, outputSize);
  const ctx = context(out);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outputSize, outputSize);
  const fit = Math.min((outputSize * 0.74) / product.width, (outputSize * 0.74) / product.height);
  const dw = product.width * fit;
  const dh = product.height * fit;
  ctx.drawImage(product, (outputSize - dw) / 2, (outputSize - dh) / 2 - outputSize * 0.02, dw, dh);
  await stampWatermark(ctx, outputSize, outputSize);

  onProgress?.({ text: "Encoding", percent: 88 });
  const blob = await toBlob(out, "image/webp", 0.92);
  return { file: new File([blob], "photo.webp", { type: "image/webp" }), width: outputSize, height: outputSize };
}

async function rawPhoto(file: File, onProgress?: (update: PrepProgress) => void): Promise<PreparedPhoto> {
  onProgress?.({ text: "Resizing and converting to WebP", percent: 40 });
  const canvas = await canvasFromBlob(file, outputSize);
  const blob = await toBlob(canvas, "image/webp", 0.9);
  return { file: new File([blob], "photo.webp", { type: "image/webp" }), width: canvas.width, height: canvas.height };
}

export function preparePhoto(file: File, style: PhotoStyle, onProgress?: (update: PrepProgress) => void) {
  return style === "raw" ? rawPhoto(file, onProgress) : whiteWithWatermark(file, onProgress);
}
