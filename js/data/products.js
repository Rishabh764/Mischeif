/* ==========================================================================
   MISCHIEF — Drop 01 catalogue (placeholder content for the demo store).
   Order here is the order pieces hang in the showroom corridor.

   Photos: `images: { front, back }` are transparent cut-outs (WebP or PNG).
   A piece without them falls back to a drawn stand-in. `turntable: [...]`
   (12–24 frames, one full spin, starting at the front and turning so the front
   swings toward the right of the picture) gives the hero piece a true spin.

   The descriptions and details below describe what the photos show. Fabric
   names are placeholders until there are real garments.
   ========================================================================== */

const piece = (id) => ({ front: `assets/pieces/${id}-front.webp`, back: `assets/pieces/${id}-back.webp` });
// 12 frames, one every 30°, all scaled to the same garment height.
const turn = (id) => Array.from({ length: 12 }, (_, i) => `assets/pieces/${id}-turn-${String(i * 30).padStart(3, "0")}.webp`);

export const PRODUCTS = [
  {
    id: "riot-hoodie",
    images: piece("riot-hoodie"),
    turntable: turn("riot-hoodie"),
    name: "Riot Hoodie",
    category: "Hoodies",
    kind: "hoodie",
    garment: "hoodie",
    price: 79,
    color: { name: "Blackout", hex: "#16161a" },
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    description: "Heavyweight black hoodie with a boxy, oversized cut. Red patch on the chest, RIOT across the back.",
    details: ["Heavyweight brushed fleece", "Oversized fit, dropped shoulders", "Red woven patch on the chest", "RIOT print with a red underline on the back", "Kangaroo pocket, ribbed cuffs and hem"]
  },
  {
    id: "troublemaker-tee",
    images: piece("troublemaker-tee"),
    name: "Troublemaker Tee",
    category: "Tees",
    kind: "tee",
    garment: "tee",
    price: 35,
    color: { name: "Blood Red", hex: "#8a1a1e" },
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    description: "Boxy heavyweight tee in blood red. Small wordmark on the chest, TROUBLE across the back.",
    details: ["Heavyweight cotton jersey", "Boxy fit, dropped shoulders", "Wordmark print on the chest", "TROUBLE print on the back", "Ribbed crew neck"]
  },
  {
    id: "blackout-bomber",
    images: piece("blackout-bomber"),
    name: "Blackout Bomber",
    category: "Jacket",
    kind: "bomber",
    garment: null,
    price: 149,
    color: { name: "Blackout", hex: "#131316" },
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Matte black bomber with a silver zip and a red badge on the sleeve.",
    details: ["Matte cotton-blend shell", "Silver front zip", "Ribbed collar, cuffs and hem", "Two slanted front pockets", "Red woven badge on the left sleeve", "Tonal lettering on the back"]
  },
  {
    id: "static-hoodie",
    images: piece("static-hoodie"),
    name: "Static Hoodie",
    category: "Hoodies",
    kind: "hoodie",
    garment: "hoodie",
    price: 89,
    color: { name: "Bone", hex: "#e4dfd5" },
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Cropped, boxy hoodie in bone with a heathered static texture and small red glitch marks.",
    details: ["Heathered fleece", "Cropped boxy fit, raw-cut hem", "Red glitch marks front and back", "Kangaroo pocket", "Ribbed cuffs"]
  },
  {
    id: "sneak-cargo",
    images: piece("sneak-cargo"),
    name: "Sneak Cargo",
    category: "Bottoms",
    kind: "cargo",
    garment: null,
    price: 95,
    color: { name: "Storm Grey", hex: "#5b5f66" },
    sizes: ["28", "30", "32", "34", "36", "38"],
    description: "Tapered cargo pants in storm grey with flap pockets on both thighs.",
    details: ["Cotton twill", "Tapered leg with ankle zips", "Flap cargo pockets on both thighs", "Two back pockets", "Elastic waist with drawcord", "Red label on the back waistband"]
  },
  {
    id: "staticnoise-tee",
    images: piece("staticnoise-tee"),
    name: "Static Noise Tee",
    category: "Tees",
    kind: "tee",
    garment: "tee",
    price: 39,
    color: { name: "Bone", hex: "#e4dfd5" },
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    description: "Bone tee covered in a static print, front and back. Small MISCHIEF wordmark on the chest, STATIC across the shoulders.",
    details: ["Heavyweight cotton jersey", "Boxy fit", "All-over static print", "MISCHIEF wordmark on the chest", "STATIC print on the back", "Ribbed crew neck"]
  },
  {
    id: "curfew-hoodie",
    images: piece("curfew-hoodie"),
    name: "Curfew Hoodie",
    category: "Hoodies",
    kind: "hoodie",
    garment: "hoodie",
    price: 85,
    color: { name: "Storm Grey", hex: "#5b5f66" },
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Storm-grey hoodie with a washed finish. Tonal wordmark on the chest, CURFEW across the back.",
    details: ["Midweight fleece, washed finish", "Relaxed oversized fit", "Tonal wordmark on the chest", "CURFEW print on the back", "Kangaroo pocket, ribbed cuffs and hem"]
  },
  {
    id: "riot-cap",
    images: piece("riot-cap"),
    name: "Riot Cap",
    category: "Accessories",
    kind: "cap",
    garment: null,
    price: 35,
    color: { name: "Bone", hex: "#e4dfd5" },
    sizes: ["One Size"],
    description: "Six-panel cap in bone twill with a red M patch on the front and a strap-back.",
    details: ["Cotton twill", "Six-panel, curved brim", "Red M patch on the front", "Adjustable strap with a metal buckle"]
  },
  {
    id: "nightcrawler-tee",
    images: piece("nightcrawler-tee"),
    name: "Nightcrawler Tee",
    category: "Tees",
    kind: "longsleeve",
    garment: "tee",
    price: 39,
    color: { name: "Blackout", hex: "#16161a" },
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Black long-sleeve tee with a red chest patch, red stripes on the sleeve and NIGHT across the back.",
    details: ["Heavyweight cotton jersey", "Long sleeves, ribbed cuffs", "Red patch on the chest", "Three red stripes on the left sleeve", "NIGHT print on the back"]
  },
  {
    id: "static-beanie",
    images: piece("static-beanie"),
    name: "Static Beanie",
    category: "Accessories",
    kind: "beanie",
    garment: null,
    price: 29,
    color: { name: "Blood Red", hex: "#8a1a1e" },
    sizes: ["One Size"],
    description: "Chunky rib-knit beanie in blood red with a wide cuff and a woven label.",
    details: ["Chunky rib knit", "Wide folded cuff", "Woven label on the front"]
  }
];

PRODUCTS.forEach((p, i) => { p.no = String(i + 1).padStart(2, "0"); p.index = i; });

export const CATEGORIES = ["Hoodies", "Tees", "Jacket", "Bottoms", "Accessories"];

export const getProduct = (id) => PRODUCTS.find((p) => p.id === id);

/** Demo prices are whole euros, written "€79". */
export const formatPrice = (n) => "€" + (Number.isInteger(n) ? n : n.toFixed(2));
