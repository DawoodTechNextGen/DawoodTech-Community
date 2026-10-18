// Regenerates every PWA icon from public/logo-mark.svg, so they stay sharp.
// Run from web/:  node scripts/generate-icons.mjs
// (sharp comes with Next.js; it's what next/image uses.)
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const svg = await readFile(new URL("../public/logo-mark.svg", import.meta.url));

/** The mark scaled to `logo`% of a `size`px square, centred on `background`. */
async function icon(file, size, logo, background = { r: 0, g: 0, b: 0, alpha: 0 }, tint) {
  const box = Math.round((size * logo) / 100);
  let mark = sharp(svg, { density: 72 * Math.ceil(box / 223) * 2 }).resize(box, box, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });
  // Monochrome badge: Android draws only the alpha channel in the status bar.
  if (tint) mark = mark.tint(tint).modulate({ brightness: 10 });
  await sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: await mark.png().toBuffer(), gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toFile(fileURLToPath(new URL(`../public/${file}`, import.meta.url)));
  console.log(file);
}

const white = { r: 255, g: 255, b: 255, alpha: 1 };
// "any" icons: transparent, also used for the Android launch screen.
await icon("icons/icon-192.png", 192, 86);
await icon("icons/icon-512.png", 512, 86);
// Maskable: launchers crop to a circle/squircle, so keep the mark in the safe zone.
await icon("icons/icon-maskable-192.png", 192, 58, white);
await icon("icons/icon-maskable-512.png", 512, 58, white);
// iOS ignores transparency (it would turn black), so white like the maskable ones.
await icon("icons/apple-touch-icon.png", 180, 70, white);
// Status-bar badge for push notifications: white silhouette.
await icon("icons/badge-96.png", 96, 80, undefined, { r: 255, g: 255, b: 255 });
