/* ==========================================================================
   MISCHEIF — Shared product-card rendering
   ========================================================================== */

function starRow(rating) {
  const full = Math.round(rating);
  let out = "";
  for (let i = 0; i < 5; i++) {
    out += i < full ? "★" : "☆";
  }
  return out;
}

const CATEGORY_TO_GARMENT = { Hoodies: "hoodie", "T-Shirts": "tee" };

function productCardHTML(product) {
  const img = productImage(product, product.colors[0].name, 0);
  const imgHover = productImage(product, "Back", 1);
  const price = formatPrice(product.price);
  const compareAt = product.compareAt ? formatPrice(product.compareAt) : "";
  const garment = CATEGORY_TO_GARMENT[product.category];

  return `
  <article class="p-card" data-reveal>
    <a class="p-card__media" href="product.html?id=${product.id}" aria-label="${product.name}" data-tilt="10">
      ${product.tag ? `<span class="badge badge--${product.tag.toLowerCase()}">${product.tag}</span>` : ""}
      ${garment ? `<button type="button" class="badge-customize" data-customize-link="customize.html?garment=${garment}&color=${encodeURIComponent(product.colors[0].name)}" title="Design your own">🎨 Customize</button>` : ""}
      <img class="p-card__img p-card__img--front" src="${img}" alt="${product.name}" loading="lazy" width="720" height="900">
      <img class="p-card__img p-card__img--back" src="${imgHover}" alt="" loading="lazy" width="720" height="900">
      <span data-tilt-glow></span>
      <button class="p-card__quickadd" data-quick-add="${product.id}">+ Quick Add</button>
    </a>
    <div class="p-card__body">
      <div class="p-card__row">
        <a class="p-card__name" href="product.html?id=${product.id}">${product.name}</a>
      </div>
      <div class="p-card__meta">
        <span class="p-card__rating" title="${product.rating} / 5">${starRow(product.rating)}</span>
        <span class="p-card__reviews">(${product.reviews})</span>
      </div>
      <div class="p-card__price">
        <span class="price">${price}</span>
        ${compareAt ? `<span class="price price--compare">${compareAt}</span>` : ""}
      </div>
      <div class="p-card__swatches">
        ${product.colors
          .map((c) => `<span class="swatch" style="--sw:${c.hex}" title="${c.name}"></span>`)
          .join("")}
      </div>
    </div>
  </article>`;
}

function renderGrid(container, products, emptyMessage = "No products match those filters.") {
  if (!container) return;
  if (products.length === 0) {
    container.innerHTML = `<p class="empty-state">${emptyMessage}</p>`;
    return;
  }
  container.innerHTML = products.map(productCardHTML).join("");
  initQuickAdd();
  initReveal();
  initCustomizeBadges(container);
  if (typeof initTilt === "function") initTilt(container);
}

function initCustomizeBadges(root = document) {
  root.querySelectorAll("[data-customize-link]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = btn.getAttribute("data-customize-link");
    });
  });
}
