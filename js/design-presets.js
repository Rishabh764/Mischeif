/* ==========================================================================
   MISCHEIF — Preset design library for the Customizer
   Transparent-background SVG graphics/text, ready to drop onto a print zone.
   ========================================================================== */

const DESIGN_PRESETS = [
  {
    id: "bolt",
    name: "Bolt",
    category: "Graphics",
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <polygon points="120,10 40,110 90,110 75,190 165,80 110,80" fill="#ff3b30" stroke="#ffffff" stroke-width="4" stroke-linejoin="round"/>
    </svg>`
  },
  {
    id: "flame",
    name: "Flame",
    category: "Graphics",
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <path d="M100 10 C60 60 40 90 40 125 C40 165 68 190 100 190 C132 190 160 165 160 125 C160 100 148 85 138 72 C140 95 128 105 118 100 C126 80 112 55 90 40 C96 60 84 68 76 62 C82 48 82 28 100 10 Z"
        fill="#ff3b30"/>
      <path d="M100 70 C86 92 80 108 80 128 C80 148 90 160 100 160 C110 160 120 148 120 128 C120 116 114 108 108 100 C110 112 102 118 98 114 C104 100 98 84 100 70 Z" fill="#ffcf3b"/>
    </svg>`
  },
  {
    id: "skull",
    name: "Skull",
    category: "Graphics",
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <path d="M100 20 C60 20 35 50 35 90 C35 118 48 132 60 145 L60 165 L80 165 L80 150 L90 150 L90 165 L110 165 L110 150 L120 150 L120 165 L140 165 L140 145 C152 132 165 118 165 90 C165 50 140 20 100 20 Z" fill="#f3f2ee"/>
      <circle cx="72" cy="90" r="14" fill="#0a0a0b"/>
      <circle cx="128" cy="90" r="14" fill="#0a0a0b"/>
      <path d="M92 112 L100 128 L108 112 Z" fill="#0a0a0b"/>
      <path d="M78 140 L122 140 L118 150 L82 150 Z" fill="#0a0a0b"/>
    </svg>`
  },
  {
    id: "paw",
    name: "Paw Mark",
    category: "Graphics",
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="130" rx="46" ry="38" fill="#111111"/>
      <ellipse cx="55" cy="80" rx="18" ry="24" fill="#111111"/>
      <ellipse cx="95" cy="55" rx="18" ry="26" fill="#111111"/>
      <ellipse cx="140" cy="60" rx="18" ry="26" fill="#111111"/>
      <ellipse cx="168" cy="95" rx="16" ry="22" fill="#111111"/>
    </svg>`
  },
  {
    id: "starburst",
    name: "Starburst",
    category: "Graphics",
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <g fill="#c6ff00">
        <polygon points="100,10 112,80 100,100 88,80"/>
        <polygon points="100,190 112,120 100,100 88,120"/>
        <polygon points="10,100 80,88 100,100 80,112"/>
        <polygon points="190,100 120,88 100,100 120,112"/>
        <polygon points="35,35 90,80 100,100 78,90"/>
        <polygon points="165,165 110,120 100,100 122,110"/>
        <polygon points="165,35 110,80 100,100 122,90"/>
        <polygon points="35,165 90,120 100,100 78,110"/>
      </g>
      <circle cx="100" cy="100" r="16" fill="#0a0a0b"/>
    </svg>`
  },
  {
    id: "barbed",
    name: "Barbed Circle",
    category: "Graphics",
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="70" fill="none" stroke="#f3f2ee" stroke-width="6"/>
      <g stroke="#f3f2ee" stroke-width="5" stroke-linecap="round">
        <line x1="100" y1="30" x2="112" y2="10"/><line x1="100" y1="30" x2="88" y2="10"/>
        <line x1="163" y1="65" x2="182" y2="55"/><line x1="163" y1="65" x2="175" y2="45"/>
        <line x1="163" y1="135" x2="182" y2="145"/><line x1="163" y1="135" x2="175" y2="155"/>
        <line x1="100" y1="170" x2="112" y2="190"/><line x1="100" y1="170" x2="88" y2="190"/>
        <line x1="37" y1="135" x2="18" y2="145"/><line x1="37" y1="135" x2="25" y2="155"/>
        <line x1="37" y1="65" x2="18" y2="55"/><line x1="37" y1="65" x2="25" y2="45"/>
      </g>
    </svg>`
  },
  {
    id: "crown",
    name: "Crown",
    category: "Graphics",
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 150 L40 80 L75 115 L100 60 L125 115 L160 80 L170 150 Z" fill="#c6ff00" stroke="#0a0a0b" stroke-width="4" stroke-linejoin="round"/>
      <rect x="30" y="150" width="140" height="18" rx="3" fill="#c6ff00" stroke="#0a0a0b" stroke-width="4"/>
    </svg>`
  },
  {
    id: "smiley-x",
    name: "Trouble Face",
    category: "Graphics",
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="80" fill="#ffcf3b"/>
      <g stroke="#0a0a0b" stroke-width="8" stroke-linecap="round">
        <line x1="60" y1="75" x2="80" y2="95"/><line x1="80" y1="75" x2="60" y2="95"/>
        <line x1="120" y1="75" x2="140" y2="95"/><line x1="140" y1="75" x2="120" y2="95"/>
      </g>
      <path d="M60 135 C80 115 120 115 140 135" fill="none" stroke="#0a0a0b" stroke-width="8" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: "text-mischeif",
    name: "MISCHEIF Badge",
    category: "Lettering",
    svg: `<svg viewBox="0 0 260 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="252" height="92" rx="46" fill="#ff3b30"/>
      <text x="130" y="62" font-family="Arial Black, Arial, sans-serif" font-size="30" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">MISCHEIF</text>
    </svg>`
  },
  {
    id: "text-trouble",
    name: "TROUBLE",
    category: "Lettering",
    svg: `<svg viewBox="0 0 300 90" xmlns="http://www.w3.org/2000/svg">
      <text x="150" y="65" font-family="Arial Black, Arial, sans-serif" font-size="52" font-weight="900" fill="#f3f2ee" text-anchor="middle" letter-spacing="1">TROUBLE</text>
    </svg>`
  },
  {
    id: "text-norules",
    name: "NO RULES",
    category: "Lettering",
    svg: `<svg viewBox="0 0 300 110" xmlns="http://www.w3.org/2000/svg">
      <text x="150" y="48" font-family="Arial Black, Arial, sans-serif" font-size="34" font-weight="900" fill="#0a0a0b" text-anchor="middle" letter-spacing="1">NO</text>
      <text x="150" y="92" font-family="Arial Black, Arial, sans-serif" font-size="34" font-weight="900" fill="#0a0a0b" text-anchor="middle" letter-spacing="1">RULES</text>
    </svg>`
  },
  {
    id: "text-1996",
    name: "Est. Badge",
    category: "Lettering",
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="90" fill="none" stroke="#f3f2ee" stroke-width="4"/>
      <circle cx="100" cy="100" r="78" fill="none" stroke="#f3f2ee" stroke-width="2"/>
      <text x="100" y="70" font-family="Arial Black, Arial, sans-serif" font-size="18" fill="#f3f2ee" text-anchor="middle" letter-spacing="3">MISCHEIF</text>
      <text x="100" y="115" font-family="Arial Black, Arial, sans-serif" font-size="30" font-weight="900" fill="#f3f2ee" text-anchor="middle">2019</text>
      <text x="100" y="145" font-family="Arial Black, Arial, sans-serif" font-size="14" fill="#f3f2ee" text-anchor="middle" letter-spacing="3">NO RULES</text>
    </svg>`
  }
];

function presetDataUri(preset) {
  return "data:image/svg+xml;utf8," + encodeURIComponent(preset.svg.trim());
}

function getPresetById(id) {
  return DESIGN_PRESETS.find((p) => p.id === id);
}
