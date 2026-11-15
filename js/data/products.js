/* ==========================================================================
   MISCHIEF — Drop 01 catalogue (placeholder content for the demo store).
   Order here is the order pieces hang in the showroom corridor.

   Real photography: set `images: { front, back }` to transparent cut-outs (WebP or PNG)
   (e.g. "assets/pieces/riot-hoodie-front.webp") and the showroom uses them
   instead of the drawn stand-in. `turntable: [...]` (12–24 frames, one full
   spin) replaces the front/back flip on the hero piece.
   ========================================================================== */

export const PRODUCTS = [
  {
    id: "riot-hoodie",
    images: { front: "assets/pieces/riot-hoodie-front.webp", back: "assets/pieces/riot-hoodie-back.webp" },
    name: "Riot Hoodie",
    category: "Hoodies",
    kind: "hoodie",
    garment: "hoodie",
    price: 79,
    color: { name: "Blackout", hex: "#16161a" },
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    description:
      "Built heavyweight, cut oversized, and made to survive whatever you put it through. Garment-dyed for a broken-in feel from day one.",
    details: ["440gsm brushed-back fleece", "Garment-dyed, faded finish", "Dropped shoulder, boxy fit", "Kangaroo pocket, reinforced drawcords", "Ribbed cuffs and hem"]
  },
  {
    id: "troublemaker-tee",
    images: { front: "assets/pieces/troublemaker-tee-front.webp", back: "assets/pieces/troublemaker-tee-back.webp" },
    name: "Troublemaker Tee",
    category: "Tees",
    kind: "tee",
    garment: "tee",
    price: 35,
    color: { name: "Blood Red", hex: "#8a1a1e" },
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    description: "Heavyweight cotton, boxy fit, back-print graphic. The one everyone asks about.",
    details: ["240gsm combed cotton", "Boxy, oversized fit", "Puff-print back graphic", "Twin-needle stitching"]
  },
  {
    id: "blackout-bomber",
    images: { front: "assets/pieces/blackout-bomber-front.webp", back: "assets/pieces/blackout-bomber-back.webp" },
    name: "Blackout Bomber",
    category: "Jacket",
    kind: "bomber",
    garment: null,
    price: 149,
    color: { name: "Blackout", hex: "#131316" },
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Classic bomber silhouette rebuilt with a matte technical shell and quilted lining for real cold.",
    details: ["Water-resistant technical shell", "Quilted interior lining", "Ribbed collar, cuffs and hem", "Interior zip pocket", "Embroidered sleeve badge"]
  },
  {
    id: "static-hoodie",
    images: { front: "assets/pieces/static-hoodie-front.webp", back: "assets/pieces/static-hoodie-back.webp" },
    name: "Static Hoodie",
    category: "Hoodies",
    kind: "hoodie",
    garment: "hoodie",
    price: 89,
    color: { name: "Bone", hex: "#e4dfd5" },
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Tonal noise-print graphics on a cropped silhouette. Built for layering, styled for trouble.",
    details: ["360gsm loopback fleece", "Cropped boxy fit", "All-over tonal static print", "Double-layer hood", "Raw-cut hem"]
  },
  {
    id: "sneak-cargo",
    images: { front: "assets/pieces/sneak-cargo-front.webp", back: "assets/pieces/sneak-cargo-back.webp" },
    name: "Sneak Cargo",
    category: "Bottoms",
    kind: "cargo",
    garment: null,
    price: 95,
    color: { name: "Storm Grey", hex: "#5b5f66" },
    sizes: ["28", "30", "32", "34", "36", "38"],
    description: "Utility cargo with a tapered leg and triple-stitched pockets. Made for carrying trouble.",
    details: ["Ripstop cotton twill", "Tapered fit", "Six-pocket cargo construction", "Elastic waist with drawcord", "Ankle zip closure"]
  },
  {
    id: "staticnoise-tee",
    images: { front: "assets/pieces/staticnoise-tee-front.webp", back: "assets/pieces/staticnoise-tee-back.webp" },
    name: "Static Noise Tee",
    category: "Tees",
    kind: "tee",
    garment: "tee",
    price: 39,
    color: { name: "Bone", hex: "#e4dfd5" },
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    description: "Companion piece to the Static Hoodie. Tonal noise graphic wrapped around a relaxed heavyweight tee.",
    details: ["260gsm cotton", "Relaxed fit", "All-over front print", "Dropped shoulder seam"]
  },
  {
    id: "curfew-hoodie",
    images: { front: "assets/pieces/curfew-hoodie-front.webp", back: "assets/pieces/curfew-hoodie-back.webp" },
    name: "Curfew Hoodie",
    category: "Hoodies",
    kind: "hoodie",
    garment: "hoodie",
    price: 85,
    color: { name: "Storm Grey", hex: "#5b5f66" },
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "The midweight hoodie. Clean lines, minimal branding, built for late-night missions.",
    details: ["380gsm cotton fleece blend", "Relaxed unisex fit", "Split-stitch hood lining", "Embroidered chest hit", "Pre-shrunk"]
  },
  {
    id: "riot-cap",
    images: { front: "assets/pieces/riot-cap-front.webp", back: "assets/pieces/riot-cap-back.webp" },
    name: "Riot Cap",
    category: "Accessories",
    kind: "cap",
    garment: null,
    price: 35,
    color: { name: "Bone", hex: "#e4dfd5" },
    sizes: ["One Size"],
    description: "Structured six-panel cap with a low profile and embroidered front logo. Adjustable strap-back.",
    details: ["Cotton twill", "Structured six-panel", "Embroidered logo", "Adjustable strap-back"]
  },
  {
    id: "nightcrawler-tee",
    images: { front: "assets/pieces/nightcrawler-tee-front.webp", back: "assets/pieces/nightcrawler-tee-back.webp" },
    name: "Nightcrawler Tee",
    category: "Tees",
    kind: "longsleeve",
    garment: "tee",
    price: 39,
    color: { name: "Blackout", hex: "#16161a" },
    sizes: ["S", "M", "L", "XL", "XXL"],
    description: "Long-sleeve heavyweight tee for nights that run too late. Ribbed cuffs keep it locked in place.",
    details: ["260gsm cotton", "Long sleeve, regular fit", "Ribbed cuffs", "Chest and sleeve print"]
  },
  {
    id: "static-beanie",
    images: { front: "assets/pieces/static-beanie-front.webp", back: "assets/pieces/static-beanie-back.webp" },
    name: "Static Beanie",
    category: "Accessories",
    kind: "beanie",
    garment: null,
    price: 29,
    color: { name: "Blood Red", hex: "#8a1a1e" },
    sizes: ["One Size"],
    description: "Ribbed knit beanie with a folded cuff and woven label. One size, all attitude.",
    details: ["Acrylic rib knit", "Folded cuff", "Woven brand label"]
  }
];

PRODUCTS.forEach((p, i) => { p.no = String(i + 1).padStart(2, "0"); p.index = i; });

export const CATEGORIES = ["Hoodies", "Tees", "Jacket", "Bottoms", "Accessories"];

export const getProduct = (id) => PRODUCTS.find((p) => p.id === id);

/** Demo prices are whole euros, written "€79". */
export const formatPrice = (n) => "€" + (Number.isInteger(n) ? n : n.toFixed(2));
