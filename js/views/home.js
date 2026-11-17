/* ==========================================================================
   SLANG STUDIO — Home: walking into the store.
   You arrive in the entrance hall, close to piece 01 hanging under its light
   in front of the "Made for Trouble" banner. Scrolling turns it once and sends
   it back into its place at the head of the aisle while the banner lifts
   away; then you walk the aisle, one piece at a time on alternating sides.
   ========================================================================== */

import { smooth, lerp, SLOT0_Z, GAP } from "../scene/stage.js";
import { formatPrice } from "../data/products.js";

const HERO = 1.3;  // scroll "segments" spent on the hero
const TAIL = 0.75; // walk-out distance after the last piece
const SEG = 92;    // viewport-heights of scroll per segment
const EYE = 0.55;  // camera height: about 1.6 m

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
    const viewD = portrait ? 3.9 : 3.4;            // camera-to-piece distance in the aisle
    const startZ = portrait ? 6.6 : 6.2;           // where you stand in the hall
    const heroZ = startZ - (portrait ? 3.5 : 3.1); // piece 01, close up
    const camZ = lerp(startZ, SLOT0_Z + viewD, heroT) - travel * GAP;

    stage.envTarget.corridor = 1;
    stage.envTarget.ring = 0;
    stage.fogTarget = [30, 95];
    stage.heroText = 1 - smooth(U / (HERO * 0.7));
    stage.heroLight = 1 - smooth((heroLin - 0.75) / 0.25);
    stage.feature = stage.actors[0] || null;

    stage.actors.forEach((a, i) => {
      stage.park(a, i);
      const p = stage.slot(i), t = a.tgt;
      if (i === 0) {
        // Hero: close up in the hall, one full turn, then back into its place.
        const spin = a.setSpin(heroLin * Math.PI * 2);
        t.x = lerp(0, p.x, heroT);
        t.z = lerp(heroZ, p.z, heroT);
        t.y = lerp(-0.08, t.y, heroT);
        t.ry = p.ry * heroT + spin;
        t.cable = heroT < 0.97 ? 1 : 0; // hangs from a ceiling cable until it reaches its rail
      }
      const ahead = camZ - t.z; // how far in front of the camera the piece hangs
      t.o = ahead < 0.4 ? 0 : smooth((ahead - 0.4) / 1.2);
    });

    // Look toward whichever side the nearest piece hangs on; in the hall, at the hero.
    const i0 = Math.floor(travel), frac = travel - i0;
    const sideOf = (i) => (Math.min(i, n - 1) % 2 === 0 ? -1 : 1);
    const lean = lerp(sideOf(i0), sideOf(i0 + 1), smooth(frac)) * heroT;
    const hero = stage.actors[0] ? stage.actors[0].tgt : { x: 0, z: heroZ };
    stage.cam.tPos.set(-lean * (portrait ? 0.12 : 0.5), EYE, camZ);
    const lookAisle = [lean * stage.slotX * 0.8, 0, camZ - viewD];
    stage.cam.tLook.set(lerp(hero.x, lookAisle[0], heroT), lerp(-0.05, lookAisle[1], heroT), lerp(hero.z, lookAisle[2], heroT));

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
