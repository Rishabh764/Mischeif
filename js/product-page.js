/* ==========================================================================
   MISCHEIF — Product detail page
   ========================================================================== */

(function () {
  const params = new URLSearchParams(window.location.search);
  const product = getProductById(params.get("id")) || PRODUCTS[0];

  let activeColor = product.colors[0].name;
  let activeSize = null;
  let qty = 1;
  let activeShotIndex = 0;

  const SHOTS = ["Front", "Back", "Detail", "Fit"];

  function shots() {
    return SHOTS.map((label, i) => productImage(product, `${activeColor} · ${label}`, i));
  }

  function renderCrumbs() {
    document.getElementById("pdp-crumbs").innerHTML =
      `<a href="index.html">Home</a> / <a href="shop.html?category=${encodeURIComponent(product.category)}">${product.category}</a> / <span>${product.name}</span>`;
  }

  function renderPDP() {
    document.getElementById("doc-title").textContent = `${product.name} — MISCHEIF`;
    const imgs = shots();

    document.getElementById("pdp-root").innerHTML = `
      <div class="pdp__gallery">
        <div class="pdp__main-img" data-tilt="5">
          <img id="pdp-main-img" src="${imgs[activeShotIndex]}" alt="${product.name}" width="720" height="900">
          <span data-tilt-glow></span>
        </div>
        <div class="pdp__thumbs" id="pdp-thumbs">
          ${imgs.map((src, i) => `<button data-shot="${i}" class="${i === activeShotIndex ? "active" : ""}"><img src="${src}" alt="${SHOTS[i]}"></button>`).join("")}
        </div>
      </div>

      <div class="pdp__info">
        <div class="eyebrow">${product.category}${product.tag ? " · " + product.tag : ""}</div>
        <h1>${product.name}</h1>
        <div class="pdp__rating">
          <span class="stars">${starRow(product.rating)}</span>
          <span>${product.rating} (${product.reviews} reviews)</span>
        </div>
        <div class="pdp__price">
          <span>${formatPrice(product.price)}</span>
          ${product.compareAt ? `<span class="price--compare">${formatPrice(product.compareAt)}</span>` : ""}
        </div>
        <p class="pdp__desc">${product.description}</p>

        <div class="option-group">
          <div class="option-group__head"><span>Color</span><span class="sub" id="color-label">${activeColor}</span></div>
          <div class="color-options" id="color-options">
            ${product.colors
              .map((c) => `<span class="color-swatch ${c.name === activeColor ? "active" : ""}" style="--sw:${c.hex}" data-color="${c.name}" title="${c.name}"></span>`)
              .join("")}
          </div>
        </div>

        <div class="option-group">
          <div class="option-group__head"><span>Size</span><a href="#" id="size-guide-link" class="sub">Size guide</a></div>
          <div class="size-options" id="size-options">
            ${product.sizes.map((s) => `<button data-size="${s}">${s}</button>`).join("")}
          </div>
        </div>

        <div class="qty-row">
          <div class="option-group__head" style="margin:0"><span>Quantity</span></div>
          <div class="qty-stepper">
            <button id="qty-minus">–</button>
            <span id="qty-value">1</span>
            <button id="qty-plus">+</button>
          </div>
        </div>

        <div class="pdp__actions">
          <button class="btn btn--primary" id="add-to-cart-btn">Add to Bag — ${formatPrice(product.price)}</button>
          <button class="btn btn--outline icon-btn" aria-label="Add to wishlist">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z"/></svg>
          </button>
        </div>

        <div class="pdp__meta-row">
          <span>🚚 Free shipping over $75</span>
          <span>↩ 30-day returns</span>
          <span>🔒 Secure checkout</span>
        </div>

        <div id="accordion"></div>
      </div>
    `;

    buildAccordion();
    bindPDPEvents();
    if (typeof initTilt === "function") initTilt(document.getElementById("pdp-root"));
  }

  function buildAccordion() {
    const items = [
      { title: "Description & Details", body: `<ul>${product.details.map((d) => `<li>${d}</li>`).join("")}</ul>` },
      { title: "Size & Fit", body: `<p>Model is 6'1" / 185cm wearing size M. This style is cut ${product.category === "Bottoms" ? "true to size with a slight taper" : "oversized — size down for a slimmer fit"}. See our size guide for full measurements.</p>` },
      { title: "Shipping & Returns", body: `<p>Free standard shipping on orders over $75. Orders ship within 24–48 hours. Not feeling it? Returns are free within 30 days of delivery, unworn with tags attached.</p>` }
    ];
    document.getElementById("accordion").innerHTML = items
      .map(
        (it, i) => `
      <div class="accordion-item ${i === 0 ? "open" : ""}" data-acc-item>
        <button class="accordion-item__head" data-acc-head>${it.title}<span class="plus">+</span></button>
        <div class="accordion-item__body"><div class="accordion-item__body-inner">${it.body}</div></div>
      </div>`
      )
      .join("");

    document.querySelectorAll("[data-acc-item]").forEach((item) => {
      const body = item.querySelector(".accordion-item__body");
      if (item.classList.contains("open")) body.style.maxHeight = body.scrollHeight + "px";
      item.querySelector("[data-acc-head]").addEventListener("click", () => {
        const isOpen = item.classList.contains("open");
        document.querySelectorAll("[data-acc-item]").forEach((other) => {
          other.classList.remove("open");
          other.querySelector(".accordion-item__body").style.maxHeight = null;
        });
        if (!isOpen) {
          item.classList.add("open");
          body.style.maxHeight = body.scrollHeight + "px";
        }
      });
    });
  }

  function bindPDPEvents() {
    document.querySelectorAll("#color-options .color-swatch").forEach((sw) => {
      sw.addEventListener("click", () => {
        activeColor = sw.getAttribute("data-color");
        activeShotIndex = 0;
        renderPDP();
      });
    });

    document.querySelectorAll("#size-options button").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeSize = btn.getAttribute("data-size");
        document.querySelectorAll("#size-options button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });

    document.querySelectorAll("#pdp-thumbs button").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeShotIndex = parseInt(btn.getAttribute("data-shot"), 10);
        document.getElementById("pdp-main-img").src = shots()[activeShotIndex];
        document.querySelectorAll("#pdp-thumbs button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });

    document.getElementById("qty-minus").addEventListener("click", () => {
      qty = Math.max(1, qty - 1);
      document.getElementById("qty-value").textContent = qty;
    });
    document.getElementById("qty-plus").addEventListener("click", () => {
      qty = Math.min(10, qty + 1);
      document.getElementById("qty-value").textContent = qty;
    });

    document.getElementById("add-to-cart-btn").addEventListener("click", () => {
      if (!activeSize) {
        toast("Please select a size first");
        return;
      }
      addToCart({ id: product.id, size: activeSize, color: activeColor, qty });
      toast(`Added "${product.name}" (${activeSize} · ${activeColor}) to your bag`);
    });

    document.getElementById("size-guide-link").addEventListener("click", (e) => {
      e.preventDefault();
      toast("Size guide: XS–XXL, true to size unless noted.");
    });
  }

  function renderRelated() {
    const related = getRelatedProducts(product, 4);
    if (!related.length) return;
    document.getElementById("related-section").style.display = "";
    renderGrid(document.getElementById("related-grid"), related);
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderCrumbs();
    renderPDP();
    renderRelated();
  });
})();
