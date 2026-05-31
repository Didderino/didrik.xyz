#!/usr/bin/env node
// Auto-generates the small XMB badge thumbnails for Photos + Skate.
// Runs automatically before `vite build` via the `prebuild` npm hook.
//
// Photos: walks public/img/<slug>/, generates thumb.jpg from 01.jpg if missing
//         or stale.
// Skate:  downloads each YouTube edit's hqdefault thumbnail to public/img/skate/
//         (only on first run — committed thumbs are reused on subsequent builds).
//
// Keep `SKATE_THUMBS` in sync with the badge field on CATEGORIES.skate in
// src/app.jsx — when adding a new skate edit, add its slug → YouTube ID here.

import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const IMG_ROOT   = "public/img";
const THUMB_SIZE = 128;
const QUALITY    = 80;

// slug (filename under public/img/skate/) → YouTube video ID
const SKATE_THUMBS = {
  "everyday":   "iJQ_2I1RRo4",
  "paristokyo": "XAoQOppZdf8",
  "who":        "_zNDGDopFQI",
};

function isNewer(a, b) {
  try { return statSync(a).mtimeMs > statSync(b).mtimeMs; } catch { return true; }
}

async function buildPhotoThumbs() {
  if (!existsSync(IMG_ROOT)) return;
  for (const name of readdirSync(IMG_ROOT)) {
    const folder = join(IMG_ROOT, name);
    if (!statSync(folder).isDirectory()) continue;
    // Work folders identify themselves with a favicon.png and use that as the
    // badge — they don't need an auto-generated thumb.
    if (existsSync(join(folder, "favicon.png"))) continue;
    const src  = join(folder, "01.jpg");
    const dest = join(folder, "thumb.jpg");
    if (!existsSync(src)) continue;
    if (existsSync(dest) && !isNewer(src, dest)) continue;
    await sharp(src)
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: "cover", position: "center" })
      .jpeg({ quality: QUALITY })
      .toFile(dest);
    console.log(`  thumb  ${dest}`);
  }
}

async function buildSkateThumbs() {
  const skateDir = join(IMG_ROOT, "skate");
  mkdirSync(skateDir, { recursive: true });
  for (const [slug, youtube] of Object.entries(SKATE_THUMBS)) {
    const dest = join(skateDir, `${slug}.jpg`);
    if (existsSync(dest)) continue;
    const url = `https://i.ytimg.com/vi/${youtube}/hqdefault.jpg`;
    try {
      const r = await fetch(url);
      if (!r.ok) { console.warn(`  skip   ${dest} (HTTP ${r.status})`); continue; }
      const buf = Buffer.from(await r.arrayBuffer());
      await sharp(buf)
        // hqdefault has black bars top/bottom; crop wider square from the center
        .resize(THUMB_SIZE, THUMB_SIZE, { fit: "cover", position: "center" })
        .jpeg({ quality: QUALITY })
        .toFile(dest);
      console.log(`  fetch  ${dest}`);
    } catch (e) {
      console.warn(`  skip   ${dest} (${e.message})`);
    }
  }
}

console.log("→ building thumbnails");
await buildPhotoThumbs();
await buildSkateThumbs();
console.log("✓ done");
