/* ==========================================================================
   SLANG STUDIO — About: the manifesto.
   Lines light up as they reach the middle of the screen while you walk slowly
   down the aisle behind the words.
   ========================================================================== */

export default function about({ stage, root }) {
  const lines = [...root.querySelectorAll("[data-line]")];
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => entries.forEach((e) => e.target.classList.toggle("is-lit", e.isIntersecting)),
        { rootMargin: "-30% 0px -30% 0px" })
    : null;
  lines.forEach((l) => (io ? io.observe(l) : l.classList.add("is-lit")));

  function update() {
    const doc = document.documentElement;
    const p = Math.min(1, window.scrollY / Math.max(1, doc.scrollHeight - window.innerHeight));
    stage.envTarget.corridor = 1;
    stage.envTarget.ring = 0;
    stage.fogTarget = [30, 95];
    stage.heroText = 0;
    stage.heroLight = 0;
    stage.actors.forEach((a, i) => stage.park(a, i));
    // A slow walk from the hall down the middle of the aisle.
    const z = 6 - p * 34;
    stage.cam.tPos.set(Math.sin(p * 5) * 0.25, 0.55, z);
    stage.cam.tLook.set(Math.sin(p * 5 + 0.6) * 0.5, 0.05, z - 7);
  }

  return { update, destroy() { if (io) io.disconnect(); } };
}
