/* ==========================================================================
   MISCHEIF — Lightweight 3D pointer-tilt for cards & visuals
   Adds real depth (rotateX/rotateY + dynamic shadow) on mouse move,
   no external libs. Respects reduced-motion and touch devices.
   ========================================================================== */

function applyTilt(el, opts = {}) {
  const max = opts.max ?? 8;
  const scale = opts.scale ?? 1.02;

  let frame = null;

  function onMove(e) {
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height; // 0..1
    const rx = (0.5 - py) * max * 2;
    const ry = (px - 0.5) * max * 2;

    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(${scale},${scale},${scale})`;
      const glow = el.querySelector("[data-tilt-glow]");
      if (glow) glow.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.16), transparent 55%)`;
    });
  }

  function onLeave() {
    el.style.transform = "";
    el.classList.remove("tilting");
    const glow = el.querySelector("[data-tilt-glow]");
    if (glow) glow.style.background = "";
  }

  function onEnter() {
    el.classList.add("tilting");
  }

  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerenter", onEnter);
  el.addEventListener("pointerleave", onLeave);
}

function initTilt(root = document) {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  if (prefersReduced || isCoarsePointer) return;

  root.querySelectorAll("[data-tilt]:not([data-tilt-bound])").forEach((el) => {
    el.setAttribute("data-tilt-bound", "true");
    const max = parseFloat(el.getAttribute("data-tilt")) || 8;
    applyTilt(el, { max });
  });
}

document.addEventListener("DOMContentLoaded", () => initTilt());
