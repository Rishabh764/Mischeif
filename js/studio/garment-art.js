/* ==========================================================================
   SLANG STUDIO — Design Studio garments (Tee / Hoodie, Front / Back).
   Each garment is a photo turned into a greyscale "shading map"
   (assets/studio/<type>-<view>.webp). The browser tints that map with the
   chosen colour, so the folds and fabric stay real while the colour changes
   live. The ribbed parts (collar, sleeve hems, cuffs, bottom hem) are tinted
   separately with the trim colour.

   Everything is laid out on a 480x600 grid that matches the photos, so the
   print zones and the trim shapes below line up with the garment.
   ========================================================================== */

const GARMENT_VIEWBOX = { w: 480, h: 600 };

/* Print zones, in grid units — single source of truth, also used for the
   overlay positioning (converted to % by zoneToPercent). */
export const GARMENT_ZONES = {
  tee: {
    front: {
      neck: { x: 205, y: 152, w: 70, h: 26, label: "Neck" },
      front: { x: 150, y: 188, w: 180, h: 230, label: "Front" },
      sleeveLeft: { x: 66, y: 212, w: 54, h: 62, label: "Left Sleeve" },
      sleeveRight: { x: 360, y: 212, w: 54, h: 62, label: "Right Sleeve" }
    },
    back: {
      back: { x: 145, y: 128, w: 190, h: 300, label: "Back" },
      hem: { x: 205, y: 460, w: 70, h: 26, label: "Hem" }
    }
  },
  hoodie: {
    front: {
      neck: { x: 205, y: 158, w: 70, h: 26, label: "Neck" },
      front: { x: 150, y: 192, w: 180, h: 156, label: "Front" },
      sleeveLeft: { x: 64, y: 286, w: 48, h: 86, label: "Left Sleeve" },
      sleeveRight: { x: 368, y: 286, w: 48, h: 86, label: "Right Sleeve" }
    },
    back: {
      back: { x: 150, y: 202, w: 180, h: 240, label: "Back" },
      hem: { x: 205, y: 450, w: 70, h: 26, label: "Hem" }
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

/* ---------- Photo garment --------------------------------------------------- */

/* Where the trim colour goes, as white shapes on the same grid. They are
   feathered and clipped by the photo itself, so they only need to be close. */
const band = (d, width) => `<path d="${d}" fill="none" stroke="#fff" stroke-width="${width}"/>`;
const area = (points) => `<polygon points="${points}" fill="#fff"/>`;
const TEE_SLEEVE_HEMS = band("M35,268 L125,312", 11) + band("M445,268 L355,312", 11);
const TRIM_SHAPES = {
  tee: {
    front: band("M181,99 C196,150 284,150 299,99", 16) + TEE_SLEEVE_HEMS + band("M118,500 L362,500", 14),
    back: band("M182,97 Q240,101 298,97", 16) + TEE_SLEEVE_HEMS + band("M118,502 L362,502", 14)
  },
  hoodie: {
    front: area("44,506 97,512 97,552 44,552") + area("436,506 383,512 383,552 436,552")
      + `<path d="M114,488 Q240,502 366,488 L366,536 L114,536 Z" fill="#fff"/>`,
    back: area("42,503 97,508 97,548 42,548") + area("438,503 383,508 383,548 438,548")
      + `<path d="M114,480 Q240,494 366,480 L366,528 L114,528 Z" fill="#fff"/>`
  }
};

const rgb = (hex) => {
  const c = hex.replace("#", "");
  const n = parseInt(c.length === 3 ? c.split("").map((x) => x + x).join("") : c, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** A "gradient map" filter: shading-map black becomes a deep shadow of the
 *  colour, mid grey the colour itself, white its highlight. */
function tintFilter(id, hex) {
  const base = rgb(hex);
  const lum = (0.299 * base[0] + 0.587 * base[1] + 0.114 * base[2]) / 255;
  const lift = 0.2 - 0.06 * lum; // dark colours need a slightly stronger highlight for the folds to read
  const table = (i) => {
    const v = base[i];
    const dark = v * 0.42, light = v + (255 - v) * lift;
    return [dark, (dark + v) / 2, v, (v + light) / 2, light].map((x) => (x / 255).toFixed(3)).join(" ");
  };
  return `<filter id="${id}" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%">
      <feComponentTransfer>
        <feFuncR type="table" tableValues="${table(0)}"/>
        <feFuncG type="table" tableValues="${table(1)}"/>
        <feFuncB type="table" tableValues="${table(2)}"/>
      </feComponentTransfer>
    </filter>`;
}

/**
 * Inline <svg> string for the Studio garment.
 * @param {"tee"|"hoodie"} type
 * @param {"front"|"back"} view
 * @param {string} mainColor hex
 * @param {string} trimColor hex (collar / sleeve hems / cuffs / bottom hem)
 */
export function garmentSVG(type, view, mainColor, trimColor) {
  const uid = `${type}-${view}-${Math.random().toString(36).slice(2, 7)}`;
  const photo = `<image href="assets/studio/${type}-${view}.webp" width="480" height="600" preserveAspectRatio="none"`;
  return `
<svg viewBox="0 0 480 600" xmlns="http://www.w3.org/2000/svg" class="garment-svg" role="img" aria-label="${type === "hoodie" ? "Hoodie" : "T-shirt"}, ${view}">
  <defs>
    ${tintFilter(`main-${uid}`, mainColor)}
    ${tintFilter(`trim-${uid}`, trimColor)}
    <filter id="soft-${uid}" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.4"/></filter>
    <mask id="mask-${uid}" maskUnits="userSpaceOnUse" x="0" y="0" width="480" height="600">
      <g filter="url(#soft-${uid})">${TRIM_SHAPES[type][view]}</g>
    </mask>
  </defs>
  ${photo} filter="url(#main-${uid})"/>
  ${photo} filter="url(#trim-${uid})" mask="url(#mask-${uid})"/>
</svg>`.trim();
}
