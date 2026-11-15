/* ==========================================================================
   MISCHIEF — 404: the pieces have been knocked loose.
   ========================================================================== */

export default function notfound({ stage, go }) {
  const tumble = stage.actors.map((_, i) => {
    const r = (k) => { const v = Math.sin(i * 39.3468 + k * 11.135) * 24634.6345; return v - Math.floor(v); };
    return { x: (r(1) - 0.5) * 8, y: (r(2) - 0.5) * 2.6, z: -2.5 - r(3) * 9, rz: (r(4) - 0.5) * 2.4, spin: (r(5) - 0.5) * 0.3 };
  });

  function update() {
    stage.envTarget.corridor = 0;
    stage.envTarget.ring = 0;
    stage.fogTarget = [3, 13];
    stage.heroText = 0;
    stage.actors.forEach((a, i) => {
      const s = tumble[i], t = a.tgt;
      t.x = s.x; t.y = s.y; t.z = s.z;
      t.ry = stage.time * s.spin; t.rx = 0; t.rz = s.rz + Math.sin(stage.time * 0.4 + i) * 0.08;
      t.s = 0.95; t.o = 0.6; t.glow = 0.6;
    });
    stage.cam.tPos.set(0, 0.1, 5.5);
    stage.cam.tLook.set(0, 0, -5);
  }

  return {
    update,
    pick: (actor) => go(`product.html?id=${actor.product.id}`),
    label: () => "View"
  };
}
