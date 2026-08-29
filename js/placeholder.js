/* ==========================================================================
   MISCHEIF — Generated placeholder artwork for dummy products.
   Produces on-brand SVG "line-art on card" imagery with zero network
   dependency, so the catalog looks cohesive without real photography.
   ========================================================================== */

const PH_BG = ["#111114", "#15161a", "#1a1418", "#121215", "#17181c", "#1b1416"];
const PH_ACCENT = ["#ff3b30", "#c6ff00", "#ffffff"];

/* Minimal line-art glyphs, viewBox 0 0 120 140, stroke-based */
const PH_ICONS = {
  Hoodies: `
    <path d="M40 22 C40 12 48 6 60 6 C72 6 80 12 80 22
             L96 34 L88 50 L80 42 L80 128 L40 128 L40 42 L32 50 L24 34 Z"
          fill="none" stroke="var(--ic)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M60 6 C52 16 52 30 60 40 C68 30 68 16 60 6 Z" fill="none" stroke="var(--ic)" stroke-width="2.5"/>
    <rect x="52" y="86" width="16" height="12" rx="2" fill="none" stroke="var(--ic)" stroke-width="2.5"/>
    <line x1="55" y1="34" x2="53" y2="56" stroke="var(--ic)" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="65" y1="34" x2="67" y2="56" stroke="var(--ic)" stroke-width="2.5" stroke-linecap="round"/>
  `,
  "T-Shirts": `
    <path d="M42 18 L30 8 L14 24 L24 40 L34 32 L34 128 L86 128 L86 32 L96 40 L106 24 L90 8 L78 18
             C78 26 70 32 60 32 C50 32 42 26 42 18 Z"
          fill="none" stroke="var(--ic)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
  `,
  Jackets: `
    <path d="M40 20 L28 8 L12 26 L22 42 L32 34 L32 128 L88 128 L88 34 L98 42 L108 26 L92 8 L80 20
             L70 12 L60 20 L50 12 Z"
          fill="none" stroke="var(--ic)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    <line x1="60" y1="30" x2="60" y2="128" stroke="var(--ic)" stroke-width="2.5" stroke-dasharray="2 5" stroke-linecap="round"/>
  `,
  Bottoms: `
    <path d="M34 10 L86 10 L90 34 L74 34 L70 128 L58 128 L60 60 L60 128 L48 128 L46 34 L30 34 Z"
          fill="none" stroke="var(--ic)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    <line x1="34" y1="20" x2="86" y2="20" stroke="var(--ic)" stroke-width="2.5"/>
  `,
  Accessories: `
    <path d="M20 58 C20 40 38 26 60 26 C82 26 100 40 100 58" fill="none" stroke="var(--ic)" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="60" cy="60" rx="46" ry="10" fill="none" stroke="var(--ic)" stroke-width="3"/>
    <path d="M96 56 C112 56 116 66 108 70 L94 62 Z" fill="none" stroke="var(--ic)" stroke-width="2.5" stroke-linejoin="round"/>
  `
};

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/**
 * Build a data-URI SVG "product photo" for a given product + variant.
 * @param {object} product
 * @param {string} label small caption in the corner, e.g. color/angle
 * @param {number} seedOffset varies the pattern between multiple shots of the same product
 */
function productImage(product, label, seedOffset = 0) {
  const seed = hashStr(product.id) + seedOffset;
  const bg = PH_BG[seed % PH_BG.length];
  const bg2 = PH_BG[(seed + 2) % PH_BG.length];
  const accent = PH_ACCENT[seed % PH_ACCENT.length];
  const icon = PH_ICONS[product.category] || PH_ICONS["T-Shirts"];
  const stripeFlip = seed % 2 === 0;
  const caption = (label || product.category).toUpperCase();

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="900" viewBox="0 0 720 900">
  <defs>
    <linearGradient id="g${seed}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <style>.ic{--ic:#f2f1ed;}</style>
  </defs>
  <rect width="720" height="900" fill="url(#g${seed})"/>
  <polygon points="${stripeFlip ? '0,900 260,900 520,0 300,0' : '720,900 460,900 200,0 420,0'}"
           fill="${accent}" opacity="0.06"/>
  <g transform="translate(180,150) scale(3.4)" class="ic" opacity="0.92">
    ${icon}
  </g>
  <circle cx="640" cy="80" r="3" fill="${accent}" opacity="0.8"/>
  <text x="40" y="850" font-family="Space Grotesk, Arial, sans-serif" font-size="20" letter-spacing="4"
        fill="#f2f1ed" opacity="0.55">${caption}</text>
  <text x="40" y="60" font-family="Arial, sans-serif" font-size="14" letter-spacing="6"
        fill="${accent}" opacity="0.9">MISCHEIF</text>
</svg>`.trim();

  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

/** Small square version for cart/thumbnails */
function productThumb(product, seedOffset = 0) {
  return productImage(product, product.category, seedOffset);
}
