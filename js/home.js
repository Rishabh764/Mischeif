/* ==========================================================================
   MISCHEIF — Home page population
   ========================================================================== */

(function () {
  const CATEGORY_TILES = ["Hoodies", "T-Shirts", "Jackets", "Accessories"];

  document.addEventListener("DOMContentLoaded", () => {
    // Hero image
    const heroProduct = getProductById("curfew-hoodie");
    const heroImg = document.getElementById("hero-image");
    if (heroImg && heroProduct) heroImg.src = productImage(heroProduct, "Look 01", 3);

    // Category tiles
    const catGrid = document.getElementById("category-grid");
    if (catGrid) {
      catGrid.innerHTML = CATEGORY_TILES.map((cat) => {
        const rep = PRODUCTS.find((p) => p.category === cat);
        const img = productImage(rep, cat, 2);
        const count = PRODUCTS.filter((p) => p.category === cat).length;
        return `
        <a class="cat-tile" href="shop.html?category=${encodeURIComponent(cat)}" data-tilt="6">
          <img src="${img}" alt="${cat}" loading="lazy" width="600" height="800">
          <span data-tilt-glow></span>
          <div class="cat-tile__label">
            <span>${cat}</span>
            <span>${count} items</span>
          </div>
        </a>`;
      }).join("");
      initTilt(catGrid);
    }

    // Bestsellers
    const bestsellers = PRODUCTS.filter((p) => p.tag === "Bestseller").slice(0, 4);
    renderGrid(document.getElementById("bestsellers-grid"), bestsellers);

    // New arrivals
    const newArrivals = PRODUCTS.filter((p) => p.tag === "New").slice(0, 4);
    renderGrid(document.getElementById("newarrivals-grid"), newArrivals.length ? newArrivals : PRODUCTS.slice(0, 4));

    // Design Studio promo art
    const studioMedia = document.getElementById("promo-studio-media");
    if (studioMedia) {
      studioMedia.insertAdjacentHTML("afterbegin", garmentSVG("hoodie", "front", "#111111", "#ff3b30"));
    }

    // Editorial images
    const ed1 = document.getElementById("editorial-img-1");
    const ed2 = document.getElementById("editorial-img-2");
    if (ed1) ed1.src = productImage(getProductById("static-hoodie"), "Static", 5);
    if (ed2) ed2.src = productImage(getProductById("blackout-bomber"), "Outerwear", 6);
    initTilt(document.body);

    // Instagram-style gallery strip
    const galleryProducts = [
      "riot-hoodie", "troublemaker-tee", "blackout-bomber", "sneak-cargo", "riot-cap", "nightcrawler-tee"
    ].map(getProductById);
    const strip = document.getElementById("gallery-strip");
    if (strip) {
      strip.innerHTML = galleryProducts
        .map(
          (p, i) => `<a href="product.html?id=${p.id}"><img src="${productImage(p, "IG", i + 10)}" alt="${p.name}" loading="lazy" width="400" height="400"></a>`
        )
        .join("");
    }
  });
})();
