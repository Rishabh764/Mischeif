/* ==========================================================================
   MISCHEIF — Design Studio (tee & hoodie customizer)
   ========================================================================== */

(function () {
  const MAIN_COLORS = [
    { name: "Blackout", hex: "#111111" },
    { name: "Bone", hex: "#e8e3da" },
    { name: "Blood Red", hex: "#7a1518" },
    { name: "Midnight", hex: "#14161c" },
    { name: "Storm Grey", hex: "#5b5f66" }
  ];
  const TRIM_COLORS = [
    { name: "White", hex: "#f3f2ee" },
    { name: "Black", hex: "#0a0a0b" },
    { name: "Red", hex: "#ff3b30" },
    { name: "Lime", hex: "#c6ff00" }
  ];
  const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
  const BASE_PRICE = { tee: 34, hoodie: 84 };
  const GARMENT_LABEL = { tee: "T-Shirt", hoodie: "Hoodie" };
  const ZONE_PRICE = { front: 10, back: 10, sleeveLeft: 6, sleeveRight: 6, neck: 5, hem: 5 };
  const VIEW_ZONES = {
    front: ["neck", "front", "sleeveLeft", "sleeveRight"],
    back: ["back", "hem"]
  };

  const state = {
    garment: "tee",
    view: "front",
    mainColor: MAIN_COLORS[2].hex, // Blood Red — reads clearly against the dark stage by default
    trimColor: TRIM_COLORS[0].hex,
    size: "M",
    qty: 1,
    zones: {}, // key -> { src, name, offsetX, offsetY, scale, rotate }
    activeZoneKey: null
  };

  function zoneRect(key) {
    return GARMENT_ZONES[state.garment][state.view][key];
  }

  const pct = zoneToPercent;

  function filledZoneKeys() {
    return Object.keys(state.zones).filter((k) => state.zones[k]);
  }

  function unitPrice() {
    return BASE_PRICE[state.garment] + filledZoneKeys().reduce((sum, k) => sum + (ZONE_PRICE[k] || 0), 0);
  }

  /* ---------- Stage rendering ------------------------------------------- */

  function renderStage() {
    const stage = document.getElementById("garment-stage");
    const svg = garmentSVG(state.garment, state.view, state.mainColor, state.trimColor);
    const zoneKeys = VIEW_ZONES[state.view];

    const hotspots = zoneKeys
      .map((key) => {
        const rect = zoneRect(key);
        const p = pct(rect);
        const filled = state.zones[key];
        const style = `left:${p.left}%; top:${p.top}%; width:${p.width}%; height:${p.height}%;`;
        if (!filled) {
          return `
          <button type="button" class="zone-hotspot" data-zone="${key}" style="${style}" aria-label="Add design to ${rect.label}">
            <span class="zone-hotspot__plus">+</span>
            <span class="zone-hotspot__label">${rect.label}</span>
          </button>`;
        }
        const t = `translate(-50%,-50%) translate(${filled.offsetX}%, ${filled.offsetY}%) scale(${filled.scale}) rotate(${filled.rotate}deg)`;
        return `
        <div class="zone-hotspot zone-hotspot--filled" data-zone="${key}" style="${style}">
          <img class="zone-art" src="${filled.src}" alt="${rect.label} design" data-zone-drag="${key}" style="transform:${t}">
          <span class="zone-hotspot__label zone-hotspot__label--small">${rect.label}</span>
          <div class="zone-hotspot__tools">
            <button type="button" class="zone-tool" data-zone-edit="${key}" title="Edit">✎</button>
            <button type="button" class="zone-tool" data-zone-remove="${key}" title="Remove">✕</button>
          </div>
        </div>`;
      })
      .join("");

    stage.innerHTML = `<div class="garment-svg-wrap">${svg}</div>${hotspots}`;

    stage.querySelectorAll("[data-zone]").forEach((el) => {
      const key = el.getAttribute("data-zone");
      const img = el.querySelector("[data-zone-drag]");
      if (img) {
        bindDrag(img, key);
      } else {
        el.addEventListener("click", () => openZoneEditor(key));
      }
    });
    stage.querySelectorAll("[data-zone-edit]").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openZoneEditor(btn.getAttribute("data-zone-edit"));
      })
    );
    stage.querySelectorAll("[data-zone-remove]").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const key = btn.getAttribute("data-zone-remove");
        state.zones[key] = null;
        renderStage();
        renderLayers();
        renderPrice();
        toast(`Removed design from ${zoneLabelAnyView(key)}`);
      })
    );
  }

  function zoneLabelAnyView(key) {
    for (const view of Object.keys(VIEW_ZONES)) {
      const rect = GARMENT_ZONES[state.garment][view] && GARMENT_ZONES[state.garment][view][key];
      if (rect) return rect.label;
    }
    return key;
  }

  function bindDrag(img, key) {
    let dragging = false;
    let startX, startY, startOffX, startOffY, zoneEl;

    img.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      dragging = true;
      zoneEl = img.closest(".zone-hotspot");
      startX = e.clientX;
      startY = e.clientY;
      startOffX = state.zones[key].offsetX;
      startOffY = state.zones[key].offsetY;
      img.setPointerCapture(e.pointerId);
    });
    img.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const rect = zoneEl.getBoundingClientRect();
      const dxPct = ((e.clientX - startX) / rect.width) * 100;
      const dyPct = ((e.clientY - startY) / rect.height) * 100;
      const z = state.zones[key];
      z.offsetX = Math.max(-45, Math.min(45, startOffX + dxPct));
      z.offsetY = Math.max(-45, Math.min(45, startOffY + dyPct));
      img.style.transform = `translate(-50%,-50%) translate(${z.offsetX}%, ${z.offsetY}%) scale(${z.scale}) rotate(${z.rotate}deg)`;
    });
    const end = () => { dragging = false; };
    img.addEventListener("pointerup", end);
    img.addEventListener("pointercancel", end);
  }

  /* ---------- Layers list (side panel) ----------------------------------- */

  function renderLayers() {
    const host = document.getElementById("zone-layers-list");
    const keys = filledZoneKeys();
    if (!keys.length) {
      host.innerHTML = `<p class="zone-layers__empty">No designs added yet. Click a highlighted zone on the garment to get started.</p>`;
      return;
    }
    host.innerHTML = keys
      .map((key) => {
        const z = state.zones[key];
        return `
        <div class="zone-layer-row">
          <img src="${z.src}" alt="">
          <div class="zone-layer-row__info">
            <strong>${zoneLabelAnyView(key)}</strong>
            <span>${z.name} · +${formatPrice(ZONE_PRICE[key] || 0)}</span>
          </div>
          <button type="button" data-layer-edit="${key}" class="icon-btn" aria-label="Edit">✎</button>
          <button type="button" data-layer-remove="${key}" class="icon-btn" aria-label="Remove">✕</button>
        </div>`;
      })
      .join("");
    host.querySelectorAll("[data-layer-edit]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-layer-edit");
        switchToViewForZone(key);
        openZoneEditor(key);
      })
    );
    host.querySelectorAll("[data-layer-remove]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-layer-remove");
        state.zones[key] = null;
        renderStage();
        renderLayers();
        renderPrice();
      })
    );
  }

  function switchToViewForZone(key) {
    for (const view of Object.keys(VIEW_ZONES)) {
      if (VIEW_ZONES[view].includes(key)) {
        state.view = view;
        break;
      }
    }
    document.querySelectorAll("[data-view-tab]").forEach((b) =>
      b.classList.toggle("active", b.getAttribute("data-view-tab") === state.view)
    );
    renderStage();
  }

  /* ---------- Price -------------------------------------------------------- */

  function renderPrice() {
    document.getElementById("price-base-label").textContent = GARMENT_LABEL[state.garment];
    document.getElementById("price-base").textContent = formatPrice(BASE_PRICE[state.garment]);
    const zoneKeys = filledZoneKeys();
    const zoneTotal = zoneKeys.reduce((sum, k) => sum + (ZONE_PRICE[k] || 0), 0);
    document.getElementById("price-zones-count").textContent = zoneKeys.length;
    document.getElementById("price-zones").textContent = formatPrice(zoneTotal);
    document.getElementById("price-total").textContent = formatPrice(unitPrice());
    document.getElementById("studio-add-cart").textContent = `Add to Bag — ${formatPrice(unitPrice())}`;
  }

  /* ---------- Zone editor modal --------------------------------------------- */

  function openZoneEditor(key) {
    state.activeZoneKey = key;
    const modal = document.getElementById("zone-editor");
    modal.hidden = false;
    document.body.classList.add("modal-open");
    document.getElementById("zone-editor-title").textContent = zoneLabelAnyView(key);
    renderPresetGrid();
    refreshEditorMode();
  }

  function closeZoneEditor() {
    document.getElementById("zone-editor").hidden = true;
    document.body.classList.remove("modal-open");
    state.activeZoneKey = null;
  }

  function refreshEditorMode() {
    const key = state.activeZoneKey;
    const z = key && state.zones[key];
    document.getElementById("zone-editor-source").hidden = !!z;
    document.getElementById("zone-editor-controls").hidden = !z;
    if (z) {
      document.getElementById("ctrl-scale").value = Math.round(z.scale * 100);
      document.getElementById("ctrl-rotate").value = z.rotate;
      document.getElementById("editor-preview-img").src = z.src;
      document.getElementById("editor-preview-name").textContent = z.name;
    }
  }

  function renderPresetGrid() {
    const host = document.getElementById("preset-grid");
    const cats = [...new Set(DESIGN_PRESETS.map((p) => p.category))];
    host.innerHTML = cats
      .map(
        (cat) => `
      <div class="preset-cat">${cat}</div>
      <div class="preset-row">
        ${DESIGN_PRESETS.filter((p) => p.category === cat)
          .map((p) => `<button type="button" class="preset-tile" data-preset="${p.id}" title="${p.name}"><img src="${presetDataUri(p)}" alt="${p.name}"></button>`)
          .join("")}
      </div>`
      )
      .join("");
    host.querySelectorAll("[data-preset]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const preset = getPresetById(btn.getAttribute("data-preset"));
        applyDesignToActiveZone(presetDataUri(preset), preset.name);
      })
    );
  }

  function applyDesignToActiveZone(src, name) {
    const key = state.activeZoneKey;
    if (!key) return;
    state.zones[key] = { src, name, offsetX: 0, offsetY: 0, scale: 1, rotate: 0 };
    renderStage();
    renderLayers();
    renderPrice();
    refreshEditorMode();
    toast(`Added "${name}" to ${zoneLabelAnyView(key)}`);
  }

  function bindEditorEvents() {
    document.querySelectorAll("[data-zone-editor-close]").forEach((el) => el.addEventListener("click", closeZoneEditor));

    document.querySelectorAll("[data-source-tab]").forEach((btn) =>
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-source-tab]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const tab = btn.getAttribute("data-source-tab");
        document.querySelectorAll("[data-source-panel]").forEach((p) => (p.hidden = p.getAttribute("data-source-panel") !== tab));
      })
    );

    document.getElementById("zone-upload-input").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast("Please choose an image file");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => applyDesignToActiveZone(reader.result, "Your Photo");
      reader.readAsDataURL(file);
      e.target.value = "";
    });

    document.getElementById("ctrl-scale").addEventListener("input", (e) => {
      const z = state.zones[state.activeZoneKey];
      if (!z) return;
      z.scale = parseInt(e.target.value, 10) / 100;
      renderStage();
    });
    document.getElementById("ctrl-rotate").addEventListener("input", (e) => {
      const z = state.zones[state.activeZoneKey];
      if (!z) return;
      z.rotate = parseInt(e.target.value, 10);
      renderStage();
    });
    document.getElementById("ctrl-remove").addEventListener("click", () => {
      const key = state.activeZoneKey;
      state.zones[key] = null;
      renderStage();
      renderLayers();
      renderPrice();
      closeZoneEditor();
    });
    document.getElementById("ctrl-change").addEventListener("click", () => {
      const key = state.activeZoneKey;
      state.zones[key] = null;
      renderStage();
      renderLayers();
      renderPrice();
      refreshEditorMode();
    });
  }

  /* ---------- Panel: garment / colors / size / qty --------------------------- */

  function renderColorSwatches(hostId, list, activeHex, onPick) {
    const host = document.getElementById(hostId);
    host.innerHTML = list
      .map((c) => `<span class="color-swatch ${c.hex === activeHex ? "active" : ""}" style="--sw:${c.hex}" data-hex="${c.hex}" title="${c.name}"></span>`)
      .join("");
    host.querySelectorAll(".color-swatch").forEach((sw) =>
      sw.addEventListener("click", () => {
        onPick(sw.getAttribute("data-hex"));
        host.querySelectorAll(".color-swatch").forEach((s) => s.classList.remove("active"));
        sw.classList.add("active");
        renderStage();
      })
    );
  }

  function renderSizes() {
    const host = document.getElementById("studio-sizes");
    host.innerHTML = SIZES.map((s) => `<button type="button" data-size="${s}" class="${s === state.size ? "active" : ""}">${s}</button>`).join("");
    host.querySelectorAll("button").forEach((btn) =>
      btn.addEventListener("click", () => {
        state.size = btn.getAttribute("data-size");
        host.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      })
    );
  }

  function bindGarmentToggle() {
    document.querySelectorAll("[data-garment]").forEach((btn) =>
      btn.addEventListener("click", () => {
        state.garment = btn.getAttribute("data-garment");
        state.zones = {};
        document.querySelectorAll("[data-garment]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderStage();
        renderLayers();
        renderPrice();
      })
    );
  }

  function bindViewTabs() {
    document.querySelectorAll("[data-view-tab]").forEach((btn) =>
      btn.addEventListener("click", () => {
        state.view = btn.getAttribute("data-view-tab");
        document.querySelectorAll("[data-view-tab]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderStage();
      })
    );
  }

  function bindQty() {
    document.getElementById("studio-qty-minus").addEventListener("click", () => {
      state.qty = Math.max(1, state.qty - 1);
      document.getElementById("studio-qty-value").textContent = state.qty;
    });
    document.getElementById("studio-qty-plus").addEventListener("click", () => {
      state.qty = Math.min(10, state.qty + 1);
      document.getElementById("studio-qty-value").textContent = state.qty;
    });
  }

  function bindAddToCart() {
    document.getElementById("studio-add-cart").addEventListener("click", () => {
      const zoneKeys = filledZoneKeys();
      if (!zoneKeys.length) {
        toast("Add at least one design before checking out");
        return;
      }
      addCustomToCart({
        garment: state.garment,
        garmentLabel: GARMENT_LABEL[state.garment],
        mainColor: state.mainColor,
        trimColor: state.trimColor,
        size: state.size,
        qty: state.qty,
        price: unitPrice(),
        zones: JSON.parse(JSON.stringify(state.zones))
      });
      toast(`Added your custom ${GARMENT_LABEL[state.garment].toLowerCase()} to the bag`);
    });
  }

  /* ---------- Prefill from query string (?garment=hoodie&color=Blackout) ----- */

  function applyQueryPrefill() {
    const params = new URLSearchParams(window.location.search);
    const g = params.get("garment");
    if (g === "hoodie" || g === "tee") state.garment = g;
    const colorName = params.get("color");
    if (colorName) {
      const match = MAIN_COLORS.find((c) => c.name.toLowerCase() === colorName.toLowerCase());
      if (match) state.mainColor = match.hex;
    }
  }

  /* ---------- Init ------------------------------------------------------------ */

  document.addEventListener("DOMContentLoaded", () => {
    applyQueryPrefill();
    document.querySelectorAll("[data-garment]").forEach((b) => b.classList.toggle("active", b.getAttribute("data-garment") === state.garment));

    renderColorSwatches("studio-main-colors", MAIN_COLORS, state.mainColor, (hex) => (state.mainColor = hex));
    renderColorSwatches("studio-trim-colors", TRIM_COLORS, state.trimColor, (hex) => (state.trimColor = hex));
    renderSizes();
    bindGarmentToggle();
    bindViewTabs();
    bindQty();
    bindAddToCart();
    bindEditorEvents();

    renderStage();
    renderLayers();
    renderPrice();
  });

  /* Exposed for cart page mini-previews */
  window.MischeifStudio = { GARMENT_LABEL, VIEW_ZONES };
})();
