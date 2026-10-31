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

const targetBytes = 450 * 1024;

/** Highest WebP quality that stays under the target size, so photos look crisp but load fast. */
async function encodeWebp(canvas: HTMLCanvasElement) {
  let blob = await toBlob(canvas, "image/webp", 0.93);
  for (const quality of [0.88, 0.82, 0.76]) {
    if (blob.size <= targetBytes) break;
    blob = await toBlob(canvas, "image/webp", quality);
  }
  if (blob.type !== "image/webp") throw new Error("This browser cannot save WebP images. Try Chrome or Edge.");
  return blob;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the watermark logo."));
    img.src = src;
  });
}

/**
 * Cleans the cutout mask: trims the halo by one pixel, tightens the soft edge into a crisp
 * anti-aliased one, drops stray specks, and replaces edge colors tinted by the old background.
 */
function refineMatte(data: Uint8ClampedArray, width: number, height: number) {
  const total = width * height;
  const raw = new Uint8Array(total);
  for (let p = 0, i = 3; p < total; p++, i += 4) raw[p] = data[i];

  const alpha = new Uint8Array(total);
  const lo = 70;
  const hi = 190;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let min = 255;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const value = nx < 0 || ny < 0 || nx >= width || ny >= height ? 0 : raw[ny * width + nx];
          if (value < min) min = value;
        }
      }
      const t = Math.min(1, Math.max(0, (min - lo) / (hi - lo)));
      alpha[y * width + x] = Math.round(t * t * (3 - 2 * t) * 255);
    }
  }

  const label = new Int32Array(total);
  const sizes = [0];
  const stack = new Int32Array(total);
  for (let start = 0; start < total; start++) {
    if (alpha[start] < 128 || label[start]) continue;
    const id = sizes.length;
    let size = 0;
    let top = 0;
    stack[top++] = start;
    label[start] = id;
    while (top) {
      const p = stack[--top];
      size++;
      const x = p % width;
      const neighbors = [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, p - width, p + width];
      for (const n of neighbors) {
        if (n < 0 || n >= total || label[n] || alpha[n] < 128) continue;
        label[n] = id;
        stack[top++] = n;
      }
    }
    sizes.push(size);
  }
  const largest = Math.max(0, ...sizes);
  const minSize = Math.max(64, Math.min(largest * 0.02, total * 0.0008));
  const keep = (id: number) => id > 0 && sizes[id] >= minSize;

  const near = 3;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const i = p * 4;
      const a = alpha[p];
      if (a >= 128) {
        data[i + 3] = keep(label[p]) ? a : 0;
        if (data[i + 3] === 255 || data[i + 3] === 0) continue;
      } else {
        data[i + 3] = a;
        if (a === 0) continue;
      }
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let dy = -near; dy <= near; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -near; dx <= near; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          const q = ny * width + nx;
          if (alpha[q] !== 255 || !keep(label[q])) continue;
          const j = q * 4;
          r += data[j];
          g += data[j + 1];
          b += data[j + 2];
          n++;
        }
      }
      if (!n) {
        data[i + 3] = 0;
        continue;
      }
      data[i] = r / n;
      data[i + 1] = g / n;
      data[i + 2] = b / n;
    }
  }
  for (let p = 0, i = 3; p < total; p++, i += 4) if (data[i] === 0) data[i - 3] = data[i - 2] = data[i - 1] = 255;
}

/** Light unsharp mask to restore detail softened by the cutout and resizing. */
function sharpen(ctx: CanvasRenderingContext2D, box: { x: number; y: number; w: number; h: number }, amount = 0.45, threshold = 3) {
  const x0 = Math.max(0, Math.floor(box.x) - 2);
  const y0 = Math.max(0, Math.floor(box.y) - 2);
  const w = Math.min(ctx.canvas.width - x0, Math.ceil(box.w) + 4);
  const h = Math.min(ctx.canvas.height - y0, Math.ceil(box.h) + 4);
  const image = ctx.getImageData(x0, y0, w, h);
  const src = image.data;
  const copy = new Uint8ClampedArray(src);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const k = i + c;
        const blur =
          (copy[k - w * 4 - 4] + 2 * copy[k - w * 4] + copy[k - w * 4 + 4] +
            2 * copy[k - 4] + 4 * copy[k] + 2 * copy[k + 4] +
            copy[k + w * 4 - 4] + 2 * copy[k + w * 4] + copy[k + w * 4 + 4]) / 16;
        const diff = copy[k] - blur;
        if (Math.abs(diff) > threshold) src[k] = copy[k] + diff * amount;
      }
    }
  }
  ctx.putImageData(image, x0, y0);
}

/** Halves the size in steps so large reductions stay sharp instead of aliased. */
function downscale(source: HTMLCanvasElement, width: number, height: number) {
  let current = source;
  while (current.width / 2 >= width && current.height / 2 >= height) {
    const half = blankCanvas(current.width / 2, current.height / 2);
    context(half).drawImage(current, 0, 0, half.width, half.height);
    current = half;
  }
  return current;
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
  refineMatte(pixels.data, cutout.width, cutout.height);
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
  const box = { x: (outputSize - dw) / 2, y: (outputSize - dh) / 2 - outputSize * 0.02, w: dw, h: dh };
  ctx.drawImage(fit < 1 ? downscale(product, dw, dh) : product, box.x, box.y, dw, dh);
  sharpen(ctx, box, fit > 1.4 ? 0.6 : 0.45);
  await stampWatermark(ctx, outputSize, outputSize);

  onProgress?.({ text: "Encoding", percent: 88 });
  const blob = await encodeWebp(out);
  return { file: new File([blob], "photo.webp", { type: "image/webp" }), width: outputSize, height: outputSize };
}

async function rawPhoto(file: File, onProgress?: (update: PrepProgress) => void): Promise<PreparedPhoto> {
  onProgress?.({ text: "Resizing and converting to WebP", percent: 40 });
  const canvas = await canvasFromBlob(file, outputSize);
  const blob = await encodeWebp(canvas);
  return { file: new File([blob], "photo.webp", { type: "image/webp" }), width: canvas.width, height: canvas.height };
}

export function preparePhoto(file: File, style: PhotoStyle, onProgress?: (update: PrepProgress) => void) {
  return style === "raw" ? rawPhoto(file, onProgress) : whiteWithWatermark(file, onProgress);
}
