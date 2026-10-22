export type Cell = string | null;

export function cellIndex(x: number, y: number, size: number) {
  return y * size + x;
}

export function emptyPixels(size: number): Cell[] {
  return Array.from({ length: size * size }, () => null);
}

export function clonePixels(pixels: Cell[]): Cell[] {
  return pixels.slice();
}

export function pixelsEqual(a: Cell[], b: Cell[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function remapSize(pixels: Cell[], from: number, to: number): Cell[] {
  const next = emptyPixels(to);
  const copy = Math.min(from, to);
  for (let y = 0; y < copy; y++) {
    for (let x = 0; x < copy; x++) {
      next[cellIndex(x, y, to)] = pixels[cellIndex(x, y, from)] ?? null;
    }
  }
  return next;
}

/** Inclusive line of cells between two points so fast strokes never skip. */
export function bresenham(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;
  for (;;) {
    points.push([x, y]);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
  return points;
}

export function floodFill(
  pixels: Cell[],
  size: number,
  x: number,
  y: number,
  color: Cell,
): Cell[] {
  if (x < 0 || y < 0 || x >= size || y >= size) return pixels;
  const start = pixels[cellIndex(x, y, size)] ?? null;
  if (start === color) return pixels;
  const next = clonePixels(pixels);
  const stack = [cellIndex(x, y, size)];
  while (stack.length) {
    const i = stack.pop()!;
    if (next[i] !== start) continue;
    next[i] = color;
    const cx = i % size;
    const cy = (i / size) | 0;
    if (cx > 0) stack.push(i - 1);
    if (cx < size - 1) stack.push(i + 1);
    if (cy > 0) stack.push(i - size);
    if (cy < size - 1) stack.push(i + size);
  }
  return next;
}

export function downloadPng(pixels: Cell[], size: number) {
  const scale = Math.max(8, Math.round(512 / size));
  const canvas = document.createElement("canvas");
  canvas.width = size * scale;
  canvas.height = size * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const color = pixels[cellIndex(x, y, size)];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  const name = `bitloom-${size}x${size}.png`;
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, "image/png");
}
