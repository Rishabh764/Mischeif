/* ==========================================================================
   SLANG STUDIO — Shared interface: frame (logo / bag / menu), full-screen menu,
   bag panel, toasts, custom cursor, loading intro, footer.
   ========================================================================== */

import { cart } from "./cart.js";
import { getProduct, formatPrice } from "../data/products.js";
import { pieceImage } from "../scene/standins.js";
import { garmentSVG, GARMENT_ZONES, VIEW_ZONES, zoneToPercent } from "../studio/garment-art.js";

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ---------- Frame + menu + bag markup ------------------------------------ */

export function mount() {
  const host = document.createElement("div");
  host.id = "chrome";
  host.innerHTML = `
    <header class="hud" data-ui>
      <a class="hud__logo" href="index.html" aria-label="Slang Studio — showroom">SLANG <span>STUDIO</span></a>
      <div class="hud__right">
        <button class="hud__btn" type="button" data-bag-open>Bag <span class="hud__count" data-bag-count>0</span></button>
        <button class="hud__btn hud__btn--menu" type="button" data-menu-toggle aria-expanded="false" aria-controls="menu">
          <span data-menu-label>Menu</span><i aria-hidden="true"></i>
        </button>
      </div>
    </header>

    <nav class="menu" id="menu" data-ui aria-hidden="true">
      <ul class="menu__list">
        <li><a href="index.html"><span>01</span>Showroom</a></li>
        <li><a href="shop.html"><span>02</span>The Drop</a></li>
        <li><a href="customize.html"><span>03</span>Studio</a></li>
        <li><a href="about.html"><span>04</span>About</a></li>
      </ul>
      <p class="menu__note">Drop 01 — Fall / Winter 2026<br>Demo store. Checkout is simulated.</p>
    </nav>

    <div class="scrim" data-bag-close></div>
    <aside class="bag" data-ui aria-hidden="true" aria-label="Your bag">
      <header class="bag__head">
        <h2>Bag <span data-bag-count>0</span></h2>
        <button class="hud__btn" type="button" data-bag-close>Close</button>
      </header>
      <div class="bag__body" data-bag-body></div>
    </aside>

    <div class="toasts" aria-live="polite"></div>
    <div class="cursor" aria-hidden="true"><span class="cursor__label"></span></div>`;
  document.body.appendChild(host);

  $("[data-menu-toggle]").addEventListener("click", () => toggleMenu());
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-bag-open]")) openBag();
    else if (e.target.closest("[data-bag-close]")) closeBag();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeBag(); toggleMenu(false); } });

  cart.on(renderBag);
  renderBag();
  initCursor();
}

/* ---------- Menu ---------------------------------------------------------- */

export function toggleMenu(force) {
  const open = force ?? !document.body.classList.contains("menu-open");
  document.body.classList.toggle("menu-open", open);
  $("#menu").setAttribute("aria-hidden", String(!open));
  $("[data-menu-toggle]").setAttribute("aria-expanded", String(open));
  $("[data-menu-label]").textContent = open ? "Close" : "Menu";
}

export function markActiveLink(path) {
  const file = path.split("/").pop() || "index.html";
  document.querySelectorAll(".menu__list a").forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === file));
}

/* ---------- Bag ----------------------------------------------------------- */

export function openBag() { document.body.classList.add("bag-open"); $(".bag").setAttribute("aria-hidden", "false"); toggleMenu(false); }
export function closeBag() { document.body.classList.remove("bag-open"); $(".bag").setAttribute("aria-hidden", "true"); }

function customThumb(line) {
  const keys = Object.keys(line.zones || {}).filter((k) => line.zones[k]);
  const view = keys.length && keys.every((k) => VIEW_ZONES.back.includes(k)) ? "back" : "front";
  const art = VIEW_ZONES[view].filter((k) => line.zones && line.zones[k]).map((k) => {
    const p = zoneToPercent(GARMENT_ZONES[line.garment][view][k]);
    const z = line.zones[k];
    return `<img class="mini__art" src="${esc(z.src)}" alt="" style="left:${p.left + p.width / 2}%;top:${p.top + p.height / 2}%;width:${p.width * 0.92}%;transform:translate(-50%,-50%) translate(${z.offsetX}%,${z.offsetY}%) scale(${z.scale}) rotate(${z.rotate}deg)">`;
  }).join("");
  return `<div class="mini">${garmentSVG(line.garment, view, line.mainColor, line.trimColor)}${art}</div>`;
}

function lineHTML(line, i) {
  let thumb, name, meta, href;
  if (line.type === "custom") {
    const zones = Object.keys(line.zones || {}).filter((k) => line.zones[k]).length;
    thumb = customThumb(line);
    name = `Custom ${line.garmentLabel}`;
    meta = `Size ${line.size} · ${zones} print ${zones === 1 ? "zone" : "zones"}`;
    href = "customize.html";
  } else {
    const p = getProduct(line.id);
    if (!p) return "";
    thumb = `<img src="${pieceImage(p)}" alt="">`;
    name = p.name;
    meta = `${p.color.name} · ${line.size === "One Size" ? "One size" : "Size " + line.size}`;
    href = `product.html?id=${p.id}`;
  }
  return `
    <li class="bag-line">
      <a class="bag-line__img" href="${href}" tabindex="-1">${thumb}</a>
      <div class="bag-line__info">
        <a class="bag-line__name" href="${href}">${esc(name)}</a>
        <p class="bag-line__meta">${esc(meta)}</p>
        <div class="bag-line__row">
          <div class="qty">
            <button type="button" data-qty="${i}:-1" aria-label="One fewer">−</button>
            <span>${line.qty}</span>
            <button type="button" data-qty="${i}:1" aria-label="One more">+</button>
          </div>
          <button class="link" type="button" data-remove="${i}">Remove</button>
        </div>
      </div>
      <p class="bag-line__price">${formatPrice(cart.linePrice(line))}</p>
    </li>`;
}

function renderBag() {
  const lines = cart.lines();
  const count = cart.count();
  document.querySelectorAll("[data-bag-count]").forEach((el) => (el.textContent = count));
  const body = $("[data-bag-body]");
  if (!body) return;
  if (!lines.length) {
    body.innerHTML = `
      <div class="bag__empty">
        <p class="display">Nothing<br>in here.</p>
        <p>No trouble caused yet.</p>
        <a class="btn btn--line" href="shop.html" data-bag-close>See the drop</a>
      </div>`;
    return;
  }
  body.innerHTML = `
    <ul class="bag__lines">${lines.map(lineHTML).join("")}</ul>
    <div class="bag__foot">
      <div class="bag__sum"><span>Subtotal</span><strong>${formatPrice(cart.subtotal())}</strong></div>
      <p class="bag__note">Shipping and taxes are worked out at checkout.</p>
      <button class="btn btn--solid" type="button" data-checkout>Checkout</button>
      <p class="bag__note">Demo store — checkout is simulated and no payment is taken.</p>
    </div>`;
  body.querySelectorAll("[data-qty]").forEach((b) => b.addEventListener("click", () => {
    const [i, d] = b.dataset.qty.split(":").map(Number);
    cart.setQty(i, cart.lines()[i].qty + d);
  }));
  body.querySelectorAll("[data-remove]").forEach((b) => b.addEventListener("click", () => cart.remove(Number(b.dataset.remove))));
  $("[data-checkout]", body).addEventListener("click", () => toast("Checkout is simulated in this demo. No order was placed."));
}

/* ---------- Toast --------------------------------------------------------- */

export function toast(message) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  $(".toasts").appendChild(el);
  requestAnimationFrame(() => el.classList.add("is-in"));
  setTimeout(() => { el.classList.remove("is-in"); setTimeout(() => el.remove(), 400); }, 2800);
}

/* ---------- Cursor (mouse only) ------------------------------------------- */

let cursorEl = null, cursorLabel = "";

function initCursor() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  cursorEl = $(".cursor");
  document.documentElement.classList.add("has-cursor");
  let x = -100, y = -100, cx = x, cy = y;
  window.addEventListener("pointermove", (e) => {
    x = e.clientX; y = e.clientY;
    const hot = e.target.closest && e.target.closest("a, button, input, label, select, [data-hot]");
    cursorEl.classList.toggle("is-hot", !!hot);
  }, { passive: true });
  document.addEventListener("pointerleave", () => cursorEl.classList.add("is-out"));
  document.addEventListener("pointerenter", () => cursorEl.classList.remove("is-out"));
  const loop = () => {
    cx += (x - cx) * 0.28; cy += (y - cy) * 0.28;
    cursorEl.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(loop);
  };
  loop();
}

/** Label shown inside the cursor while it is over a piece ("View", "Turn"…). */
export function setCursorLabel(label) {
  if (!cursorEl || label === cursorLabel) return;
  cursorLabel = label;
  cursorEl.classList.toggle("is-piece", !!label);
  if (label) $(".cursor__label", cursorEl).textContent = label;
}

/* ---------- Loading intro -------------------------------------------------- */

export const loader = {
  value: 0, shown: 0, raf: 0,
  set(p) { this.value = Math.max(this.value, p); if (!this.raf) this.tick(); },
  tick() {
    const el = $(".loader__count");
    let last = performance.now();
    // Advance by elapsed time, not per frame: a background tab only gets about
    // one frame a second, and the intro must not take a minute there.
    const step = (now) => {
      const dt = Math.max(0, (now - last) / 1000);
      last = now;
      this.shown += Math.max(dt * 0.25, (this.value - this.shown) * (1 - Math.exp(-dt * 5)));
      if (this.shown > this.value) this.shown = this.value;
      if (el) el.textContent = String(Math.round(this.shown * 100)).padStart(3, "0");
      const bar = $(".loader__bar i");
      if (bar) bar.style.transform = `scaleX(${this.shown})`;
      this.raf = this.shown < 1 ? requestAnimationFrame(step) : 0;
      if (this.shown >= 1 && this.resolve) this.resolve();
    };
    this.raf = requestAnimationFrame(step);
  },
  /** Resolves once the counter has visibly reached 100, then lifts the curtain. */
  finish() {
    return new Promise((resolve) => {
      let done = false;
      this.resolve = () => {
        if (done) return;
        done = true;
        document.documentElement.classList.add("is-ready");
        setTimeout(() => { const l = $("#loader"); if (l) l.remove(); }, 1400);
        resolve();
      };
      this.set(1);
      setTimeout(() => this.resolve(), 2500); // never wait on animation frames alone
    });
  }
};

/* ---------- Shared fragments ----------------------------------------------- */

export function footerHTML() {
  return `
    <div class="footer__top">
      <a class="footer__logo" href="index.html">SLANG <span>STUDIO</span></a>
      <form class="notify" data-notify novalidate>
        <label for="notify-email">Get told about the next drop</label>
        <div class="notify__row">
          <input id="notify-email" type="email" required placeholder="you@example.com" autocomplete="email">
          <button type="submit">Notify me</button>
        </div>
      </form>
    </div>
    <div class="footer__bottom">
      <ul class="footer__links">
        <li><a href="shop.html">The Drop</a></li>
        <li><a href="customize.html">Studio</a></li>
        <li><a href="about.html">About</a></li>
      </ul>
      <p>© ${new Date().getFullYear()} Slang Studio. Demo store — not a real checkout.</p>
    </div>`;
}

export function initFooter(root) {
  const footer = $("[data-footer]", root);
  if (!footer) return;
  footer.innerHTML = footerHTML();
  $("[data-notify]", footer).addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("input", e.currentTarget);
    if (!input.value.trim() || !input.checkValidity()) { toast("Enter a valid email address."); return; }
    toast("Noted. You'll hear about the next drop.");
    e.currentTarget.reset();
  });
}

/** Plain list of pieces: read by screen readers, and the whole shop when 3D is unavailable. */
export function pieceListHTML(products) {
  return products.map((p) => `
    <li>
      <a href="product.html?id=${p.id}">
        <img src="${pieceImage(p)}" alt="" loading="lazy" width="400" height="500">
        <span class="piece-list__no">${p.no}</span>
        <span class="piece-list__name">${esc(p.name)}</span>
        <span class="piece-list__price">${formatPrice(p.price)}</span>
      </a>
    </li>`).join("");
}
