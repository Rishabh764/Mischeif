/* ==========================================================================
   SLANG STUDIO — Bag storage (browser-only; this is a demo store).
   ========================================================================== */

import { getProduct } from "../data/products.js";

const KEY = "slangstudio_cart_v1";
const listeners = new Set();

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
}

function write(lines) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch (e) {
    // Usually the storage quota: uploaded photos are stored inside custom lines.
    return false;
  }
  listeners.forEach((fn) => fn());
  return true;
}

export const cart = {
  lines: read,
  on(fn) { listeners.add(fn); return () => listeners.delete(fn); },

  add({ id, size, qty }) {
    const lines = read();
    const existing = lines.find((l) => l.type !== "custom" && l.id === id && l.size === size);
    if (existing) existing.qty += qty; else lines.push({ id, size, qty });
    return write(lines);
  },

  /** One-off Studio piece. Never merged: every custom design is unique. */
  addCustom(item) {
    const lines = read();
    lines.push({ type: "custom", lineId: "c" + Date.now().toString(36), ...item });
    return write(lines);
  },

  remove(index) { const lines = read(); lines.splice(index, 1); write(lines); },

  setQty(index, qty) {
    const lines = read();
    if (!lines[index]) return;
    lines[index].qty = Math.max(1, Math.min(10, qty));
    write(lines);
  },

  count: () => read().reduce((n, l) => n + l.qty, 0),

  linePrice(line) {
    if (line.type === "custom") return line.price * line.qty;
    const p = getProduct(line.id);
    return p ? p.price * line.qty : 0;
  },

  subtotal() { return read().reduce((sum, l) => sum + cart.linePrice(l), 0); }
};
