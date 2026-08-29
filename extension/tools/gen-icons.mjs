// Generates the extension icon PNGs (16/48/128) with no dependencies.
// Draws a rounded blue gradient square with a white search-glyph.
import { deflateSync } from "zlib";
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}
function roundRect(x, y, w, h, r) {
  if (x < r) return false;
  if (x > w - r) return false;
  if (y < r) return false;
  if (y > h - r) return false;
  return true;
}
function makeIcon(size) {
  const px = Buffer.alloc(size * (size * 4 + 1));
  const cx = size * 0.52, cy = size * 0.46;
  const R = size * 0.24, thick = size * 0.09;
  const hx = size * 0.78, hy = size * 0.80;
  for (let y = 0; y < size; y++) {
    px[y * (size * 4 + 1)] = 0; // filter byte
    for (let x = 0; x < size; x++) {
      const o = y * (size * 4 + 1) + 1 + x * 4;
      const t = (x + y) / (2 * size);
      // background rounded gradient
      const rr = size * 0.24;
      let inside = roundRect(x, y, size, size, rr);
      // cheap rounded corners
      const cc = [rr, size - rr];
      const corner = (Math.min(Math.abs(x - cc[0]), Math.abs(x - cc[1])) + Math.min(Math.abs(y - cc[0]), Math.abs(y - cc[1]))) < rr * 1.4;
      const distCenter = Math.hypot(x - cx, y - cy);
      const ring = Math.abs(distCenter - R) < thick;
      const handleDist = Math.abs((hx - cx) * (y - cy) - (hy - cy) * (x - cx)) / Math.hypot(hx - cx, hy - cy);
      const onHandle = handleDist < thick * 0.9 && ((x - cx) * (hx - cx) + (y - cy) * (hy - cy)) > 0;
      const glyph = ring || onHandle;
      if (glyph) {
        px[o] = 255; px[o + 1] = 255; px[o + 2] = 255; px[o + 3] = 255;
      } else if (inside && corner) {
        const b = 40 + t * 20, g = 60 + t * 40, r = 74 + t * 46;
        px[o] = r; px[o + 1] = g; px[o + 2] = b; px[o + 3] = 255;
      } else {
        px[o] = 0; px[o + 1] = 0; px[o + 2] = 0; px[o + 3] = 0;
      }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // RGBA
  const idat = deflateSync(px);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = join(__dir, "..", "icons");
mkdirSync(outDir, { recursive: true });
for (const s of [16, 48, 128]) {
  writeFileSync(join(outDir, `icon${s}.png`), makeIcon(s));
  console.log(`wrote icon${s}.png`);
}
