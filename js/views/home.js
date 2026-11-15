/* ==========================================================================
   MISCHIEF — Home: the corridor.
   Scroll = walk forward. The hero piece turns in front of the headline wall,
   then takes its place as piece 01 and the camera travels the hall, passing
   one piece at a time on alternating sides.
   ========================================================================== */

import { GAP, smooth, lerp } from "../scene/stage.js";
import { formatPrice } from "../data/products.js";

const HERO = 1.3;  // scroll "segments" spent on the hero turn
const TAIL = 0.75; // walk-out distance after the last piece
const SEG = 92;    // viewport-heights of scroll per segment

export default function home({ stage, root, products, go, ui }) {
  const n = products.length;
  const total = HERO + (n - 1) + TAIL;
  const space = root.querySelector("[data-scroll-space]");
  space.style.height = `${total * SEG + 100}vh`;

  const heroCopy = root.querySelector(".hero-copy");
  const caption = root.querySelector(".caption");
  const rail = root.querySelector(".rail");
  const railFill = root.querySelector(".rail__fill");
  const el = (name) => caption.querySelector(`[data-${name}]`);
  root.querySelector("[data-piece-list]").innerHTML = ui.pieceListHTML(products);

  let shown = -1;
  function show(i) {
    if (i === shown) return;
    shown = i;
    const p = products[i];
    caption.classList.remove("is-swap");
    void caption.offsetWidth; // restart the swap animation
    caption.classList.add("is-swap");
    caption.classList.toggle("is-right", i % 2 === 0); // pieces alternate sides; the caption takes the free one
    el("no").textContent = `${p.no} / ${String(n).padStart(2, "0")}`;
    el("name").textContent = p.name;
    el("meta").textContent = `${p.category} · ${p.color.name}`;
    el("price").textContent = formatPrice(p.price);
    el("link").setAttribute("href", `product.html?id=${p.id}`);
  }
  show(0);

  function update() {
    const U = stage.progress(space) * total;
    const heroLin = Math.min(1, U / HERO);
    const heroT = smooth(heroLin);
    const travel = Math.min(Math.max(U - HERO, 0), n - 1 + TAIL);
    const portrait = stage.portrait;
    const viewD = portrait ? 3.9 : 4.0;
    const sx = stage.slotX;
    const camZ = lerp(portrait ? 5.6 : 5.4, viewD, heroT) - travel * GAP;

    stage.envTarget.corridor = 1;
    stage.envTarget.ring = 0;
    stage.fogTarget = [4.5, 21];
    stage.heroText = 1 - smooth(U / (HERO * 0.85));

    stage.actors.forEach((a, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const t = a.tgt;
      t.x = side * sx; t.y = 0; t.z = -i * GAP;
      t.ry = -side * (portrait ? 0.16 : 0.42);
      t.rx = 0; t.rz = 0; t.s = 1; t.glow = 1;
      if (i === 0) {
        // Hero: centre stage, one full turn, then into its slot.
        const spin = a.setSpin(heroLin * Math.PI * 2);
        t.x = lerp(0, t.x, heroT);
        t.y = lerp(portrait ? 0.1 : 0.02, 0, heroT);
        t.ry = t.ry * heroT + spin;
        t.s = lerp(portrait ? 1.08 : 1.28, 1, heroT);
        t.glow = lerp(1.6, 1, heroT);
      }
      const ahead = camZ - t.z; // how far in front of the camera the piece hangs
      t.o = ahead < 0.5 ? 0 : smooth((ahead - 0.5) / 1.3);
    });

    // Lean toward whichever side the nearest piece hangs on.
    const i0 = Math.floor(travel), frac = travel - i0;
    const sideOf = (i) => (Math.min(i, n - 1) % 2 === 0 ? -1 : 1);
    const lean = lerp(sideOf(i0), sideOf(i0 + 1), smooth(frac)) * heroT;
    stage.cam.tPos.set(-lean * (portrait ? 0.1 : 0.55), 0.04, camZ);
    stage.cam.tLook.set(lean * sx * 0.78, 0, camZ - viewD);

    // Interface
    heroCopy.style.opacity = String(1 - smooth(U / (HERO * 0.5)));
    heroCopy.style.pointerEvents = U > HERO * 0.4 ? "none" : "";
    const inHall = heroLin > 0.72 && travel < n - 1 + 0.5;
    caption.classList.toggle("is-on", inHall);
    rail.classList.toggle("is-on", inHall);
    railFill.style.transform = `scaleY(${Math.min(1, travel / (n - 1))})`;
    show(Math.min(n - 1, Math.max(0, Math.round(travel))));
  }

  if (!stage.ok) update();

  return {
    update,
    pick: (actor) => go(`product.html?id=${actor.product.id}`),
    label: () => "View"
  };
}
