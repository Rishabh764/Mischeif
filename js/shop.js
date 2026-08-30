/* ==========================================================================
   MISCHEIF — Shop / catalog page: filtering, sorting, URL sync
   ========================================================================== */

(function () {
  const ALL_CATEGORIES = ["Hoodies", "T-Shirts", "Jackets", "Bottoms", "Accessories"];
  const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

  const state = {
    categories: [],
    sizes: [],
    maxPrice: 160,
    saleOnly: false,
    sort: "featured"
  };

  function readStateFromURL() {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category");
    if (cat) state.categories = [cat];
  }

  function matchesFilters(p) {
    if (state.categories.length && !state.categories.includes(p.category)) return false;
    if (state.sizes.length && !p.sizes.some((s) => state.sizes.includes(s))) return false;
    if (p.price > state.maxPrice) return false;
    if (state.saleOnly && p.tag !== "Sale") return false;
    return true;
  }

  function sortProducts(list) {
    const copy = [...list];
    switch (state.sort) {
      case "price-asc": return copy.sort((a, b) => a.price - b.price);
      case "price-desc": return copy.sort((a, b) => b.price - a.price);
      case "rating": return copy.sort((a, b) => b.rating - a.rating);
      case "name": return copy.sort((a, b) => a.name.localeCompare(b.name));
      default: return copy;
    }
  }

  function renderCategoryFilters() {
    const host = document.getElementById("filter-category");
    host.innerHTML = ALL_CATEGORIES.map((cat) => {
      const count = PRODUCTS.filter((p) => p.category === cat).length;
      const checked = state.categories.includes(cat) ? "checked" : "";
      return `
      <label class="filter-option">
        <input type="checkbox" value="${cat}" data-filter-cat ${checked}>
        ${cat} <span class="count">${count}</span>
      </label>`;
    }).join("");
    host.querySelectorAll("[data-filter-cat]").forEach((box) => {
      box.addEventListener("change", () => {
        const val = box.value;
        if (box.checked) state.categories.push(val);
        else state.categories = state.categories.filter((c) => c !== val);
        syncURL();
        update();
      });
    });
  }

  function renderSizeFilters() {
    const host = document.getElementById("filter-size");
    host.innerHTML = ALL_SIZES.map((size) => {
      const active = state.sizes.includes(size) ? "active" : "";
      return `<button type="button" class="${active}" data-size="${size}">${size}</button>`;
    }).join("");
    host.querySelectorAll("[data-size]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const size = btn.getAttribute("data-size");
        if (state.sizes.includes(size)) {
          state.sizes = state.sizes.filter((s) => s !== size);
          btn.classList.remove("active");
        } else {
          state.sizes.push(size);
          btn.classList.add("active");
        }
        update();
      });
    });
  }

  function renderChips() {
    const chips = [];
    state.categories.forEach((c) => chips.push({ label: c, clear: () => (state.categories = state.categories.filter((x) => x !== c)) }));
    state.sizes.forEach((s) => chips.push({ label: `Size ${s}`, clear: () => (state.sizes = state.sizes.filter((x) => x !== s)) }));
    if (state.saleOnly) chips.push({ label: "On Sale", clear: () => (state.saleOnly = false) });
    if (state.maxPrice < 160) chips.push({ label: `Under $${state.maxPrice}`, clear: () => (state.maxPrice = 160) });

    const host = document.getElementById("active-chips");
    if (!chips.length) { host.innerHTML = ""; return; }
    host.innerHTML = chips
      .map((c, i) => `<span class="chip" data-chip-index="${i}">${c.label} <button aria-label="Remove filter">✕</button></span>`)
      .join("");
    host.querySelectorAll("[data-chip-index]").forEach((el) => {
      el.querySelector("button").addEventListener("click", () => {
        chips[parseInt(el.getAttribute("data-chip-index"), 10)].clear();
        syncFiltersUI();
        syncURL();
        update();
      });
    });
  }

  function syncFiltersUI() {
    renderCategoryFilters();
    renderSizeFilters();
    document.getElementById("filter-sale").checked = state.saleOnly;
    document.getElementById("filter-price").value = state.maxPrice;
    document.getElementById("price-max-label").textContent = "$" + state.maxPrice;
  }

  function syncURL() {
    const params = new URLSearchParams();
    if (state.categories.length === 1) params.set("category", state.categories[0]);
    const qs = params.toString();
    history.replaceState(null, "", qs ? `shop.html?${qs}` : "shop.html");
  }

  function updateTitle() {
    const title = document.getElementById("shop-title");
    const crumb = document.getElementById("crumb-current");
    const label = state.categories.length === 1 ? state.categories[0] : "Shop All";
    title.textContent = label;
    crumb.textContent = label;
    document.title = `${label} — MISCHEIF`;
  }

  function updateNavActive() {
    const navLinks = document.querySelectorAll("[data-nav-panel] a");
    const target =
      state.categories.length === 1
        ? `shop.html?category=${encodeURIComponent(state.categories[0])}`
        : "shop.html";
    let matched = null;
    navLinks.forEach((a) => {
      a.classList.remove("is-active");
      if (a.getAttribute("href") === target) matched = a;
    });
    // Fall back to "Shop All" when the active category has no dedicated nav link
    // (e.g. Jackets/Bottoms/Accessories only appear via the category tiles/filters).
    (matched || document.querySelector('[data-nav-panel] a[href="shop.html"]'))?.classList.add("is-active");
  }

  function update() {
    const filtered = sortProducts(PRODUCTS.filter(matchesFilters));
    renderGrid(document.getElementById("shop-grid"), filtered, "No products match those filters. Try clearing a few.");
    document.getElementById("result-count").textContent = `${filtered.length} item${filtered.length === 1 ? "" : "s"}`;
    renderChips();
    updateTitle();
    updateNavActive();
  }

  document.addEventListener("DOMContentLoaded", () => {
    readStateFromURL();
    syncFiltersUI();

    document.getElementById("filter-price").addEventListener("input", (e) => {
      state.maxPrice = parseInt(e.target.value, 10);
      document.getElementById("price-max-label").textContent = "$" + state.maxPrice;
      update();
    });
    document.getElementById("filter-sale").addEventListener("change", (e) => {
      state.saleOnly = e.target.checked;
      update();
    });
    document.getElementById("sort-select").addEventListener("change", (e) => {
      state.sort = e.target.value;
      update();
    });
    document.getElementById("filter-reset").addEventListener("click", () => {
      state.categories = [];
      state.sizes = [];
      state.maxPrice = 160;
      state.saleOnly = false;
      state.sort = "featured";
      document.getElementById("sort-select").value = "featured";
      syncFiltersUI();
      syncURL();
      update();
    });

    const filtersPanel = document.querySelector("[data-filters]");
    document.querySelectorAll("[data-filters-open]").forEach((btn) =>
      btn.addEventListener("click", () => filtersPanel.classList.add("open"))
    );
    document.querySelectorAll("[data-filters-close]").forEach((btn) =>
      btn.addEventListener("click", () => filtersPanel.classList.remove("open"))
    );

    update();
  });
})();
