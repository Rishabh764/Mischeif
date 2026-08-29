/* ==========================================================================
   MISCHEIF — Dummy product catalog
   All data below is placeholder content for demo/UX purposes.
   ========================================================================== */

const PRODUCTS = [
  {
    id: "riot-hoodie",
    name: "Riot Hoodie",
    category: "Hoodies",
    price: 78,
    compareAt: 98,
    tag: "Sale",
    rating: 4.8,
    reviews: 214,
    colors: [
      { name: "Blackout", hex: "#111111" },
      { name: "Bone", hex: "#e8e3da" },
      { name: "Blood Red", hex: "#7a1518" }
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    description:
      "The Riot Hoodie is built heavyweight, cut oversized, and made to survive whatever you put it through. Garment-dyed for a broken-in feel from day one.",
    details: [
      "440gsm brushed-back fleece",
      "Garment-dyed for a faded, vintage finish",
      "Dropped shoulder, boxy fit",
      "Kangaroo pocket + reinforced drawcords",
      "Ribbed cuffs & hem"
    ]
  },
  {
    id: "curfew-hoodie",
    name: "Curfew Hoodie",
    category: "Hoodies",
    price: 84,
    tag: "Bestseller",
    rating: 4.9,
    reviews: 341,
    colors: [
      { name: "Midnight", hex: "#14161c" },
      { name: "Storm Grey", hex: "#5b5f66" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description:
      "A house favorite. Curfew is our signature midweight hoodie — clean lines, minimal branding, maximum comfort for late-night missions.",
    details: [
      "380gsm cotton fleece blend",
      "Relaxed unisex fit",
      "Split-stitch hood lining",
      "Embroidered chest hit",
      "Pre-shrunk"
    ]
  },
  {
    id: "static-hoodie",
    name: "Static Hoodie",
    category: "Hoodies",
    price: 88,
    tag: "New",
    rating: 4.6,
    reviews: 58,
    colors: [
      { name: "Bone", hex: "#e8e3da" },
      { name: "Blackout", hex: "#111111" }
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description:
      "Static plays with tonal noise-print graphics and a cropped silhouette. Built for layering, styled for trouble.",
    details: [
      "360gsm loopback fleece",
      "Cropped boxy fit",
      "All-over tonal static print",
      "Double-layer hood",
      "Raw-cut hem"
    ]
  },
  {
    id: "alleycat-hoodie",
    name: "Alley Cat Hoodie",
    category: "Hoodies",
    price: 82,
    tag: null,
    rating: 4.7,
    reviews: 122,
    colors: [
      { name: "Blood Red", hex: "#7a1518" },
      { name: "Midnight", hex: "#14161c" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description:
      "Zip-through comfort with the same rebellious DNA. Alley Cat is your go-to throw-on for sneaking out after dark.",
    details: [
      "400gsm fleece",
      "Full-zip closure",
      "Two-way YKK zipper",
      "Ribbed side panels",
      "Interior media pocket"
    ]
  },

  {
    id: "troublemaker-tee",
    name: "Troublemaker Tee",
    category: "T-Shirts",
    price: 34,
    tag: "Bestseller",
    rating: 4.8,
    reviews: 502,
    colors: [
      { name: "Blackout", hex: "#111111" },
      { name: "Bone", hex: "#e8e3da" },
      { name: "Blood Red", hex: "#7a1518" }
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    description:
      "Our best-selling tee. Heavyweight cotton, boxy fit, back-print graphic. The one everyone asks about.",
    details: [
      "240gsm combed cotton",
      "Boxy, oversized fit",
      "Puff-print back graphic",
      "Twin-needle stitching",
      "Shrink-resistant"
    ]
  },
  {
    id: "backstreet-tee",
    name: "Backstreet Tee",
    category: "T-Shirts",
    price: 32,
    tag: null,
    rating: 4.5,
    reviews: 87,
    colors: [
      { name: "Storm Grey", hex: "#5b5f66" },
      { name: "Blackout", hex: "#111111" }
    ],
    sizes: ["S", "M", "L", "XL"],
    description:
      "Stripped-back staple tee with a subtle chest logo. Built to be worn on repeat.",
    details: [
      "220gsm ringspun cotton",
      "Regular fit",
      "Chest embroidery",
      "Reinforced collar seam"
    ]
  },
  {
    id: "staticnoise-tee",
    name: "Static Noise Tee",
    category: "T-Shirts",
    price: 36,
    tag: "New",
    rating: 4.4,
    reviews: 29,
    colors: [
      { name: "Bone", hex: "#e8e3da" },
      { name: "Midnight", hex: "#14161c" }
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    description:
      "Companion piece to the Static Hoodie. Tonal noise graphic wrapped around a relaxed heavyweight tee.",
    details: [
      "260gsm cotton",
      "Relaxed fit",
      "All-over front print",
      "Dropped shoulder seam"
    ]
  },
  {
    id: "nightcrawler-tee",
    name: "Nightcrawler Tee",
    category: "T-Shirts",
    price: 34,
    tag: "Sale",
    compareAt: 42,
    rating: 4.6,
    reviews: 163,
    colors: [
      { name: "Blackout", hex: "#111111" },
      { name: "Blood Red", hex: "#7a1518" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description:
      "Long-sleeve heavyweight tee for nights that run too late. Ribbed cuffs keep it locked in place.",
    details: [
      "260gsm cotton",
      "Long sleeve, regular fit",
      "Ribbed cuffs",
      "Chest & sleeve print"
    ]
  },
  {
    id: "ghost-tee",
    name: "Ghost Tee",
    category: "T-Shirts",
    price: 30,
    tag: null,
    rating: 4.3,
    reviews: 41,
    colors: [
      { name: "Bone", hex: "#e8e3da" },
      { name: "Storm Grey", hex: "#5b5f66" }
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description:
      "Washed-out and worn-in from the first wear. Ghost is our lightest tee, made for layering under everything else.",
    details: [
      "200gsm garment-washed cotton",
      "Slim-relaxed fit",
      "Tonal micro logo",
      "Curved hem"
    ]
  },

  {
    id: "blackout-bomber",
    name: "Blackout Bomber",
    category: "Jackets",
    price: 148,
    tag: "Bestseller",
    rating: 4.9,
    reviews: 176,
    colors: [
      { name: "Blackout", hex: "#111111" },
      { name: "Midnight", hex: "#14161c" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description:
      "Classic bomber silhouette rebuilt with a matte technical shell and quilted lining for real cold.",
    details: [
      "Water-resistant technical shell",
      "Quilted interior lining",
      "Ribbed collar, cuffs & hem",
      "Interior zip pocket",
      "Embroidered sleeve badge"
    ]
  },
  {
    id: "renegade-trucker",
    name: "Renegade Trucker Jacket",
    category: "Jackets",
    price: 132,
    tag: "New",
    rating: 4.5,
    reviews: 22,
    colors: [
      { name: "Blood Red", hex: "#7a1518" },
      { name: "Bone", hex: "#e8e3da" }
    ],
    sizes: ["S", "M", "L", "XL"],
    description:
      "Rigid denim-weight trucker with distressed hardware and a chest patch. Built to fade with you.",
    details: [
      "12oz cotton twill",
      "Antique brass hardware",
      "Chest patch pockets",
      "Adjustable waist tabs"
    ]
  },
  {
    id: "midnight-coach",
    name: "Midnight Coach Jacket",
    category: "Jackets",
    price: 118,
    tag: null,
    rating: 4.6,
    reviews: 64,
    colors: [
      { name: "Midnight", hex: "#14161c" },
      { name: "Storm Grey", hex: "#5b5f66" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description:
      "Lightweight coach jacket for the in-between seasons. Snap-front closure, packable shell.",
    details: [
      "Nylon taffeta shell",
      "Snap-button placket",
      "Packs into own pocket",
      "Contrast interior print"
    ]
  },

  {
    id: "sneak-cargo",
    name: "Sneak Cargo Pants",
    category: "Bottoms",
    price: 92,
    tag: "Bestseller",
    rating: 4.7,
    reviews: 198,
    colors: [
      { name: "Blackout", hex: "#111111" },
      { name: "Storm Grey", hex: "#5b5f66" }
    ],
    sizes: ["28", "30", "32", "34", "36", "38"],
    description:
      "Utility cargo pants with a tapered leg and triple-stitched pockets. Made for carrying trouble.",
    details: [
      "Ripstop cotton twill",
      "Tapered fit",
      "6-pocket cargo construction",
      "Elastic waist w/ drawcord",
      "Ankle zip closure"
    ]
  },
  {
    id: "loiter-joggers",
    name: "Loiter Joggers",
    category: "Bottoms",
    price: 68,
    tag: null,
    rating: 4.6,
    reviews: 143,
    colors: [
      { name: "Midnight", hex: "#14161c" },
      { name: "Bone", hex: "#e8e3da" }
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    description:
      "Everyday fleece joggers with a tapered leg and deep side pockets. Loiter responsibly.",
    details: [
      "380gsm fleece",
      "Tapered fit, elastic cuffs",
      "Deep side pockets",
      "Drawcord waistband"
    ]
  },
  {
    id: "alley-trackpants",
    name: "Alley Track Pants",
    category: "Bottoms",
    price: 74,
    tag: "New",
    rating: 4.4,
    reviews: 19,
    colors: [
      { name: "Blackout", hex: "#111111" },
      { name: "Blood Red", hex: "#7a1518" }
    ],
    sizes: ["S", "M", "L", "XL"],
    description:
      "Side-stripe track pants with a relaxed fit and satin-finish shell. Built to move.",
    details: [
      "Satin-finish tricot",
      "Side stripe detailing",
      "Relaxed fit",
      "Zip ankle openings"
    ]
  },
  {
    id: "curfew-shorts",
    name: "Curfew Shorts",
    category: "Bottoms",
    price: 52,
    tag: "Sale",
    compareAt: 64,
    rating: 4.5,
    reviews: 76,
    colors: [
      { name: "Storm Grey", hex: "#5b5f66" },
      { name: "Blackout", hex: "#111111" }
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description:
      "Fleece shorts cut from the same block as Curfew. Above-the-knee length, deep pockets.",
    details: [
      "380gsm fleece",
      "Relaxed fit",
      "Side seam pockets",
      "Ribbed waistband"
    ]
  },

  {
    id: "riot-cap",
    name: "Riot Cap",
    category: "Accessories",
    price: 36,
    tag: "Bestseller",
    rating: 4.8,
    reviews: 261,
    colors: [
      { name: "Blackout", hex: "#111111" },
      { name: "Bone", hex: "#e8e3da" }
    ],
    sizes: ["One Size"],
    description:
      "Structured 6-panel cap with a low profile and embroidered front logo. Adjustable strap-back.",
    details: [
      "Cotton twill construction",
      "Structured 6-panel",
      "Embroidered logo",
      "Adjustable strap-back"
    ]
  },
  {
    id: "static-beanie",
    name: "Static Beanie",
    category: "Accessories",
    price: 28,
    tag: null,
    rating: 4.6,
    reviews: 94,
    colors: [
      { name: "Midnight", hex: "#14161c" },
      { name: "Blood Red", hex: "#7a1518" }
    ],
    sizes: ["One Size"],
    description:
      "Ribbed knit beanie with a folded cuff and woven label. One size, all attitude.",
    details: [
      "Acrylic rib knit",
      "Folded cuff",
      "Woven brand label"
    ]
  },
  {
    id: "contraband-tote",
    name: "Contraband Tote",
    category: "Accessories",
    price: 42,
    tag: "New",
    rating: 4.3,
    reviews: 15,
    colors: [
      { name: "Bone", hex: "#e8e3da" },
      { name: "Blackout", hex: "#111111" }
    ],
    sizes: ["One Size"],
    description:
      "Heavy canvas tote built to haul whatever you're smuggling. Interior pocket, reinforced handles.",
    details: [
      "16oz cotton canvas",
      "Reinforced handles",
      "Interior zip pocket",
      "Screen-printed graphic"
    ]
  },
  {
    id: "mischeif-socks",
    name: "Mischeif Socks (3-Pack)",
    category: "Accessories",
    price: 24,
    tag: null,
    rating: 4.7,
    reviews: 108,
    colors: [
      { name: "Mixed", hex: "#3a3a3a" }
    ],
    sizes: ["One Size"],
    description:
      "Cushioned crew socks, three pairs, tonal branding. The small stuff matters too.",
    details: [
      "Combed cotton blend",
      "Cushioned footbed",
      "Ribbed cuff",
      "3 pairs per pack"
    ]
  }
];

/* Helpers -------------------------------------------------------------- */

function getProductById(id) {
  return PRODUCTS.find((p) => p.id === id);
}

function getRelatedProducts(product, count = 4) {
  return PRODUCTS.filter(
    (p) => p.id !== product.id && p.category === product.category
  ).slice(0, count);
}

function formatPrice(n) {
  return "$" + n.toFixed(2).replace(/\.00$/, "");
}
