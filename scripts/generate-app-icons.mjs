// Rasterize the code-native dumbbell mark for installable app icons, without dependencies.
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";
const table = Array.from({ length: 256 }, (_, i) => {
  let value = i;
  for (let bit = 0; bit < 8; bit++)
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function chunk(type, data) {
  const name = Buffer.from(type),
    length = Buffer.alloc(4),
    checksum = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  let crc = 0xffffffff;
  for (const byte of Buffer.concat([name, data]))
    crc = table[(crc ^ byte) & 255] ^ (crc >>> 8);
  checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([length, name, data, checksum]);
}
const shapes = [
  [172, 238, 168, 36, 12],
  [138, 170, 46, 172, 16],
  [98, 204, 35, 104, 12],
  [328, 170, 46, 172, 16],
  [379, 204, 35, 104, 12],
];
function contains(x, y, [left, top, width, height, radius]) {
  if (x < left || x > left + width || y < top || y > top + height) return false;
  const dx = x - Math.max(left + radius, Math.min(x, left + width - radius));
  const dy = y - Math.max(top + radius, Math.min(y, top + height - radius));
  return dx * dx + dy * dy <= radius * radius;
}
export function iconPng(size, rgb = false) {
  const channels = rgb ? 3 : 4;
  const rows = Buffer.alloc(size * (size * channels + 1));
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let coverage = 0;
      for (const sy of [0.25, 0.75])
        for (const sx of [0.25, 0.75])
          if (
            shapes.some((shape) =>
              contains(((x + sx) * 512) / size, ((y + sy) * 512) / size, shape),
            )
          )
            coverage += 0.25;
      const index = y * (size * channels + 1) + x * channels + 1;
      rows[index] = Math.round(17 + (183 - 17) * coverage);
      rows[index + 1] = Math.round(17 + (243 - 17) * coverage);
      rows[index + 2] = Math.round(19 + (107 - 19) * coverage);
      if (!rgb) rows[index + 3] = 255;
    }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = rgb ? 2 : 6;
  return Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk("IHDR", header),
      chunk("IDAT", deflateSync(rows)),
      chunk("IEND", Buffer.alloc(0)),
    ]);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const size of [192, 512]) writeFileSync(new URL(`../frontend/public/icons/icon-${size}.png`, import.meta.url), iconPng(size));
  console.log("Generated near-black and lime 192/512px app icons.");
}
