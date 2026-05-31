#!/usr/bin/env node
// Postbuild step. After vite builds dist/index.html, this script writes a copy
// at dist/p/<slug>.html for each shareable item, with:
//   - <title>, og:title, og:description, og:image swapped to be item-specific
//   - og:image points at /api/og?... so the card is rendered on demand
//   - A small <script>window.__initial = "<itemId>"</script> hint so the SPA
//     boots straight to that item
//
// Vercel's cleanUrls (set in vercel.json) means /p/stue resolves to p/stue.html.
//
// Keep SHARE_ITEMS in sync with CATEGORIES in src/app.jsx when adding entries.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";
const ORIGIN = "https://didrik.xyz";

const SHARE_ITEMS = [
  // Work
  { slug: "stue",       kind: "Projects", title: "stue",                subtitle: "A shared home for your flat",      badge: "/img/work-stue/favicon.png",      itemId: "w-stue" },
  { slug: "bullneck",   kind: "Projects", title: "Bullneck Ballerina",  subtitle: "Berlin post-punk · website",       badge: "/img/work-bullneck/favicon.png",  itemId: "w-bullneck" },
  { slug: "t3shop",     kind: "Projects", title: "t3shop",              subtitle: "Custom Shopify Liquid theme",      badge: "/img/work-t3shop/favicon.png",    itemId: "w-t3shop" },
  // Photos
  { slug: "japan",      kind: "Photos",   title: "Japan",               subtitle: "Fuji Rensha · Fuji · 2024",         badge: "/img/roll-01/thumb.jpg",          itemId: "p-japan" },
  { slug: "2023",       kind: "Photos",   title: "2023",                subtitle: "Olympus Mju II · Kodak Gold + B&W", badge: "/img/pack-01/thumb.jpg",          itemId: "p-2023" },
  // Skate
  { slug: "everyday",   kind: "Skate",    title: "EVERYDAY",            subtitle: "Views Limited · Bergen 2023",       badge: "/img/skate/everyday.jpg",          itemId: "sk-everyday" },
  { slug: "paristokyo", kind: "Skate",    title: "PARIS TOKYO",         subtitle: "Views Limited · Bergen 2022",       badge: "/img/skate/paristokyo.jpg",        itemId: "sk-paristokyo" },
  { slug: "who",        kind: "Skate",    title: "WHO?",                subtitle: "Views Limited · Bergen 2021",       badge: "/img/skate/who.jpg",               itemId: "sk-who" },
];

const indexPath = join(DIST, "index.html");
if (!existsSync(indexPath)) {
  console.error(`✖ ${indexPath} not found — did vite build succeed?`);
  process.exit(1);
}
const tmpl = readFileSync(indexPath, "utf8");
mkdirSync(join(DIST, "p"), { recursive: true });

function buildOgUrl({ title, kind, subtitle, badge }) {
  const qs = new URLSearchParams({ title, kind, subtitle, badge });
  return `${ORIGIN}/api/og?${qs.toString()}`;
}

console.log("→ building share pages");
for (const item of SHARE_ITEMS) {
  const pageTitle = `${item.title} · Didrik`;
  const ogImg = buildOgUrl(item);

  let html = tmpl
    .replace(/<title>[^<]*<\/title>/, `<title>${pageTitle}</title>`)
    .replace(/<meta\s+name="description"[^>]*?\/?>/i,        `<meta name="description" content="${item.subtitle}" />`)
    .replace(/<meta\s+property="og:title"[^>]*?\/?>/i,       `<meta property="og:title" content="${pageTitle}" />`)
    .replace(/<meta\s+property="og:description"[^>]*?\/?>/i, `<meta property="og:description" content="${item.subtitle}" />`)
    .replace(/<meta\s+property="og:image"[^>]*?\/?>/i,       `<meta property="og:image" content="${ogImg}" />`);

  // Inject a hint the SPA reads on mount to jump straight to this item.
  // Has to live before the SPA bundle so it's defined when App's first effect runs.
  html = html.replace(
    /<div id="root"><\/div>/,
    `<div id="root"></div>\n    <script>window.__initial = ${JSON.stringify(item.itemId)};</script>`
  );

  writeFileSync(join(DIST, "p", `${item.slug}.html`), html);
  console.log(`  share  /p/${item.slug}`);
}
console.log("✓ done");
