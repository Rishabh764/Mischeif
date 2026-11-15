/* ==========================================================================
   MISCHIEF — Stand-in garment art.
   Drawn SVG cut-outs (front + back) for every piece in the drop, used in the
   showroom until real photography exists. Everything is drawn in the same
   480x600 space as the Design Studio art, then scaled onto an 800x1000 card.
   ========================================================================== */

import { shade, torsoPath, hoodShape } from "../studio/garment-art.js";

const W = 800, H = 1000;
const RED = "#ff2d20";
const FONT = "Impact, 'Arial Narrow Bold', 'Arial Black', sans-serif";

const isLight = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) > 140;
};

function rng(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) { h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/* ---------- Silhouettes -------------------------------------------------- */

const longBody = (d) => `M150,90
  C150,90 172,66 205,${58 + d} C222,${52 + d} 258,${52 + d} 275,${58 + d} C308,66 330,90 330,90
  L398,146 C430,230 448,380 454,500 L406,510 C400,400 378,300 344,236
  L344,560 L136,560 L136,236
  C102,300 80,400 74,510 L26,500 C32,380 50,230 82,146 Z`;

const PANTS = `M150,40 L330,40 L348,140 L356,560 L266,560 L243,214 L237,214 L214,560 L124,560 L132,140 Z`;
const CAP_CROWN = `M112,340 C108,214 178,150 250,150 C328,150 392,214 392,340 Z`;
const CAP_BRIM = `M112,340 C70,346 34,372 40,396 C46,410 150,384 250,384 C300,384 356,366 392,340 Z`;
const CAP_BACK = `M108,350 C104,216 172,150 240,150 C308,150 376,216 372,350 Z`;
const BEANIE_DOME = `M132,372 C128,224 180,156 240,156 C300,156 352,224 348,372 Z`;

/* ---------- Building blocks ---------------------------------------------- */

function defs(c) {
  return `
    <linearGradient id="fab" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${shade(c, 0.2)}"/>
      <stop offset="45%" stop-color="${c}"/>
      <stop offset="100%" stop-color="${shade(c, -0.3)}"/>
    </linearGradient>
    <radialGradient id="sheen" cx="34%" cy="18%" r="72%">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.2"/>
      <stop offset="62%" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="45%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.3"/>
    </linearGradient>`;
}

/** Filled shape with a lit edge (reads on a dark room) and a dark seam line. */
const solid = (d, c) => `
  <path d="${d}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="7" stroke-linejoin="round"/>
  <path d="${d}" fill="url(#fab)" stroke="${shade(c, -0.42)}" stroke-width="2.5" stroke-linejoin="round"/>`;
const gloss = (d) => `<path d="${d}" fill="url(#sheen)"/><path d="${d}" fill="url(#fold)"/>`;
const seam = (d, c, o = 0.55, w = 2.5) => `<path d="${d}" fill="none" stroke="${shade(c, -0.45)}" stroke-width="${w}" stroke-linecap="round" opacity="${o}"/>`;

function ribBand(x, y, w, h, c) {
  let lines = "";
  for (let i = x + 6; i < x + w; i += 9) lines += `<line x1="${i}" y1="${y + 2}" x2="${i}" y2="${y + h - 2}" stroke="${shade(c, -0.5)}" stroke-width="2" opacity="0.5"/>`;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${shade(c, -0.16)}"/>${lines}`;
}
const longCuffs = (c) => `
  <path d="M26,500 L74,510 L72,534 L23,523 Z" fill="${shade(c, -0.18)}" stroke="${shade(c, -0.45)}" stroke-width="2"/>
  <path d="M454,500 L406,510 L408,534 L457,523 Z" fill="${shade(c, -0.18)}" stroke="${shade(c, -0.45)}" stroke-width="2"/>`;
const collarRib = (d, c, back) => `<path d="M205,${58 + d + (back ? 6 : 0)} C222,${(back ? 72 : 80) + (back ? d : 0)} 258,${(back ? 72 : 80) + (back ? d : 0)} 275,${58 + d + (back ? 6 : 0)}" fill="none" stroke="${shade(c, -0.3)}" stroke-width="7" stroke-linecap="round"/>`;
const drape = (c) => seam("M176,300 C204,340 212,430 198,548", c, 0.22, 3) + seam("M304,300 C276,340 268,430 282,548", c, 0.22, 3);

function noise(id, clip, c) {
  const r = rng(id);
  const tone = isLight(c) ? shade(c, -0.34) : shade(c, 0.4);
  let out = "";
  for (let i = 0; i < 230; i++) {
    const w = 3 + r() * 30, x = 30 + r() * 420, y = 96 + r() * 464;
    out += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${r() > 0.8 ? 5 : 2.5}" fill="${r() > 0.965 ? RED : tone}" opacity="${(0.25 + r() * 0.5).toFixed(2)}"/>`;
  }
  return `<clipPath id="clip"><path d="${clip}"/></clipPath><g clip-path="url(#clip)">${out}</g>`;
}

const ink = (c) => (isLight(c) ? "#141416" : "#f0ede7");
const chestMark = () => `<rect x="284" y="192" width="34" height="34" rx="3" fill="${RED}"/><text x="301" y="219" font-family="${FONT}" font-size="26" fill="#fff" text-anchor="middle">M</text>`;
const chestWord = (c) => `<text x="300" y="212" font-family="${FONT}" font-size="15" letter-spacing="3" fill="${ink(c)}" text-anchor="middle" opacity="0.9">MISCHIEF</text>`;
const backWord = (word, c, y = 268, size = 58, fill) => `
  <text x="240" y="${y}" font-family="${FONT}" font-size="${size}" letter-spacing="2" fill="${fill || ink(c)}" text-anchor="middle">${word}</text>
  <rect x="150" y="${y + 18}" width="180" height="5" fill="${RED}"/>
  <text x="240" y="${y + 48}" font-family="${FONT}" font-size="15" letter-spacing="6" fill="${ink(c)}" text-anchor="middle" opacity="0.8">DROP 01 — MISCHIEF</text>`;

/* ---------- Pieces -------------------------------------------------------- */

function hoodie(p, view) {
  const c = p.color.hex, front = view === "front";
  const d = longBody(front ? 14 : 10);
  const isStatic = p.id.startsWith("static");
  let art = "";
  if (isStatic) art = noise(p.id + view, d, c);
  else if (front) art = p.id === "riot-hoodie" ? chestMark() : chestWord(c);
  else art = backWord(p.id === "riot-hoodie" ? "RIOT" : "CURFEW", c, 290, 60);
  return `
    ${front ? "" : ""}
    ${solid(d, c)}
    ${drape(c)}
    ${art}
    ${front ? `<path d="M186,372 C186,404 200,424 240,424 C280,424 294,404 294,372 L294,362 L186,362 Z" fill="none" stroke="${shade(c, -0.45)}" stroke-width="3" opacity="0.7"/>` : ""}
    ${front ? hoodShape("front", c) : ""}
    ${ribBand(136, 540, 208, 20, c)}
    ${longCuffs(c)}
    ${front ? "" : hoodShape("back", c)}
    ${gloss(d)}`;
}

function tee(p, view, long) {
  const c = p.color.hex, front = view === "front";
  const d = long ? longBody(front ? 24 : 10) : torsoPath(front ? 26 : 10);
  const isStatic = p.id.startsWith("static");
  let art = "";
  if (isStatic) art = front ? noise(p.id + view, d, c) : backWord("STATIC", c, 250, 50);
  else if (p.id === "troublemaker-tee") art = front ? chestWord(c) : backWord("TROUBLE", c, 262, 56);
  else art = front
    ? chestMark()
    : backWord("NIGHT", c, 250, 56);
  const sleevePrint = long
    ? `<g fill="${RED}" opacity="0.9"><rect x="418" y="300" width="22" height="4" transform="rotate(8 429 302)"/><rect x="421" y="312" width="22" height="4" transform="rotate(8 432 314)"/><rect x="424" y="324" width="22" height="4" transform="rotate(8 435 326)"/></g>`
    : "";
  return `
    ${solid(d, c)}
    ${long ? "" : seam("M330,90 L344,202", c) + seam("M150,90 L136,202", c)}
    ${drape(c)}
    ${art}
    ${front ? sleevePrint : ""}
    ${collarRib(front ? (long ? 24 : 26) : 10, c, !front)}
    ${long ? longCuffs(c) : ""}
    ${gloss(d)}`;
}

function bomber(p, view) {
  const c = p.color.hex, front = view === "front";
  const d = longBody(8);
  return `
    ${solid(d, c)}
    ${front
      ? `<line x1="240" y1="72" x2="240" y2="530" stroke="#9a9aa2" stroke-width="4" stroke-dasharray="3 4"/>
         ${seam("M176,372 L206,442", c, 0.8, 4)}${seam("M304,372 L274,442", c, 0.8, 4)}
         <rect x="410" y="286" width="26" height="34" rx="3" fill="${RED}" transform="rotate(7 423 303)"/>`
      : `${seam("M150,150 C200,176 280,176 330,150", c, 0.6, 3)}
         <text x="240" y="300" font-family="${FONT}" font-size="46" letter-spacing="3" fill="none" stroke="${ink(c)}" stroke-width="1.6" text-anchor="middle" opacity="0.85">MISCHIEF</text>`}
    <path d="M196,60 C222,46 258,46 284,60 L275,74 C258,84 222,84 205,74 Z" fill="${shade(c, 0.12)}" stroke="${shade(c, -0.45)}" stroke-width="2"/>
    ${ribBand(136, 528, 208, 32, c)}
    ${longCuffs(c)}
    ${gloss(d)}`;
}

function cargo(p, view) {
  const c = p.color.hex, front = view === "front";
  return `
    ${solid(PANTS, c)}
    <rect x="150" y="40" width="180" height="24" fill="${shade(c, -0.16)}" stroke="${shade(c, -0.45)}" stroke-width="2"/>
    ${front
      ? `${seam("M240,64 L240,150", c, 0.7, 3)}${seam("M240,150 C232,170 226,180 222,196", c, 0.5, 2.5)}
         <path d="M228,64 C226,100 222,120 216,134" fill="none" stroke="${ink(c)}" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
         <path d="M252,64 C254,100 258,120 264,134" fill="none" stroke="${ink(c)}" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
         ${seam("M152,86 C170,96 178,110 178,128", c, 0.7)}${seam("M328,86 C310,96 302,110 302,128", c, 0.7)}`
      : `<rect x="164" y="92" width="54" height="62" rx="3" fill="none" stroke="${shade(c, -0.45)}" stroke-width="2.5"/>
         <rect x="262" y="92" width="54" height="62" rx="3" fill="none" stroke="${shade(c, -0.45)}" stroke-width="2.5"/>
         <rect x="290" y="46" width="26" height="12" fill="${RED}"/>`}
    <rect x="122" y="262" width="52" height="90" rx="4" fill="${shade(c, 0.08)}" stroke="${shade(c, -0.45)}" stroke-width="2.5"/>
    <rect x="122" y="262" width="52" height="24" rx="4" fill="${shade(c, -0.1)}" stroke="${shade(c, -0.45)}" stroke-width="2.5"/>
    <rect x="306" y="262" width="52" height="90" rx="4" fill="${shade(c, 0.08)}" stroke="${shade(c, -0.45)}" stroke-width="2.5"/>
    <rect x="306" y="262" width="52" height="24" rx="4" fill="${shade(c, -0.1)}" stroke="${shade(c, -0.45)}" stroke-width="2.5"/>
    ${seam("M128,400 L216,400", c, 0.4)}${seam("M264,400 L352,400", c, 0.4)}
    ${seam("M126,520 L214,520", c, 0.6, 3)}${seam("M266,520 L354,520", c, 0.6, 3)}
    ${gloss(PANTS)}`;
}

function cap(p, view) {
  const c = p.color.hex;
  if (view === "front") {
    return `
      ${solid(CAP_BRIM, shade(c, -0.14))}
      ${solid(CAP_CROWN, c)}
      ${seam("M250,150 C240,220 236,280 238,340", c, 0.5)}${seam("M250,150 C310,200 330,270 332,340", c, 0.4)}${seam("M250,150 C180,196 164,270 166,340", c, 0.4)}
      <circle cx="250" cy="150" r="9" fill="${shade(c, -0.2)}" stroke="${shade(c, -0.45)}" stroke-width="2"/>
      <rect x="196" y="238" width="62" height="62" rx="4" fill="${RED}"/>
      <text x="227" y="286" font-family="${FONT}" font-size="46" fill="#fff" text-anchor="middle">M</text>
      ${seam("M60,388 C140,372 200,366 250,366 C300,366 350,356 384,342", c, 0.5, 3)}
      ${gloss(CAP_CROWN)}`;
  }
  return `
    ${solid(CAP_BACK, c)}
    ${seam("M240,150 L240,270", c, 0.5)}${seam("M240,150 C190,196 172,270 170,350", c, 0.4)}${seam("M240,150 C290,196 308,270 310,350", c, 0.4)}
    <circle cx="240" cy="150" r="9" fill="${shade(c, -0.2)}" stroke="${shade(c, -0.45)}" stroke-width="2"/>
    <path d="M190,350 C190,286 290,286 290,350 Z" fill="#0a0a0c"/>
    <rect x="184" y="322" width="112" height="16" rx="3" fill="${shade(c, -0.18)}" stroke="${shade(c, -0.45)}" stroke-width="2"/>
    <rect x="230" y="318" width="20" height="24" rx="3" fill="#9a9aa2"/>
    <text x="240" y="250" font-family="${FONT}" font-size="15" letter-spacing="4" fill="${ink(c)}" text-anchor="middle" opacity="0.85">MISCHIEF</text>
    ${gloss(CAP_BACK)}`;
}

function beanie(p, view) {
  const c = p.color.hex;
  let ribs = "";
  for (let x = 150; x < 340; x += 14) ribs += seam(`M${x},372 C${x - (240 - x) * 0.12},290 ${240 + (x - 240) * 0.55},200 240,160`, c, 0.28, 2);
  return `
    ${solid(BEANIE_DOME, c)}
    ${ribs}
    ${gloss(BEANIE_DOME)}
    ${ribBand(118, 350, 244, 84, c)}
    <rect x="118" y="350" width="244" height="84" rx="3" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="3"/>
    ${view === "front"
      ? `<rect x="206" y="372" width="68" height="40" rx="2" fill="#f0ede7"/><text x="240" y="400" font-family="${FONT}" font-size="17" letter-spacing="2" fill="#141416" text-anchor="middle">MSCHF</text>`
      : ""}`;
}

const BUILD = {
  hoodie: (p, v) => hoodie(p, v),
  tee: (p, v) => tee(p, v, false),
  longsleeve: (p, v) => tee(p, v, true),
  bomber, cargo, cap, beanie
};

/** Standalone SVG document (800x1000, transparent background). */
export function standinSVG(product, view = "front") {
  const inner = (BUILD[product.kind] || BUILD.tee)(product, view);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defs(product.color.hex)}</defs><g transform="translate(60,75) scale(1.4167)">${inner}</g></svg>`;
}

const cache = new Map();
export function standinDataUri(product, view = "front") {
  const key = product.id + view;
  if (!cache.has(key)) cache.set(key, "data:image/svg+xml;utf8," + encodeURIComponent(standinSVG(product, view)));
  return cache.get(key);
}

/** Image URL: the real photo when one is configured, otherwise the drawn stand-in.
    A piece with a front photo but no back photo shows its front on both sides,
    so a photo is never paired with a drawing. */
export function pieceImage(product, view = "front") {
  const photos = product.images;
  return (photos && (photos[view] || photos.front)) || standinDataUri(product, view);
}
