/* ==========================================================================
   MISCHIEF — Shop: the ring.
   The drop hangs on a carousel that turns forever in either direction.
   Scroll, drag, use the arrows or the keyboard to spin it; the piece at the
   front is the one you can open.
   ========================================================================== */

import { smooth, lerp } from "../scene/stage.js";
import { CATEGORIES, formatPrice } from "../data/products.js";

const STEP_VH = 55;  // scroll distance between neighbours
const CYCLES = 40;   // full turns of scroll room; the ring re-centres itself long before it runs out
const ARC_STEP = (Math.PI * 2) / 10; // spacing used when there are too few pieces to close a circle

const mod = (a, n) => ((a % n) + n) % n;

export default function shop({ stage, root, products, go, ui }) {
  const space = root.querySelector("[data-scroll-space]");
  const chips = root.querySelector("[data-chips]");
  const caption = root.querySelector(".ring-caption");
  const el = (name) => caption.querySelector(`[data-${name}]`);
  root.querySelector("[data-piece-list]").innerHTML = ui.pieceListHTML(products);

  const initial = new URLSearchParams(location.search).get("category");
  let category = CATEGORIES.includes(initial) ? initial : "All";
  let visible = [];   // indices of the pieces on the ring
  let n = 0;          // how many pieces are on the ring
  let loop = false;   // three or more pieces close into a full circle
  let steps = 0;      // scroll steps available
  let angle = ARC_STEP;
  let shown = -1;
  let snapTimer = 0;

  const stepPx = () => (steps > 0 ? (space.offsetHeight - window.innerHeight) / steps : 1);
  /** Where the ring is right now (smoothed) and where the scroll is heading, in steps. */
  const position = () => (steps > 0 ? (stage.ok ? stage.scrollY : window.scrollY) / stepPx() : 0);
  const heading = () => (steps > 0 ? Math.round(window.scrollY / stepPx()) : 0);
  const pieceAt = (k) => (loop ? mod(k, n) : Math.min(Math.max(k, 0), Math.max(n - 1, 0)));
  const goTo = (k) => window.scrollTo({ top: Math.min(Math.max(k, 0), steps) * stepPx(), behavior: "smooth" });

  /** Jump the scroll without the ring animating (used to start and to re-centre the loop). */
  function jumpTo(k) {
    const top = k * stepPx();
    const delta = top - window.scrollY;
    window.scrollTo(0, top);
    if (stage.ok) stage.scrollY += delta;
  }

  function setCategory(next) {
    category = next;
    visible = products.filter((p) => category === "All" || p.category === category).map((p) => p.index);
    n = visible.length;
    loop = n >= 3;
    angle = loop ? (Math.PI * 2) / n : ARC_STEP;
    steps = loop ? n * CYCLES : Math.max(0, n - 1);
    space.style.height = `${steps * STEP_VH + 100}vh`;
    chips.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === category)));
    root.querySelectorAll("[data-piece-list] li").forEach((li, i) => (li.hidden = !visible.includes(i)));
    caption.classList.toggle("is-single", n < 2);
    shown = -1;
    // Start in the middle of the scroll room so the ring can turn both ways.
    const start = loop ? Math.floor(CYCLES / 2) * n : 0;
    window.scrollTo(0, start * stepPx());
    if (stage.ok) stage.scrollY = window.scrollY;
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
      let d = j - pos;                       // steps away from the front
      if (loop) d -= n * Math.round(d / n);  // the short way round the circle
      const theta = d * angle;
      const front = smooth(1 - Math.abs(d));
      t.x = Math.sin(theta) * R;
      t.z = Math.cos(theta) * R - R;
      t.y = lerp(0, 0.03, front);
      t.ry = theta; // pieces face outwards, so the far side of the ring shows their backs
      t.s = lerp(0.9, portrait ? 1.08 : 1.2, front);
      t.o = 1;
    });

    // Look slightly below the pieces so they sit in the upper part of the screen,
    // clear of the caption at the bottom.
    stage.cam.tPos.set(0, 0.1, portrait ? 4.7 : 4.6);
    stage.cam.tLook.set(0, portrait ? -0.5 : -0.62, -0.8);
    if (n) show(pieceAt(Math.round(pos)));
  }

  /* ---------- Input ------------------------------------------------------ */

  const onScroll = () => {
    clearTimeout(snapTimer);
    snapTimer = setTimeout(() => {
      if (!steps) return;
      const k = heading();
      const target = k * stepPx();
      if (Math.abs(target - window.scrollY) > 2) { window.scrollTo({ top: target, behavior: "smooth" }); return; }
      // Settled. If the loop has drifted far from the middle of its scroll room, hop back
      // by whole turns: the ring looks identical, so nothing visibly moves.
      const mid = Math.floor(CYCLES / 2) * n;
      if (loop && Math.abs(k - mid) > n * 8) jumpTo(mid + mod(k, n));
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
    if (e.key === "ArrowRight") goTo(heading() + 1);
    if (e.key === "ArrowLeft") goTo(heading() - 1);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  window.addEventListener("keydown", onKey);
  // Each press moves exactly one piece on from wherever the ring is already heading,
  // so quick presses add up.
  let queued = null;
  const nudge = (dir) => {
    queued = (queued === null ? heading() : queued) + dir;
    goTo(queued);
    clearTimeout(nudge.timer);
    nudge.timer = setTimeout(() => (queued = null), 700);
  };
  caption.querySelector("[data-prev]").addEventListener("click", () => nudge(-1));
  caption.querySelector("[data-next]").addEventListener("click", () => nudge(1));

  if (!stage.ok) update();

  /** Steps from the piece now at the front to the given piece, the short way round. */
  function stepsTo(actor) {
    const j = visible.indexOf(actor.product.index);
    if (j < 0) return null;
    let d = j - pieceAt(heading());
    if (loop) d -= n * Math.round(d / n);
    return d;
  }

  return {
    update,
    pick(actor) {
      const d = stepsTo(actor);
      if (d === null) return;
      if (d === 0) go(`product.html?id=${actor.product.id}`);
      else goTo(heading() + d);
    },
    label: (actor) => (stepsTo(actor) === 0 ? "View" : "Bring"),
    destroy() {
      clearTimeout(snapTimer);
      clearTimeout(nudge.timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("keydown", onKey);
    }
  };
}
