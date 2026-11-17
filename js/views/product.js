/* ==========================================================================
   SLANG STUDIO — Product: one piece, up close.
   The camera flies to the chosen piece; the rest of the drop hangs dimly in
   the dark behind it. Drag (or use Flip) to turn the piece around.
   ========================================================================== */

import { getProduct, formatPrice } from "../data/products.js";
import { cart } from "../core/cart.js";
import { pieceImage } from "../data/products.js";

export default function product({ stage, root, products, go, ui }) {
  const id = new URLSearchParams(location.search).get("id");
  const p = getProduct(id) || products[0];
  const n = products.length;
  const next = products[(p.index + 1) % n];
  const $ = (sel) => root.querySelector(sel);

  /* ---------- Fill the panel -------------------------------------------- */

  document.title = `${p.name} — SLANG STUDIO`;
  $("[data-no]").textContent = `${p.no} / ${String(n).padStart(2, "0")}`;
  $("[data-category]").textContent = p.category;
  $("[data-name]").textContent = p.name;
  $("[data-price]").textContent = formatPrice(p.price);
  $("[data-desc]").textContent = p.description;
  $("[data-color]").textContent = p.color.name;
  $("[data-swatch]").style.background = p.color.hex;
  $("[data-details]").innerHTML = p.details.map((d) => `<li>${d}</li>`).join("");
  $("[data-fallback]").src = pieceImage(p);
  $("[data-fallback]").alt = p.name;

  const nextLink = $("[data-next]");
  nextLink.href = `product.html?id=${next.id}`;
  nextLink.querySelector("[data-next-name]").textContent = `${next.no} ${next.name}`;

  const customize = $("[data-customize]");
  if (p.garment) {
    customize.hidden = false;
    customize.href = `customize.html?garment=${p.garment}&color=${encodeURIComponent(p.color.name)}`;
  }

  let size = p.sizes.length === 1 ? p.sizes[0] : null;
  let qty = 1;
  const sizes = $("[data-sizes]");
  sizes.innerHTML = p.sizes.map((s) => `<button type="button" data-size="${s}" aria-pressed="${s === size}">${s}</button>`).join("");
  sizes.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    size = b.dataset.size;
    sizes.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    sizes.classList.remove("is-missing");
  });

  const qtyValue = $("[data-qty-value]");
  $("[data-qty-minus]").addEventListener("click", () => { qty = Math.max(1, qty - 1); qtyValue.textContent = qty; });
  $("[data-qty-plus]").addEventListener("click", () => { qty = Math.min(10, qty + 1); qtyValue.textContent = qty; });

  $("[data-add]").addEventListener("click", () => {
    if (!size) {
      sizes.classList.add("is-missing");
      ui.toast("Pick a size first.");
      return;
    }
    cart.add({ id: p.id, size, qty });
    ui.toast(`${p.name} is in your bag.`);
    ui.openBag();
  });

  /* ---------- Turning the piece ------------------------------------------ */

  let spin = 0, spinTarget = 0, drag = null;
  const flipBtn = $("[data-flip]");
  const showingBack = () => Math.abs(Math.round(spinTarget / Math.PI)) % 2 === 1;
  const syncFlip = () => (flipBtn.textContent = showingBack() ? "Show front" : "Show back");
  flipBtn.addEventListener("click", () => { spinTarget = Math.round(spinTarget / Math.PI) * Math.PI + Math.PI; syncFlip(); });

  const onDown = (e) => { if (!e.target.closest("a, button, input, [data-ui]")) drag = { x: e.clientX, start: spinTarget }; };
  const onMove = (e) => { if (drag) spinTarget = drag.start + (e.clientX - drag.x) * 0.011; };
  const onUp = () => {
    if (!drag) return;
    drag = null;
    spinTarget = Math.round(spinTarget / Math.PI) * Math.PI; // settle on a flat view
    syncFlip();
  };
  window.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);

  function update(dt) {
    const portrait = stage.portrait;
    spin += (spinTarget - spin) * (1 - Math.exp(-dt * 9));

    stage.envTarget.corridor = 0.4;
    stage.envTarget.ring = 0;
    stage.fogTarget = [30, 95];
    stage.heroText = 0;
    stage.heroLight = 1;

    const camZ = portrait ? 5.6 : 4.7;
    const aspect = stage.camera ? stage.camera.aspect : 1.6;
    // Centre of the left part of the screen, at the piece's depth.
    const halfW = Math.tan(((portrait ? 60 : 44) * Math.PI) / 360) * camZ * aspect;

    stage.actors.forEach((a, i) => {
      const t = a.tgt;
      if (a.product !== p) { stage.park(a, i); return; } // the rest of the drop stays on its rails
      // This piece, up close in the hall under its own light, hanging from a
      // ceiling cable (by its hanger, or by a cord for the cap and beanie).
      stage.feature = a;
      t.x = portrait ? 0 : -halfW * 0.44;
      t.y = portrait ? 0.78 : 0.02;
      t.z = 0; t.rz = 0;
      t.ry = spin + stage.pointer.sx * 0.3;
      t.rx = -stage.pointer.sy * 0.06;
      t.s = portrait ? 1.02 : 1.42;
      t.o = 1;
      t.cable = 1;
      t.stand = 0;
    });

    stage.cam.tPos.set(0, portrait ? 0.3 : 0.05, camZ);
    stage.cam.tLook.set(0, portrait ? -0.25 : 0, 0);
  }

  if (!stage.ok) update(0);

  return {
    update,
    pick(actor) { if (actor.product !== p) go(`product.html?id=${actor.product.id}`); },
    label: (actor) => (actor.product === p ? "Turn" : "View"),
    destroy() {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    }
  };
}
