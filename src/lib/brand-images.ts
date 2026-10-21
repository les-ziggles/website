// Raster images generated at build time from the brand SVGs (favicons, app icons, social card).
// Used by the endpoints in src/pages/ so every icon derives from src/assets/brand/.

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { SITE } from '../site.config';

const NAVY = SITE.themeColor;
const projectFile = (path: string) => readFile(join(process.cwd(), path));

/** Eagle head centred on a square, with optional background and padding (0–0.5 of the size). */
export async function eagleIcon(size: number, { background, padding = 0.08 }: { background?: string; padding?: number } = {}) {
  const svg = await projectFile('src/assets/brand/ziggles-eagle-head.svg');
  const inner = Math.round(size * (1 - 2 * padding));
  const eagle = await sharp(svg, { density: 300 }).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: background ?? { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: eagle, gravity: 'center' }])
    .png()
    .toBuffer();
}

/** 1200×630 Open Graph / Twitter card: team photo, navy veil and the full badge. */
export async function socialCard() {
  const [photo, logo] = await Promise.all([
    projectFile('src/assets/images/club/club-team-photo.jpg'),
    projectFile('src/assets/brand/ziggles-logo.svg'),
  ]);
  const background = await sharp(photo).resize(1200, 630, { fit: 'cover', position: 'attention' }).toBuffer();
  const veil = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <defs><linearGradient id="v" x1="0" x2="1"><stop offset="0" stop-color="${NAVY}" stop-opacity="0.96"/><stop offset="0.45" stop-color="${NAVY}" stop-opacity="0.75"/><stop offset="1" stop-color="${NAVY}" stop-opacity="0.05"/></linearGradient></defs>
      <rect width="1200" height="630" fill="url(#v)"/>
    </svg>`,
  );
  const badge = await sharp(logo, { density: 200 }).resize({ height: 580 }).png().toBuffer();
  return sharp(background)
    .composite([{ input: veil }, { input: badge, top: 25, left: 70 }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
}

/** Packs PNG images into a .ico container (PNG-compressed entries, supported by all current browsers). */
export function pngsToIco(images: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.png)]);
}

export const BRAND_NAVY = NAVY;
