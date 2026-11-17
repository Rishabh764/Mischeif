/* ==========================================================================
   SLANG STUDIO — 404: the pieces have been knocked loose.
   Somebody knocked the rails over: the drop lies scattered on the floor of the
   entrance hall, hangers and all, seen from above.
   ========================================================================== */

import { FLOOR_Y, ACC_SCALE } from "../scene/stage.js";

export default function notfound({ stage, go }) {
  // A fixed, repeatable scatter so the mess looks the same on every visit.
  const fallen = stage.actors.map((_, i) => {
    const r = (k) => { const v = Math.sin(i * 39.3468 + k * 11.135) * 24634.6345; return v - Math.floor(v); };
    return { x: (r(1) - 0.5) * 6.2, z: 2.2 - r(2) * 6.5, turn: (r(3) - 0.5) * 3.2, faceDown: r(4) > 0.7 };
  });

  function update() {
    stage.envTarget.corridor = 0.4;
    stage.envTarget.ring = 0;
    stage.fogTarget = [30, 95];
    stage.heroText = 0;
    stage.heroLight = 0;
    stage.actors.forEach((a, i) => {
      const s = fallen[i], t = a.tgt;
      // Lying flat on the floor (a garment is about 0.17 thick on each side).
      t.s = a.accessory ? ACC_SCALE : 1;
      t.x = s.x; t.z = s.z;
      t.y = FLOOR_Y + (a.accessory ? 0.2 : 0.19);
      t.rx = s.faceDown ? Math.PI / 2 : -Math.PI / 2; t.ry = 0; t.rz = s.turn;
      t.o = 1; t.stand = 0; t.cable = 0;
    });
    // Looking down at the floor from above, as if you just walked in on it.
    stage.cam.tPos.set(0, 3.0, 6.8);
    stage.cam.tLook.set(0, FLOOR_Y, -0.6);
  }

  return {
    update,
    pick: (actor) => go(`product.html?id=${actor.product.id}`),
    label: () => "View"
  };
}
