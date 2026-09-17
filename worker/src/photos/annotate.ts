type Box = {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
};

const WIDTH = 320;
const HEIGHT = 240;

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out[4] = type.charCodeAt(0);
  out[5] = type.charCodeAt(1);
  out[6] = type.charCodeAt(2);
  out[7] = type.charCodeAt(3);
  out.set(data, 8);
  const crcData = out.subarray(4, 8 + data.length);
  view.setUint32(8 + data.length, crc32(crcData));
  return out;
}

async function deflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function fillRect(
  pixels: Uint8Array,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  g: number,
  b: number
) {
  const x0 = Math.max(0, Math.min(WIDTH - 1, Math.round(x)));
  const y0 = Math.max(0, Math.min(HEIGHT - 1, Math.round(y)));
  const x1 = Math.max(0, Math.min(WIDTH, Math.round(x + w)));
  const y1 = Math.max(0, Math.min(HEIGHT, Math.round(y + h)));
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const i = (py * WIDTH + px) * 3;
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
    }
  }
}

function strokeRect(
  pixels: Uint8Array,
  x: number,
  y: number,
  w: number,
  h: number
) {
  fillRect(pixels, x, y, w, 3, 212, 175, 55);
  fillRect(pixels, x, y + h - 3, w, 3, 212, 175, 55);
  fillRect(pixels, x, y, 3, h, 212, 175, 55);
  fillRect(pixels, x + w - 3, y, 3, h, 212, 175, 55);
}

export async function buildAnnotationPng(boxes: Box[]): Promise<Uint8Array> {
  const pixels = new Uint8Array(WIDTH * HEIGHT * 3);
  pixels.fill(18);
  for (const box of boxes) {
    const x = (box.x / 100) * WIDTH;
    const y = (box.y / 100) * HEIGHT;
    const w = (box.w / 100) * WIDTH;
    const h = (box.h / 100) * HEIGHT;
    strokeRect(pixels, x, y, Math.max(8, w), Math.max(8, h));
  }

  const raw = new Uint8Array((WIDTH * 3 + 1) * HEIGHT);
  for (let y = 0; y < HEIGHT; y++) {
    raw[y * (WIDTH * 3 + 1)] = 0;
    raw.set(
      pixels.subarray(y * WIDTH * 3, (y + 1) * WIDTH * 3),
      y * (WIDTH * 3 + 1) + 1
    );
  }

  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, WIDTH);
  view.setUint32(4, HEIGHT);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const compressed = await deflate(raw);
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const parts = [signature, chunk("IHDR", ihdr), chunk("IDAT", compressed), chunk("IEND", new Uint8Array())];
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const png = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    png.set(part, offset);
    offset += part.length;
  }
  return png;
}
