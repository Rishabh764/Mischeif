/* ==========================================================================
   MISCHIEF — About: the manifesto.
   Lines light up as they reach the middle of the screen while the drop
   floats loose in the dark behind the words.
   ========================================================================== */

export default function about({ stage, root }) {
  const lines = [...root.querySelectorAll("[data-line]")];
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => entries.forEach((e) => e.target.classList.toggle("is-lit", e.isIntersecting)),
        { rootMargin: "-30% 0px -30% 0px" })
    : null;
  lines.forEach((l) => (io ? io.observe(l) : l.classList.add("is-lit")));

  // A fixed, repeatable scatter so the room looks the same on every visit.
  const scatter = stage.actors.map((_, i) => {
    const r = (k) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
    return { x: (r(1) - 0.5) * 9, y: (r(2) - 0.5) * 2.2, z: -0.5 - r(3) * 9, ry: r(4) * 6.28, rz: (r(5) - 0.5) * 0.9, speed: 0.04 + r(6) * 0.08 };
  });

  function update() {
    const doc = document.documentElement;
    const p = Math.min(1, window.scrollY / Math.max(1, doc.scrollHeight - window.innerHeight));
    stage.envTarget.corridor = 0;
    stage.envTarget.ring = 0;
    stage.fogTarget = [3, 15];
    stage.heroText = 0;
    stage.actors.forEach((a, i) => {
      const s = scatter[i], t = a.tgt;
      t.x = s.x; t.y = s.y + Math.sin(stage.time * 0.3 + i) * 0.12; t.z = s.z;
      t.ry = s.ry + stage.time * s.speed; t.rx = 0; t.rz = s.rz;
      t.s = 1.1; t.o = 0.8; t.glow = 0.8;
    });
    stage.cam.tPos.set(0, 0.2 - p * 0.6, 6 - p * 7);
    stage.cam.tLook.set(0, -p * 0.4, -8 - p * 7);
  }

  return { update, destroy() { if (io) io.disconnect(); } };
}
