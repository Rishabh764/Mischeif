/* ==========================================================================
   MISCHIEF — Design Studio (tee & hoodie customizer).
   Same features as before: garment, colours, six print zones, photo upload or
   preset graphics, drag / size / rotate, live price, add to bag.
   The showroom dims behind it; the garment hangs in the light.
   ========================================================================== */

import { GARMENT_ZONES, VIEW_ZONES, zoneToPercent, garmentSVG } from "../studio/garment-art.js";
import { DESIGN_PRESETS, presetDataUri, getPresetById } from "../studio/design-presets.js";
import { formatPrice } from "../data/products.js";
import { cart } from "../core/cart.js";

const MAIN_COLORS = [
  { name: "Blackout", hex: "#16161a" },
  { name: "Bone", hex: "#e4dfd5" },
  { name: "Blood Red", hex: "#8a1a1e" },
  { name: "Midnight", hex: "#1b2030" },
  { name: "Storm Grey", hex: "#5b5f66" }
];
const TRIM_COLORS = [
  { name: "White", hex: "#f3f2ee" },
  { name: "Black", hex: "#0a0a0b" },
  { name: "Red", hex: "#ff2d20" },
  { name: "Lime", hex: "#c6ff00" }
];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const BASE_PRICE = { tee: 35, hoodie: 85 };
const GARMENT_LABEL = { tee: "T-Shirt", hoodie: "Hoodie" };
const ZONE_PRICE = { front: 10, back: 10, sleeveLeft: 6, sleeveRight: 6, neck: 5, hem: 5 };

export default function studio({ stage, root, ui }) {
  const $ = (sel) => root.querySelector(sel);
  const $$ = (sel) => root.querySelectorAll(sel);

  const state = {
    garment: "tee",
    view: "front",
    mainColor: MAIN_COLORS[2].hex, // Blood Red reads clearly against the dark room
    trimColor: TRIM_COLORS[0].hex,
    size: "M",
    qty: 1,
    zones: {},          // key -> { src, name, offsetX, offsetY, scale, rotate }
    activeZoneKey: null
  };

  // Prefill from the address: customize.html?garment=hoodie&color=Blackout
  const params = new URLSearchParams(location.search);
  if (params.get("garment") in BASE_PRICE) state.garment = params.get("garment");
  const wanted = (params.get("color") || "").toLowerCase();
  const match = MAIN_COLORS.find((c) => c.name.toLowerCase() === wanted);
  if (match) state.mainColor = match.hex;

  const zoneRect = (key) => GARMENT_ZONES[state.garment][state.view][key];
  const filledKeys = () => Object.keys(state.zones).filter((k) => state.zones[k]);
  const unitPrice = () => BASE_PRICE[state.garment] + filledKeys().reduce((sum, k) => sum + (ZONE_PRICE[k] || 0), 0);
  const zoneLabel = (key) => {
    for (const view of Object.keys(VIEW_ZONES)) {
      const rect = GARMENT_ZONES[state.garment][view][key];
      if (rect) return rect.label;
    }
    return key;
  };
  const artTransform = (z) => `translate(-50%,-50%) translate(${z.offsetX}%, ${z.offsetY}%) scale(${z.scale}) rotate(${z.rotate}deg)`;

  /* ---------- Stage ------------------------------------------------------ */

  function renderStage() {
    const host = $("#garment-stage");
    const hotspots = VIEW_ZONES[state.view].map((key) => {
      const rect = zoneRect(key);
      const p = zoneToPercent(rect);
      const z = state.zones[key];
      const style = `left:${p.left}%;top:${p.top}%;width:${p.width}%;height:${p.height}%;`;
      if (!z) {
        return `<button type="button" class="zone" data-zone="${key}" style="${style}" aria-label="Add a design to the ${rect.label}">
          <span class="zone__plus">+</span><span class="zone__label">${rect.label}</span></button>`;
      }
      return `<div class="zone zone--filled" data-zone="${key}" style="${style}">
        <img class="zone__art" src="${z.src}" alt="${rect.label} design" data-zone-drag="${key}" style="transform:${artTransform(z)}">
        <div class="zone__tools">
          <button type="button" data-zone-edit="${key}" aria-label="Edit ${rect.label} design">Edit</button>
          <button type="button" data-zone-remove="${key}" aria-label="Remove ${rect.label} design">✕</button>
        </div>
      </div>`;
    }).join("");
    host.innerHTML = `<div class="garment-wrap">${garmentSVG(state.garment, state.view, state.mainColor, state.trimColor)}</div>${hotspots}`;

    host.querySelectorAll("[data-zone]").forEach((el) => {
      const key = el.dataset.zone;
      const img = el.querySelector("[data-zone-drag]");
      if (img) bindDrag(img, key); else el.addEventListener("click", () => openEditor(key));
    });
    host.querySelectorAll("[data-zone-edit]").forEach((b) => b.addEventListener("click", () => openEditor(b.dataset.zoneEdit)));
    host.querySelectorAll("[data-zone-remove]").forEach((b) => b.addEventListener("click", () => {
      const key = b.dataset.zoneRemove;
      state.zones[key] = null;
      refresh();
      ui.toast(`Removed the ${zoneLabel(key)} design.`);
    }));
  }

  function bindDrag(img, key) {
    let dragging = false, startX, startY, startOffX, startOffY, zoneEl;
    img.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      dragging = true;
      zoneEl = img.closest(".zone");
      startX = e.clientX; startY = e.clientY;
      startOffX = state.zones[key].offsetX; startOffY = state.zones[key].offsetY;
      img.setPointerCapture(e.pointerId);
    });
    img.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const rect = zoneEl.getBoundingClientRect();
      const z = state.zones[key];
      z.offsetX = Math.max(-45, Math.min(45, startOffX + ((e.clientX - startX) / rect.width) * 100));
      z.offsetY = Math.max(-45, Math.min(45, startOffY + ((e.clientY - startY) / rect.height) * 100));
      img.style.transform = artTransform(z);
    });
    const end = () => { dragging = false; };
    img.addEventListener("pointerup", end);
    img.addEventListener("pointercancel", end);
  }

  /* ---------- Layers + price --------------------------------------------- */

  function renderLayers() {
    const host = $("#zone-layers-list");
    const keys = filledKeys();
    if (!keys.length) {
      host.innerHTML = `<p class="layers__empty">No designs yet. Tap a marked zone on the garment to start.</p>`;
      return;
    }
    host.innerHTML = keys.map((key) => {
      const z = state.zones[key];
      return `<div class="layer">
        <img src="${z.src}" alt="">
        <div class="layer__info"><strong>${zoneLabel(key)}</strong><span>${z.name} · +${formatPrice(ZONE_PRICE[key] || 0)}</span></div>
        <button type="button" class="link" data-layer-edit="${key}">Edit</button>
        <button type="button" class="link" data-layer-remove="${key}" aria-label="Remove ${zoneLabel(key)} design">✕</button>
      </div>`;
    }).join("");
    host.querySelectorAll("[data-layer-edit]").forEach((b) => b.addEventListener("click", () => {
      const key = b.dataset.layerEdit;
      const view = Object.keys(VIEW_ZONES).find((v) => VIEW_ZONES[v].includes(key));
      if (view) setView(view);
      openEditor(key);
    }));
    host.querySelectorAll("[data-layer-remove]").forEach((b) => b.addEventListener("click", () => {
      state.zones[b.dataset.layerRemove] = null;
      refresh();
    }));
  }

  function renderPrice() {
    const keys = filledKeys();
    $("#price-base-label").textContent = GARMENT_LABEL[state.garment];
    $("#price-base").textContent = formatPrice(BASE_PRICE[state.garment]);
    $("#price-zones-count").textContent = keys.length;
    $("#price-zones").textContent = formatPrice(keys.reduce((sum, k) => sum + (ZONE_PRICE[k] || 0), 0));
    $("#price-total").textContent = formatPrice(unitPrice());
    $("#studio-add-cart").textContent = `Add to bag — ${formatPrice(unitPrice())}`;
  }

  function refresh() { renderStage(); renderLayers(); renderPrice(); }

  function setView(view) {
    state.view = view;
    $$("[data-view-tab]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.viewTab === view)));
    renderStage();
  }

  /* ---------- Zone editor ------------------------------------------------- */

  const editor = $("#zone-editor");

  function openEditor(key) {
    state.activeZoneKey = key;
    editor.hidden = false;
    document.body.classList.add("modal-open");
    $("#zone-editor-title").textContent = zoneLabel(key);
    renderPresets();
    syncEditor();
  }

  function closeEditor() {
    editor.hidden = true;
    document.body.classList.remove("modal-open");
    state.activeZoneKey = null;
  }

  function syncEditor() {
    const z = state.activeZoneKey && state.zones[state.activeZoneKey];
    $("#zone-editor-source").hidden = !!z;
    $("#zone-editor-controls").hidden = !z;
    if (z) {
      $("#ctrl-scale").value = Math.round(z.scale * 100);
      $("#ctrl-rotate").value = z.rotate;
      $("#editor-preview-img").src = z.src;
      $("#editor-preview-name").textContent = z.name;
    }
  }

  function renderPresets() {
    const host = $("#preset-grid");
    const cats = [...new Set(DESIGN_PRESETS.map((p) => p.category))];
    host.innerHTML = cats.map((cat) => `
      <p class="preset-cat">${cat}</p>
      <div class="preset-row">${DESIGN_PRESETS.filter((p) => p.category === cat).map((p) =>
        `<button type="button" class="preset" data-preset="${p.id}" title="${p.name}"><img src="${presetDataUri(p)}" alt="${p.name}"></button>`).join("")}
      </div>`).join("");
    host.querySelectorAll("[data-preset]").forEach((b) => b.addEventListener("click", () => {
      const preset = getPresetById(b.dataset.preset);
      applyDesign(presetDataUri(preset), preset.name);
    }));
  }

  function applyDesign(src, name) {
    const key = state.activeZoneKey;
    if (!key) return;
    state.zones[key] = { src, name, offsetX: 0, offsetY: 0, scale: 1, rotate: 0 };
    refresh();
    syncEditor();
    ui.toast(`${name} added to the ${zoneLabel(key)}.`);
  }

  /* ---------- Wiring ------------------------------------------------------- */

  function swatches(hostSel, list, activeHex, onPick) {
    const host = $(hostSel);
    host.innerHTML = list.map((c) =>
      `<button type="button" class="swatch" style="--sw:${c.hex}" data-hex="${c.hex}" title="${c.name}" aria-label="${c.name}" aria-pressed="${c.hex === activeHex}"></button>`).join("");
    host.addEventListener("click", (e) => {
      const b = e.target.closest(".swatch");
      if (!b) return;
      onPick(b.dataset.hex);
      host.querySelectorAll(".swatch").forEach((s) => s.setAttribute("aria-pressed", String(s === b)));
      renderStage();
    });
  }

  swatches("#studio-main-colors", MAIN_COLORS, state.mainColor, (hex) => (state.mainColor = hex));
  swatches("#studio-trim-colors", TRIM_COLORS, state.trimColor, (hex) => (state.trimColor = hex));

  const sizeHost = $("#studio-sizes");
  sizeHost.innerHTML = SIZES.map((s) => `<button type="button" data-size="${s}" aria-pressed="${s === state.size}">${s}</button>`).join("");
  sizeHost.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    state.size = b.dataset.size;
    sizeHost.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  });

  $$("[data-garment]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.garment === state.garment));
    b.addEventListener("click", () => {
      state.garment = b.dataset.garment;
      state.zones = {};
      $$("[data-garment]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      refresh();
    });
  });
  $$("[data-view-tab]").forEach((b) => b.addEventListener("click", () => setView(b.dataset.viewTab)));

  const qtyValue = $("#studio-qty-value");
  $("#studio-qty-minus").addEventListener("click", () => { state.qty = Math.max(1, state.qty - 1); qtyValue.textContent = state.qty; });
  $("#studio-qty-plus").addEventListener("click", () => { state.qty = Math.min(10, state.qty + 1); qtyValue.textContent = state.qty; });

  $("#studio-add-cart").addEventListener("click", () => {
    if (!filledKeys().length) { ui.toast("Add at least one design first."); return; }
    const saved = cart.addCustom({
      garment: state.garment, garmentLabel: GARMENT_LABEL[state.garment],
      mainColor: state.mainColor, trimColor: state.trimColor,
      size: state.size, qty: state.qty, price: unitPrice(),
      zones: JSON.parse(JSON.stringify(state.zones))
    });
    if (!saved) { ui.toast("That photo is too large to keep in the bag. Try a smaller image."); return; }
    ui.toast(`Your custom ${GARMENT_LABEL[state.garment].toLowerCase()} is in the bag.`);
    ui.openBag();
  });

  $$("[data-zone-editor-close]").forEach((el) => el.addEventListener("click", closeEditor));
  $$("[data-source-tab]").forEach((b) => b.addEventListener("click", () => {
    $$("[data-source-tab]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    $$("[data-source-panel]").forEach((p) => (p.hidden = p.dataset.sourcePanel !== b.dataset.sourceTab));
  }));
  $("#zone-upload-input").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { ui.toast("Choose an image file."); return; }
    const reader = new FileReader();
    reader.onload = () => applyDesign(reader.result, "Your photo");
    reader.readAsDataURL(file);
    e.target.value = "";
  });
  $("#ctrl-scale").addEventListener("input", (e) => {
    const z = state.zones[state.activeZoneKey];
    if (z) { z.scale = parseInt(e.target.value, 10) / 100; renderStage(); }
  });
  $("#ctrl-rotate").addEventListener("input", (e) => {
    const z = state.zones[state.activeZoneKey];
    if (z) { z.rotate = parseInt(e.target.value, 10); renderStage(); }
  });
  $("#ctrl-remove").addEventListener("click", () => { state.zones[state.activeZoneKey] = null; refresh(); closeEditor(); });
  $("#ctrl-change").addEventListener("click", () => { state.zones[state.activeZoneKey] = null; refresh(); syncEditor(); });

  refresh();

  /* ---------- The room behind --------------------------------------------- */

  function update() {
    stage.envTarget.corridor = 0;
    stage.envTarget.ring = 0;
    stage.fogTarget = [4, 12];
    stage.heroText = 0;
    const n = stage.actors.length;
    stage.actors.forEach((a, i) => {
      // The drop drifts in a slow, dim circle far behind the work table.
      const theta = (i / n) * Math.PI * 2 + stage.time * 0.03;
      const t = a.tgt;
      t.x = Math.sin(theta) * 7; t.y = 0.2; t.z = -9 + Math.cos(theta) * 3.5;
      t.ry = theta; t.rx = 0; t.rz = 0; t.s = 0.9; t.o = 0.55; t.glow = 0.4;
    });
    stage.cam.tPos.set(0, 0.2, 5.5);
    stage.cam.tLook.set(0, 0, -6);
  }

  return {
    update,
    destroy() { document.body.classList.remove("modal-open"); }
  };
}
