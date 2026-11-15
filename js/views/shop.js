/* ==========================================================================
   MISCHIEF — Shop: the ring.
   The drop hangs on a carousel. Scroll, drag, use the arrows or the keyboard
   to spin it; the piece at the front is the one you can open.
   ========================================================================== */

import { smooth, lerp } from "../scene/stage.js";
import { CATEGORIES, formatPrice } from "../data/products.js";

const STEP = (Math.PI * 2) / 10; // angle between neighbours on the ring
const STEP_VH = 55;              // scroll distance between neighbours

export default function shop({ stage, root, products, go, ui }) {
  const space = root.querySelector("[data-scroll-space]");
  const chips = root.querySelector("[data-chips]");
  const caption = root.querySelector(".ring-caption");
  const el = (name) => caption.querySelector(`[data-${name}]`);
  root.querySelector("[data-piece-list]").innerHTML = ui.pieceListHTML(products);

  const initial = new URLSearchParams(location.search).get("category");
  let category = CATEGORIES.includes(initial) ? initial : "All";
  let visible = [];   // indices of the pieces on the ring
  let shown = -1;
  let snapTimer = 0;

  const stepPx = () => (visible.length > 1 ? (space.offsetHeight - window.innerHeight) / (visible.length - 1) : 0);
  const position = () => (visible.length > 1 ? stage.progress(space) * (visible.length - 1) : 0);
  const goTo = (j) => window.scrollTo({ top: Math.min(Math.max(j, 0), visible.length - 1) * stepPx(), behavior: "smooth" });

  function setCategory(next) {
    category = next;
    visible = products.filter((p) => category === "All" || p.category === category).map((p) => p.index);
    space.style.height = `${Math.max(0, visible.length - 1) * STEP_VH + 100}vh`;
    chips.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === category)));
    root.querySelectorAll("[data-piece-list] li").forEach((li, i) => (li.hidden = !visible.includes(i)));
    caption.classList.toggle("is-single", visible.length < 2);
    window.scrollTo(0, 0);
    shown = -1;
    const url = new URL(location.href);
    if (category === "All") url.searchParams.delete("category"); else url.searchParams.set("category", category);
    history.replaceState({}, "", url);
  }

  chips.innerHTML = ["All", ...CATEGORIES].map((c) => `<button type="button" data-cat="${c}">${c}</button>`).join("");
  chips.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setCategory(b.dataset.cat); });
  setCategory(category);

  function show(j) {
    if (j === shown) return;
    shown = j;
    const p = products[visible[j]];
    caption.classList.remove("is-swap");
    void caption.offsetWidth;
    caption.classList.add("is-swap");
    el("no").textContent = `${p.no} / ${String(products.length).padStart(2, "0")}`;
    el("name").textContent = p.name;
    el("meta").textContent = `${p.category} · ${p.color.name}`;
    el("price").textContent = formatPrice(p.price);
    el("link").setAttribute("href", `product.html?id=${p.id}`);
  }

  function update() {
    const R = stage.ringR;
    const pos = position();
    const portrait = stage.portrait;

    stage.envTarget.corridor = 0;
    stage.envTarget.ring = 1;
    stage.fogTarget = [3.6, 11.5];
    stage.heroText = 0;

    stage.actors.forEach((a, i) => {
      const t = a.tgt;
      const j = visible.indexOf(i);
      t.rx = 0; t.rz = 0; t.glow = 1;
      if (j < 0) { // filtered out: sink away behind the ring
        t.x = 0; t.y = -1.4; t.z = -R * 2; t.ry = 0; t.s = 0.8; t.o = 0;
        return;
      }
      const theta = (j - pos) * STEP;
      const front = smooth(1 - Math.abs(theta) / STEP);
      t.x = Math.sin(theta) * R;
      t.z = Math.cos(theta) * R - R;
      t.y = lerp(0, 0.03, front);
      t.ry = theta;
      t.s = lerp(0.9, portrait ? 1.08 : 1.2, front);
      t.o = 1;
    });

    // Look slightly below the pieces so they sit in the upper part of the screen,
    // clear of the caption at the bottom.
    stage.cam.tPos.set(0, 0.1, portrait ? 4.7 : 4.6);
    stage.cam.tLook.set(0, portrait ? -0.5 : -0.62, -0.8);
    if (visible.length) show(Math.min(visible.length - 1, Math.max(0, Math.round(pos))));
  }

  /* ---------- Input ------------------------------------------------------ */

  const onScroll = () => {
    clearTimeout(snapTimer);
    snapTimer = setTimeout(() => {
      const target = Math.round(position()) * stepPx();
      if (Math.abs(target - window.scrollY) > 2) window.scrollTo({ top: target, behavior: "smooth" });
    }, 180);
  };

  let drag = null;
  const onDown = (e) => {
    if (e.target.closest("a, button, input, [data-ui]")) return;
    drag = { x: e.clientX, y: window.scrollY };
  };
  const onMove = (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) < 6) return;
    window.scrollTo(0, drag.y - dx * (stepPx() / (window.innerWidth * 0.32)));
  };
  const onUp = () => { drag = null; };
  const onKey = (e) => {
    if (e.key === "ArrowRight") goTo(Math.round(position()) + 1);
    if (e.key === "ArrowLeft") goTo(Math.round(position()) - 1);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  window.addEventListener("keydown", onKey);
  caption.querySelector("[data-prev]").addEventListener("click", () => goTo(Math.round(position()) - 1));
  caption.querySelector("[data-next]").addEventListener("click", () => goTo(Math.round(position()) + 1));

  if (!stage.ok) update();

  return {
    update,
    pick(actor) {
      const j = visible.indexOf(actor.product.index);
      if (j < 0) return;
      if (j === Math.round(position())) go(`product.html?id=${actor.product.id}`);
      else goTo(j);
    },
    label: (actor) => (visible.indexOf(actor.product.index) === Math.round(position()) ? "View" : "Bring"),
    destroy() {
      clearTimeout(snapTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("keydown", onKey);
    }
  };
}
