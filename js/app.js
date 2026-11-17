/* ==========================================================================
   SLANG STUDIO — App entry.
   Boots the showroom, then swaps page content in place (so the 3D scene never
   reloads) while keeping every page a real, shareable address.
   ========================================================================== */

import { PRODUCTS } from "./data/products.js";
import { Stage, createNullStage, webglSupported } from "./scene/stage.js";
import * as ui from "./core/ui.js";
import home from "./views/home.js";
import shop from "./views/shop.js";
import product from "./views/product.js";
import studio from "./views/studio.js";
import about from "./views/about.js";
import notfound from "./views/notfound.js";

const VIEWS = { home, shop, product, studio, about, notfound };
const UI_SELECTOR = "a, button, input, select, textarea, label, [data-ui]";

const main = document.getElementById("view");
let stage, current = null, busy = false;

function createStage() {
  if (webglSupported()) {
    try { return new Stage(document.getElementById("stage")); } catch (e) { console.warn("3D unavailable:", e); }
  }
  return createNullStage(PRODUCTS);
}

/* ---------- Views --------------------------------------------------------- */

function enter() {
  const name = main.dataset.view in VIEWS ? main.dataset.view : "notfound";
  document.body.dataset.view = name;
  current = VIEWS[name]({ stage, root: main, products: PRODUCTS, go, ui }) || {};
  stage.setView(current);
  stage.setHover(null);
  ui.setCursorLabel("");
  ui.initFooter(main);
  ui.markActiveLink(location.pathname);
}

async function go(url, { push = true, force = false } = {}) {
  const target = new URL(url, location.href);
  ui.toggleMenu(false);
  ui.closeBag();
  if (!force && target.pathname === location.pathname && target.search === location.search) return;
  if (busy) return;
  busy = true;
  main.classList.add("is-leaving");
  try {
    const [html] = await Promise.all([
      fetch(target, { headers: { "X-Requested-With": "showroom" } }).then((r) => r.text()),
      new Promise((r) => setTimeout(r, 420))
    ]);
    const doc = new DOMParser().parseFromString(html, "text/html");
    const next = doc.getElementById("view");
    if (!next) throw new Error("No view in " + target.pathname);
    if (current && current.destroy) current.destroy();
    if (push) history.pushState({}, "", target);
    document.title = doc.title;
    main.innerHTML = next.innerHTML;
    main.dataset.view = next.dataset.view;
    window.scrollTo(0, 0);
    enter();
    requestAnimationFrame(() => requestAnimationFrame(() => main.classList.remove("is-leaving")));
  } catch (e) {
    location.href = target.href; // fall back to a normal page load
  } finally {
    busy = false;
  }
}

/* ---------- Global input --------------------------------------------------- */

function bindLinks() {
  document.addEventListener("click", (e) => {
    const a = /** @type {HTMLAnchorElement | null} */ (e.target instanceof Element ? e.target.closest("a[href]") : null);
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target || a.hasAttribute("download")) return;
    const url = new URL(a.getAttribute("href"), location.href);
    if (url.origin !== location.origin || (url.hash && url.pathname === location.pathname)) return;
    e.preventDefault();
    go(url.href);
  });
  window.addEventListener("popstate", () => go(location.href, { push: false, force: true }));
}

function bindPicking() {
  // Clicks that land on empty space (not on interface) are aimed at the 3D room.
  let downX = 0, downY = 0;
  window.addEventListener("pointerdown", (e) => { downX = e.clientX; downY = e.clientY; }, { passive: true });
  window.addEventListener("click", (e) => {
    if ((e.target instanceof Element && e.target.closest(UI_SELECTOR)) || !current || !current.pick) return;
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 8) return; // that was a drag
    const actor = stage.pick(e.clientX, e.clientY);
    if (actor) current.pick(actor);
  });

  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  let queued = false, last = null;
  window.addEventListener("pointermove", (e) => {
    last = e;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const overUi = last.target.closest && last.target.closest(UI_SELECTOR);
      const actor = overUi || !current || !current.pick ? null : stage.pick(last.clientX, last.clientY);
      const label = actor && current.label ? current.label(actor) : "";
      stage.setHover(label ? actor : null);
      ui.setCursorLabel(label || "");
    });
  }, { passive: true });
}

/* ---------- Boot ----------------------------------------------------------- */

async function boot() {
  ui.mount();
  stage = createStage();
  document.documentElement.classList.add(stage.ok ? "webgl" : "no-webgl");
  bindLinks();
  bindPicking();

  ui.loader.set(0.08);
  await stage.build(PRODUCTS, (p) => ui.loader.set(0.08 + p * 0.82));
  if (document.fonts && document.fonts.ready) await document.fonts.ready;

  enter();
  stage.start();
  await ui.loader.finish();
  if (location.hash === "#bag") ui.openBag(); // old cart.html links land here
}

boot();
