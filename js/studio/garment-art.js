/* ==========================================================================
   MISCHIEF — Design Studio garment silhouettes (Tee / Hoodie, Front / Back)
   All shapes share a 480x600 viewBox so print-zone overlays can be positioned
   with simple percentages that line up with the art.
   ========================================================================== */

export const GARMENT_VIEWBOX = { w: 480, h: 600 };

/* Zone rects, in viewBox units — single source of truth, also used for the
   CSS overlay positioning (converted to % by zoneToPercent). */
export const GARMENT_ZONES = {
  tee: {
    front: {
      neck: { x: 205, y: 108, w: 70, h: 28, label: "Neck" },
      front: { x: 160, y: 158, w: 160, h: 220, label: "Front" },
      sleeveLeft: { x: 52, y: 172, w: 72, h: 68, label: "Left Sleeve" },
      sleeveRight: { x: 356, y: 172, w: 72, h: 68, label: "Right Sleeve" }
    },
    back: {
      back: { x: 150, y: 150, w: 180, h: 290, label: "Back" },
      hem: { x: 205, y: 522, w: 70, h: 26, label: "Hem" }
    }
  },
  hoodie: {
    front: {
      neck: { x: 205, y: 128, w: 70, h: 26, label: "Neck" },
      front: { x: 150, y: 175, w: 180, h: 175, label: "Front" },
      sleeveLeft: { x: 50, y: 185, w: 72, h: 68, label: "Left Sleeve" },
      sleeveRight: { x: 358, y: 185, w: 72, h: 68, label: "Right Sleeve" }
    },
    back: {
      back: { x: 150, y: 165, w: 180, h: 280, label: "Back" },
      hem: { x: 205, y: 522, w: 70, h: 26, label: "Hem" }
    }
  }
};

export const VIEW_ZONES = {
  front: ["neck", "front", "sleeveLeft", "sleeveRight"],
  back: ["back", "hem"]
};

export function zoneToPercent(rect) {
  return {
    left: (rect.x / GARMENT_VIEWBOX.w) * 100,
    top: (rect.y / GARMENT_VIEWBOX.h) * 100,
    width: (rect.w / GARMENT_VIEWBOX.w) * 100,
    height: (rect.h / GARMENT_VIEWBOX.h) * 100
  };
}

/** amt: -1..1 — negative darkens, positive lightens. */
export function shade(hex, amt) {
  const c = hex.replace("#", "");
  const num = parseInt(c.length === 3 ? c.split("").map((x) => x + x).join("") : c, 16);
  let r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
  const mix = (v) => Math.max(0, Math.min(255, Math.round(v + (amt > 0 ? (255 - v) * amt : v * amt))));
  r = mix(r); g = mix(g); b = mix(b);
  return `rgb(${r},${g},${b})`;
}

/** Base torso + short sleeves silhouette (shared by the Studio tee & hoodie). */
export function torsoPath(neckDip) {
  return `M150,90
    C150,90 172,66 205,${58 + neckDip}
    C222,${52 + neckDip} 258,${52 + neckDip} 275,${58 + neckDip}
    C308,66 330,90 330,90
    L428,168 L398,228 L344,202
    L344,560 L136,560 L136,202
    L82,228 L52,168 Z`;
}

function ribbing(y, trimColor) {
  return `<rect x="150" y="${y}" width="180" height="14" rx="6" fill="${trimColor}" opacity="0.9"/>`;
}

export function hoodShape(mode, mainColor) {
  // 'front': hood hangs behind the shoulders, drawstrings visible.
  // 'back':  hood bunched on top of the shoulders.
  if (mode === "front") {
    return `
      <path d="M186,64 C186,24 218,6 240,6 C262,6 294,24 294,64 L294,96 L186,96 Z"
            fill="${shade(mainColor, -0.18)}"/>
      <line x1="222" y1="112" x2="216" y2="156" stroke="${shade(mainColor, -0.3)}" stroke-width="5" stroke-linecap="round"/>
      <line x1="258" y1="112" x2="264" y2="156" stroke="${shade(mainColor, -0.3)}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="216" cy="158" r="4" fill="${shade(mainColor, -0.4)}"/>
      <circle cx="264" cy="158" r="4" fill="${shade(mainColor, -0.4)}"/>`;
  }
  return `
    <path d="M158,96 C158,30 196,4 240,4 C284,4 322,30 322,96 C322,118 300,128 240,128 C180,128 158,118 158,96 Z"
          fill="${mainColor}" stroke="${shade(mainColor, -0.25)}" stroke-width="3"/>
    <path d="M240,10 C270,10 300,32 300,80" fill="none" stroke="${shade(mainColor, 0.25)}" stroke-width="4" opacity="0.5" stroke-linecap="round"/>`;
}

/**
 * Inline <svg> string for the Studio garment.
 * @param {"tee"|"hoodie"} type
 * @param {"front"|"back"} view
 * @param {string} mainColor hex
 * @param {string} trimColor hex (ribbing / cuffs / hem)
 */
export function garmentSVG(type, view, mainColor, trimColor) {
  const isHoodie = type === "hoodie";
  const neckDip = view === "front" ? (isHoodie ? 14 : 26) : 10;
  const body = torsoPath(neckDip);
  const dark = shade(mainColor, -0.22);
  const light = shade(mainColor, 0.16);
  const uid = `${type}-${view}-${Math.random().toString(36).slice(2, 7)}`;

  const extras = isHoodie && view === "front" ? hoodShape("front", mainColor) : "";
  const pocket = isHoodie && view === "front"
    ? `<path d="M186,360 C186,392 200,412 240,412 C280,412 294,392 294,360 L294,352 L186,352 Z"
      fill="none" stroke="${dark}" stroke-width="3" opacity="0.7"/>`
    : "";

  const cuffLeft = `<rect x="52" y="210" width="30" height="14" rx="6" fill="${trimColor}" transform="rotate(-18 67 217)" opacity="0.9"/>`;
  const cuffRight = `<rect x="398" y="210" width="30" height="14" rx="6" fill="${trimColor}" transform="rotate(18 413 217)" opacity="0.9"/>`;
  const hoodOnTop = isHoodie && view === "back" ? hoodShape("back", mainColor) : "";

  return `
<svg viewBox="0 0 480 600" xmlns="http://www.w3.org/2000/svg" class="garment-svg">
  <defs>
    <linearGradient id="fabric-${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${light}"/>
      <stop offset="45%" stop-color="${mainColor}"/>
      <stop offset="100%" stop-color="${dark}"/>
    </linearGradient>
    <radialGradient id="sheen-${uid}" cx="35%" cy="20%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.16"/>
      <stop offset="60%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <path d="${body}" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="6" stroke-linejoin="round"/>
  <path d="${body}" fill="url(#fabric-${uid})" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/>
  ${pocket}
  ${extras}
  ${ribbing(546, trimColor)}
  ${cuffLeft}
  ${cuffRight}
  ${view === "front" && !isHoodie ? `<path d="M205,${58 + neckDip} C222,80 258,80 275,${58 + neckDip}" fill="none" stroke="${trimColor}" stroke-width="5" opacity="0.85"/>` : ""}
  ${view === "back" ? `<path d="M205,${64 + neckDip} C222,${72 + neckDip} 258,${72 + neckDip} 275,${64 + neckDip}" fill="none" stroke="${trimColor}" stroke-width="5" opacity="0.85"/>` : ""}
  ${hoodOnTop}
  <path d="${body}" fill="url(#sheen-${uid})"/>
</svg>`.trim();
}
